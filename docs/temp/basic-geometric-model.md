# Basic Geometric Racing Line Model
## Poster Documentation

---

## 🏎️ **MODEL OVERVIEW**

**Name:** Basic Model  
**Description:** Simple geometric approach  
**Track Usage:** 60%  
**Characteristics:** Simple, Smooth, Learning-friendly

**Purpose:** Educational tool and baseline for racing line generation

---

## 📐 **GEOMETRIC APPROACH**

### Core Philosophy:
- **Simplicity first:** Easy to understand and implement
- **Conservative approach:** Safe, predictable racing lines
- **Smooth curves:** Prioritizes smoothness over pure speed
- **Learning-friendly:** Perfect for understanding racing line concepts

### Algorithm Type:
- **Geometric:** Based on track geometry, not complex physics
- **Single-pass:** No iterative optimization
- **Deterministic:** Same input always produces same output

---

## ⚙️ **ALGORITHM PARAMETERS**

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Track Usage** | 60% | Conservative track width utilization |
| **Max Offset** | 30% of track width | Maximum distance from centerline |
| **Curvature Threshold** | 0.005 | Minimum curvature for corner detection |
| **Smoothing Sigma** | 5.0 | Gaussian filter parameter |
| **Safety Factor** | Conservative | Prioritizes safety over speed |

---

## 🔄 **ALGORITHM STEPS**

### Step-by-Step Process:
1. **Input validation:** Ensure finite curvature values
2. **Vector calculation:** Compute track direction and perpendicular vectors
3. **Curvature smoothing:** Apply Gaussian filter (σ=5.0)
4. **Corner detection:** Identify corners using threshold (0.005)
5. **Offset calculation:** Apply conservative offsets
6. **Path generation:** Create smooth racing line
7. **Final smoothing:** Apply additional smoothing for stability

---

## 📊 **CORNER DETECTION**

### Curvature Analysis:
```python
curvature_threshold = 0.005  # Conservative threshold
smoothed_curvature = gaussian_filter1d(curvature, sigma=5.0)
```

### Corner Classification:
- **Straight sections:** |curvature| ≤ 0.005
- **Gentle corners:** 0.005 < |curvature| ≤ 0.01
- **Sharp corners:** |curvature| > 0.01

### Conservative Strategy:
- **Gentle approach:** Gradual line changes
- **Predictable behavior:** No sudden movements
- **Safety margins:** Extra space from track limits

---

## 🎯 **TRACK USAGE STRATEGY**

### Width Utilization:
```
max_offset = track_width × 0.3  # Use 30% on each side
total_usage = 60%  # Conservative total usage
```

### Offset Calculation:
- **Straight sections:** Minimal offset (positioning for corners)
- **Corner entry:** Moderate outward offset
- **Corner apex:** Balanced positioning
- **Corner exit:** Gradual return to center

### Safety Philosophy:
- **Conservative margins:** Always leave safety space
- **Predictable paths:** Smooth, gradual changes
- **Forgiving nature:** Reduces risk of track limit violations

---

## 🔧 **VECTOR CALCULATIONS**

### Track Direction Vectors:
```python
direction_vectors = np.diff(track_points, axis=0)
direction_vectors = direction_vectors / np.linalg.norm(direction_vectors)
```

### Perpendicular Vectors:
```python
perpendicular_vectors = np.array([-direction_vectors[:, 1], 
                                  direction_vectors[:, 0]]).T
```

### Offset Application:
```python
racing_line[i] = track_points[i] + offset[i] * perpendicular_vectors[i]
```

---

## 📈 **SMOOTHING TECHNIQUES**

### Multi-stage Smoothing:
1. **Input smoothing:** Curvature data (σ=5.0)
2. **Processing:** Conservative offset calculations
3. **Output smoothing:** Final path refinement

### Gaussian Filter Parameters:
| Stage | Sigma Value | Purpose |
|-------|-------------|---------|
| **Curvature** | 5.0 | Corner detection stability |
| **Path** | Variable | Based on requirements |

### Benefits:
- **Stability:** Eliminates numerical noise
- **Drivability:** Smooth, realistic racing lines
- **Predictability:** Consistent behavior

---

## 🏁 **PERFORMANCE CHARACTERISTICS**

### ✅ **Strengths:**
- **Simplicity:** Easy to understand and modify
- **Speed:** Very fast computation (single-pass)
- **Stability:** No convergence issues
- **Predictability:** Consistent, reliable results
- **Educational value:** Perfect for learning
- **Low computational cost:** Minimal processing requirements

### ⚠️ **Limitations:**
- **Not optimized for speed:** Doesn't minimize lap time
- **Conservative:** May not utilize full track potential
- **No physics:** Ignores vehicle dynamics
- **Static:** Doesn't adapt to different car parameters
- **Basic strategy:** Simple geometric rules only

---

## 🎓 **EDUCATIONAL VALUE**

### Learning Concepts:
- **Racing line basics:** Fundamental racing principles
- **Geometric thinking:** Spatial reasoning in racing
- **Track usage:** Conservative vs aggressive approaches
- **Smoothness importance:** Why smooth lines matter
- **Vector mathematics:** Practical application of geometry

### Use Cases:
- **Beginners:** Learning racing line concepts
- **Baseline comparison:** Reference for other models
- **Quick prototyping:** Fast algorithm testing
- **Educational demos:** Teaching tool
- **Simple applications:** When complexity isn't needed

---

## 🛠️ **TECHNICAL IMPLEMENTATION**

### Dependencies:
- `numpy` - Basic numerical operations
- `scipy.ndimage.gaussian_filter1d` - Smoothing operations
- Base model class inheritance

### Key Methods:
1. `calculate_track_vectors()` - Geometric vector calculations
2. `calculate_racing_line()` - Main algorithm implementation
3. Curvature smoothing and corner detection
4. Conservative offset calculations

### Computational Complexity:
- **Time:** O(n) - Linear with track points
- **Space:** O(n) - Minimal memory requirements
- **Scalability:** Excellent for any track size

---

## 📋 **INPUT REQUIREMENTS**

### Minimal Requirements:
- **Track points:** (x, y) coordinate array
- **Curvature:** Curvature values at each point
- **Track width:** Physical track width in meters

### Optional Parameters:
- **Car parameters:** Ignored (geometric approach)
- **Friction:** Not used in calculations
- **Custom smoothing:** Can be adjusted if needed

---

## 📊 **COMPARISON WITH OTHER MODELS**

| Aspect | Basic Model | Physics Model | Kapania Model |
|--------|-------------|---------------|---------------|
| **Complexity** | Low | High | Very High |
| **Speed** | Very Fast | Medium | Medium |
| **Accuracy** | Basic | High | Very High |
| **Track Usage** | 60% | 85% | 85% |
| **Physics** | None | Full | Advanced |
| **Learning Curve** | Easy | Medium | Hard |

---

## 🔍 **WHEN TO USE**

### Ideal For:
- **Learning and education**
- **Quick prototyping**
- **Baseline comparisons**
- **Simple applications**
- **When speed > accuracy**
- **Resource-constrained environments**

### Not Ideal For:
- **Competitive racing simulation**
- **Lap time optimization**
- **Vehicle-specific tuning**
- **Advanced physics simulation**
- **Research applications**

---

*Based on actual implementation in `Backend/simulation/algorithms/basic_model.py`*