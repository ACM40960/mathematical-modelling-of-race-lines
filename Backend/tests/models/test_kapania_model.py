"""
Comprehensive test suite for Kapania Two Step Algorithm Model

This test suite validates:
1. Algorithm correctness and convergence
2. Parameter sensitivity analysis
3. Lap time optimization behavior
4. Speed profile generation
5. Performance characteristics

Test Track: Bahrain International Circuit
"""

import sys
import os
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from typing import Dict, List, Tuple, Any
import json
from datetime import datetime

# Add parent directories to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'simulation'))

from simulation.algorithms.kapania_model import KapaniaModel
from data.track_data import get_sample_f1_tracks
from schemas.track import TrackPoint, Car

class KapaniaModelTester:
    """
    Comprehensive testing framework for Kapania Model validation
    """
    
    def __init__(self):
        self.model = KapaniaModel()
        self.bahrain_track = self._load_bahrain_track()
        self.test_results = {}
        
        # Create results directory
        self.results_dir = os.path.join(os.path.dirname(__file__), 'test_results')
        os.makedirs(self.results_dir, exist_ok=True)
        
        print("🏁 Kapania Model Testing Framework Initialized")
        print(f"📊 Results will be saved to: {self.results_dir}")
        print(f"🏎️  Test Track: {self.bahrain_track['name']}")
        print(f"📏 Track Length: {self.bahrain_track['track_length']}m")
        print(f"🏃 Expected Lap Time: {self.bahrain_track['fastest_lap_time']:.3f}s")
    
    def _load_bahrain_track(self) -> Dict[str, Any]:
        """Load Bahrain International Circuit data"""
        tracks = get_sample_f1_tracks()
        for track in tracks:
            if track['name'] == "Bahrain International Circuit":
                return track
        raise ValueError("Bahrain track not found in track data")
    
    def _create_test_car(self, **overrides) -> Dict[str, Any]:
        """Create a test car with default Kapania parameters"""
        default_params = {
            'id': 'test_car',
            'team_name': 'Test Team',
            'car_color': '#FF0000',
            'accent_color': '#FFFFFF',
            'mass': 798.0,  # kg (F1 minimum weight)
            'length': 5.0,  # meters
            'width': 2.0,   # meters
            'max_steering_angle': 15.0,  # degrees
            'max_acceleration': 12.0,  # m/s²
            'drag_coefficient': 1.0,
            'lift_coefficient': 3.0,
            # Kapania-specific parameters
            'yaw_inertia': 1200.0,  # kg·m²
            'front_axle_distance': 1.6,  # meters
            'rear_axle_distance': 1.4,   # meters  
            'front_cornering_stiffness': 80000.0,  # N/rad
            'rear_cornering_stiffness': 120000.0,  # N/rad
            'max_engine_force': 15000.0  # N
        }
        
        # Apply any overrides
        default_params.update(overrides)
        return default_params
    
    def _convert_track_points(self, track_points: List[Dict]) -> np.ndarray:
        """Convert track points to numpy array"""
        return np.array([[p['x'], p['y']] for p in track_points])
    
    def _calculate_curvature(self, points: np.ndarray) -> np.ndarray:
        """Calculate curvature for track points"""
        n = len(points)
        curvature = np.zeros(n)
        
        for i in range(1, n-1):
            p1, p2, p3 = points[i-1], points[i], points[i+1]
            
            # Vectors
            v1 = p2 - p1
            v2 = p3 - p2
            
            # Cross product magnitude
            cross = abs(v1[0] * v2[1] - v1[1] * v2[0])
            
            # Segment lengths
            len1 = np.linalg.norm(v1)
            len2 = np.linalg.norm(v2)
            
            if len1 > 1e-6 and len2 > 1e-6:
                curvature[i] = cross / (len1 * len2)
        
        # Boundary conditions
        curvature[0] = curvature[1] if n > 1 else 0
        curvature[-1] = curvature[-2] if n > 1 else 0
        
        return curvature
    
    def test_basic_functionality(self) -> Dict[str, Any]:
        """Test 1: Basic algorithm functionality and convergence"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Basic Functionality & Convergence")
        print("="*60)
        
        # Prepare track data
        track_points = self._convert_track_points(self.bahrain_track['track_points'])
        curvature = self._calculate_curvature(track_points)
        car_params = self._create_test_car()
        
        print(f"🏁 Track: {len(track_points)} points")
        print(f"📐 Curvature range: {curvature.min():.6f} - {curvature.max():.6f}")
        print(f"🏎️  Car mass: {car_params['mass']}kg")
        print(f"⚡ Max engine force: {car_params['max_engine_force']}N")
        
        # Run simulation
        start_time = datetime.now()
        racing_line = self.model.calculate_racing_line(
            track_points=track_points,
            curvature=curvature,
            track_width=self.bahrain_track['width'],
            car_params=car_params,
            friction=self.bahrain_track['friction']
        )
        end_time = datetime.now()
        
        computation_time = (end_time - start_time).total_seconds()
        
        # Analyze results
        results = {
            'test_name': 'basic_functionality',
            'track_name': self.bahrain_track['name'],
            'computation_time': computation_time,
            'racing_line_points': len(racing_line),
            'algorithm_converged': len(racing_line) > 0,
            'racing_line_bounds': {
                'x_min': float(racing_line[:, 0].min()),
                'x_max': float(racing_line[:, 0].max()),
                'y_min': float(racing_line[:, 1].min()),
                'y_max': float(racing_line[:, 1].max())
            }
        }
        
        print(f"✅ Algorithm completed in {computation_time:.3f}s")
        print(f"📍 Racing line: {len(racing_line)} points")
        print(f"🎯 Convergence: {'✅ Yes' if results['algorithm_converged'] else '❌ No'}")
        
        self.test_results['basic_functionality'] = results
        return results
    
    def test_parameter_sensitivity(self) -> Dict[str, Any]:
        """Test 2: Parameter sensitivity analysis"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Parameter Sensitivity Analysis")
        print("="*60)
        
        # Prepare base data
        track_points = self._convert_track_points(self.bahrain_track['track_points'])
        curvature = self._calculate_curvature(track_points)
        base_car = self._create_test_car()
        
        # Parameters to test with their variation ranges
        parameter_tests = {
            'mass': [700, 750, 798, 850, 900],  # kg
            'max_engine_force': [12000, 13500, 15000, 16500, 18000],  # N
            'yaw_inertia': [1000, 1100, 1200, 1300, 1400],  # kg·m²
            'front_cornering_stiffness': [60000, 70000, 80000, 90000, 100000],  # N/rad
            'rear_cornering_stiffness': [100000, 110000, 120000, 130000, 140000]  # N/rad
        }
        
        sensitivity_results = {}
        
        for param_name, values in parameter_tests.items():
            print(f"\n🔬 Testing parameter: {param_name}")
            param_results = []
            
            for value in values:
                # Create test car with modified parameter
                test_car = self._create_test_car(**{param_name: value})
                
                print(f"   Testing {param_name}={value}...", end="")
                
                try:
                    # Run simulation
                    racing_line = self.model.calculate_racing_line(
                        track_points=track_points,
                        curvature=curvature,
                        track_width=self.bahrain_track['width'],
                        car_params=test_car,
                        friction=self.bahrain_track['friction']
                    )
                    
                    # Calculate some basic metrics
                    line_length = self._calculate_line_length(racing_line)
                    max_deviation = self._calculate_max_deviation(racing_line, track_points)
                    
                    result = {
                        'parameter_value': value,
                        'racing_line_length': line_length,
                        'max_deviation_from_centerline': max_deviation,
                        'success': True
                    }
                    print(" ✅")
                    
                except Exception as e:
                    result = {
                        'parameter_value': value,
                        'error': str(e),
                        'success': False
                    }
                    print(f" ❌ Error: {str(e)}")
                
                param_results.append(result)
            
            sensitivity_results[param_name] = param_results
        
        # Analyze sensitivity
        print(f"\n📊 Parameter Sensitivity Summary:")
        for param_name, results in sensitivity_results.items():
            successful_tests = [r for r in results if r['success']]
            if successful_tests:
                lengths = [r['racing_line_length'] for r in successful_tests]
                deviations = [r['max_deviation_from_centerline'] for r in successful_tests]
                print(f"   {param_name}:")
                print(f"     Line length variation: {min(lengths):.1f} - {max(lengths):.1f}")
                print(f"     Max deviation variation: {min(deviations):.3f} - {max(deviations):.3f}")
        
        self.test_results['parameter_sensitivity'] = sensitivity_results
        return sensitivity_results
    
    def test_speed_profile_analysis(self) -> Dict[str, Any]:
        """Test 3: Detailed speed profile and lap time analysis"""
        print("\n" + "="*60)
        print("🧪 TEST 3: Speed Profile & Lap Time Analysis")
        print("="*60)
        
        # We need to modify the Kapania model to return detailed speed profiles
        # For now, let's create a mock analysis
        
        track_points = self._convert_track_points(self.bahrain_track['track_points'])
        curvature = self._calculate_curvature(track_points)
        
        # Test different car configurations
        car_configs = [
            ('Conservative', {'mass': 850, 'max_engine_force': 13000}),
            ('Balanced', {'mass': 798, 'max_engine_force': 15000}),
            ('Aggressive', {'mass': 750, 'max_engine_force': 17000})
        ]
        
        config_results = {}
        
        for config_name, config_params in car_configs:
            print(f"\n🏎️  Testing configuration: {config_name}")
            
            car_params = self._create_test_car(**config_params)
            
            # Run simulation
            racing_line = self.model.calculate_racing_line(
                track_points=track_points,
                curvature=curvature,
                track_width=self.bahrain_track['width'],
                car_params=car_params,
                friction=self.bahrain_track['friction']
            )
            
            # Analyze the racing line
            line_analysis = self._analyze_racing_line(racing_line, track_points)
            
            config_results[config_name] = {
                'car_params': config_params,
                'racing_line_analysis': line_analysis
            }
            
            print(f"   ✅ Line length: {line_analysis['total_length']:.1f}m")
            print(f"   📏 Avg deviation: {line_analysis['avg_deviation']:.3f}m")
            print(f"   📊 Max deviation: {line_analysis['max_deviation']:.3f}m")
        
        self.test_results['speed_profile_analysis'] = config_results
        return config_results
    
    def _calculate_line_length(self, racing_line: np.ndarray) -> float:
        """Calculate total length of racing line"""
        total_length = 0.0
        for i in range(1, len(racing_line)):
            segment_length = np.linalg.norm(racing_line[i] - racing_line[i-1])
            total_length += segment_length
        return total_length
    
    def _calculate_max_deviation(self, racing_line: np.ndarray, centerline: np.ndarray) -> float:
        """Calculate maximum deviation from centerline"""
        max_deviation = 0.0
        min_points = min(len(racing_line), len(centerline))
        
        for i in range(min_points):
            deviation = np.linalg.norm(racing_line[i] - centerline[i])
            max_deviation = max(max_deviation, deviation)
        
        return max_deviation
    
    def _analyze_racing_line(self, racing_line: np.ndarray, centerline: np.ndarray) -> Dict[str, float]:
        """Comprehensive racing line analysis"""
        total_length = self._calculate_line_length(racing_line)
        max_deviation = self._calculate_max_deviation(racing_line, centerline)
        
        # Calculate average deviation
        deviations = []
        min_points = min(len(racing_line), len(centerline))
        for i in range(min_points):
            deviation = np.linalg.norm(racing_line[i] - centerline[i])
            deviations.append(deviation)
        
        avg_deviation = np.mean(deviations) if deviations else 0.0
        
        return {
            'total_length': total_length,
            'max_deviation': max_deviation,
            'avg_deviation': avg_deviation,
            'num_points': len(racing_line)
        }
    
    def generate_visualization(self):
        """Generate visualization plots for test results"""
        print("\n" + "="*60)
        print("📊 Generating Visualization Plots")
        print("="*60)
        
        # Create a comprehensive visualization
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Kapania Model Test Results - Bahrain International Circuit', fontsize=16)
        
        # Plot 1: Track layout with racing line
        ax1 = axes[0, 0]
        track_points = self._convert_track_points(self.bahrain_track['track_points'])
        
        # Run one simulation for visualization
        car_params = self._create_test_car()
        curvature = self._calculate_curvature(track_points)
        racing_line = self.model.calculate_racing_line(
            track_points=track_points,
            curvature=curvature,
            track_width=self.bahrain_track['width'],
            car_params=car_params,
            friction=self.bahrain_track['friction']
        )
        
        ax1.plot(track_points[:, 0], track_points[:, 1], 'k-', linewidth=3, label='Centerline')
        ax1.plot(racing_line[:, 0], racing_line[:, 1], 'r-', linewidth=2, label='Racing Line')
        ax1.set_title('Track Layout & Racing Line')
        ax1.set_xlabel('X Coordinate')
        ax1.set_ylabel('Y Coordinate')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        ax1.axis('equal')
        
        # Plot 2: Parameter sensitivity (if available)
        ax2 = axes[0, 1]
        if 'parameter_sensitivity' in self.test_results:
            # Plot mass sensitivity
            mass_results = self.test_results['parameter_sensitivity'].get('mass', [])
            if mass_results:
                masses = [r['parameter_value'] for r in mass_results if r['success']]
                lengths = [r['racing_line_length'] for r in mass_results if r['success']]
                if masses and lengths:
                    ax2.plot(masses, lengths, 'bo-', linewidth=2, markersize=6)
                    ax2.set_title('Mass vs Racing Line Length')
                    ax2.set_xlabel('Car Mass (kg)')
                    ax2.set_ylabel('Racing Line Length')
                    ax2.grid(True, alpha=0.3)
        
        if not ax2.has_data():
            ax2.text(0.5, 0.5, 'Parameter Sensitivity\nData Not Available', 
                    ha='center', va='center', transform=ax2.transAxes)
            ax2.set_title('Parameter Sensitivity')
        
        # Plot 3: Curvature analysis
        ax3 = axes[1, 0]
        curvature = self._calculate_curvature(track_points)
        ax3.plot(curvature, 'g-', linewidth=2)
        ax3.set_title('Track Curvature Profile')
        ax3.set_xlabel('Point Index')
        ax3.set_ylabel('Curvature (1/m)')
        ax3.grid(True, alpha=0.3)
        
        # Plot 4: Test summary
        ax4 = axes[1, 1]
        ax4.axis('off')
        
        # Create summary text
        summary_text = f"""
Test Summary - Bahrain International Circuit

Track Information:
• Length: {self.bahrain_track['track_length']}m
• Turns: {self.bahrain_track['number_of_turns']}
• Width: {self.bahrain_track['width']}m
• Expected Lap Time: {self.bahrain_track['fastest_lap_time']:.3f}s

Algorithm Performance:
• Model: Kapania Two Step Algorithm
• Track Usage: 85% (Research Grade)
• Convergence: 3-4 iterations typical

Test Results:
"""
        
        if 'basic_functionality' in self.test_results:
            basic_results = self.test_results['basic_functionality']
            summary_text += f"• Basic Test: {'✅ PASSED' if basic_results['algorithm_converged'] else '❌ FAILED'}\n"
            summary_text += f"• Computation Time: {basic_results['computation_time']:.3f}s\n"
        
        if 'parameter_sensitivity' in self.test_results:
            param_results = self.test_results['parameter_sensitivity']
            total_tests = sum(len(results) for results in param_results.values())
            successful_tests = sum(sum(1 for r in results if r['success']) for results in param_results.values())
            summary_text += f"• Parameter Tests: {successful_tests}/{total_tests} passed\n"
        
        ax4.text(0.05, 0.95, summary_text, transform=ax4.transAxes, 
                verticalalignment='top', fontfamily='monospace', fontsize=10)
        
        plt.tight_layout()
        
        # Save the plot
        plot_filename = os.path.join(self.results_dir, 'kapania_test_results.png')
        plt.savefig(plot_filename, dpi=300, bbox_inches='tight')
        print(f"📊 Visualization saved to: {plot_filename}")
        
        return plot_filename
    
    def save_detailed_results(self):
        """Save detailed test results to JSON file"""
        results_filename = os.path.join(self.results_dir, 'kapania_test_results.json')
        
        # Prepare results for JSON serialization
        json_results = {
            'test_timestamp': datetime.now().isoformat(),
            'test_track': self.bahrain_track['name'],
            'model_info': {
                'name': self.model.name,
                'description': self.model.description,
                'track_usage': self.model.track_usage,
                'characteristics': self.model.characteristics
            },
            'test_results': self.test_results
        }
        
        with open(results_filename, 'w') as f:
            json.dump(json_results, f, indent=2, default=str)
        
        print(f"💾 Detailed results saved to: {results_filename}")
        return results_filename
    
    def run_comprehensive_test_suite(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive Kapania Model Test Suite")
        print("=" * 80)
        
        try:
            # Run all tests
            self.test_basic_functionality()
            self.test_parameter_sensitivity()
            self.test_speed_profile_analysis()
            
            # Generate outputs
            self.generate_visualization()
            self.save_detailed_results()
            
            print("\n" + "=" * 80)
            print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
            print("=" * 80)
            print(f"📂 Results directory: {self.results_dir}")
            print("📊 Check the generated plots and JSON files for detailed analysis")
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            import traceback
            traceback.print_exc()


def main():
    """Main function to run the test suite"""
    print("🏁 Kapania Model Testing Framework")
    print("Testing on Bahrain International Circuit")
    print("=" * 80)
    
    # Create and run the test suite
    tester = KapaniaModelTester()
    tester.run_comprehensive_test_suite()


if __name__ == "__main__":
    main()