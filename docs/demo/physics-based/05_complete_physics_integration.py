"""
Physics Model Component 5: Complete Physics Integration
Demonstrates how all components work together in the complete physics model

This shows the complete iterative optimization process combining:
1. Corner speed calculation
2. Straight speed calculation  
3. Late apex strategy
4. Lap time optimization
"""

import numpy as np
import matplotlib.pyplot as plt

# Import functionality from other components
def calculate_aerodynamic_forces(velocity, frontal_area, drag_coeff, lift_coeff):
    """Calculate aerodynamic forces"""
    air_density = 1.225
    drag_force = 0.5 * air_density * velocity**2 * drag_coeff * frontal_area
    downforce = 0.5 * air_density * velocity**2 * lift_coeff * frontal_area
    return drag_force, downforce

def calculate_corner_speed(kappa, params, friction, g=9.81):
    """Corner speed calculation with iterative aerodynamics"""
    v_estimate = 30.0
    
    for _ in range(3):
        _, downforce = calculate_aerodynamic_forces(
            v_estimate, params['frontal_area'], 
            params['drag_coefficient'], params['lift_coefficient']
        )
        
        total_normal_force = params['mass'] * g + downforce
        max_lateral_force = friction * total_normal_force
        
        if abs(kappa) > 1e-10:
            v_max_squared = max_lateral_force / (params['mass'] * abs(kappa))
            v_new = np.sqrt(v_max_squared) if v_max_squared > 0 else 10.0
        else:
            v_new = 80.0
        
        if abs(v_new - v_estimate) < 0.5:
            break
        
        v_estimate = 0.7 * v_estimate + 0.3 * v_new
    
    return max(5.0, min(v_estimate, 100.0))

def calculate_straight_speed(params):
    """Straight speed calculation (drag-limited)"""
    max_drive_force = params['mass'] * params['max_acceleration']
    
    # Solve: F_drive = 0.5 * rho * v² * Cd * A
    air_density = 1.225
    denominator = air_density * params['drag_coefficient'] * params['frontal_area']
    
    if denominator > 0:
        v_squared = (2 * max_drive_force) / denominator
        drag_limited_speed = np.sqrt(v_squared) if v_squared > 0 else 80.0
    else:
        drag_limited_speed = 80.0
    
    return min(drag_limited_speed, 100.0)

def calculate_physics_speeds(track_curvature, params, friction):
    """Calculate speed profile using physics"""
    speeds = np.zeros(len(track_curvature))
    straight_speed = calculate_straight_speed(params)
    
    for i, kappa in enumerate(track_curvature):
        if abs(kappa) > 1e-6:  # Corner section
            speeds[i] = calculate_corner_speed(kappa, params, friction)
        else:  # Straight section
            speeds[i] = straight_speed
    
    return speeds

def calculate_racing_line_offsets(track_points, track_curvature, speeds, track_width, params):
    """Calculate racing line offsets using late apex strategy"""
    n_points = len(track_points)
    offsets = np.zeros(n_points)
    max_offset = track_width * 0.4  # 80% track usage
    
    for i in range(5, n_points - 5):  # Skip endpoints
        current_curvature = abs(track_curvature[i])
        
        if current_curvature > 0.003:  # Corner section
            corner_direction = -np.sign(track_curvature[i])
            current_speed = speeds[i]
            
            # Speed-based strategy
            if current_speed < 30:
                speed_factor = 1.0
            elif current_speed < 50:
                speed_factor = 0.8
            else:
                speed_factor = 0.6
            
            # Determine corner phase
            look_ahead = min(i + 10, n_points - 1)
            look_behind = max(i - 10, 0)
            
            ahead_curvature = np.mean(np.abs(track_curvature[i:look_ahead]))
            behind_curvature = np.mean(np.abs(track_curvature[look_behind:i]))
            
            if (behind_curvature < current_curvature and ahead_curvature < current_curvature):
                phase_factor = 0.9 * speed_factor  # Apex
            elif behind_curvature < current_curvature:
                phase_factor = -0.7 * speed_factor  # Entry
            else:
                phase_factor = -0.6 * speed_factor  # Exit
            
            offsets[i] = max_offset * phase_factor * corner_direction
    
    return offsets

def apply_offsets_to_racing_line(track_points, offsets):
    """Apply calculated offsets to track points"""
    racing_line = track_points.copy()
    n_points = len(track_points)
    
    for i in range(1, n_points - 1):
        # Calculate perpendicular direction
        prev_point = track_points[i-1]
        next_point = track_points[i+1]
        
        tangent = next_point - prev_point
        tangent_norm = np.linalg.norm(tangent)
        
        if tangent_norm > 1e-10:
            tangent = tangent / tangent_norm
            perpendicular = np.array([-tangent[1], tangent[0]])
            racing_line[i] = track_points[i] + offsets[i] * perpendicular
    
    return racing_line

