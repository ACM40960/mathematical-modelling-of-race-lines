#!/usr/bin/env python3
"""
🏎️ Curvature Calculation Demo Script
This script shows how the computer calculates curvature to detect corners vs straights
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter1d

def create_sample_tracks():
    """Create different types of track sections for demonstration"""
    
    # 1. Straight line
    straight_x = np.linspace(0, 100, 50)
    straight_y = np.zeros(50) + 50  # Horizontal line
    
    # 2. Gentle curve
    gentle_t = np.linspace(0, np.pi/2, 50)
    gentle_x = 50 * np.cos(gentle_t)
    gentle_y = 50 * np.sin(gentle_t) + 50
    
    # 3. Sharp corner
    sharp_t = np.linspace(0, np.pi/2, 25)  # Same angle, fewer points = sharper
    sharp_x = 25 * np.cos(sharp_t) + 100
    sharp_y = 25 * np.sin(sharp_t) + 25
    
    # 4. Complex racing circuit (like yours!)
    circuit_t = np.linspace(0, 2*np.pi, 100)
    circuit_x = 100 + 80*np.cos(circuit_t) + 30*np.cos(3*circuit_t)
    circuit_y = 100 + 60*np.sin(circuit_t) + 20*np.sin(2*circuit_t)
    
    return {
        'straight': np.column_stack([straight_x, straight_y]),
        'gentle': np.column_stack([gentle_x, gentle_y]),
        'sharp': np.column_stack([sharp_x, sharp_y]),
        'circuit': np.column_stack([circuit_x, circuit_y])
    }

def compute_curvature_baby_explanation(points):
    """
    Calculate curvature with detailed explanation of each step
    This is the EXACT same method used in your racing line optimizer!
    """
    print(f"\n🔍 CURVATURE CALCULATION for {len(points)} points:")
    print("=" * 60)
    
    # Step 1: Calculate first derivatives (how fast x and y change)
    print("Step 1: Calculate how fast X and Y coordinates change...")
    dx_dt = np.gradient(points[:, 0])  # Change in X direction
    dy_dt = np.gradient(points[:, 1])  # Change in Y direction
    print(f"   dx_dt range: {dx_dt.min():.3f} to {dx_dt.max():.3f}")
    print(f"   dy_dt range: {dy_dt.min():.3f} to {dy_dt.max():.3f}")
    
    # Step 2: Calculate second derivatives (how much the direction changes)
    print("\nStep 2: Calculate how much the DIRECTION changes...")
    d2x_dt2 = np.gradient(dx_dt)  # Change in the change of X
    d2y_dt2 = np.gradient(dy_dt)  # Change in the change of Y
    print(f"   d2x_dt2 range: {d2x_dt2.min():.3f} to {d2x_dt2.max():.3f}")
    print(f"   d2y_dt2 range: {d2y_dt2.min():.3f} to {d2y_dt2.max():.3f}")
    
    # Step 3: Apply the magic curvature formula
    print("\nStep 3: Apply the magic curvature formula...")
    print("   Formula: κ = |x'y'' - y'x''| / (x'² + y'²)^(3/2)")
    
    numerator = np.abs(dx_dt * d2y_dt2 - dy_dt * d2x_dt2)
    denominator = (dx_dt * dx_dt + dy_dt * dy_dt)**1.5
    
    # Handle division by zero (when car stops moving)
    safe_denominator = np.where(denominator < 1e-10, 1e-10, denominator)
    curvature = numerator / safe_denominator
    
    # Clean up any mathematical errors
    curvature = np.where(np.isfinite(curvature), curvature, 0.0)
    
    print(f"   Raw curvature range: {curvature.min():.6f} to {curvature.max():.6f}")
    
    # Step 4: Apply smoothing (like your racing line optimizer does)
    print("\nStep 4: Apply smoothing to reduce noise...")
    if len(curvature) > 10:
        # This is the EXACT smoothing from your optimizer!
        smoothed_points = points.copy()
        smoothed_points[:, 0] = gaussian_filter1d(points[:, 0], sigma=2.0)
        smoothed_points[:, 1] = gaussian_filter1d(points[:, 1], sigma=2.0)
        
        # Recalculate with smoothed points
        dx_dt_smooth = np.gradient(smoothed_points[:, 0])
        dy_dt_smooth = np.gradient(smoothed_points[:, 1])
        d2x_dt2_smooth = np.gradient(dx_dt_smooth)
        d2y_dt2_smooth = np.gradient(dy_dt_smooth)
        
        numerator_smooth = np.abs(dx_dt_smooth * d2y_dt2_smooth - dy_dt_smooth * d2x_dt2_smooth)
        denominator_smooth = (dx_dt_smooth * dx_dt_smooth + dy_dt_smooth * dy_dt_smooth)**1.5
        safe_denominator_smooth = np.where(denominator_smooth < 1e-10, 1e-10, denominator_smooth)
        curvature_smooth = numerator_smooth / safe_denominator_smooth
        curvature_smooth = np.where(np.isfinite(curvature_smooth), curvature_smooth, 0.0)
        
        # Additional smoothing
        curvature_smooth = gaussian_filter1d(curvature_smooth, sigma=1.5)
        
        print(f"   Smoothed curvature range: {curvature_smooth.min():.6f} to {curvature_smooth.max():.6f}")
        curvature = curvature_smooth
    
    return curvature

def classify_corners(curvature, threshold=0.005):
    """
    Classify each point as corner or straight using the EXACT threshold from your code
    """
    print(f"\n🏁 CORNER DETECTION (threshold = {threshold}):")
    print("=" * 60)
    
    corners = curvature > threshold
    straights = curvature <= threshold
    
    corner_count = np.sum(corners)
    straight_count = np.sum(straights)
    total_points = len(curvature)
    
    print(f"   📊 Total points: {total_points}")
    print(f"   🏁 Corner points: {corner_count} ({100*corner_count/total_points:.1f}%)")
    print(f"   🏃‍♂️ Straight points: {straight_count} ({100*straight_count/total_points:.1f}%)")
    
    if corner_count > 0:
        corner_curvatures = curvature[corners]
        print(f"   📈 Corner curvature range: {corner_curvatures.min():.6f} to {corner_curvatures.max():.6f}")
        
        # Classify corner severity (like your racing line optimizer does)
        gentle_corners = np.sum((corner_curvatures > threshold) & (corner_curvatures < 0.01))
        medium_corners = np.sum((corner_curvatures >= 0.01) & (corner_curvatures < 0.02))
        sharp_corners = np.sum(corner_curvatures >= 0.02)
        
        print(f"   🟢 Gentle corners ({threshold:.3f}-0.01): {gentle_corners}")
        print(f"   🟡 Medium corners (0.01-0.02): {medium_corners}")
        print(f"   🔴 Sharp corners (>0.02): {sharp_corners}")
    
    return corners, straights

def visualize_curvature(points, curvature, track_name):
    """Create visualization of track and its curvature"""
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(15, 5))
    
    # Plot 1: Track shape
    ax1.plot(points[:, 0], points[:, 1], 'b-', linewidth=2, label='Track')
    ax1.scatter(points[0, 0], points[0, 1], color='green', s=100, label='Start', zorder=5)
    ax1.scatter(points[-1, 0], points[-1, 1], color='red', s=100, label='End', zorder=5)
    ax1.set_title(f'{track_name} - Track Shape')
    ax1.set_xlabel('X Position')
    ax1.set_ylabel('Y Position')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    ax1.axis('equal')
    
    # Plot 2: Curvature along track
    track_distance = np.cumsum([0] + [np.linalg.norm(points[i] - points[i-1]) for i in range(1, len(points))])
    ax2.plot(track_distance, curvature, 'r-', linewidth=2)
    ax2.axhline(y=0.005, color='orange', linestyle='--', label='Corner Threshold (0.005)')
    ax2.fill_between(track_distance, curvature, 0.005, where=(curvature > 0.005), 
                     alpha=0.3, color='red', label='Corners')
    ax2.set_title(f'{track_name} - Curvature Analysis')
    ax2.set_xlabel('Distance Along Track')
    ax2.set_ylabel('Curvature')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    # Plot 3: Corner vs Straight classification
    corners, straights = classify_corners(curvature)
    colors = ['red' if is_corner else 'blue' for is_corner in corners]
    ax3.scatter(points[:, 0], points[:, 1], c=colors, s=30, alpha=0.7)
    ax3.plot(points[:, 0], points[:, 1], 'gray', linewidth=1, alpha=0.5)
    ax3.set_title(f'{track_name} - Corner Detection')
    ax3.set_xlabel('X Position')
    ax3.set_ylabel('Y Position')
    ax3.axis('equal')
    
    # Custom legend
    import matplotlib.patches as mpatches
    red_patch = mpatches.Patch(color='red', label='Corners')
    blue_patch = mpatches.Patch(color='blue', label='Straights')
    ax3.legend(handles=[red_patch, blue_patch])
    ax3.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig

def main():
    print("🏎️" * 20)
    print("🏎️ RACING LINE CURVATURE CALCULATOR DEMO")
    print("🏎️ Understanding How Corners Are Detected")
    print("🏎️" * 20)
    
    # Create sample tracks
    tracks = create_sample_tracks()
    
    # Analyze each track type
    for track_name, points in tracks.items():
        print(f"\n\n{'='*80}")
        print(f"🏁 ANALYZING: {track_name.upper()} TRACK")
        print(f"{'='*80}")
        
        # Calculate curvature with detailed explanation
        curvature = compute_curvature_baby_explanation(points)
        
        # Classify corners vs straights
        corners, straights = classify_corners(curvature)
        
        # Create visualization
        fig = visualize_curvature(points, curvature, track_name.title())
        
        # Save the plot
        fig.savefig(f'curvature_analysis_{track_name}.png', dpi=150, bbox_inches='tight')
        print(f"\n📊 Saved visualization: curvature_analysis_{track_name}.png")
    
    # Show all plots
    plt.show()
    
    print(f"\n\n{'='*80}")
    print("🎯 SUMMARY: How Your Racing Line Optimizer Works")
    print(f"{'='*80}")
    print("1. Takes your drawn track points")
    print("2. Calculates curvature using derivatives (math!)")
    print("3. Applies smoothing to reduce noise")
    print("4. Uses threshold (0.005) to detect corners vs straights")
    print("5. For corners: applies racing line strategy")
    print("6. For straights: maintains speed and prepares for next corner")
    print("\n🏁 This is EXACTLY what happens in your F1 racing line optimizer!")

if __name__ == "__main__":
    # Check if required libraries are available
    try:
        import matplotlib.pyplot as plt
        import numpy as np
        from scipy.ndimage import gaussian_filter1d
        main()
    except ImportError as e:
        print(f"❌ Missing required library: {e}")
        print("💡 Install with: pip install matplotlib numpy scipy")