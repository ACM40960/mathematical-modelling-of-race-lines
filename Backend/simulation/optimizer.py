"""
Racing line optimizer with separated model architecture
"""
import numpy as np
from scipy.optimize import minimize
from scipy.interpolate import splprep, splev
from typing import List, Tuple, Dict
from schemas.track import Car
from scipy.ndimage import gaussian_filter1d
from enum import Enum

# Import the new model classes
from .algorithms.physics_model import PhysicsBasedModel, PhysicsBasedModelOptimized
from .algorithms.basic_model import BasicModel
from .algorithms.kapania_model import KapaniaModel
from .aerodynamics import aerodynamic_model, get_speed_dependent_coefficients

class RacingLineModel(str, Enum):
    """Available racing line calculation models"""
    PHYSICS_BASED = "physics_based"
    PHYSICS_OPTIMIZED = "physics_optimized"  # NEW: Optimized physics model
    BASIC = "basic"
    TWO_STEP_ALGORITHM = "two_step_algorithm"

# Initialize model instances
MODELS = {
    RacingLineModel.PHYSICS_BASED: PhysicsBasedModel(),
    RacingLineModel.PHYSICS_OPTIMIZED: PhysicsBasedModelOptimized(),  # NEW: Optimized model
    RacingLineModel.BASIC: BasicModel(),
    RacingLineModel.TWO_STEP_ALGORITHM: KapaniaModel()
}

def resample_track_points(points: np.ndarray, num_points: int = 50) -> np.ndarray:
    """
    Resample track points to reduce computational complexity while maintaining track shape.
    Ensures the track is treated as a closed loop and preserves the start/finish position.
    """
    # Convert points to numpy array if not already
    points = np.array(points)
    
    # Check if track is already closed (last point same as first)
    is_closed = np.allclose(points[0], points[-1], atol=1e-3)
    
    if not is_closed:
        # Close the track by adding the first point at the end
        points = np.vstack([points, points[0]])
    
    # For closed tracks, use periodic spline fitting
    try:
        # Use periodic spline for closed tracks
        tck, u = splprep([points[:,0], points[:,1]], s=0, per=True)
        
        # Generate new points along the spline, ensuring we start at u=0 (original start position)
        u_new = np.linspace(0, 1, num_points + 1)[:-1]  # Exclude the last point to avoid duplication
        x_new, y_new = splev(u_new, tck)
        
        resampled_points = np.column_stack((x_new, y_new))
        
        # Ensure the track is properly closed by adding the first point at the end
        resampled_points = np.vstack([resampled_points, resampled_points[0]])
        
        return resampled_points
        
    except Exception as e:
        print(f"Periodic spline fitting failed: {e}. Falling back to non-periodic.")
        # Fallback to non-periodic spline if periodic fails
        tck, u = splprep([points[:,0], points[:,1]], s=0, per=False)
        u_new = np.linspace(0, 1, num_points)
        x_new, y_new = splev(u_new, tck)
        
        resampled_points = np.column_stack((x_new, y_new))
        
        # Ensure the track is closed
        if not np.allclose(resampled_points[0], resampled_points[-1], atol=1e-3):
            resampled_points = np.vstack([resampled_points, resampled_points[0]])
        
        return resampled_points

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

