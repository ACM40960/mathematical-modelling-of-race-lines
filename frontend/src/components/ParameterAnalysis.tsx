"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Car, Track, SimulationResult } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ParameterAnalysisProps {
  track: Track | null;
  baseCar: Car;
  onParameterChange?: (modifiedCar: Car) => void;
  simulationResults?: SimulationResult[];
}

interface ParameterRange {
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
}

interface AnalysisData {
  parameter: string;
  values: number[];
  lapTimes: number[];
  avgSpeeds: number[];
}

interface SensitivityData {
  parameter: string;
  coefficient: number;  // dlap_time/dparameter at current value
  percentageImpact: number;  // % change in lap time for 10% parameter change
  ranking: number;  // 1 = most sensitive parameter
  improvement: number;  // max possible improvement (seconds)
  direction: 'increase' | 'decrease';  // which direction improves lap time
}

interface GraphType {
  id: string;
  label: string;
  enabled: boolean;
}

const PARAMETER_RANGES: Record<string, ParameterRange> = {
  mass: {
    min: 650,
    max: 950,
    step: 10,
    unit: 'kg',
    label: 'Vehicle Mass'
  },
  max_acceleration: {
    min: 6,
    max: 18,
    step: 0.5,
    unit: 'm/s²',
    label: 'Max Acceleration'
  },
  max_steering_angle: {
    min: 15,
    max: 50,
    step: 1,
    unit: '°',
    label: 'Max Steering Angle'
  },
  drag_coefficient: {
    min: 0.3,
    max: 3.0,
    step: 0.05,
    unit: '',
    label: 'Drag Coefficient'
  },
  lift_coefficient: {
    min: 0.5,
    max: 8.0,
    step: 0.1,
    unit: '',
    label: 'Downforce Coefficient'
  }
};

