from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sqlalchemy.orm import Session
from simulation.optimizer import optimize_racing_line, RacingLineModel, get_available_models
from schemas.track import Track, Car, TrackInput, PredefinedTrack, TrackPreset, TrackListItem
from schemas.response import SimulationResponse
from database import get_db, create_tables
from data.track_data import get_sample_f1_tracks
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
        # Database tables created
        
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
        
        if new_tracks_added > 0:
            db.commit()
            print(f"Added {new_tracks_added} new tracks to database")
        
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
    print("\n" + "="*80)
    print("🏁 SIMULATION REQUEST RECEIVED")
    print("="*80)
    print(f"📊 Request Details:")
    print(f"  • Track Points: {len(request.track_points)} points")
    print(f"  • Track Width: {request.width}m")
    print(f"  • Track Friction: {request.friction}")
    print(f"  • Cars: {len(request.cars)} car(s)")
    print(f"  • Model: {request.model}")
    
    for i, car_data in enumerate(request.cars):
        print(f"  • Car {i+1}: {car_data.get('team_name', 'Unknown')}")
        print(f"    - Mass: {car_data.get('mass', 'N/A')}kg")
        print(f"    - Drag Coeff: {car_data.get('drag_coefficient', 'N/A')}")
        print(f"    - Lift Coeff: {car_data.get('lift_coefficient', 'N/A')}")

    try:
        # Convert request to Track object
        print(f"\n🛤️  TRACK PROCESSING:")
        from schemas.track import TrackPoint
        track_points = [TrackPoint(x=p['x'], y=p['y']) for p in request.track_points]
        print(f"  • Converting {len(track_points)} points to TrackPoint objects")
        print(f"  • First point: ({track_points[0].x:.2f}, {track_points[0].y:.2f})")
        print(f"  • Last point: ({track_points[-1].x:.2f}, {track_points[-1].y:.2f})")
        
        cars = [Car(**car_data) for car_data in request.cars]
        print(f"  • Converting {len(cars)} car objects")
        
        track = Track(
            track_points=track_points,
            width=request.width,
            friction=request.friction,
            cars=cars
        )
        print(f"  • Track object created successfully")
        
        # Track object created successfully
        
        # Validate and set the model
        print(f"\n🧠 MODEL VALIDATION:")
        print(f"  • Requested model: '{request.model}'")
        try:
            # get the requested model
            model = RacingLineModel(request.model)
            print(f"  • Model validated: {model}")
        except ValueError:
            print(f"  • ⚠️  Unknown model '{request.model}', using physics_based fallback")
            model = RacingLineModel.PHYSICS_BASED
        
        # Run simulation with the specified model
        print(f"\n🏎️  STARTING OPTIMIZATION:")
        print(f"  • Calling optimize_racing_line() with {model}")
        optimal_lines = optimize_racing_line(track, model)
        
        # Log simulation completion
        print(f"\n✅ SIMULATION COMPLETED:")
        print(f"  • Generated {len(optimal_lines)} racing line(s)")
        lap_times = [line.get('lap_time', 0) for line in optimal_lines]
        if lap_times and any(t > 0 for t in lap_times):
            valid_times = [t for t in lap_times if t > 0]
            print(f"  • Lap times: {valid_times}")
            print(f"  • Fastest lap: {min(valid_times):.2f}s")
        else:
            print(f"  • No valid lap times calculated")
        
        for i, line in enumerate(optimal_lines):
            if 'racing_line' in line:
                print(f"  • Car {i+1}: {len(line['racing_line'])} racing line points")
        print("="*80)
        
        return {"optimal_lines": optimal_lines}
    except Exception as e:
        print(f"\n❌ SIMULATION FAILED:")
        print(f"  • Error: {str(e)}")
        print(f"  • Type: {type(e).__name__}")
        import traceback
        print(f"  • Traceback:")
        traceback.print_exc()
        print("="*80)
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
        # Fallback models if error occurs
        return {
            "models": [
                {
                    "id": "physics_based",
                    "name": "Physics-Based Model",
                    "description": "Based on research paper with vehicle dynamics",
                    # this factor essentially describes how aggressive the car is when at corners
                    "track_usage": "80%", 
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
        from schemas.track import TrackPoint
        track_points = [TrackPoint(**point) for point in track.track_points]
        
        # returning track metadata with the track points
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
