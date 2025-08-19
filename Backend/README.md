# F1 Racing Line Optimization - Backend API

A high-performance Python backend for Formula 1 racing line optimization featuring multiple algorithms, physics-based simulation, and comprehensive car parameter modeling. Built with FastAPI, SQLAlchemy, and advanced mathematical libraries for real-time racing line computation.

## Overview

This backend API provides comprehensive racing line optimization capabilities, featuring:

- **Multiple Racing Algorithms**: Basic geometric, Physics-based, and Kapania two-step models
- **Advanced Physics Simulation**: Real F1 car dynamics with aerodynamics and tire models
- **Track Database**: PostgreSQL storage for F1 circuit data with detailed specifications
- **Real-time Optimization**: Fast computation for interactive frontend integration
- **Multi-car Support**: Simultaneous optimization for multiple vehicles with collision avoidance

## Technology Stack

- **Framework**: FastAPI 0.104.1 for high-performance API
- **Database**: SQLAlchemy with PostgreSQL for track data persistence
- **Mathematics**: NumPy, SciPy for numerical computation and optimization
- **Physics**: Custom aerodynamics and curvilinear coordinate systems
- **API Documentation**: Automatic OpenAPI/Swagger documentation
- **CORS**: Cross-origin support for frontend integration

## Prerequisites

- **Python**: Version 3.8 or higher
- **PostgreSQL**: Version 15 or higher
- **pip**: Package installer for Python
- **Virtual Environment**: Recommended for dependency isolation

## Installation and Setup

### 1. Database Setup (macOS)
```bash
# Install PostgreSQL
brew install postgresql@15
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb f1_tracks_db
```

### 2. Backend Dependencies
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Start Development Server
```bash
# Ensure PostgreSQL is running
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

# Start FastAPI server
python3 -m uvicorn main:app --reload --port 8000
```

