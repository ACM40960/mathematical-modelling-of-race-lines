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
  { ssr: false }
);

export default function Home() {
  // Track state
  const [lines, setLines] = useState<Point[][]>([]);
  const [trackWidth, setTrackWidth] = useState<number>(20);
  const [trackLength, setTrackLength] = useState<number>(0);
  const [discretizationStep, setDiscretizationStep] = useState<number>(0.1);
  const [track, setTrack] = useState<Track | null>(null);
  
  // Cars state
  const [cars, setCars] = useState<Car[]>([]);

  // Clear all drawn lines
  const handleClear = () => {
    setLines([]);
    setTrack(null);
  };

  // Update track data when lines are drawn
  const handleTrackUpdate = (trackPoints: Point[], curvature: number[], length: number) => {
    setTrackLength(length);
    setTrack({
      track_points: trackPoints,
      curvature: curvature,
      track_length: length * 1000, // Convert km to meters
      message: "Track updated",
      width: trackWidth
    });
  };

  return (
    <>
      <Header />
      <main className="flex items-start justify-center gap-4 p-8 h-[calc(100vh-72px)]">
        {/* Canvas Area (80%) */}
        <div className="flex-1 basis-4/5 max-w-[80%] h-full">
          {/*
            CanvasDraw receives:
            - lines: the array of drawn lines
            - setLines: function to update lines
            - handleClear: function to clear the canvas
            - trackWidth: the track width
            - onTrackLengthChange: function to update track length in km after drawing
            - onTrackUpdate: function to update track data
            - cars: the array of cars
          */}
          <CanvasDrawPaper
            lines={lines}
            setLines={setLines}
            handleClear={handleClear}
            trackWidth={trackWidth}
            onTrackLengthChange={setTrackLength}
            onTrackUpdate={handleTrackUpdate}
            cars={cars}
          />
        </div>
        {/* Control Panel (20%) - TrackControl and CarControl now rendered here */}
        <div className="flex-1 basis-1/5 max-w-[20%] bg-gray-100 rounded-lg shadow p-4 h-full flex items-center justify-center">
          <div className="space-y-6">
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

            {/* Car controls */}
            <CarControl
              cars={cars}
              setCars={setCars}
              track={track}
            />
          </div>
        </div>
      </main>
    </>
  );
}
