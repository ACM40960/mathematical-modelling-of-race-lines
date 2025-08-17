Poster Information for First 2 Models

# Basic Model

## Introduction

The Basic Model is a simple geometric approach that creates clean, smooth racing lines. It is designed to be good for learning and general racing applications. The model uses conservative track usage (60%) and prioritizes simplicity and smoothness over optimal performance.

**Key Characteristics:**
- Simple geometric calculations
- Smooth, clean racing lines  
- Conservative approach (60% track usage)
- Learning-friendly implementation
- Single-pass algorithm (no iterations)

## Parameters Used

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Track Usage** | 60% | Total track width utilized |
| **Max Offset Factor** | 0.3 | 30% of track width on each side |
| **Curvature Threshold** | 0.005 | Minimum curvature for corner detection |
| **Smoothing Sigma** | 5.0 | Gaussian filter parameter for curvature smoothing |
| **Corner Severity Factor** | 0.6 | Conservative factor applied to corner offsets |
| **Look Ahead Distance** | 12 points | Distance to look ahead for corner positioning |
| **Corner Exit Factor** | 0.7 | Additional conservative factor for corner exits |
| **Straight Setup Factor** | 0.5 | Factor for positioning on straights |

## Mathematical Foundation

The Basic Model uses pure geometric calculations without complex physics:

**Track Vector Calculations:**
```
direction_vectors = np.diff(track_points, axis=0)
perpendicular_vectors = [-direction_vectors[y], direction_vectors[x]]
```

**Curvature Smoothing:**
```
smoothed_curvature = gaussian_filter1d(curvature, sigma=5.0)
```

**Corner Detection:**
```
if abs(smoothed_curvature[i]) > 0.005:
    # Corner detected
```

**Offset Calculation for Corners:**
```
corner_direction = -np.sign(smoothed_curvature[i])
corner_severity = min(abs(smoothed_curvature[i]) * 200, 1.0)
offset_magnitude = max_offset * corner_severity * 0.6
```

**Racing Line Application:**
```
racing_line[i] = track_points[i] + offset * perpendicular_vector
```

## Algorithm with Code Snippets

**Main Algorithm Flow:**

1. **Initialize and Validate Input:**
```python
racing_line = track_points.copy()
curvature = np.where(np.isfinite(curvature), curvature, 0.0)
```

2. **Calculate Track Vectors:**
```python
direction_vectors, perpendicular_vectors = self.calculate_track_vectors(track_points)
max_offset = track_width * 0.3  # 30% of track width
```

3. **Apply Curvature Smoothing:**
```python
smoothed_curvature = gaussian_filter1d(curvature, sigma=5.0)
curvature_threshold = 0.005
```

4. **Corner Processing Loop:**
```python
for i in range(n_points):
    if abs(smoothed_curvature[i]) > curvature_threshold:
        # In a corner - apply racing line strategy
        corner_direction = -np.sign(smoothed_curvature[i])
        corner_severity = min(abs(smoothed_curvature[i]) * 200, 1.0)
        offset_magnitude = max_offset * corner_severity * 0.6
        
        # Look ahead for corner exit positioning
        look_ahead = min(i + 12, n_points - 1)
        avg_curvature_ahead = np.mean(np.abs(smoothed_curvature[i:look_ahead]))
        
        if avg_curvature_ahead < curvature_threshold:
            offset_magnitude *= 0.7  # More conservative for exit
            
        offset = perpendicular_vectors[i] * offset_magnitude * corner_direction
        racing_line[i] = track_points[i] + offset
```

5. **Straight Section Processing:**
```python
else:
    # On straights - look for upcoming corners
    look_ahead_distance = min(12, n_points - i - 1)
    
    for j in range(i + 1, i + look_ahead_distance + 1):
        if abs(smoothed_curvature[j]) > curvature_threshold:
            # Position for optimal corner entry
            upcoming_corner_direction = -np.sign(smoothed_curvature[j])
            setup_offset = max_offset * 0.5 * (-upcoming_corner_direction)
            
            distance_to_corner = j - i
            transition_factor = max(0.1, 1 - (distance_to_corner / look_ahead_distance))
            
            offset = perpendicular_vectors[i] * setup_offset * transition_factor
            racing_line[i] = track_points[i] + offset
            break
```

