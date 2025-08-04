"""
Curvilinear Coordinate System for Track-Relative Vehicle Dynamics
Based on Oxford Research Paper differential geometry approach
"""
import numpy as np
from typing import Tuple, NamedTuple, Optional
from scipy.interpolate import interp1d
try:
    from scipy.integrate import cumtrapz
except ImportError:
    # For newer SciPy versions (>= 1.12.0)
    from scipy.integrate import cumulative_trapezoid as cumtrapz


class CurvilinearState(NamedTuple):
    """Vehicle state in curvilinear coordinates"""
    s: float      # Distance along track centerline (m)
    n: float      # Lateral displacement from centerline (m)  
    xi: float     # Relative angle between vehicle and track (rad)
    s_dot: float  # Rate of distance traveled (m/s)
    n_dot: float  # Rate of lateral displacement (m/s)
    xi_dot: float # Rate of relative angle change (rad/s)


class TrackGeometry(NamedTuple):
    """Track geometric properties"""
    s_points: np.ndarray      # Distance points along centerline
    curvature: np.ndarray     # Track curvature κ(s) at each point
    centerline: np.ndarray    # Centerline points (x,y)
    tangent_vectors: np.ndarray    # Track tangent vectors t(s)
    normal_vectors: np.ndarray     # Track normal vectors n(s)
    track_width: float        # Half-width of track


