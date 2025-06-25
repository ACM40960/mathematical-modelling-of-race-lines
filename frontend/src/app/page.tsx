"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import CanvasDraw from "../components/CanvasDraw";
import TrackControl from "../components/TrackControl";

// Define a Point type for x and y coordinates (shared with CanvasDraw)
interface Point {
  x: number;
  y: number;
}

export default function Home() {
  // State to store all lines; each line is an array of points
  const [lines, setLines] = useState<Point[][]>([]);
  // State for track width, shared with TrackControl and (eventually) CanvasDraw
  const [trackWidth, setTrackWidth] = useState<number>(10);

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
          */}
          <CanvasDraw
            lines={lines}
            setLines={setLines}
            handleClear={handleClear}
            trackWidth={trackWidth}
          />
        </div>
        {/* Control Panel (20%) - TrackControl now rendered here */}
        <div className="flex-1 basis-1/5 max-w-[20%] bg-gray-100 rounded-lg shadow p-4 h-full flex items-center justify-center">
          {/* TrackControl receives trackWidth and setTrackWidth as props */}
          <TrackControl trackWidth={trackWidth} setTrackWidth={setTrackWidth} />
        </div>
      </main>
    </>
  );
}
