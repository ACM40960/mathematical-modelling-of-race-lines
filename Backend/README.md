# F1 Racing Line Optimization Backend

## Overview

This backend is a sophisticated Formula 1 racing line optimization system that calculates optimal racing lines for F1 cars on custom-drawn tracks. It uses physics-based models and vehicle dynamics to determine the fastest path around a circuit while considering multiple cars and preventing racing line crossovers.

## Architecture

### Core Components

```
Backend/
├── main.py                     # FastAPI server and API endpoints
├── models/                     # Data models and schemas
│   ├── track.py               # Track and car data models
│   └── response.py            # API response schemas
├── simulation/                 # Racing line calculation engine
│   ├── optimizer_new.py       # Main optimization algorithms
│   └── models/                # Racing line calculation models
│       ├── __init__.py        # Model registry
│       ├── base_model.py      # Abstract base class
│       ├── physics_model.py   # Physics-based racing line model
│       └── basic_model.py     # Simple geometric racing line model
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## System Flow

### 1. Track Data Reception
- Frontend sends track data via POST `/simulate` endpoint
- Track consists of:
  - `track_points`: Array of (x, y) coordinates defining the track centerline
  - `width`: Track width in meters
  - `friction`: Track surface friction coefficient (0.0-1.0)
  - `cars`: Array of car configurations
  - `model`: Selected racing line model ("physics_based" or "basic")

### 2. Track Processing Pipeline

#### A. Track Point Validation and Closure
```python
# Convert track points to numpy array
track_points = np.array([(p.x, p.y) for p in track.track_points])

# Store original start position for alignment
original_start = track_points[0].copy()
```

#### B. Track Resampling with Closed-Loop Handling
The system now properly handles closed racing circuits:

```python
def resample_track_points(points: np.ndarray, num_points: int = 50) -> np.ndarray:
    """
    Resample track points while maintaining closed-loop integrity
    """
    # Check if track is already closed
    is_closed = np.allclose(points[0], points[-1], atol=1e-3)
    
    if not is_closed:
        # Close the track by adding the first point at the end
        points = np.vstack([points, points[0]])
    
    # Use periodic spline for closed tracks (per=True)
    tck, u = splprep([points[:,0], points[:,1]], s=0, per=True)
    
    # Generate points starting from u=0 (original start position)
    u_new = np.linspace(0, 1, num_points + 1)[:-1]
    x_new, y_new = splev(u_new, tck)
    
    # Ensure proper closure
    resampled_points = np.column_stack((x_new, y_new))
    resampled_points = np.vstack([resampled_points, resampled_points[0]])
    
    return resampled_points
```

#### C. Start/Finish Alignment
Critical fix to ensure racing lines begin and end at the correct position:

```python
# Find closest point in resampled track to original start
distances = np.linalg.norm(resampled_points - original_start, axis=1)
start_idx = np.argmin(distances)

# Rotate resampled points to start at correct position
if start_idx != 0:
    resampled_points = np.vstack([
        resampled_points[start_idx:],
        resampled_points[1:start_idx+1]
    ])
```

### 3. Curvature Analysis

The system calculates track curvature using robust numerical methods based on differential geometry:

```python
def compute_curvature(points: np.ndarray) -> np.ndarray:
    """
    Compute curvature at each point using the formula:
    κ = |x'y'' - y'x''| / (x'² + y'²)^(3/2)
    """
    # First derivatives
    dx_dt = np.gradient(points[:, 0])
    dy_dt = np.gradient(points[:, 1])
    
    # Second derivatives
    d2x_dt2 = np.gradient(dx_dt)
    d2y_dt2 = np.gradient(dy_dt)
    
    # Curvature calculation with NaN handling
    numerator = np.abs(dx_dt * d2y_dt2 - dy_dt * d2x_dt2)
    denominator = (dx_dt * dx_dt + dy_dt * dy_dt)**1.5
    
    # Prevent division by zero
    safe_denominator = np.where(denominator < 1e-10, 1e-10, denominator)
    curvature = numerator / safe_denominator
    
    # Replace NaN/infinite values
    curvature = np.where(np.isfinite(curvature), curvature, 0.0)
    
    return curvature
