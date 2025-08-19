"use client";

import React, {
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
import { Point, Car, Track } from "../types";
import paper from "paper";

interface SimulationResult {
  car_id: string;
  coordinates: number[][];
  speeds: number[];
  lap_time: number;
}

interface CarPosition {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface CanvasDrawPaperProps {
  lines: Point[][];
  setLines: Dispatch<SetStateAction<Point[][]>>;
  handleClear: () => void;
  trackWidth: number;
  onTrackLengthChange?: (lengthKm: number) => void;
  onTrackUpdate?: (
    trackPoints: Point[],
    curvature: number[],
    length: number
  ) => void;
  cars: Car[];
  simulationResults?: SimulationResult[];
  onSimulationResults?: (results: SimulationResult[]) => void;
  selectedModel: string;
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
  cars,
  simulationResults,
  onSimulationResults,
  selectedModel,
}) => {
  // Add scaling factor to convert meters to pixels
  const METERS_TO_PIXELS = 2; // 1 meter = 2 pixels (reduced from 5)
  const [paperLoaded, setPaperLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPath = useRef<paper.Path | null>(null);
  const innerPath = useRef<paper.Path | null>(null);
  const outerPath = useRef<paper.Path | null>(null);
  const [carPositions, setCarPositions] = useState<Record<string, CarPosition>>(
    {}
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const animationStartTime = useRef<number | null>(null);
  const animationProgress = useRef<number>(0);
  const carPositionsRef = useRef<Record<string, CarPosition>>({});
  // Add a flag to prevent useEffect interference during track creation
  const [isDrawingTrack, setIsDrawingTrack] = useState(false);
  // Add internal state to track if we have a track (independent of parent's lines state)
  const [hasTrack, setHasTrack] = useState(false);

  // Track the source of the current track to prevent redundant operations
  const lastTrackSource = useRef<"none" | "custom" | "preset">("none");
  const lastTrackHash = useRef<string>("");

  // Zoom state management
  const [zoomLevel, setZoomLevel] = useState(1.8); // Start with current default
  const minZoom = 0.1;
  const maxZoom = 10.0;
  const zoomStep = 0.2;

  useEffect(() => {
    let mounted = true;

    // experimental from gpt
    const initializePaper = async () => {
      if (!canvasRef.current) {
        if (mounted) {
          console.error("Canvas reference not available");
        }
        return;
      }

      try {
        // Clean up any existing Paper.js setup
        if (paper.project) {
          paper.project.clear();
        }

        const canvas = canvasRef.current;

        // Force internal resolution to match visual size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // NOW setup Paper.js
        paper.setup(canvas);

        // Set zoom and optionally center
        paper.view.zoom = zoomLevel;
        paper.view.center = paper.view.bounds.center;

        if (mounted) {
          setPaperLoaded(true);
          initializePaperTool();
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to initialize Paper.js:", error);
          setPaperLoaded(false);
        }
      }
    };
    // experimental from gpt

    initializePaper();

    return () => {
      mounted = false;
      if (paper.project) {
        paper.project.clear();
      }
      // Clean up any ongoing animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Only run on mount

  // Separate effect for handling resize
  useEffect(() => {
    const updateSize = () => {
      if (!canvasRef.current || !paper.view || !paperLoaded) return;

      const newSize = {
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      };
      paper.view.viewSize = new paper.Size(newSize.width, newSize.height);
    };

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [paperLoaded]);

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
        normal = new paper.Point((-v1.y - v2.y) / 2, (v1.x + v2.x) / 2);

        // Ensure normal is unit length
        normal.length = 1;
      }

      normals.push(normal);
    }

    return normals;
  };

  // Helper function to draw start/finish markers
  const drawStartFinishMarkers = (points: Point[]) => {
    if (!paper?.project || points.length < 2) return;

    // Draw start point indicator (bright green circle with 'S')
    const startPoint = points[0];
    const startCircle = new paper.Path.Circle(
      new paper.Point(startPoint.x, startPoint.y),
      18
    );
    startCircle.fillColor = new paper.Color("#00ff00"); // Bright green
    startCircle.strokeColor = new paper.Color("#000000"); // Black border
    startCircle.strokeWidth = 3;
    startCircle.data = { type: "start_finish", subtype: "start" };

    // Add 'S' text
    const startText = new paper.PointText({
      point: new paper.Point(startPoint.x - 6, startPoint.y + 6),
      content: "S",
      fillColor: "#000000", // Black text for contrast
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: 16,
      data: { type: "start_finish", subtype: "start_text" },
    });

    // Draw end point indicator (bright red circle with 'F' for Finish)
    const endPoint = points[points.length - 1];
    const endCircle = new paper.Path.Circle(
      new paper.Point(endPoint.x, endPoint.y),
      18
    );
    endCircle.fillColor = new paper.Color("#ff0000"); // Bright red
    endCircle.strokeColor = new paper.Color("#000000"); // Black border
    endCircle.strokeWidth = 3;
    endCircle.data = { type: "start_finish", subtype: "finish" };

    // Add 'F' text
    const endText = new paper.PointText({
      point: new paper.Point(endPoint.x - 6, endPoint.y + 6),
      content: "F",
      fillColor: "#000000", // Black text for contrast
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: 16,
      data: { type: "start_finish", subtype: "finish_text" },
    });

    // Draw direction arrow near the start
    if (points.length > 1) {
      const arrowStart = points[0];
      const arrowEnd = points[1];
      const arrowLength = 30;
      const arrowAngle = Math.atan2(
        arrowEnd.y - arrowStart.y,
        arrowEnd.x - arrowStart.x
      );

      const arrowPath = new paper.Path();
      arrowPath.strokeColor = new paper.Color("#00ff00"); // Bright green
      arrowPath.strokeWidth = 4;
      arrowPath.data = { type: "start_finish", subtype: "arrow" };

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

  // Helper function to draw track with boundaries
  const drawTrackWithBoundaries = (
    points: Point[],
    isPreview = false,
    clearExisting = false,
    isCircuit = false
  ) => {
    console.log(
      `[drawTrackWithBoundaries] Drawing track with ${points.length} points, isPreview: ${isPreview}, clearExisting: ${clearExisting}`
    );

    if (!paper) {
      console.warn("[drawTrackWithBoundaries] Paper.js not initialized");
      return;
    }

    if (!paper.project) {
      console.warn("[drawTrackWithBoundaries] Paper.js project not available");
      return;
    }

    if (!Array.isArray(points)) {
      console.warn("[drawTrackWithBoundaries] Invalid points array");
      return;
    }

    if (points.length < 2) {
      console.warn(
        `[drawTrackWithBoundaries] Not enough points to draw track (${points.length})`
      );
      return;
    }

    if (clearExisting && paper.project) {
      paper.project.activeLayer.removeChildren();
    }

    // Convert points to Paper.js points
    const paperPoints = points.map((p) => new paper.Point(p.x, p.y));

    // Calculate uniform normals
    const normals = calculateUniformNormals(paperPoints);
    const halfWidth = (trackWidth * METERS_TO_PIXELS) / 2; // Scale track width to pixels

    // Create boundary points
    const leftPoints = paperPoints.map(
      (p, i) =>
        new paper.Point(
          p.x + normals[i].x * halfWidth,
          p.y + normals[i].y * halfWidth
        )
    );
    const rightPoints = paperPoints.map(
      (p, i) =>
        new paper.Point(
          p.x - normals[i].x * halfWidth,
          p.y - normals[i].y * halfWidth
        )
    );

    // Draw center line (same color as custom tracks)
    const centerPath = new paper.Path({
      segments: paperPoints,
      strokeColor: new paper.Color("#666666"), // Gray center line (matches custom tracks)
      strokeWidth: 3,
      strokeCap: "round",
      strokeJoin: "round",
      data: { type: "track", subtype: "center" },
    });

    // Draw boundaries (same color as custom tracks)
    const leftPath = new paper.Path({
      segments: leftPoints,
      strokeColor: new paper.Color("#333333"), // Dark gray left boundary (matches custom tracks)
      strokeWidth: 2,
      strokeCap: "round",
      strokeJoin: "round",
      data: { type: "track", subtype: "left" },
    });

    const rightPath = new paper.Path({
      segments: rightPoints,
      strokeColor: new paper.Color("#333333"), // Dark gray right boundary (matches custom tracks)
      strokeWidth: 2,
      strokeCap: "round",
      strokeJoin: "round",
      data: { type: "track", subtype: "right" },
    });

    // Close paths for circuit tracks (F1 circuits)
    if (isCircuit) {
      centerPath.closePath();
      leftPath.closePath();
      rightPath.closePath();
    }

    if (!isPreview) {
      centerPath.smooth();
      leftPath.smooth();
      rightPath.smooth();
    }

    // Draw start/finish indicators (subtle colors to match track theme)
    if (isCircuit) {
      // For circuits, show single start/finish line
      const startPoint = points[0];
      const startCircle = new paper.Path.Circle(
        new paper.Point(startPoint.x, startPoint.y),
        18
      );
      startCircle.fillColor = new paper.Color("#888888"); // Subtle gray for start/finish
      startCircle.strokeColor = new paper.Color("#333333"); // Dark gray border
      startCircle.strokeWidth = 2;
      startCircle.data = { type: "start_finish", subtype: "circuit" };

      // Add 'S/F' text for start/finish line
      const startText = new paper.PointText({
        point: new paper.Point(startPoint.x - 10, startPoint.y + 4),
        content: "S/F",
        fillColor: "#ffffff", // White text for contrast
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: 11,
        data: { type: "start_finish", subtype: "circuit_text" },
      });
    } else {
      // For open tracks, show separate start and finish points
      // Draw start point indicator
      const startPoint = points[0];
      const startCircle = new paper.Path.Circle(
        new paper.Point(startPoint.x, startPoint.y),
        16
      );
      startCircle.fillColor = new paper.Color("#777777"); // Subtle gray
      startCircle.strokeColor = new paper.Color("#333333"); // Dark gray border
      startCircle.strokeWidth = 2;
      startCircle.data = { type: "start_finish", subtype: "start" };

      // Add 'S' text
      const startText = new paper.PointText({
        point: new paper.Point(startPoint.x - 5, startPoint.y + 5),
        content: "S",
        fillColor: "#ffffff", // White text for contrast
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: 14,
        data: { type: "start_finish", subtype: "start_text" },
      });

      // Draw end point indicator
      const endPoint = points[points.length - 1];
      const endCircle = new paper.Path.Circle(
        new paper.Point(endPoint.x, endPoint.y),
        16
      );
      endCircle.fillColor = new paper.Color("#555555"); // Darker gray for finish
      endCircle.strokeColor = new paper.Color("#333333"); // Dark gray border
      endCircle.strokeWidth = 2;
      endCircle.data = { type: "start_finish", subtype: "finish" };

      // Add 'F' text
      const endText = new paper.PointText({
        point: new paper.Point(endPoint.x - 5, endPoint.y + 5),
        content: "F",
        fillColor: "#ffffff", // White text for contrast
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: 14,
        data: { type: "start_finish", subtype: "finish_text" },
      });
    }

    // Draw direction arrow near the start
    if (points.length > 1) {
      const arrowStart = points[0];
      const arrowEnd = points[1];
      const arrowLength = 30;
      const arrowAngle = Math.atan2(
        arrowEnd.y - arrowStart.y,
        arrowEnd.x - arrowStart.x
      );

      const arrowPath = new paper.Path();
      arrowPath.strokeColor = new paper.Color("#00ff00"); // Bright green
      arrowPath.strokeWidth = 4;
      arrowPath.data = { type: "start_finish", subtype: "arrow" };

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

    console.log(
      `[drawTrackWithBoundaries] Track drawn successfully with ${points.length} points. Canvas children count:`,
      paper.project.activeLayer.children.length
    );
  };

  const initializePaperTool = () => {
    if (!paper.project) return;

    const tool = new paper.Tool();

    tool.onMouseDown = handleMouseDown;
    tool.onMouseDrag = handleMouseDrag;
    tool.onMouseUp = handleMouseUp;
  };

  const handleMouseDown = (event: paper.ToolEvent) => {
    if (!paper.project) return;

    console.log(
      "[handleMouseDown] Starting draw, current children:",
      paper.project.activeLayer.children.length
    );

    // Set flag to prevent useEffect interference
    setIsDrawingTrack(true);

    // Clear any existing track if we have one
    if (hasTrack) {
      console.log("[handleMouseDown] Clearing existing track");
      try {
        // Use more comprehensive clearing approach
        if (paper.project.activeLayer) {
          const existingTrackElements =
            paper.project.activeLayer.children.filter(
              (child) =>
                child.data?.type === "track_permanent" ||
                child.data?.type === "track" ||
                child.data?.type === "completion_preview" ||
                child.data?.subtype === "start_finish" ||
                child.data?.subtype === "center" ||
                child.data?.subtype === "left" ||
                child.data?.subtype === "right"
            );
          existingTrackElements.forEach((element) => element.remove());
          console.log(
            "[handleMouseDown] Removed",
            existingTrackElements.length,
            "existing track elements"
          );
        }
      } catch (error) {
        console.error(
          "[handleMouseDown] Error clearing existing track:",
          error
        );
        // Fallback: clear all children
        if (paper.project.activeLayer) {
          paper.project.activeLayer.removeChildren();
        }
      }
      setHasTrack(false);
    }

    const hitResult = paper.project.hitTest(event.point, {
      segments: true,
      stroke: true,
      tolerance: 15,
    });

    if (hitResult?.type === "segment" || hitResult?.type === "stroke") {
      return;
    }

    currentPath.current = new paper.Path({
      segments: [event.point],
      strokeColor: new paper.Color("#666666"), // Gray center line
      strokeWidth: 3,
      strokeCap: "round",
      strokeJoin: "round",
      fullySelected: false,
    });

    innerPath.current = new paper.Path({
      strokeColor: new paper.Color("#333333"), // Dark gray left boundary
      strokeWidth: 2,
      strokeCap: "round",
      strokeJoin: "round",
      fullySelected: false,
    });

    outerPath.current = new paper.Path({
      strokeColor: new paper.Color("#333333"), // Dark gray right boundary
      strokeWidth: 2,
      strokeCap: "round",
      strokeJoin: "round",
      fullySelected: false,
    });

    console.log(
      "[handleMouseDown] Created paths, total children:",
      paper.project.activeLayer.children.length
    );
  };

  const handleMouseDrag = (event: paper.ToolEvent) => {
    if (!currentPath.current) return;

    const minDistance = 3;
    const lastPoint = currentPath.current.lastSegment.point;
    if (event.point.subtract(lastPoint).length < minDistance) {
      return;
    }

    currentPath.current.add(event.point);

    // Every 10th point, log the canvas state
    if (currentPath.current.segments.length % 10 === 0) {
      console.log(
        "[handleMouseDrag] Canvas state at",
        currentPath.current.segments.length,
        "points:",
        {
          totalChildren: paper.project.activeLayer.children.length,
        }
      );
    }

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
    if (
      innerPath.current &&
      outerPath.current &&
      currentPath.current.segments.length > 1
    ) {
      // Get points from the current path
      const points = currentPath.current.segments.map((s) => s.point);

      // Calculate uniform normals
      const normals = calculateUniformNormals(points);
      const halfWidth = (trackWidth * METERS_TO_PIXELS) / 2; // Scale track width to pixels

      // Update boundary paths
      innerPath.current.removeSegments();
      outerPath.current.removeSegments();

      points.forEach((point, i) => {
        innerPath.current!.add(
          new paper.Point(
            point.x + normals[i].x * halfWidth,
            point.y + normals[i].y * halfWidth
          )
        );
        outerPath.current!.add(
          new paper.Point(
            point.x - normals[i].x * halfWidth,
            point.y - normals[i].y * halfWidth
          )
        );
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

  // Calculate curvature for a series of points
  const calculateCurvature = (points: Point[]): number[] => {
    if (!points || points.length < 3)
      return new Array(points?.length || 0).fill(0);

    const curvature: number[] = [];

    for (let i = 0; i < points.length; i++) {
      if (i === 0 || i === points.length - 1) {
        curvature.push(0);
        continue;
      }

      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Calculate vectors
      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };

      // Calculate vector lengths
      const l1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const l2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      if (l1 === 0 || l2 === 0) {
        curvature.push(0);
        continue;
      }

      // Calculate angle between vectors
      const dot = v1.x * v2.x + v1.y * v2.y;
      const cross = v1.x * v2.y - v1.y * v2.x;
      const angle = Math.atan2(cross, dot);

      // Calculate curvature as 1/radius
      const radius = (l1 + l2) / (2 * Math.sin(angle));
      curvature.push(Math.abs(angle) < 0.01 ? 0 : 1 / radius);
    }

    return curvature;
  };

  // Update handleMouseUp to calculate and send track data
  // Track closure functionality
  const closeTrackSmoothly = (points: Point[]): Point[] => {
    if (points.length < 3) return points;

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the gap is small, connect directly
    if (distance < 50) {
      return [...points, startPoint];
    }

    // For larger gaps, use cubic Bezier interpolation
    const numInterpolationPoints = Math.ceil(distance / 20);
    const interpolatedPoints: Point[] = [];

    // Calculate control points for smooth connection
    const secondPoint = points[1];
    const secondLastPoint = points[points.length - 2];

    // Direction vectors
    const startDir = {
      x: secondPoint.x - startPoint.x,
      y: secondPoint.y - startPoint.y,
    };
    const endDir = {
      x: endPoint.x - secondLastPoint.x,
      y: endPoint.y - secondLastPoint.y,
    };

    // Normalize directions
    const startDirLen =
      Math.sqrt(startDir.x * startDir.x + startDir.y * startDir.y) || 1;
    const endDirLen = Math.sqrt(endDir.x * endDir.x + endDir.y * endDir.y) || 1;

    startDir.x /= startDirLen;
    startDir.y /= startDirLen;
    endDir.x /= endDirLen;
    endDir.y /= endDirLen;

    // Control points for Bezier curve
    const controlDistance = distance * 0.3;
    const cp1 = {
      x: endPoint.x + endDir.x * controlDistance,
      y: endPoint.y + endDir.y * controlDistance,
    };
    const cp2 = {
      x: startPoint.x - startDir.x * controlDistance,
      y: startPoint.y - startDir.y * controlDistance,
    };

    // Generate interpolated points using cubic Bezier
    for (let i = 1; i <= numInterpolationPoints; i++) {
      const t = i / (numInterpolationPoints + 1);
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      const x =
        mt3 * endPoint.x +
        3 * mt2 * t * cp1.x +
        3 * mt * t2 * cp2.x +
        t3 * startPoint.x;
      const y =
        mt3 * endPoint.y +
        3 * mt2 * t * cp1.y +
        3 * mt * t2 * cp2.y +
        t3 * startPoint.y;

      interpolatedPoints.push({ x, y });
    }

    return [...points, ...interpolatedPoints, startPoint];
  };

  const handleMouseUp = () => {
    if (!currentPath.current || currentPath.current.segments.length < 2) return;

    console.log("[handleMouseUp] BEFORE - Canvas state:", {
      totalChildren: paper.project.activeLayer.children.length,
      currentPathVisible: currentPath.current.visible,
      currentPathSegments: currentPath.current.segments.length,
    });

    console.log(
      "[handleMouseUp] Starting track finalization with AUTO-COMPLETION"
    );

    // Get the points from the current path
    let points: Point[] = currentPath.current.segments.map((seg) => ({
      x: seg.point.x,
      y: seg.point.y,
    }));

    console.log(
      "[handleMouseUp] Extracted points before closure:",
      points.length
    );

    // AUTO-COMPLETE: Close the track to create a proper racing circuit
    if (points.length >= 3) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      console.log(
        "[handleMouseUp] Auto-completing track - gap distance:",
        distance.toFixed(2),
        "pixels"
      );

      // Show visual feedback for the completion
      if (distance > 10) {
        // Only show feedback if there's a meaningful gap
        // Create a temporary dashed line to show the completion
        const completionLine = new paper.Path();
        completionLine.add(new paper.Point(endPoint.x, endPoint.y));
        completionLine.add(new paper.Point(startPoint.x, startPoint.y));
        completionLine.strokeColor = new paper.Color("#888888");
        completionLine.strokeWidth = 2;
        completionLine.dashArray = [10, 5]; // Dashed line
        completionLine.opacity = 0.7;
        completionLine.data = { type: "completion_preview" };

        // Brief flash to show the completion
        setTimeout(() => {
          if (completionLine.parent) {
            completionLine.remove();
          }
        }, 500);
      }

      points = closeTrackSmoothly(points);
      console.log(
        "[handleMouseUp] Track auto-completed, final points:",
        points.length
      );

      // Update the current path to show the closed track
      currentPath.current.removeSegments();
      points.forEach((point) => {
        currentPath.current!.add(new paper.Point(point.x, point.y));
      });

      // Also update the boundary paths to be closed
      if (innerPath.current && outerPath.current) {
        // Clear existing boundary paths
        innerPath.current.removeSegments();
        outerPath.current.removeSegments();

        // Recalculate boundaries for the closed track
        const paperPoints = points.map((p) => new paper.Point(p.x, p.y));
        const normals = calculateUniformNormals(paperPoints);
        const halfWidth = (trackWidth * METERS_TO_PIXELS) / 2; // Use the same scaling as in drag

        // Create closed boundary paths
        paperPoints.forEach((point, i) => {
          const normal = normals[i];
          const innerPoint = point.add(normal.multiply(halfWidth));
          const outerPoint = point.subtract(normal.multiply(halfWidth));

          innerPath.current!.add(innerPoint);
          outerPath.current!.add(outerPoint);
        });

        // Smooth the completed boundary paths
        innerPath.current.smooth();
        outerPath.current.smooth();
      }
    }

    console.log(
      "[handleMouseUp] Extracted points after auto-completion:",
      points.length
    );

    // FIXED: Keep the boundary lines as the actual track, modify center line as guide
    if (currentPath.current) {
      // Make the center line a thin guide line
      currentPath.current.strokeColor = new paper.Color("#999999"); // Light gray
      currentPath.current.strokeWidth = 1; // Make it thinner as a guide
      currentPath.current.data = {
        type: "track_permanent",
        subtype: "center_guide",
      };

      console.log("[handleMouseUp] Made center path a guide line:", {
        visible: currentPath.current.visible,
        segments: currentPath.current.segments.length,
        strokeColor: currentPath.current.strokeColor.toString(),
        strokeWidth: currentPath.current.strokeWidth,
      });
    }

    // Add start/finish line marker
    if (points.length >= 2) {
      const startPoint = points[0];
      const secondPoint = points[1];

      // Calculate perpendicular direction for start/finish line
      const dx = secondPoint.x - startPoint.x;
      const dy = secondPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        // Normalize and rotate 90 degrees
        const perpX = -dy / length;
        const perpY = dx / length;

        // Create start/finish line across the track width
        const lineLength = trackWidth * METERS_TO_PIXELS * 0.8; // Slightly shorter than track width
        const startFinishLine = new paper.Path();
        startFinishLine.add(
          new paper.Point(
            startPoint.x + (perpX * lineLength) / 2,
            startPoint.y + (perpY * lineLength) / 2
          )
        );
        startFinishLine.add(
          new paper.Point(
            startPoint.x - (perpX * lineLength) / 2,
            startPoint.y - (perpY * lineLength) / 2
          )
        );
        startFinishLine.strokeColor = new paper.Color("#000000"); // Black
        startFinishLine.strokeWidth = 4;
        startFinishLine.data = {
          type: "track_permanent",
          subtype: "start_finish",
        };

        console.log("[handleMouseUp] Added start/finish line marker");
      }
    }

    // Keep the boundary paths as the actual track boundaries
    if (innerPath.current) {
      innerPath.current.strokeColor = new paper.Color("#222222"); // Dark gray
      innerPath.current.strokeWidth = 3; // Make boundaries thicker
      innerPath.current.data = {
        type: "track_permanent",
        subtype: "left_boundary",
      };
      console.log("[handleMouseUp] Made inner path permanent boundary");
    }

    if (outerPath.current) {
      outerPath.current.strokeColor = new paper.Color("#222222"); // Dark gray
      outerPath.current.strokeWidth = 3; // Make boundaries thicker
      outerPath.current.data = {
        type: "track_permanent",
        subtype: "right_boundary",
      };
      console.log("[handleMouseUp] Made outer path permanent boundary");
    }

    console.log(
      "[handleMouseUp] MIDDLE - Canvas state after making all paths permanent:",
      {
        totalChildren: paper.project.activeLayer.children.length,
      }
    );

    // Don't remove the boundary paths - they ARE the track!
    // Clear references but keep the paths
    innerPath.current = null;
    outerPath.current = null;
    // Keep currentPath.current reference since we're not removing it

    // Store track points internally for car positioning FIRST
    setInternalTrackPoints(points);
    console.log(
      "[handleMouseUp] Stored",
      points.length,
      "track points internally"
    );

    // Set hasTrack flag to indicate we now have a track
    setHasTrack(true);

    // Update tracking refs for custom track
    const customHash = createTrackHash(points);
    lastTrackHash.current = customHash;
    lastTrackSource.current = "custom";
    console.log("[handleMouseUp] Set hasTrack=true and marked as custom track");

    // Clear the drawing flag immediately since we're not updating state
    setIsDrawingTrack(false);

    // Now update parent state - the useEffect will recognize this as existing track
    console.log("[handleMouseUp] Updating parent with custom track points");
    setLines([points]);

    // Notify parent component about track update
    if (onTrackUpdate) {
      const length = calculateTrackLength(points);
      const curvature = calculateCurvature(points);
      onTrackUpdate(points, curvature, length);
    }

    console.log("[handleMouseUp] AFTER setLines:", {
      totalChildren: paper.project.activeLayer.children.length,
    });

    // Force redraw
    if (paper.view) {
      paper.view.requestUpdate();
    }

    console.log("[handleMouseUp] FINAL - Canvas state:", {
      totalChildren: paper.project.activeLayer.children.length,
      childrenTypes: paper.project.activeLayer.children.map(
        (child) => child.data?.type || "unknown"
      ),
      trackElements: paper.project.activeLayer.children
        .filter(
          (child) =>
            child.data?.type === "track_permanent" || child.data?.subtype
        )
        .map((child) => ({
          type: child.data?.type,
          subtype: child.data?.subtype,
          visible: child.visible,
          strokeColor: child.strokeColor?.toString(),
          strokeWidth: child.strokeWidth,
        })),
    });
  };

  // Helper function to calculate car angle
  const calculateCarAngle = (p1: number[], p2: number[]): number => {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  };

  // Store track points internally for car positioning
  const [internalTrackPoints, setInternalTrackPoints] = useState<Point[]>([]);

  // Effect to handle car positions when cars are added or removed
  useEffect(() => {
    console.log(
      "[Car Position useEffect] Triggered - paper:",
      !!paper,
      "paperLoaded:",
      paperLoaded,
      "hasTrack:",
      hasTrack,
      "trackPoints:",
      internalTrackPoints.length,
      "cars:",
      cars.length
    );

    if (
      !paper ||
      !paperLoaded ||
      !hasTrack ||
      internalTrackPoints.length === 0 ||
      !paper.project ||
      !paper.project.layers
    ) {
      console.log(
        "[Car Position useEffect] Early return - missing requirements"
      );
      return;
    }

    // Get the starting point from the internal track points
    const startPoint = internalTrackPoints[0];
    if (!startPoint) {
      console.log("[Car Position useEffect] No start point available");
      return;
    }

    console.log(
      "[Car Position useEffect] Initializing car positions, hasTrack:",
      hasTrack,
      "trackPoints:",
      internalTrackPoints.length
    );
    if (paper.project.layers && paper.project.layers[0]) {
      console.log(
        "[Car Position useEffect] Main layer children before car positioning:",
        paper.project.layers[0].children.length
      );
    }

    // Initialize positions for new cars
    setCarPositions((prevPositions) => {
      const newPositions: Record<string, CarPosition> = {};
      cars.forEach((car) => {
        if (!prevPositions[car.id]) {
          newPositions[car.id] = {
            x: startPoint.x,
            y: startPoint.y,
            angle: internalTrackPoints[1]
              ? calculateCarAngle(
                  [startPoint.x, startPoint.y],
                  [internalTrackPoints[1].x, internalTrackPoints[1].y]
                )
              : 0,
            speed: 0,
          };
          console.log(
            "[Car Position useEffect] Initialized car position for",
            car.id,
            "at",
            startPoint
          );
        } else {
          newPositions[car.id] = prevPositions[car.id];
        }
      });
      return newPositions;
    });
  }, [cars, hasTrack, internalTrackPoints, paperLoaded]); // Use internal track state instead of lines

  // Enhanced animation system with 60 FPS and realistic car movement
  const startAnimation = (results: any) => {
    if (!paper || !results?.optimal_lines) return;

    // Clear any existing car elements from the car layer only (NOT from main layer)
    const carLayer = paper.project.layers.find(
      (layer) => layer.data?.type === "car_layer"
    );
    if (carLayer) {
      carLayer.removeChildren();
      console.log(
        "[startAnimation] Cleared car layer, car layer children:",
        carLayer.children.length
      );
    }

    // Also clear any car elements that might be on the main layer (legacy cleanup)
    if (paper.project.layers && paper.project.layers[0]) {
      paper.project.layers[0].children
        .filter(
          (child) =>
            child.data?.type === "car" ||
            child.data?.type === "speed" ||
            child.data?.type === "smoke" ||
            child.data?.type === "racing_line"
        )
        .forEach((child) => child.remove());

      console.log(
        "[startAnimation] Main layer children after cleanup:",
        paper.project.layers[0].children.length
      );
    }

    // Draw the racing line path on the main layer (behind track)
    const originalLayer = paper.project.activeLayer;
    if (paper.project.layers && paper.project.layers[0]) {
      paper.project.layers[0].activate(); // Ensure racing line goes on main layer
    }

    results.optimal_lines.forEach((result: any) => {
      const { coordinates, car_id } = result;
      if (coordinates && coordinates.length > 1) {
        // Find the car to get its accent color
        const car = cars.find((c) => c.id === car_id);
        const racingLineColor = car?.accent_color || "#000000"; // Fallback to black if car not found

        const racingLinePath = new paper.Path({
          segments: coordinates.map(
            (coord: number[]) => new paper.Point(coord[0], coord[1])
          ),
          strokeColor: new paper.Color(racingLineColor), // Use car's accent color
          strokeWidth: 3, // Slightly thicker for better visibility
          strokeCap: "round",
          strokeJoin: "round",
          opacity: 0.8, // Slightly transparent so track is still visible
          data: { type: "racing_line", car_id: car_id },
        });
        racingLinePath.smooth();
        // Send racing line to back so it appears behind the track
        racingLinePath.sendToBack();

        console.log(
          `[Racing Line] Drew ${
            car?.team_name || car_id
          } racing line in ${racingLineColor}`
        );
      }
    });

    // Restore original layer
    originalLayer.activate();

    // Calculate physics-based animation timing for each car
    const carAnimationData = results.optimal_lines.map((result: any) => {
      const { car_id, coordinates, speeds, lap_time } = result;
      const totalPoints = coordinates.length;

      if (totalPoints < 2 || !speeds || speeds.length === 0) {
        return {
          car_id,
          cumulativeTimes: [],
          lapTimeMs: 18000,
          coordinates,
          speeds: [],
        };
      }

      // Calculate distance between consecutive points
      const distances = [];
      for (let i = 0; i < totalPoints - 1; i++) {
        const dx = coordinates[i + 1][0] - coordinates[i][0];
        const dy = coordinates[i + 1][1] - coordinates[i][1];
        distances.push(Math.sqrt(dx * dx + dy * dy));
      }
      // Close the loop - distance from last point back to first
      const dx = coordinates[0][0] - coordinates[totalPoints - 1][0];
      const dy = coordinates[0][1] - coordinates[totalPoints - 1][1];
      distances.push(Math.sqrt(dx * dx + dy * dy));

      // Calculate cumulative time for each segment based on speeds
      // Time for each segment = distance / speed
      const segmentTimes = [];
      const cumulativeTimes = [0]; // Start at time 0

      for (let i = 0; i < distances.length; i++) {
        const speed = speeds[i] || 10; // Fallback speed
        const segmentTime = distances[i] / speed; // time = distance / speed
        segmentTimes.push(segmentTime);
        cumulativeTimes.push(
          cumulativeTimes[cumulativeTimes.length - 1] + segmentTime
        );
      }

      // Use actual lap time from simulation, with fallback
      const lapTimeMs =
        (lap_time && lap_time > 0
          ? lap_time
          : cumulativeTimes[cumulativeTimes.length - 1]) * 1000;

      console.log(
        `🏎️ ${car_id}: Lap time ${(lapTimeMs / 1000).toFixed(
          2
        )}s, Speed range: ${Math.min(...speeds).toFixed(1)}-${Math.max(
          ...speeds
        ).toFixed(1)} m/s`
      );
      console.log(
        `🕒 Animation will use realistic timing: ${(lapTimeMs / 1000).toFixed(
          1
        )}s per lap (was 18s fixed)`
      );

      return {
        car_id,
        cumulativeTimes,
        lapTimeMs,
        coordinates,
        speeds,
      };
    });

    let startTime: number | null = null;
    let isRunning = true;

    const animate = (timestamp: number) => {
      if (!isRunning) return;

      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Update car positions based on actual physics timing
      const newPositions: Record<string, CarPosition> = {};

      carAnimationData.forEach((carData: any) => {
        const { car_id, cumulativeTimes, lapTimeMs, coordinates, speeds } =
          carData;
        const totalPoints = coordinates.length;

        if (totalPoints < 2) return;

        // Calculate current time position in the lap (with looping)
        const currentLapTime = elapsed % lapTimeMs;

        // Find which segment the car is currently in based on cumulative time
        let segmentIndex = 0;
        for (let i = 0; i < cumulativeTimes.length - 1; i++) {
          if (
            currentLapTime >= cumulativeTimes[i] * 1000 &&
            currentLapTime < cumulativeTimes[i + 1] * 1000
          ) {
            segmentIndex = i;
            break;
          }
        }

        // Handle wraparound to prevent index out of bounds
        const currentIndex = segmentIndex % totalPoints;
        const nextIndex = (segmentIndex + 1) % totalPoints;

        const currentPos = coordinates[currentIndex];
        const nextPos = coordinates[nextIndex];
        const currentSpeed = speeds[currentIndex] || 10;
        const nextSpeed = speeds[nextIndex] || currentSpeed;

        if (currentPos && nextPos) {
          // Calculate how far along this segment we are based on time
          const segmentStartTime = cumulativeTimes[segmentIndex] * 1000;
          const segmentEndTime = cumulativeTimes[segmentIndex + 1] * 1000;
          const segmentProgress =
            segmentEndTime > segmentStartTime
              ? (currentLapTime - segmentStartTime) /
                (segmentEndTime - segmentStartTime)
              : 0;

          // Clamp progress to [0, 1]
          const localProgress = Math.max(0, Math.min(1, segmentProgress));

          // Interpolate position
          const x =
            currentPos[0] + (nextPos[0] - currentPos[0]) * localProgress;
          const y =
            currentPos[1] + (nextPos[1] - currentPos[1]) * localProgress;

          // Interpolate speed
          const interpolatedSpeed =
            currentSpeed + (nextSpeed - currentSpeed) * localProgress;

          // Calculate car angle based on movement direction
          const deltaX = nextPos[0] - currentPos[0];
          const deltaY = nextPos[1] - currentPos[1];
          const angle = Math.atan2(deltaY, deltaX);

          newPositions[car_id] = {
            x,
            y,
            angle,
            speed: interpolatedSpeed,
          };
        }
      });

      // Update car positions (this will trigger redraw via useEffect)
      setCarPositions(newPositions);
      carPositionsRef.current = newPositions;

      // Update animation progress for progress bar based on first car's timing
      if (carAnimationData.length > 0) {
        const firstCarLapTime = carAnimationData[0].lapTimeMs;
        const progress = (elapsed % firstCarLapTime) / firstCarLapTime;
        animationProgress.current = progress;
      }

      if (isRunning) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Store the stop function
    animationRef.current = requestAnimationFrame(animate);

    // Return a function to stop the animation
    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clean up car elements from car layer
      if (paper && paper.project) {
        const carLayer = paper.project.layers.find(
          (layer) => layer.data?.type === "car_layer"
        );
        if (carLayer) {
          carLayer.removeChildren();
          console.log(
            "[startAnimation cleanup] Cleared car layer, car layer children:",
            carLayer.children.length
          );
        }

        // Also clean up any car elements from main layer (legacy cleanup)
        if (paper.project.layers && paper.project.layers[0]) {
          paper.project.layers[0].children
            .filter(
              (child) =>
                child.data?.type === "car" ||
                child.data?.type === "speed" ||
                child.data?.type === "smoke" ||
                child.data?.type === "racing_line"
            )
            .forEach((child) => child.remove());
          console.log(
            "[startAnimation cleanup] Main layer children after cleanup:",
            paper.project.layers[0].children.length
          );
        }
      }
    };
  };

  // Store the stop function
  const stopAnimationRef = useRef<(() => void) | null>(null);

  // Handle simulation and animation
  const handleAnimateClick = useCallback(async () => {
    console.log("Simulation/Animation button clicked");

    // If we're currently animating, stop it
    if (isAnimating) {
      console.log("Stopping animation");
      setIsAnimating(false);
      if (stopAnimationRef.current) {
        stopAnimationRef.current();
        stopAnimationRef.current = null;
      }
      // Clear all car-related elements from canvas (but NOT track elements)
      if (paper) {
        const carLayer = paper.project.layers.find(
          (layer) => layer.data?.type === "car_layer"
        );
        if (carLayer) {
          carLayer.removeChildren();
          console.log(
            "[handleAnimateClick] Cleared car layer, car layer children:",
            carLayer.children.length
          );
        }

        // Also clean up any car elements from main layer (legacy cleanup)
        if (paper.project.layers && paper.project.layers[0]) {
          paper.project.layers[0].children
            .filter(
              (child) =>
                child.data?.type === "car" ||
                child.data?.type === "speed" ||
                child.data?.type === "smoke" ||
                child.data?.type === "racing_line"
            )
            .forEach((child) => child.remove());
          console.log(
            "[handleAnimateClick] Main layer children after cleanup:",
            paper.project.layers[0].children.length
          );
        }
        paper.view.requestUpdate();
      }
      // Reset car positions
      setCarPositions({});
      return;
    }

    // Run simulation
    console.log("Starting new simulation");
    if (!internalTrackPoints || internalTrackPoints.length < 2) {
      console.error("No valid track to simulate");
      return;
    }

    if (!cars.length) {
      console.error("No cars to simulate");
      return;
    }

    setIsSimulating(true);
    try {
      const trackPoints = internalTrackPoints;
      const requestData = {
        track_points: trackPoints.map((p) => ({ x: p.x, y: p.y })),
        width: trackWidth,
        friction: 0.7,
        cars: cars,
        model: selectedModel,
      };

      console.log("Sending simulation request:", requestData);

      const response = await fetch("http://localhost:8000/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("Received response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Simulation failed:", errorText);
        throw new Error(
          `Simulation failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Raw simulation results:", data);

      if (onSimulationResults && data.optimal_lines) {
        // Process the simulation results
        const processedResults = data.optimal_lines.map((line: any) => ({
          car_id: line.car_id,
          coordinates: line.coordinates,
          speeds: line.speeds,
          lap_time: line.lap_time,
          model: selectedModel, // Add the model used for this simulation
        }));
        console.log("Processed simulation results:", processedResults);
        onSimulationResults(processedResults);
      }

      // Start animation with the results
      setIsAnimating(true);
      const stopAnimation = startAnimation(data);
      stopAnimationRef.current = stopAnimation || null;
    } catch (error) {
      console.error("Error during simulation:", error);
    } finally {
      setIsSimulating(false);
    }
  }, [
    isAnimating,
    internalTrackPoints,
    cars,
    trackWidth,
    selectedModel,
    onSimulationResults,
    paper,
  ]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Create realistic F1 car with proper proportions and features
  const createF1Car = (position: CarPosition, car: Car) => {
    const carLength = 19; // F1 car length in pixels (scaled from ~5m)
    const carWidth = 4.4; // F1 car width in pixels (scaled from ~2m)

    // Get car colors
    const primaryColor = car.car_color || "#e11d48";
    const accentColor = car.accent_color || "#ffffff";
    const tireColor =
      car.tire_compound === "soft"
        ? "#ff0000"
        : car.tire_compound === "medium"
        ? "#ffff00"
        : "#ffffff";

    // Create shadow first (behind car)
    const shadowOffset = 0.3;
    const carShadow = new paper.Path();

    // F1 car body outline (shadow)
    carShadow.add(
      new paper.Point(
        position.x + carLength / 2 + shadowOffset,
        position.y + shadowOffset
      )
    ); // Sharp nose
    carShadow.add(
      new paper.Point(
        position.x + carLength / 3 + shadowOffset,
        position.y + carWidth / 4 + shadowOffset
      )
    ); // Nose widening
    carShadow.add(
      new paper.Point(
        position.x + carLength / 6 + shadowOffset,
        position.y + carWidth / 2 + shadowOffset
      )
    ); // Front wing area
    carShadow.add(
      new paper.Point(
        position.x - carLength / 6 + shadowOffset,
        position.y + carWidth / 2 + shadowOffset
      )
    ); // Sidepod
    carShadow.add(
      new paper.Point(
        position.x - carLength / 3 + shadowOffset,
        position.y + carWidth / 3 + shadowOffset
      )
    ); // Coke bottle shape
    carShadow.add(
      new paper.Point(
        position.x - carLength / 2 + shadowOffset,
        position.y + carWidth / 4 + shadowOffset
      )
    ); // Rear wing
    carShadow.add(
      new paper.Point(
        position.x - carLength / 2 + shadowOffset,
        position.y - carWidth / 4 + shadowOffset
      )
    ); // Rear wing (other side)
    carShadow.add(
      new paper.Point(
        position.x - carLength / 3 + shadowOffset,
        position.y - carWidth / 3 + shadowOffset
      )
    ); // Coke bottle shape
    carShadow.add(
      new paper.Point(
        position.x - carLength / 6 + shadowOffset,
        position.y - carWidth / 2 + shadowOffset
      )
    ); // Sidepod
    carShadow.add(
      new paper.Point(
        position.x + carLength / 6 + shadowOffset,
        position.y - carWidth / 2 + shadowOffset
      )
    ); // Front wing area
    carShadow.add(
      new paper.Point(
        position.x + carLength / 3 + shadowOffset,
        position.y - carWidth / 4 + shadowOffset
      )
    ); // Nose widening

    carShadow.closed = true;
    carShadow.fillColor = new paper.Color(0, 0, 0, 0.3); // Semi-transparent black
    carShadow.data = { type: "car", id: car.id };

    // Main F1 car body
    const carBody = new paper.Path();

    // F1 car body outline with proper proportions
    carBody.add(new paper.Point(position.x + carLength / 2, position.y)); // Sharp needle nose
    carBody.add(
      new paper.Point(position.x + carLength / 3, position.y + carWidth / 4)
    ); // Nose widening
    carBody.add(
      new paper.Point(position.x + carLength / 6, position.y + carWidth / 2)
    ); // Front wing area
    carBody.add(
      new paper.Point(position.x - carLength / 6, position.y + carWidth / 2)
    ); // Sidepod
    carBody.add(
      new paper.Point(position.x - carLength / 3, position.y + carWidth / 3)
    ); // Coke bottle shape
    carBody.add(
      new paper.Point(position.x - carLength / 2, position.y + carWidth / 4)
    ); // Rear wing
    carBody.add(
      new paper.Point(position.x - carLength / 2, position.y - carWidth / 4)
    ); // Rear wing (other side)
    carBody.add(
      new paper.Point(position.x - carLength / 3, position.y - carWidth / 3)
    ); // Coke bottle shape
    carBody.add(
      new paper.Point(position.x - carLength / 6, position.y - carWidth / 2)
    ); // Sidepod
    carBody.add(
      new paper.Point(position.x + carLength / 6, position.y - carWidth / 2)
    ); // Front wing area
    carBody.add(
      new paper.Point(position.x + carLength / 3, position.y - carWidth / 4)
    ); // Nose widening

    carBody.closed = true;
    carBody.fillColor = new paper.Color(primaryColor);
    carBody.strokeColor = new paper.Color(accentColor);
    carBody.strokeWidth = 0.5;
    carBody.data = { type: "car", id: car.id };

    // Add cockpit area
    const cockpit = new paper.Path.Rectangle({
      point: [position.x - carLength / 8, position.y - carWidth / 6],
      size: [carLength / 4, carWidth / 3],
      fillColor: new paper.Color(0, 0, 0, 0.8),
      data: { type: "car", id: car.id },
    });

    // Add tires with compound colors
    const tireWidth = 1.2;
    const tireLength = 2.5;

    // Front left tire
    const frontLeftTire = new paper.Path.Rectangle({
      point: [
        position.x + carLength / 4 - tireLength / 2,
        position.y + carWidth / 2 - tireWidth / 2,
      ],
      size: [tireLength, tireWidth],
      fillColor: new paper.Color(tireColor),
      strokeColor: new paper.Color("#000000"),
      strokeWidth: 0.3,
      data: { type: "car", id: car.id },
    });

    // Front right tire
    const frontRightTire = new paper.Path.Rectangle({
      point: [
        position.x + carLength / 4 - tireLength / 2,
        position.y - carWidth / 2 - tireWidth / 2,
      ],
      size: [tireLength, tireWidth],
      fillColor: new paper.Color(tireColor),
      strokeColor: new paper.Color("#000000"),
      strokeWidth: 0.3,
      data: { type: "car", id: car.id },
    });

    // Rear left tire
    const rearLeftTire = new paper.Path.Rectangle({
      point: [
        position.x - carLength / 4 - tireLength / 2,
        position.y + carWidth / 2 - tireWidth / 2,
      ],
      size: [tireLength, tireWidth],
      fillColor: new paper.Color(tireColor),
      strokeColor: new paper.Color("#000000"),
      strokeWidth: 0.3,
      data: { type: "car", id: car.id },
    });

    // Rear right tire
    const rearRightTire = new paper.Path.Rectangle({
      point: [
        position.x - carLength / 4 - tireLength / 2,
        position.y - carWidth / 2 - tireWidth / 2,
      ],
      size: [tireLength, tireWidth],
      fillColor: new paper.Color(tireColor),
      strokeColor: new paper.Color("#000000"),
      strokeWidth: 0.3,
      data: { type: "car", id: car.id },
    });

    // Add top highlight for 3D effect
    const highlight = new paper.Path();
    highlight.add(new paper.Point(position.x + carLength / 2, position.y));
    highlight.add(new paper.Point(position.x - carLength / 2, position.y));
    highlight.strokeColor = new paper.Color(255, 255, 255, 0.6);
    highlight.strokeWidth = 0.8;
    highlight.data = { type: "car", id: car.id };

    // Group all car parts
    const carGroup = new paper.Group([
      carShadow,
      carBody,
      cockpit,
      frontLeftTire,
      frontRightTire,
      rearLeftTire,
      rearRightTire,
      highlight,
    ]);

    return carGroup;
  };

  // Draw cars and their speed indicators with enhanced features
  const drawCarsAndSpeeds = useCallback(() => {
    if (
      !paper ||
      !paper.project ||
      !paper.project.layers ||
      !paper.project.layers[0] ||
      !paperLoaded
    ) {
      console.log(
        "[drawCarsAndSpeeds] Paper.js not properly initialized, skipping car drawing"
      );
      return;
    }

    console.log(
      "[drawCarsAndSpeeds] Starting car drawing, carPositions:",
      Object.keys(carPositions).length
    );
    console.log(
      "[drawCarsAndSpeeds] Main layer children before:",
      paper.project.layers[0].children.length
    );

    // If no car positions, just clear the car layer and return
    if (Object.keys(carPositions).length === 0) {
      const carLayer = paper.project.layers.find(
        (layer) => layer.data?.type === "car_layer"
      );
      if (carLayer) {
        carLayer.removeChildren();
        console.log("[drawCarsAndSpeeds] No cars to draw, cleared car layer");
      }
      return;
    }

    // Create or get car layer - this allows us to clear just the car layer
    let carLayer = paper.project.layers.find(
      (layer) => layer.data?.type === "car_layer"
    );
    if (!carLayer) {
      carLayer = new paper.Layer();
      carLayer.data = { type: "car_layer" };
      // Ensure car layer is above the main layer but don't activate it yet
      if (paper.project.layers && paper.project.layers[0]) {
        carLayer.insertAbove(paper.project.layers[0]);
      }
      console.log("[drawCarsAndSpeeds] Created new car layer");
    }

    // Clear only the car layer completely
    carLayer.removeChildren();

    // IMPORTANT: Keep the main layer active for track elements
    // Only temporarily activate car layer for drawing cars
    const originalLayer = paper.project.activeLayer;
    console.log(
      "[drawCarsAndSpeeds] Original layer:",
      originalLayer.data?.type || "main"
    );
    carLayer.activate();

    // Draw each car and its speed
    Object.entries(carPositions).forEach(([carId, position]) => {
      const car = cars.find((c) => c.id === carId);
      if (!car) return;

      // Create F1 car
      const carGroup = createF1Car(position, car);

      // Rotate car to match racing line direction
      carGroup.rotate(
        position.angle * (180 / Math.PI),
        new paper.Point(position.x, position.y)
      );

      // Add speed indicator if car is moving
      if (position.speed > 0) {
        // Convert speed to km/h for display
        const speedKmh = Math.round(position.speed * 3.6);

        // Create speed text with background
        const speedBg = new paper.Path.Rectangle({
          point: [position.x - 15, position.y - 30],
          size: [30, 12],
          fillColor: new paper.Color(0, 0, 0, 0.7),
          radius: 3,
          data: { type: "speed", id: carId },
        });

        const speedText = new paper.PointText({
          point: new paper.Point(position.x, position.y - 20),
          content: `${speedKmh} km/h`,
          fillColor: new paper.Color("#ffffff"),
          fontSize: 8,
          justification: "center",
          data: { type: "speed", id: carId },
        });

        // All trail effects removed - clean car animation without any trails
      }
    });

    // CRITICAL: Always switch back to the original layer (main layer for tracks)
    originalLayer.activate();
    console.log("[drawCarsAndSpeeds] Switched back to original layer");
    if (paper.project.layers && paper.project.layers[0]) {
      console.log(
        "[drawCarsAndSpeeds] Main layer children after:",
        paper.project.layers[0].children.length
      );
    }

    // Force immediate canvas update to ensure both layers are visible
    if (paper.view) {
      paper.view.requestUpdate();
    }

    console.log("[drawCarsAndSpeeds] Car drawing complete");
  }, [carPositions, cars, paperLoaded]);

  // Effect to update car drawings
  useEffect(() => {
    // Only draw cars if Paper.js is fully initialized and we have a track
    if (paperLoaded && hasTrack) {
      drawCarsAndSpeeds();
    }
  }, [carPositions, drawCarsAndSpeeds, paperLoaded, hasTrack]);

  // Handle clear
  const handleClearAll = useCallback(() => {
    console.log("[handleClearAll] Clearing everything...");

    // Clear all component state first to prevent conflicts
    setIsAnimating(false);
    setHasTrack(false);
    setIsDrawingTrack(false);
    setInternalTrackPoints([]); // Clear internal track points

    // Reset tracking state
    lastTrackSource.current = "none";
    lastTrackHash.current = "";

    // Clear parent component state
    handleClear();

    // Clear Paper.js canvas - use comprehensive approach
    if (paper && paper.project) {
      try {
        // Stop any running animations first
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        // Method 1: Clear all layers completely (most reliable)
        paper.project.clear();

        // Method 2: Recreate the default layer structure
        if (paper.project.layers.length === 0) {
          new paper.Layer(); // Create default layer
        }

        // Method 3: Ensure car layer is properly removed/recreated
        const existingCarLayer = paper.project.layers.find(
          (layer) => layer.data?.type === "car_layer"
        );
        if (existingCarLayer) {
          existingCarLayer.remove();
        }

        console.log("[handleClearAll] Paper.js canvas cleared completely");

        // Force canvas update
        paper.view?.requestUpdate();
      } catch (error) {
        console.error(
          "[handleClearAll] Error clearing Paper.js canvas:",
          error
        );

        // Fallback: Try to clear each layer individually
        try {
          if (paper.project.layers) {
            paper.project.layers.forEach((layer) => {
              if (layer && layer.removeChildren) {
                layer.removeChildren();
              }
            });
          }
        } catch (fallbackError) {
          console.error(
            "[handleClearAll] Fallback clear failed:",
            fallbackError
          );
        }
      }
    }

    // Clear simulation results via parent callback
    if (onSimulationResults) {
      onSimulationResults([]);
    }

    // Clear animation references
    animationStartTime.current = null;
    animationProgress.current = 0;

    // Clear car positions
    setCarPositions({});

    // Clear path references
    currentPath.current = null;
    innerPath.current = null;
    outerPath.current = null;

    // Stop any running animations
    if (stopAnimationRef.current) {
      stopAnimationRef.current();
      stopAnimationRef.current = null;
    }

    // Reset zoom to default
    const defaultZoom = 1.8;
    setZoomLevel(defaultZoom);
    if (paper && paper.view) {
      paper.view.zoom = defaultZoom;
      paper.view.center = paper.view.bounds.center;
    }

    console.log("[handleClearAll] Clear complete - all state reset");
  }, [handleClear, onSimulationResults]);

  // Zoom functionality
  const handleZoomIn = useCallback(() => {
    if (!paper || !paper.view) return;

    const newZoom = Math.min(zoomLevel + zoomStep, maxZoom);
    setZoomLevel(newZoom);
    paper.view.zoom = newZoom;
    paper.view.requestUpdate();
    console.log(`[Zoom] Zoomed in to ${newZoom.toFixed(1)}x`);
  }, [zoomLevel, zoomStep, maxZoom]);

  const handleZoomOut = useCallback(() => {
    if (!paper || !paper.view) return;

    const newZoom = Math.max(zoomLevel - zoomStep, minZoom);
    setZoomLevel(newZoom);
    paper.view.zoom = newZoom;
    paper.view.requestUpdate();
    console.log(`[Zoom] Zoomed out to ${newZoom.toFixed(1)}x`);
  }, [zoomLevel, zoomStep, minZoom]);

  const handleZoomReset = useCallback(() => {
    if (!paper || !paper.view) return;

    const defaultZoom = 1.8;
    setZoomLevel(defaultZoom);
    paper.view.zoom = defaultZoom;
    paper.view.center = paper.view.bounds.center;
    paper.view.requestUpdate();
    console.log(`[Zoom] Reset to ${defaultZoom}x`);
  }, []);

  const handleZoomFit = useCallback(() => {
    if (!paper || !paper.view || !hasTrack) return;

    try {
      // Get all track elements to calculate bounds
      const trackElements = paper.project.activeLayer.children.filter(
        (child) =>
          child.data?.type === "track" ||
          child.data?.subtype === "center" ||
          child.data?.subtype === "left" ||
          child.data?.subtype === "right"
      );

      if (trackElements.length === 0) return;

      // Calculate bounding box of all track elements
      let bounds = trackElements[0].bounds;
      for (let i = 1; i < trackElements.length; i++) {
        bounds = bounds.unite(trackElements[i].bounds);
      }

      // Add padding
      const padding = 50;
      bounds = bounds.expand(padding);

      // Calculate zoom to fit
      const canvasWidth = paper.view.viewSize.width;
      const canvasHeight = paper.view.viewSize.height;

      const zoomX = canvasWidth / bounds.width;
      const zoomY = canvasHeight / bounds.height;
      const fitZoom = Math.min(zoomX, zoomY);

      // Apply constraints
      const finalZoom = Math.max(minZoom, Math.min(maxZoom, fitZoom));

      setZoomLevel(finalZoom);
      paper.view.zoom = finalZoom;
      paper.view.center = bounds.center;
      paper.view.requestUpdate();

      console.log(`[Zoom] Fitted track at ${finalZoom.toFixed(1)}x`);
    } catch (error) {
      console.error("[Zoom] Error fitting track:", error);
      handleZoomReset(); // Fallback to reset
    }
  }, [hasTrack, minZoom, maxZoom, handleZoomReset]);

  // Mouse wheel zoom functionality
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!paper || !paper.view) return;

      event.preventDefault();

      const delta = event.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1; // Zoom out or in

      // Get mouse position relative to canvas
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const mousePoint = new paper.Point(mouseX, mouseY);

      // Convert to paper coordinates
      const paperMousePoint = paper.view.viewToProject(mousePoint);

      const newZoom = Math.max(
        minZoom,
        Math.min(maxZoom, zoomLevel * zoomFactor)
      );

      if (newZoom !== zoomLevel) {
        setZoomLevel(newZoom);

        // Zoom toward mouse position
        const currentCenter = paper.view.center;
        const zoomChange = newZoom / zoomLevel;

        // Calculate new center to zoom toward mouse
        const newCenter = currentCenter.add(
          paperMousePoint.subtract(currentCenter).multiply(1 - 1 / zoomChange)
        );

        paper.view.zoom = newZoom;
        paper.view.center = newCenter;
        paper.view.requestUpdate();

        console.log(`[Zoom] Mouse wheel zoom to ${newZoom.toFixed(1)}x`);
      }
    },
    [zoomLevel, minZoom, maxZoom]
  );

  // Add wheel event listener for zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle zoom shortcuts when canvas is focused or no input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (event.key) {
        case "+":
        case "=":
          event.preventDefault();
          handleZoomIn();
          break;
        case "-":
        case "_":
          event.preventDefault();
          handleZoomOut();
          break;
        case "0":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomReset();
          }
          break;
        case "f":
        case "F":
          if (hasTrack) {
            event.preventDefault();
            handleZoomFit();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleZoomIn, handleZoomOut, handleZoomReset, handleZoomFit, hasTrack]);

  // Helper function to calculate track length
  const calculateTrackLength = (trackPoints: Point[]) => {
    let length = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const dx = trackPoints[i].x - trackPoints[i - 1].x;
      const dy = trackPoints[i].y - trackPoints[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length / 1000; // Convert to kilometers for display
  };

  // Helper function to scale and center track points for canvas display
  const scaleTrackToCanvas = (
    trackPoints: Point[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (trackPoints.length === 0) return trackPoints;

    // Find bounds of track points
    const minX = Math.min(...trackPoints.map((p) => p.x));
    const maxX = Math.max(...trackPoints.map((p) => p.x));
    const minY = Math.min(...trackPoints.map((p) => p.y));
    const maxY = Math.max(...trackPoints.map((p) => p.y));

    const trackWidth = maxX - minX;
    const trackHeight = maxY - minY;

    // Ensure we have valid dimensions
    if (trackWidth === 0 || trackHeight === 0) return trackPoints;

    // Calculate scale to fit canvas with adaptive padding
    const minPadding = 40;
    const maxPadding = 80;
    const adaptivePadding = Math.min(
      maxPadding,
      Math.max(minPadding, Math.min(canvasWidth, canvasHeight) * 0.1)
    );

    const scaleX = (canvasWidth - 2 * adaptivePadding) / trackWidth;
    const scaleY = (canvasHeight - 2 * adaptivePadding) / trackHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centering offsets to center the track perfectly
    const scaledWidth = trackWidth * scale;
    const scaledHeight = trackHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2 - minX * scale;
    const offsetY = (canvasHeight - scaledHeight) / 2 - minY * scale;

    // Scale and center points
    return trackPoints.map((point) => ({
      x: point.x * scale + offsetX,
      y: point.y * scale + offsetY,
    }));
  };

  // Function to draw track from preset data (using same style as custom tracks)
  const drawPresetTrack = (trackPoints: Point[]) => {
    console.log(
      `[drawPresetTrack] Starting to draw track with ${trackPoints.length} points`
    );
    if (!paper || trackPoints.length === 0) return;

    // Get canvas dimensions
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    console.log(
      `[drawPresetTrack] Canvas dimensions: ${canvasWidth}x${canvasHeight}`
    );

    // Scale track points to fit canvas
    const scaledPoints = scaleTrackToCanvas(
      trackPoints,
      canvasWidth,
      canvasHeight
    );

    // Clear existing paths more carefully
    try {
      paper.project.clear();
      // Ensure we have a default layer after clearing
      if (paper.project.layers.length === 0) {
        new paper.Layer(); // Create default layer
      }
    } catch (error) {
      console.error("[drawPresetTrack] Error clearing canvas:", error);
      // Fallback: try to clear children only
      if (paper.project.layers && paper.project.layers[0]) {
        paper.project.layers[0].removeChildren();
      }
    }

    // Use the same drawing method as custom tracks for consistency
    // Pass isCircuit=true since F1 tracks are closed circuits
    drawTrackWithBoundaries(scaledPoints, false, false, true);

    // Update lines state
    setLines([scaledPoints]);

    // 🔥 FIX: Set internalTrackPoints for simulation to work on preset tracks
    setInternalTrackPoints(scaledPoints);
    console.log(
      `[drawPresetTrack] Set internalTrackPoints with ${scaledPoints.length} points for simulation`
    );

    // Calculate track statistics
    const length = calculateTrackLength(scaledPoints);
    const curvature = calculateCurvature(scaledPoints);

    // Notify parent component if callback exists
    if (onTrackUpdate) {
      onTrackUpdate(scaledPoints, curvature, length);
    }

    // Update track length in parent
    if (onTrackLengthChange) {
      onTrackLengthChange(length);
    }

    // Set track flags
    setHasTrack(true);

    // Redraw the canvas
    paper.view.update();
  };

  // Helper function to create a hash for track points
  const createTrackHash = (points: Point[]): string => {
    return points.length > 0
      ? `${points.length}-${points[0].x}-${points[0].y}-${
          points[Math.floor(points.length / 2)]?.x || 0
        }`
      : "";
  };

  // Watch for lines changes to draw preset tracks (FIXED: removed circular dependency)
  useEffect(() => {
    if (lines.length === 1 && lines[0].length > 0 && paper && !isDrawingTrack) {
      const trackPoints = lines[0];
      const currentHash = createTrackHash(trackPoints);

      // Check if this is a new track from external source (preset)
      if (currentHash !== lastTrackHash.current && trackPoints.length > 5) {
        console.log(
          `[CanvasDrawPaper] New external track detected, drawing ${trackPoints.length} points`
        );
        lastTrackHash.current = currentHash;
        lastTrackSource.current = "preset";

        // Use setTimeout to prevent direct state mutation during render
        setTimeout(() => {
          drawPresetTrack(trackPoints);
        }, 0);
      } else {
        console.log(
          `[CanvasDrawPaper] Track unchanged or custom track, skipping redraw`
        );
      }
    } else if (lines.length === 0 && paper) {
      // Lines were cleared
      console.log(`[CanvasDrawPaper] Lines cleared, resetting track state`);
      setInternalTrackPoints([]);
      setHasTrack(false);
      lastTrackSource.current = "none";
      lastTrackHash.current = "";
    }
  }, [lines, paper, isDrawingTrack]); // FIXED: Removed internalTrackPoints from dependencies

  return (
    <div className="w-full h-full relative bg-gray-50">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ touchAction: "none", backgroundColor: "#f8fafc" }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {!paperLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-blue-600 font-mono text-sm">
              INITIALIZING CANVAS...
            </div>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute top-3 right-3 flex gap-2" role="toolbar">
        {/* Zoom controls */}
        <div className="flex flex-col gap-1">
          {/* Zoom in/out row */}
          <div className="flex gap-1">
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= maxZoom}
              className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold rounded border transition-all shadow-sm ${
                zoomLevel >= maxZoom
                  ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
              }`}
              title={`Zoom In (${(zoomLevel + zoomStep).toFixed(1)}x)`}
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= minZoom}
              className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold rounded border transition-all shadow-sm ${
                zoomLevel <= minZoom
                  ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
              }`}
              title={`Zoom Out (${(zoomLevel - zoomStep).toFixed(1)}x)`}
            >
              −
            </button>
          </div>
          {/* Zoom fit/reset row */}
          <div className="flex gap-1">
            <button
              onClick={handleZoomFit}
              disabled={!hasTrack}
              className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold rounded border transition-all shadow-sm ${
                !hasTrack
                  ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
              }`}
              title="Fit Track to View"
            >
              ⧉
            </button>
            <button
              onClick={handleZoomReset}
              className="w-8 h-8 flex items-center justify-center font-mono text-xs font-bold rounded border transition-all shadow-sm bg-gray-600 border-gray-500 text-white hover:bg-gray-700"
              title="Reset Zoom (1.8x)"
            >
              ◯
            </button>
          </div>
        </div>

        {/* Main action buttons */}
        <button
          onClick={handleAnimateClick}
          disabled={
            !hasTrack ||
            !internalTrackPoints.length ||
            internalTrackPoints.length < 2 ||
            !cars.length
          }
          className={`px-3 py-2 font-mono text-xs font-bold rounded border transition-all shadow-sm ${
            isSimulating
              ? "bg-blue-600 border-blue-500 text-white"
              : isAnimating
              ? "bg-red-600 border-red-500 text-white hover:bg-red-700"
              : "bg-green-600 border-green-500 text-white hover:bg-green-700"
          } ${
            !hasTrack ||
            !internalTrackPoints.length ||
            internalTrackPoints.length < 2 ||
            !cars.length
              ? "opacity-50 cursor-not-allowed bg-gray-300 border-gray-300 text-gray-500"
              : ""
          }`}
          title={
            !cars.length
              ? "Add a car first"
              : !hasTrack ||
                !internalTrackPoints.length ||
                internalTrackPoints.length < 2
              ? "Draw a track first"
              : isSimulating
              ? "Simulating..."
              : isAnimating
              ? "Stop Animation"
              : simulationResults
              ? "Play Animation"
              : "Start Simulation"
          }
        >
          {isSimulating
            ? "SIMULATING..."
            : isAnimating
            ? "◼ STOP"
            : simulationResults
            ? "▶ SIMULATE"
            : "▶ ANIMATE"}
        </button>
        <button
          onClick={handleClearAll}
          className="px-3 py-2 bg-red-600 border border-red-500 hover:bg-red-700 text-white font-mono text-xs font-bold rounded transition-all shadow-sm"
          title="Clear Track"
        >
          ✕ CLEAR
        </button>
      </div>

      {/* Zoom level indicator */}
      <div
        className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-mono cursor-help"
        title="Zoom Controls:&#10;Mouse Wheel: Zoom in/out&#10;+/-: Zoom buttons&#10;Ctrl+0: Reset zoom&#10;F: Fit track to view"
      >
        Zoom: {zoomLevel.toFixed(1)}x
      </div>
    </div>
  );
};

export default CanvasDrawPaper;
