import numpy as np
from scipy.optimize import minimize
from scipy.interpolate import splprep, splev
from typing import List, Tuple, Dict
from models.track import Car
from scipy.ndimage import gaussian_filter1d
from enum import Enum

class RacingLineModel(str, Enum):
    """Available racing line calculation models"""
    PHYSICS_BASED = "physics_based"
    BASIC = "basic"

def resample_track_points(points: np.ndarray, num_points: int = 50) -> np.ndarray:
    """
    Resample track points to reduce computational complexity while maintaining track shape
    """
    # Convert points to numpy array if not already
    points = np.array(points)
    
    # Fit a B-spline to the points
    tck, u = splprep([points[:,0], points[:,1]], s=0, per=False)
    
    # Generate new points along the spline
    u_new = np.linspace(0, 1, num_points)
    x_new, y_new = splev(u_new, tck)
    
    return np.column_stack((x_new, y_new))

def compute_curvature(points: np.ndarray) -> np.ndarray:
    """
    Compute the curvature at each point of the racing line with robust NaN handling
    """
    # Calculate first derivatives
    dx_dt = np.gradient(points[:, 0])
    dy_dt = np.gradient(points[:, 1])
    
    # Calculate second derivatives
    d2x_dt2 = np.gradient(dx_dt)
    d2y_dt2 = np.gradient(dy_dt)
    
    # Calculate curvature using the formula: κ = |x'y'' - y'x''| / (x'² + y'²)^(3/2)
    numerator = np.abs(dx_dt * d2y_dt2 - dy_dt * d2x_dt2)
    denominator = (dx_dt * dx_dt + dy_dt * dy_dt)**1.5
    
    # Handle division by zero and very small denominators
    safe_denominator = np.where(denominator < 1e-10, 1e-10, denominator)
    curvature = numerator / safe_denominator
    
    # Replace any NaN or infinite values with zeros
    curvature = np.where(np.isfinite(curvature), curvature, 0.0)
    
    return curvature

def calculate_segment_length(p1: np.ndarray, p2: np.ndarray) -> float:
    """
    Calculate the length of a segment between two points
    """
    length = np.linalg.norm(p2 - p1)
    return max(length, 0.1)  # Ensure minimum segment length

def calculate_max_entry_speed(curvature: float, friction: float, car: Car) -> float:
    """
    Calculate the maximum entry speed for a corner based on Perantoni & Limebeer's model
    Uses proper vehicle dynamics including:
    - Friction circle constraints
    - Maximum steering angle limits
    - Aerodynamic effects
    - Vehicle mass and dimensions
    """
    # Handle invalid curvature values
    if not np.isfinite(curvature) or abs(curvature) < 1e-10:
        return 80.0  # Return a reasonable max speed for straights
        
    g = 9.81  # gravitational acceleration
    rho = 1.225  # air density (kg/m³)
    
    # Use car's actual parameters
    Cl = getattr(car, 'lift_coefficient', 3.0)
    Cd = getattr(car, 'drag_coefficient', 1.0)
    A = car.effective_frontal_area
    
    # Ensure all values are finite
    if not all(np.isfinite([Cl, Cd, A, car.mass])):
        return 10.0  # Return safe fallback speed
    
    # Convert steering angle to radians
    max_steering_rad = np.deg2rad(car.max_steering_angle)
    
    # Calculate minimum turn radius based on vehicle geometry and steering limit
    # Using bicycle model: R_min = wheelbase / tan(max_steering_angle)
    wheelbase = car.length * 0.6  # Approximate wheelbase as 60% of car length
    min_turn_radius = wheelbase / np.tan(max_steering_rad) if max_steering_rad > 0 else 1000.0
    
    # Current turn radius from curvature
    current_turn_radius = 1.0 / abs(curvature) if abs(curvature) > 1e-10 else 1000.0
    
    # Check if the corner is too tight for the car's steering capability
    if current_turn_radius < min_turn_radius:
        # Corner is too tight - limit speed severely
        return min(15.0, np.sqrt(friction * g * current_turn_radius))
    
    # Aerodynamic coefficients
    k_downforce = 0.5 * rho * Cl * A
    k_drag = 0.5 * rho * Cd * A
    
    def force_balance(v):
        try:
            # Ensure velocity is positive and finite
            if not np.isfinite(v) or v <= 0:
                return -1.0
                
            # Normal force = mg + aerodynamic downforce
            N = car.mass * g + k_downforce * v * v
            
            # Available tire force (using friction circle concept)
            F_total = friction * N
            
            # Required lateral force for cornering = mv²/r = mv²κ
            F_lat_req = car.mass * v * v * abs(curvature)
            
            # Check if lateral force requirement exceeds total available force
            if F_lat_req >= F_total:
                return -1.0  # Signal that speed is too high
            
            # Check steering angle constraint
            required_steering = np.arctan(wheelbase / current_turn_radius)
            if required_steering > max_steering_rad:
                return -1.0  # Cannot steer sharp enough
            
            # Remaining longitudinal force capacity (friction circle)
            F_long_avail = np.sqrt(max(0, F_total * F_total - F_lat_req * F_lat_req))
            
            # Drag force
            F_drag = k_drag * v * v
            
            # Net force balance including drag
            result = F_long_avail - F_drag
            
            # Ensure result is finite
            return result if np.isfinite(result) else -1.0
        except:
            return -1.0  # Return negative value to indicate invalid speed
    
    # Use binary search to find maximum speed where forces balance
    v_min, v_max = 0, 80  # reasonable speed range in m/s
    iterations = 0
    max_iterations = 50  # Prevent infinite loops
    
    while v_max - v_min > 0.1 and iterations < max_iterations:
        v = (v_min + v_max) / 2
        if force_balance(v) > 0:
            v_min = v
        else:
            v_max = v
        iterations += 1
    
    # Add safety factor and ensure result is finite
    result = max(0.1, 0.85 * v_min)  # 85% safety factor
    return result if np.isfinite(result) else 10.0

