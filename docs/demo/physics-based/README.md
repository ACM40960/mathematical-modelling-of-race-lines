# Physics Model Component Demonstrations

This directory contains individual demonstration scripts for each component of the Physics-Based Racing Line Model. Each script is based on the **exact implementation** from `Backend/simulation/algorithms/physics_model.py`.

## 📁 Component Breakdown

### 1. Corner Speed Calculation (`01_corner_speed_calculation.py`)
**Demonstrates:** Iterative physics-based corner speed calculation

**Key Features:**
- Formula: `v_max = √(μ × (mg + F_downforce) / (m × κ))`
- Iterative solution for speed-dependent aerodynamics (3 iterations)
- Damped updates to prevent oscillation (70% old + 30% new)
- Speed bounds: 5-100 m/s

**Visualizations:**
- Corner speed vs curvature curves
- Aerodynamic force effects
- Convergence process
- Force balance diagrams

### 2. Straight Speed Calculation (`02_straight_speed_calculation.py`)
**Demonstrates:** Drag-limited speed calculation on straights

**Key Features:**
- Force balance: `F_drive = F_drag`
- Maximum driving force: `F = mass × max_acceleration`
- Aerodynamic drag: `F = 0.5 × ρ × v² × C_d × A`
- Speed limit: 100 m/s maximum

**Visualizations:**
- Force vs speed analysis
- Parameter sensitivity
- Power requirements
- Equilibrium point identification

### 3. Late Apex Strategy (`03_late_apex_strategy.py`)
**Demonstrates:** Racing line offset calculation using late apex strategy

**Key Features:**
- Track usage: 80% (±40% of track width)
- Speed-based factors: 1.0 (slow), 0.8 (medium), 0.6 (fast)
- Phase detection: Entry (-0.7), Apex (0.9), Exit (-0.6)
- Braking zone positioning on straights

**Visualizations:**
- Track layout with racing line
- Offset calculation process
- Speed and curvature profiles
- Strategy explanation diagrams

### 4. Lap Time Optimization (`04_lap_time_optimization.py`)
**Demonstrates:** Iterative lap time minimization process

**Key Features:**
- Objective function: `minimize T = ∫(1/v) ds`
- Convergence threshold: 0.15 seconds
- Path geometry optimization (30% smoothing on >40 m/s sections)
- Maximum 4 iterations

**Visualizations:**
- Convergence history
- Speed profiles
- Lap time integration
- Algorithm flowchart

### 5. Complete Physics Integration (`05_complete_physics_integration.py`)
**Demonstrates:** All components working together in the complete optimization process

**Key Features:**
- Full iterative optimization loop
- Integration of all 4 components
- Racing line evolution visualization
- Performance analysis

**Visualizations:**
- Racing line evolution through iterations
- Component integration summary
- Complete optimization process
- Performance metrics

## 🚀 How to Run

Each script can be run independently:

```bash
python3 docs/demo/physics-based/01_corner_speed_calculation.py
python3 docs/demo/physics-based/02_straight_speed_calculation.py
python3 docs/demo/physics-based/03_late_apex_strategy.py
python3 docs/demo/physics-based/04_lap_time_optimization.py
python3 docs/demo/physics-based/05_complete_physics_integration.py
```

## 📊 What You'll Learn

### Physics Principles:
- Vehicle dynamics and force balance
- Aerodynamic effects on cornering and straight-line speed
- Tire grip limits and lateral force generation
- Power and drag relationships

### Racing Strategy:
- Late apex racing line theory
- Speed-dependent cornering strategies
- Track positioning for optimal lap times
- Entry/apex/exit phase optimization

### Optimization Algorithms:
- Iterative convergence methods
- Objective function minimization
- Path geometry smoothing
- Numerical stability techniques

### Implementation Details:
- Exact parameter values from the code
- Real calculation methods
- Error handling and bounds checking
- Convergence criteria and thresholds

## 🔬 Technical Accuracy

All demonstrations are based on the **actual implementation** in `physics_model.py`:

- ✅ Exact parameter values
- ✅ Real calculation formulas
- ✅ Actual algorithm steps
- ✅ Implementation-specific details
- ✅ No theoretical additions

## 📈 Educational Value

These demonstrations help understand:

1. **Component Isolation:** Each script focuses on one specific aspect
2. **Visual Learning:** Comprehensive plots and diagrams
3. **Step-by-Step Process:** Detailed calculation explanations
4. **Real Implementation:** Based on working production code
5. **Integration Understanding:** How components work together

## 🎯 Target Audience

- **Students:** Learning vehicle dynamics and racing line theory
- **Developers:** Understanding the physics model implementation
- **Researchers:** Analyzing optimization algorithms
- **Engineers:** Studying automotive simulation techniques

## 💡 Key Insights

After running all demonstrations, you'll understand:

- How physics equations translate to code
- Why the late apex strategy is optimal
- How iterative optimization converges
- The relationship between vehicle parameters and performance
- How all components integrate for lap time minimization

---

*All code and parameters extracted directly from the actual implementation in `Backend/simulation/algorithms/physics_model.py`*
