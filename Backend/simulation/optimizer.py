import numpy as np
from scipy.optimize import minimize
from typing import List, Tuple
from models.track import Car

def compute_curvature(points: np.ndarray) -> np.ndarray:
    """
    Compute the curvature at each point of the racing line
    
    Args:
        points (np.ndarray): Array of (x,y) coordinates
        
    Returns:
        np.ndarray: Curvature at each point
    """
    # Calculate first derivatives
    dx_dt = np.gradient(points[:, 0])
    dy_dt = np.gradient(points[:, 1])
    
    # Calculate second derivatives
    d2x_dt2 = np.gradient(dx_dt)
    d2y_dt2 = np.gradient(dy_dt)
    
    # Calculate curvature using the formula: κ = |x'y'' - y'x''| / (x'² + y'²)^(3/2)
    curvature = np.abs(dx_dt * d2y_dt2 - dy_dt * d2x_dt2) / (dx_dt * dx_dt + dy_dt * dy_dt)**1.5
    
    return curvature

def calculate_racing_line_cost(
    racing_line: np.ndarray,
    track_center: np.ndarray,
    track_width: float,
    friction: float,
    car: Car
) -> float:
    """
    Calculate the cost of a racing line based on multiple factors:
    1. Distance from track center
    2. Curvature (smoother is better)
    3. Track limits
    4. Physical constraints (friction, car capabilities)
    
    Args:
        racing_line (np.ndarray): Proposed racing line coordinates
        track_center (np.ndarray): Track centerline coordinates
        track_width (float): Width of the track
        friction (float): Track friction coefficient
        car (Car): Car parameters
        
    Returns:
        float: Cost value (lower is better)
    """
    # Reshape racing line if it's flat
    racing_line = racing_line.reshape(-1, 2)
    
    # Calculate distance from track center
    distances = np.linalg.norm(racing_line - track_center, axis=1)
    track_limit_violation = np.maximum(0, distances - track_width/2)
    
    # Calculate curvature
    curvature = compute_curvature(racing_line)
    
    # Calculate maximum allowed speed based on friction and curvature
    g = 9.81  # gravitational acceleration
    max_lateral_force = friction * g
    max_speed = np.sqrt(max_lateral_force / np.maximum(curvature, 1e-6))
    
    # Penalties
    distance_cost = np.mean(distances)
    curvature_cost = np.mean(curvature)
    track_violation_cost = 1000 * np.sum(track_limit_violation)  # Heavy penalty for track limits
    speed_cost = -np.mean(max_speed)  # Negative because we want to maximize speed
    
    # Total cost (weighted sum)
    total_cost = (
        0.3 * distance_cost +
        0.3 * curvature_cost +
        1.0 * track_violation_cost +
        0.4 * speed_cost
    )
    
    return total_cost

def optimize_racing_line(
    track_points: np.ndarray,
    track_width: float,
    friction: float,
    car: Car
) -> np.ndarray:
    """
    Find the optimal racing line for given track and car parameters
    
    Args:
        track_points (np.ndarray): Track centerline coordinates
        track_width (float): Width of the track
        friction (float): Track friction coefficient
        car (Car): Car parameters
        
    Returns:
        np.ndarray: Optimal racing line coordinates
    """
    # Initial guess: use track centerline
    initial_guess = track_points.flatten()
    
    # Define bounds to keep points within track limits
    bounds = []
    for i in range(len(track_points)):
        # x bounds
        bounds.append((
            track_points[i,0] - track_width/2,
            track_points[i,0] + track_width/2
        ))
        # y bounds
        bounds.append((
            track_points[i,1] - track_width/2,
            track_points[i,1] + track_width/2
        ))
    
    # Optimize racing line
    result = minimize(
        calculate_racing_line_cost,
        initial_guess,
        args=(track_points, track_width, friction, car),
        method='SLSQP',
        bounds=bounds
    )
    
    if not result.success:
        raise ValueError(f"Optimization failed: {result.message}")
    
    # Return optimized racing line
    return result.x.reshape(-1, 2) 