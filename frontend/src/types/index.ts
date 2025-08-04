export interface Car {
  id: string;
  mass: number;
  length: number;
  width: number;
  max_steering_angle: number;
  max_acceleration: number;
  // Physics parameters for analysis
  drag_coefficient?: number;
  lift_coefficient?: number;
  effective_frontal_area?: number;
  // Kapania Two Step Algorithm parameters
  yaw_inertia?: number;                    // Iz (kg·m²)
  front_axle_distance?: number;            // a (m) - distance from front axle to CG
  rear_axle_distance?: number;             // b (m) - distance from rear axle to CG  
  front_cornering_stiffness?: number;      // CF (kN·rad⁻¹)
  rear_cornering_stiffness?: number;       // CR (kN·rad⁻¹)
  max_engine_force?: number;               // N
  // Racing line model
  model?: string;
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
  coordinates: number[][];
  speeds: number[];
  lap_time: number;
}

// New interfaces for track selection
export interface TrackListItem {
  id: number;
  name: string;
  country: string;
  circuit_type: string;
  track_length: number;
  difficulty_rating: number;
  preview_image_url?: string;
  number_of_turns?: number;
}

export interface TrackPreset {
  id: number;
  name: string;
  country: string;
  circuit_type: string;
  track_points: Point[];
  width: number;
  friction: number;
  track_length: number;
  description?: string;
  preview_image_url?: string;
  difficulty_rating: number;
  elevation_change?: number;
  number_of_turns?: number;
  fastest_lap_time?: number;
  year_built?: number;
}

export interface TrackFilters {
  country?: string;
  circuit_type?: string;
} 