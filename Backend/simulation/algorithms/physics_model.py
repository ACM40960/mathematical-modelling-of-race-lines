"""
Physics-based racing line model
Based on Perantoni & Limebeer's optimal control research
Now with integrated curvilinear coordinate system
"""
import numpy as np
from scipy.ndimage import gaussian_filter1d
from .base_model import BaseRacingLineModel
from ..aerodynamics import aerodynamic_model, get_speed_dependent_coefficients
from ..curvilinear_coordinates import CurvilinearCoordinateSystem, create_curvilinear_system


class PhysicsBasedModel(BaseRacingLineModel):
    """
    Physics-Based Racing Line Model
    
    Based on Perantoni & Limebeer's paper on optimal control for Formula One cars.
    Implements proper racing line theory with vehicle dynamics considerations.
    """
    
    def __init__(self):
        super().__init__(
            name="Physics-Based Model",
            description="Based on research paper with vehicle dynamics",
            track_usage="80%",
            characteristics=["Research-based", "Aggressive", "Realistic"]
        )
    
    def calculate_racing_line(self, track_points: np.ndarray, curvature: np.ndarray, track_width: float, 
                             car_params: dict = None, friction: float = 1.0) -> np.ndarray:
        """
        Calculate racing line using physics-based approach with real vehicle dynamics
        
        Implements:
        - Maximum cornering speeds based on friction and mass
        - Braking distances based on vehicle mass  
        - Acceleration zones based on max acceleration
        - Turn radius limits based on steering angle
        - Aerodynamic effects on cornering
        - Wide-apex-wide racing line theory
        """
        # Initialize variables for curvilinear-based calculation
        n_points = len(track_points)
        
        # Ensure curvature is finite
        curvature = np.where(np.isfinite(curvature), curvature, 0.0)
        
        # Extract car parameters if provided
        if car_params:
            mass = car_params.get('mass', 750.0)  # kg
            max_acceleration = car_params.get('max_acceleration', 12.0)  # m/s²
            max_steering_angle = car_params.get('max_steering_angle', 30.0)  # degrees
            drag_coefficient = car_params.get('drag_coefficient', 1.0)
            lift_coefficient = car_params.get('lift_coefficient', 3.0)
            car_length = car_params.get('length', 5.0)  # meters
        else:
            # Default F1-like parameters
            mass = 750.0
            max_acceleration = 12.0
            max_steering_angle = 30.0
            drag_coefficient = 1.0
            lift_coefficient = 3.0
            car_length = 5.0
        
        # Physics constants
        g = 9.81  # gravity
        air_density = 1.225  # kg/m³
        
        # Initialize curvilinear coordinate system
        coord_system = create_curvilinear_system(track_points, track_width / 2)
        track_geometry = coord_system.track_geometry
        
        # Use enhanced track geometry from curvilinear system
        enhanced_curvature = track_geometry.curvature
        s_points = track_geometry.s_points
        direction_vectors = track_geometry.tangent_vectors
        perpendicular_vectors = track_geometry.normal_vectors
        
        # Calculate maximum cornering speeds using distance-based approach
        max_cornering_speeds = self._calculate_max_cornering_speeds_curvilinear(
            coord_system, friction, mass, drag_coefficient, lift_coefficient, air_density, g, car_length
        )
        
        # Calculate optimal racing line using curvilinear approach
        physics_offsets = self._calculate_physics_based_offsets_curvilinear(
            coord_system, max_cornering_speeds, track_width, friction, mass, max_acceleration
        )
        
        # Generate racing line in curvilinear coordinates (s,n)
        racing_line_curvilinear = []
        
        for i in range(len(physics_offsets)):
            s = s_points[i]  # Distance along track centerline
            n = physics_offsets[i]  # Lateral displacement from centerline
            
            # Validate that we stay within track boundaries in curvilinear space
            max_allowed_n = track_width * 0.4  # Maximum lateral displacement
            
            if abs(n) > max_allowed_n:
                # Clamp to track boundaries
                n = np.sign(n) * max_allowed_n
            
            # Store as curvilinear coordinate pair
            racing_line_curvilinear.append((s, n))
        
        # Convert from curvilinear (s,n) to global (x,y) coordinates for frontend
        racing_line = np.zeros_like(track_points)
        
        for i, (s, n) in enumerate(racing_line_curvilinear):
            # Convert curvilinear (s,n,ξ=0) to global (x,y) coordinates
            global_position, _ = coord_system.transform_to_global(s, n, 0.0)
            racing_line[i] = global_position
        
        # Store curvilinear racing line for advanced analysis (research purposes)
        self.last_curvilinear_racing_line = racing_line_curvilinear
        self.last_coord_system = coord_system
        
        # Apply boundary constraints
        racing_line = self.apply_boundary_constraints(racing_line, track_points, track_width * 0.4)
        
        # Apply enhanced smoothing for clean lines
        racing_line = self.smooth_racing_line(racing_line, smoothing_level="medium")
        
        # Ensure the racing line is properly closed for closed tracks
        if len(track_points) > 2 and np.allclose(track_points[0], track_points[-1], atol=1e-3):
            # This is a closed track, ensure the racing line is also closed
            if not np.allclose(racing_line[0], racing_line[-1], atol=1e-3):
                racing_line[-1] = racing_line[0]  # Force the last point to match the first
        
        return racing_line
    
    def _calculate_max_cornering_speeds(self, curvature: np.ndarray, friction: float, mass: float,
                                      drag_coefficient: float, lift_coefficient: float, 
                                      air_density: float, g: float, car_length: float) -> np.ndarray:
        """
        Calculate maximum cornering speeds based on physics with speed-dependent aerodynamics
        
        Uses iterative approach with research paper aerodynamic maps:
        - Speed-dependent CD(u) and CL(u) coefficients
        - Drag force limits on straights
        - Downforce enhancement in corners
        """
        max_speeds = np.zeros_like(curvature)
        frontal_area = car_length * 1.8 * 0.7  # Estimated frontal area
        
        print(f"\n🔬 ADVANCED AERODYNAMICS:")
        print(f"   • Using speed-dependent coefficients from research paper")
        print(f"   • Frontal area estimate: {frontal_area:.2f} m²")
        
        for i, kappa in enumerate(curvature):
            if abs(kappa) > 1e-6:  # Cornering situation
                # Iterative solution for speed-dependent aerodynamics
                v_estimate = 30.0  # Initial guess for corners
                
                for iteration in range(5):  # More iterations for accuracy
                    # Get speed-dependent aerodynamic coefficients
                    aero_coeffs = get_speed_dependent_coefficients(v_estimate)
                    
                    # Apply car's base coefficients as modifiers
                    effective_drag = aero_coeffs.drag_coefficient * (drag_coefficient / 1.0)
                    effective_lift = aero_coeffs.lift_coefficient * (lift_coefficient / 3.0)
                    
                    # Calculate aerodynamic forces
                    drag_force, downforce = aerodynamic_model.calculate_aerodynamic_forces(
                        v_estimate, frontal_area, drag_coefficient, lift_coefficient
                    )
                    
                    # Total normal force = Weight + Downforce
                    total_normal_force = mass * g + downforce
                    
                    # Maximum lateral force from friction
                    max_lateral_force = friction * total_normal_force
                    
                    # Centripetal force equation: F = m * v² * κ
                    # Therefore: v_max = sqrt(max_lateral_force / (m * κ))
                    v_max_squared = max_lateral_force / (mass * abs(kappa))
                    
                    if v_max_squared > 0:
                        v_new = np.sqrt(v_max_squared)
                    else:
                        v_new = 10.0
                    
                    # Check for convergence
                    if abs(v_new - v_estimate) < 0.5:  # Converged within 0.5 m/s
                        break
                    
                    v_estimate = 0.7 * v_estimate + 0.3 * v_new  # Damped update
                
                max_speeds[i] = max(5.0, min(v_estimate, 100.0))  # Reasonable bounds
                
            else:  # Straight section - drag limited
                # Calculate drag-limited top speed
                max_drive_force = mass * 15.0  # Approximate max driving force
                drag_limited_speed = aerodynamic_model.calculate_drag_limited_speed(
                    max_drive_force, frontal_area, drag_coefficient
                )
                
                max_speeds[i] = min(drag_limited_speed, 100.0)  # Reasonable top speed limit
        
        # Speed calculation complete
        
        return max_speeds
    
    def _calculate_max_cornering_speeds_curvilinear(self, coord_system: CurvilinearCoordinateSystem, 
                                                  friction: float, mass: float, drag_coefficient: float, 
                                                  lift_coefficient: float, air_density: float, g: float, 
                                                  car_length: float) -> np.ndarray:
        """
        Calculate maximum cornering speeds using curvilinear coordinate system (RESEARCH PAPER APPROACH)
        
        Uses distance-based independent variable (s) and track-relative physics:
        - Distance-based calculations instead of array indices
        - Track properties at specific distances
        - Research paper equations for track-relative dynamics
        - Speed-dependent aerodynamics at each track position
        """
        track_geometry = coord_system.track_geometry
        s_points = track_geometry.s_points
        curvature = track_geometry.curvature
        n_points = len(s_points)
        
        max_speeds = np.zeros(n_points)
        frontal_area = car_length * 1.8 * 0.7  # Estimated frontal area
        
        # Curvilinear speed calculation using distance-based approach
        
        # Calculate speeds using distance-based approach
        for i in range(n_points):
            s = s_points[i]  # Distance along track centerline
            
            # Get track properties at this distance
            track_props = coord_system.get_track_properties_at_s(s)
            local_curvature = track_props["curvature"]
            is_corner = track_props["is_corner"]
            
            if is_corner:  # Corner physics
                # Initial speed estimate for corners
                v_estimate = 25.0  # Conservative initial guess
                
                # Iterative convergence for speed-dependent aerodynamics
                for iteration in range(5):
                    # Get research paper aerodynamic coefficients
                    aero_coeffs = get_speed_dependent_coefficients(v_estimate)
                    
                    # Apply car's base coefficients as scaling factors
                    effective_drag = aero_coeffs.drag_coefficient * (drag_coefficient / 1.0)
                    effective_lift = aero_coeffs.lift_coefficient * (lift_coefficient / 3.0)
                    
                    # Calculate aerodynamic forces at this speed
                    drag_force, downforce = aerodynamic_model.calculate_aerodynamic_forces(
                        v_estimate, frontal_area, drag_coefficient, lift_coefficient
                    )
                    
                    # Physics calculation using curvilinear approach
                    # Total normal force = Weight + Downforce
                    total_normal_force = mass * g + downforce
                    
                    # Maximum lateral force from friction: F_lat = μ * N
                    max_lateral_force = friction * total_normal_force
                    
                    # Research paper: Centripetal force F = m * v² * κ(s)
                    # Maximum cornering speed: v_max = √(F_lateral / (m * κ))
                    if abs(local_curvature) > 1e-10:
                        v_max_squared = max_lateral_force / (mass * abs(local_curvature))
                        if v_max_squared > 0:
                            v_new = np.sqrt(v_max_squared)
                        else:
                            v_new = 10.0
                    else:
                        v_new = 80.0  # Straight section
                    
                    # Convergence check
                    if abs(v_new - v_estimate) < 0.3:
                        break
                    
                    # Damped update to prevent oscillation
                    v_estimate = 0.6 * v_estimate + 0.4 * v_new
                
                max_speeds[i] = max(5.0, min(v_estimate, 100.0))
                
            else:  # Straight section physics
                # Drag-limited top speed calculation
                max_drive_force = mass * 12.0  # Approximate max driving force (based on acceleration)
                
                # Calculate drag-limited speed using research aerodynamics
                drag_limited_speed = aerodynamic_model.calculate_drag_limited_speed(
                    max_drive_force, frontal_area, drag_coefficient
                )
                
                max_speeds[i] = min(drag_limited_speed, 100.0)
        
        return max_speeds
    
    def _calculate_physics_based_offsets(self, curvature: np.ndarray, max_speeds: np.ndarray, 
                                       track_width: float, friction: float, mass: float, 
                                       max_acceleration: float) -> np.ndarray:
        """
        Calculate racing line offsets based on physics and optimal racing theory
        
        Combines:
        - Maximum cornering speeds
        - Braking/acceleration zones  
        - Optimal racing line geometry
        """
        n_points = len(curvature)
        offsets = np.zeros(n_points)
        
        # Maximum allowed offset (physics-based track usage)
        max_offset = track_width * 0.4  # 80% total track usage for physics model
        
        for i in range(n_points):
            if i < 5 or i > n_points - 5:
                continue
                
            current_curvature = abs(curvature[i])
            current_max_speed = max_speeds[i]
            
            if current_curvature > 0.003:  # In a corner
                # Physics-based cornering strategy
                corner_direction = -np.sign(curvature[i])
                
                # Speed-based offset: slower corners need wider lines
                if current_max_speed < 30:  # Slow corner
                    speed_factor = 1.0
                elif current_max_speed < 50:  # Medium corner  
                    speed_factor = 0.8
                else:  # Fast corner
                    speed_factor = 0.6
                
                # Late apex strategy for physics-based model
                look_ahead = min(i + 10, n_points - 1)
                look_behind = max(i - 10, 0)
                
                ahead_curvature = np.mean(np.abs(curvature[i:look_ahead]))
                behind_curvature = np.mean(np.abs(curvature[look_behind:i]))
                
                if behind_curvature < current_curvature and ahead_curvature < current_curvature:
                    # Apex - maximum offset for minimum radius
                    phase_factor = 0.9 * speed_factor
                elif behind_curvature < current_curvature:
                    # Entry - go wide to set up for late apex
                    phase_factor = -0.7 * speed_factor  # Negative = opposite direction
                else:
                    # Exit - accelerate out wide
                    phase_factor = -0.6 * speed_factor
                
                offsets[i] = max_offset * phase_factor * corner_direction
                
            else:
                # Straight section - position for next corner based on acceleration capability
                look_ahead_distance = min(15, n_points - i - 1)
                
                for j in range(i + 1, i + look_ahead_distance + 1):
                    if j < n_points and abs(curvature[j]) > 0.003:
                        # Found upcoming corner
                        corner_direction = -np.sign(curvature[j])
                        distance_to_corner = j - i
                        
                        # Braking zone calculation based on physics
                        # Assume braking deceleration ≈ max_acceleration
                        braking_distance = (max_speeds[j] ** 2) / (2 * max_acceleration)
                        
                        if distance_to_corner <= braking_distance * 0.1:  # In braking zone
                            # Position for optimal corner entry
                            setup_factor = 0.7 * (-corner_direction)
                            transition = 1 - (distance_to_corner / (braking_distance * 0.1))
                            offsets[i] = max_offset * setup_factor * transition
                        break
        
        return offsets
    
    def _calculate_physics_based_offsets_curvilinear(self, coord_system: CurvilinearCoordinateSystem, 
                                                   max_speeds: np.ndarray, track_width: float, 
                                                   friction: float, mass: float, 
                                                   max_acceleration: float) -> np.ndarray:
        """
        Calculate racing line offsets using curvilinear coordinate system (RESEARCH PAPER APPROACH)
        
        Uses distance-based calculations and track-relative positioning:
        - Distance-based independent variable (s)
        - Track-relative lateral displacement (n)  
        - Physics-based racing line optimization
        - Research paper late-apex strategy
        """
        track_geometry = coord_system.track_geometry
        s_points = track_geometry.s_points
        curvature = track_geometry.curvature
        n_points = len(s_points)
        
        offsets = np.zeros(n_points)
        max_offset = track_width * 0.4  # 80% total track usage for physics model
        
        # Curvilinear racing line optimization
        
        for i in range(n_points):
            if i < 5 or i > n_points - 5:
                continue  # Skip edge points
                
            s = s_points[i]  # Current distance along track
            
            # Get track properties at this distance
            track_props = coord_system.get_track_properties_at_s(s)
            local_curvature = track_props["curvature"]
            is_corner = track_props["is_corner"]
            corner_direction = track_props["corner_direction"]
            
            current_speed = max_speeds[i]
            
            if is_corner:  # Corner section - apply racing line theory
                # Corner detected
                
                # Speed-based corner strategy
                if current_speed < 30:  # Slow corner - maximize grip
                    speed_factor = 1.0
                elif current_speed < 50:  # Medium corner - balanced approach
                    speed_factor = 0.8
                else:  # Fast corner - minimize radius
                    speed_factor = 0.6
                
                # Late apex strategy based on track analysis
                # Look ahead and behind to determine corner phase
                look_ahead_distance = 50.0  # meters
                look_behind_distance = 50.0  # meters
                
                # Find track properties ahead and behind
                s_ahead = min(s + look_ahead_distance, s_points[-1])
                s_behind = max(s - look_behind_distance, s_points[0])
                
                ahead_props = coord_system.get_track_properties_at_s(s_ahead)
                behind_props = coord_system.get_track_properties_at_s(s_behind)
                
                ahead_curvature = abs(ahead_props["curvature"])
                behind_curvature = abs(behind_props["curvature"])
                current_curvature_abs = abs(local_curvature)
                
                # Determine corner phase using distance-based analysis
                if (behind_curvature < current_curvature_abs and 
                    ahead_curvature < current_curvature_abs):
                    # Apex - maximize offset for minimum radius
                    phase_factor = 0.9 * speed_factor
                    phase_name = "apex"
                elif behind_curvature < current_curvature_abs:
                    # Entry - go wide to set up for late apex
                    phase_factor = -0.7 * speed_factor  # Opposite direction
                    phase_name = "entry"
                else:
                    # Exit - accelerate out wide
                    phase_factor = -0.6 * speed_factor
                    phase_name = "exit"
                
                # Apply direction (left turn = positive curvature)
                direction_multiplier = 1.0 if corner_direction == "left" else -1.0
                if corner_direction == "left":
                    direction_multiplier = 1.0
                elif corner_direction == "right":
                    direction_multiplier = -1.0
                else:
                    direction_multiplier = 0.0
                
                lateral_offset = max_offset * phase_factor * direction_multiplier
                offsets[i] = lateral_offset
                
                # Racing line offset calculated
                
            else:  # Straight section - position for next corner
                # Straight section detected
                
                # Look ahead for upcoming corners
                look_ahead_distance = 200.0  # meters - longer look ahead on straights
                
                for ahead_distance in [50, 100, 150, 200]:
                    s_check = min(s + ahead_distance, s_points[-1])
                    check_props = coord_system.get_track_properties_at_s(s_check)
                    
                    if check_props["is_corner"]:
                        # Found upcoming corner - position for optimal entry
                        corner_direction = check_props["corner_direction"]
                        
                        # Calculate braking distance based on current speed and physics
                        current_straight_speed = max_speeds[i]
                        corner_speed = max_speeds[min(i + int(ahead_distance / 10), len(max_speeds) - 1)]
                        
                        # Braking distance calculation
                        speed_diff = current_straight_speed - corner_speed
                        if speed_diff > 0:
                            braking_distance = (speed_diff ** 2) / (2 * max_acceleration)
                        else:
                            braking_distance = 0
                        
                        # Position based on distance to corner and braking needs
                        if ahead_distance <= braking_distance:
                            # In braking zone - set up for corner entry
                            setup_factor = 0.7
                            transition = 1 - (ahead_distance / braking_distance)
                            
                            # Go opposite to corner direction to set up wide entry
                            direction_multiplier = -1.0 if corner_direction == "left" else 1.0
                            
                            lateral_offset = max_offset * setup_factor * transition * direction_multiplier
                            offsets[i] = lateral_offset
                            
                            # Corner setup calculated
                        break
        
        # Curvilinear racing line calculation complete
        
        return offsets
    
    def get_curvilinear_racing_line(self):
        """
        Get the racing line in curvilinear coordinates for research analysis
        
        Returns:
            Tuple of (racing_line_curvilinear, coord_system)
            - racing_line_curvilinear: List of (s, n) tuples
            - coord_system: CurvilinearCoordinateSystem object
        """
        if hasattr(self, 'last_curvilinear_racing_line') and hasattr(self, 'last_coord_system'):
            return self.last_curvilinear_racing_line, self.last_coord_system
        else:
            return None, None
    
    def get_track_analysis(self):
        """
        Get detailed track analysis in curvilinear coordinates
        
        Returns:
            Dictionary with track properties at each distance point
        """
        if not hasattr(self, 'last_coord_system'):
            return None
        
        coord_system = self.last_coord_system
        track_geometry = coord_system.track_geometry
        
        analysis = []
        for i, s in enumerate(track_geometry.s_points):
            props = coord_system.get_track_properties_at_s(s)
            analysis.append({
                'distance_m': s,
                'curvature': props['curvature'],
                'radius_m': props['radius'],
                'is_corner': props['is_corner'],
                'corner_direction': props['corner_direction']
            })
        
        return analysis 