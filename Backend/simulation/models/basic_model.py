"""
Basic racing line model
Simple geometric approach for clean, smooth racing lines
"""
import numpy as np
from scipy.ndimage import gaussian_filter1d
from .base_model import BaseRacingLineModel


class BasicModel(BaseRacingLineModel):
    """
    Basic Racing Line Model
    
    Simple geometric approach that creates clean, smooth racing lines.
    Good for learning and general racing applications.
    """
    
    def __init__(self):
        super().__init__(
            name="Basic Model",
            description="Simple geometric approach",
            track_usage="60%",
            characteristics=["Simple", "Smooth", "Learning-friendly"]
        )
    
    def calculate_racing_line(self, track_points: np.ndarray, curvature: np.ndarray, track_width: float) -> np.ndarray:
        """
        Calculate racing line using basic geometric approach
        
        Features:
        - Simple corner detection
        - Smooth curves
        - Conservative track usage
        - Easy to understand
        """
        racing_line = track_points.copy()
        n_points = len(track_points)
        
        # Ensure curvature is finite
        curvature = np.where(np.isfinite(curvature), curvature, 0.0)
        
        # Calculate track vectors
        direction_vectors, perpendicular_vectors = self.calculate_track_vectors(track_points)
        
        # Conservative track width usage
        max_offset = track_width * 0.3  # Use 30% of track width (60% total)
        
        # Smooth curvature for better corner detection
        try:
            smoothed_curvature = gaussian_filter1d(curvature, sigma=5.0)
            smoothed_curvature = np.where(np.isfinite(smoothed_curvature), smoothed_curvature, 0.0)
        except:
            smoothed_curvature = curvature
        
        # Conservative corner detection for cleaner lines
        curvature_threshold = 0.005
        
        for i in range(n_points):
            if i < 5 or i > n_points - 5:
                continue
                
            # Conservative offset based on curvature
            if abs(smoothed_curvature[i]) > curvature_threshold:
                # In a corner - move toward the inside for a good racing line
                corner_direction = -np.sign(smoothed_curvature[i])
                
                # Calculate offset magnitude based on corner severity (conservative)
                corner_severity = min(abs(smoothed_curvature[i]) * 200, 1.0)
                offset_magnitude = max_offset * corner_severity * 0.6
                
                # Look ahead to see if we should position for corner exit
                look_ahead = min(i + 12, n_points - 1)
                avg_curvature_ahead = np.mean(np.abs(smoothed_curvature[i:look_ahead]))
                
                if avg_curvature_ahead < curvature_threshold:
                    # Straight ahead - position for corner exit
                    offset_magnitude *= 0.7  # Slightly more conservative
                
                offset = perpendicular_vectors[i] * offset_magnitude * corner_direction
                racing_line[i] = track_points[i] + offset
            else:
                # On straights - look for upcoming corners (conservative)
                look_ahead_distance = min(12, n_points - i - 1)
                upcoming_corner_idx = None
                
                for j in range(i + 1, i + look_ahead_distance + 1):
                    if j < n_points and abs(smoothed_curvature[j]) > curvature_threshold:
                        upcoming_corner_idx = j
                        break
                
                if upcoming_corner_idx is not None:
                    # Position for optimal corner entry (conservative)
                    upcoming_corner_direction = -np.sign(smoothed_curvature[upcoming_corner_idx])
                    setup_offset = max_offset * 0.5 * (-upcoming_corner_direction)
                    
                    distance_to_corner = upcoming_corner_idx - i
                    transition_factor = max(0.1, 1 - (distance_to_corner / look_ahead_distance))
                    
                    offset = perpendicular_vectors[i] * setup_offset * transition_factor
                    racing_line[i] = track_points[i] + offset
        
        # Apply boundary constraints
        racing_line = self.apply_boundary_constraints(racing_line, track_points, max_offset)
        
        # Apply heavy smoothing for very clean lines
        racing_line = self.smooth_racing_line(racing_line, smoothing_level="heavy")
        
        # Ensure the racing line is properly closed for closed tracks
        if len(track_points) > 2 and np.allclose(track_points[0], track_points[-1], atol=1e-3):
            # This is a closed track, ensure the racing line is also closed
            if not np.allclose(racing_line[0], racing_line[-1], atol=1e-3):
                racing_line[-1] = racing_line[0]  # Force the last point to match the first
        
        return racing_line 