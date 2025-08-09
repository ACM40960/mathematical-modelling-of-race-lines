"use client";

import React, { useState, useEffect } from "react";
import TrackControl from "@/components/TrackControl";
import CarControl from "@/components/CarControl";
import Header from "@/components/Header";
import { Track, Car, Point, SimulationResult, TrackPreset } from "@/types";
import dynamic from "next/dynamic";
import {
  saveTrack,
  loadTrack,
  saveCars,
  loadCars,
  saveSimulationResults,
  loadSimulationResults,
  saveTrackSettings,
  loadTrackSettings,
  saveSelectedModel,
  loadSelectedModel,
  useStorageListener,
} from "@/lib/dataStore";

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

export default function TrackDesigner() {
  // Track state
  const [lines, setLines] = useState<Point[][]>([]);
  const [trackWidth, setTrackWidth] = useState<number>(20);
  const [trackLength, setTrackLength] = useState<number>(0);
  const [discretizationStep, setDiscretizationStep] = useState<number>(0.1);
  const [friction, setFriction] = useState<number>(0.8);
  const [track, setTrack] = useState<Track | null>(null);
  const [selectedTrackName, setSelectedTrackName] = useState<
    string | undefined
  >(undefined);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);

  // Cars state
  const [cars, setCars] = useState<Car[]>([]);

  // Racing line model state
  const [selectedModel, setSelectedModel] = useState<string>("physics_based");

  // Simulation results state
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);

  // Load initial data from localStorage
  useEffect(() => {
    const loadedTrack = loadTrack();
    const loadedCars = loadCars();
    const loadedResults = loadSimulationResults();
    const loadedSettings = loadTrackSettings();
    const loadedModel = loadSelectedModel();

    if (loadedTrack) setTrack(loadedTrack);
    if (loadedCars.length > 0) setCars(loadedCars);
    if (loadedResults.length > 0) setSimulationResults(loadedResults);

    setTrackWidth(loadedSettings.trackWidth);
    setFriction(loadedSettings.trackFriction || 0.8);
    setTrackLength(loadedSettings.trackLength);
    setDiscretizationStep(loadedSettings.discretizationStep);
    setSelectedTrackName(loadedSettings.selectedTrackName);
    setSelectedModel(loadedModel);

    console.log(
      "Track Designer loaded with saved data (lines loading disabled to prevent random graphs)"
    );
  }, []);

  // Update track when cars change
  useEffect(() => {
    if (track) {
      const updatedTrack = { ...track, cars };
      setTrack(updatedTrack);
    }
  }, [cars]);

  // Save data to localStorage when state changes
  useEffect(() => {
    saveTrack(track);
  }, [track]);

  useEffect(() => {
    saveCars(cars);
  }, [cars]);

  useEffect(() => {
    saveSimulationResults(simulationResults);
  }, [simulationResults]);

  useEffect(() => {
    saveTrackSettings({
      trackWidth,
      trackFriction: friction,
      trackLength,
      discretizationStep,
      selectedTrackName,
    });
  }, [
    trackWidth,
    friction,
    trackLength,
    discretizationStep,
    selectedTrackName,
  ]);

  useEffect(() => {
    saveSelectedModel(selectedModel);
  }, [selectedModel]);

  // Handle navigation issue: Clear canvas state when no track but cars are loaded
  useEffect(() => {
    if (lines.length === 0 && cars.length > 0 && simulationResults.length > 0) {
      console.log("Navigation detected: Clearing stale simulation results");
      setSimulationResults([]);
    }
  }, [lines.length, cars.length, simulationResults.length]);

  // Listen for storage changes from other windows
  useStorageListener((key) => {
    console.log("Storage update received:", key);
  });

  // Clear all drawn lines and results
  const handleClear = () => {
    setLines([]);
    setTrack(null);
    setSimulationResults([]);
    setSelectedTrackName(undefined);
    localStorage.removeItem("f1_racing_lines");
  };

  // Handle track updates from canvas
  const handleTrackUpdate = (
    trackPoints: Point[],
    curvature: number[],
    length: number
  ) => {
    setLines([trackPoints]);
    setTrackLength(length);

    if (selectedTrackName && !isLoadingPreset) {
      console.log("User manually drew track, clearing preset selection");
      setSelectedTrackName(undefined);
    }

    const newTrack = {
      track_points: trackPoints,
      width: trackWidth,
      friction: friction,
      cars: cars,
    };
    setTrack(newTrack);
  };

  // Handle track selection from Header
  const handleTrackSelect = (trackPreset: TrackPreset) => {
    console.log("Loading preset track:", trackPreset.name);

    setIsLoadingPreset(true);
    setLines([trackPreset.track_points]);

    const newTrack = {
      track_points: trackPreset.track_points,
      width: trackPreset.width,
      friction: trackPreset.friction,
      cars: cars,
    };
    setTrack(newTrack);

    setTrackWidth(trackPreset.width);
    setFriction(trackPreset.friction);
    setTrackLength(trackPreset.track_length / 1000);
    setSelectedTrackName(trackPreset.name);

    setTimeout(() => {
      setIsLoadingPreset(false);
      console.log("Preset track loaded successfully:", trackPreset.name);
    }, 100);

    // Don't clear simulation results when switching tracks
    // setSimulationResults([]); // REMOVED THIS LINE
  };

  // Handle custom track selection from Header
  const handleCustomTrack = () => {
    console.log("Switching to custom track mode");
    setSelectedTrackName(undefined);
    setIsLoadingPreset(false);
  };

  // Handle track length change
  const handleTrackLengthChange = (length: number) => {
    setTrackLength(length);
  };

  // Handle friction change
  const handleFrictionChange = (newFriction: number) => {
    setFriction(newFriction);
    if (track) {
      const updatedTrack = { ...track, friction: newFriction };
      setTrack(updatedTrack);
    }
  };

  // Handle car updates
  const handleCarsUpdate = (newCars: Car[]) => {
    setCars(newCars);
  };

  // Handle new simulation results
  const handleNewSimulationResults = (newResults: SimulationResult[]) => {
    console.log("Setting new simulation results:", newResults);
    setSimulationResults(newResults);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header with integrated track selection */}
      <Header
        selectedTrackName={selectedTrackName}
        onTrackSelect={handleTrackSelect}
        onCustomTrack={handleCustomTrack}
      />

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex overflow-hidden">
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
              onSimulationResults={handleNewSimulationResults}
              selectedModel={selectedModel}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-4 overflow-y-auto">
          {/* Track Controls */}
          <TrackControl
            trackLength={trackLength}
            friction={friction}
            onFrictionChange={handleFrictionChange}
          />

          {/* Car Controls */}
          <CarControl
            cars={cars}
            setCars={handleCarsUpdate}
            track={track}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />

          {/* Results Display Section */}
          {simulationResults.length > 0 && (
            <div className="p-4 border border-gray-300 rounded">
              <h3 className="font-semibold text-gray-800 mb-3">Race Results</h3>
              {/* Create a new array and sort results by lap time (fastest first) */}
              {[...simulationResults]
                .sort((a, b) => a.lap_time - b.lap_time)
                .map((result, position) => {
                  // Find the corresponding car details using car_id
                  const car = cars.find((car) => car.id === result.car_id);

                  // Calculate the fastest lap time once for gap calculations
                  const fastestLapTime = simulationResults.reduce(
                    (fastest, current) =>
                      current.lap_time < fastest ? current.lap_time : fastest,
                    simulationResults[0].lap_time
                  );

                  return (
                    <div
                      key={result.car_id}
                      className="mb-2 p-2 bg-gray-50 rounded text-sm"
                    >
                      {/* Position and Team Name Row */}
                      <div className="font-medium flex items-center gap-2">
                        {/* Position indicator (P1, P2, etc.) */}
                        <span className="text-gray-500">P{position + 1}</span>
                        {/* Team name in their car color */}
                        <span style={{ color: car?.car_color }}>
                          {car?.team_name || `Car ${position + 1}`}
                        </span>
                      </div>

                      {/* Lap Time Row */}
                      <div>Lap Time: {result.lap_time.toFixed(3)}s</div>

                      {/* Gap to Leader Row */}
                      <div>
                        Gap:{" "}
                        {position === 0
                          ? "Leader" // P1 is marked as Leader
                          : // For others, show gap to leader
                            `+${(result.lap_time - fastestLapTime).toFixed(
                              3
                            )}s`}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
