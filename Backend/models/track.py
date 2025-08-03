from pydantic import BaseModel, Field
from typing import List, Tuple, Optional
from enum import Enum

class Car(BaseModel):
    """
    Car model with physical parameters based on Perantoni & Limebeer's paper
    """
    id: str
    mass: float = Field(..., gt=0, description="Mass of the car in kg")
    length: float = Field(..., gt=0, description="Length of the car in meters")
    width: float = Field(..., gt=0, description="Width of the car in meters")
    max_steering_angle: float = Field(..., gt=0, lt=90, description="Maximum steering angle in degrees")
    max_acceleration: float = Field(..., gt=0, description="Maximum acceleration in m/s²")
    drag_coefficient: float = Field(default=1.0, gt=0, description="Drag coefficient (Cd)")
    lift_coefficient: float = Field(default=3.0, gt=0, description="Lift coefficient (Cl)")
    frontal_area: Optional[float] = Field(default=None, gt=0, description="Frontal area in m², calculated if not provided")
    
    @property
    def effective_frontal_area(self) -> float:
        """Calculate effective frontal area if not provided"""
        if self.frontal_area is not None:
            return self.frontal_area
        return self.length * self.width * 0.7  # Approximate 70% of rectangular area

class TrackPoint(BaseModel):
    """Single point on the track"""
    x: float
    y: float

class Track(BaseModel):
    """
    Track model with physical parameters
    """
    track_points: List[TrackPoint]
    width: float = Field(..., gt=0, description="Width of the track in meters")
    friction: float = Field(..., gt=0, lt=2.0, description="Coefficient of friction")
    cars: List[Car] = Field(default_factory=list, description="List of cars to simulate")

class TrackInput(BaseModel):
    """
    Model for receiving track parameters from frontend
    """
    trackWidth: float = Field(..., description="Width of the track in meters")
    trackLength: float = Field(..., description="Length of the track in kilometers")
    discretizationStep: float = Field(..., description="Step size for track discretization")

 