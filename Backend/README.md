# Racing Line Optimizer Backend

This is the FastAPI backend for the Racing Line Optimizer project. It provides endpoints for calculating optimal racing lines based on user-drawn tracks and car parameters.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access:
- Interactive API docs: http://localhost:8000/docs
- Alternative API docs: http://localhost:8000/redoc

## API Endpoints

### GET /
Health check endpoint

### POST /simulate
Calculate optimal racing lines for a given track and car parameters.

Request body:
```json
{
  "track": {
    "coordinates": [[x1, y1], [x2, y2], ...],
    "width": 10.0,
    "friction": 0.7,
    "cars": [
      {
        "id": "car1",
        "mass": 1500,
        "length": 2.5,
        "max_steering_angle": 30,
        "max_acceleration": 5
      }
    ]
  }
}
```

Response:
```json
{
  "optimal_lines": [
    {
      "car_id": "car1",
      "coordinates": [[x1, y1], [x2, y2], ...],
      "speeds": [v1, v2, ...],
      "lap_time": 120.5
    }
  ]
}
```

## Project Structure

```
Backend/
├── main.py              # FastAPI application and routes
├── requirements.txt     # Python dependencies
├── models/             
│   ├── track.py        # Data models for track and car
│   └── response.py     # Response data models
└── simulation/
    └── optimizer.py    # Core optimization logic
```

## Implementation Details

The optimization process follows these steps:

1. **Track Validation**
   - Ensures track has minimum required points
   - Validates track parameters (width, friction)

2. **Racing Line Optimization**
   - Uses sequential quadratic programming (SLSQP)
   - Optimizes for:
     - Minimum lap time
     - Track limits
     - Car physical constraints
     - Smooth trajectories

3. **Speed Profile**
   - Calculates maximum speed at each point
   - Considers:
     - Track friction
     - Car capabilities
     - Curvature constraints 