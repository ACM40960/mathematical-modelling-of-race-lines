"use client";

import { Track, Car, Point, SimulationResult } from '@/types';

const STORAGE_KEYS = {
  TRACK: 'f1_racing_track',
  CARS: 'f1_racing_cars',
  SIMULATION_RESULTS: 'f1_racing_simulation_results',
  TRACK_SETTINGS: 'f1_racing_track_settings',
  LINES: 'f1_racing_lines',
  SELECTED_TRACK_NAME: 'f1_racing_selected_track_name',
  SELECTED_MODEL: 'f1_racing_selected_model'
};

// Track data management
export const saveTrack = (track: Track | null) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRACK, JSON.stringify(track));
    // Trigger storage event for cross-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.TRACK,
      newValue: JSON.stringify(track)
    }));
  }
};

export const loadTrack = (): Track | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.TRACK);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

// Cars data management
export const saveCars = (cars: Car[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.CARS,
      newValue: JSON.stringify(cars)
    }));
  }
};

export const loadCars = (): Car[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.CARS);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

// Simulation results management
export const saveSimulationResults = (results: SimulationResult[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SIMULATION_RESULTS, JSON.stringify(results));
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.SIMULATION_RESULTS,
      newValue: JSON.stringify(results)
    }));
  }
};

export const loadSimulationResults = (): SimulationResult[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.SIMULATION_RESULTS);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

// Track settings management
export const saveTrackSettings = (settings: {
  trackWidth: number;
  trackLength: number;
  discretizationStep: number;
  selectedTrackName?: string;
}) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TRACK_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.TRACK_SETTINGS,
      newValue: JSON.stringify(settings)
    }));
  }
};

export const loadTrackSettings = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.TRACK_SETTINGS);
    return stored ? JSON.parse(stored) : {
      trackWidth: 20,
      trackLength: 0,
      discretizationStep: 0.1,
      selectedTrackName: undefined
    };
  }
  return {
    trackWidth: 20,
    trackLength: 0,
    discretizationStep: 0.1,
    selectedTrackName: undefined
  };
};

// Lines management
export const saveLines = (lines: Point[][]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(lines));
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.LINES,
      newValue: JSON.stringify(lines)
    }));
  }
};

export const loadLines = (): Point[][] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.LINES);
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};

// Model selection management
export const saveSelectedModel = (model: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.SELECTED_MODEL,
      newValue: model
    }));
  }
};

export const loadSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'physics_based';
  }
  return 'physics_based';
};

// Clear all data
export const clearAllData = () => {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // Notify all components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'f1_racing_clear_all',
      newValue: 'cleared'
    }));
  }
};

// Storage event listener hook
export const useStorageListener = (callback: (key: string, newValue: string | null) => void) => {
  if (typeof window !== 'undefined') {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
        callback(e.key, e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
  return () => {};
};