"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ParameterAnalysis from "@/components/ParameterAnalysis";
import { Track, Car, SimulationResult } from "@/types";
import {
  loadTrack,
  loadCars,
  loadSimulationResults,
  saveCars,
  saveTrack,
  useStorageListener,
} from "@/lib/dataStore";

export default function ParameterAnalysisPage() {
  // State management
  const [track, setTrack] = useState<Track | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);
  const [baseCar, setBaseCar] = useState<Car | null>(null);

  // Load initial data from localStorage
  useEffect(() => {
    const loadedTrack = loadTrack();
    const loadedCars = loadCars();
    const loadedResults = loadSimulationResults();

    if (loadedTrack) setTrack(loadedTrack);
    if (loadedCars.length > 0) {
      setCars(loadedCars);
      // Set base car for analysis with all required fields
      const baseCarWithPhysics: Car = {
        id: loadedCars[0].id || "base_car",
        mass: loadedCars[0].mass || 750,
        length: loadedCars[0].length || 5.0,
        width: loadedCars[0].width || 1.4,
        max_steering_angle: loadedCars[0].max_steering_angle || 30,
        max_acceleration: loadedCars[0].max_acceleration || 5,
        drag_coefficient: loadedCars[0].drag_coefficient || 1.0,
        lift_coefficient: loadedCars[0].lift_coefficient || 3.0,
        team_name: loadedCars[0].team_name || "Analysis Team",
        car_color: loadedCars[0].car_color || "#0000FF",
        accent_color: loadedCars[0].accent_color || "#FFFFFF",
        effective_frontal_area: loadedCars[0].effective_frontal_area || 2.5,
        tire_compound: loadedCars[0].tire_compound || "medium",
      };
      setBaseCar(baseCarWithPhysics);
    } else {
      // Create default car when no cars are available
      const defaultCar: Car = {
        id: "default_analysis_car",
        mass: 750,
        length: 5.0,
        width: 1.4,
        max_steering_angle: 30,
        max_acceleration: 5,
        drag_coefficient: 1.0,
        lift_coefficient: 3.0,
        team_name: "Analysis Team",
        car_color: "#0000FF",
        accent_color: "#FFFFFF",
        tire_compound: "medium",
      };
      setBaseCar(defaultCar);
    }
    if (loadedResults.length > 0) setSimulationResults(loadedResults);

    console.log("Parameter Analysis loaded with saved data");
  }, []);

  // Listen for storage changes from other windows (Track Designer)
  useStorageListener((key, newValue) => {
    console.log("Storage update received:", key, newValue);

    if (key.includes("track")) {
      const updatedTrack = loadTrack();
      if (updatedTrack) {
        setTrack(updatedTrack);
        console.log("Track updated from Track Designer");
      }
    }

    if (key.includes("cars")) {
      const updatedCars = loadCars();
      if (updatedCars.length > 0) {
        setCars(updatedCars);
        // Update base car for analysis with all required fields
        const baseCarWithPhysics: Car = {
          id: updatedCars[0].id || "base_car",
          mass: updatedCars[0].mass || 750,
          length: updatedCars[0].length || 5.0,
          width: updatedCars[0].width || 1.4,
          max_steering_angle: updatedCars[0].max_steering_angle || 30,
          max_acceleration: updatedCars[0].max_acceleration || 5,
          drag_coefficient: updatedCars[0].drag_coefficient || 1.0,
          lift_coefficient: updatedCars[0].lift_coefficient || 3.0,
          team_name: updatedCars[0].team_name || "Analysis Team",
          car_color: updatedCars[0].car_color || "#0000FF",
          accent_color: updatedCars[0].accent_color || "#FFFFFF",
          effective_frontal_area: updatedCars[0].effective_frontal_area || 2.5,
          tire_compound: updatedCars[0].tire_compound || "medium",
        };
        setBaseCar(baseCarWithPhysics);
        console.log("Cars updated from Track Designer");
      }
    }

    if (key.includes("simulation_results")) {
      const updatedResults = loadSimulationResults();
      if (updatedResults.length > 0) {
        setSimulationResults(updatedResults);
        console.log("Simulation results updated from Track Designer");
      }
    }
  });

  // Handle parameter changes (updates both local state and syncs to Track Designer)
  const handleParameterChange = (modifiedCar: Car) => {
    if (cars.length > 0) {
      const updatedCars = [...cars];
      updatedCars[0] = modifiedCar;
      setCars(updatedCars);
      setBaseCar(modifiedCar);

      // Sync to localStorage for Track Designer
      saveCars(updatedCars);

      // Update track with new car
      if (track) {
        const updatedTrack = { ...track, cars: updatedCars };
        setTrack(updatedTrack);
        saveTrack(updatedTrack);
      }

      console.log("Parameter change synced to Track Designer");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header consistent with track designer */}
      <header className="w-full bg-black border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left side - Back Arrow and Logo */}
          <div className="flex items-center gap-6">
            {/* Back Arrow to Track Designer */}
            <Link
              href="/track-designer"
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <Image
                src="/F1-logo.svg"
                alt="F1 Logo"
                width={80}
                height={40}
                priority
                className="hover:cursor-pointer mx-3"
              />
            </Link>

            {/* Page Title */}
            <div className="flex items-center gap-2 ml-6">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-white text-md font-bold">ANALYTICS</span>
              </div>
            </div>
          </div>

          {/* Right side - empty for consistency */}
          <div className="flex items-center gap-4"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)]">
        {track && cars.length > 0 && baseCar ? (
          <ParameterAnalysis
            track={track}
            baseCar={baseCar}
            onParameterChange={handleParameterChange}
            simulationResults={simulationResults}
          />
        ) : (
          <div className="flex h-full">
            {/* Main Area - Empty State */}
            <div className="flex-1 p-4">
              <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="text-4xl mb-4 font-bold text-purple-600">
                    ANALYSIS
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Parameter Analysis Ready
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You need a track and car setup to start parameter analysis.
                    Open the Track Designer to create your setup.
                  </p>

                  {/* Status indicators */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          track ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          track ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        Track {track ? "Available" : "Required"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${
                          cars.length > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          cars.length > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        Car Setup {cars.length > 0 ? "Available" : "Required"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/track-designer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Open Track Designer →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Empty State - F1 Style Compact */}
            <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-3 overflow-y-auto">
              {/* Analysis Control - F1 Style Compact (Disabled State) */}
              <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
                {/* Header */}
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-blue-700">
                      ANALYSIS CONTROL
                    </h2>
                    <div className="text-red-600 text-xs">OFFLINE</div>
                  </div>
                </div>

                {/* Status - Auto Mode (Waiting) */}
                <div className="px-3 py-1.5 border-b border-gray-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700 text-xs">STATUS</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                  <div className="text-gray-600 text-xs">
                    Auto-analysis disabled - Requires setup
                  </div>
                </div>

                {/* Missing Requirements - Compact */}
                <div className="px-3 py-1.5">
                  <div className="text-gray-700 text-xs mb-1">REQUIREMENTS</div>
                  <div className="space-y-0.5 text-gray-600 text-xs">
                    <div
                      className={`flex items-center ${
                        track ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          track ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      Track {track ? "✓" : "(create in Track Designer)"}
                    </div>
                    <div
                      className={`flex items-center ${
                        cars.length > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          cars.length > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      Car setup {cars.length > 0 ? "✓" : "(add cars first)"}
                    </div>
                    <div className="flex items-center text-green-600">
                      <div className="w-1.5 h-1.5 rounded-full mr-2 bg-green-500"></div>
                      Physics simulation model ✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Options - F1 Style Compact (Disabled State) */}
              <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
                {/* Header */}
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-blue-700">
                      DISPLAY OPTIONS
                    </h2>
                    <div className="text-gray-500 text-xs">LOCKED</div>
                  </div>
                </div>

                {/* Disabled Options - Compact */}
                <div className="px-3 py-1.5">
                  <div className="space-y-1 opacity-50">
                    <label className="flex items-center space-x-1.5">
                      <input type="checkbox" disabled className="w-2.5 h-2.5" />
                      <span className="text-gray-500 text-xs">
                        LAP TIME VS PARAMETER
                      </span>
                    </label>
                    <label className="flex items-center space-x-1.5">
                      <input type="checkbox" disabled className="w-2.5 h-2.5" />
                      <span className="text-gray-500 text-xs">
                        PARAMETER VISIBILITY
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Sync Status */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-purple-800 font-medium">
                    Live Data Sync Active
                  </span>
                </div>
                <p className="text-purple-700 mt-1">
                  Automatically receives updates from Track Designer window
                </p>
              </div>

              {/* Method Info - F1 Style Compact */}
              <div className="w-full bg-gray-50 text-gray-800 text-xs border border-gray-300 rounded shadow-sm">
                {/* Header */}
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-blue-700">METHOD</h2>
                    <span className="text-green-600 text-xs">PHYSICS</span>
                  </div>
                </div>

                {/* Method Details - Compact */}
                <div className="px-3 py-1.5">
                  <div className="space-y-0.5 text-gray-600 text-xs">
                    <div>• Real physics simulations</div>
                    <div>• Systematic parameter testing</div>
                    <div>• Actual lap time measurements</div>
                    <div>• No theoretical equations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