class CurvilinearCoordinateSystem:
    """
    Implementation of curvilinear coordinate system for racing line optimization
    
    Implements the coordinate transformation and kinematic equations from the
    Oxford research paper (Equations 1-6).
    """
    
    def __init__(self, track_centerline: np.ndarray, track_width: float):
        """
        Initialize curvilinear coordinate system for a track
        
        Args:
            track_centerline: Array of (x,y) points defining track centerline
            track_width: Half-width of the track in meters
        """
        self.track_centerline = track_centerline
        self.track_width = track_width
        
        # Calculate track geometry
        self.track_geometry = self._calculate_track_geometry()
        
        # Curvilinear coordinate system initialized
    
    def _calculate_track_geometry(self) -> TrackGeometry:
        """Calculate fundamental track geometric properties"""
        
        # Calculate tangent vectors (track direction)
        tangent_vectors = np.diff(self.track_centerline, axis=0)
        # Add final point to match array size
        tangent_vectors = np.vstack([tangent_vectors, tangent_vectors[-1]])
        
        # Normalize tangent vectors
        tangent_norms = np.linalg.norm(tangent_vectors, axis=1)
        tangent_norms = np.where(tangent_norms == 0, 1, tangent_norms)  # Avoid division by zero
        tangent_vectors = tangent_vectors / tangent_norms[:, np.newaxis]
        
        # Calculate normal vectors (perpendicular to track)
        normal_vectors = np.array([-tangent_vectors[:, 1], tangent_vectors[:, 0]]).T
        
        # Calculate distance along centerline
        segment_lengths = np.linalg.norm(np.diff(self.track_centerline, axis=0), axis=1)
        s_points = np.concatenate([[0], np.cumsum(segment_lengths)])
        
        # Calculate curvature κ(s)
        curvature = self._calculate_curvature(tangent_vectors, s_points)
        
        return TrackGeometry(
            s_points=s_points,
            curvature=curvature,
            centerline=self.track_centerline,
            tangent_vectors=tangent_vectors,
            normal_vectors=normal_vectors,
            track_width=self.track_width
        )
    
    def _calculate_curvature(self, tangent_vectors: np.ndarray, s_points: np.ndarray) -> np.ndarray:
        """
        Calculate track curvature κ(s) = dθ/ds
        
        Args:
            tangent_vectors: Normalized tangent vectors
            s_points: Distance points along centerline
            
        Returns:
            Curvature array κ(s)
        """
        # Calculate track angle θ(s)
        track_angles = np.arctan2(tangent_vectors[:, 1], tangent_vectors[:, 0])
        
        # Handle angle wraparound
        track_angles = np.unwrap(track_angles)
        
        # Calculate curvature as dθ/ds
        curvature = np.zeros_like(track_angles)
        
        for i in range(1, len(track_angles) - 1):
            # Central difference for interior points
            ds_forward = s_points[i+1] - s_points[i]
            ds_backward = s_points[i] - s_points[i-1]
            
            if ds_forward > 0 and ds_backward > 0:
                dtheta_forward = track_angles[i+1] - track_angles[i]
                dtheta_backward = track_angles[i] - track_angles[i-1]
                
                # Weighted average for better numerical stability
                weight_forward = 1.0 / ds_forward
                weight_backward = 1.0 / ds_backward
                total_weight = weight_forward + weight_backward
                
                curvature[i] = (weight_forward * dtheta_forward / ds_forward + 
                              weight_backward * dtheta_backward / ds_backward) / total_weight
        
        # Handle boundary points
        if len(curvature) > 2:
            curvature[0] = curvature[1]
            curvature[-1] = curvature[-2]
        
        # Smooth curvature to reduce numerical noise
        from scipy.ndimage import gaussian_filter1d
        curvature = gaussian_filter1d(curvature, sigma=1.0)
        
        return curvature
    
    def transform_to_curvilinear(self, global_position: np.ndarray, 
                                global_heading: float) -> Tuple[float, float, float]:
        """
        Transform global coordinates to curvilinear coordinates (s, n, ξ)
        
        Args:
            global_position: (x, y) position in global coordinates
            global_heading: Vehicle heading in global frame (radians)
            
        Returns:
            Tuple of (s, n, xi) curvilinear coordinates
        """
        # Find closest point on track centerline
        distances = np.linalg.norm(self.track_centerline - global_position, axis=1)
        closest_idx = np.argmin(distances)
        
        # Get distance along centerline (s coordinate)
        s = self.track_geometry.s_points[closest_idx]
        
        # Calculate lateral displacement (n coordinate)
        # Vector from centerline to vehicle position
        displacement_vector = global_position - self.track_centerline[closest_idx]
        
        # Project displacement onto track normal to get signed lateral distance
        normal_vector = self.track_geometry.normal_vectors[closest_idx]
        n = np.dot(displacement_vector, normal_vector)
        
        # Calculate relative angle (ξ coordinate)
        # Track heading at this point
        track_tangent = self.track_geometry.tangent_vectors[closest_idx]
        track_heading = np.arctan2(track_tangent[1], track_tangent[0])
        
        # Relative angle between vehicle and track
        xi = global_heading - track_heading
        
        # Normalize xi to [-π, π]
        xi = np.arctan2(np.sin(xi), np.cos(xi))
        
        return s, n, xi
    
    def transform_to_global(self, s: float, n: float, xi: float) -> Tuple[np.ndarray, float]:
        """
        Transform curvilinear coordinates back to global coordinates
        
        Args:
            s: Distance along centerline
            n: Lateral displacement  
            xi: Relative angle
            
        Returns:
            Tuple of (global_position, global_heading)
        """
        # Interpolate track properties at distance s
        if s < self.track_geometry.s_points[0]:
            s = self.track_geometry.s_points[0]
        elif s > self.track_geometry.s_points[-1]:
            s = self.track_geometry.s_points[-1]
        
        # Find track state at position s
        centerline_interp = interp1d(self.track_geometry.s_points, 
                                   self.track_centerline, axis=0, kind='linear')
        normal_interp = interp1d(self.track_geometry.s_points,
                               self.track_geometry.normal_vectors, axis=0, kind='linear')
        tangent_interp = interp1d(self.track_geometry.s_points,
                                self.track_geometry.tangent_vectors, axis=0, kind='linear')
        
        centerline_pos = centerline_interp(s)
        normal_vector = normal_interp(s)
        tangent_vector = tangent_interp(s)
        
        # Calculate global position
        global_position = centerline_pos + n * normal_vector
        
        # Calculate global heading
        track_heading = np.arctan2(tangent_vector[1], tangent_vector[0])
        global_heading = track_heading + xi
        
        return global_position, global_heading
    
    def kinematic_equations(self, curvilinear_state: CurvilinearState,
                          velocity_components: Tuple[float, float, float]) -> CurvilinearState:
        """
        Implement kinematic equations from research paper (Equations 1-3, 5-6)
        
        Args:
            curvilinear_state: Current state (s, n, ξ, ṡ, ṅ, ξ̇)
            velocity_components: (u, v, ω) - longitudinal, lateral, yaw rate
            
        Returns:
            State derivatives (ṡ, ṅ, ξ̇, s̈, n̈, ξ̈)
        """
        s, n, xi, s_dot_prev, n_dot_prev, xi_dot_prev = curvilinear_state
        u, v, omega = velocity_components
        
        # Get curvature at current position
        curvature_interp = interp1d(self.track_geometry.s_points,
                                  self.track_geometry.curvature, kind='linear')
        C = float(curvature_interp(max(0, min(s, self.track_geometry.s_points[-1]))))
        
        # Research paper equations (1-3):
        # ṡ = (u cos ξ - v sin ξ) / (1 - nC)
        denominator = 1.0 - n * C
        if abs(denominator) < 1e-6:
            denominator = 1e-6  # Avoid singularity
        
        s_dot = (u * np.cos(xi) - v * np.sin(xi)) / denominator
        
        # ṅ = u sin ξ + v cos ξ  
        n_dot = u * np.sin(xi) + v * np.cos(xi)
        
        # ξ̇ = ψ̇ - Cṡ = ω - C*s_dot
        xi_dot = omega - C * s_dot
        
        # For derivatives, we'd need acceleration components (not implemented yet)
        s_ddot = 0.0  # Placeholder
        n_ddot = 0.0  # Placeholder
        xi_ddot = 0.0 # Placeholder
        
        return CurvilinearState(s_dot, n_dot, xi_dot, s_ddot, n_ddot, xi_ddot)
    
    def get_track_properties_at_s(self, s: float) -> dict:
        """
        Get track properties at a specific distance s
        
        Args:
            s: Distance along centerline
            
        Returns:
            Dictionary with track properties
        """
        if s < self.track_geometry.s_points[0] or s > self.track_geometry.s_points[-1]:
            s = max(self.track_geometry.s_points[0], 
                   min(s, self.track_geometry.s_points[-1]))
        
        # Interpolate properties
        curvature_interp = interp1d(self.track_geometry.s_points,
                                  self.track_geometry.curvature, kind='linear')
        centerline_interp = interp1d(self.track_geometry.s_points,
                                   self.track_centerline, axis=0, kind='linear')
        
        curvature = float(curvature_interp(s))
        centerline_pos = centerline_interp(s)
        radius = 1.0 / abs(curvature) if abs(curvature) > 1e-10 else float('inf')
        
        return {
            "s": s,
            "curvature": curvature,
            "radius": radius,
            "centerline_position": centerline_pos,
            "track_width": self.track_width,
            "is_corner": abs(curvature) > 0.001,
            "corner_direction": "left" if curvature > 0 else "right" if curvature < 0 else "straight"
        }
    
    def validate_track_position(self, s: float, n: float) -> bool:
        """
        Check if a curvilinear position is within track boundaries
        
        Args:
            s: Distance along centerline
            n: Lateral displacement
            
        Returns:
            True if position is within track bounds
        """
        # Check s bounds
        if s < 0 or s > self.track_geometry.s_points[-1]:
            return False
        
        # Check n bounds (track width)
        if abs(n) > self.track_width:
            return False
        
        return True


def create_curvilinear_system(track_centerline: np.ndarray, 
                             track_width: float) -> CurvilinearCoordinateSystem:
    """
    Factory function to create curvilinear coordinate system
    
    Args:
        track_centerline: Array of (x,y) centerline points
        track_width: Half-width of track in meters
        
    Returns:
        Initialized CurvilinearCoordinateSystem
    """
    return CurvilinearCoordinateSystem(track_centerline, track_width)