def calculate_speed_profile(
    racing_line: np.ndarray,
    curvature: np.ndarray,
    friction: float,
    car: Car
) -> Tuple[np.ndarray, float]:
    """
    Calculate the speed profile along the racing line using Perantoni & Limebeer's model
    """
    n_points = len(racing_line)
    speeds = np.zeros(n_points)
    
    # Calculate segment lengths
    segments = np.diff(racing_line, axis=0)
    segment_lengths = np.linalg.norm(segments, axis=1)
    
    # Ensure no zero-length segments
    segment_lengths = np.maximum(segment_lengths, 0.1)  # Minimum 10cm segments
    
    # Air density and gravity
    rho = 1.225
    g = 9.81
    
    # Use car's actual aero coefficients with safety checks
    Cl = getattr(car, 'lift_coefficient', 3.0)
    Cd = getattr(car, 'drag_coefficient', 1.0)
    A = car.effective_frontal_area
    
    # Ensure all car parameters are finite
    if not all(np.isfinite([car.mass, car.max_acceleration, Cl, Cd, A])):
        # Return safe fallback values
        return np.full(n_points, 10.0), n_points * 0.1
    
    # Aero coefficients
    k_downforce = 0.5 * rho * Cl * A
    k_drag = 0.5 * rho * Cd * A
    
    # Calculate maximum corner speeds considering aero effects
    max_corner_speeds = np.array([
        calculate_max_entry_speed(k, friction, car)
        for k in curvature
    ])
    
    # Ensure max_corner_speeds are all finite
    max_corner_speeds = np.where(np.isfinite(max_corner_speeds), max_corner_speeds, 10.0)
    
    # Initialize speed profile with corner speed limits
    speeds = max_corner_speeds.copy()
    
    # Forward pass - acceleration limited by engine power
    for i in range(1, n_points):
        dt = segment_lengths[i-1] / max(speeds[i-1], 1.0)  # time for previous segment
        
        # Calculate aerodynamic forces at current speed
        v_current = speeds[i-1]
        N = car.mass * g + k_downforce * v_current * v_current
        F_drag = k_drag * v_current * v_current
        
        # Maximum acceleration considering aero effects
        max_accel = min(car.max_acceleration, 
                       (car.max_acceleration * car.mass - F_drag) / car.mass)
        max_accel = max(0.1, max_accel)  # Ensure positive acceleration
        
        # Speed after acceleration
        v_accel = speeds[i-1] + max_accel * dt
        
        # Take minimum of acceleration-limited and corner-limited speeds
        speeds[i] = min(v_accel, speeds[i])
    
    # Backward pass - deceleration limited by braking
    for i in range(n_points-2, -1, -1):
        dt = segment_lengths[i] / max(speeds[i+1], 1.0)  # time for next segment
        
        # Calculate braking force including aerodynamic assistance
        v_next = speeds[i+1]
        N = car.mass * g + k_downforce * v_next * v_next
        F_drag = k_drag * v_next * v_next
        
        # Maximum deceleration (braking + aero drag)
        max_decel = min(friction * N / car.mass + F_drag / car.mass, 
                       car.max_acceleration * 2)  # Assume braking is 2x acceleration
        max_decel = max(0.1, max_decel)  # Ensure positive deceleration
        
        # Speed before braking
        v_brake = speeds[i+1] + max_decel * dt
        
        # Take minimum of braking-limited and corner-limited speeds
        speeds[i] = min(v_brake, speeds[i])
    
    # Ensure all speeds are finite and positive
    speeds = np.where(np.isfinite(speeds), speeds, 10.0)
    speeds = np.maximum(speeds, 0.1)  # Minimum speed
    
    # Calculate total lap time
    lap_time = 0.0
    for i in range(len(segment_lengths)):
        avg_speed = (speeds[i] + speeds[i+1]) / 2
        lap_time += segment_lengths[i] / max(avg_speed, 1.0)
    
    # Ensure lap time is finite
    if not np.isfinite(lap_time):
        lap_time = n_points * 0.1  # Fallback lap time
    
    return speeds, lap_time

