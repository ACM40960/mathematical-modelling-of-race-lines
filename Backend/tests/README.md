# Poster Assets & Methodology

This folder contains poster assets and scripts. Below is the Kapania Two‑Step Algorithm flow (Mermaid) that you can paste in documentation or export. For Figma/Canva, you can also export equations as SVGs.

## Kapania Two‑Step Flow

```mermaid
flowchart TD
  A["Track centerline p(s)\n+ Car & track params (w, μ, D, C_f, C_r, m, F_eng, I_z)"] --> B["Curvature κ(s) via 3‑pt finite diff\n+ segment lengths Δs"]
  B --> C["Steady‑state speed v_ss(s)\nCorners: √(μg/|κ|) with aero & stiffness\nStraights & caps: v_str, v_min/v_max, mass scaling"]
  C --> D["Forward pass\nAccelerate with available thrust\n(load‑aware) → v^f(s)"]
  D --> E["Backward pass\nBraking feasibility with stability & lateral‑load losses → v(s)"]
  E --> F["Speed profile v(s) (clipped & smoothed)"]
  F --> G["Lap time T = Σ Δs / v_avg (objective)"]
  G --> H{"Converged?\nΔT < 0.1 s or k = 5"}
  H -- "No" --> I["Path update on high‑κ regions\nInside shift scaled by speed & turn angle\nEnforce |Δp| ≤ w/2; 3‑pt smoothing"]
  I --> C
  H -- "Yes" --> J["Output: optimal path p*(s), v(s), lap time T"]

  classDef step fill:#f7f7f7,stroke:#222,stroke-width:1px,color:#111;
  class A,B,C,D,E,F,G,H,I,J step;
```

### Notes for labels (tiny text box on poster)
- κ(s): curvature from three‑point finite difference
- v_ss(s): steady‑state corner/straight limits with aero and stiffness
- Forward/backward: integrate acceleration/braking per segment with parameter losses
- Path update: shift toward inside in high‑curvature regions, respect |Δp|≤w/2, smooth
- Stop when lap‑time improvement < 0.1 s or after 5 iterations

### Export equations as SVG
Run:

```
python3 Backend/tests/export_kapania_equations_svg.py
```

SVGs will be written to `Backend/tests/poster_output/equations/` with transparent backgrounds.

## Physics‑Based Model Flow

```mermaid
flowchart TD
  P0["Track centerline p(s)\n+ Car & aero params (m, a_max, C_D, C_L, A, μ)"] --> P1["Curvilinear system\narc‑length s; curvature κ(s)"]
  P1 --> P2["Aerodynamics\nDownforce F↓ = 1/2 ρ v² C_L A\nDrag F_drag = 1/2 ρ C_D A v²"]
  P2 --> P3["Cornering limit\nv_max = √( μ (m g + F↓) / (m |κ|) )\n(iterative in v)"]
  P3 --> P4["Straights\nSolve F_drive = m a_max = F_drag → v_str"]
  P4 --> P5["Speed profile v(s)\nCombine limits; smooth"]
  P5 --> P6["Lap time T = Σ Δs / v (objective)"]
  P6 --> P7{"Converged?\n|ΔT| < threshold"}
  P7 -- "No" --> P8["Path geometry optimization\nLate‑apex offsets; width constraint; smoothing"]
  P8 --> P1
  P7 -- "Yes" --> P9["Output: optimized path, speeds, lap time"]

  classDef step fill:#f7f7f7,stroke:#222,stroke-width:1px,color:#111;
  class P0,P1,P2,P3,P4,P5,P6,P7,P8,P9 step;
```

### Export physics equations as SVG
Run:

```
python3 Backend/tests/export_physics_equations_svg.py
```

SVGs will be written to `Backend/tests/poster_output/equations/`.

 