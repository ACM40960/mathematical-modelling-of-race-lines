import numpy as np
from scipy.optimize import minimize
import matplotlib.pyplot as plt

# -----------------------------
# Car and Bicycle Model Section
# -----------------------------
class Car:
    def __init__(self, mass=1500, length=2.5, max_steer=np.radians(30), max_accel=5):
        self.mass = mass
        self.length = length
        self.max_steer = max_steer
        self.max_accel = max_accel

def bicycle_model(state, control, dt, car):
    x, y, v, theta = state
    steer, accel = control

    steer = np.clip(steer, -car.max_steer, car.max_steer)
    accel = np.clip(accel, -car.max_accel, car.max_accel)

    x += v * np.cos(theta) * dt
    y += v * np.sin(theta) * dt
    v += accel * dt
    theta += v * np.tan(steer) / car.length * dt

    return np.array([x, y, v, theta])

def simulate_trajectory(init_state, controls, car, dt=0.1):
    states = [init_state]
    for control in controls:
        new_state = bicycle_model(states[-1], control, dt, car)
        states.append(new_state)
    return np.array(states)

# -----------------------------
# Optimization Section
# -----------------------------
def track_cost(controls_flat, init_state, track, car, dt):
    controls = controls_flat.reshape(-1, 2)
    trajectory = simulate_trajectory(init_state, controls, car, dt)
    total_cost = 0
    for pos, track_point in zip(trajectory[:, :2], track):
        dist = np.linalg.norm(pos - track_point)
        total_cost += dist**2
    return total_cost

def optimize_trajectory(init_state, track, car, N=80, dt=0.1):
    u0 = np.zeros((N, 2))  # [steer, accel]
    result = minimize(track_cost, u0.flatten(), args=(init_state, track, car, dt),
                      method='L-BFGS-B')
    optimal_controls = result.x.reshape(N, 2)
    trajectory = simulate_trajectory(init_state, optimal_controls, car, dt)
    return trajectory, optimal_controls

# -----------------------------
# Complex Curved Track Generator
# -----------------------------
def generate_complex_curved_track():
    track = []
    for i in range(80):
        x = i
        y = 2.5 * np.sin(i / 5) + 1.5 * np.cos(i / 3)
        track.append([x, y])
    return np.array(track)

# -----------------------------
# Track Boundary Computation
# -----------------------------
def compute_track_edges(track, width):
    left_edge = []
    right_edge = []
    for i in range(len(track) - 1):
        dx = track[i+1][0] - track[i][0]
        dy = track[i+1][1] - track[i][1]
        length = np.hypot(dx, dy)
        nx = -dy / length
        ny = dx / length
        left = [track[i][0] + width * nx, track[i][1] + width * ny]
        right = [track[i][0] - width * nx, track[i][1] - width * ny]
        left_edge.append(left)
        right_edge.append(right)
    left_edge.append(left_edge[-1])
    right_edge.append(right_edge[-1])
    return np.array(left_edge), np.array(right_edge)

# -----------------------------
# Main Execution and Plotting
# -----------------------------
if __name__ == "__main__":
    car = Car()
    track_width = 3.0
    init_state = np.array([0, 0, 5, 0])  # x, y, speed, heading
    complex_track = generate_complex_curved_track()

    traj, controls = optimize_trajectory(init_state, complex_track, car)
    left_edge, right_edge = compute_track_edges(complex_track, track_width)

    # Plot
    plt.plot(complex_track[:, 0], complex_track[:, 1], 'g--', label="Track Center")
    plt.plot(traj[:, 0], traj[:, 1], 'r-', label="Optimized Racing Line")
    plt.plot(left_edge[:, 0], left_edge[:, 1], 'k-', linewidth=1.5, label="Track Boundary")
    plt.plot(right_edge[:, 0], right_edge[:, 1], 'k-', linewidth=1.5)
    plt.axis("equal")
    plt.title("Optimized Racing Line on Complex Curved Track")
    plt.xlabel("x (meters)")
    plt.ylabel("y (meters)")
    plt.legend()
    plt.grid(True)
    plt.show()