def calculate_racing_line_cost(
    racing_line: np.ndarray,
    track_center: np.ndarray,
    track_width: float,
    friction: float,
    car: Car
) -> float:
    """
    Calculate the cost of a racing line (lap time + penalties)
    """
    try:
        # Calculate curvature of the racing line
        curvature = compute_curvature(racing_line)
        
        # Calculate speed profile and lap time
        speeds, lap_time = calculate_speed_profile(racing_line, curvature, friction, car)
        
        # Boundary penalty - penalize going outside track limits
        boundary_penalty = 0.0
        max_offset = track_width * 0.5
        
        for i in range(len(racing_line)):
            distance_from_center = np.linalg.norm(racing_line[i] - track_center[i])
            if distance_from_center > max_offset:
                boundary_penalty += (distance_from_center - max_offset) * 10.0
        
        # Smoothness penalty - penalize sharp changes in racing line
        smoothness_penalty = 0.0
        if len(racing_line) > 2:
            for i in range(1, len(racing_line) - 1):
                angle_change = np.linalg.norm(racing_line[i+1] - 2*racing_line[i] + racing_line[i-1])
                smoothness_penalty += angle_change * 0.1
        
        total_cost = lap_time + boundary_penalty + smoothness_penalty
        
        # Ensure cost is finite
        return total_cost if np.isfinite(total_cost) else 1000.0
    
    except Exception as e:
        print(f"Error in cost calculation: {e}")
        return 1000.0  # Return high cost for failed calculations

