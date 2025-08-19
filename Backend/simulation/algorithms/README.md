# Racing Line Algorithms

This directory contains three racing line optimization algorithms, each with different approaches and performance characteristics.

## **Architecture**

All algorithms inherit from `BaseRacingLineModel` which provides:
- **Gaussian smoothing** for path/curvature cleanup
- **Boundary constraints** to keep lines within track limits
- **Vector calculations** for track geometry

## **Available Models**

### 1. **Basic Model** (`basic_model.py`)
**Simple geometric approach for clean, smooth racing lines**

**Key Features:**
- **Track Usage:** 60% (conservative)
- **Approach:** Pure geometry, no complex physics
- **Best For:** Learning, visualization, baseline comparisons

**Step-by-Step Process:**
1. **Input Validation** → Ensure finite curvature values
2. **Curvature Smoothing** → Apply Gaussian filter (σ=5.0) for stability
3. **Corner Detection** → Identify corners using threshold (|κ| > 0.005)
4. **Conservative Offsets** → Calculate safe racing line positions
   - Corners: Move inside with 60% severity factor
   - Straights: Position for upcoming corners
5. **Boundary Safety** → Keep within 30% of track width
6. **Heavy Smoothing** → Multiple Gaussian passes for clean appearance

**Mathematical Foundation:**
```
max_offset = track_width × 0.3
offset_magnitude = max_offset × corner_severity × 0.6
```

---

### 2. **Physics-Based Model** (`physics_model.py`)
**Lap time optimization using real F1 physics equations**

**Key Features:**
- **Track Usage:** 85% (aggressive optimization)
- **Approach:** Physics-based with iterative lap time minimization
- **Best For:** Performance optimization, realistic racing lines

**Step-by-Step Process:**
1. **Parameter Extraction** → Get car mass, aerodynamics, power data
2. **Iterative Optimization Loop** (max 4 iterations):
   - **Single-Pass Calculation** → Physics-based racing line
   - **Speed Profile** → Calculate optimal speeds using physics
   - **Lap Time** → Calculate T = ∫(1/v) ds
   - **Path Optimization** → Improve geometry for next iteration
   - **Convergence Check** → Stop if improvement < 0.15s
3. **Physics Speed Calculation:**
   - **Corner Speed:** `v_max = √(μ × (mg + F_downforce) / (m × κ))`
   - **Straight Speed:** Drag-limited using aerodynamics
4. **Racing Line Strategy:**
   - **Late Apex** → Better corner exit acceleration
   - **Wide-Apex-Wide** → Maximize radius where possible

**Mathematical Foundation:**
```
Corner Speed: v = √((μ × N) / (m × κ))
Aerodynamic Force: F = 0.5 × ρ × v² × C × A
Lap Time Objective: minimize ∫(1/v) ds
```

---

### 3. **Kapania Model** (`kapania_model.py`)
**Research-grade two-step iterative algorithm**

**Key Features:**
- **Track Usage:** 85% (research-optimized)
- **Approach:** Two-step convex optimization (Stanford research)
- **Best For:** Research applications, high-precision optimization

**Step-by-Step Process:**
1. **Parameter Setup** → Extract Kapania-specific car parameters
2. **Two-Step Iteration Loop** (max 5 iterations):
   
   **Step 1: Forward-Backward Integration**
   - **Pass 1:** Calculate maximum steady-state speeds
     ```
     v_max = √((μ × g) / κ) × downforce_factor × suspension_factor
     ```
   - **Pass 2:** Forward integration with acceleration limits
   - **Pass 3:** Backward integration with braking limits
   
   **Step 2: Convex Path Optimization**
   - **High-Curvature Detection** → Find sections needing optimization
   - **Geometric Smoothing** → Apply racing line theory
   - **Boundary Constraints** → Keep within track limits
   - **Path Smoothing** → Ensure continuity

3. **Convergence** → Stop when lap time improvement < 0.1s

**Mathematical Foundation:**
```
Forward Integration: v²ᵢ₊₁ = v²ᵢ + (2×F×d)/m
Backward Integration: v²ᵢ = v²ᵢ₊₁ - (2×F×d)/m  
Curvature Minimization: minimize Σ|κᵢ|
```

## **Common Features**

### **Gaussian Filtering Usage:**
- **Curvature Smoothing:** Remove noise from geometric calculations
- **Path Smoothing:** Create drivable, professional-looking lines
- **Speed Smoothing:** Prevent unrealistic acceleration spikes

### **Boundary Safety:**
All models ensure racing lines stay within track limits using scale factors when maximum offset is exceeded.
