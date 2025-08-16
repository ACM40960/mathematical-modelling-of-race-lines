"""
Physics Model Component 2: Straight Speed Calculation (Simplified View)
Exact physics from Backend/simulation/algorithms/physics_model.py

Equilibrium: F_drive = F_drag
- Driving force: F = mass × max_acceleration
- Drag: F = 0.5 × ρ × v² × C_d × A
- Speed limit: 100 m/s
"""

import numpy as np
import matplotlib.pyplot as plt
import argparse


def calculate_aerodynamic_forces(velocity, frontal_area, drag_coeff):
    air_density = 1.225  # kg/m³
    drag_force = 0.5 * air_density * velocity**2 * drag_coeff * frontal_area
    return drag_force


def calculate_drag_limited_speed(max_drive_force, frontal_area, drag_coefficient):
    air_density = 1.225
    denom = air_density * drag_coefficient * frontal_area
    if denom <= 0:
        return 80.0
    v_sq = (2 * max_drive_force) / denom
    return np.sqrt(v_sq) if v_sq > 0 else 80.0


def main(out_path: str | None = None):
    # Exact defaults from physics_model.py
    params = {
        'mass': 1500.0,
        'max_acceleration': 5.0,
        'frontal_area': 4.9,
        'drag_coefficient': 1.0,
    }

    max_drive_force = params['mass'] * params['max_acceleration']
    v_drag = calculate_drag_limited_speed(max_drive_force, params['frontal_area'], params['drag_coefficient'])
    v_final = min(v_drag, 100.0)

    # Single clear plot: Drag vs Speed with driving force line
    speeds = np.linspace(0, 120, 400)
    drag_forces = [calculate_aerodynamic_forces(v, params['frontal_area'], params['drag_coefficient']) for v in speeds]
    drag_eq = calculate_aerodynamic_forces(v_final, params['frontal_area'], params['drag_coefficient'])

    plt.figure(figsize=(10, 6))
    plt.plot(speeds, drag_forces, 'r-', linewidth=3, label='Drag Force (0.5ρv²C_dA)')
    plt.axhline(y=max_drive_force, color='blue', linewidth=3, label=f'Driving Force (ma) = {max_drive_force:.0f} N')
    plt.plot(v_final, drag_eq, 'go', markersize=10, label=f'Equilibrium ≈ {v_final:.1f} m/s')

    plt.title('Straight Speed (Drag-Limited) — Physics Model\nF_drive = F_drag at max speed', weight='bold')
    plt.xlabel('Speed (m/s)')
    plt.ylabel('Force (N)')
    plt.xlim(0, 120)
    plt.grid(True, alpha=0.3)
    plt.legend(loc='upper left')
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
