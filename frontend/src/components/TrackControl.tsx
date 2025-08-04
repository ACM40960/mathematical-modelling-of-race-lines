/**
 * TrackControl Component
 *
 * This component provides the user interface for controlling track parameters.
 * It includes:
 * 1. Track Friction - The coefficient of friction between tires and track surface
 * 2. Track Length - The total length of the track in kilometers (read-only)
 *
 * Features:
 * - Real-time validation of friction values
 * - Enforced minimum and maximum bounds for friction
 * - Responsive updates to parent component
 * - Track width and discretization step are handled in backend only
 */

import React from "react";

interface TrackControlProps {
  trackLength: number;
  friction: number;
  onFrictionChange: (friction: number) => void;
}

// Track parameter validation rules
const trackValidationRules = {
  friction: {
    min: 0.3,
    max: 1.5,
    step: 0.05,
    default: 0.8,
    unit: "",
    label: "Track Friction",
  },
};

export default function TrackControl({
  trackLength,
  friction,
  onFrictionChange,
}: TrackControlProps) {
  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-semibold text-gray-800 mb-3">Track Parameters</h3>

      <div className="space-y-3">
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
            Range: {trackValidationRules.friction.min} -{" "}
            {trackValidationRules.friction.max} (0.3=wet, 0.8=dry, 1.2=hot
            track)
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
      </div>
    </div>
  );
}
