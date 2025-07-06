export interface Point {
  x: number;
  y: number;
}

export interface Car {
  id: string;
  mass: number;
  length: number;
  max_steering_angle: number;
  max_acceleration: number;
}

export interface ValidationRule {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface Track {
  track_points: Point[];
  curvature: number[];
  track_length: number;
  message: string;
  width: number;
  friction?: number; // Optional since we set a default in CarControl
  cars?: Car[]; // Optional since we handle cars separately in the UI
} 