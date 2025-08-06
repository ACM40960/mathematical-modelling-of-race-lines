"""
Clean Physics-Based Racing Line Model
Based on Perantoni & Limebeer's optimal control research with lap time optimization

Mathematical Foundation:
- Cornering Speed: v_max = √(μ × (mg + F_downforce) / (m × κ))
- Aerodynamic Forces: F = 0.5 × ρ × v² × C × A  
- Lap Time Optimization: minimize ∫(1/v) ds
- Braking Distance: d = v² / (2a)
"""

import numpy as np
from scipy.ndimage import gaussian_filter1d
from .base_model import BaseRacingLineModel
from ..aerodynamics import aerodynamic_model
from ..curvilinear_coordinates import create_curvilinear_system


class PhysicsBasedModel(BaseRacingLineModel):
    """
    Clean Physics-Based Racing Line Model
    
    Core Equations:
    1. Cornering Speed: v_max = √(μ × N / (m × κ))
    2. Aerodynamics: F = 0.5 × ρ × v² × C × A
    3. Racing Line: Late apex strategy with physics constraints
    """
    
    def __init__(self):
        super().__init__(
            name="Physics-Based Model",
            description="Clean physics model with vehicle dynamics",
            track_usage="80%",
            characteristics=["Research-based", "Clean", "Physics-accurate"]
        )
    
    def calculate_racing_line(self, track_points: np.ndarray, curvature: np.ndarray, 
                             track_width: float, car_params: dict = None, 
                             friction: float = 1.0) -> np.ndarray:
        """Calculate racing line using physics equations"""
        
        print(f"\n🔬 PHYSICS MODEL: Starting calculation...")
        
        # Extract car parameters
        params = self._extract_parameters(car_params)
        
        # Initialize curvilinear coordinate system
        coord_system = create_curvilinear_system(track_points, track_width / 2)
        
        # Calculate physics-based speeds
        speeds = self._calculate_physics_speeds(coord_system, params, friction)
        
        # Calculate racing line offsets
        offsets = self._calculate_racing_line_offsets(coord_system, speeds, track_width, params)
        
        # Apply offsets to get final racing line
        racing_line = self._apply_offsets(track_points, offsets)
        
        print(f"✅ Physics calculation complete")
        return racing_line
    
    def _extract_parameters(self, car_params):
        """Extract and validate car parameters"""
        if car_params:
            return {
                'mass': car_params.get('mass', 1500.0),
                'max_acceleration': car_params.get('max_acceleration', 5.0),
                'max_steering_angle': car_params.get('max_steering_angle', 30.0),
                'drag_coefficient': car_params.get('drag_coefficient', 1.0),
                'lift_coefficient': car_params.get('lift_coefficient', 3.0),
                'car_length': car_params.get('length', 5.0),
                'car_width': car_params.get('width', 1.4),
                'frontal_area': car_params.get('effective_frontal_area', 
                                             car_params.get('length', 5.0) * car_params.get('width', 1.4) * 0.7)
            }
        else:
            return {
                'mass': 1500.0,
                'max_acceleration': 5.0,
                'max_steering_angle': 30.0,
                'drag_coefficient': 1.0,
                'lift_coefficient': 3.0,
                'car_length': 5.0,
                'car_width': 1.4,
                'frontal_area': 4.9  # 5.0 * 1.4 * 0.7
            }
    
    def _calculate_physics_speeds(self, coord_system, params, friction):
        """
        Calculate maximum speeds using physics equations
        
        Core Formula: v_max = √(μ × (mg + F_downforce) / (m × κ))
        """
        track_geometry = coord_system.track_geometry
        curvature = track_geometry.curvature
        n_points = len(curvature)
        speeds = np.zeros(n_points)
        
        # Physics constants
        g = 9.81
        air_density = 1.225
        
        for i, kappa in enumerate(curvature):
            if abs(kappa) > 1e-6:  # Corner section
                speeds[i] = self._calculate_corner_speed(kappa, params, friction, g, air_density)
            else:  # Straight section
                speeds[i] = self._calculate_straight_speed(params, air_density)
        
        return speeds
    
    def _calculate_corner_speed(self, kappa, params, friction, g, air_density):
        """
        Calculate maximum cornering speed using physics
        
        Formula: v_max = √(μ × (mg + F_downforce) / (m × κ))
        """
        # Iterative solution for speed-dependent aerodynamics
        v_estimate = 30.0  # Initial guess
        
        for _ in range(3):  # Quick convergence
            # Calculate aerodynamic downforce: F = 0.5 × ρ × v² × C_L × A
            _, downforce = aerodynamic_model.calculate_aerodynamic_forces(
                v_estimate, params['frontal_area'], 
                params['drag_coefficient'], params['lift_coefficient']
            )
            
            # Total normal force: N = mg + F_downforce
            total_normal_force = params['mass'] * g + downforce
            
            # Maximum lateral force: F_lat = μ × N
            max_lateral_force = friction * total_normal_force
            
            # Maximum cornering speed: v = √(F_lat / (m × κ))
            if abs(kappa) > 1e-10:
                v_max_squared = max_lateral_force / (params['mass'] * abs(kappa))
                if v_max_squared > 0:
                    v_new = np.sqrt(v_max_squared)
                else:
                    v_new = 10.0
            else:
                v_new = 80.0
            
            # Check convergence
            if abs(v_new - v_estimate) < 0.5:
                break
            
            v_estimate = 0.7 * v_estimate + 0.3 * v_new
        
        return max(5.0, min(v_estimate, 100.0))
    
    def _calculate_straight_speed(self, params, air_density):
        """
        Calculate maximum speed on straights (drag-limited)
        
        Equilibrium: F_drive = F_drag
        """
        # Maximum driving force: F = ma
        max_drive_force = params['mass'] * params['max_acceleration']
        
        # Calculate drag-limited speed
        drag_limited_speed = aerodynamic_model.calculate_drag_limited_speed(
            max_drive_force, params['frontal_area'], params['drag_coefficient']
        )
        
        return min(drag_limited_speed, 100.0)
    
    def _calculate_racing_line_offsets(self, coord_system, speeds, track_width, params):
        """
        Calculate racing line offsets using late apex strategy
        
        Strategy:
        - Entry: Go wide for better radius
        - Apex: Late apex for better exit
        - Exit: Use full track width for acceleration
        """
        track_geometry = coord_system.track_geometry
        curvature = track_geometry.curvature
        n_points = len(curvature)
        offsets = np.zeros(n_points)
        
        max_offset = track_width * 0.4  # 80% track usage
        
        for i in range(n_points):
            if i < 5 or i > n_points - 5:
                continue  # Skip endpoints
            
            current_curvature = abs(curvature[i])
            current_speed = speeds[i]
            
            if current_curvature > 0.003:  # Corner section
                offset = self._calculate_corner_offset(
                    i, curvature, speeds, max_offset, n_points
                )
                offsets[i] = offset
            else:  # Straight section
                offset = self._calculate_straight_offset(
                    i, curvature, speeds, max_offset, n_points, params
                )
                offsets[i] = offset
        
        return offsets
    
    def _calculate_corner_offset(self, i, curvature, speeds, max_offset, n_points):
        """Calculate offset for corner sections using late apex strategy"""
        
        corner_direction = -np.sign(curvature[i])
        current_speed = speeds[i]
        
        # Speed-based strategy
        if current_speed < 30:  # Slow corner - maximize radius
            speed_factor = 1.0
        elif current_speed < 50:  # Medium corner - balanced
            speed_factor = 0.8
        else:  # Fast corner - minimize radius
            speed_factor = 0.6
        
        # Determine corner phase (entry/apex/exit)
        look_ahead = min(i + 10, n_points - 1)
        look_behind = max(i - 10, 0)
        
        ahead_curvature = np.mean(np.abs(curvature[i:look_ahead]))
        behind_curvature = np.mean(np.abs(curvature[look_behind:i]))
        current_curvature = abs(curvature[i])
        
        if (behind_curvature < current_curvature and ahead_curvature < current_curvature):
            # Apex - late apex strategy
            phase_factor = 0.9 * speed_factor
        elif behind_curvature < current_curvature:
            # Entry - go wide
            phase_factor = -0.7 * speed_factor
        else:
            # Exit - accelerate out wide
            phase_factor = -0.6 * speed_factor
        
        return max_offset * phase_factor * corner_direction
    
    def _calculate_straight_offset(self, i, curvature, speeds, max_offset, n_points, params):
        """Calculate offset for straight sections (positioning for next corner)"""
        
        # Look ahead for upcoming corners
        look_ahead_distance = min(15, n_points - i - 1)
        
        for j in range(i + 1, i + look_ahead_distance + 1):
            if j < n_points and abs(curvature[j]) > 0.003:
                # Found upcoming corner
                corner_direction = -np.sign(curvature[j])
                distance_to_corner = j - i
                
                # Calculate braking distance: d = v² / (2a)
                braking_distance = (speeds[j] ** 2) / (2 * params['max_acceleration'])
                
                if distance_to_corner <= braking_distance * 0.1:
                    # In braking zone - position for optimal entry
                    setup_factor = 0.7 * (-corner_direction)
                    transition = 1 - (distance_to_corner / (braking_distance * 0.1))
                    return max_offset * setup_factor * transition
                break
        
        return 0.0
    
    def _apply_offsets(self, track_points, offsets):
        """Apply calculated offsets to track points to get racing line"""
        
        racing_line = track_points.copy()
        n_points = len(track_points)
        
        for i in range(1, n_points - 1):
            # Calculate perpendicular direction
            prev_point = track_points[i-1]
            next_point = track_points[i+1]
            
            # Tangent vector
            tangent = next_point - prev_point
            tangent_norm = np.linalg.norm(tangent)
            
            if tangent_norm > 1e-10:
                tangent = tangent / tangent_norm
                
                # Perpendicular vector (90 degrees rotation)
                perpendicular = np.array([-tangent[1], tangent[0]])
                
                # Apply offset
                racing_line[i] = track_points[i] + offsets[i] * perpendicular
        
        return racing_line


