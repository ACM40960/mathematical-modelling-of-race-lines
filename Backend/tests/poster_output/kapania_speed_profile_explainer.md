# Kapania Two‑Step Speed Profile (Figure Explainer)

This figure shows how the algorithm builds a minimum‑lap‑time speed profile along the track distance (s).

## How to read it
- x‑axis (all panels): arc‑length s from start/finish (meters).
- κ(s): track curvature (tight corners = higher |κ|).
- Ux (m/s): longitudinal speed.

## Panel‑by‑panel
- (a) Curvature κ(s)
  - Sharp peaks = tight corners; flat regions = straights.
  - Everything downstream in the speed profile reacts to this signal.

- (b) Zero‑longitudinal‑force speed, v_ss(s) [label: Fx = 0]
  - Lateral‑grip limit only: v_ss ≈ sqrt(μ g / |κ|) with F1 extensions (downforce, tire stiffness, caps).
  - Drops in corners (high |κ|), rises on straights.

- (c) Forward pass (solid) vs v_ss (dashed)
  - Integrates acceleration: v_i = min( sqrt(v_{i−1}^2 + 2 F_eff Δs / m), v_ss,i ).
  - Accounts for engine force reduced by cornering demand; cannot exceed v_ss.
  - Shows how the car builds speed after slow corners and up straights.

- (d) Backward pass (solid) vs Forward (dashed)
  - Enforces braking feasibility for upcoming corners: v_i = min( sqrt(max(v_{i+1}^2 − 2 F_br,eff Δs / m, v_min^2)), v_i ).
  - Includes stability from yaw inertia and reduced braking under lateral load.
  - Final result is the feasible speed everywhere; this, integrated over distance, gives lap time.

## Key equations (used in code)
- Curvature from points: κ_i ≈ |(p_i−p_{i−1})×(p_{i+1}−p_i)| / (||p_i−p_{i−1}|| ||p_{i+1}−p_i||).
- Steady‑state cornering: v_ss = sqrt(μ g / |κ|), then apply downforce/stiffness and caps.
- Forward pass (accel) and Backward pass (brake) as above.
- Lap time: T = Σ Δs_i / (0.5 (v_i + v_{i+1})).

## What to say on the poster
- We derive curvature from the centerline, set a local cornering speed limit, then do a forward pass to accelerate and a backward pass to ensure we can brake for corners; the resulting feasible speed profile minimizes lap time.
- F1 parameters (downforce, tire stiffness, mass, engine/brake multipliers, yaw inertia) tune the limits but the overall shape follows κ(s).
