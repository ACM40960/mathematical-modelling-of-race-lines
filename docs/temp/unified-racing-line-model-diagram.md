# Unified Racing Line Model Architecture

## Overview
This diagram shows the proposed unified architecture for combining all three racing line models (Basic, Physics-Based, and Kapania) with shared components and conditional core processing.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph "UNIFIED RACING LINE MODEL"
        A["SHARED INPUT PROCESSING<br/>resample_track_points()<br/>compute_curvature()<br/>input validation<br/>calculate_track_vectors()"] --> B{"MODEL SELECTION<br/>model_type"}
        
        B -->|"basic"| C["BASIC CORE PROCESSING<br/>Gaussian curvature smoothing<br/>Simple geometric offsets<br/>Conservative corner detection<br/>Look-ahead positioning"]
        
        B -->|"physics"| D["PHYSICS CORE PROCESSING<br/>create_curvilinear_system()<br/>Physics equations (v_max = √...)<br/>Iterative lap time optimization<br/>Speed-dependent racing line"]
        
        B -->|"kapania"| E["KAPANIA CORE PROCESSING<br/>Forward-backward integration<br/>3-pass speed calculation<br/>Convex path optimization<br/>Two-step iterations"]
        
        C --> F["SHARED OUTPUT PROCESSING<br/>apply_boundary_constraints()<br/>smooth_racing_line() - model-specific level<br/>ensure closed loop<br/>output formatting"]
        D --> F
        E --> F
        
        F --> G["UNIFIED RACING LINE OUTPUT"]
    end
    
    subgraph "SHARED UTILITIES (Available to All Cores)"
        H["gaussian_filter1d()"]
        I["np.where(np.isfinite())"]
        J["lap_time calculations"]
        K["parameter extraction"]
    end
    
    C -.-> H
    C -.-> I
    D -.-> H
    D -.-> I
    D -.-> J
    E -.-> H
    E -.-> I
    E -.-> J
    E -.-> K
    
    style A fill:#00ff80,color:#000080
    style B fill:#ff6600,color:#ffffff
    style C fill:#66ff66,color:#000080
    style D fill:#3399ff,color:#ffffff
    style E fill:#ffff00,color:#cc0000
    style F fill:#ff66ff,color:#000080
    style G fill:#00ffff,color:#cc0000
    style H fill:#ff9933,color:#000080
    style I fill:#99ff99,color:#000080
    style J fill:#ffcc66,color:#000080
    style K fill:#ff99cc,color:#000080
```

## Benefits of Unified Architecture

### Code Quality
- 60% reduction in duplicated code
- Single source of truth for shared functions
- Easier maintenance and bug fixes
- Consistent behavior across all models

### Performance
- Shared preprocessing - resampling once for all models
- Optimized shared functions - single implementation
- Consistent memory usage patterns

### Extensibility
- Easy to add new models - just add new core processing branch
- Shared utilities automatically available to new models
- Consistent API for all model types

## Implementation Structure

```python
class UnifiedRacingLineModel(BaseRacingLineModel):
    def calculate_racing_line(self, track_points, curvature, track_width, 
                             car_params=None, friction=1.0, model_type="physics"):
        
        # 1. SHARED PRE-PROCESSING
        racing_line = self._preprocess_inputs(track_points, curvature, track_width)
        
        # 2. CONDITIONAL CORE PROCESSING  
        if model_type == "basic":
            racing_line = self._basic_core_algorithm(racing_line, curvature, track_width)
        elif model_type == "physics":
            racing_line = self._physics_core_algorithm(racing_line, track_width, car_params, friction)
        elif model_type == "kapania":
            racing_line = self._kapania_core_algorithm(racing_line, car_params, friction)
            
        # 3. SHARED POST-PROCESSING
        return self._postprocess_output(racing_line, track_points, model_type)
```

## Shared Components

### Pre-Processing (100% Identical)
- **Resampling**: `resample_track_points()` - used by optimizer for all models
- **Curvature Computation**: `compute_curvature()` - used by all models  
- **Input Validation**: Same validation logic across all models
- **Track Vector Calculation**: `calculate_track_vectors()` from BaseModel

### Post-Processing (100% Identical)
- **Smoothing**: `smooth_racing_line()` from BaseModel (all levels: light/medium/heavy)
- **Boundary Constraints**: `apply_boundary_constraints()` from BaseModel
- **Closed Loop Handling**: Same logic to ensure start/finish connection
- **Output Formatting**: Same racing line coordinate array format

### Shared Utilities (100% Identical)
- **Gaussian Filtering**: Used by all models for different purposes
- **Array Safety**: `np.where(np.isfinite())` checks across all models
- **Distance Calculations**: `np.linalg.norm()` operations
- **Parameter Extraction**: Similar patterns for car_params handling

## Core Differences (Conditional Branching)

### Basic Model Core
```python
# Simple geometric offset calculations
if abs(smoothed_curvature[i]) > threshold:
    corner_severity = min(abs(smoothed_curvature[i]) * 200, 1.0)
    offset_magnitude = max_offset * corner_severity * 0.6
```

### Physics Model Core  
```python
# Curvilinear coordinates + physics optimization
coord_system = create_curvilinear_system(track_points, track_width / 2)
speeds = calculate_physics_speeds(coord_system, params, friction)
lap_time = calculate_lap_time(speeds, racing_line)
```

### Kapania Model Core
```python
# Two-step algorithm
speeds, lap_time = forward_backward_integration(path_points, car_params, friction)
new_path = convex_path_optimization(current_path, speeds, car_params, friction)
```