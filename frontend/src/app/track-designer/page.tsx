"use client";

import React, { useState, useEffect } from "react";
import TrackControl from "@/components/TrackControl";
import CarControl from "@/components/CarControl";
import Header from "@/components/Header";
import Link from "next/link";
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
    // REMOVED: const loadedLines = loadLines(); // This was causing random graphs on refresh
    const loadedModel = loadSelectedModel();

    if (loadedTrack) setTrack(loadedTrack);
    if (loadedCars.length > 0) setCars(loadedCars);
    if (loadedResults.length > 0) setSimulationResults(loadedResults);
    // REMOVED: if (loadedLines.length > 0) setLines(loadedLines); // This was causing random graphs on refresh

    setTrackWidth(loadedSettings.trackWidth);
    setFriction(loadedSettings.trackFriction || 0.8); // Fix: Load friction from localStorage
    setTrackLength(loadedSettings.trackLength);
    setDiscretizationStep(loadedSettings.discretizationStep);
    setSelectedTrackName(loadedSettings.selectedTrackName);
    setSelectedModel(loadedModel);

    console.log(
      "🏁 Track Designer loaded with saved data (lines loading disabled to prevent random graphs)"
    );
  }, []);

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
      trackFriction: friction, // Fix: Save friction to localStorage
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
      console.log("🔄Navigation detected: Clearing stale simulation results");
      // Only clear simulation results if they exist and we have no track
      setSimulationResults([]);
    }
  }, [lines.length, cars.length, simulationResults.length]);

  // Listen for storage changes from other windows
  useStorageListener((key) => {
    console.log("🔄 Storage update received:", key);
    // We could update state here if needed, but for track designer
    // we primarily push data, not receive it
  });

  // Clear all drawn lines and results
  const handleClear = () => {
    setLines([]);
    setTrack(null);
    setSimulationResults([]);
    setSelectedTrackName(undefined);
    // Also clear lines from localStorage to prevent future random graphs
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

    // Only clear selected track name if user manually draws (not when loading preset)
    if (selectedTrackName && !isLoadingPreset) {
      console.log("🎨 User manually drew track, clearing preset selection");
      setSelectedTrackName(undefined);
    }

    // Update track object
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
    console.log("🏁 Loading preset track:", trackPreset.name);

    // Set loading flag to prevent clearing selectedTrackName
    setIsLoadingPreset(true);

    // Store ORIGINAL track data for backend simulation (unscaled)
    (window as any).presetTrackLength = trackPreset.track_length; // meters
    (window as any).originalTrackPoints = trackPreset.track_points; // original coordinates
    (window as any).originalTrackWidth = trackPreset.width; // original width in meters

    console.log(
      `Stored original data: ${trackPreset.track_points.length} points, width: ${trackPreset.width}m`
    );

    // Update lines with preset track points (these will be scaled for display)
    setLines([trackPreset.track_points]);

    // Update track state
    const newTrack = {
      track_points: trackPreset.track_points,
      width: trackPreset.width,
      friction: trackPreset.friction,
      cars: cars,
    };
    setTrack(newTrack);

    // Update track parameters
    setTrackWidth(trackPreset.width);
    setFriction(trackPreset.friction);
    setTrackLength(trackPreset.track_length / 1000); // Convert meters to kilometers
    setSelectedTrackName(trackPreset.name);

    // Clear loading flag after a short delay to allow canvas updates
    setTimeout(() => {
      setIsLoadingPreset(false);
      console.log("✅ Preset track loaded successfully:", trackPreset.name);
    }, 100);

    // Clear any existing simulation results
    setSimulationResults([]);

    console.log("Selected track:", trackPreset.name);
  };

  // Handle custom track selection from Header
  const handleCustomTrack = () => {
    console.log("🎨 Switching to custom track mode");
    setSelectedTrackName(undefined);
    setIsLoadingPreset(false); // Ensure we're not in loading state
    // Don't clear existing track, just remove the preset name
  };

  // Handle track length change
  const handleTrackLengthChange = (length: number) => {
    setTrackLength(length);
  };

  // Handle friction change
  const handleFrictionChange = (newFriction: number) => {
    setFriction(newFriction);
    // Update track object if it exists
    if (track) {
      const updatedTrack = { ...track, friction: newFriction };
      setTrack(updatedTrack);
    }
  };

  // Handle car updates
  const handleCarsUpdate = (newCars: Car[]) => {
    setCars(newCars);
    // Update track object if it exists
    if (track) {
      const updatedTrack = { ...track, cars: newCars };
      setTrack(updatedTrack);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to Home
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-bold text-gray-900">
              🏁 Track Designer
            </h1>
          </div>
          <Link
            href="/parameter-analysis"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            🔬 Open Parameter Analysis
          </Link>
        </div>
      </div>

      {/* Header with integrated track selection */}
      <Header
        selectedTrackName={selectedTrackName}
        onTrackSelect={handleTrackSelect}
        onCustomTrack={handleCustomTrack}
      />

      {/* Main Content */}
      <div className="h-[calc(100vh-128px)]">
        <div className="flex h-full">
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

            {/* Results Display */}
            {simulationResults.length > 0 && (
              <div className="p-4 border border-gray-300 rounded">
                <h3 className="font-semibold text-gray-800 mb-3">Results</h3>
                {simulationResults.map((result, index) => (
                  <div
                    key={index}
                    className="mb-2 p-2 bg-gray-50 rounded text-sm"
                  >
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
    </div>
  );
}
