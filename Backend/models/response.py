from pydantic import BaseModel
from typing import List, Dict, Any

class OptimalLine(BaseModel):
    """
    Optimal racing line result for a single car
    
    Attributes:
        car_id (str): ID of the car this line was calculated for
        coordinates (List[List[float]]): List of (x,y) coordinates for the optimal line
        speeds (List[float]): List of speeds at each point
        lap_time (float): Estimated lap time in seconds
    """
    car_id: str
    coordinates: List[List[float]]
    speeds: List[float]
    lap_time: float

class SimulationResponse(BaseModel):
    """
    Response model for simulation results
    
    Attributes:
        optimal_lines (List[OptimalLine]): List of optimal racing lines, one per car
    """
    optimal_lines: List[OptimalLine] 