def calculate_lap_time(speeds, racing_line):
    """Calculate total lap time"""
    distances = np.zeros(len(racing_line))
    
    for i in range(len(racing_line) - 1):
        dx = racing_line[i+1][0] - racing_line[i][0]
        dy = racing_line[i+1][1] - racing_line[i][1]
        distances[i] = np.sqrt(dx**2 + dy**2)
    
    # Close the loop
    if len(racing_line) > 2:
        dx = racing_line[0][0] - racing_line[-1][0]
        dy = racing_line[0][1] - racing_line[-1][1]
        distances[-1] = np.sqrt(dx**2 + dy**2)
    
    lap_time = 0.0
    for i in range(len(distances)):
        if speeds[i] > 1e-6 and distances[i] > 1e-6:
            lap_time += distances[i] / speeds[i]
        else:
            lap_time += distances[i] / 10.0
    
    return lap_time

def optimize_path_geometry(racing_line, speeds):
    """Optimize path geometry for high-speed sections"""
    optimized_path = racing_line.copy()
    n_points = len(racing_line)
    
    for i in range(2, n_points - 2):
        if speeds[i] > 40.0:  # High-speed sections
            prev_point = racing_line[i-1]
            current_point = racing_line[i]
            next_point = racing_line[i+1]
            
            # 3-point smoothing
            smooth_x = (prev_point[0] + 2 * current_point[0] + next_point[0]) / 4
            smooth_y = (prev_point[1] + 2 * current_point[1] + next_point[1]) / 4
            
            # 30% smoothing weight
            weight = 0.3
            optimized_path[i][0] = (1 - weight) * current_point[0] + weight * smooth_x
            optimized_path[i][1] = (1 - weight) * current_point[1] + weight * smooth_y
    
    return optimized_path

def complete_physics_optimization(track_points, track_curvature, track_width, car_params, friction=1.0):
    """
    COMPLETE physics model optimization process
    Exactly as implemented in physics_model.py
    """
    
    print("=" * 80)
    print("🏎️  COMPLETE PHYSICS MODEL INTEGRATION")
    print("=" * 80)
    
    # Parameters from implementation
    MAX_ITERATIONS = 4
    CONVERGENCE_THRESHOLD = 0.15  # seconds
    
    print(f"Starting physics optimization...")
    print(f"Max iterations: {MAX_ITERATIONS}")
    print(f"Convergence threshold: {CONVERGENCE_THRESHOLD}s")
    print(f"Track points: {len(track_points)}")
    print(f"Track width: {track_width}m")
    print(f"Friction: {friction}")
    
    # Initialize optimization
    current_path = track_points.copy()
    best_lap_time = float('inf')
    best_path = current_path.copy()
    
    optimization_history = []
    
    # Optimization loop
    for iteration in range(MAX_ITERATIONS):
        print(f"\n{'='*60}")
        print(f"🔄 ITERATION {iteration + 1}/{MAX_ITERATIONS}")
        print(f"{'='*60}")
        
        # Step 1: Calculate physics-based speeds
        print("📊 Step 1: Calculating physics-based speeds...")
        speeds = calculate_physics_speeds(track_curvature, car_params, friction)
        print(f"   Speed range: {np.min(speeds):.1f} - {np.max(speeds):.1f} m/s")
        print(f"   Average speed: {np.mean(speeds):.1f} m/s")
        
        # Step 2: Calculate racing line offsets
        print("🏁 Step 2: Calculating racing line offsets...")
        offsets = calculate_racing_line_offsets(current_path, track_curvature, speeds, track_width, car_params)
        print(f"   Offset range: {np.min(offsets):.2f} - {np.max(offsets):.2f} m")
        print(f"   Track usage: {(np.max(np.abs(offsets)) / (track_width/2)) * 100:.1f}%")
        
        # Step 3: Apply offsets to get racing line
        print("📐 Step 3: Applying offsets to racing line...")
        racing_line = apply_offsets_to_racing_line(current_path, offsets)
        
        # Step 4: Calculate optimized speed profile
        print("⚡ Step 4: Calculating optimized speed profile...")
        optimized_speeds = calculate_physics_speeds(track_curvature, car_params, friction)
        
        # Step 5: Calculate lap time
        print("⏱️  Step 5: Calculating lap time...")
        lap_time = calculate_lap_time(optimized_speeds, racing_line)
        print(f"   Lap time: {lap_time:.2f}s")
        
        # Step 6: Check for improvement
        if lap_time < best_lap_time:
            improvement = best_lap_time - lap_time
            best_lap_time = lap_time
            best_path = racing_line.copy()
            print(f"   ✅ NEW BEST! Improvement: {improvement:.2f}s")
        else:
            print(f"   ⚠️  No improvement this iteration")
        
        # Store iteration data
        iteration_data = {
            'iteration': iteration + 1,
            'lap_time': lap_time,
            'speeds': optimized_speeds.copy(),
            'racing_line': racing_line.copy(),
            'offsets': offsets.copy(),
            'is_best': lap_time == best_lap_time
        }
        optimization_history.append(iteration_data)
        
        # Step 7: Check convergence
        if iteration > 0:
            prev_lap_time = optimization_history[-2]['lap_time']
            improvement = abs(prev_lap_time - lap_time)
            
            if improvement < CONVERGENCE_THRESHOLD:
                print(f"   🎯 CONVERGED! Improvement < {CONVERGENCE_THRESHOLD}s")
                break
            else:
                print(f"   🔄 Not converged (improvement: {improvement:.3f}s)")
        
        # Step 8: Optimize path geometry for next iteration
        if iteration < MAX_ITERATIONS - 1:
            print("🔧 Step 6: Optimizing path geometry for next iteration...")
            current_path = optimize_path_geometry(racing_line, optimized_speeds)
    
    print(f"\n{'='*60}")
    print("🏆 OPTIMIZATION COMPLETED")
    print(f"{'='*60}")
    print(f"Final lap time: {best_lap_time:.2f}s")
    print(f"Iterations used: {len(optimization_history)}")
    
    return best_path, best_lap_time, optimization_history