6. **Final Processing:**
```python
# Apply boundary constraints
racing_line = self.apply_boundary_constraints(racing_line, track_points, max_offset)

# Apply heavy smoothing for clean lines
racing_line = self.smooth_racing_line(racing_line, smoothing_level="heavy")

# Ensure closed track handling
if np.allclose(track_points[0], track_points[-1], atol=1e-3):
    racing_line[-1] = racing_line[0]
```

## Model Drawbacks and Improvements

**Drawbacks:**
- **No Physics Consideration:** Does not account for vehicle dynamics, aerodynamics, or speed optimization
- **Conservative Approach:** Only uses 60% of track width, potentially leaving performance on the table
- **Static Parameters:** Fixed thresholds may not work optimally for all track types
- **No Speed Optimization:** Does not consider lap time minimization
- **Limited Corner Strategy:** Simple geometric approach without advanced racing line theory

**Improvements Made in Implementation:**
- **Robust Error Handling:** Handles infinite curvature values and edge cases
- **Boundary Constraints:** Ensures racing line stays within track limits
- **Heavy Smoothing:** Applied for very clean, drivable lines
- **Closed Track Support:** Properly handles circular tracks
- **Look-ahead Logic:** Positions for upcoming corners on straights

# Physics Model

## Introduction

The Physics-Based Model implements a sophisticated racing line optimization system based on Perantoni & Limebeer's optimal control research. It uses real vehicle physics, aerodynamics, and iterative lap time optimization to generate racing lines that minimize total lap time.

**Key Characteristics:**
- Physics-based speed calculations
- Lap time optimization objective
- Iterative improvement algorithm
- Advanced aerodynamics modeling
- Late apex racing strategy
- 85% track usage (aggressive)

## Parameters Used

| Parameter | Value | Description |
|-----------|-------|-------------|
| **MAX_ITERATIONS** | 4 | Maximum optimization iterations |
| **CONVERGENCE_THRESHOLD** | 0.15 seconds | Lap time improvement threshold for convergence |
| **Track Usage** | 85% | Aggressive track width utilization |
| **Max Offset Factor** | 0.4 | 40% of track width (80% total usage) |
| **Corner Threshold** | 0.003 | Curvature threshold for corner detection |
| **Gravity** | 9.81 m/s² | Gravitational acceleration |
| **Air Density** | 1.225 kg/m³ | Standard atmospheric density |

**Default Car Parameters:**
| Parameter | Default Value | Unit |
|-----------|--------------|------|
| **Mass** | 1500.0 | kg |
| **Max Acceleration** | 5.0 | m/s² |
| **Max Steering Angle** | 30.0 | degrees |
| **Drag Coefficient** | 1.0 | - |
| **Lift Coefficient** | 3.0 | - |
| **Car Length** | 5.0 | m |
| **Car Width** | 1.4 | m |
| **Frontal Area** | 4.9 | m² (calculated as length × width × 0.7) |

## Mathematical Foundation

**Core Physics Equations:**

1. **Cornering Speed Formula:**
```
v_max = √(μ × (mg + F_downforce) / (m × κ))
```
Where:
- μ = friction coefficient
- m = car mass
- g = gravity (9.81 m/s²)
- F_downforce = aerodynamic downforce
- κ = track curvature

2. **Aerodynamic Forces:**
```
F = 0.5 × ρ × v² × C × A
```
Where:
- ρ = air density (1.225 kg/m³)
- v = velocity
- C = drag/lift coefficient
- A = frontal area

3. **Lap Time Optimization (Objective Function):**
```
minimize T = ∫(1/v) ds
```

4. **Braking Distance:**
```
d = v² / (2a)
```

5. **Drag-Limited Speed on Straights:**
```
F_drive = F_drag (equilibrium condition)
max_drive_force = mass × max_acceleration
```

## Algorithm with Code Snippets

**Main Optimization Loop:**

1. **Initialization:**
```python
# Optimization parameters
self.MAX_ITERATIONS = 4
self.CONVERGENCE_THRESHOLD = 0.15  # seconds

# Initialize optimization
current_path = track_points.copy()
best_lap_time = float('inf')
best_path = current_path.copy()
```

