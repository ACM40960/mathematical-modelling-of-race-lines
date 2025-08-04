import React, { useState, useEffect } from "react";
import { Car, ValidationRule, Track } from "../types";

interface CarControlProps {
  cars: Car[];
  setCars: (cars: Car[]) => void;
  track?: Track | null;
  onSimulationResults?: (
    results: {
      car_id: string;
      coordinates: number[][];
      speeds: number[];
      lap_time: number;
    }[]
  ) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

interface RacingLineModel {
  id: string;
  name: string;
  description: string;
  track_usage: string;
  characteristics: string[];
}

const validationRules: Record<
  keyof Omit<
    Car,
    | "id"
    | "team_name"
    | "car_color"
    | "accent_color"
    | "suspension_stiffness"
    | "tire_compound"
    | "effective_frontal_area"
    | "model"
  >,
  ValidationRule
> = {
  mass: { min: 500, max: 2000, step: 50, default: 1500 },
  length: { min: 4.0, max: 5.5, step: 0.1, default: 5.0 },
  width: { min: 1.0, max: 2.0, step: 0.1, default: 1.4 },
  max_steering_angle: { min: 10, max: 45, step: 1, default: 30 },
  max_acceleration: { min: 1, max: 10, step: 0.5, default: 5 },
  drag_coefficient: { min: 0.3, max: 3.0, step: 0.05, default: 1.0 },
  lift_coefficient: { min: 0.5, max: 8.0, step: 0.1, default: 3.0 },
};

const defaultColors = [
  { name: "Ferrari", primary: "#DC0000", accent: "#000000" },
  { name: "Mercedes", primary: "#00D2BE", accent: "#000000" },
  { name: "Red Bull", primary: "#0600EF", accent: "#FFD700" },
  { name: "McLaren", primary: "#FF8700", accent: "#000000" },
  { name: "Alpine", primary: "#0090FF", accent: "#FF0000" },
  { name: "Aston Martin", primary: "#006F62", accent: "#FFFFFF" },
];

const CarControl: React.FC<CarControlProps> = ({
  cars,
  setCars,
  selectedModel,
  setSelectedModel,
}) => {
  const [availableModels, setAvailableModels] = useState<RacingLineModel[]>([]);
  const [expandedCar, setExpandedCar] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch("http://localhost:8000/models");
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models);
        }
      } catch (error) {
        setAvailableModels([
          {
            id: "physics_based",
            name: "Physics",
            description: "Research-based",
            track_usage: "96%",
            characteristics: [],
          },
          {
            id: "basic",
            name: "Basic",
            description: "Simple",
            track_usage: "75%",
            characteristics: [],
          },
        ]);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const needsUpdate = cars.some((car) => !car.team_name || !car.car_color);
    if (needsUpdate) {
      const updatedCars = cars.map((car, index) => ({
        ...car,
        team_name: car.team_name ?? `Team ${index + 1}`,
        car_color:
          car.car_color ?? defaultColors[index % defaultColors.length].primary,
        accent_color:
          car.accent_color ??
          defaultColors[index % defaultColors.length].accent,
        width: car.width ?? validationRules.width.default,
        tire_compound: car.tire_compound ?? "medium",
      }));
      setCars(updatedCars);
    }
  }, [cars, setCars]);

  const updateCarParam = (
    carIndex: number,
    param:
      | keyof typeof validationRules
      | "team_name"
      | "car_color"
      | "accent_color"
      | "tire_compound",
    value: number | string
  ) => {
    const newCars = [...cars];
    if (param in validationRules) {
      const rules = validationRules[param as keyof typeof validationRules];
      const numValue = Number(value);
      if (isNaN(numValue)) return;
      const clampedValue = Math.min(Math.max(numValue, rules.min), rules.max);
      newCars[carIndex] = { ...newCars[carIndex], [param]: clampedValue };
    } else {
      newCars[carIndex] = { ...newCars[carIndex], [param]: value };
    }
    setCars(newCars);
  };

  const addCar = () => {
    const newCarIndex = cars.length;
    const colorSet = defaultColors[newCarIndex % defaultColors.length];
    
    // Generate unique ID using timestamp to avoid duplicates
    const uniqueId = `car_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const teamNumber = cars.length + 1;
    
    const newCar: Car = {
      id: uniqueId,
      team_name: `Team ${teamNumber}`,
      car_color: colorSet.primary,
      accent_color: colorSet.accent,
      mass: validationRules.mass.default,
      length: validationRules.length.default,
      width: validationRules.width.default,
      max_steering_angle: validationRules.max_steering_angle.default,
      max_acceleration: validationRules.max_acceleration.default,
      drag_coefficient: validationRules.drag_coefficient.default,
      lift_coefficient: validationRules.lift_coefficient.default,
      tire_compound: "medium",
    };
    setCars([...cars, newCar]);
  };

  const removeCar = (index: number) => {
    const newCars = cars.filter((_, i) => i !== index);
    setCars(newCars);
  };

  return (
    <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
      {/* Header */}
      <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-blue-700">RACE CONTROL</h2>
        </div>
      </div>

      {/* Model Selection */}
      <div className="px-3 py-2 border-b border-gray-300">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-700 text-xs">MODEL</span>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.id} className="bg-white">
              {model.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Cars Section */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-xs">CARS [{cars.length}]</span>
          <button
            onClick={addCar}
            className="text-blue-600 hover:text-blue-700 hover:cursor-pointer text-xs font-medium transition-colors"
          >
            + Add Car
          </button>
        </div>

        {cars.map((car, index) => (
          <div
            key={car.id}
            className="mb-2 bg-white rounded border border-gray-300 shadow-sm"
          >
            {/* Car Header */}
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                setExpandedCar(expandedCar === car.id ? null : car.id)
              }
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded border border-gray-400"
                  style={{ backgroundColor: car.car_color }}
                />
                <span className="text-gray-800 font-bold text-xs">
                  {car.team_name}
                </span>
                <span className="text-gray-600 text-xs">
                  {car.tire_compound?.toUpperCase() || "MEDIUM"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs">
                  {expandedCar === car.id ? "▼" : "▶"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCar(index);
                  }}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Expanded Car Details */}
            {expandedCar === car.id && (
              <div className="p-2 pt-0 border-t border-gray-300 bg-gray-50">
                {/* Team Name */}
                <div className="mb-2">
                  <input
                    type="text"
                    value={car.team_name}
                    onChange={(e) =>
                      updateCarParam(index, "team_name", e.target.value)
                    }
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Team name"
                  />
                </div>

                {/* Colors & Tires */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      PRIMARY
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={car.car_color}
                        onChange={(e) =>
                          updateCarParam(index, "car_color", e.target.value)
                        }
                        className="w-6 h-6 rounded cursor-pointer"
                      />
                      <select
                        value={car.car_color}
                        onChange={(e) =>
                          updateCarParam(index, "car_color", e.target.value)
                        }
                        className="flex-1 bg-white text-gray-800 border border-gray-300 rounded px-1 py-1 text-xs"
                      >
                        {defaultColors.map((color, i) => (
                          <option
                            key={i}
                            value={color.primary}
                            className="bg-white"
                          >
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      ACCENT
                    </label>
                    <input
                      type="color"
                      value={car.accent_color}
                      onChange={(e) =>
                        updateCarParam(index, "accent_color", e.target.value)
                      }
                      className="w-full h-6 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      TIRES
                    </label>
                    <select
                      value={car.tire_compound}
                      onChange={(e) =>
                        updateCarParam(index, "tire_compound", e.target.value)
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-1 py-1 text-xs"
                    >
                      <option value="soft" className="bg-white">
                        SOFT
                      </option>
                      <option value="medium" className="bg-white">
                        MEDIUM
                      </option>
                      <option value="hard" className="bg-white">
                        HARD
                      </option>
                    </select>
                  </div>
                </div>

                {/* Car Parameters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      MASS
                    </label>
                    <input
                      type="number"
                      value={car.mass}
                      min={validationRules.mass.min}
                      max={validationRules.mass.max}
                      step={validationRules.mass.step}
                      onChange={(e) =>
                        updateCarParam(index, "mass", Number(e.target.value))
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      LENGTH
                    </label>
                    <input
                      type="number"
                      value={car.length}
                      min={validationRules.length.min}
                      max={validationRules.length.max}
                      step={validationRules.length.step}
                      onChange={(e) =>
                        updateCarParam(index, "length", Number(e.target.value))
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      WIDTH
                    </label>
                    <input
                      type="number"
                      value={car.width}
                      min={validationRules.width.min}
                      max={validationRules.width.max}
                      step={validationRules.width.step}
                      onChange={(e) =>
                        updateCarParam(index, "width", Number(e.target.value))
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      STEERING
                    </label>
                    <input
                      type="number"
                      value={car.max_steering_angle}
                      min={validationRules.max_steering_angle.min}
                      max={validationRules.max_steering_angle.max}
                      step={validationRules.max_steering_angle.step}
                      onChange={(e) =>
                        updateCarParam(
                          index,
                          "max_steering_angle",
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Acceleration */}
                <div className="mt-2">
                  <label className="block text-gray-600 text-xs mb-1">
                    MAX ACCELERATION
                  </label>
                  <input
                    type="number"
                    value={car.max_acceleration}
                    min={validationRules.max_acceleration.min}
                    max={validationRules.max_acceleration.max}
                    step={validationRules.max_acceleration.step}
                    onChange={(e) =>
                      updateCarParam(
                        index,
                        "max_acceleration",
                        Number(e.target.value)
                      )
                    }
                    className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Aerodynamic Parameters */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      DRAG COEFF
                    </label>
                    <input
                      type="number"
                      value={car.drag_coefficient || validationRules.drag_coefficient.default}
                      min={validationRules.drag_coefficient.min}
                      max={validationRules.drag_coefficient.max}
                      step={validationRules.drag_coefficient.step}
                      onChange={(e) =>
                        updateCarParam(
                          index,
                          "drag_coefficient",
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs mb-1">
                      DOWNFORCE
                    </label>
                    <input
                      type="number"
                      value={car.lift_coefficient || validationRules.lift_coefficient.default}
                      min={validationRules.lift_coefficient.min}
                      max={validationRules.lift_coefficient.max}
                      step={validationRules.lift_coefficient.step}
                      onChange={(e) =>
                        updateCarParam(
                          index,
                          "lift_coefficient",
                          Number(e.target.value)
                        )
                      }
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarControl;