```

#### Mathematical Foundation

**Curvature Formula**: For a parametric curve **r**(t) = (x(t), y(t)), the curvature κ is defined as:

```
κ(t) = |x'(t)y''(t) - y'(t)x''(t)| / [x'(t)² + y'(t)²]^(3/2)
```

Where:
- **x'(t), y'(t)** are first derivatives (velocity components)
- **x''(t), y''(t)** are second derivatives (acceleration components)
- **|·|** denotes absolute value
- The denominator represents the cube of the speed

**Physical Interpretation**:
- **κ = 0**: Straight line (infinite radius of curvature)
- **κ > 0**: Curved path (smaller radius = higher curvature)
- **1/κ**: Radius of curvature in the same units as the track coordinates

**Numerical Implementation**:
- Uses `np.gradient()` for robust finite difference approximation
- Handles edge cases with padding and boundary conditions
- Prevents division by zero with minimum denominator threshold

## Racing Line Models

### Physics-Based Model (`physics_model.py`)

Based on Perantoni & Limebeer's optimal control research for Formula One cars.

#### Key Features:
- **Wide-Apex-Wide Theory**: Goes wide on entry, cuts to apex, goes wide on exit
- **Late Apex Principle**: Prioritizes corner exit speed over entry speed
- **Vehicle Dynamics**: Considers car limitations and physics
- **Corner Phase Detection**: Identifies entry, apex, and exit phases

#### Algorithm:
1. **Corner Detection**: Uses curvature threshold (0.003) to identify corners
2. **Phase Analysis**: Determines if point is entry, apex, or exit
3. **Offset Calculation**: Applies racing line theory with conservative factors
4. **Boundary Constraints**: Ensures racing line stays within track limits

```python
# Corner phase determination
if behind_curvature < current_curvature and ahead_curvature < current_curvature:
    phase_factor = 1.0  # Apex - maximum offset
elif behind_curvature < current_curvature:
    phase_factor = 0.6  # Entry - gradual increase
elif ahead_curvature < current_curvature:
    phase_factor = 0.9  # Exit - late apex, high offset
else:
    phase_factor = 0.8  # Middle of corner
```

#### Track Usage: 70% (35% offset from centerline)

### Basic Model (`basic_model.py`)

Simple geometric approach for clean, smooth racing lines.

#### Key Features:
- **Simple Corner Detection**: Basic curvature-based identification
- **Conservative Approach**: Safer, more predictable lines
- **Smooth Curves**: Heavy smoothing for clean appearance
- **Learning-Friendly**: Easy to understand and predict

#### Track Usage: 60% (30% offset from centerline)

## Multi-Car Racing Line Separation

When multiple cars are present, the system creates separated racing lines to prevent crossovers:

```python
def create_separated_racing_lines(track_points, base_racing_line, track_width, num_cars):
    """
    Create separated racing lines for multiple cars
    """
    # Calculate safe separation distances
    min_separation = min(3.0, track_width * 0.2)
    max_usable_width = track_width * 0.8
    
    # Distribute cars across track width
    if num_cars == 2:
        offsets = [-min_separation * 0.7, min_separation * 0.7]
    elif num_cars == 3:
        offsets = [-min_separation, 0, min_separation]
    # ... more configurations
    
    # Apply offsets to base racing line
    for offset in offsets:
        car_racing_line = base_racing_line.copy()
        # Apply perpendicular offset at each point
        # Ensure boundaries are respected
        # Apply smoothing
        racing_lines.append(car_racing_line)
```

## Speed Profile Calculation

The system calculates realistic speed profiles based on:

### Maximum Corner Speed Calculation
```python
def calculate_max_entry_speed(curvature: float, friction: float, car: Car) -> float:
    """
    Calculate maximum speed based on:
    - Track curvature
    - Surface friction
    - Car's physical limitations
    - Aerodynamic properties
    """
    # Physics-based calculation
    max_speed = np.sqrt(friction * g / abs(curvature))
    
    # Apply safety factor
    return 0.85 * max_speed
