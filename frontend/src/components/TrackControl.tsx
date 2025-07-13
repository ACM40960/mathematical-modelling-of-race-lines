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

interface TrackControlProps {
  trackWidth: number;
  setTrackWidth: (width: number) => void;
  trackLength: number;
  setTrackLength: (length: number) => void;
  discretizationStep: number;
  setDiscretizationStep: (step: number) => void;
}

interface ValidationRules {
  min: number;
  max: number;
  step: number;
}

const validationRules = {
  trackWidth: { min: 10, max: 30, step: 1 },
  trackLength: { min: 0, max: 10, step: 0.1 },
  discretizationStep: { min: 0.1, max: 10, step: 0.1 }
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

  const validateAndSetValue = (
    value: number,
    setter: (value: number) => void,
    rules: ValidationRules
  ) => {
    const validValue = Math.min(Math.max(value, rules.min), rules.max);
    setter(validValue);
  };

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
    <div className="w-full bg-white text-gray-800 text-xs font-mono border border-gray-300 rounded shadow-sm">
      {/* Curvature Profile Section */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 text-xs">CURVATURE PROFILE</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          (Generated from track)
        </div>
      </div>

      {/* Track Settings Section */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 text-xs">TRACK SETTINGS</span>
          <span className="text-orange-600 text-xs font-bold">
            {trackLength.toFixed(1)}KM
          </span>
        </div>
        
        {/* Track Width with Racing-Style Slider */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-gray-600 text-xs">WIDTH</label>
            <span className="text-gray-800 text-xs font-bold">
              {trackWidth}M
            </span>
          </div>
          <input
            type="range"
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
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
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>NARROW</span>
            <span>WIDE</span>
          </div>
        </div>

        {/* Track Length */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-gray-600 text-xs">LENGTH</label>
            <span className="text-gray-800 text-xs font-bold">
              {trackLength.toFixed(1)}KM
            </span>
          </div>
          <input
            type="number"
            className="w-full bg-gray-50 text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
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
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-gray-600 text-xs">DISCRETIZATION</label>
            <span className="text-gray-800 text-xs font-bold">
              Δs={discretizationStep}
            </span>
          </div>
          <input
            type="number"
            className="w-full bg-gray-50 text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
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

        {/* Action Button */}
        <button
          onClick={handleSendToBackend}
          disabled={isLoading}
          className={`w-full py-2 px-3 rounded text-xs font-bold transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'SENDING...' : 'GET TRACK DATA'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        
        .slider-thumb:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 2px #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default TrackControl;
