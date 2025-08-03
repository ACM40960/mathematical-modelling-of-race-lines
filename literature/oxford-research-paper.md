# Formula One Racing Line Optimization: Car and Track Model

**Research Paper Extract - Oxford University Engineering Science**

*Based on optimal control theory and differential geometry for racing line optimization*

---

## Table of Contents

1. [Car and Track Model](#car-and-track-model)
2. [Track Model](#track-model)
3. [Car Model](#car-model)
4. [Tyre Forces](#tyre-forces)
5. [Aerodynamic Loads](#aerodynamic-loads)
6. [Wheel Torque Distribution](#wheel-torque-distribution)

---

## 2. Car and Track Model

The track and car kinematics are modelled using ideas from classical differential geometry. As explained in previous research, the track description is based on measured data with the curvature of the track found as the solution of a subsidiary optimal control problem. 

The car model is standard and is based on a rigid-body representation of a chassis with:
- **Longitudinal** freedom
- **Lateral** freedom  
- **Yaw** freedom

We utilize the tyre description given in previous research in combination with an upgraded aerodynamic model.

---

## 2.1 Track Model

We model the track using a **curvilinear coordinate system** that follows the vehicle using the track centre line position as the curvilinear abscissa.

Referring to **Figure 2**, we describe the location of the mass centre of the vehicle in terms of:
- **`s(t)`**: The curvilinear abscissa (distance travelled along track centre line)
- **`n(s(t))`**: The vector giving position perpendicular to track centre-line

### Key Assumptions:
- The travelled distance `s(t)` is an increasing function of time
- 'Time' and 'distance' can be thought of as alternative independent variables
- Standard dot notation signifies derivatives with respect to time

### Track Parameters:
- **`C`**: Track curvature at point `s`
- **`R`**: Radius of curvature  
- **`t`**: Track centre-line tangent vector
- **`θ`**: Track orientation angle
- **`N`**: Track half-width
- **`ψ`**: Vehicle yaw angle
- **`ξ`**: Angle between vehicle and track
- **Relationship**: `ψ = θ + ξ`

### Figure 2: Curvilinear Coordinate System
```
         nx
         ↑
    N ←--+--→ N
         |
    -----+-----  ← Track centerline
         |
    R ←--×     ψ
         |    /
         |   /ξ
         |  /
         | /θ
         |/
         +----------→ ny
         s
```

**Figure 2**: Curvilinear-coordinate-based description of a track segment Z. The independent variable `s` represents the elapsed centre-line distance travelled, with `R(s)` the radius of curvature and `N(s)` the track half-width; `nx` and `ny` represent an inertial reference frame.

### Fundamental Equations

By routine calculation, we derive:

**Equation (1)** - Rate of distance travelled:
```math
ṡ = (u cos ξ - v sin ξ) / (1 - nC)
```

**Equation (2)** - Rate of change of lateral position:
```math
ṅ = u sin ξ + v cos ξ
```

**Equation (3)** - Rate of change of relative angle:
```math
ξ̇ = ψ̇ - Cṡ
```

Where:
- `u` and `v` are longitudinal and lateral components of car velocity
- `n` is the lateral displacement from centerline
- `C` is the track curvature

### 2.1.1 Change of Independent Variable

The 'distance travelled' is used as the independent variable, which:
- Maintains explicit connection with track position
- Reduces the number of problem state variables by one

**Time differential transformation**:
```math
dt = (dt/ds) × ds = Sf(s) × ds
```

Where `Sf` is defined as:

**Equation (4)**:
```math
Sf = (ds/dt)^(-1) = (1 - nC) / (u cos ξ - v sin ξ)
```

The quantity `Sf` is the reciprocal of the component of vehicle velocity in the track-tangent direction (on the centre line at `s`).

**Transformed equations**:

**Equation (5)**:
```math
dn/ds = Sf(u sin ξ + v cos ξ)
```

**Equation (6)**:
```math
dξ/ds = Sfω - C
```

Where `ω = ψ̇` is the vehicle yaw rate.

---

## 2.2 Car Model

Each tyre produces longitudinal and lateral forces responsive to tyre slip (see Appendix A). These forces, together with steer and yaw angle definitions, are given in **Figure 3**.

### Figure 3: Tyre Force System
```
              ψ
         Ffly ↑  ↗ Fflx
              |  /
         -----×----- δ
              |
         u →  ×  ← v
              |
         -----×-----
              |
         Frry ↑    ↗ Frrx
                   
         Ffry ↑  ↗ Ffrx
              |  /
         -----×----- δ
              |
              
         Frly ↑    ↗ Frlx
```

**Figure 3**: Tyre force system. The inertial reference frame is shown as `nx` and `ny`.

### Force Balance Equations

Balancing forces in longitudinal and lateral directions, plus yaw moments:

**Equation (7)** - Force and moment balance:
```math
M(du/dt) = Mωv + Fx

M(dv/dt) = -Mωu + Fy

Iz(dω/dt) = a(cos δ(Ffry + Ffly) + sin δ(Ffrx + Fflx)) +
            wf(sin δFfry - cos δFfrx) - wrFrrx +
            wf(cos δFflx - sin δFfly) + wrFrlx - b(Frry + Frly)
```

### Total Forces

**Equation (8)** - Longitudinal force:
```math
Fx = cos δ(Ffrx + Fflx) - sin δ(Ffry + Ffly) + (Frrx + Frlx) + Fax
```

**Equation (9)** - Lateral force:
```math
Fy = cos δ(Ffry + Ffly) + sin δ(Ffrx + Fflx) + (Frry + Frly)
```

Where `Fax` is the aerodynamic drag force.

### Distance-Based Equations

Expressed in terms of independent variable `s`:

**Equations (10-12)**:
```math
du/ds = Sf(s) × u̇
dv/ds = Sf(s) × v̇  
dω/ds = Sf(s) × ω̇
```

---

## 2.3 Tyre Forces

Tyre forces have normal, longitudinal and lateral components acting on the vehicle's chassis at tyre-ground contact points. The forces are expressed in different reference frames:

- **Rear-wheel forces**: Vehicle's body-fixed reference frame
- **Front-wheel forces**: Steered reference frame (refer to Figure 3)

Forces are functions of:
- Normal load
- Tyre's longitudinal slip
- Tyre's lateral slip

### 2.3.1 Load Transfer

To compute time-varying tyre loads normal to ground plane, we balance forces and moments:

**Equation (13)** - Vertical force balance:
```math
0 = Frrz + Frlz + Ffrz + Fflz + Mg + Faz
```

**Equation (14)** - Moment balance around xb-axis:
```math
0 = wr(Frlz - Frrz) + wf(Fflz - Ffrz) + hFy
```

**Equation (15)** - Moment balance around yb-axis:
```math
0 = b(Frrz + Frlz) - a(Ffrz + Fflz) + hFx + (aA - a)Faz
```

Where:
- `Fizz` are vertical tyre forces for each wheel
- `g` is acceleration due to gravity
- `Faz` is aerodynamic downforce
- `h` is height of center of mass

### Roll Balance Relationship

**Equation (16)**:
```math
Ffrz - Fflz = Droll(Ffrz + Frrz - Fflz - Frlz)
```

Where `Droll ∈ [0,1]` is the roll distribution parameter.

### 2.3.2 Non-Negative Tyre Loads

The load equations can produce negative forces (indicating wheel lift-off). To handle this within nonlinear programming:

**Equation (17)** - Load vector:
```math
F̄z = [F̄frz, F̄flz, F̄rrz, F̄rlz]ᵀ
```

**Equation (18)** - Non-positive loads:
```math
F̄z = min(Fz, 0)
```

The minimum function `min(·,·)` is interpreted element-wise.

### Matrix Formulation

**Equation (19)** - Mechanics equations:
```math
A₁Fz = c
```

**Equation (20)** - Roll balance:
```math
A₂Fz = 0
```

**Equation (21)** - Combined system:
```math
[A₁  0 ] [Fz ]   [c]
[0   A₂] [F̄z] = [0]
```

---

## 2.4 Aerodynamic Loads

External forces come from tyres and aerodynamic influences. Aerodynamic force is applied at the centre of pressure in the vehicle's plane of symmetry.

### Drag and Lift Forces

**Equation (22)** - Drag force:
```math
Fax = -0.5 × CD(u) × ρ × A × u²
```

**Equation (23)** - Downforce:
```math
Faz = 0.5 × CL(u) × ρ × A × u²
```

Where:
- `CD(u)`: Speed-dependent drag coefficient
- `CL(u)`: Speed-dependent downforce coefficient  
- `ρ`: Air density
- `A`: Reference area
- `u`: Vehicle speed

### Figure 4: Aerodynamic Maps

The speed-dependent coefficients are characterized as:

| Speed (m/s) | CD (Drag) | CL (Downforce) | Center of Pressure (m) |
|-------------|-----------|----------------|------------------------|
| 0           | 1.0       | 0.5           | 2.5                    |
| 20          | 1.2       | 1.5           | 2.6                    |
| 40          | 1.4       | 2.5           | 2.7                    |
| 60          | 1.6       | 3.2           | 2.8                    |
| 80          | 1.8       | 3.7           | 2.9                    |
| 100         | 2.0       | 4.0           | 3.0                    |

**Figure 4**: Car aerodynamic maps showing speed dependency of drag coefficient CD (solid curve), downforce coefficient CL (dot-dash curve), and aerodynamic centre of pressure location (dashed curve) measured from front axle.

---

## 2.5 Wheel Torque Distribution

To optimize vehicle performance, individual road wheel torques must be controlled through:
1. **Braking system**: Equal pressure to brake callipers on each axle
2. **Drive torques**: Controlled by differential mechanism

### 2.5.1 Brakes

Equal brake calliper pressures approximate equal braking torques when neither wheel on an axle is locked.

**Equation (24)** - Front wheel brake constraint:
```math
0 = max(ωfr, 0) × max(ωfl, 0) × (Ffrx - Fflx)
```

Where:
- `ωfr`, `ωfl`: Angular velocities of front right and left wheels
- If either wheel locks up (non-positive angular velocity), constraint becomes inactive

### 2.5.2 Differential

Drive torque is delivered through a limited-slip differential:

**Equation (25)** - Differential model:
```math
R(Flrx - Frrx) = -kd(ωlr - ωrr)
```

Where:
- `R`: Wheel radius
- `kd`: Torsional damping coefficient
- `ωlr`, `ωrr`: Rear wheel angular velocities

**Special cases**:
- **Open differential**: `kd = 0`
- **Locked differential**: `kd` arbitrarily large
- **Limited slip**: Between these extremes

---

## Key Physical Parameters Summary

### Track Parameters
- **Curvature** `C(s)`: Defines racing line geometry
- **Width** `N(s)`: Constraint boundaries  
- **Friction** `μ`: Grip limitations

### Vehicle Parameters
- **Mass** `M`: Affects acceleration and braking
- **Inertia** `Iz`: Yaw response characteristics
- **Wheelbase** `a + b`: Stability and handling
- **Track width** `wf`, `wr`: Load transfer characteristics

### Aerodynamic Parameters  
- **Drag coefficient** `CD(u)`: Speed-dependent resistance
- **Downforce coefficient** `CL(u)`: Speed-dependent grip enhancement
- **Center of pressure**: Load distribution effects

### Control Parameters
- **Steering angle** `δ`: Path control
- **Throttle/brake torques**: Speed control
- **Differential setting** `kd`: Traction optimization

---

*This document provides the mathematical foundation for physics-based racing line optimization using optimal control theory and vehicle dynamics modeling.*