"use client";

import React, { useState, useEffect } from "react";
import { Car, SimulationResult } from "@/types";

interface ParameterOption {
  key: keyof Car;
  label: string;
  modelType: "all" | "kapania" | "physics";
}

const MODEL_OPTIONS = [
  { id: "two_step_algorithm", name: "Kapania Two Step Algorithm" },
  { id: "physics_based", name: "Physics-Based Model" },
  { id: "basic", name: "Basic Model" },
];

const PARAMETER_OPTIONS: ParameterOption[] = [
  // Physics model parameters
  { key: "mass", label: "Mass (kg)", modelType: "physics" },
  { key: "length", label: "Length (m)", modelType: "physics" },
  { key: "width", label: "Width (m)", modelType: "physics" },
  {
    key: "max_steering_angle",
    label: "Max Steering Angle (°)",
    modelType: "physics",
  },
  {
    key: "max_acceleration",
    label: "Max Acceleration (m/s²)",
    modelType: "physics",
  },
  { key: "drag_coefficient", label: "Drag Coefficient", modelType: "physics" },
  { key: "lift_coefficient", label: "Lift Coefficient", modelType: "physics" },
  {
    key: "effective_frontal_area",
    label: "Frontal Area (m²)",
    modelType: "physics",
  },

  // Kapania model parameters
  { key: "mass", label: "Mass (kg)", modelType: "kapania" },
  { key: "length", label: "Length (m)", modelType: "kapania" },
  { key: "width", label: "Width (m)", modelType: "kapania" },
  {
    key: "max_steering_angle",
    label: "Max Steering Angle (°)",
    modelType: "kapania",
  },
  {
    key: "max_acceleration",
    label: "Max Acceleration (m/s²)",
    modelType: "kapania",
  },
  { key: "yaw_inertia", label: "Yaw Inertia (kg·m²)", modelType: "kapania" },
  {
    key: "front_cornering_stiffness",
    label: "Front Cornering Stiffness (N/rad)",
    modelType: "kapania",
  },
  {
    key: "rear_cornering_stiffness",
    label: "Rear Cornering Stiffness (N/rad)",
    modelType: "kapania",
  },
  {
    key: "max_engine_force",
    label: "Max Engine Force (N)",
    modelType: "kapania",
  },
  { key: "downforce_factor", label: "Downforce Factor", modelType: "kapania" },
  {
    key: "max_straight_speed",
    label: "Max Straight Speed (m/s)",
    modelType: "kapania",
  },
  {
    key: "brake_force_multiplier",
    label: "Brake Force Multiplier",
    modelType: "kapania",
  },
];

interface AnalysisData {
  parameterValue: number;
  lapTime: number;
  carId: string;
  modelType: string;
  teamName: string;
  carColor: string;
}

interface Props {
  cars: Car[];
  simulationResults: SimulationResult[];
}

