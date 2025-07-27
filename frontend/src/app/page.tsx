"use client";

import React, { useState } from "react";
import TrackControl from "@/components/TrackControl";
import CarControl from "@/components/CarControl";
import Header from "@/components/Header";

import { Track, Car, Point, SimulationResult, TrackPreset } from "@/types";
import dynamic from "next/dynamic";

// Dynamically import CanvasDrawPaper with no SSR to avoid Paper.js server-side issues
const CanvasDrawPaper = dynamic(() => import("@/components/CanvasDrawPaper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded border border-gray-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-blue-600 font-mono text-sm">
          INITIALIZING CANVAS...
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  // Track state
  const [lines, setLines] = useState<Point[][]>([]);
  const [trackWidth, setTrackWidth] = useState<number>(20);
  const [trackLength, setTrackLength] = useState<number>(0);
  const [discretizationStep, setDiscretizationStep] = useState<number>(0.1);
  const [track, setTrack] = useState<Track | null>(null);
  const [selectedTrackName, setSelectedTrackName] = useState<string | undefined>(undefined);

  // Track selector state
  const [isTrackSelectorOpen, setIsTrackSelectorOpen] = useState(false);

  // Cars state
  const [cars, setCars] = useState<Car[]>([]);

  // Racing line model state
  const [selectedModel, setSelectedModel] = useState<string>("physics_based");

  // Simulation results state
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);

  // Clear all drawn lines and results
  const handleClear = () => {
    setLines([]);
    setTrack(null);
    setSimulationResults([]);
    setSelectedTrackName(undefined);
  };

  // Handle track updates from canvas
  const handleTrackUpdate = (
    trackPoints: Point[],
    curvature: number[],
    length: number
  ) => {
    setLines([trackPoints]);
    setTrackLength(length);

    // If user manually draws, clear selected track name
    if (selectedTrackName) {
      setSelectedTrackName(undefined);
    }

    // Update track object
    setTrack({
      track_points: trackPoints,
      width: trackWidth,
      friction: 0.8,
      cars: cars,
    });
  };

  // Handle track selection from Header
  const handleTrackSelect = (trackPreset: TrackPreset) => {
    // Update lines with preset track points
    setLines([trackPreset.track_points]);

    // Update track state
    setTrack({
      track_points: trackPreset.track_points,
      width: trackPreset.width,
      friction: trackPreset.friction,
      cars: cars,
    });

    // Update track parameters
    setTrackWidth(trackPreset.width);
    setTrackLength(trackPreset.track_length / 1000); // Convert meters to kilometers
    setSelectedTrackName(trackPreset.name);

    // Clear any existing simulation results
    setSimulationResults([]);

    console.log("Selected track:", trackPreset.name);
  };

  // Handle custom track selection from Header
  const handleCustomTrack = () => {
    setSelectedTrackName(undefined);
    // Don't clear existing track, just remove the preset name
  };

  // Handle track length change
  const handleTrackLengthChange = (length: number) => {
    setTrackLength(length);
  };

  // Handle track width change
  const handleTrackWidthChange = (width: number) => {
    setTrackWidth(width);
    // Update track object if it exists
    if (track) {
      setTrack({ ...track, width });
    }
  };

  // Handle discretization step change
  const handleDiscretizationStepChange = (step: number) => {
    setDiscretizationStep(step);
  };

  // Handle car updates
  const handleCarsUpdate = (newCars: Car[]) => {
    setCars(newCars);
    // Update track object if it exists
    if (track) {
      setTrack({ ...track, cars: newCars });
    }
  };

  // Handle simulation
  const handleSimulation = async () => {
    if (!track || track.track_points.length === 0) {
      alert("Please draw a track first!");
      return;
    }

    if (cars.length === 0) {
      alert("Please add at least one car configuration!");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          track: track,
          model_type: selectedModel,
          discretization_step: discretizationStep,
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setSimulationResults(results.racing_lines);
        console.log("Simulation completed:", results);
      } else {
        const errorData = await response.json();
        alert(`Simulation failed: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error during simulation:", error);
      alert("Error during simulation. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with integrated track selection */}
      <Header 
        selectedTrackName={selectedTrackName}
        onTrackSelect={handleTrackSelect}
        onCustomTrack={handleCustomTrack}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Main Canvas Area */}
        <div className="flex-1 p-4">
          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
            <CanvasDrawPaper
              lines={lines}
              setLines={setLines}
              handleClear={handleClear}
              trackWidth={trackWidth}
              onTrackUpdate={handleTrackUpdate}
              onTrackLengthChange={handleTrackLengthChange}
              cars={cars}
              simulationResults={simulationResults}
              onSimulationResults={setSimulationResults}
              selectedModel={selectedModel}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
          {/* Track Controls */}
          <TrackControl
            trackWidth={trackWidth}
            onTrackWidthChange={handleTrackWidthChange}
            trackLength={trackLength}
            discretizationStep={discretizationStep}
            onDiscretizationStepChange={handleDiscretizationStepChange}
            onClear={handleClear}
          />

                     {/* Car Controls */}
           <CarControl 
             cars={cars} 
             setCars={handleCarsUpdate}
             track={track}
             selectedModel={selectedModel}
             setSelectedModel={setSelectedModel}
           />

          {/* Model Selection */}
          <div className="p-4 border border-gray-300 rounded">
            <h3 className="font-semibold text-gray-800 mb-3">Racing Line Model</h3>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="basic">Basic Model</option>
              <option value="physics_based">Physics-Based Model</option>
            </select>
          </div>

          {/* Simulation Button */}
          <button
            onClick={handleSimulation}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
          >
            Calculate Racing Line
          </button>

          {/* Results Display */}
          {simulationResults.length > 0 && (
            <div className="p-4 border border-gray-300 rounded">
              <h3 className="font-semibold text-gray-800 mb-3">Results</h3>
              {simulationResults.map((result, index) => (
                <div key={index} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium">Car {index + 1}</div>
                  <div>Lap Time: {result.lap_time.toFixed(3)}s</div>
                                     <div>Points: {result.coordinates.length}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