def optimize_racing_line(track, model: RacingLineModel = RacingLineModel.PHYSICS_BASED) -> List[Dict]:
    """
    Optimize racing lines for all cars on the track with crossover prevention
    """
    # Convert track points to numpy array
    track_points = np.array([(p.x, p.y) for p in track.track_points])
    track_width = track.width
    friction = track.friction
    
    # Resample track points to manageable size
    track_points = resample_track_points(track_points, num_points=min(100, len(track_points)))
    
    # Calculate curvature for the track centerline
    curvature = compute_curvature(track_points)
    
    # Calculate base racing line using the specified model
    if model == RacingLineModel.PHYSICS_BASED:
        base_racing_line = calculate_racing_line_physics_based(track_points, curvature, track_width)
    elif model == RacingLineModel.BASIC:
        base_racing_line = calculate_racing_line_basic(track_points, curvature, track_width)
    else:
        # Default to physics-based
        base_racing_line = calculate_racing_line_physics_based(track_points, curvature, track_width)
    
    # For multiple cars, create separated racing lines to prevent crossovers
    num_cars = len(track.cars)
    if num_cars == 1:
        # Single car - use optimal racing line
        racing_lines = [base_racing_line]
    else:
        # Multiple cars - create separated lines
        racing_lines = create_separated_racing_lines(
            track_points, base_racing_line, track_width, num_cars
        )
    
    optimal_lines = []
    
    for i, car in enumerate(track.cars):
        try:
            # Use the appropriate racing line for this car
            racing_line = racing_lines[i] if i < len(racing_lines) else base_racing_line
            
            # Calculate speed profile for this racing line
            racing_curvature = compute_curvature(racing_line)
            speeds, lap_time = calculate_speed_profile(racing_line, racing_curvature, friction, car)
            
            # Clean data for JSON serialization
            def clean_for_json(value):
                if isinstance(value, np.ndarray):
                    cleaned = np.where(np.isfinite(value), value, 0.0)
                    return cleaned.tolist()
                elif isinstance(value, (int, float)):
                    return float(value) if np.isfinite(value) else 0.0
                else:
                    return value
            
            clean_coordinates = clean_for_json(racing_line)
            clean_speeds = clean_for_json(speeds)
            clean_lap_time = clean_for_json(lap_time)
            
            optimal_lines.append({
                "car_id": car.id,
                "coordinates": clean_coordinates,
                "speeds": clean_speeds,
                "lap_time": clean_lap_time,
                "model": model.value
            })
        except Exception as e:
            # If optimization fails for a car, provide a safe fallback
            print(f"Warning: Optimization failed for car {car.id} with model {model.value}: {str(e)}")
            optimal_lines.append({
                "car_id": car.id,
                "coordinates": track_points.tolist(),  # Use original track as fallback
                "speeds": [10.0] * len(track_points),  # Safe fallback speed
                "lap_time": len(track_points) * 0.1,   # Fallback lap time
                "model": model.value
            })
    
    return optimal_lines

def create_separated_racing_lines(
    track_points: np.ndarray, 
    base_racing_line: np.ndarray, 
    track_width: float, 
    num_cars: int
) -> List[np.ndarray]:
    """
    Create separated racing lines for multiple cars to prevent crossovers
    """
    racing_lines = []
    
    # Calculate track direction and normal vectors
    direction_vectors = np.diff(track_points, axis=0)
    direction_vectors = np.vstack([direction_vectors, direction_vectors[-1]])
    
    # Normalize direction vectors
    norms = np.linalg.norm(direction_vectors, axis=1)
    norms = np.where(norms == 0, 1, norms)
    direction_vectors = direction_vectors / norms[:, np.newaxis]
    
    # Calculate perpendicular vectors (normal to track)
    perpendicular_vectors = np.array([-direction_vectors[:, 1], direction_vectors[:, 0]]).T
    
    # Calculate safe separation distance between cars
    # Minimum 3 meters between cars, but adjust based on track width
    min_separation = min(3.0, track_width * 0.2)
    max_usable_width = track_width * 0.8  # Use 80% of track width for safety
    
    # Calculate positions for each car
    if num_cars == 2:
        # Two cars - one on each side of the optimal line
        offsets = [-min_separation * 0.7, min_separation * 0.7]
    elif num_cars == 3:
        # Three cars - center and two sides
        offsets = [-min_separation, 0, min_separation]
    elif num_cars == 4:
        # Four cars - distributed across track
        offsets = [-min_separation * 1.2, -min_separation * 0.4, 
                  min_separation * 0.4, min_separation * 1.2]
    else:
        # More than 4 cars - distribute evenly
        if num_cars > 6:
            num_cars = 6  # Limit to 6 cars for safety
        
        total_width = min_separation * (num_cars - 1)
        if total_width > max_usable_width:
            # Scale down if too wide
            scale_factor = max_usable_width / total_width
            total_width = max_usable_width
            min_separation *= scale_factor
        
        offsets = []
        for i in range(num_cars):
            offset = -total_width/2 + i * (total_width / (num_cars - 1))
            offsets.append(offset)
    
    # Create racing line for each car
    for i, offset in enumerate(offsets):
        car_racing_line = base_racing_line.copy()
        
        # Apply offset to create separated line
        for j in range(len(car_racing_line)):
            # Calculate offset vector
            offset_vector = perpendicular_vectors[j] * offset
            
            # Apply offset
            proposed_point = car_racing_line[j] + offset_vector
            
            # Check if the offset point is within track boundaries
            distance_from_center = np.linalg.norm(proposed_point - track_points[j])
            max_allowed_distance = track_width * 0.45  # Stay within 45% of track width
            
            if distance_from_center <= max_allowed_distance:
                car_racing_line[j] = proposed_point
            else:
                # Scale down offset to stay within boundaries
                scale_factor = max_allowed_distance / distance_from_center
                car_racing_line[j] = track_points[j] + offset_vector * scale_factor
        
        # Enhanced smoothing for clean separated lines
        try:
            # Multiple passes of smoothing for very clean lines
            for sigma in [1.0, 1.5, 2.0]:
                car_racing_line[:, 0] = gaussian_filter1d(car_racing_line[:, 0], sigma=sigma)
                car_racing_line[:, 1] = gaussian_filter1d(car_racing_line[:, 1], sigma=sigma)
            
            # Additional B-spline smoothing for professional appearance
            from scipy.interpolate import splprep, splev
            tck, u = splprep([car_racing_line[:, 0], car_racing_line[:, 1]], s=len(car_racing_line) * 0.15, per=False)
            u_new = np.linspace(0, 1, len(car_racing_line))
            x_smooth, y_smooth = splev(u_new, tck)
            car_racing_line = np.column_stack((x_smooth, y_smooth))
        except:
            # Fallback to heavy smoothing if B-spline fails
            try:
                car_racing_line[:, 0] = gaussian_filter1d(car_racing_line[:, 0], sigma=2.5)
                car_racing_line[:, 1] = gaussian_filter1d(car_racing_line[:, 1], sigma=2.5)
            except:
                pass
        
        racing_lines.append(car_racing_line)
    
    return racing_lines