class PhysicsBasedModelOptimized(PhysicsBasedModel):
    """
    Physics-Based Model with Lap Time Optimization
    
    Optimization Objective: minimize ∫(1/v) ds (total lap time)
    
    Additional Equations:
    - Lap Time: T = ∫(1/v) ds
    - Path Optimization: Iterative improvement
    - Convergence: |T_new - T_old| < threshold
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Physics-Based Model (Optimized)"
        self.description = "Physics model with lap time optimization"
        self.characteristics = ["Research-based", "Optimized", "Lap time minimization"]
        
        # Optimization parameters
        self.MAX_ITERATIONS = 4
        self.CONVERGENCE_THRESHOLD = 0.15  # seconds
    
    def calculate_racing_line(self, track_points: np.ndarray, curvature: np.ndarray, 
                             track_width: float, car_params: dict = None, 
                             friction: float = 1.0) -> np.ndarray:
        """
        Calculate optimized racing line that minimizes lap time
        
        Optimization Algorithm:
        1. Calculate initial racing line
        2. Calculate lap time T = ∫(1/v) ds
        3. Optimize path geometry
        4. Repeat until convergence
        """
        
        print(f"\n🔄 PHYSICS OPTIMIZATION: Starting lap time minimization...")
        
        # Extract parameters
        params = self._extract_parameters(car_params)
        
        # Initialize optimization
        current_path = track_points.copy()
        best_lap_time = float('inf')
        best_path = current_path.copy()
        
        # Optimization loop
        for iteration in range(self.MAX_ITERATIONS):
            print(f"\n   Iteration {iteration + 1}/{self.MAX_ITERATIONS}:")
            
            # Calculate racing line for current path
            print(f"      Calculating physics-based racing line...")
            racing_line = super().calculate_racing_line(
                current_path, curvature, track_width, car_params, friction
            )
            
            # Calculate speed profile
            print(f"      Calculating speed profile...")
            coord_system = create_curvilinear_system(racing_line, track_width / 2)
            speeds = self._calculate_physics_speeds(coord_system, params, friction)
            
            # Calculate lap time (optimization objective)
            lap_time = self._calculate_lap_time(speeds, racing_line)
            print(f"      📊 Lap time: {lap_time:.2f}s")
            
            # Check for improvement
            if lap_time < best_lap_time:
                improvement = best_lap_time - lap_time
                best_lap_time = lap_time
                best_path = racing_line.copy()
                print(f"      🎯 New best! Improvement: {improvement:.2f}s")
            else:
                print(f"      📈 No improvement")
            
            # Check convergence
            if iteration > 0 and abs(prev_lap_time - lap_time) < self.CONVERGENCE_THRESHOLD:
                print(f"      ✅ Converged!")
                break
            
            # Optimize path for next iteration
            if iteration < self.MAX_ITERATIONS - 1:
                print(f"      Optimizing path geometry...")
                current_path = self._optimize_path_geometry(racing_line, speeds, track_width)
            
            prev_lap_time = lap_time
        
        print(f"\n🏁 OPTIMIZATION COMPLETED:")
        print(f"   • Final lap time: {best_lap_time:.2f}s")
        print(f"   • Iterations: {min(iteration + 1, self.MAX_ITERATIONS)}")
        
        return best_path
    
    def _calculate_lap_time(self, speeds, racing_line):
        """
        Calculate total lap time: T = ∫(1/v) ds
        
        This is the optimization objective function
        """
        distances = self._calculate_distances(racing_line)
        lap_time = 0.0
        
        for i in range(len(distances)):
            if speeds[i] > 0 and distances[i] > 0:
                lap_time += distances[i] / speeds[i]  # time = distance / speed
        
        return lap_time
    
    def _calculate_distances(self, points):
        """Calculate distances between consecutive points"""
        distances = np.zeros(len(points))
        
        for i in range(len(points) - 1):
            dx = points[i+1][0] - points[i][0]
            dy = points[i+1][1] - points[i][1]
            distances[i] = np.sqrt(dx**2 + dy**2)
        
        # Close the loop
        if len(points) > 2:
            dx = points[0][0] - points[-1][0]
            dy = points[0][1] - points[-1][1]
            distances[-1] = np.sqrt(dx**2 + dy**2)
        
        return distances
    
    def _optimize_path_geometry(self, racing_line, speeds, track_width):
        """
        Optimize path geometry to reduce lap time
        
        Strategy: Smooth high-speed sections to reduce curvature
        """
        optimized_path = racing_line.copy()
        n_points = len(racing_line)
        
        # Apply smoothing based on speed
        for i in range(2, n_points - 2):
            if speeds[i] > 40.0:  # High-speed sections
                # Apply smoothing to reduce curvature
                prev_point = racing_line[i-1]
                current_point = racing_line[i]
                next_point = racing_line[i+1]
                
                # Simple 3-point smoothing
                smooth_x = (prev_point[0] + 2 * current_point[0] + next_point[0]) / 4
                smooth_y = (prev_point[1] + 2 * current_point[1] + next_point[1]) / 4
                
                # Blend with original (30% smoothing)
                weight = 0.3
                optimized_path[i][0] = (1 - weight) * current_point[0] + weight * smooth_x
                optimized_path[i][1] = (1 - weight) * current_point[1] + weight * smooth_y
        
        return optimized_path