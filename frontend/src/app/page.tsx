"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import dynamic from "next/dynamic";
import TrackControl from "../components/TrackControl";
import CarControl from "../components/CarControl";
import { Point, Car, Track } from "../types";

// Dynamically import CanvasDrawPaper with no SSR
const CanvasDrawPaper = dynamic(
  () => import("../components/CanvasDrawPaper"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded border border-gray-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-600 font-mono text-sm">INITIALIZING CANVAS...</div>
        </div>
      </div>
    )
  }
);

interface SimulationResult {
  car_id: string;
  coordinates: number[][];
  speeds: number[];
  lap_time: number;
}

export default function Home() {
  // Track state
  const [lines, setLines] = useState<Point[][]>([]);
  const [trackWidth, setTrackWidth] = useState<number>(20);
  const [trackLength, setTrackLength] = useState<number>(0);
  const [discretizationStep, setDiscretizationStep] = useState<number>(0.1);
  const [track, setTrack] = useState<Track | null>(null);
  
  // Cars state
  const [cars, setCars] = useState<Car[]>([]);
  
  // Racing line model state
  const [selectedModel, setSelectedModel] = useState<string>('physics_based');
  
  // Simulation results state
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  // Clear all drawn lines and results
  const handleClear = () => {
    setLines([]);
    setTrack(null);
    setSimulationResults([]);
  };

  // Update track data when lines are drawn
  const handleTrackUpdate = (trackPoints: Point[], curvature: number[], length: number) => {
    setTrackLength(length);
    setTrack({
      track_points: trackPoints,
      width: trackWidth,
      friction: 0.7,
      cars: cars
    });
  };

  // Handle simulation results
  const handleSimulationResults = (results: SimulationResult[]) => {
    setSimulationResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex items-start justify-center gap-2 p-2 h-[calc(100vh-72px)]">
        {/* Canvas Area (80%) */}
        <div className="flex-1 basis-4/5 max-w-[80%] h-full">
          <div className="h-full bg-white border border-gray-300 rounded shadow-sm">
            <CanvasDrawPaper
              lines={lines}
              setLines={setLines}
              handleClear={handleClear}
              trackWidth={trackWidth}
              onTrackLengthChange={setTrackLength}
              onTrackUpdate={handleTrackUpdate}
              cars={cars}
              simulationResults={simulationResults}
              onSimulationResults={handleSimulationResults}
              selectedModel={selectedModel}
            />
          </div>
        </div>
        
        {/* Control Panel (20%) */}
        <div className="flex-1 basis-1/5 max-w-[20%] h-full">
          <div className="h-full flex flex-col gap-2">
            {/* Track controls */}
            <TrackControl
              trackWidth={trackWidth}
              setTrackWidth={(width) => {
                setTrackWidth(width);
                if (track) {
                  setTrack({...track, width});
                }
              }}
              trackLength={trackLength}
              setTrackLength={setTrackLength}
              discretizationStep={discretizationStep}
              setDiscretizationStep={setDiscretizationStep}
            />

            {/* Car controls with model selection */}
            <CarControl
              cars={cars}
              setCars={setCars}
              track={track}
              onSimulationResults={handleSimulationResults}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
