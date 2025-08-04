from pydantic import BaseModel, Field
from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

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

class PredefinedTrack(Base):
    """
    Database model for storing predefined F1 tracks
    """
    __tablename__ = "predefined_tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    country = Column(String(50), nullable=False)
    circuit_type = Column(String(20), nullable=False)  # 'street', 'permanent', 'temporary'
    track_points = Column(JSON, nullable=False)  # List of {x, y} coordinates
    width = Column(Float, nullable=False)
    friction = Column(Float, nullable=False, default=0.7)
    track_length = Column(Float, nullable=False)  # in meters
    description = Column(Text, nullable=True)
    preview_image_url = Column(String(255), nullable=True)
    difficulty_rating = Column(Integer, nullable=False, default=3)  # 1-5 scale
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Track characteristics
    elevation_change = Column(Float, nullable=True)  # total elevation change in meters
    number_of_turns = Column(Integer, nullable=True)
    fastest_lap_time = Column(Float, nullable=True)  # in seconds (F1 record)
    year_built = Column(Integer, nullable=True)

class TrackPreset(BaseModel):
    """
    Pydantic model for track presets (API responses)
    """
    id: int
    name: str
    country: str
    circuit_type: str
    track_points: List[TrackPoint]
    width: float
    friction: float
    track_length: float
    description: Optional[str] = None
    preview_image_url: Optional[str] = None
    difficulty_rating: int
    elevation_change: Optional[float] = None
    number_of_turns: Optional[int] = None
    fastest_lap_time: Optional[float] = None
    year_built: Optional[int] = None

class TrackListItem(BaseModel):
    """
    Simplified track model for listing/gallery view
    """
    id: int
    name: str
    country: str
    circuit_type: str
    track_length: float
    difficulty_rating: int
    preview_image_url: Optional[str] = None
    number_of_turns: Optional[int] = None 