The API will be available at [http://localhost:8000](http://localhost:8000) with automatic documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

## Project Architecture

### Directory Structure

```
backend/
├── data/                          # Track data management
│   └── track_data.py             # F1 circuit definitions and sample data
├── schemas/                       # Pydantic data models
│   ├── track.py                  # Track, car, and geometry models
│   └── response.py               # API response schemas
├── simulation/                    # Core optimization algorithms
│   ├── algorithms/               # Racing line models
│   │   ├── base_model.py        # Abstract base class
│   │   ├── basic_model.py       # Geometric approach
│   │   ├── physics_model.py     # Physics-based optimization
│   │   └── kapania_model.py     # Two-step iterative algorithm
│   ├── aerodynamics.py          # F1 aerodynamic models
│   ├── curvilinear_coordinates.py # Track geometry system
│   └── optimizer.py             # Main optimization engine
├── tests/                        # Test suites and analysis
│   └── models/                   # Algorithm testing and validation
├── database.py                   # SQLAlchemy database configuration
├── main.py                       # FastAPI application entry point
├── requirements.txt              # Python dependencies
└── README.md                     # This documentation
```

### Core Components

#### main.py
FastAPI application server providing:
- RESTful API endpoints for racing line optimization
- CORS middleware for frontend integration
- Database initialization and track data seeding
- Comprehensive error handling and logging
- Automatic API documentation generation

#### simulation/optimizer.py
Main optimization engine featuring:
- Multi-algorithm racing line computation
- Speed profile calculation and lap time optimization
- Multi-car line separation with collision avoidance
- Real-time performance monitoring and logging
- Gaussian smoothing for professional line quality

#### simulation/algorithms/
Racing line algorithm implementations:
- **BaseRacingLineModel**: Abstract interface with common functionality
- **BasicModel**: Conservative geometric approach (60% track usage)
- **PhysicsBasedModel**: Lap time optimization with F1 physics (85% track usage)
- **KapaniaModel**: Research-grade two-step algorithm (85% track usage)

#### schemas/
Pydantic data models for:
- **Track**: Circuit geometry, width, friction, and car specifications
- **Car**: Complete vehicle parameters including mass, aerodynamics, and performance
- **TrackPoint**: 2D coordinate representation with validation
- **SimulationResponse**: Optimization results with racing lines and lap times

### Database Management

#### Track Data Storage
PostgreSQL database featuring:
- **Predefined Tracks**: 7 authentic F1 circuits with real specifications
- **Track Specifications**: Monaco, Baku, Silverstone, Suzuka, Spa, Monza, Interlagos
- **Automatic Initialization**: Database tables and sample data created on startup
- **Point Coordinates**: Detailed track geometry stored as JSON arrays

#### Data Models
SQLAlchemy models supporting:
- Track metadata (name, country, circuit type, difficulty rating)
- Geometric data (track points, width, friction coefficient)
- Performance characteristics (length, turn count, elevation changes)
- Historical data (year built, fastest lap times)

## API Endpoints

### Core Endpoints

#### POST /simulate
**Racing Line Optimization**
```json
{
  "track_points": [{"x": 0, "y": 0}, ...],
  "width": 12.0,
  "friction": 1.0,
  "cars": [{"mass": 798, "drag_coefficient": 1.0, ...}],
  "model": "physics_based"
}
```

#### GET /models
**Available Racing Models**
Returns list of available algorithms with characteristics and usage statistics.

#### GET /tracks
**Predefined Track Catalog**
Query parameters: `circuit_type`, `country` for filtering F1 circuits.

#### GET /tracks/{track_id}
**Detailed Track Data**
Complete track specification including geometry and metadata for simulation.

### Response Format
All optimization responses include:
- **Racing Lines**: Optimized path coordinates for each car
- **Lap Times**: Calculated performance metrics
- **Speed Profiles**: Velocity data along the racing line
- **Algorithm Metadata**: Model used and optimization parameters

## Racing Line Algorithms

### 1. Basic Model
**Conservative Geometric Approach**
- **Algorithm**: Simple corner detection with conservative offsets
- **Track Usage**: 60% (safe margins)
- **Performance**: Fast computation, smooth lines
- **Best For**: Educational use, baseline comparisons

### 2. Physics-Based Model
**Lap Time Optimization**
- **Algorithm**: Iterative physics simulation with F1 car dynamics
- **Track Usage**: 85% (aggressive optimization)
- **Physics**: Cornering speeds, aerodynamic forces, braking distances
- **Best For**: Realistic racing applications

### 3. Kapania Model
**Research-Grade Two-Step Algorithm**
- **Algorithm**: Forward-backward integration + convex path optimization
- **Track Usage**: 85% (research precision)
- **Method**: Stanford University's two-step iterative approach
- **Best For**: Research applications, maximum precision

## Physics and Mathematics

### Aerodynamic Modeling
```python
# Drag Force: F_drag = 0.5 × ρ × v² × C_d × A
# Downforce: F_down = 0.5 × ρ × v² × C_l × A
# Corner Speed: v_max = √(μ × (mg + F_down) / (m × κ))
```

### Lap Time Optimization
```python
# Objective Function: minimize ∫(1/v) ds
# Speed Constraints: v ≤ v_max(κ, aerodynamics)
# Path Constraints: stay within track boundaries
```

### Gaussian Filtering
Applied for:
- **Curvature Smoothing**: Noise reduction in geometric calculations
- **Path Smoothing**: Professional racing line appearance
- **Speed Smoothing**: Realistic acceleration profiles

## Multi-Car Support

### Line Separation Algorithm
- **Offset Calculation**: Perpendicular vector-based positioning
- **Collision Avoidance**: Minimum separation distance enforcement
- **Boundary Safety**: Track limit compliance for all vehicles
- **Performance Optimization**: Individual lap time calculation

## Development and Testing

### Available Commands
```bash
# Start development server
python3 -m uvicorn main:app --reload --port 8000

# Run tests
python -m pytest tests/

# Database reset
python -c "from database import reset_database; reset_database()"
```

### Performance Monitoring
- **Request Logging**: Detailed simulation parameter tracking
- **Optimization Metrics**: Lap time improvements and iteration counts
- **Error Handling**: Graceful degradation with fallback algorithms
- **Memory Management**: Efficient NumPy array operations

## Troubleshooting

### Common Issues

**Backend Process Management:**
```bash
# Kill existing backend process
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Restart with clean state
python3 -m uvicorn main:app --reload --port 8000
```

**Database Connection Issues:**
```bash
# Restart PostgreSQL service
brew services restart postgresql@15

# Verify database exists
psql -l | grep f1_tracks_db

# Recreate database if needed
dropdb f1_tracks_db && createdb f1_tracks_db
```

**Python Environment Issues:**
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## API Documentation

### Interactive Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Frontend Integration
The backend is designed for seamless integration with the React frontend:
- **CORS Configuration**: Allows requests from `http://localhost:3000`
- **Real-time Responses**: Fast optimization for interactive use
- **Error Handling**: Detailed error messages for debugging
- **Progress Tracking**: Optimization iteration logging

## Performance Characteristics

### Optimization Speed
- **Basic Model**: ~0.1-0.5 seconds per track
- **Physics Model**: ~1-3 seconds per track (4 iterations)
- **Kapania Model**: ~2-5 seconds per track (5 iterations)

### Memory Usage
- **Track Storage**: Efficient NumPy array handling
- **Database**: PostgreSQL connection pooling
- **Algorithm State**: Minimal memory footprint per request

## Contributing

### Code Structure
- Follow PEP 8 Python style guidelines
- Use type hints for all function parameters and returns
- Implement comprehensive error handling
- Write docstrings for all public methods
- Include unit tests for new algorithms

### Algorithm Development
- Inherit from `BaseRacingLineModel` for consistency
- Implement required abstract methods
- Add algorithm metadata and characteristics
- Include mathematical documentation
- Validate against known racing line principles

## License

This project is developed for educational and research purposes in mathematical modeling and racing line optimization.

## Contact

- **Developers**: Sarosh Farhan, Joel Thomas Chacko
- **Project**: Mathematical Modelling of Race Lines
- **Institution**: University College Dublin

For technical support, algorithm discussions, or contributions, please refer to the project repository issues and documentation.