"use client";

import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import paper from "paper/dist/paper-core";

export interface Point {
  x: number;
  y: number;
}

interface CanvasDrawProps {
  lines: Point[][];
  setLines: Dispatch<SetStateAction<Point[][]>>;
  handleClear: () => void;
  trackWidth: number;
  onTrackLengthChange?: (lengthKm: number) => void;
}

/**
 * CanvasDrawPaper Component
 * Uses paper.js for all drawing and smoothing.
 * Only loaded on the client (no SSR).
 */
const CanvasDrawPaper: React.FC<CanvasDrawProps> = ({
  lines,
  setLines,
  handleClear,
  trackWidth,
  onTrackLengthChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 150 });

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

  // --- Pure helpers moved outside component for best practice and to avoid useEffect dependency warning ---

  /**
   * Check if a line is a loop (start and end points are close)
   * @param line Array of points
   * @param threshold Distance threshold in pixels
   */
  function isLoop(line: Point[], threshold = 10): boolean {
    if (line.length < 3) return false;
    const start = line[0];
    const end = line[line.length - 1];
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    return dist < threshold;
  }

  /**
   * Smooth a line using paper.js, handling open and closed paths
   * @param line Array of points
   * @returns paper.Path
   */
  function smoothLineWithPaper(line: Point[]): InstanceType<typeof paper.Path> {
    const path = new paper.Path();
    line.forEach((pt) => path.add(new paper.Point(pt.x, pt.y)));
    // If the line is a loop, close the path for proper smoothing
    if (isLoop(line)) {
      path.closed = true;
    }
    // Smooth the path (Catmull-Rom for natural race lines)
    path.smooth({ type: "catmull-rom", factor: 0.5 });
    return path;
  }

  // Helper: Compute distance between two points
  function getDistance(p1: Point, p2: Point): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  // Helper: Remove consecutive points that are too close (distance < threshold)
  function filterClosePoints(line: Point[], threshold = 3): Point[] {
    if (line.length === 0) return [];
    const filtered: Point[] = [line[0]];
    for (let i = 1; i < line.length; i++) {
      if (getDistance(filtered[filtered.length - 1], line[i]) >= threshold) {
        filtered.push(line[i]);
      }
    }
    return filtered;
  }

  // Helper: Compute the total length of a polyline in pixels
  function getLineLength(line: Point[]): number {
    let length = 0;
    for (let i = 1; i < line.length; i++) {
      length += getDistance(line[i - 1], line[i]);
    }
    return length;
  }

  // Draw lines and boundaries using only paper.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paper.setup(canvas);
    paper.project.activeLayer.removeChildren(); // Clear previous drawings

    lines.forEach((line) => {
      if (line.length < 2) return;
      // 1. Smooth the center line for display
      //    - If the line is a loop, the path is closed for proper smoothing
      //    - If the line is open, the path is left open
      const centerPath = smoothLineWithPaper(line);
      centerPath.strokeColor = new paper.Color("#e11d48");
      centerPath.strokeWidth = 3;
      centerPath.strokeCap = "round";
      centerPath.strokeJoin = "round";

      // 2. Draw boundaries (ribbon) using the normal vector method
      if (trackWidth > 0) {
        const halfWidth = trackWidth / 2;
        const leftPoints: InstanceType<typeof paper.Point>[] = [];
        const rightPoints: InstanceType<typeof paper.Point>[] = [];
        for (let i = 0; i < centerPath.segments.length - 1; i++) {
          const p1 = centerPath.segments[i].point;
          const p2 = centerPath.segments[i + 1].point;
          const normal = getNormal({ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y });
          leftPoints.push(
            new paper.Point(
              p1.x + normal.x * halfWidth,
              p1.y + normal.y * halfWidth
            )
          );
          rightPoints.push(
            new paper.Point(
              p1.x - normal.x * halfWidth,
              p1.y - normal.y * halfWidth
            )
          );
        }
        // Add last point
        const last = centerPath.segments[centerPath.segments.length - 1].point;
        const prev = centerPath.segments[centerPath.segments.length - 2].point;
        const normal = getNormal(
          { x: prev.x, y: prev.y },
          { x: last.x, y: last.y }
        );
        leftPoints.push(
          new paper.Point(
            last.x + normal.x * halfWidth,
            last.y + normal.y * halfWidth
          )
        );
        rightPoints.push(
          new paper.Point(
            last.x - normal.x * halfWidth,
            last.y - normal.y * halfWidth
          )
        );

        // Draw left boundary
        const leftPath = new paper.Path(leftPoints);
        leftPath.strokeColor = new paper.Color("#2563eb");
        leftPath.strokeWidth = 2;
        leftPath.strokeCap = "round";
        leftPath.strokeJoin = "round";

        // Draw right boundary
        const rightPath = new paper.Path(rightPoints);
        rightPath.strokeColor = new paper.Color("#16a34a");
        rightPath.strokeWidth = 2;
        rightPath.strokeCap = "round";
        rightPath.strokeJoin = "round";
      }
    });
    // Force paper.js to render
    paper.view.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, canvasSize, trackWidth]);

  // Drawing handlers with denoising
  // Only add a new point if it's at least 3px from the last point
  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Start a new line with the initial point
    setLines((prev) => [...prev, [{ x, y }]]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLines((prev) => {
      const newLines = [...prev];
      const currentLine = newLines[newLines.length - 1];
      // Only add the point if it's far enough from the last point
      if (
        currentLine.length === 0 ||
        getDistance(currentLine[currentLine.length - 1], { x, y }) >= 3
      ) {
        newLines[newLines.length - 1] = [...currentLine, { x, y }];
      }
      return newLines;
    });
  };

  // On mouse up, filter out any remaining close points for a clean result
  const handleMouseUp = () => {
    setDrawing(false);
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const newLines = [...prev];
      // Filter the last drawn line to remove close points
      newLines[newLines.length - 1] = filterClosePoints(
        newLines[newLines.length - 1],
        3 // threshold in pixels
      );
      // After filtering, compute the length of the last line and update track length
      if (onTrackLengthChange) {
        const lastLine = newLines[newLines.length - 1];
        // --- SCALE: 1 pixel = 2 meters (500px = 1km) ---
        const lengthPixels = getLineLength(lastLine);
        const lengthKm = (lengthPixels * 2) / 1000; // Convert to km
        onTrackLengthChange(Number(lengthKm.toFixed(3))); // Round to 3 decimals
      }
      return newLines;
    });
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
};

export default CanvasDrawPaper;
