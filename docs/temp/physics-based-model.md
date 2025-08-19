# Physics-Based Racing Line Model
## Poster Documentation

---

## 🏎️ **MODEL OVERVIEW**

**Name:** Physics-Based Model  
**Description:** Physics model with lap time optimization  
**Track Usage:** 85%  
**Characteristics:** Research-based, Optimized, Lap time minimization

---

## 🧮 **CORE MATHEMATICAL EQUATIONS**

### 1. Cornering Speed Formula
```
v_max = √(μ × (mg + F_downforce) / (m × κ))
```
- `μ` = friction coefficient
- `m` = car mass
- `g` = gravity (9.81 m/s²)
- `F_downforce` = aerodynamic downforce
- `κ` = track curvature

### 2. Aerodynamic Forces
```
F = 0.5 × ρ × v² × C × A
```
- `ρ` = air density (1.225 kg/m³)
- `v` = velocity
- `C` = drag/lift coefficient
- `A` = frontal area

### 3. Lap Time Optimization (Objective Function)
```
minimize T = ∫(1/v) ds
```
- Minimize total lap time by optimizing speed profile

### 4. Braking Distance
```
d = v² / (2a)
```
- `v` = initial velocity
- `a` = maximum deceleration

---

## ⚙️ **ALGORITHM PARAMETERS**

| Parameter | Value | Description |
|-----------|-------|-------------|
| **MAX_ITERATIONS** | 4 | Maximum optimization iterations |
| **CONVERGENCE_THRESHOLD** | 0.15 seconds | Lap time improvement threshold |
| **Track Usage** | 85% | Percentage of track width utilized |
| **Air Density** | 1.225 kg/m³ | Standard atmospheric density |
| **Gravity** | 9.81 m/s² | Gravitational acceleration |

---

## 🔄 **OPTIMIZATION ALGORITHM**

### Step-by-Step Process:
1. **Initialize** with track centerline
2. **Calculate physics-based speeds** using cornering formula
3. **Calculate racing line offsets** using late apex strategy
4. **Apply offsets** to generate racing line
5. **Calculate lap time** using integration
6. **Optimize path geometry** for next iteration
7. **Repeat** until convergence or max iterations

### Racing Line Strategy:
- **Entry:** Go wide for better radius
- **Apex:** Late apex for better exit speed
- **Exit:** Use full track width for acceleration

---

## 🏁 **SPEED CALCULATION METHODS**

### Corner Sections (κ > 1e-6):
- **Iterative solution** for speed-dependent aerodynamics
- **3 iterations** for convergence
- **Downforce calculation** affects cornering speed
- **Speed range:** 5-100 m/s with safety bounds

### Straight Sections (κ ≤ 1e-6):
- **Drag-limited speed** calculation
- **Force equilibrium:** F_drive = F_drag
- **Maximum driving force** based on car acceleration
- **Speed limit:** 100 m/s maximum

---

## 📊 **CAR PARAMETERS USED**

### Default Values:
| Parameter | Default Value | Unit |
|-----------|--------------|------|
| **Mass** | 1500.0 | kg |
| **Max Acceleration** | 5.0 | m/s² |
| **Max Steering Angle** | 30.0 | degrees |
| **Drag Coefficient** | 1.0 | - |
| **Lift Coefficient** | 3.0 | - |
| **Car Length** | 5.0 | m |
| **Car Width** | 1.4 | m |
| **Frontal Area** | 4.9 | m² |

---

## 🎯 **KEY FEATURES**

### ✅ **Strengths:**
- **Research-based:** Uses Perantoni & Limebeer optimal control theory
- **Physics-accurate:** Real aerodynamic and cornering forces
- **Lap time optimization:** Minimizes actual lap time
- **Iterative improvement:** Gets better with each iteration
- **Late apex strategy:** Optimized racing approach

### ⚠️ **Considerations:**
- **Computational cost:** More intensive than basic models
- **Convergence:** May not always converge in 4 iterations
- **Stability:** Requires smoothing for visual stability
- **Complexity:** More parameters to tune

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### Dependencies:
- `numpy` - Numerical calculations
- `scipy.ndimage.gaussian_filter1d` - Smoothing
- `aerodynamics.py` - Aerodynamic force calculations
- `curvilinear_coordinates.py` - Coordinate system transformations

### Input Requirements:
- **Track points:** (x, y) coordinates array
- **Curvature:** Curvature values at each point
- **Track width:** Physical track width in meters
- **Car parameters:** Physical car properties
- **Friction coefficient:** Track surface friction

### Output:
- **Racing line:** Optimized (x, y) coordinate array
- **Lap time:** Predicted total lap time
- **Convergence info:** Iterations used and final improvement

---

## 📈 **PERFORMANCE CHARACTERISTICS**

- **Accuracy:** High (research-grade)
- **Speed:** Medium (iterative optimization)
- **Stability:** Good (with smoothing)
- **Track Usage:** Aggressive (85%)
- **Real-time Capable:** Yes (4 iterations typically fast enough)

---

*Based on actual implementation in `Backend/simulation/algorithms/physics_model.py`*