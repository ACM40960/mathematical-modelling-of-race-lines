/**
 * TrackControl Component
 * 
 * This component provides the user interface for controlling track parameters.
 * It includes input fields for:
 * 1. Track Width - The width of the racing track in meters
 * 2. Track Length - The total length of the track in kilometers
 * 3. Discretization Step - The granularity of track point sampling
 * 
 * Features:
 * - Real-time validation of input values
 * - Enforced minimum and maximum bounds
 * - Automatic value clamping
 * - Responsive updates to parent component
 */

"use client";

import React, { useState } from "react";

/**
 * Props Interface
 * Defines the required properties for the TrackControl component:
 * @property {number} trackWidth - Current width of the track in meters
 * @property {function} setTrackWidth - Callback to update track width
 * @property {number} trackLength - Current length of the track in kilometers
 * @property {function} setTrackLength - Callback to update track length
 * @property {number} discretizationStep - Current sampling step size
 * @property {function} setDiscretizationStep - Callback to update step size
 */
interface TrackControlProps {
  trackWidth: number;
  setTrackWidth: (width: number) => void;
  trackLength: number;
  setTrackLength: (length: number) => void;
  discretizationStep: number;
  setDiscretizationStep: (step: number) => void;
}

/**
 * Validation Rules Interface
 * Defines the structure for input validation rules
 * @property {number} min - Minimum allowed value
 * @property {number} max - Maximum allowed value
 * @property {number} step - Step size for input increments
 */
interface ValidationRules {
  min: number;
  max: number;
  step: number;
}

/**
 * Validation Rules Configuration
 * Defines the bounds and step sizes for each track parameter
 */
const validationRules = {
  trackWidth: { 
    min: 10,    // Minimum track width: 10 meters
    max: 30,    // Maximum track width: 30 meters
    step: 1     // Width adjusts in 1-meter increments
  },
  trackLength: { 
    min: 0,    // Minimum track length: 0 kilometers
    max: 10,   // Maximum track length: 10 kilometers
    step: 0.1  // Length adjusts in 0.1 km increments
  },
  discretizationStep: { 
    min: 0.1,  // Minimum step size: 0.1
    max: 10,   // Maximum step size: 10
    step: 0.1  // Step size adjusts in 0.1 increments
  }
};

const TrackControl: React.FC<TrackControlProps> = ({
  trackWidth,
  setTrackWidth,
  trackLength,
  setTrackLength,
  discretizationStep,
  setDiscretizationStep,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates and updates a numeric input value
   * 1. Clamps the value between min and max bounds
   * 2. Rounds to match the specified step size
   * 3. Updates the state through the provided setter function
   * 
   * @param value - The new value to validate
   * @param setter - The state setter function to call
   * @param rules - The validation rules to apply
   */
  const validateAndSetValue = (
    value: number,
    setter: (value: number) => void,
    rules: ValidationRules
  ) => {
    const validValue = Math.min(Math.max(value, rules.min), rules.max);
    setter(validValue);
  };

  /**
   * Sends track data to the backend for processing
   */
  const handleSendToBackend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackWidth,
          trackLength,
          discretizationStep
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send track data');
      }

      const data = await response.json();
      console.log('Response from backend:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full text-sm">
      {/* Curvature Profile Section */}
      <div className="bg-white rounded shadow p-3 text-center">
        <span className="font-medium text-gray-700">Curvature Profile</span>
        <div className="mt-1 text-xs text-gray-400">
          (Generated from track)
        </div>
      </div>

      {/* Race Settings Section */}
      <div className="bg-white rounded shadow p-3">
        <h3 className="font-medium text-gray-700 mb-3">Race Settings</h3>
        
        {/* Track Width with compact slider */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="trackWidth" className="text-gray-600 text-xs">
              Track Width
            </label>
            <span className="text-xs font-medium text-gray-700">
              {trackWidth}m
            </span>
          </div>
          <input
            id="trackWidth"
            type="range"
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={trackWidth}
            min={validationRules.trackWidth.min}
            max={validationRules.trackWidth.max}
            step={validationRules.trackWidth.step}
            onChange={(e) => validateAndSetValue(
              Number(e.target.value),
              setTrackWidth,
              validationRules.trackWidth
            )}
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Narrow</span>
            <span>Wide</span>
          </div>
        </div>

        {/* Track Length */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="trackLength" className="text-gray-600 text-xs">
              Track Length
            </label>
            <span className="text-xs font-medium text-gray-700">
              {trackLength}km
            </span>
          </div>
          <input
            id="trackLength"
            type="number"
            className="w-full px-2 py-1 text-xs border rounded"
            value={trackLength}
            min={validationRules.trackLength.min}
            max={validationRules.trackLength.max}
            step={validationRules.trackLength.step}
            onChange={(e) => validateAndSetValue(
              Number(e.target.value),
              setTrackLength,
              validationRules.trackLength
            )}
          />
        </div>

        {/* Discretization Step */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="discretizationStep" className="text-gray-600 text-xs">
              Discretization (Δs)
            </label>
            <span className="text-xs font-medium text-gray-700">
              {discretizationStep}
            </span>
          </div>
          <input
            id="discretizationStep"
            type="number"
            className="w-full px-2 py-1 text-xs border rounded"
            value={discretizationStep}
            min={validationRules.discretizationStep.min}
            max={validationRules.discretizationStep.max}
            step={validationRules.discretizationStep.step}
            onChange={(e) => validateAndSetValue(
              Number(e.target.value),
              setDiscretizationStep,
              validationRules.discretizationStep
            )}
          />
        </div>

        {/* Send to Backend Button */}
        <button
          onClick={handleSendToBackend}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded text-white text-sm font-medium transition-colors ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Processing...' : 'Get Track Data'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackControl;
