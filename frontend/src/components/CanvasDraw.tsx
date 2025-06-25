"use client";

import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

// Define a Point type for x and y coordinates
export interface Point {
  x: number;
  y: number;
}

/**
 * Props for CanvasDraw
 * - lines: array of drawn lines (each line is an array of points)
 * - setLines: function to update lines
 * - handleClear: function to clear the canvas
 * - trackWidth: width of the track (for drawing boundaries)
 */
interface CanvasDrawProps {
  lines: Point[][];
  setLines: Dispatch<SetStateAction<Point[][]>>;
  handleClear: () => void;
  trackWidth: number;
}

/**
 * CanvasDraw Component
 * Renders a canvas where users can draw with the mouse.
 * Captures and logs the coordinates and curves of the lines drawn.
 * Receives state and handlers from parent for shared access.
 * Draws a ribbon (track boundaries) using the normal vector method.
 */
export default function CanvasDraw({
  lines,
  setLines,
  handleClear,
  trackWidth,
}: CanvasDrawProps) {
  // Reference to the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Reference to the parent container
  const containerRef = useRef<HTMLDivElement>(null);
  // State to track if the user is currently drawing
  const [drawing, setDrawing] = useState(false);
  // State for canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 150 });

  // Set canvas size to fill parent on mount and resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Helper: Compute normal vector for a segment
  function getNormal(p1: Point, p2: Point): { x: number; y: number } {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: -dy / len, y: dx / len };
  }

  // Draw lines and boundaries
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach((line) => {
      if (line.length < 2) return;
      // Draw center line
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      ctx.stroke();

      // Draw boundaries (ribbon) if trackWidth > 0
      if (trackWidth > 0) {
        const halfWidth = trackWidth / 2;
        // Compute left and right boundary points
        const left: Point[] = [];
        const right: Point[] = [];
        for (let i = 0; i < line.length - 1; i++) {
          const p1 = line[i];
          const p2 = line[i + 1];
          const normal = getNormal(p1, p2);
          left.push({
            x: p1.x + normal.x * halfWidth,
            y: p1.y + normal.y * halfWidth,
          });
          right.push({
            x: p1.x - normal.x * halfWidth,
            y: p1.y - normal.y * halfWidth,
          });
        }
        // Add last point
        const last = line[line.length - 1];
        const prev = line[line.length - 2];
        const normal = getNormal(prev, last);
        left.push({
          x: last.x + normal.x * halfWidth,
          y: last.y + normal.y * halfWidth,
        });
        right.push({
          x: last.x - normal.x * halfWidth,
          y: last.y - normal.y * halfWidth,
        });

        // Draw left boundary
        ctx.strokeStyle = "#2563eb"; // Tailwind blue-600
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) {
          ctx.lineTo(left[i].x, left[i].y);
        }
        ctx.stroke();

        // Draw right boundary
        ctx.strokeStyle = "#16a34a"; // Tailwind green-600
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(right[0].x, right[0].y);
        for (let i = 1; i < right.length; i++) {
          ctx.lineTo(right[i].x, right[i].y);
        }
        ctx.stroke();
      }
    });
  }, [lines, canvasSize, trackWidth]);

  /**
   * Mouse down event handler: starts a new line
   * Adds the starting point to the lines array
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    // Get mouse position relative to the canvas
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Start a new line with the initial point
    setLines((prev) => [...prev, [{ x, y }]]);
  };

  /**
   * Mouse move event handler: adds points to the current line while drawing
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    // Get mouse position relative to the canvas
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Add the new point to the latest line
    setLines((prev) => {
      const newLines = [...prev];
      newLines[newLines.length - 1] = [
        ...newLines[newLines.length - 1],
        { x, y },
      ];
      return newLines;
    });
  };

  /**
   * Mouse up/leave event handler: ends the current line
   * Logs the coordinates of the line to the console
   */
  const handleMouseUp = () => {
    setDrawing(false);
    // Log the latest line's coordinates for reference
    if (lines.length > 0) {
      console.log("Line drawn:", lines[lines.length - 1]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas area fills all available space */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-0 relative flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-300 rounded bg-white cursor-crosshair w-full h-full absolute top-0 left-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      {/* Clear Button and Instructional text below the canvas */}
      <div className="flex flex-col items-center mt-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 transition hover:cursor-pointer"
          onClick={handleClear}
        >
          Clear
        </button>
        <p className="text-center mt-2 text-sm text-gray-500">
          Use mouse/pen to draw a track and find the race line.
        </p>
      </div>
    </div>
  );
}
