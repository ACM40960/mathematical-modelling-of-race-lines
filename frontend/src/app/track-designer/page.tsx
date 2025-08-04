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
  saveLines,
  loadLines,
  saveSelectedModel,
  loadSelectedModel,
  useStorageListener
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
  const [track, setTrack] = useState<Track | null>(null);
  const [selectedTrackName, setSelectedTrackName] = useState<string | undefined>(undefined);

  // Cars state
  const [cars, setCars] = useState<Car[]>([]);

  // Racing line model state
  const [selectedModel, setSelectedModel] = useState<string>("physics_based");

  // Simulation results state
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  // Load initial data from localStorage
  useEffect(() => {
    const loadedTrack = loadTrack();
    const loadedCars = loadCars();
    const loadedResults = loadSimulationResults();
    const loadedSettings = loadTrackSettings();
    const loadedLines = loadLines();
    const loadedModel = loadSelectedModel();

    if (loadedTrack) setTrack(loadedTrack);
    if (loadedCars.length > 0) setCars(loadedCars);
    if (loadedResults.length > 0) setSimulationResults(loadedResults);
    if (loadedLines.length > 0) setLines(loadedLines);
    
    setTrackWidth(loadedSettings.trackWidth);
    setTrackLength(loadedSettings.trackLength);
    setDiscretizationStep(loadedSettings.discretizationStep);
    setSelectedTrackName(loadedSettings.selectedTrackName);
    setSelectedModel(loadedModel);

    console.log('🏁 Track Designer loaded with saved data');
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
      trackLength,
      discretizationStep,
      selectedTrackName
    });
  }, [trackWidth, trackLength, discretizationStep, selectedTrackName]);

  useEffect(() => {
    saveLines(lines);
  }, [lines]);

  useEffect(() => {
    saveSelectedModel(selectedModel);
  }, [selectedModel]);

  // Listen for storage changes from other windows
  useEffect(() => {
    const cleanup = useStorageListener((key, newValue) => {
      console.log('🔄 Storage update received:', key);
      // We could update state here if needed, but for track designer
      // we primarily push data, not receive it
    });

    return cleanup;
  }, []);

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
    const newTrack = {
      track_points: trackPoints,
      width: trackWidth,
      friction: 0.8,
      cars: cars,
    };
    setTrack(newTrack);
  };

  // Handle track selection from Header
  const handleTrackSelect = (trackPreset: TrackPreset) => {
    // Update lines with preset track points
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
      const updatedTrack = { ...track, width };
      setTrack(updatedTrack);
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
      const updatedTrack = { ...track, cars: newCars };
      setTrack(updatedTrack);
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
      console.log("Starting simulation with track:", track);
      console.log("Cars:", cars);
      console.log("Model:", selectedModel);

      const response = await fetch("http://localhost:8000/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          track_points: track.track_points.map((p) => ({ x: p.x, y: p.y })),
          width: track.width,
          friction: track.friction,
          cars: cars,
          model: selectedModel,
        }),
      });

      console.log("Simulation response:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Simulation data:", data);
        setSimulationResults(data.optimal_lines || data);
      } else {
        const errorText = await response.text();
        console.error("Simulation failed:", errorText);
        alert(`Simulation failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error during simulation:", error);
      alert("Error during simulation. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Back to Home
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-xl font-bold text-gray-900">🏁 Track Designer</h1>
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
              trackWidth={trackWidth}
              onTrackWidthChange={handleTrackWidthChange}
              trackLength={trackLength}
              discretizationStep={discretizationStep}
              onDiscretizationStepChange={handleDiscretizationStepChange}
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
    </div>
  );
}