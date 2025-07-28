export interface Car {
  id: string;
  mass: number;
  length: number;
  width: number;
  max_steering_angle: number;
  max_acceleration: number;
  // Customization options
  team_name: string;
  car_color: string;
  accent_color: string;
  suspension_stiffness?: number;
  tire_compound?: 'soft' | 'medium' | 'hard';
}

export interface Point {
  x: number;
  y: number;
}

export interface Track {
  track_points: Point[];
  width: number;
  friction: number;
  cars: Car[];
}

export interface ValidationRule {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface SimulationResponse {
  optimal_lines: SimulationResult[];
}

export interface SimulationResult {
  car_id: string;
  coordinates: [number, number][];
  speeds: number[];
  lap_time: number;
} 