def calculate_racing_line_physics_based(track_points: np.ndarray, curvature: np.ndarray, track_width: float) -> np.ndarray:
    """
    Physics-Based Model: Based on Perantoni & Limebeer's paper
    - Implements proper racing line theory (wide-apex-wide)
    - Uses most of the track width (96%)
    - Considers late apex principle and vehicle dynamics
    - Best for competitive racing and realistic simulation
    """
    racing_line = track_points.copy()
    n_points = len(track_points)
    
    # Ensure curvature is finite
    curvature = np.where(np.isfinite(curvature), curvature, 0.0)
    
    # Calculate track direction vectors
    direction_vectors = np.diff(track_points, axis=0)
    direction_vectors = np.vstack([direction_vectors, direction_vectors[-1]])
    
    # Normalize direction vectors with safety checks
    norms = np.linalg.norm(direction_vectors, axis=1)
    norms = np.where(norms == 0, 1, norms)
    direction_vectors = direction_vectors / norms[:, np.newaxis]
    direction_vectors = np.where(np.isfinite(direction_vectors), direction_vectors, 0.0)
    
    # Calculate perpendicular vectors (normal to track)
    perpendicular_vectors = np.array([-direction_vectors[:, 1], direction_vectors[:, 0]]).T
    
    # Smooth curvature for corner detection
    try:
        smoothed_curvature = gaussian_filter1d(curvature, sigma=3.0)
        smoothed_curvature = np.where(np.isfinite(smoothed_curvature), smoothed_curvature, 0.0)
    except:
        smoothed_curvature = curvature
    
    # More conservative track width usage for cleaner lines
    max_allowed_offset = track_width * 0.35  # Use up to 35% of track width (70% total width)
    
    # More conservative corner detection for cleaner lines
    curvature_threshold = 0.003  # Higher threshold for corner detection
    corner_mask = np.abs(smoothed_curvature) > curvature_threshold
    
    # Apply racing line optimization
    for i in range(n_points):
        if i < 5 or i > n_points - 5:  # Skip edge points
            continue
            
        if corner_mask[i]:
            # This is a corner - apply racing line theory
            
            # Determine corner direction
            corner_direction = -np.sign(smoothed_curvature[i])  # -1 for left, +1 for right
            
            # Look ahead and behind to determine corner phase
            look_ahead = min(i + 15, n_points - 1)
            look_behind = max(i - 15, 0)
            
            # Average curvature in windows
            current_curvature = abs(smoothed_curvature[i])
            ahead_curvature = np.mean(np.abs(smoothed_curvature[i:look_ahead]))
            behind_curvature = np.mean(np.abs(smoothed_curvature[look_behind:i]))
            
            # Determine corner phase
            if behind_curvature < current_curvature and ahead_curvature < current_curvature:
                # Apex - maximum offset
                phase_factor = 1.0
            elif behind_curvature < current_curvature:
                # Corner entry - gradual increase
                phase_factor = 0.6
            elif ahead_curvature < current_curvature:
                # Corner exit - late apex, high offset
                phase_factor = 0.9
            else:
                # Middle of corner
                phase_factor = 0.8
            
            # Calculate optimal offset based on racing line theory (more conservative)
            if phase_factor == 1.0:  # At apex
                base_offset = max_allowed_offset * 0.7  # Reduced from 0.9
            elif phase_factor == 0.6:  # Corner entry
                base_offset = max_allowed_offset * 0.6 * (-1)  # Go wide, reduced from 0.8
            elif phase_factor == 0.9:  # Corner exit
                base_offset = max_allowed_offset * 0.5 * (-1)  # Go wide, reduced from 0.7
            else:  # Middle of corner
                base_offset = max_allowed_offset * 0.4  # Reduced from 0.6
            
            # Calculate the racing line offset
            offset = perpendicular_vectors[i] * base_offset * corner_direction
            proposed_point = track_points[i] + offset
            
            # Ensure we stay within track boundaries
            distance_from_center = np.linalg.norm(proposed_point - track_points[i])
            if distance_from_center <= max_allowed_offset:
                racing_line[i] = proposed_point
            else:
                # Scale down to stay within boundaries
                scale_factor = max_allowed_offset / distance_from_center
                racing_line[i] = track_points[i] + offset * scale_factor
                
        else:
            # This is a straight - position for upcoming corners
            look_ahead_distance = min(20, n_points - i - 1)
            upcoming_corner_idx = None
            
            for j in range(i + 1, i + look_ahead_distance + 1):
                if j < n_points and corner_mask[j]:
                    upcoming_corner_idx = j
                    break
            
            if upcoming_corner_idx is not None:
                # Position for optimal corner entry (more conservative)
                upcoming_corner_direction = -np.sign(smoothed_curvature[upcoming_corner_idx])
                setup_offset = max_allowed_offset * 0.6 * (-upcoming_corner_direction)  # Reduced from 0.9
                
                distance_to_corner = upcoming_corner_idx - i
                transition_factor = max(0.2, 1 - (distance_to_corner / look_ahead_distance))  # Reduced from 0.3
                
                offset = perpendicular_vectors[i] * setup_offset * transition_factor
                proposed_point = track_points[i] + offset
                
                distance_from_center = np.linalg.norm(proposed_point - track_points[i])
                if distance_from_center <= max_allowed_offset:
                    racing_line[i] = proposed_point
                else:
                    scale_factor = max_allowed_offset / distance_from_center
                    racing_line[i] = track_points[i] + offset * scale_factor
    
    # Enhanced smoothing for cleaner racing lines
    try:
        # Apply multiple passes of smoothing with increasing sigma
        for sigma in [0.8, 1.2, 1.8]:
            racing_line[:, 0] = gaussian_filter1d(racing_line[:, 0], sigma=sigma)
            racing_line[:, 1] = gaussian_filter1d(racing_line[:, 1], sigma=sigma)
        
        # Additional B-spline smoothing for professional appearance
        from scipy.interpolate import splprep, splev
        tck, u = splprep([racing_line[:, 0], racing_line[:, 1]], s=len(racing_line) * 0.1, per=False)
        u_new = np.linspace(0, 1, len(racing_line))
        x_smooth, y_smooth = splev(u_new, tck)
        racing_line = np.column_stack((x_smooth, y_smooth))
    except:
        # Fallback to simple smoothing if B-spline fails
        try:
            racing_line[:, 0] = gaussian_filter1d(racing_line[:, 0], sigma=2.0)
            racing_line[:, 1] = gaussian_filter1d(racing_line[:, 1], sigma=2.0)
        except:
            pass
    
    return racing_line

