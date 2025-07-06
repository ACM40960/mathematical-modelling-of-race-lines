from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from simulation.optimizer import optimize_racing_line
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

@app.get("/")
async def root():
    """
    Root endpoint - Health check
    """
    return {"status": "healthy", "message": "Racing Line Optimizer API is running"}

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_racing_line(track: Track):
    """
    Calculate optimal racing line for given track and car parameters
    
    Args:
        track (Track): Track data including track points and parameters
        
    Returns:
        SimulationResponse: Optimal racing lines for each car
        
    Raises:
        HTTPException: If track data is invalid or simulation fails
    """
    try:
        # Print received JSON data
        print("\nReceived JSON Data:")
        print(json.dumps(track.model_dump(), indent=2))
        
        # Validate track data
        if len(track.track_points) < 3:
            raise HTTPException(
                status_code=400,
                detail="Track must have at least 3 points"
            )
        
        # Print received track points
        print("\nReceived Track Points:")
        for i, point in enumerate(track.track_points):
            print(f"Point {i}: ({point.x}, {point.y})")
            
        # Convert track points to numpy array for processing
        track_points = np.array([(p.x, p.y) for p in track.track_points])
        
        # Calculate optimal racing line for each car
        optimal_lines = []
        for car in track.cars:
            try:
                print(f"\nOptimizing racing line for car {car.id}:")
                print(f"Car parameters: mass={car.mass}kg, length={car.length}m, "
                      f"max_steering_angle={car.max_steering_angle}°, "
                      f"max_acceleration={car.max_acceleration}m/s²")
                
                optimal_line = optimize_racing_line(
                    track_points,
                    track.width,
                    track.friction,
                    car
                )
                
                print("\nOptimized Racing Line Coordinates:")
                for i, point in enumerate(optimal_line):
                    print(f"Point {i}: ({point[0]:.2f}, {point[1]:.2f})")
                
                optimal_lines.append({
                    "car_id": car.id,
                    "coordinates": optimal_line.tolist(),
                    "speeds": [],  # To be implemented
                    "lap_time": 0.0  # To be implemented
                })
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to optimize racing line for car {car.id}: {str(e)}"
                )
                
        response = SimulationResponse(optimal_lines=optimal_lines)
        
        # Print response JSON data
        print("\nSending Response JSON Data:")
        print(json.dumps(response.model_dump(), indent=2))
                
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )

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