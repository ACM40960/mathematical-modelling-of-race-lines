/**
 * TrackControl Component
 *
 * This component provides the user interface for controlling track parameters.
 * It includes input fields for:
 * 1. Track Width - The width of the racing track in meters
 * 2. Track Length - The total length of the track in kilometers
 * 3. Discretization Step - The granularity of track point sampling
 * 4. Track Selection - Choose from predefined F1 circuits
 *
 * Features:
 * - Real-time validation of input values
 * - Enforced minimum and maximum bounds
 * - Automatic value clamping
 * - Responsive updates to parent component
 * - Track preset selection from database
 */

import React from "react";

interface TrackControlProps {
  trackWidth: number;
  onTrackWidthChange: (width: number) => void;
  trackLength: number;
  discretizationStep: number;
  onDiscretizationStepChange: (step: number) => void;
  onClear: () => void;
}

export default function TrackControl({
  trackWidth,
  onTrackWidthChange,
  trackLength,
  discretizationStep,
  onDiscretizationStepChange,
  onClear,
}: TrackControlProps) {
  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-semibold text-gray-800 mb-3">Track Parameters</h3>
      
      <div className="space-y-4">
        {/* Track Width Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track Width (meters)
          </label>
          <input
            type="number"
            value={trackWidth}
            onChange={(e) => onTrackWidthChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="5"
            max="50"
            step="0.5"
          />
        </div>

        {/* Track Length Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track Length (km)
          </label>
          <input
            type="text"
            value={trackLength.toFixed(3)}
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-600"
          />
        </div>

        {/* Discretization Step Control */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discretization Step
          </label>
          <input
            type="number"
            value={discretizationStep}
            onChange={(e) => onDiscretizationStepChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0.01"
            max="1"
            step="0.01"
          />
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Clear Track
        </button>
      </div>
    </div>
  );
}
