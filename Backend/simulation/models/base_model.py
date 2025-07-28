"""
Base racing line model class
"""
import numpy as np
from abc import ABC, abstractmethod
from typing import Tuple
from scipy.ndimage import gaussian_filter1d
from scipy.interpolate import splprep, splev


class BaseRacingLineModel(ABC):
    """
    Abstract base class for racing line models
    """
    
    def __init__(self, name: str, description: str, track_usage: str, characteristics: list):
        self.name = name
        self.description = description
        self.track_usage = track_usage
        self.characteristics = characteristics
    
    @abstractmethod
    def calculate_racing_line(self, track_points: np.ndarray, curvature: np.ndarray, track_width: float) -> np.ndarray:
        """
        Calculate the racing line for given track points
        
        Args:
            track_points: Array of (x, y) coordinates defining the track centerline
            curvature: Array of curvature values at each point
            track_width: Width of the track in meters
            
        Returns:
            Array of (x, y) coordinates defining the racing line
        """
        pass
    
    def smooth_racing_line(self, racing_line: np.ndarray, smoothing_level: str = "medium") -> np.ndarray:
        """
        Apply smoothing to the racing line
        
        Args:
            racing_line: Array of (x, y) coordinates
            smoothing_level: "light", "medium", or "heavy"
            
        Returns:
            Smoothed racing line
        """
        try:
            # Define smoothing parameters based on level
            if smoothing_level == "light":
                sigmas = [0.5, 1.0]
                spline_smoothing = 0.05
            elif smoothing_level == "medium":
                sigmas = [0.8, 1.2, 1.8]
                spline_smoothing = 0.1
            elif smoothing_level == "heavy":
                sigmas = [1.0, 1.5, 2.0, 2.5]
                spline_smoothing = 0.15
            else:
                # Default to medium
                sigmas = [0.8, 1.2, 1.8]
                spline_smoothing = 0.1
            
            # Apply multiple passes of Gaussian smoothing
            for sigma in sigmas:
                racing_line[:, 0] = gaussian_filter1d(racing_line[:, 0], sigma=sigma)
                racing_line[:, 1] = gaussian_filter1d(racing_line[:, 1], sigma=sigma)
            
            # Additional B-spline smoothing for professional appearance
            tck, u = splprep([racing_line[:, 0], racing_line[:, 1]], 
                           s=len(racing_line) * spline_smoothing, per=False)
            u_new = np.linspace(0, 1, len(racing_line))
            x_smooth, y_smooth = splev(u_new, tck)
            racing_line = np.column_stack((x_smooth, y_smooth))
            
        except Exception as e:
            # Fallback to simple smoothing if B-spline fails
            print(f"Advanced smoothing failed, using fallback: {e}")
            try:
                sigma = 2.0 if smoothing_level == "heavy" else 1.5
                racing_line[:, 0] = gaussian_filter1d(racing_line[:, 0], sigma=sigma)
                racing_line[:, 1] = gaussian_filter1d(racing_line[:, 1], sigma=sigma)
            except:
                pass
        
        return racing_line
    
    def calculate_track_vectors(self, track_points: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate direction and perpendicular vectors for the track
        
        Args:
            track_points: Array of (x, y) coordinates
            
        Returns:
            Tuple of (direction_vectors, perpendicular_vectors)
        """
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
        
        return direction_vectors, perpendicular_vectors
    
    def apply_boundary_constraints(self, racing_line: np.ndarray, track_points: np.ndarray, 
                                 max_offset: float) -> np.ndarray:
        """
        Ensure racing line stays within track boundaries
        
        Args:
            racing_line: Current racing line
            track_points: Track centerline points
            max_offset: Maximum allowed offset from centerline
            
        Returns:
            Constrained racing line
        """
        for i in range(len(racing_line)):
            distance_from_center = np.linalg.norm(racing_line[i] - track_points[i])
            if distance_from_center > max_offset:
                # Scale down to stay within boundaries
                direction = racing_line[i] - track_points[i]
                scale_factor = max_offset / distance_from_center
                racing_line[i] = track_points[i] + direction * scale_factor
        
        return racing_line
    
    def get_model_info(self) -> dict:
        """
        Get model information for API responses
        
        Returns:
            Dictionary with model information
        """
        return {
            "name": self.name,
            "description": self.description,
            "track_usage": self.track_usage,
            "characteristics": self.characteristics
        } 