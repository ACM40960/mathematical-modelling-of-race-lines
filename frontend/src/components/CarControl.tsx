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
    | "model"
  >,
  ValidationRule
> = {
  mass: { min: 500, max: 2000, step: 50, default: 798 }, // F1 minimum weight
  length: { min: 4.0, max: 5.5, step: 0.1, default: 5.0 },
  width: { min: 1.0, max: 2.0, step: 0.1, default: 1.4 },
  max_steering_angle: { min: 10, max: 45, step: 1, default: 30 },
  max_acceleration: { min: 1, max: 10, step: 0.5, default: 5 },
  drag_coefficient: { min: 0.3, max: 3.0, step: 0.05, default: 1.0 },
  lift_coefficient: { min: 0.5, max: 8.0, step: 0.1, default: 3.0 },
  // Kapania Two Step Algorithm parameters (F1-optimized defaults)
  yaw_inertia: { min: 1000, max: 1600, step: 50, default: 1200 }, // F1 typical range
  front_axle_distance: { min: 1.0, max: 2.0, step: 0.05, default: 1.6 }, // F1 wheelbase
  rear_axle_distance: { min: 1.0, max: 2.0, step: 0.05, default: 1.4 }, // F1 wheelbase
  front_cornering_stiffness: {
    min: 60000,
    max: 120000,
    step: 5000,
    default: 80000,
  }, // F1 N/rad
  rear_cornering_stiffness: {
    min: 80000,
    max: 160000,
    step: 5000,
    default: 120000,
  }, // F1 N/rad
  max_engine_force: { min: 10000, max: 20000, step: 500, default: 15000 }, // F1 power range
  // F1 Aerodynamic & Performance Parameters
  downforce_factor: { min: 1.5, max: 4.0, step: 0.1, default: 3.0 }, // F1 downforce multiplier
  max_straight_speed: { min: 70, max: 100, step: 1, default: 85 }, // F1 top speed (m/s)
  max_speed_limit: { min: 80, max: 110, step: 1, default: 90 }, // Absolute max (m/s)
  min_corner_speed: { min: 10, max: 25, step: 1, default: 15 }, // Min corner speed (m/s)
  brake_force_multiplier: { min: 2.0, max: 4.0, step: 0.1, default: 3.0 }, // Brake vs engine ratio
  effective_frontal_area: { min: 1.0, max: 8.0, step: 0.1, default: 4.9 }, // Length * Width * 0.7 (default: 5.0 * 1.4 * 0.7)
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
      // Always include the Two Step Algorithm model
      const twoStepModel = {
        id: "two_step_algorithm",
        name: "Two Step Algorithm",
        description: "Kapania Sequential",
        track_usage: "85%",
        characteristics: [],
      };

      try {
        const response = await fetch("http://localhost:8000/models");
        if (response.ok) {
          const data = await response.json();
          // Check if backend already includes Two Step Algorithm
          const backendModels = data.models || [];
          const hasTwoStepModel = backendModels.some(
            (model: { id: string }) => model.id === "two_step_algorithm"
          );

          // Only add our hardcoded model if backend doesn't have it
          const allModels = hasTwoStepModel
            ? backendModels
            : [...backendModels, twoStepModel];
          setAvailableModels(allModels);
        } else {
          // Fallback: use default models including Two Step Algorithm
          setAvailableModels([
            {
              id: "physics_based",
              name: "Physics",
              description: "Research-based",
              track_usage: "80%",
              characteristics: [],
            },
            {
              id: "basic",
              name: "Basic",
              description: "Simple",
              track_usage: "60%",
              characteristics: [],
            },
            twoStepModel,
          ]);
        }
      } catch (error) {
        console.warn("Failed to load models from backend:", error);
        // Fallback: use default models including Two Step Algorithm
        setAvailableModels([
          {
            id: "physics_based",
            name: "Physics",
            description: "Research-based",
            track_usage: "80%",
            characteristics: [],
          },
          {
            id: "basic",
            name: "Basic",
            description: "Simple",
            track_usage: "60%",
            characteristics: [],
          },
          twoStepModel,
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
      | "tire_compound"
      | "yaw_inertia"
      | "front_axle_distance"
      | "rear_axle_distance"
      | "front_cornering_stiffness"
      | "rear_cornering_stiffness"
      | "max_engine_force",
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
    const uniqueId = `car_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    const teamNumber = cars.length + 1;

    // Create varied car configurations for better UX with Kapania model
    const carVariations = [
      // Car 1: Balanced Setup (Default F1)
      {
        mass: 798,
        yaw_inertia: 1200,
        front_cornering_stiffness: 80000,
        rear_cornering_stiffness: 120000,
        max_engine_force: 15000,
        downforce_factor: 3.0,
        max_straight_speed: 85,
        brake_force_multiplier: 3.0,
        tire_compound: "medium" as const,
        description: "Balanced",
      },
      // Car 2: High Downforce Setup (Slower but better cornering)
      {
        mass: 820,
        yaw_inertia: 1300,
        front_cornering_stiffness: 95000,
        rear_cornering_stiffness: 140000,
        max_engine_force: 14000,
        downforce_factor: 3.8,
        max_straight_speed: 78,
        brake_force_multiplier: 3.5,
        tire_compound: "soft" as const,
        description: "High Downforce",
      },
      // Car 3: Low Downforce Setup (Faster but less cornering)
      {
        mass: 780,
        yaw_inertia: 1100,
        front_cornering_stiffness: 70000,
        rear_cornering_stiffness: 100000,
        max_engine_force: 16500,
        downforce_factor: 2.2,
        max_straight_speed: 92,
        brake_force_multiplier: 2.7,
        tire_compound: "hard" as const,
        description: "Low Downforce",
      },
    ];

    // Select variation based on car index, or use balanced if more than 3 cars
    const variation =
      carVariations[newCarIndex % carVariations.length] || carVariations[0];

    const newCar: Car = {
      id: uniqueId,
      team_name: `${colorSet.name} (${variation.description})`,
      car_color: colorSet.primary,
      accent_color: colorSet.accent,
      mass: variation.mass,
      length: validationRules.length.default,
      width: validationRules.width.default,
      max_steering_angle: validationRules.max_steering_angle.default,
      max_acceleration: validationRules.max_acceleration.default,
      drag_coefficient: validationRules.drag_coefficient.default,
      lift_coefficient: validationRules.lift_coefficient.default,
      // Kapania Two Step Algorithm parameters - Varied for each car
      yaw_inertia: variation.yaw_inertia,
      front_axle_distance: validationRules.front_axle_distance.default,
      rear_axle_distance: validationRules.rear_axle_distance.default,
      front_cornering_stiffness: variation.front_cornering_stiffness,
      rear_cornering_stiffness: variation.rear_cornering_stiffness,
      max_engine_force: variation.max_engine_force,
      // F1 Aerodynamic & Performance Parameters - Varied
      downforce_factor: variation.downforce_factor,
      max_straight_speed: variation.max_straight_speed,
      max_speed_limit: validationRules.max_speed_limit.default,
      min_corner_speed: validationRules.min_corner_speed.default,
      brake_force_multiplier: variation.brake_force_multiplier,
      effective_frontal_area: validationRules.effective_frontal_area.default,
      tire_compound: variation.tire_compound,
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
                <div className="mb-2 mt-2">
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

                {/* Model-Specific Parameters */}

                {selectedModel === "two_step_algorithm" ? (
                  // Kapania Two Step Algorithm - Clean F1 Parameters
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-xs text-blue-700 font-semibold mb-3">
                      F1 CAR PARAMETERS
                    </div>

                    {/* Mass */}
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        MASS (kg)
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

                    {/* Engine Force */}
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        MAX ENGINE FORCE (N)
                      </label>
                      <input
                        type="number"
                        value={
                          car.max_engine_force ||
                          validationRules.max_engine_force.default
                        }
                        min={validationRules.max_engine_force.min}
                        max={validationRules.max_engine_force.max}
                        step={validationRules.max_engine_force.step}
                        onChange={(e) =>
                          updateCarParam(
                            index,
                            "max_engine_force",
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Yaw Inertia */}
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        YAW INERTIA (kg·m²)
                      </label>
                      <input
                        type="number"
                        value={
                          car.yaw_inertia || validationRules.yaw_inertia.default
                        }
                        min={validationRules.yaw_inertia.min}
                        max={validationRules.yaw_inertia.max}
                        step={validationRules.yaw_inertia.step}
                        onChange={(e) =>
                          updateCarParam(
                            index,
                            "yaw_inertia",
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Axle Distances */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          FRONT AXLE (m)
                        </label>
                        <input
                          type="number"
                          value={
                            car.front_axle_distance ||
                            validationRules.front_axle_distance.default
                          }
                          min={validationRules.front_axle_distance.min}
                          max={validationRules.front_axle_distance.max}
                          step={validationRules.front_axle_distance.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "front_axle_distance",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          REAR AXLE (m)
                        </label>
                        <input
                          type="number"
                          value={
                            car.rear_axle_distance ||
                            validationRules.rear_axle_distance.default
                          }
                          min={validationRules.rear_axle_distance.min}
                          max={validationRules.rear_axle_distance.max}
                          step={validationRules.rear_axle_distance.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "rear_axle_distance",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Cornering Stiffness */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          FRONT STIFF (N/rad)
                        </label>
                        <input
                          type="number"
                          value={
                            car.front_cornering_stiffness ||
                            validationRules.front_cornering_stiffness.default
                          }
                          min={validationRules.front_cornering_stiffness.min}
                          max={validationRules.front_cornering_stiffness.max}
                          step={validationRules.front_cornering_stiffness.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "front_cornering_stiffness",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          REAR STIFF (N/rad)
                        </label>
                        <input
                          type="number"
                          value={
                            car.rear_cornering_stiffness ||
                            validationRules.rear_cornering_stiffness.default
                          }
                          min={validationRules.rear_cornering_stiffness.min}
                          max={validationRules.rear_cornering_stiffness.max}
                          step={validationRules.rear_cornering_stiffness.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "rear_cornering_stiffness",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* F1 Aerodynamic & Performance Parameters */}
                    <div className="text-xs font-semibold text-gray-700 mb-2 mt-4 border-t pt-2">
                      F1 AERODYNAMIC & PERFORMANCE
                    </div>

                    {/* Downforce Factor */}
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        DOWNFORCE FACTOR
                      </label>
                      <input
                        type="number"
                        value={
                          car.downforce_factor ||
                          validationRules.downforce_factor.default
                        }
                        min={validationRules.downforce_factor.min}
                        max={validationRules.downforce_factor.max}
                        step={validationRules.downforce_factor.step}
                        onChange={(e) =>
                          updateCarParam(
                            index,
                            "downforce_factor",
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Speed Limits */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          MAX STRAIGHT (m/s)
                        </label>
                        <input
                          type="number"
                          value={
                            car.max_straight_speed ||
                            validationRules.max_straight_speed.default
                          }
                          min={validationRules.max_straight_speed.min}
                          max={validationRules.max_straight_speed.max}
                          step={validationRules.max_straight_speed.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "max_straight_speed",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          MAX LIMIT (m/s)
                        </label>
                        <input
                          type="number"
                          value={
                            car.max_speed_limit ||
                            validationRules.max_speed_limit.default
                          }
                          min={validationRules.max_speed_limit.min}
                          max={validationRules.max_speed_limit.max}
                          step={validationRules.max_speed_limit.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "max_speed_limit",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Corner Speed & Braking */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          MIN CORNER (m/s)
                        </label>
                        <input
                          type="number"
                          value={
                            car.min_corner_speed ||
                            validationRules.min_corner_speed.default
                          }
                          min={validationRules.min_corner_speed.min}
                          max={validationRules.min_corner_speed.max}
                          step={validationRules.min_corner_speed.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "min_corner_speed",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          BRAKE MULTIPLIER
                        </label>
                        <input
                          type="number"
                          value={
                            car.brake_force_multiplier ||
                            validationRules.brake_force_multiplier.default
                          }
                          min={validationRules.brake_force_multiplier.min}
                          max={validationRules.brake_force_multiplier.max}
                          step={validationRules.brake_force_multiplier.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "brake_force_multiplier",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Other Models - Basic Parameters
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-xs text-green-700 font-semibold mb-3">
                      VEHICLE PARAMETERS
                    </div>

                    {/* Basic Parameters for other models */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          MASS (kg)
                        </label>
                        <input
                          type="number"
                          value={car.mass}
                          min={validationRules.mass.min}
                          max={validationRules.mass.max}
                          step={validationRules.mass.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "mass",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          LENGTH (m)
                        </label>
                        <input
                          type="number"
                          value={car.length}
                          min={validationRules.length.min}
                          max={validationRules.length.max}
                          step={validationRules.length.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "length",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          WIDTH (m)
                        </label>
                        <input
                          type="number"
                          value={car.width}
                          min={validationRules.width.min}
                          max={validationRules.width.max}
                          step={validationRules.width.step}
                          onChange={(e) =>
                            updateCarParam(
                              index,
                              "width",
                              Number(e.target.value)
                            )
                          }
                          className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          STEERING (°)
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
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        MAX ACCELERATION (m/s²)
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
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-gray-600 text-xs mb-1">
                          DRAG COEFF
                        </label>
                        <input
                          type="number"
                          value={
                            car.drag_coefficient ||
                            validationRules.drag_coefficient.default
                          }
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
                          value={
                            car.lift_coefficient ||
                            validationRules.lift_coefficient.default
                          }
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

                    {/* Effective Frontal Area - Important for Physics-Based Model */}
                    <div className="mb-2">
                      <label className="block text-gray-600 text-xs mb-1">
                        FRONTAL AREA (m²)
                      </label>
                      <input
                        type="number"
                        value={
                          car.effective_frontal_area ||
                          validationRules.effective_frontal_area.default
                        }
                        min={validationRules.effective_frontal_area.min}
                        max={validationRules.effective_frontal_area.max}
                        step={validationRules.effective_frontal_area.step}
                        onChange={(e) =>
                          updateCarParam(
                            index,
                            "effective_frontal_area",
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarControl;
