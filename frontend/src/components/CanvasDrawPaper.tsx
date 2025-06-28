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

  // Helper: Check if a point is near a line segment
  function isPointNearLineSegment(point: Point, start: Point, end: Point, threshold = 10): boolean {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < threshold;
  }

  // Helper: Check if a point would create self-intersection in the current line
  function wouldCreateSelfIntersection(point: Point, currentLine: Point[]): boolean {
    if (currentLine.length < 3) return false;

    // Only check against segments that are not immediately connected
    // This allows for more natural curves while still preventing clear self-intersections
    for (let i = 0; i < currentLine.length - 3; i++) {
      if (isPointNearLineSegment(point, currentLine[i], currentLine[i + 1], 8)) {
        return true;
      }
    }

    return false;
  }

  // Helper: Check if a point is near any existing line
  function isPointNearExisting(point: Point, existingLines: Point[][], threshold = 10): boolean {
    for (const line of existingLines) {
      // Check distance to each point
      for (const pt of line) {
        const dist = Math.hypot(point.x - pt.x, point.y - pt.y);
        if (dist < threshold) {
          return true;
        }
      }

      // Check distance to line segments
      for (let i = 1; i < line.length; i++) {
        if (isPointNearLineSegment(point, line[i-1], line[i], threshold)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper: Check if two line segments intersect
  function doSegmentsIntersect(
    a1: Point, a2: Point,
    b1: Point, b2: Point,
    threshold = 10,
    isCheckingCurve = false
  ): boolean {
    // For curves, we use a more lenient threshold and only check actual intersections
    if (isCheckingCurve) {
      // Calculate the actual intersection
      const denominator = ((b2.y - b1.y) * (a2.x - a1.x)) - ((b2.x - b1.x) * (a2.y - a1.y));
      if (Math.abs(denominator) < 1e-8) return false; // Parallel lines are ok for curves

      const ua = (((b2.x - b1.x) * (a1.y - b1.y)) - ((b2.y - b1.y) * (a1.x - b1.x))) / denominator;
      const ub = (((a2.x - a1.x) * (a1.y - b1.y)) - ((a2.y - a1.y) * (a1.x - b1.x))) / denominator;

      // Only return true for actual intersections
      return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }

    // For non-curve checks (different lines), use the full proximity check
    const minX = Math.min(a1.x, a2.x) - threshold;
    const maxX = Math.max(a1.x, a2.x) + threshold;
    const minY = Math.min(a1.y, a2.y) - threshold;
    const maxY = Math.max(a1.y, a2.y) + threshold;

    // Quick rejection test
    if (Math.max(b1.x, b2.x) < minX || Math.min(b1.x, b2.x) > maxX ||
        Math.max(b1.y, b2.y) < minY || Math.min(b1.y, b2.y) > maxY) {
      return false;
    }

    // Calculate intersection
    const denominator = ((b2.y - b1.y) * (a2.x - a1.x)) - ((b2.x - b1.x) * (a2.y - a1.y));
    if (Math.abs(denominator) < 1e-8) {
      // Lines are parallel, check if they overlap
      const d = Math.abs((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) /
                Math.sqrt((b2.x - b1.x) * (b2.x - b1.x) + (b2.y - b1.y) * (b2.y - b1.y));
      return d < threshold;
    }

    const ua = (((b2.x - b1.x) * (a1.y - b1.y)) - ((b2.y - b1.y) * (a1.x - b1.x))) / denominator;
    const ub = (((a2.x - a1.x) * (a1.y - b1.y)) - ((a2.y - a1.y) * (a1.x - b1.x))) / denominator;

    // Check if segments intersect or are very close
    if ((ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1)) {
      return true;
    }

    // Check endpoints
    const distA1B1 = Math.hypot(a1.x - b1.x, a1.y - b1.y);
    const distA1B2 = Math.hypot(a1.x - b2.x, a1.y - b2.y);
    const distA2B1 = Math.hypot(a2.x - b1.x, a2.y - b1.y);
    const distA2B2 = Math.hypot(a2.x - b2.x, a2.y - b2.y);

    return Math.min(distA1B1, distA1B2, distA2B1, distA2B2) < threshold;
  }

  // Helper: Check if a line segment intersects with any existing line
  function doesLineIntersectWithAny(start: Point, end: Point, lines: Point[][]): boolean {
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        if (doSegmentsIntersect(start, end, line[i-1], line[i])) {
          return true;
        }
      }
    }
    return false;
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

  // Drawing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoint = { x, y };

    // Check if the point would be too close to any existing line or point
    if (isPointNearExisting(newPoint, lines)) {
      return; // Don't allow starting a line here
    }

    setDrawing(true);
    setLines((prev) => [...prev, [newPoint]]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoint = { x, y };

    setLines((prev) => {
      const newLines = [...prev];
      const currentLine = newLines[newLines.length - 1];
      
      // If this is the first point or far enough from last point
      if (currentLine.length === 0 || getDistance(currentLine[currentLine.length - 1], newPoint) >= 3) {
        const lastPoint = currentLine.length > 0 ? currentLine[currentLine.length - 1] : newPoint;
        
        // Check intersection with other lines (strict check)
        const otherLines = prev.slice(0, -1);
        let intersectsOthers = false;
        for (const line of otherLines) {
          for (let i = 1; i < line.length; i++) {
            if (doSegmentsIntersect(lastPoint, newPoint, line[i-1], line[i], 10, false)) {
              intersectsOthers = true;
              break;
            }
          }
          if (intersectsOthers) break;
        }

        // More lenient self-intersection check for curves
        let selfIntersects = false;
        if (currentLine.length > 3) {
          // Only check against non-adjacent segments
          for (let i = 0; i < currentLine.length - 3; i++) {
            if (doSegmentsIntersect(
              lastPoint, newPoint,
              currentLine[i], currentLine[i + 1],
              10, true // Use curve-specific intersection check
            )) {
              selfIntersects = true;
              break;
            }
          }
        }

        // Add point if no strict intersections with other lines
        // and no actual self-intersections (allowing curves)
        if (!intersectsOthers && !selfIntersects) {
          newLines[newLines.length - 1] = [...currentLine, newPoint];
        }
      }
      return newLines;
    });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    
    setDrawing(false);
    
    // Validate the final line
    setLines((prev) => {
      const currentLine = prev[prev.length - 1];
      // Remove lines that are too short
      if (currentLine.length < 2) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Update track length if needed
    if (onTrackLengthChange && lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      const lengthPixels = getLineLength(lastLine);
      const lengthKm = (lengthPixels * 2) / 1000;
      onTrackLengthChange(Number(lengthKm.toFixed(3)));
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
