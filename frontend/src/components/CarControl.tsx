import React, { useState } from "react";
import { Car, ValidationRule, Track } from "../types";

interface CarControlProps {
  cars: Car[];
  setCars: (cars: Car[]) => void;
  track?: Track | null;  // Make track optional
}

/**
 * Validation rules for car parameters
 */
const validationRules: Record<keyof Omit<Car, 'id'>, ValidationRule> = {
  mass: { 
    min: 500,    // Minimum mass: 500 kg
    max: 2000,   // Maximum mass: 2000 kg
    step: 50,    // Mass adjusts in 50kg increments
    default: 1500
  },
  length: { 
    min: 2.0,    // Minimum length: 2.0 meters
    max: 5.0,    // Maximum length: 5.0 meters
    step: 0.1,   // Length adjusts in 0.1m increments
    default: 2.5
  },
  max_steering_angle: { 
    min: 10,     // Minimum angle: 10 degrees
    max: 45,     // Maximum angle: 45 degrees
    step: 1,     // Angle adjusts in 1-degree increments
    default: 30
  },
  max_acceleration: { 
    min: 1,      // Minimum acceleration: 1 m/s²
    max: 10,     // Maximum acceleration: 10 m/s²
    step: 0.5,   // Acceleration adjusts in 0.5 m/s² increments
    default: 5
  }
};

/**
 * CarControl Component
 * Provides interface for managing car parameters in the simulation
 */
const CarControl: React.FC<CarControlProps> = ({ cars, setCars, track }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  /**
   * Updates a specific parameter for a car
   */
  const updateCarParam = (
    carIndex: number,
    param: keyof Omit<Car, 'id'>,
    value: number
  ) => {
    const newCars = [...cars];
    const rules = validationRules[param];
    // Clamp value between min and max
    const clampedValue = Math.min(Math.max(value, rules.min), rules.max);
    newCars[carIndex] = {
      ...newCars[carIndex],
      [param]: clampedValue
    };
    setCars(newCars);
  };

  /**
   * Adds a new car to the simulation
   */
  const addCar = () => {
    const newCar: Car = {
      id: `car${cars.length + 1}`,
      mass: validationRules.mass.default,
      length: validationRules.length.default,
      max_steering_angle: validationRules.max_steering_angle.default,
      max_acceleration: validationRules.max_acceleration.default
    };
    setCars([...cars, newCar]);
  };

  /**
   * Removes a car from the simulation
   */
  const removeCar = (index: number) => {
    const newCars = cars.filter((_, i) => i !== index);
    setCars(newCars);
  };

  /**
   * Handles running the simulation
   */
  const handleSimulation = async () => {
    if (cars.length === 0) {
      setSimulationError("Please add at least one car before simulating");
      return;
    }

    if (!track || !track.track_points || track.track_points.length < 3) {
      setSimulationError("Please draw a valid track first");
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    try {
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_points: track.track_points,
          curvature: track.curvature,
          track_length: track.track_length,
          message: "Simulation request",
          width: track.width,
          friction: 0.7, // Default friction coefficient
          cars: cars
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run simulation');
      }

      const data = await response.json();
      console.log('Simulation results:', data);
      // TODO: Handle simulation results display
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : 'An error occurred during simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Cars</h2>
          <button
            onClick={addCar}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Add a new car to the simulation"
          >
            Add Car
          </button>
        </div>

        {cars.map((car, index) => (
          <div 
            key={car.id}
            className="border rounded-lg p-4 mb-4 last:mb-0 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700">Car {index + 1}</h3>
              <button
                onClick={() => removeCar(index)}
                className="text-red-500 hover:text-red-600 transition-colors"
                title="Remove this car"
              >
                Remove
              </button>
            </div>

            {/* Mass Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mass (kg)
              </label>
              <input
                type="number"
                value={car.mass}
                min={validationRules.mass.min}
                max={validationRules.mass.max}
                step={validationRules.mass.step}
                onChange={(e) => updateCarParam(index, 'mass', Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            {/* Length Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length (m)
              </label>
              <input
                type="number"
                value={car.length}
                min={validationRules.length.min}
                max={validationRules.length.max}
                step={validationRules.length.step}
                onChange={(e) => updateCarParam(index, 'length', Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            {/* Max Steering Angle Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Steering Angle (degrees)
              </label>
              <input
                type="number"
                value={car.max_steering_angle}
                min={validationRules.max_steering_angle.min}
                max={validationRules.max_steering_angle.max}
                step={validationRules.max_steering_angle.step}
                onChange={(e) => updateCarParam(index, 'max_steering_angle', Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>

            {/* Max Acceleration Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Acceleration (m/s²)
              </label>
              <input
                type="number"
                value={car.max_acceleration}
                min={validationRules.max_acceleration.min}
                max={validationRules.max_acceleration.max}
                step={validationRules.max_acceleration.step}
                onChange={(e) => updateCarParam(index, 'max_acceleration', Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>
        ))}

        {cars.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No cars added. Click "Add Car" to start.
          </div>
        )}

        {/* Simulation Button */}
        <div className="mt-6 border-t pt-4">
          <button
            onClick={handleSimulation}
            disabled={isSimulating || cars.length === 0 || !track?.track_points?.length}
            className={`w-full py-2 px-4 rounded text-white text-sm font-medium transition-colors ${
              isSimulating || cars.length === 0 || !track?.track_points?.length
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
          </button>

          {/* Simulation Error Message */}
          {simulationError && (
            <div className="mt-2 text-sm text-red-600">
              {simulationError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarControl; 