2. **Iterative Optimization:**
```python
for iteration in range(self.MAX_ITERATIONS):
    print(f"Iteration {iteration + 1}/{self.MAX_ITERATIONS}:")
    
    # Calculate physics-based racing line
    racing_line = self._calculate_single_pass_racing_line(
        current_path, curvature, track_width, params, friction
    )
    
    # Calculate optimized speed profile
    speeds = self._calculate_optimized_speed_profile(racing_line, params, friction)
    
    # Calculate lap time (optimization objective)
    lap_time = self._calculate_lap_time(speeds, racing_line)
    
    # Check for improvement
    if lap_time < best_lap_time:
        improvement = best_lap_time - lap_time
        best_lap_time = lap_time
        best_path = racing_line.copy()
        print(f"New best! Improvement: {improvement:.2f}s")
    
    # Check convergence
    if iteration > 0 and abs(prev_lap_time - lap_time) < self.CONVERGENCE_THRESHOLD:
        print("Converged!")
        break
    
    # Optimize path geometry for next iteration
    current_path = self._optimize_path_geometry(racing_line, speeds, track_width)
```

3. **Corner Speed Calculation (Iterative Physics):**
```python
def _calculate_corner_speed(self, kappa, params, friction, g, air_density):
    v_estimate = 30.0  # Initial guess
    
    for _ in range(3):  # Quick convergence
        # Calculate aerodynamic downforce: F = 0.5 × ρ × v² × C_L × A
        _, downforce = aerodynamic_model.calculate_aerodynamic_forces(
            v_estimate, params['frontal_area'], 
            params['drag_coefficient'], params['lift_coefficient']
        )
        
        # Total normal force: N = mg + F_downforce
        total_normal_force = params['mass'] * g + downforce
        
        # Maximum lateral force: F_lat = μ × N
        max_lateral_force = friction * total_normal_force
        
        # Maximum cornering speed: v = √(F_lat / (m × κ))
        if abs(kappa) > 1e-10:
            v_max_squared = max_lateral_force / (params['mass'] * abs(kappa))
            v_new = np.sqrt(v_max_squared) if v_max_squared > 0 else 10.0
        else:
            v_new = 80.0
        
        # Check convergence
        if abs(v_new - v_estimate) < 0.5:
            break
        
        # Damped update to prevent oscillation
        v_estimate = 0.7 * v_estimate + 0.3 * v_new
    
    return max(5.0, min(v_estimate, 100.0))
```

4. **Straight Speed Calculation:**
```python
def _calculate_straight_speed(self, params, air_density):
    # Maximum driving force: F = ma
    max_drive_force = params['mass'] * params['max_acceleration']
    
    # Calculate drag-limited speed
    drag_limited_speed = aerodynamic_model.calculate_drag_limited_speed(
        max_drive_force, params['frontal_area'], params['drag_coefficient']
    )
    
    return min(drag_limited_speed, 100.0)
```

5. **Late Apex Strategy Implementation:**
```python
def _calculate_corner_offset(self, i, curvature, speeds, max_offset, n_points):
    corner_direction = -np.sign(curvature[i])
    current_speed = speeds[i]
    
    # Speed-based strategy
    if current_speed < 30:      # Slow corner - maximize radius
        speed_factor = 1.0
    elif current_speed < 50:    # Medium corner - balanced
        speed_factor = 0.8
    else:                       # Fast corner - minimize radius
        speed_factor = 0.6
    
    # Determine corner phase (entry/apex/exit)
    if (behind_curvature < current_curvature and ahead_curvature < current_curvature):
        # Apex - late apex strategy
        phase_factor = 0.9 * speed_factor
    elif behind_curvature < current_curvature:
        # Entry - go wide
        phase_factor = -0.7 * speed_factor
    else:
        # Exit - accelerate out wide
        phase_factor = -0.6 * speed_factor
    
    return max_offset * phase_factor * corner_direction
```

6. **Lap Time Calculation:**
```python
def _calculate_lap_time(self, speeds, racing_line):
    distances = self._calculate_distances_between_points(racing_line)
    lap_time = 0.0
    
    for i in range(len(distances)):
        if speeds[i] > 1e-6 and distances[i] > 1e-6:
            lap_time += distances[i] / speeds[i]  # time = distance / speed
        else:
            lap_time += distances[i] / 10.0  # Safe fallback
    
    return lap_time
```

## Model Drawbacks and Improvements

**Drawbacks:**
- Boundary Lines not crosed.
- Model extrememly senestivie to noise thereby requiring downsampling of points.
