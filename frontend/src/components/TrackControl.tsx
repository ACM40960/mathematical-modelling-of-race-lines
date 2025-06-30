import React, { useEffect } from "react";

/**
 * Props for TrackControl
 * - trackWidth: current width of the track
 * - setTrackWidth: function to update track width in the parent
 * - trackLength: current length of the track
 * - setTrackLength: function to update track length in the parent
 * - discretizationStep: current discretization step
 * - setDiscretizationStep: function to update discretization step in the parent
 */
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
  trackWidth: { min: 1, max: 100, step: 1 },
  trackLength: { min: 0, max: 10, step: 0.1 },
  discretizationStep: { min: 0.1, max: 10, step: 0.1 }
};

/**
 * TrackControl Component
 * Displays track information and controls for the user.
 * - Curvature profile (placeholder for now)
 * - Input fields for track length, discretization step, and track width
 */
const TrackControl: React.FC<TrackControlProps> = ({
  trackWidth,
  setTrackWidth,
  trackLength,
  setTrackLength,
  discretizationStep,
  setDiscretizationStep,
}) => {
  // 'lines' will be used in the next step for curvature and display

  // Print to console whenever trackLength or discretizationStep changes
  useEffect(() => {
    console.log("TrackControl: trackLength", trackLength);
  }, [trackLength]);
  useEffect(() => {
    console.log("TrackControl: discretizationStep", discretizationStep);
  }, [discretizationStep]);

  const validateAndSetValue = (
    value: number,
    setter: (value: number) => void,
    rules: ValidationRules
  ) => {
    const clampedValue = Math.min(Math.max(value, rules.min), rules.max);
    setter(Number(clampedValue.toFixed(1)));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Curvature Profile */}
      <div className="bg-white rounded shadow p-2 text-center text-gray-700">
        <span className="font-semibold">Curvature Profile</span>
        <div className="mt-2 text-xs text-gray-400">
          (Profile will be generated from the drawn track)
        </div>
      </div>

      {/* Track Length Input */}
      <div className="flex flex-col">
        <label 
          htmlFor="trackLength"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Track Length (km)
        </label>
        <input
          id="trackLength"
          type="number"
          className="border rounded px-2 py-1"
          value={trackLength}
          min={validationRules.trackLength.min}
          max={validationRules.trackLength.max}
          step={validationRules.trackLength.step}
          onChange={(e) => validateAndSetValue(
            Number(e.target.value),
            setTrackLength,
            validationRules.trackLength
          )}
          aria-label="Track Length in kilometers"
        />
      </div>

      {/* Discretization Step Input */}
      <div className="flex flex-col">
        <label 
          htmlFor="discretizationStep"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Discretization Step (Δs)
        </label>
        <input
          id="discretizationStep"
          type="number"
          className="border rounded px-2 py-1"
          value={discretizationStep}
          min={validationRules.discretizationStep.min}
          max={validationRules.discretizationStep.max}
          step={validationRules.discretizationStep.step}
          onChange={(e) => validateAndSetValue(
            Number(e.target.value),
            setDiscretizationStep,
            validationRules.discretizationStep
          )}
          aria-label="Discretization step size"
        />
      </div>

      {/* Track Width Input */}
      <div className="flex flex-col">
        <label 
          htmlFor="trackWidth"
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Track Width
        </label>
        <input
          id="trackWidth"
          type="number"
          className="border rounded px-2 py-1"
          value={trackWidth}
          min={validationRules.trackWidth.min}
          max={validationRules.trackWidth.max}
          step={validationRules.trackWidth.step}
          onChange={(e) => validateAndSetValue(
            Number(e.target.value),
            setTrackWidth,
            validationRules.trackWidth
          )}
          aria-label="Track width in meters"
        />
      </div>
    </div>
  );
};

export default TrackControl;
