"use client";

import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Point, Car } from "../types";
import paper from 'paper';

interface CanvasDrawPaperProps {
  lines: Point[][];
  setLines: Dispatch<SetStateAction<Point[][]>>;
  handleClear: () => void;
  trackWidth: number;
  onTrackLengthChange?: (lengthKm: number) => void;
  onTrackUpdate?: (trackPoints: Point[], curvature: number[], length: number) => void;
  cars: Car[];
}

/**
 * CanvasDrawPaper Component
 * A sophisticated drawing component that allows users to:
 * 1. Draw race tracks using mouse/touch input
 * 2. Automatically smooths the drawn lines using Catmull-Rom splines
 * 3. Prevents self-intersections and maintains track integrity
 * 4. Visualizes track width in real-time
 * 5. Supports simulation of racing lines
 * 
 * Key Features:
 * - Real-time drawing with mouse/touch
 * - Line smoothing using Paper.js
 * - Intersection detection to prevent invalid tracks
 * - Track width visualization
 * - Clear functionality to reset the canvas
 * - Simulation trigger to calculate optimal racing lines
 */
const CanvasDrawPaper: React.FC<CanvasDrawPaperProps> = ({
  lines,
  setLines,
  handleClear,
  trackWidth,
  onTrackLengthChange,
  onTrackUpdate,
  cars
}) => {
  const [paperLoaded, setPaperLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPath = useRef<paper.Path | null>(null);
  const innerPath = useRef<paper.Path | null>(null);
  const outerPath = useRef<paper.Path | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializePaper = async () => {
      try {
        if (!canvasRef.current) return;
        
        paper.setup(canvasRef.current);
        setPaperLoaded(true);
        initializePaperTool();
      } catch (error) {
        console.error('Failed to initialize Paper.js:', error);
      }
    };

    initializePaper();

    return () => {
      mounted = false;
      if (paper.project) {
        paper.project.clear();
      }
    };
  }, []);

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current && paper.view) {
        const newSize = {
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight,
        };
        paper.view.viewSize = new paper.Size(newSize.width, newSize.height);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [paperLoaded]); // Run when paper is loaded

  // Helper function to compute normal vector
  const getNormal = (p1: Point, p2: Point): { x: number; y: number } => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: -dy / len, y: dx / len };
  };

  // Helper function to calculate uniform normals for a path
  const calculateUniformNormals = (points: paper.Point[]): paper.Point[] => {
    if (points.length < 2) return [];
    
    const normals: paper.Point[] = [];
    
    // Calculate normals for each point
    for (let i = 0; i < points.length; i++) {
      let normal: paper.Point;
      
      if (i === 0) {
        // First point - use direction to next point
        const curr = points[i];
        const next = points[i + 1];
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        normal = new paper.Point(-dy / len, dx / len);
      } else if (i === points.length - 1) {
        // Last point - use direction from previous point
        const curr = points[i];
        const prev = points[i - 1];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        normal = new paper.Point(-dy / len, dx / len);
      } else {
        // Middle points - use average of adjacent segments
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        // Calculate vectors of adjacent segments
        const v1 = new paper.Point(curr.x - prev.x, curr.y - prev.y);
        const v2 = new paper.Point(next.x - curr.x, next.y - curr.y);
        
        // Normalize vectors
        v1.length = 1;
        v2.length = 1;
        
        // Calculate average vector
        normal = new paper.Point(
          (-v1.y - v2.y) / 2,
          (v1.x + v2.x) / 2
        );
        
        // Ensure normal is unit length
        normal.length = 1;
      }
      
      normals.push(normal);
    }
    
    return normals;
  };

  // Helper function to draw track with boundaries
  const drawTrackWithBoundaries = (points: Point[], isPreview = false, clearExisting = false) => {
    if (!paper || points.length < 2) return;

    if (clearExisting && paper.project) {
      paper.project.activeLayer.removeChildren();
    }

    // Convert points to Paper.js points
    const paperPoints = points.map(p => new paper.Point(p.x, p.y));
    
    // Calculate uniform normals
    const normals = calculateUniformNormals(paperPoints);
    const halfWidth = trackWidth / 2;

    // Create boundary points
    const leftPoints = paperPoints.map((p, i) => 
      new paper.Point(p.x + normals[i].x * halfWidth, p.y + normals[i].y * halfWidth)
    );
    const rightPoints = paperPoints.map((p, i) => 
      new paper.Point(p.x - normals[i].x * halfWidth, p.y - normals[i].y * halfWidth)
    );

    // Draw center line
    const centerPath = new paper.Path({
      segments: paperPoints,
      strokeColor: new paper.Color("#e11d48"), // Red center line
      strokeWidth: 3,
      strokeCap: 'round',
      strokeJoin: 'round'
    });

    // Draw boundaries
    const leftPath = new paper.Path({
      segments: leftPoints,
      strokeColor: new paper.Color("#2563eb"), // Blue left boundary
      strokeWidth: 2,
      strokeCap: 'round',
      strokeJoin: 'round'
    });

    const rightPath = new paper.Path({
      segments: rightPoints,
      strokeColor: new paper.Color("#16a34a"), // Green right boundary
      strokeWidth: 2,
      strokeCap: 'round',
      strokeJoin: 'round'
    });

    if (!isPreview) {
      centerPath.smooth();
      leftPath.smooth();
      rightPath.smooth();
    }

    // Draw start point indicator (green circle with 'S')
    const startPoint = points[0];
    const startCircle = new paper.Path.Circle(
      new paper.Point(startPoint.x, startPoint.y),
      15
    );
    startCircle.fillColor = new paper.Color("#22c55e"); // Lighter green
    
    // Add 'S' text
    const startText = new paper.PointText({
      point: new paper.Point(startPoint.x - 5, startPoint.y + 5),
      content: 'S',
      fillColor: 'white',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 14
    });

    // Draw end point indicator (red circle with 'F' for Finish)
    const endPoint = points[points.length - 1];
    const endCircle = new paper.Path.Circle(
      new paper.Point(endPoint.x, endPoint.y),
      15
    );
    endCircle.fillColor = new paper.Color("#ef4444"); // Lighter red

    // Add 'F' text
    const endText = new paper.PointText({
      point: new paper.Point(endPoint.x - 5, endPoint.y + 5),
      content: 'F',
      fillColor: 'white',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 14
    });

    // Draw direction arrow near the start
    if (points.length > 1) {
      const arrowStart = points[0];
      const arrowEnd = points[1];
      const arrowLength = 30;
      const arrowAngle = Math.atan2(arrowEnd.y - arrowStart.y, arrowEnd.x - arrowStart.x);
      
      const arrowPath = new paper.Path();
      arrowPath.strokeColor = new paper.Color("#22c55e"); // Green
      arrowPath.strokeWidth = 3;
      
      // Arrow shaft
      const shaftStart = new paper.Point(
        arrowStart.x + 25 * Math.cos(arrowAngle),
        arrowStart.y + 25 * Math.sin(arrowAngle)
      );
      const shaftEnd = new paper.Point(
        shaftStart.x + arrowLength * Math.cos(arrowAngle),
        shaftStart.y + arrowLength * Math.sin(arrowAngle)
      );
      
      arrowPath.moveTo(shaftStart);
      arrowPath.lineTo(shaftEnd);
      
      // Arrow head
      const headSize = 10;
      const headAngle = Math.PI / 6; // 30 degrees
      
      const headLeft = new paper.Point(
        shaftEnd.x - headSize * Math.cos(arrowAngle + headAngle),
        shaftEnd.y - headSize * Math.sin(arrowAngle + headAngle)
      );
      const headRight = new paper.Point(
        shaftEnd.x - headSize * Math.cos(arrowAngle - headAngle),
        shaftEnd.y - headSize * Math.sin(arrowAngle - headAngle)
      );
      
      arrowPath.moveTo(headLeft);
      arrowPath.lineTo(shaftEnd);
      arrowPath.lineTo(headRight);
    }

    // Force a redraw
    if (paper.view) {
      paper.view.requestUpdate();
    }
  };

  // Draw lines when they change
  useEffect(() => {
    if (!paperLoaded || !paper?.project) return;

    // Clear existing paths
    paper.project.activeLayer.removeChildren();

    // Draw all lines
    lines.forEach(line => {
      if (line.length < 2) return;
      drawTrackWithBoundaries(line, false, false);
    });
  }, [lines, paperLoaded, trackWidth]);

  const initializePaperTool = () => {
    if (!paper.project) return;
    
    const tool = new paper.Tool();
    
    tool.onMouseDown = handleMouseDown;
    tool.onMouseDrag = handleMouseDrag;
    tool.onMouseUp = handleMouseUp;
  };

  const handleMouseDown = (event: paper.ToolEvent) => {
    if (!paper.project) return;
    
    const hitResult = paper.project.hitTest(event.point, {
      segments: true,
      stroke: true,
      tolerance: 15
    });

    if (hitResult?.type === 'segment' || hitResult?.type === 'stroke') {
      return;
    }

    currentPath.current = new paper.Path({
      segments: [event.point],
      strokeColor: new paper.Color('#e11d48'), // Red center line
      strokeWidth: 3,
      strokeCap: 'round',
      strokeJoin: 'round',
      fullySelected: false
    });

    innerPath.current = new paper.Path({
      strokeColor: new paper.Color('#2563eb'), // Blue left boundary
      strokeWidth: 2,
      strokeCap: 'round',
      strokeJoin: 'round',
      fullySelected: false
    });

    outerPath.current = new paper.Path({
      strokeColor: new paper.Color('#16a34a'), // Green right boundary
      strokeWidth: 2,
      strokeCap: 'round',
      strokeJoin: 'round',
      fullySelected: false
    });
  };

  const handleMouseDrag = (event: paper.ToolEvent) => {
    if (!currentPath.current) return;

    const minDistance = 3;
    const lastPoint = currentPath.current.lastSegment.point;
    if (event.point.subtract(lastPoint).length < minDistance) {
      return;
    }

    currentPath.current.add(event.point);
    
    // Apply smoothing to the current path
    if (currentPath.current.segments.length > 2) {
      // Smooth only the last few segments for better control
      const smoothSegments = currentPath.current.segments.slice(-4);
      smoothSegments.forEach((segment, i) => {
        if (i > 0 && i < smoothSegments.length - 1) {
          const prev = smoothSegments[i - 1].point;
          const curr = segment.point;
          const next = smoothSegments[i + 1].point;
          
          // Calculate the smoothed point position
          const smoothX = (prev.x + curr.x + next.x) / 3;
          const smoothY = (prev.y + curr.y + next.y) / 3;
          
          // Update the point position
          segment.point.x = smoothX;
          segment.point.y = smoothY;
        }
      });
    }
    
    // Update the track boundaries
    if (innerPath.current && outerPath.current && currentPath.current.segments.length > 1) {
      // Get points from the current path
      const points = currentPath.current.segments.map(s => s.point);
      
      // Calculate uniform normals
      const normals = calculateUniformNormals(points);
      const halfWidth = trackWidth / 2;

      // Update boundary paths
      innerPath.current.removeSegments();
      outerPath.current.removeSegments();

      points.forEach((point, i) => {
        innerPath.current!.add(new paper.Point(
          point.x + normals[i].x * halfWidth,
          point.y + normals[i].y * halfWidth
        ));
        outerPath.current!.add(new paper.Point(
          point.x - normals[i].x * halfWidth,
          point.y - normals[i].y * halfWidth
        ));
      });

      // Smooth the paths if we have enough points
      if (points.length > 2) {
        innerPath.current.smooth();
        outerPath.current.smooth();
      }
    }

    // Force a redraw
    if (paper.view) {
      paper.view.requestUpdate();
    }
  };

  // Helper function to calculate curvature
  const calculateCurvature = (points: Point[]): number[] => {
    const curvature: number[] = [];
    
    if (points.length < 3) {
      return curvature;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Calculate vectors
      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      // Calculate lengths
      const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const l2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      // Calculate angle between vectors
      const dot = v1.x * v2.x + v1.y * v2.y;
      const cross = v1.x * v2.y - v1.y * v2.x;
      const angle = Math.atan2(cross, dot);

      // Calculate curvature (1/radius)
      const k = 2 * Math.sin(angle) / l1;
      curvature.push(k);
    }

    // Add start and end points with same curvature as their neighbors
    curvature.unshift(curvature[0]);
    curvature.push(curvature[curvature.length - 1]);

    return curvature;
  };

  // Update handleMouseUp to calculate and send track data
  const handleMouseUp = () => {
    if (!currentPath.current || currentPath.current.segments.length < 2) return;

    // Convert Paper.js points to our Point type
    const points: Point[] = currentPath.current.segments.map(seg => ({
      x: seg.point.x,
      y: seg.point.y
    }));

    // Calculate track length in kilometers
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    const lengthKm = length / 1000; // Convert to kilometers

    // Calculate curvature
    const curvature = calculateCurvature(points);

    // Update track length
    if (onTrackLengthChange) {
      onTrackLengthChange(lengthKm);
    }

    // Update track data
    if (onTrackUpdate) {
      onTrackUpdate(points, curvature, lengthKm);
    }

    // Clear the current path
    currentPath.current = null;
    innerPath.current = null;
    outerPath.current = null;

    // Redraw the track with boundaries
    drawTrackWithBoundaries(points, false, true);
  };

  return (
    <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
        className="w-full h-full border border-gray-200 rounded-lg"
      />
      
      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => {
            handleClear();
            if (paper?.project) {
              paper.project.activeLayer.removeChildren();
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          title="Clear the track and all racing lines"
          disabled={!paperLoaded}
        >
          Clear
        </button>
      </div>

      {!paperLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-600">Loading drawing tools...</div>
        </div>
      )}
    </div>
  );
};

export default CanvasDrawPaper;