export default function ParameterCorrelationAnalysis({
  cars,
  simulationResults,
}: Props) {
  const [selectedModel, setSelectedModel] =
    useState<string>("two_step_algorithm");
  const [selectedParameter, setSelectedParameter] = useState<keyof Car>("mass");
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [availableParameters, setAvailableParameters] = useState<
    ParameterOption[]
  >([]);

  // Debug logging
  useEffect(() => {
    console.log("Cars received:", cars);
    console.log("Simulation results received:", simulationResults);
  }, [cars, simulationResults]);

  // Detect model type based on car parameters
  const detectModelType = (car: Car): string => {
    if (
      car.yaw_inertia &&
      car.front_cornering_stiffness &&
      car.max_engine_force
    ) {
      return "two_step_algorithm";
    }
    if (car.drag_coefficient && car.lift_coefficient) {
      return "physics_based";
    }
    return "basic";
  };

  // Update available parameters based on selected model
  useEffect(() => {
    const parameters = PARAMETER_OPTIONS.filter(
      (param) =>
        param.modelType === "all" ||
        (param.modelType === "kapania" &&
          selectedModel === "two_step_algorithm") ||
        (param.modelType === "physics" && selectedModel === "physics_based")
    );
    console.log("Available parameters for model:", selectedModel, parameters);
    setAvailableParameters(parameters);

    // Set first available parameter as selected
    if (
      parameters.length > 0 &&
      !parameters.find((p) => p.key === selectedParameter)
    ) {
      setSelectedParameter(parameters[0].key);
    }
  }, [selectedModel]);

  // Update analysis data when parameter or model selection changes
  useEffect(() => {
    console.log("Updating analysis data for parameter:", selectedParameter);
    console.log("Selected model for analysis:", selectedModel);
    const newAnalysisData: AnalysisData[] = [];

    // Filter results by the actual model used in simulation
    const modelResults = simulationResults.filter(
      (result) => result.model === selectedModel
    );
    console.log(
      `Filtered ${modelResults.length} results for model: ${selectedModel}`
    );

    modelResults.forEach((result) => {
      const car = cars.find((c) => c.id === result.car_id);
      console.log(
        "Processing result for car:",
        car?.team_name,
        "with ID:",
        result.car_id,
        "using model:",
        result.model
      );

      if (car && car[selectedParameter] !== undefined) {
        newAnalysisData.push({
          parameterValue: car[selectedParameter] as number,
          lapTime: result.lap_time,
          carId: car.id,
          modelType: result.model, // Use the actual model from simulation
          teamName: car.team_name,
          carColor: car.car_color,
        });
      }
    });

    console.log("New analysis data:", newAnalysisData);
    setAnalysisData(newAnalysisData);
  }, [selectedParameter, selectedModel, cars, simulationResults]);

  // If no data is available, show a message
  if (simulationResults.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600 text-center">
          No simulation results available for analysis. Run some simulations to
          see parameter correlations.
        </p>
        {cars.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-medium mb-2">Available Cars:</h3>
            <div className="space-y-2">
              {cars.map((car) => (
                <div key={car.id} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: car.car_color }}
                  />
                  <span className="text-sm text-blue-700">
                    {car.team_name} - {detectModelType(car)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-blue-600">
              Run a simulation with these cars to see parameter correlations.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model and Parameter Selection */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Model Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Racing Line Model:
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {MODEL_OPTIONS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Selection */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Analyze Parameter:
            </label>
            <select
              value={selectedParameter}
              onChange={(e) =>
                setSelectedParameter(e.target.value as keyof Car)
              }
              className="form-select rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {availableParameters.map((param) => (
                <option key={param.key} value={param.key}>
                  {param.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {analysisData.length > 0 ? (
        <>
          {/* Visualization Area */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="h-80 relative">
              {/* Grid */}
              <div className="absolute inset-0">
                {[0, 25, 50, 75, 100].map((position) => (
                  <div
                    key={`vgrid-${position}`}
                    className="absolute h-full w-px bg-gray-200"
                    style={{ left: `${position}%` }}
                  />
                ))}
                {[0, 25, 50, 75, 100].map((position) => (
                  <div
                    key={`hgrid-${position}`}
                    className="absolute w-full h-px bg-gray-200"
                    style={{ bottom: `${position}%` }}
                  />
                ))}
              </div>

              {/* Scatter Plot */}
              <div className="absolute inset-0">
                {analysisData.map((point, index) => {
                  // Calculate position as percentage
                  const xPos =
                    ((point.parameterValue -
                      Math.min(...analysisData.map((d) => d.parameterValue))) /
                      (Math.max(...analysisData.map((d) => d.parameterValue)) -
                        Math.min(
                          ...analysisData.map((d) => d.parameterValue)
                        ))) *
                    100;
                  const yPos =
                    ((point.lapTime -
                      Math.min(...analysisData.map((d) => d.lapTime))) /
                      (Math.max(...analysisData.map((d) => d.lapTime)) -
                        Math.min(...analysisData.map((d) => d.lapTime)))) *
                    100;

                  return (
                    <div
                      key={`${point.carId}-${index}`}
                      className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all cursor-pointer"
                      style={{
                        backgroundColor: point.carColor,
                        left: `${xPos}%`,
                        bottom: `${yPos}%`,
                      }}
                      title={`${point.teamName}\n${selectedParameter}: ${
                        point.parameterValue
                      }\nLap Time: ${point.lapTime.toFixed(2)}s`}
                    />
                  );
                })}
              </div>

              {/* Axes Labels */}
              <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-600 mt-2">
                {
                  availableParameters.find((p) => p.key === selectedParameter)
                    ?.label
                }
              </div>
              <div className="absolute left-0 top-0 bottom-0 transform -rotate-90 flex items-center justify-center text-sm text-gray-600">
                Lap Time (seconds)
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
            <div className="grid grid-cols-2 gap-2">
              {analysisData.map((point) => (
                <div
                  key={`${point.carId}-${point.teamName}`}
                  className="flex items-center space-x-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: point.carColor }}
                  />
                  <span className="text-sm text-gray-600">
                    {point.teamName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">
                  Best Lap Time:{" "}
                  {Math.min(...analysisData.map((d) => d.lapTime)).toFixed(2)}s
                </p>
                <p className="text-gray-600">
                  Average Lap Time:{" "}
                  {(
                    analysisData.reduce((sum, d) => sum + d.lapTime, 0) /
                    analysisData.length
                  ).toFixed(2)}
                  s
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  Parameter Range:{" "}
                  {Math.min(
                    ...analysisData.map((d) => d.parameterValue)
                  ).toFixed(2)}{" "}
                  -{" "}
                  {Math.max(
                    ...analysisData.map((d) => d.parameterValue)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-center">
            No data available for{" "}
            {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.name}. Try
            running a simulation with this model or select a different model.
          </p>
        </div>
      )}
    </div>
  );
}