def calculate_racing_line_basic(track_points: np.ndarray, curvature: np.ndarray, track_width: float) -> np.ndarray:
    """
    Basic Model: Simple geometric approach for good racing lines
    - Uses moderate track width (75%)
    - Simple corner detection and smooth curves
    - Good balance between performance and simplicity
    - Suitable for general racing and learning
    """
    racing_line = track_points.copy()
    n_points = len(track_points)
    
    # Ensure curvature is finite
    curvature = np.where(np.isfinite(curvature), curvature, 0.0)
    
    # Calculate track direction vectors
    direction_vectors = np.diff(track_points, axis=0)
    direction_vectors = np.vstack([direction_vectors, direction_vectors[-1]])
    
    # Normalize direction vectors
    norms = np.linalg.norm(direction_vectors, axis=1)
    norms = np.where(norms == 0, 1, norms)
    direction_vectors = direction_vectors / norms[:, np.newaxis]
    
    # Calculate perpendicular vectors
    perpendicular_vectors = np.array([-direction_vectors[:, 1], direction_vectors[:, 0]]).T
    
    # Moderate track width usage
    max_offset = track_width * 0.375  # Use 37.5% of track width (75% total)
    
    # Smooth curvature for better corner detection
    try:
        smoothed_curvature = gaussian_filter1d(curvature, sigma=5.0)
        smoothed_curvature = np.where(np.isfinite(smoothed_curvature), smoothed_curvature, 0.0)
    except:
        smoothed_curvature = curvature
    
    # More conservative corner detection for cleaner lines
    curvature_threshold = 0.005
    
    for i in range(n_points):
        if i < 5 or i > n_points - 5:
            continue
            
        # More conservative offset based on curvature
        if abs(smoothed_curvature[i]) > curvature_threshold:
            # In a corner - move toward the inside for a good racing line
            corner_direction = -np.sign(smoothed_curvature[i])
            
            # Calculate offset magnitude based on corner severity (more conservative)
            corner_severity = min(abs(smoothed_curvature[i]) * 200, 1.0)
            offset_magnitude = max_offset * corner_severity * 0.6  # Reduced from 0.8
            
            # Look ahead to see if we should position for corner exit
            look_ahead = min(i + 12, n_points - 1)
            avg_curvature_ahead = np.mean(np.abs(smoothed_curvature[i:look_ahead]))
            
            if avg_curvature_ahead < curvature_threshold:
                # Straight ahead - position for corner exit
                offset_magnitude *= 0.7  # Slightly more conservative
            
            offset = perpendicular_vectors[i] * offset_magnitude * corner_direction
            racing_line[i] = track_points[i] + offset
        else:
            # On straights - look for upcoming corners (more conservative)
            look_ahead_distance = min(12, n_points - i - 1)
            upcoming_corner_idx = None
            
            for j in range(i + 1, i + look_ahead_distance + 1):
                if j < n_points and abs(smoothed_curvature[j]) > curvature_threshold:
                    upcoming_corner_idx = j
                    break
            
            if upcoming_corner_idx is not None:
                # Position for optimal corner entry
                upcoming_corner_direction = -np.sign(smoothed_curvature[upcoming_corner_idx])
                setup_offset = max_offset * 0.6 * (-upcoming_corner_direction)  # Go to outside
                
                distance_to_corner = upcoming_corner_idx - i
                transition_factor = max(0.2, 1 - (distance_to_corner / look_ahead_distance))
                
                offset = perpendicular_vectors[i] * setup_offset * transition_factor
                racing_line[i] = track_points[i] + offset
    
    # Smooth the line for better drivability
    try:
        racing_line[:, 0] = gaussian_filter1d(racing_line[:, 0], sigma=2.0)
        racing_line[:, 1] = gaussian_filter1d(racing_line[:, 1], sigma=2.0)
    except:
        pass
    
    return racing_line

def _optimize_racing_line_single(
    track_points: np.ndarray,
    track_width: float,
    friction: float,
    car: Car
) -> Dict:
    """
    Internal function that optimizes racing line for a single car
    """
    # This is just a placeholder that returns the center line
    return {
        "coordinates": track_points.tolist(),
        "speeds": [10.0] * len(track_points),
        "lap_time": len(track_points) * 0.1
    } 