export const ParameterAnalysis: React.FC<ParameterAnalysisProps> = ({
  track,
  baseCar,
  onParameterChange,
  simulationResults
}) => {
  // Parameter states
  const [parameters, setParameters] = useState({
    mass: baseCar.mass,
    max_acceleration: baseCar.max_acceleration,
    max_steering_angle: baseCar.max_steering_angle,
    drag_coefficient: (baseCar as any).drag_coefficient || 1.0,
    lift_coefficient: (baseCar as any).lift_coefficient || 3.0
  });

  // Analysis states
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [sensitivityData, setSensitivityData] = useState<SensitivityData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentLapTime, setCurrentLapTime] = useState<number | null>(null);
  const [baselineLapTime, setBaselineLapTime] = useState<number | null>(null);

  // Graph display states - Multiple analysis options
  const [graphTypes, setGraphTypes] = useState<GraphType[]>([
    { id: 'lap_time', label: 'Lap Time vs Parameter', enabled: true },
    { id: 'sensitivity', label: 'Sensitivity Coefficients', enabled: false },
    { id: 'percentage_impact', label: 'Percentage Impact', enabled: false }
  ]);

  // 🎯 NEW: Parameter visibility state
  const [visibleParameters, setVisibleParameters] = useState<Record<string, boolean>>({
    mass: true,
    max_acceleration: true,
    max_steering_angle: false,
    drag_coefficient: false,
    lift_coefficient: false
  });

  // Update current lap time from simulation results
  useEffect(() => {
    if (simulationResults && simulationResults.length > 0) {
      const lapTime = simulationResults[0].lap_time;
      setCurrentLapTime(lapTime);
      
      // Set baseline on first simulation
      if (baselineLapTime === null) {
        setBaselineLapTime(lapTime);
      }
    }
  }, [simulationResults, baselineLapTime]);

  // 🚀 NEW: Auto-run analysis when track and cars are available
  useEffect(() => {
    if (track && track.track_points.length > 0 && baseCar && !isAnalyzing) {
      console.log('🚀 Auto-running parameter analysis - track and car detected');
      runSensitivityAnalysis();
    }
  }, [track, baseCar]);

  // ⚡ NEW: Auto-update analysis when parameters change (real-time updates)
  useEffect(() => {
    if (track && baseCar && analysisData.length > 0 && !isAnalyzing) {
      console.log('⚡ Real-time parameter update - re-running analysis');
      // Add a small delay to prevent too many rapid updates
      const timeoutId = setTimeout(() => {
        runSensitivityAnalysis();
      }, 1000); // 1 second delay after parameter change
      
      return () => clearTimeout(timeoutId);
    }
  }, [parameters, track, baseCar, analysisData.length]);

  // Handle parameter changes
  const handleParameterChange = useCallback((paramName: string, value: number) => {
    const newParameters = { ...parameters, [paramName]: value };
    setParameters(newParameters);

    // Create modified car object
    const modifiedCar: Car = {
      ...baseCar,
      mass: newParameters.mass,
      max_acceleration: newParameters.max_acceleration,
      max_steering_angle: newParameters.max_steering_angle,
      drag_coefficient: newParameters.drag_coefficient,
      lift_coefficient: newParameters.lift_coefficient
    };

    // Notify parent component
    if (onParameterChange) {
      onParameterChange(modifiedCar);
    }
  }, [parameters, baseCar, onParameterChange]);

  // Run parameter sensitivity analysis
  const runSensitivityAnalysis = useCallback(async () => {
    if (!track) {
      console.log('No track available for analysis');
      return;
    }

    setIsAnalyzing(true);
    const newAnalysisData: AnalysisData[] = [];

    try {
      for (const [paramName, range] of Object.entries(PARAMETER_RANGES)) {
        console.log(`🔬 Running simulation analysis for: ${paramName}`);
        
        const values: number[] = [];
        const lapTimes: number[] = [];
        const avgSpeeds: number[] = [];

        // Test different values for this parameter using real simulations
        // Use more points and non-linear distribution to capture physics curves
        const numSteps = 10; // More points for better curve resolution
        
        for (let i = 0; i <= numSteps; i++) {
          let value;
          
          // Use different sampling strategies for different parameters to capture physics
          if (paramName === 'drag_coefficient' || paramName === 'lift_coefficient') {
            // Quadratic sampling for aerodynamic parameters (drag/downforce effects are quadratic)
            const normalizedPos = i / numSteps;
            const quadraticPos = normalizedPos * normalizedPos;
            value = range.min + (range.max - range.min) * quadraticPos;
          } else if (paramName === 'mass') {
            // Inverse sampling for mass (lighter cars should show more dramatic effects)
            const normalizedPos = i / numSteps;
            const inversePos = 1 - Math.pow(1 - normalizedPos, 2);
            value = range.min + (range.max - range.min) * inversePos;
          } else {
            // Linear sampling for other parameters
            value = range.min + (range.max - range.min) * (i / numSteps);
          }
          
          // Round to step precision
          value = Math.round(value / range.step) * range.step;
          values.push(value);

          // Create test car with modified parameter
          const testCar: Car = {
            ...baseCar,
            [paramName]: value,
            mass: paramName === 'mass' ? value : parameters.mass,
            max_acceleration: paramName === 'max_acceleration' ? value : parameters.max_acceleration,
            max_steering_angle: paramName === 'max_steering_angle' ? value : parameters.max_steering_angle,
            drag_coefficient: paramName === 'drag_coefficient' ? value : parameters.drag_coefficient,
            lift_coefficient: paramName === 'lift_coefficient' ? value : parameters.lift_coefficient
          };

          console.log(`🔬 Testing ${paramName}=${value}, car:`, {
            mass: testCar.mass,
            max_acceleration: testCar.max_acceleration,
            drag_coefficient: testCar.drag_coefficient,
            lift_coefficient: testCar.lift_coefficient
          });

          // Run actual simulation for this parameter value
          try {
            const response = await fetch('http://localhost:8000/simulate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                track_points: track.track_points,
                width: track.width,
                friction: track.friction,
                cars: [testCar],
                model: 'physics_based'
              }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.optimal_lines && data.optimal_lines.length > 0) {
                const result = data.optimal_lines[0];
                const lapTime = result.lap_time;
                lapTimes.push(lapTime);
                
                // Calculate average speed from simulation data
                const avgSpeed = result.speeds.reduce((sum: number, speed: number) => sum + speed, 0) / result.speeds.length;
                avgSpeeds.push(avgSpeed);
                
                console.log(`📊 ${paramName}=${value} → Lap Time: ${lapTime.toFixed(3)}s, Avg Speed: ${avgSpeed.toFixed(1)} m/s`);
              } else {
                console.warn(`⚠️ No simulation results for ${paramName}=${value}`);
                lapTimes.push(999);
                avgSpeeds.push(0);
              }
            } else {
              console.error(`❌ Simulation failed for ${paramName}=${value}: ${response.status}`);
              lapTimes.push(999);
              avgSpeeds.push(0);
            }
          } catch (error) {
            console.error(`Simulation failed for ${paramName}=${value}:`, error);
            lapTimes.push(999);
            avgSpeeds.push(0);
          }

          // Prevent overwhelming the backend
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        newAnalysisData.push({
          parameter: paramName,
          values,
          lapTimes,
          avgSpeeds
        });
      }

      setAnalysisData(newAnalysisData);
      
      // 🔬 Calculate sensitivity analysis from the simulation data
      const sensitivityResults = calculateSensitivityAnalysis(newAnalysisData, parameters);
      setSensitivityData(sensitivityResults);
      
    } catch (error) {
      console.error('Parameter analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [track, baseCar, parameters]);

  // 🔬 NEW: Calculate sensitivity coefficients and rankings
  const calculateSensitivityAnalysis = useCallback((analysisResults: AnalysisData[], currentParams: typeof parameters): SensitivityData[] => {
    const sensitivityResults: SensitivityData[] = [];
    
    analysisResults.forEach(data => {
      const { parameter, values, lapTimes } = data;
      const range = PARAMETER_RANGES[parameter];
      const currentValue = currentParams[parameter as keyof typeof currentParams];
      
      // Find current parameter value index in the analysis data
      const currentIndex = values.findIndex(v => Math.abs(v - currentValue) < range.step);
      
      if (currentIndex >= 0 && currentIndex < values.length - 1) {
        // Calculate numerical derivative (sensitivity coefficient)
        const nextIndex = Math.min(currentIndex + 1, values.length - 1);
        const prevIndex = Math.max(currentIndex - 1, 0);
        
        const deltaParam = values[nextIndex] - values[prevIndex];
        const deltaLapTime = lapTimes[nextIndex] - lapTimes[prevIndex];
        const coefficient = deltaParam !== 0 ? deltaLapTime / deltaParam : 0;
        
        // Calculate percentage impact (10% parameter change effect)
        const tenPercentChange = currentValue * 0.1;
        const percentageImpact = Math.abs(coefficient * tenPercentChange);
        
        // Find best possible improvement
        const validLapTimes = lapTimes.filter(t => t < 900);
        const bestTime = Math.min(...validLapTimes);
        const currentTime = lapTimes[currentIndex];
        const improvement = Math.max(0, currentTime - bestTime);
        
        // Determine optimization direction
        const direction = coefficient < 0 ? 'increase' : 'decrease';
        
        sensitivityResults.push({
          parameter,
          coefficient: Math.abs(coefficient),
          percentageImpact,
          ranking: 0, // Will be set after sorting
          improvement,
          direction
        });
      }
    });
    
    // Sort by percentage impact and assign rankings
    sensitivityResults.sort((a, b) => b.percentageImpact - a.percentageImpact);
    sensitivityResults.forEach((result, index) => {
      result.ranking = index + 1;
    });
    
    console.log('🔬 Sensitivity Analysis Results:', sensitivityResults);
    return sensitivityResults;
  }, []);

  // Toggle graph type
  const toggleGraphType = (id: string) => {
    setGraphTypes(prev => prev.map(graph => 
      graph.id === id ? { ...graph, enabled: !graph.enabled } : graph
    ));
  };

  // 🎯 NEW: Toggle parameter visibility
  const toggleParameterVisibility = (paramName: string) => {
    setVisibleParameters(prev => ({
      ...prev,
      [paramName]: !prev[paramName]
    }));
  };

  // 🔄 UPDATED: Get chart data for enabled graph types and visible parameters
  const getChartData = () => {
    if (analysisData.length === 0) return { datasets: [] };

    const datasets: any[] = [];
    const enabledGraphs = graphTypes.filter(g => g.enabled);

    enabledGraphs.forEach((graphType, index) => {
      if (graphType.id === 'lap_time') {
        // Show lap time analysis for ONLY VISIBLE parameters
        analysisData
          .filter(data => visibleParameters[data.parameter])
          .forEach((data, paramIndex) => {
            datasets.push({
              label: `${PARAMETER_RANGES[data.parameter].label} - Lap Time`,
              data: data.values.map((value, i) => ({ x: value, y: data.lapTimes[i] })),
              borderColor: `hsl(${paramIndex * 72}, 70%, 50%)`,
              backgroundColor: `hsla(${paramIndex * 72}, 70%, 50%, 0.1)`,
              borderWidth: 2,
              tension: 0.1,
              showLine: true,
              pointRadius: 4
            });
          });
      } 
      else if (graphType.id === 'sensitivity' && sensitivityData.length > 0) {
        // Show sensitivity coefficients as bar chart
        const visibleSensitivity = sensitivityData.filter(data => visibleParameters[data.parameter]);
        datasets.push({
          label: 'Sensitivity Coefficient (∂LapTime/∂Parameter)',
          data: visibleSensitivity.map((data, i) => ({ x: PARAMETER_RANGES[data.parameter].label, y: data.coefficient })),
          borderColor: 'rgba(239, 68, 68, 0.8)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderWidth: 2,
          type: 'bar'
        });
      }
      else if (graphType.id === 'percentage_impact' && sensitivityData.length > 0) {
        // Show percentage impact as bar chart
        const visibleSensitivity = sensitivityData.filter(data => visibleParameters[data.parameter]);
        datasets.push({
          label: 'Percentage Impact (10% parameter change)',
          data: visibleSensitivity.map((data, i) => ({ x: PARAMETER_RANGES[data.parameter].label, y: data.percentageImpact * 100 })),
          borderColor: 'rgba(168, 85, 247, 0.8)',
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderWidth: 2,
          type: 'bar'
        });
      }
    });

    return { datasets };
  };

  // Chart options - support both line and bar charts
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      title: {
        display: true,
        text: 'Parameter Sensitivity Analysis'
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Parameter Value'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Analysis Value'
        }
      }
    }
  };

  // Calculate performance delta
  const getPerformanceDelta = () => {
    if (!currentLapTime || !baselineLapTime) return null;
    const delta = currentLapTime - baselineLapTime;
    return {
      seconds: delta,
      percentage: (delta / baselineLapTime) * 100
    };
  };

  const performanceDelta = getPerformanceDelta();

  return (
    <div className="flex h-full">
      {/* Main Graph Area */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              📊 Parameter Analysis Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Real-time simulation data showing how car parameters affect performance
            </p>
          </div>

          {/* Current Performance Display */}
          {currentLapTime && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Lap Time</h3>
                  <p className="text-2xl font-bold text-blue-600">{currentLapTime.toFixed(3)}s</p>
                </div>
                {performanceDelta && (
                  <div className="text-right">
                    <h4 className="text-sm font-medium text-gray-700">vs Baseline</h4>
                    <p className={`text-xl font-bold ${performanceDelta.seconds < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performanceDelta.seconds > 0 ? '+' : ''}{performanceDelta.seconds.toFixed(3)}s
                    </p>
                    <p className={`text-sm ${performanceDelta.seconds < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({performanceDelta.percentage > 0 ? '+' : ''}{performanceDelta.percentage.toFixed(2)}%)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Chart Area */}
          <div className="flex-1">
            {analysisData.length > 0 ? (
              <div className="h-96 bg-gray-50 rounded-lg p-4">
                {(() => {
                  const enabledTypes = graphTypes.filter(g => g.enabled);
                  const hasBarChart = enabledTypes.some(t => t.id === 'sensitivity' || t.id === 'percentage_impact');
                  
                  if (hasBarChart) {
                    return <Bar data={getChartData()} options={chartOptions} />;
                  } else {
                    return <Line data={getChartData()} options={chartOptions} />;
                  }
                })()}
              </div>
            ) : (
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {isAnalyzing ? (
                    <div>
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Analyzing Parameters</h3>
                      <p className="text-gray-600">Running real-time simulations...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">📈</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
                      <p className="text-gray-600 mb-4">Draw a track and add cars to see auto-generated analysis</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Compact */}
      <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-3 overflow-y-auto">
        
        {/* Analysis Control - F1 Style */}
        <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
          {/* Header */}
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-blue-700">ANALYSIS CONTROL</h2>
              <div className="text-gray-600 text-xs">
                {isAnalyzing ? "RUNNING" : "AUTO"}
              </div>
            </div>
          </div>

                      {/* 🔄 UPDATED: Analysis Status - Auto Mode (No Button) */}
            <div className="px-3 py-1.5 border-b border-gray-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-700 text-xs">STATUS</span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isAnalyzing ? 'bg-yellow-500' : 
                  analysisData.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="text-gray-600 text-xs">
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                    Auto-analyzing parameters...
                  </div>
                ) : analysisData.length > 0 ? (
                  `Analysis complete - Live updates enabled`
                ) : (
                  'Ready - Waiting for track and car'
                )}
              </div>
            </div>

          {/* Current Performance - Compact */}
          {currentLapTime && (
            <div className="px-3 py-1.5 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 text-xs">LAP TIME</span>
                <span className="text-blue-600 text-xs font-mono">
                  {currentLapTime.toFixed(3)}s
                </span>
              </div>
              {performanceDelta && (
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-gray-700 text-xs">DELTA</span>
                  <span className={`text-xs font-mono ${performanceDelta.seconds < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceDelta.seconds > 0 ? '+' : ''}{performanceDelta.seconds.toFixed(3)}s
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Parameters Section - Compact */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-700 text-xs">PARAMETERS [{Object.keys(PARAMETER_RANGES).length}]</span>
            </div>
            
            <div className="space-y-1">
              {Object.entries(PARAMETER_RANGES).map(([paramName, range]) => {
                const currentValue = parameters[paramName as keyof typeof parameters];
                return (
                  <div key={paramName} className="bg-white rounded border border-gray-300 p-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700 text-xs font-medium">
                        {range.label.toUpperCase()}
                      </span>
                      <span className="text-blue-600 text-xs font-mono">
                        {currentValue.toFixed(paramName.includes('coefficient') ? 2 : 1)}{range.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      step={range.step}
                      value={currentValue}
                      onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
                      className="w-full h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Display Options - F1 Style Compact */}
        <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
          {/* Header */}
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
            <h2 className="text-sm font-bold text-blue-700">DISPLAY OPTIONS</h2>
          </div>

          {/* Graph Types - Compact */}
          <div className="px-3 py-1.5 border-b border-gray-300">
            <div className="text-gray-700 text-xs font-medium mb-1">GRAPH TYPES</div>
            <div className="space-y-1">
              {graphTypes.map((graphType) => (
                <label key={graphType.id} className="flex items-center space-x-1.5 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={graphType.enabled}
                    onChange={() => toggleGraphType(graphType.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-2.5 h-2.5"
                  />
                  <span className="text-gray-700 text-xs">{graphType.label.toUpperCase()}</span>
                </label>
              ))}
            </div>
            <div className="text-gray-600 text-xs mt-1 px-1">
              Multiple analysis types from simulation data
            </div>
          </div>

          {/* 🎯 Parameter Visibility Toggles */}
          <div className="px-3 py-1.5">
            <div className="text-gray-700 text-xs font-medium mb-1">VISIBLE PARAMETERS</div>
            <div className="space-y-1">
              {Object.entries(PARAMETER_RANGES).map(([paramName, range]) => (
                <label key={paramName} className="flex items-center space-x-1.5 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={visibleParameters[paramName]}
                    onChange={() => toggleParameterVisibility(paramName)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-2.5 h-2.5"
                  />
                  <span className="text-gray-700 text-xs">{range.label.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Results - F1 Style Compact */}
        {analysisData.length > 0 && (
          <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
            {/* Header */}
            <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-blue-700">RESULTS</h2>
                <span className="text-green-600 text-xs">COMPLETE</span>
              </div>
            </div>

            {/* Results Data - Compact */}
            <div className="px-3 py-1.5">
              <div className="space-y-1">
                {analysisData.map((data, index) => {
                  const bestTime = Math.min(...data.lapTimes.filter(t => t < 900));
                  const worstTime = Math.max(...data.lapTimes.filter(t => t < 900));
                  const improvement = worstTime - bestTime;
                  
                  return (
                    <div key={data.parameter} className="bg-white rounded border border-gray-300 p-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 text-xs font-medium">
                          {PARAMETER_RANGES[data.parameter].label.toUpperCase()}
                        </span>
                        <span className="text-green-600 text-xs font-mono">
                          -{improvement.toFixed(3)}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 🔬 NEW: Sensitivity Analysis Results */}
        {sensitivityData.length > 0 && (
          <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
            {/* Header */}
            <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-purple-700">SENSITIVITY ANALYSIS</h2>
                <span className="text-green-600 text-xs">COMPUTED</span>
              </div>
            </div>

            {/* Sensitivity Rankings */}
            <div className="px-3 py-1.5 border-b border-gray-300">
              <div className="text-gray-700 text-xs font-medium mb-1">PARAMETER RANKINGS</div>
              <div className="space-y-0.5">
                {sensitivityData
                  .sort((a, b) => a.ranking - b.ranking)
                  .map((data) => (
                    <div key={data.parameter} className="flex items-center justify-between bg-white rounded border border-gray-300 px-2 py-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-bold px-1 py-0.5 rounded ${ 
                          data.ranking === 1 ? 'bg-yellow-100 text-yellow-800' :
                          data.ranking === 2 ? 'bg-gray-100 text-gray-800' :
                          data.ranking === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          #{data.ranking}
                        </span>
                        <span className="text-gray-700 text-xs font-medium">
                          {PARAMETER_RANGES[data.parameter].label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-600 text-xs font-mono">
                          {(data.percentageImpact * 100).toFixed(2)}%
                        </div>
                        <div className="text-gray-500 text-xs">
                          {data.direction === 'increase' ? '↑' : '↓'} {data.coefficient.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Sensitivity Summary */}
            <div className="px-3 py-1.5">
              <div className="text-gray-700 text-xs font-medium mb-1">IMPACT ANALYSIS</div>
              <div className="space-y-0.5 text-gray-600 text-xs">
                {sensitivityData.length > 0 && (
                  <>
                    <div>• Most sensitive: <strong>{PARAMETER_RANGES[sensitivityData[0]?.parameter]?.label}</strong></div>
                    <div>• 10% parameter change affects lap time by up to <strong>{(Math.max(...sensitivityData.map(d => d.percentageImpact)) * 100).toFixed(2)}%</strong></div>
                    <div>• Best potential improvement: <strong>{Math.max(...sensitivityData.map(d => d.improvement)).toFixed(3)}s</strong></div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Physics Equations Info - F1 Style Compact */}
        <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
          {/* Header */}
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-blue-700">PHYSICS EQUATIONS</h2>
              <span className="text-green-600 text-xs">ACTIVE</span>
            </div>
          </div>

          {/* Physics Details - Compact */}
          <div className="px-3 py-1.5">
            <div className="space-y-0.5 text-gray-600 text-xs">
              <div>• <strong>Drag</strong>: F = ½ρv²CdA (quadratic)</div>
              <div>• <strong>Downforce</strong>: F = ½ρv²ClA (grip)</div>
              <div>• <strong>Mass</strong>: F = ma (acceleration)</div>
              <div>• <strong>Cornering</strong>: Lateral g-force limits</div>
              <div>• <strong>Non-linear</strong> physics interactions</div>
            </div>
          </div>
        </div>

        {/* Analysis Method Info - F1 Style Compact */}
        <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
          {/* Header */}
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-blue-700">METHOD</h2>
              <span className="text-green-600 text-xs">SIMULATION</span>
            </div>
          </div>

          {/* Method Details - Compact */}
          <div className="px-3 py-1.5">
            <div className="space-y-0.5 text-gray-600 text-xs">
              <div>• Real physics simulations</div>
              <div>• Non-linear parameter sampling</div>
              <div>• Actual lap time measurements</div>
              <div>• {analysisData.length > 0 ? `${analysisData[0]?.values?.length || 0} data points` : 'Multi-point analysis'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterAnalysis;