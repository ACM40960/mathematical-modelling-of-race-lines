"""
Physics Model Component 4: Lap Time Optimization (Simplified View)
Exact objective and smoothing from Backend/simulation/algorithms/physics_model.py

Objective: minimize T = ∫(1/v) ds
- Max iterations: 4
- Convergence threshold: 0.15 s
- Path smoothing: 30% on points with speed > 40 m/s
"""

import numpy as np
import matplotlib.pyplot as plt
import argparse


def distances(points):
    d = np.zeros(len(points))
    for i in range(len(points) - 1):
        dx = points[i+1][0] - points[i][0]
        dy = points[i+1][1] - points[i][1]
        d[i] = np.sqrt(dx**2 + dy**2)
    if len(points) > 2:
        dx = points[0][0] - points[-1][0]
        dy = points[0][1] - points[-1][1]
        d[-1] = np.sqrt(dx**2 + dy**2)
    return d


def lap_time(speeds, racing_line):
    d = distances(racing_line)
    t = 0.0
    for i in range(len(d)):
        if speeds[i] > 1e-6 and d[i] > 1e-6:
            t += d[i] / speeds[i]
        else:
            t += d[i] / 10.0
    return t


def smooth_path_high_speed(racing_line, speeds):
    optimized = racing_line.copy()
    n = len(racing_line)
    smoothed = 0
    for i in range(2, n - 2):
        if speeds[i] > 40.0:  # High-speed sections
            p_prev, p_cur, p_next = racing_line[i-1], racing_line[i], racing_line[i+1]
            sx = (p_prev[0] + 2 * p_cur[0] + p_next[0]) / 4
            sy = (p_prev[1] + 2 * p_cur[1] + p_next[1]) / 4
            w = 0.3  # 30% smoothing
            optimized[i][0] = (1 - w) * p_cur[0] + w * sx
            optimized[i][1] = (1 - w) * p_cur[1] + w * sy
            smoothed += 1
    return optimized, smoothed


def main(out_path: str | None = None):
    # Synthetic oval to keep the visualization simple
    n = 80
    theta = np.linspace(0, 2*np.pi, n)
    r = 30
    track = np.column_stack([r * np.cos(theta), r * np.sin(theta)])

    # Speeds similar in shape to real runs (bounded 15-70 m/s)
    speeds = 30 + 25 * np.sin(2 * theta)
    speeds = np.clip(speeds, 15, 70)

    MAX_ITER = 4
    THRESH = 0.15

    path = track.copy()
    times = []
    best_path = path.copy()
    best_time = float('inf')

    for it in range(1, MAX_ITER + 1):
        t = lap_time(speeds, path)
        times.append(t)
        if t < best_time:
            best_time = t
            best_path = path.copy()

        if it == MAX_ITER:
            break
        next_path, smoothed = smooth_path_high_speed(path, speeds)
        path = next_path

        if len(times) > 1 and abs(times[-1] - times[-2]) < THRESH:
            break

    # Single clear plot: Convergence of lap time across iterations
    plt.figure(figsize=(10, 6))
    plt.plot(range(1, len(times)+1), times, 'bo-', linewidth=3, markersize=8)
    plt.title('Lap Time Optimization — Physics Model\nT = ∫(1/v) ds, smoothing 30% on >40 m/s', weight='bold')
    plt.xlabel('Iteration')
    plt.ylabel('Lap Time (s)')
    plt.grid(True, alpha=0.3)
    for i in range(1, len(times)):
        imp = times[i-1] - times[i]
        plt.annotate(f'{imp:+.2f}s', xy=(i+1, times[i]), xytext=(i+1.05, times[i]+0.5),
                     arrowprops=dict(arrowstyle='->', color='green' if imp>0 else 'red'),
                     fontsize=9, weight='bold')
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
