"""
Physics Model Component 3: Late Apex Strategy (Simplified View)
Exact strategy from Backend/simulation/algorithms/physics_model.py

- Speed-based factors: 1.0 (<30 m/s), 0.8 (30-50), 0.6 (>50)
- Phase factors: Entry -0.7, Apex +0.9, Exit -0.6
- Max offset: 40% of track width (80% usage)
"""

import numpy as np
import matplotlib.pyplot as plt
import argparse


def late_apex_offsets(curvature, speeds, track_width):
    n = len(curvature)
    offsets = np.zeros(n)
    max_offset = track_width * 0.4

    for i in range(5, n - 5):  # Skip endpoints (same as implementation)
        k = abs(curvature[i])
        if k > 0.003:  # Corner
            corner_direction = -np.sign(curvature[i])
            v = speeds[i]
            # Speed factor
            if v < 30:
                sf = 1.0
            elif v < 50:
                sf = 0.8
            else:
                sf = 0.6
            # Phase factor
            look_ahead = min(i + 10, n - 1)
            look_behind = max(i - 10, 0)
            ahead_k = np.mean(np.abs(curvature[i:look_ahead]))
            behind_k = np.mean(np.abs(curvature[look_behind:i]))
            if behind_k < k and ahead_k < k:
                pf = 0.9 * sf  # Apex
            elif behind_k < k:
                pf = -0.7 * sf  # Entry
            else:
                pf = -0.6 * sf  # Exit
            offsets[i] = max_offset * pf * corner_direction
    return offsets


def main(out_path: str | None = None):
    # Synthetic single corner for clarity
    n = 120
    track_width = 20.0
    x = np.linspace(0, 120, n)

    curvature = np.zeros(n)
    corner_start, corner_end = 40, 80
    for i in range(corner_start, corner_end + 1):
        t = (i - corner_start) / (corner_end - corner_start)
        curvature[i] = 0.08 * (1 - 4 * (t - 0.5) ** 2)

    speeds = np.full(n, 70.0)
    for i in range(corner_start, corner_end + 1):
        t = (i - corner_start) / (corner_end - corner_start)
        speeds[i] = 25 + 35 * (4 * (t - 0.5) ** 2)

    offsets = late_apex_offsets(curvature, speeds, track_width)

    # Single clean plot: track centerline and racing line (offsets)
    plt.figure(figsize=(12, 6))
    centerline_y = np.zeros_like(x)
    racing_y = offsets

    plt.fill_between(x, -track_width / 2, track_width / 2, color='lightgray', alpha=0.4, label='Track')
    plt.plot(x, centerline_y, 'k--', linewidth=2, label='Centerline')
    plt.plot(x, racing_y, 'r-', linewidth=3, label='Racing line (late apex)')

    # Annotate phases by coloring regions
    plt.axvspan(0, corner_start, color='skyblue', alpha=0.2, label='Straight')
    plt.axvspan(corner_start, corner_end, color='khaki', alpha=0.3, label='Corner')

    plt.title('Late Apex Strategy — Physics Model\nEntry → Apex → Exit (offsets relative to centerline)', weight='bold')
    plt.xlabel('Distance along track (m)')
    plt.ylabel('Offset from centerline (m)')
    plt.ylim(-12, 12)
    plt.grid(True, alpha=0.3)
    plt.legend(loc='upper right')
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
