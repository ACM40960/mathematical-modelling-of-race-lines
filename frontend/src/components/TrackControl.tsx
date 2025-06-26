import React, { useEffect } from "react";
// import type { Point } from "./CanvasDraw"; // Will be used in the next step

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
          Track Length (s)(km)
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
          Discretization Step (Δs)
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
