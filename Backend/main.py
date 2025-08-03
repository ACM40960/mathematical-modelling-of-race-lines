from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from simulation.optimizer_new import optimize_racing_line, RacingLineModel, get_available_models
from models.track import Track, Car, TrackInput
from models.response import SimulationResponse

import json

# Initialize FastAPI app
app = FastAPI(
    title="Racing Line Optimizer",
    description="API for optimizing racing lines on user-drawn tracks",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    """Request model for simulation with optional model parameter"""
    track_points: List[dict]
    width: float
    friction: float
    cars: List[dict]
    model: Optional[str] = "physics_based"

@app.get("/")
async def root():
    """
    Root endpoint - Health check
    """
    return {"status": "healthy", "message": "Racing Line Optimizer API is running"}

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_racing_line(request: SimulationRequest):
    """
    Calculate optimal racing line for given track and car parameters
    """
    print("\n=== SIMULATE ENDPOINT HIT ===")
    print("Received request with:")
    print(f"Number of track points: {len(request.track_points)}")
    print(f"Track width: {request.width}")
    print(f"Track friction: {request.friction}")
    print(f"Number of cars: {len(request.cars)}")
    print(f"Model: {request.model}")
    print("================================\n")
    
    try:
        # Convert request to Track object
        from models.track import TrackPoint
        track_points = [TrackPoint(x=p['x'], y=p['y']) for p in request.track_points]
        cars = [Car(**car_data) for car_data in request.cars]
        
        track = Track(
            track_points=track_points,
            width=request.width,
            friction=request.friction,
            cars=cars
        )
        
        # Validate and set the model
        try:
            model = RacingLineModel(request.model)
        except ValueError:
            print(f"Warning: Unknown model '{request.model}', using physics_based")
            model = RacingLineModel.PHYSICS_BASED
        
        # Run simulation with the specified model
        optimal_lines = optimize_racing_line(track, model)
        
        print("\n=== SIMULATION COMPLETED ===")
        print(f"Generated {len(optimal_lines)} optimal lines using {model.value} model")
        print("================================\n")
        
        return {"optimal_lines": optimal_lines}
    except Exception as e:
        print("\n=== SIMULATION ERROR ===")
        print(f"Error: {str(e)}")
        print("================================\n")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def get_models():
    """
    Get list of available racing line models
    """
    try:
        models = get_available_models()
        return {"models": models}
    except Exception as e:
        print(f"Error getting models: {e}")
        # Fallback models



@app.get("/api/track")
async def get_track():
    """
    Returns sample track data.
    In a real implementation, this would use the track parameters to generate the track.
    """
    # Sample track data - a simple circular track
    t = np.linspace(0, 2*np.pi, 100)
    radius = 100  # meters
    
    # Generate x, y coordinates for a circle
    x = radius * np.cos(t)
    y = radius * np.sin(t)
    
    # Calculate curvature (constant for a circle = 1/radius)
    curvature = np.full_like(t, 1/radius)
    
    return {
        "track_points": [{"x": float(x[i]), "y": float(y[i])} for i in range(len(t))],
        "curvature": [float(k) for k in curvature],
        "track_length": float(2 * np.pi * radius),  # Circumference
        "message": "Sample circular track generated"
    }

@app.post("/api/track")
async def process_track(track_data: TrackInput):
    """
    Receives and processes track data from the frontend
    """
    # Print received data
    print("\nReceived Track Data:")
    print(f"Track Width: {track_data.trackWidth} meters")
    print(f"Track Length: {track_data.trackLength} kilometers")
    print(f"Discretization Step: {track_data.discretizationStep}")
    
    return {
        "status": "success",
        "message": "Track data received successfully",
        "data": {
            "trackWidth": track_data.trackWidth,
            "trackLength": track_data.trackLength,
            "discretizationStep": track_data.discretizationStep
        }
    } 