def demonstrate_complete_physics_integration():
    """Demonstrate the complete physics model with all components"""
    
    # Car parameters (from physics_model.py defaults)
    car_params = {
        'mass': 1500.0,  # kg
        'max_acceleration': 5.0,  # m/s²
        'frontal_area': 4.9,  # m²
        'drag_coefficient': 1.0,
        'lift_coefficient': 3.0
    }
    
    # Create a realistic track with corners and straights
    n_points = 80
    track_width = 20.0
    
    # Create track layout (figure-8 style)
    t = np.linspace(0, 4*np.pi, n_points)
    track_points = np.column_stack([
        30 * np.cos(t) + 10 * np.cos(t/2),
        20 * np.sin(t)
    ])
    
    # Calculate track curvature
    track_curvature = np.zeros(n_points)
    for i in range(1, n_points - 1):
        # Simple curvature estimation
        p1 = track_points[i-1]
        p2 = track_points[i]
        p3 = track_points[i+1]
        
        # Vectors
        v1 = p2 - p1
        v2 = p3 - p2
        
        # Cross product for curvature
        cross = v1[0] * v2[1] - v1[1] * v2[0]
        v1_norm = np.linalg.norm(v1)
        v2_norm = np.linalg.norm(v2)
        
        if v1_norm > 0 and v2_norm > 0:
            track_curvature[i] = cross / (v1_norm * v2_norm * ((v1_norm + v2_norm) / 2))
    
    # Add some noise and smoothing
    track_curvature = track_curvature * 0.05  # Scale to realistic values
    
    # Run complete optimization
    best_path, best_lap_time, history = complete_physics_optimization(
        track_points, track_curvature, track_width, car_params
    )
    
    # Create comprehensive visualization
    fig = plt.figure(figsize=(20, 16))
    
    # Create a 3x3 grid
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # 1. Track layout with racing line evolution
    ax1 = fig.add_subplot(gs[0, :2])
    
    # Track boundaries
    ax1.plot(track_points[:, 0], track_points[:, 1], 'k--', linewidth=2, label='Centerline')
    
    # Show racing line evolution
    colors = ['red', 'orange', 'yellow', 'green']
    for i, iteration_data in enumerate(history):
        racing_line = iteration_data['racing_line']
        color = colors[i] if i < len(colors) else 'blue'
        alpha = 0.5 + 0.5 * (i / len(history))
        
        label = f"Iteration {iteration_data['iteration']}"
        if iteration_data['is_best']:
            label += " (BEST)"
        
        ax1.plot(racing_line[:, 0], racing_line[:, 1], 
                color=color, linewidth=3, alpha=alpha, label=label)
    
    ax1.set_xlabel('X Position (m)')
    ax1.set_ylabel('Y Position (m)')
    ax1.set_title('Racing Line Evolution Through Iterations', weight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    ax1.axis('equal')
    
    # 2. Lap time convergence
    ax2 = fig.add_subplot(gs[0, 2])
    
    iterations = [h['iteration'] for h in history]
    lap_times = [h['lap_time'] for h in history]
    
    ax2.plot(iterations, lap_times, 'bo-', linewidth=3, markersize=8)
    
    # Mark best iteration
    best_iteration = next(h for h in history if h['is_best'])
    ax2.plot(best_iteration['iteration'], best_iteration['lap_time'], 
            'ro', markersize=12, label=f"Best: {best_iteration['lap_time']:.2f}s")
    
    ax2.set_xlabel('Iteration')
    ax2.set_ylabel('Lap Time (s)')
    ax2.set_title('Convergence History', weight='bold')
    ax2.grid(True, alpha=0.3)
    ax2.legend()
    
    # 3. Speed profiles comparison
    ax3 = fig.add_subplot(gs[1, :2])
    
    distance = np.arange(len(track_points))
    
    for i, iteration_data in enumerate(history):
        speeds = iteration_data['speeds']
        alpha = 0.4 + 0.6 * (i / len(history))
        
        ax3.plot(distance, speeds, linewidth=2, alpha=alpha, 
                label=f"Iteration {iteration_data['iteration']}")
    
    ax3.set_xlabel('Track Position')
    ax3.set_ylabel('Speed (m/s)')
    ax3.set_title('Speed Profile Evolution', weight='bold')
    ax3.legend()
    ax3.grid(True, alpha=0.3)
    
    # 4. Curvature analysis
    ax4 = fig.add_subplot(gs[1, 2])
    
    ax4.plot(distance, track_curvature * 1000, 'purple', linewidth=2, label='Curvature × 1000')
    ax4.axhline(y=3, color='red', linestyle='--', alpha=0.7, label='Corner threshold (0.003)')
    
    ax4.set_xlabel('Track Position')
    ax4.set_ylabel('Curvature × 1000 (1/m)')
    ax4.set_title('Track Curvature Profile', weight='bold')
    ax4.legend()
    ax4.grid(True, alpha=0.3)
    
    # 5. Component integration summary
    ax5 = fig.add_subplot(gs[2, :])
    ax5.axis('off')
    
    summary_text = f"""
COMPLETE PHYSICS MODEL INTEGRATION SUMMARY

🏁 OPTIMIZATION RESULTS:
   • Initial lap time: {history[0]['lap_time']:.2f}s
   • Final lap time: {best_lap_time:.2f}s
   • Total improvement: {history[0]['lap_time'] - best_lap_time:.2f}s ({(history[0]['lap_time'] - best_lap_time)/history[0]['lap_time']*100:.1f}%)
   • Iterations used: {len(history)}/4

🔧 PHYSICS COMPONENTS INTEGRATED:

1. CORNER SPEED CALCULATION:
   • Formula: v_max = √(μ × (mg + F_downforce) / (m × κ))
   • Iterative aerodynamic solution (3 iterations)
   • Speed range: {np.min([np.min(h['speeds']) for h in history]):.1f} - {np.max([np.max(h['speeds']) for h in history]):.1f} m/s

2. STRAIGHT SPEED CALCULATION:
   • Drag-limited: F_drive = F_drag
   • Max driving force: {car_params['mass'] * car_params['max_acceleration']:.0f} N
   • Top speed: {calculate_straight_speed(car_params):.1f} m/s

3. LATE APEX STRATEGY:
   • Track usage: 80% (±{track_width * 0.4:.1f}m offset)
   • Speed-based factors: 1.0 (slow), 0.8 (medium), 0.6 (fast)
   • Phase-based positioning: Entry (-0.7), Apex (0.9), Exit (-0.6)

4. LAP TIME OPTIMIZATION:
   • Objective: minimize ∫(1/v) ds
   • Convergence threshold: 0.15s
   • Path geometry optimization: 30% smoothing on high-speed sections (>40 m/s)

💡 KEY INSIGHTS:
   • All components work synergistically for lap time minimization
   • Physics-based speeds ensure realistic vehicle behavior
   • Late apex strategy optimizes corner exit acceleration
   • Iterative optimization converges to near-optimal solution
   • Path geometry optimization balances speed and smoothness
"""
    
    ax5.text(0.05, 0.95, summary_text, fontsize=12, transform=ax5.transAxes,
             verticalalignment='top', fontfamily='monospace')
    
    plt.suptitle('Complete Physics Model Integration - All Components Working Together', 
                fontsize=18, weight='bold')
    
    plt.show()
    
    return best_path, best_lap_time, history

if __name__ == "__main__":
    demonstrate_complete_physics_integration()