def calculate_max_entry_speed(curvature: float, friction: float, car: Car) -> float:
    """
    Calculate the maximum entry speed for a corner based on REAL vehicle dynamics
    Now properly accounts for car mass, downforce, and acceleration capabilities!
    """
    # Handle invalid curvature values
    if not np.isfinite(curvature) or abs(curvature) < 1e-10:
        # Straight line - limited by car's top speed capability
        return min(80.0, np.sqrt(car.max_acceleration * 100))  # Rough top speed estimate
        
    g = 9.81  # gravitational acceleration
    rho = 1.225  # air density (kg/m³)
    
    # Use car's actual parameters
    mass = car.mass
    Cl = getattr(car, 'lift_coefficient', 3.0)
    Cd = getattr(car, 'drag_coefficient', 1.0)
    A = car.effective_frontal_area
    
    # Ensure all values are finite
    if not all(np.isfinite([Cl, Cd, A, mass])):
        return 10.0  # Return safe fallback speed
    
    # Convert steering angle to radians
    max_steering_rad = np.deg2rad(car.max_steering_angle)
    
    # Calculate minimum turn radius based on vehicle geometry and steering limit
    wheelbase = car.length * 0.6  # Approximate wheelbase as 60% of car length
    min_turn_radius = wheelbase / np.tan(max_steering_rad) if max_steering_rad > 0 else 1000.0
    
    # Current turn radius from curvature
    current_turn_radius = 1.0 / abs(curvature) if abs(curvature) > 1e-10 else 1000.0
    
    # Check if the corner is too tight for the car's steering capability
    if current_turn_radius < min_turn_radius:
        limited_speed = min(15.0, np.sqrt(friction * g * current_turn_radius))
        return limited_speed
    
    # ADVANCED PHYSICS: Speed-dependent aerodynamics + drag integration
    # Start with estimated speed for iterative aerodynamic calculation
    v_estimate = 30.0 if abs(curvature) > 1e-10 else 60.0  # Different initial guess for corners vs straights
    
    for iteration in range(5):  # More iterations for speed-dependent convergence
        # Get speed-dependent aerodynamic coefficients from research paper
        aero_coeffs = get_speed_dependent_coefficients(v_estimate)
        
        # Apply car's base coefficients as scaling factors
        effective_drag = aero_coeffs.drag_coefficient * (Cd / 1.0)  # Scale from baseline
        effective_lift = aero_coeffs.lift_coefficient * (Cl / 3.0)  # Scale from baseline
        
        # Calculate aerodynamic forces with speed-dependent coefficients
        drag_force, downforce = aerodynamic_model.calculate_aerodynamic_forces(
            v_estimate, A, Cd, Cl
        )
        
        # Iteration debug removed
        
        if abs(curvature) > 1e-10:  # Cornering - limited by lateral grip
            # Total normal force = Weight + Downforce  
            total_normal_force = mass * g + downforce
            
            # Maximum lateral force from friction: F_lat = μ * N
            max_lateral_force = friction * total_normal_force
            
            # Centripetal force equation: F = m * v² / r = m * v² * κ
            v_max_squared = max_lateral_force / (mass * abs(curvature))
            
            if v_max_squared > 0:
                v_new = np.sqrt(v_max_squared)
            else:
                v_new = 10.0
                
        else:  # Straight section - limited by drag vs driving force
            # Maximum driving force approximation (based on acceleration capability)
            max_drive_force = mass * car.max_acceleration * 0.8  # 80% of max acceleration
            
            # On straights, speed is limited by drag force balance
            # F_drive = F_drag at top speed
            if drag_force > 0:
                # If drag force exceeds driving capability, reduce speed
                if drag_force > max_drive_force:
                    # Solve for speed where F_drag = F_drive
                    v_new = aerodynamic_model.calculate_drag_limited_speed(
                        max_drive_force, A, Cd
                    )
                else:
                    # Can maintain or increase speed
                    v_new = min(v_estimate * 1.1, 100.0)  # Gradual increase up to reasonable limit
            else:
                v_new = 80.0  # Fallback for straight sections
        
        # Check for convergence
        if abs(v_new - v_estimate) < 0.3:  # Converged within 0.3 m/s
            break
            
        # Damped update to prevent oscillation
        v_estimate = 0.6 * v_estimate + 0.4 * v_new
    
    # Mass-dependent speed scaling
    # Heavier cars are penalized due to:
    # 1. More inertia in corners
    # 2. Higher tire loading
    # 3. Reduced acceleration capability
    reference_mass = 1500.0  # FIXED: Use frontend default as reference mass
    mass_penalty = np.sqrt(reference_mass / mass)  # Heavier cars get < 1.0 multiplier
    
    # Acceleration-dependent speed scaling
    # Cars with better acceleration can carry more speed (better braking too)
    reference_acceleration = 5.0  # FIXED: Use frontend default as reference acceleration
    accel_boost = np.sqrt(car.max_acceleration / reference_acceleration)
    
    # Final speed calculation with physics factors
    physics_speed = v_estimate * mass_penalty * accel_boost
    
    # Safety factor and bounds
    final_speed = max(5.0, min(100.0, 0.85 * physics_speed))
    
    # Get final aerodynamic data for output
    final_aero = get_speed_dependent_coefficients(v_estimate)
    final_drag, final_downforce = aerodynamic_model.calculate_aerodynamic_forces(
        v_estimate, A, Cd, Cl
    )
    
    # Speed calculation complete
    
    return final_speed if np.isfinite(final_speed) else 10.0

