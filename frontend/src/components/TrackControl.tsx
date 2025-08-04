/**
 * TrackControl Component
 *
 * This component provides the user interface for controlling track parameters.
 * It includes input fields for:
 * 1. Track Width - The width of the racing track in meters
 * 2. Track Friction - The coefficient of friction between tires and track surface
 * 3. Track Length - The total length of the track in kilometers (read-only)
 * 4. Discretization Step - The granularity of track point sampling
 *
 * Features:
 * - Real-time validation of input values
 * - Enforced minimum and maximum bounds
 * - Automatic value clamping
 * - Responsive updates to parent component
 */

import React from "react";

interface TrackControlProps {
  trackWidth: number;
  onTrackWidthChange: (width: number) => void;
  trackLength: number;
  discretizationStep: number;
  onDiscretizationStepChange: (step: number) => void;
  friction: number;
  onFrictionChange: (friction: number) => void;
}

// Track parameter validation rules (similar to CarControl structure)
const trackValidationRules: {
  [key: string]: { min: number; max: number; step: number; default: number; unit: string; label: string };
} = {
  width: { min: 5, max: 50, step: 0.5, default: 20, unit: 'm', label: 'Track Width' },
  friction: { min: 0.3, max: 1.5, step: 0.05, default: 0.8, unit: '', label: 'Track Friction' },
  discretization: { min: 0.01, max: 1, step: 0.01, default: 0.1, unit: '', label: 'Discretization Step' },
};

export default function TrackControl({
  trackWidth,
  onTrackWidthChange,
  trackLength,
  discretizationStep,
  onDiscretizationStepChange,
  friction,
  onFrictionChange,
}: TrackControlProps) {
  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-semibold text-gray-800 mb-3">Track Parameters</h3>
      
      <div className="space-y-3">
        {/* Track Width Control */}
        <div>
          <label className="block text-gray-600 text-xs mb-1">
            {trackValidationRules.width.label.toUpperCase()} ({trackValidationRules.width.unit})
          </label>
          <input
            type="number"
            value={trackWidth}
            onChange={(e) => onTrackWidthChange(Number(e.target.value))}
            className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            min={trackValidationRules.width.min}
            max={trackValidationRules.width.max}
            step={trackValidationRules.width.step}
          />
        </div>

        {/* Track Friction Control */}
        <div>
          <label className="block text-gray-600 text-xs mb-1">
            {trackValidationRules.friction.label.toUpperCase()}
          </label>
          <input
            type="number"
            value={friction || 0.8}
            onChange={(e) => onFrictionChange(Number(e.target.value))}
            className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            min={trackValidationRules.friction.min}
            max={trackValidationRules.friction.max}
            step={trackValidationRules.friction.step}
          />
          <div className="text-xs text-gray-500 mt-1">
            Range: {trackValidationRules.friction.min} - {trackValidationRules.friction.max} (0.3=wet, 0.8=dry, 1.2=hot track)
          </div>
        </div>

        {/* Track Length Display */}
        <div>
          <label className="block text-gray-600 text-xs mb-1">
            TRACK LENGTH (KM)
          </label>
          <input
            type="text"
            value={trackLength.toFixed(3)}
            readOnly
            className="w-full bg-gray-50 text-gray-600 border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </div>

        {/* Discretization Step Control */}
        <div>
          <label className="block text-gray-600 text-xs mb-1">
            {trackValidationRules.discretization.label.toUpperCase()}
          </label>
          <input
            type="number"
            value={discretizationStep}
            onChange={(e) => onDiscretizationStepChange(Number(e.target.value))}
            className="w-full bg-white text-gray-800 border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            min={trackValidationRules.discretization.min}
            max={trackValidationRules.discretization.max}
            step={trackValidationRules.discretization.step}
          />
        </div>
      </div>
    </div>
  );
}