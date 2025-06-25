import React from "react";
// import type { Point } from "./CanvasDraw"; // Will be used in the next step

/**
 * Props for TrackControl
 * - trackWidth: current width of the track
 * - setTrackWidth: function to update track width in the parent
 * (lines and other props will be added in the next step)
 */
interface TrackControlProps {
  trackWidth: number;
  setTrackWidth: (width: number) => void;
}

/**
 * TrackControl Component
 * Displays track information and controls for the user.
 * - Curvature profile (placeholder for now)
 * - Input fields for track length, discretization step, and track width
 */
const TrackControl: React.FC<TrackControlProps> = ({
  trackWidth,
  setTrackWidth,
}) => {
  // 'lines' will be used in the next step for curvature and display

  // Local state for the three input fields
  const [trackLength, setTrackLength] = React.useState(0);
  const [discretizationStep, setDiscretizationStep] = React.useState(1);

  // Placeholder: In the future, calculate curvature from lines
  // and update the canvas when trackWidth changes

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Curvature Profile Placeholder */}
      <div className="bg-white rounded shadow p-2 text-center text-gray-700">
        <span className="font-semibold">Curvature Profile</span>
        <div className="mt-2 text-xs text-gray-400">
          (Profile will be generated from the drawn track)
        </div>
      </div>

      {/* Track Length Input */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Track Length
        </label>
        <input
          type="number"
          className="border rounded px-2 py-1"
          value={trackLength}
          min={0}
          onChange={(e) => setTrackLength(Number(e.target.value))}
        />
      </div>

      {/* Discretization Step Input */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Discretization Step
        </label>
        <input
          type="number"
          className="border rounded px-2 py-1"
          value={discretizationStep}
          min={1}
          onChange={(e) => setDiscretizationStep(Number(e.target.value))}
        />
      </div>

      {/* Track Width Input (controlled by parent) */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Track Width
        </label>
        <input
          type="number"
          className="border rounded px-2 py-1"
          value={trackWidth}
          min={1}
          onChange={(e) => setTrackWidth(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default TrackControl;