def calculate_speed_profile(
    racing_line: np.ndarray,
    curvature: np.ndarray,
    friction: float,
    car: Car
) -> Tuple[np.ndarray, float]:
    """
    Calculate the speed profile along the racing line
    """
    n_points = len(racing_line)
    speeds = np.zeros(n_points)
    
    # Calculate segment lengths
    segments = np.diff(racing_line, axis=0)
    segment_lengths = np.linalg.norm(segments, axis=1)
    
    # Ensure no zero-length segments
    segment_lengths = np.maximum(segment_lengths, 0.1)
    
    # Calculate maximum speeds for each point
    for i in range(n_points):
        speeds[i] = calculate_max_entry_speed(curvature[i], friction, car)
    
    # Apply smoothing to speed profile
    try:
        speeds = gaussian_filter1d(speeds, sigma=2.0)
    except:
        pass
    
    # Ensure speeds are finite and positive
    speeds = np.where(np.isfinite(speeds), speeds, 10.0)
    speeds = np.maximum(speeds, 1.0)
    
    # Calculate lap time
    lap_time = 0.0
    for i in range(len(segment_lengths)):
        if speeds[i] > 0:
            lap_time += segment_lengths[i] / speeds[i]
    
    # Speed profile calculation complete
    
    return speeds, lap_time

