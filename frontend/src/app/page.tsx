"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import dynamic from "next/dynamic";
import TrackControl from "../components/TrackControl";

// Dynamically import CanvasDrawPaper (client-side only)
const CanvasDraw = dynamic(() => import("../components/CanvasDrawPaper"), {
  ssr: false,
});

// Define a Point type for x and y coordinates (shared with CanvasDraw)
interface Point {
  x: number;
  y: number;
}

export default function Home() {
  // State to store all lines; each line is an array of points
  const [lines, setLines] = useState<Point[][]>([]);
  // State for track width, shared with TrackControl and CanvasDraw
  const [trackWidth, setTrackWidth] = useState<number>(20);
  // State for track length and discretization step, shared with TrackControl
  const [trackLength, setTrackLength] = useState<number>(0);
  const [discretizationStep, setDiscretizationStep] = useState<number>(1);

  // Handler to clear all lines (can be passed to CanvasDraw or TrackControl)
  const handleClear = () => setLines([]);

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
          */}
          <CanvasDraw
            lines={lines}
            setLines={setLines}
            handleClear={handleClear}
            trackWidth={trackWidth}
            onTrackLengthChange={setTrackLength}
          />
        </div>
        {/* Control Panel (20%) - TrackControl now rendered here */}
        <div className="flex-1 basis-1/5 max-w-[20%] bg-gray-100 rounded-lg shadow p-4 h-full flex items-center justify-center">
          {/* TrackControl receives trackWidth, setTrackWidth, trackLength, setTrackLength, discretizationStep, setDiscretizationStep as props */}
          <TrackControl
            trackWidth={trackWidth}
            setTrackWidth={setTrackWidth}
            trackLength={trackLength}
            setTrackLength={setTrackLength}
            discretizationStep={discretizationStep}
            setDiscretizationStep={setDiscretizationStep}
          />
        </div>
      </main>
    </>
  );
}
