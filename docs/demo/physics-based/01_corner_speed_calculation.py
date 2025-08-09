"""
Physics Model Component 1: Corner Speed Calculation (Simplified View)
Exact physics from Backend/simulation/algorithms/physics_model.py

Formula: v_max = √(μ × (mg + F_downforce) / (m × κ))
- Iterative aerodynamics (3 iterations)
- Damped update: 70% old + 30% new
- Bounds: [5, 100] m/s
"""

import numpy as np
import matplotlib.pyplot as plt
import argparse


def calculate_aerodynamic_forces(velocity, frontal_area, drag_coeff, lift_coeff):
    air_density = 1.225  # kg/m³
    drag_force = 0.5 * air_density * velocity**2 * drag_coeff * frontal_area
    downforce = 0.5 * air_density * velocity**2 * lift_coeff * frontal_area
    return drag_force, downforce


def calculate_corner_speed(kappa, params, friction, g=9.81):
    v_estimate = 30.0

    for _ in range(3):  # Same iteration count as implementation
        _, downforce = calculate_aerodynamic_forces(
            v_estimate, params['frontal_area'], params['drag_coefficient'], params['lift_coefficient']
        )
        total_normal_force = params['mass'] * g + downforce
        max_lateral_force = friction * total_normal_force

        if abs(kappa) > 1e-10:
            v_max_sq = max_lateral_force / (params['mass'] * abs(kappa))
            v_new = np.sqrt(v_max_sq) if v_max_sq > 0 else 10.0
        else:
            v_new = 80.0

        if abs(v_new - v_estimate) < 0.5:
            break
        v_estimate = 0.7 * v_estimate + 0.3 * v_new  # Damped update

    return max(5.0, min(v_estimate, 100.0))


def main(out_path: str | None = None):
    # Exact default parameters from physics_model.py
    car_params = {
        'mass': 1500.0,
        'frontal_area': 4.9,
        'drag_coefficient': 1.0,
        'lift_coefficient': 3.0,
    }

    # Core single plot: speed vs curvature
    curvatures = np.linspace(0.01, 0.2, 50)
    speeds = [calculate_corner_speed(k, car_params, friction=1.0) for k in curvatures]

    # Example markers
    examples = [
        (0.15, 'Hairpin'),
        (0.08, 'Chicane'),
        (0.02, 'Fast sweeper'),
    ]
    example_points = [(k, calculate_corner_speed(k, car_params, 1.0), label) for k, label in examples]

    plt.figure(figsize=(10, 6))
    plt.plot(curvatures, speeds, linewidth=3, color='#1f77b4')
    for k, v, label in example_points:
        plt.plot(k, v, 'ro')
        plt.annotate(f"{label}\n{v:.1f} m/s", xy=(k, v), xytext=(k + 0.01, v + 3),
                     arrowprops=dict(arrowstyle='->', color='red'), fontsize=9, weight='bold')

    plt.title('Corner Speed vs Curvature (Physics Model)\n' 
              'v = √(μ(mg + F_down)/(mκ))', weight='bold')
    plt.xlabel('Curvature κ (1/m)')
    plt.ylabel('Max Corner Speed (m/s)')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    if out_path:
        plt.savefig(out_path, dpi=200, bbox_inches='tight')
    else:
        plt.show()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=str, default=None, help='Path to save the figure (PNG)')
    args = parser.parse_args()
    main(args.out)