def optimize_racing_line(track, model: RacingLineModel = RacingLineModel.PHYSICS_BASED) -> List[Dict]:
    """
    Optimize racing lines for all cars on the track with crossover prevention
    """
    # Convert track points to numpy array
    track_points = np.array([(p.x, p.y) for p in track.track_points])
    track_width = track.width
    friction = track.friction
    
    # Store the original start position for alignment
    original_start = track_points[0].copy()
    
    # Resample track points to manageable size
    resampled_points = resample_track_points(track_points, num_points=min(100, len(track_points)))
    
    # Ensure the resampled track starts at the same position as the original
    # Find the closest point in resampled track to the original start
    distances = np.linalg.norm(resampled_points - original_start, axis=1)
    start_idx = np.argmin(distances)
    
    # Rotate the resampled points so they start at the correct position
    if start_idx != 0:
        resampled_points = np.vstack([
            resampled_points[start_idx:],
            resampled_points[1:start_idx+1]  # Skip the duplicate point at the end
        ])
    
    # Calculate curvature for the track centerline
    curvature = compute_curvature(resampled_points)
    
    # Get the appropriate model
    racing_model = MODELS.get(model, MODELS[RacingLineModel.PHYSICS_BASED])
    
    # Prepare car parameters for physics-based calculations
    car_params = None
    friction = 1.0  # Default friction
    
    # Prepare car parameters
    if track.cars and len(track.cars) > 0:
        # Use the first car's parameters for racing line calculation
        car = track.cars[0]
        car_params = {
            'mass': car.mass,
            'length': car.length,
            'width': car.width,
            'max_steering_angle': car.max_steering_angle,
            'max_acceleration': car.max_acceleration,
            'drag_coefficient': car.drag_coefficient,
            'lift_coefficient': car.lift_coefficient
        }
    else:
        car_params = None
    
    # Use track friction
    friction = track.friction
    
    base_racing_line = racing_model.calculate_racing_line(
        resampled_points, curvature, track_width, car_params, friction
    )
    
    # Racing line calculated
    
    # Ensure the racing line is also properly closed and starts at the correct position
    if not np.allclose(base_racing_line[0], base_racing_line[-1], atol=1e-3):
        base_racing_line = np.vstack([base_racing_line, base_racing_line[0]])
    
    # For multiple cars, create separated racing lines to prevent crossovers
    num_cars = len(track.cars)
    if num_cars == 1:
        # Single car - use optimal racing line
        racing_lines = [base_racing_line]
    else:
        # Multiple cars - create separated lines
        racing_lines = create_separated_racing_lines(
            resampled_points, base_racing_line, track_width, num_cars
        )
    
    optimal_lines = []
    
    for i, car in enumerate(track.cars):
        try:
            # Use the appropriate racing line for this car
            racing_line = racing_lines[i] if i < len(racing_lines) else base_racing_line
            
            # Ensure this racing line is also properly closed
            if not np.allclose(racing_line[0], racing_line[-1], atol=1e-3):
                racing_line = np.vstack([racing_line, racing_line[0]])
            
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
            print(f"⚠️ Optimization failed for car {car.id}: {str(e)}")
            optimal_lines.append({
                "car_id": car.id,
                "coordinates": resampled_points.tolist(),  # Use resampled track as fallback
                "speeds": [10.0] * len(resampled_points),  # Safe fallback speed
                "lap_time": len(resampled_points) * 0.1,   # Fallback lap time
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
    min_separation = min(3.0, track_width * 0.2)
    max_usable_width = track_width * 0.8
    
    # Calculate positions for each car
    if num_cars == 2:
        offsets = [-min_separation * 0.7, min_separation * 0.7]
    elif num_cars == 3:
        offsets = [-min_separation, 0, min_separation]
    elif num_cars == 4:
        offsets = [-min_separation * 1.2, -min_separation * 0.4, 
                  min_separation * 0.4, min_separation * 1.2]
    else:
        # More than 4 cars - distribute evenly
        if num_cars > 6:
            num_cars = 6
        
        total_width = min_separation * (num_cars - 1)
        if total_width > max_usable_width:
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
            max_allowed_distance = track_width * 0.45
            
            if distance_from_center <= max_allowed_distance:
                car_racing_line[j] = proposed_point
            else:
                # Scale down offset to stay within boundaries
                scale_factor = max_allowed_distance / distance_from_center
                car_racing_line[j] = track_points[j] + offset_vector * scale_factor
        
        # Apply smoothing to the separated line
        try:
            # Multiple passes of smoothing for very clean lines
            for sigma in [1.0, 1.5, 2.0]:
                car_racing_line[:, 0] = gaussian_filter1d(car_racing_line[:, 0], sigma=sigma)
                car_racing_line[:, 1] = gaussian_filter1d(car_racing_line[:, 1], sigma=sigma)
        except:
            pass
        
        # Ensure the racing line is properly closed
        if not np.allclose(car_racing_line[0], car_racing_line[-1], atol=1e-3):
            car_racing_line = np.vstack([car_racing_line, car_racing_line[0]])
        
        racing_lines.append(car_racing_line)
    
    return racing_lines

def get_available_models() -> List[Dict]:
    """
    Get information about all available racing line models
    """
    models = []
    for model_key, model_instance in MODELS.items():
        model_info = model_instance.get_model_info()
        model_info["id"] = model_key.value
        models.append(model_info)
    
    return models 