```

### Speed Profile Features:
- **Curvature-Based**: Higher curvature = lower speed
- **Friction Consideration**: Wet/dry track conditions
- **Car-Specific**: Each car's mass, aerodynamics, and steering limits
- **Smoothing**: Gaussian filtering for realistic acceleration/deceleration

## API Endpoints

### POST `/simulate`

**Request Body:**
```json
{
  "track_points": [
    {"x": 100, "y": 200},
    {"x": 150, "y": 250},
    ...
  ],
  "width": 15.0,
  "friction": 0.8,
  "cars": [
    {
      "id": "car_1",
      "mass": 740.0,
      "max_steering_angle": 45.0,
      "length": 5.0,
      "width": 2.0,
      "effective_frontal_area": 1.5,
      "car_color": "#e11d48",
      "accent_color": "#ffffff",
      "tire_compound": "soft"
    }
  ],
  "model": "physics_based"
}
```

**Response:**
```json
{
  "optimal_lines": [
    {
      "car_id": "car_1",
      "coordinates": [[x1, y1], [x2, y2], ...],
      "speeds": [speed1, speed2, ...],
      "lap_time": 45.67,
      "model": "physics_based"
    }
  ]
}
```

### GET `/models`

Returns available racing line models:
```json
{
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
```

## Recent Critical Fixes

### Racing Line Alignment Issue
**Problem**: Racing lines didn't start/end at the start/finish line position.

**Root Cause**: 
1. Track resampling used non-periodic splines (`per=False`)
2. Resampled points didn't preserve original start position
3. Racing line calculation didn't ensure closed-loop integrity

**Solution**:
1. **Periodic Spline Fitting**: Use `per=True` for closed tracks
2. **Start Position Preservation**: Rotate resampled points to align with original start
3. **Closed-Loop Enforcement**: Ensure all racing lines are properly closed
4. **Model Updates**: Both physics and basic models now handle closed tracks

### Key Changes:
```python
# Before (problematic)
tck, u = splprep([points[:,0], points[:,1]], s=0, per=False)

# After (fixed)
tck, u = splprep([points[:,0], points[:,1]], s=0, per=True)

# Ensure proper closure
if not np.allclose(racing_line[0], racing_line[-1], atol=1e-3):
    racing_line[-1] = racing_line[0]
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Virtual environment (recommended)

### Installation
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Server
```bash
python main.py
```

Server runs on `http://localhost:8000`

### Dependencies
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
numpy==1.24.3
scipy==1.10.1
python-multipart==0.0.6
```

## Testing

### Manual Testing
1. Start the backend server
2. Use the frontend to draw a track
3. Add cars and run simulation
4. Verify racing lines start/end at start/finish line

### API Testing
```bash
# Test with curl
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d @test_track.json
```

## Performance Considerations

### Computational Complexity
- **Track Resampling**: O(n) where n is number of points
- **Curvature Calculation**: O(n) with gradient computation
- **Racing Line Optimization**: O(n) per car
- **Multi-car Separation**: O(n × m) where m is number of cars

### Memory Usage
- Track points stored as numpy arrays for efficiency
- Minimal memory footprint with point resampling
- Garbage collection after each simulation

### Optimization Strategies
1. **Point Resampling**: Limits computational load to ~100 points
2. **Vectorized Operations**: Uses numpy for mathematical operations
3. **Efficient Smoothing**: Gaussian filtering with scipy
4. **Boundary Checking**: Early termination for invalid configurations

## Error Handling

### Graceful Degradation
- Invalid curvature values → Safe fallback speeds
- Spline fitting failures → Non-periodic fallback
- Racing line calculation errors → Use original track as fallback
- NaN/Infinite values → Replaced with safe defaults

### Logging
- Comprehensive error logging for debugging
- Performance metrics for optimization
- Request/response logging for API monitoring

## Future Enhancements

### Potential Improvements
1. **Advanced Physics**: Tire degradation, fuel consumption
2. **Weather Conditions**: Rain, temperature effects
3. **Track Evolution**: Rubber buildup, grip changes
4. **Overtaking Lines**: Alternative racing lines for passing
5. **Sector Analysis**: Detailed timing for track sections
6. **Machine Learning**: AI-based racing line optimization

### Scalability
- Database integration for track storage
- Caching for frequently used tracks
- Parallel processing for multiple simulations
- WebSocket support for real-time updates

## Troubleshooting

### Common Issues

1. **Racing Line Misalignment**
   - Ensure track is properly closed
   - Check start/finish position preservation
   - Verify periodic spline fitting

2. **Speed Calculation Errors**
   - Validate curvature values
   - Check friction coefficient range (0.0-1.0)
   - Verify car parameters are realistic

3. **API Errors**
   - Check request format matches schema
   - Verify all required fields are present
   - Ensure numeric values are valid

### Debug Mode
Set environment variable for detailed logging:
```bash
export DEBUG_MODE=true
python main.py
```

## Contributing

### Code Style
- Follow PEP 8 guidelines
- Use type hints for all functions
- Add docstrings for public methods
- Include unit tests for new features

### Testing
- Write tests for new racing line models
- Validate edge cases (very tight corners, long straights)
- Performance benchmarks for optimization changes

This backend represents a sophisticated racing line optimization system that combines theoretical racing knowledge with practical computational methods to deliver realistic and optimal racing lines for Formula 1 simulation. 

## Mathematical Models for Racing Line Optimization

### Physics-Based Model Mathematical Foundation

The physics-based model implements a practical racing line algorithm based on corner phase detection and offset calculation, inspired by Perantoni & Limebeer's optimal control research.

#### 1. Corner Detection and Classification

**Curvature Smoothing**:
```
κ_smooth(i) = G_σ * κ(i)
```
Where G_σ is a Gaussian filter with σ = 3.0.

**Corner Identification**:
```
corner_mask(i) = |κ_smooth(i)| > κ_threshold
```
Where κ_threshold = 0.003.

**Phase Detection Algorithm**:
For each corner point i, calculate:
```
κ_behind = mean(|κ_smooth[i-15:i]|)
κ_current = |κ_smooth[i]|
κ_ahead = mean(|κ_smooth[i:i+15]|)
```

**Phase Classification**:
- **Apex**: κ_behind < κ_current AND κ_ahead < κ_current → phase_factor = 1.0
- **Entry**: κ_behind < κ_current AND κ_ahead ≥ κ_current → phase_factor = 0.6
- **Exit**: κ_behind ≥ κ_current AND κ_ahead < κ_current → phase_factor = 0.9
- **Middle**: Otherwise → phase_factor = 0.8

#### 2. Racing Line Offset Calculation

**Maximum Allowed Offset**:
```
w_max = track_width × 0.35
```
This gives 70% total track usage.

**Corner Offset Strategy**:
```
if phase_factor == 1.0:     # Apex
    base_offset = w_max × 0.7
elif phase_factor == 0.6:   # Entry
    base_offset = w_max × 0.6 × (-1)  # Go wide
elif phase_factor == 0.9:   # Exit  
    base_offset = w_max × 0.5 × (-1)  # Go wide
else:                       # Middle
    base_offset = w_max × 0.4
```

**Final Offset Vector**:
```
offset_vector = perpendicular_vector(i) × base_offset × corner_direction
```

Where:
- **corner_direction = -sign(κ_smooth[i])** (negative for inside corner)
- **perpendicular_vector** is the unit normal to the track centerline

#### 3. Straight-Line Positioning

**Corner Setup Algorithm**:
For straight sections, look ahead for upcoming corners:
```
setup_offset = w_max × 0.6 × (-upcoming_corner_direction)
transition_factor = max(0.2, 1 - distance_to_corner/look_ahead_distance)
final_offset = setup_offset × transition_factor
```

This positions the car wide before corner entry.

#### 4. Boundary Constraint Enforcement

**Distance Check**:
```
d_center = ||proposed_point - centerline_point||
```

**Scaling for Boundary Compliance**:
```
if d_center > w_max:
    scale_factor = w_max / d_center
    final_point = centerline_point + offset_vector × scale_factor
```

### Basic Model Mathematical Foundation

The basic model uses a simplified geometric approach with direct curvature-based offset calculation.

#### 1. Corner Detection

**Curvature Smoothing**:
```
κ_smooth(i) = G_σ * κ(i)
```
Where G_σ is a Gaussian filter with σ = 5.0 (more aggressive smoothing).

**Corner Threshold**:
```
κ_threshold = 0.005
```

#### 2. Direct Curvature-Based Offset

**Corner Severity Calculation**:
```
corner_severity = min(|κ_smooth(i)| × 200, 1.0)
```

**Offset Magnitude**:
```
offset_magnitude = w_max × corner_severity × 0.6
```

Where w_max = track_width × 0.3 (60% total track usage).

**Exit Positioning Adjustment**:
```
if avg_curvature_ahead < κ_threshold:
    offset_magnitude *= 0.7  # More conservative for corner exit
```

#### 3. Straight-Line Setup

**Setup Offset Calculation**:
```
setup_offset = w_max × 0.5 × (-upcoming_corner_direction)
transition_factor = max(0.1, 1 - distance_to_corner/look_ahead_distance)
final_offset = setup_offset × transition_factor
```

The basic model uses a shorter look-ahead distance (12 points vs 20) and more conservative factors.

## Comparison of Mathematical Approaches

### Key Differences:

1. **Corner Detection Sensitivity**:
   - **Physics Model**: κ_threshold = 0.003, σ = 3.0
   - **Basic Model**: κ_threshold = 0.005, σ = 5.0

2. **Track Usage**:
   - **Physics Model**: 70% (w_max = 0.35 × track_width)
   - **Basic Model**: 60% (w_max = 0.3 × track_width)

3. **Offset Calculation**:
   - **Physics Model**: Phase-based with discrete factors (0.4, 0.5, 0.6, 0.7)
   - **Basic Model**: Continuous severity-based (curvature × 200)

4. **Look-ahead Distance**:
   - **Physics Model**: 15-20 points
   - **Basic Model**: 12 points

5. **Smoothing Strategy**:
   - **Physics Model**: Medium smoothing (σ = 1.5-2.0)
   - **Basic Model**: Heavy smoothing (σ = 2.0-3.0)

### Mathematical Formulation Summary:

**Physics Model**:
```
offset(i) = {
    phase_factor × w_max × corner_direction × perpendicular_vector(i)  if corner
    setup_factor × w_max × transition_factor × perpendicular_vector(i)  if straight
}
```

**Basic Model**:
```
offset(i) = {
    min(|κ(i)| × 200, 1.0) × w_max × 0.6 × corner_direction × perpendicular_vector(i)  if corner
    0.5 × w_max × transition_factor × (-corner_direction) × perpendicular_vector(i)      if straight
}
```

Both models use the same boundary constraint enforcement and smoothing post-processing, but differ in their core offset calculation strategies. 