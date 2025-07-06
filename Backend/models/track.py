from pydantic import BaseModel, Field
from typing import List, Tuple

class Car(BaseModel):
    """
    Car model with physical parameters
    
    Attributes:
        id (str): Unique identifier for the car
        mass (float): Mass of the car in kg
        length (float): Length of the car in meters
        max_steering_angle (float): Maximum steering angle in degrees
        max_acceleration (float): Maximum acceleration in m/s²
    """
    id: str
    mass: float = Field(..., gt=0, description="Mass of the car in kg")
    length: float = Field(..., gt=0, description="Length of the car in meters")
    max_steering_angle: float = Field(..., gt=0, lt=90, description="Maximum steering angle in degrees")
    max_acceleration: float = Field(..., gt=0, description="Maximum acceleration in m/s²")

class Point(BaseModel):
    x: float
    y: float

class Track(BaseModel):
    """
    Track model with geometry and physical parameters
    
    Attributes:
        track_points (List[Point]): List of points defining the track centerline
        curvature (List[float]): List of curvature values along the track
        track_length (float): Length of the track in meters
        message (str): Additional message about the track
    """
    track_points: List[Point]
    curvature: List[float]
    track_length: float
    message: str
    width: float = Field(..., gt=0, description="Width of the track in meters")
    friction: float = Field(..., gt=0, lt=2.0, description="Friction coefficient")
    cars: List[Car] = Field(default_factory=list, description="List of cars to simulate")

class TrackInput(BaseModel):
    """
    Model for receiving track parameters from frontend
    """
    trackWidth: float = Field(..., description="Width of the track in meters")
    trackLength: float = Field(..., description="Length of the track in kilometers")
    discretizationStep: float = Field(..., description="Step size for track discretization") 