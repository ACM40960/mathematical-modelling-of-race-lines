# Physics Model - All Equations in LaTeX Format

## **Input & Setup Equations**

### Car Parameters
- Mass: $M = 1500 \text{ kg}$
- Max acceleration: $a_{max} = 5.0 \text{ m/s}^2$
- Drag coefficient: $C_D = 1.0$
- Lift coefficient: $C_L = 3.0$
- Frontal area: $A = L \times W \times 0.7$

### Algorithm Parameters
- Max iterations: $N_{iter} = 4$
- Convergence threshold: $\Delta T_{conv} = 0.15 \text{ s}$

## **Curvilinear System Creation**

### Track Angle Calculation
$$\theta(s) = \arctan2(\text{tangent}_y, \text{tangent}_x)$$

### Curvature Calculation
$$\kappa(s) = \frac{d\theta}{ds}$$

### Central Difference Implementation
$$\kappa_i = \frac{w_f \cdot \frac{d\theta_f}{ds_f} + w_b \cdot \frac{d\theta_b}{ds_b}}{w_f + w_b}$$

Where:
- $w_f = \frac{1}{ds_f}$ (forward weight)
- $w_b = \frac{1}{ds_b}$ (backward weight)
- $d\theta_f = \theta_{i+1} - \theta_i$ (forward difference)
- $d\theta_b = \theta_i - \theta_{i-1}$ (backward difference)

### Gaussian Smoothing
$$\kappa = \text{gaussian\_filter1d}(\kappa, \sigma = 1.0)$$

## **Physics Speed Calculations**

### Corner Speed (Iterative)
$$v_{max} = \sqrt{\frac{\mu \times (M \times g + F_{downforce})}{M \times |\kappa|}}$$

### Aerodynamic Downforce
$$F_{downforce} = 0.5 \times \rho \times v^2 \times C_L \times A$$

### Straight Speed
$$F_{drive} = M \times a_{max} = F_{drag}$$

### Drag Force
$$F_{drag} = 0.5 \times \rho \times v^2 \times C_D \times A$$

## **Late Apex Strategy**

### Maximum Track Offset
$$\text{max\_offset} = \text{track\_width} \times 0.4$$

### Speed Factors
$$\text{speed\_factor} = \begin{cases}
1.0 & \text{if } v < 30 \text{ m/s (slow)} \\
0.8 & \text{if } 30 \leq v < 50 \text{ m/s (medium)} \\
0.6 & \text{if } v \geq 50 \text{ m/s (fast)}
\end{cases}$$

### Phase Factors
$$\text{phase\_factor} = \begin{cases}
0.9 \times \text{speed\_factor} & \text{(apex)} \\
-0.7 \times \text{speed\_factor} & \text{(entry)} \\
-0.6 \times \text{speed\_factor} & \text{(exit)}
\end{cases}$$

## **Racing Line Generation**

### Offset Calculation
$$\text{offset} = \text{max\_offset} \times \text{phase\_factor} \times \text{speed\_factor}$$

### Corner Direction
$$\text{corner\_direction} = -\text{sign}(\kappa)$$

### Racing Line Points
$$\text{racing\_line} = \text{track\_points} + \text{offset} \times \text{perpendicular}$$

### Perpendicular Vector
$$\text{perpendicular} = [-\text{tangent}_y, \text{tangent}_x]$$

## **Lap Time Optimization**

### Objective Function
$$T_{lap} = \sum_{i=1}^{n} \frac{\text{distance}_i}{\text{speed}_i}$$

### Distance Calculation
$$\text{distance}_i = \sqrt{(x_{i+1} - x_i)^2 + (y_{i+1} - y_i)^2}$$

### Convergence Criterion
$$|T_{new} - T_{old}| < 0.15 \text{ s}$$

## **Iterative Speed Calculation (Detailed)**

### Corner Speed Iteration
For $i = 1, 2, 3$ iterations:

1. Calculate downforce:
$$F_{downforce} = 0.5 \times \rho \times v_{estimate}^2 \times C_L \times A$$

2. Calculate normal force:
$$N = M \times g + F_{downforce}$$

3. Calculate lateral force:
$$F_{lateral} = \mu \times N$$

4. Calculate new speed:
$$v_{new} = \sqrt{\frac{F_{lateral}}{M \times |\kappa|}}$$

5. Check convergence:
$$\text{if } |v_{new} - v_{estimate}| < 0.5 \text{ then break}$$

6. Update estimate:
$$v_{estimate} = 0.7 \times v_{estimate} + 0.3 \times v_{new}$$

## **Physical Constants**
- Gravitational acceleration: $g = 9.81 \text{ m/s}^2$
- Air density: $\rho = 1.225 \text{ kg/m}^3$
- Friction coefficient: $\mu = 1.0$

## **Boundary Conditions**
- Speed limits: $v_{min} = 5.0 \text{ m/s}$, $v_{max} = 100.0 \text{ m/s}$
- Curvature boundaries: $\kappa[0] = \kappa[1]$, $\kappa[-1] = \kappa[-2]$

This document contains **all mathematical equations** used in the Physics-Based Racing Line Model! 🏎️📐