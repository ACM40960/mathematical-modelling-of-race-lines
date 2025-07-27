from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sqlalchemy.orm import Session
from simulation.optimizer_new import optimize_racing_line, RacingLineModel, get_available_models
from models.track import Track, Car, TrackInput, PredefinedTrack, TrackPreset, TrackListItem
from models.response import SimulationResponse
from database import get_db, create_tables
from track_data import get_sample_f1_tracks
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

@app.on_event("startup")
async def startup_event():
    """Initialize database tables and populate with sample data"""
    try:
        create_tables()
        print("Database tables created successfully")
        
        # Get existing track names to avoid duplicates
        db = next(get_db())
        existing_track_names = {track.name for track in db.query(PredefinedTrack).all()}
        
        # Get sample tracks and add any that don't exist
        sample_tracks = get_sample_f1_tracks()
        new_tracks_added = 0
        
        for track_data in sample_tracks:
            if track_data["name"] not in existing_track_names:
                db_track = PredefinedTrack(**track_data)
                db.add(db_track)
                new_tracks_added += 1
                print(f"Added new track: {track_data['name']}")
        
        if new_tracks_added > 0:
            db.commit()
            print(f"Added {new_tracks_added} new tracks to database")
        else:
            print("No new tracks to add")
            
        # Show total track count
        total_tracks = db.query(PredefinedTrack).count()
        print(f"Total tracks in database: {total_tracks}")
        
        db.close()
    except Exception as e:
        print(f"Database initialization error: {e}")

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

    # Debug info for track points
    print(f"Track points sample: {request.track_points[:3] if len(request.track_points) > 3 else request.track_points}")

    
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
        return {
            "models": [
                {
                    "id": "physics_based",
                    "name": "Physics-Based Model",
                    "description": "Based on research paper with vehicle dynamics",
                    "track_usage": "70%",
                    "characteristics": ["Research-based", "Aggressive", "Realistic"]
                },
                {
                    "id": "basic",
                    "name": "Basic Model",
                    "description": "Simple geometric approach",
                    "track_usage": "60%",
                    "characteristics": ["Simple", "Smooth", "Learning-friendly"]
                }
            ]
        }

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

@app.get("/tracks", response_model=List[TrackListItem])
async def get_tracks_list(
    circuit_type: Optional[str] = None, 
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of available predefined tracks with optional filtering
    """
    try:
        query = db.query(PredefinedTrack).filter(PredefinedTrack.is_active == True)
        
        if circuit_type:
            query = query.filter(PredefinedTrack.circuit_type == circuit_type)
        if country:
            query = query.filter(PredefinedTrack.country.ilike(f"%{country}%"))
            
        tracks = query.all()
        
        return [
            TrackListItem(
                id=track.id,
                name=track.name,
                country=track.country,
                circuit_type=track.circuit_type,
                track_length=track.track_length,
                difficulty_rating=track.difficulty_rating,
                preview_image_url=track.preview_image_url,
                number_of_turns=track.number_of_turns
            )
            for track in tracks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tracks/{track_id}", response_model=TrackPreset)
async def get_track_by_id(track_id: int, db: Session = Depends(get_db)):
    """
    Get full track data by ID for simulation
    """
    try:
        track = db.query(PredefinedTrack).filter(
            PredefinedTrack.id == track_id,
            PredefinedTrack.is_active == True
        ).first()
        
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        # Convert track_points from JSON to TrackPoint objects
        from models.track import TrackPoint
        track_points = [TrackPoint(**point) for point in track.track_points]
        
        return TrackPreset(
            id=track.id,
            name=track.name,
            country=track.country,
            circuit_type=track.circuit_type,
            track_points=track_points,
            width=track.width,
            friction=track.friction,
            track_length=track.track_length,
            description=track.description,
            preview_image_url=track.preview_image_url,
            difficulty_rating=track.difficulty_rating,
            elevation_change=track.elevation_change,
            number_of_turns=track.number_of_turns,
            fastest_lap_time=track.fastest_lap_time,
            year_built=track.year_built
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tracks/filter/countries")
async def get_available_countries(db: Session = Depends(get_db)):
    """
    Get list of countries that have tracks in the database
    """
    try:
        countries = db.query(PredefinedTrack.country).filter(
            PredefinedTrack.is_active == True
        ).distinct().all()
        
        return {"countries": [country[0] for country in countries]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tracks/filter/types")
async def get_available_circuit_types(db: Session = Depends(get_db)):
    """
    Get list of circuit types available in the database
    """
    try:
        types = db.query(PredefinedTrack.circuit_type).filter(
            PredefinedTrack.is_active == True
        ).distinct().all()
        
        return {"circuit_types": [circuit_type[0] for circuit_type in types]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
    
