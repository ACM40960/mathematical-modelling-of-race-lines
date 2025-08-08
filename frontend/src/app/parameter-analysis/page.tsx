"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ParameterCorrelationAnalysis from "@/components/ParameterCorrelationAnalysis";
import { Track, Car, SimulationResult } from "@/types";
import { loadTrack, loadCars, loadSimulationResults } from "@/lib/dataStore";

export default function ParameterAnalysisPage() {
  // State management
  const [track, setTrack] = useState<Track | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [simulationResults, setSimulationResults] = useState<
    SimulationResult[]
  >([]);

  // Load initial data from localStorage
  useEffect(() => {
    const loadedTrack = loadTrack();
    const loadedCars = loadCars();
    const loadedResults = loadSimulationResults();

    if (loadedTrack) setTrack(loadedTrack);
    if (loadedCars.length > 0) {
      setCars(loadedCars);
    }
    if (loadedResults.length > 0) {
      setSimulationResults(loadedResults);
    }

    console.log("Parameter Analysis loaded with saved data");
  }, []);

  // Set up storage event listener
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key) return;

      console.log("Storage update received:", event.key);

      if (event.key.includes("track")) {
        const updatedTrack = loadTrack();
        if (updatedTrack) {
          setTrack(updatedTrack);
          console.log("Track updated from Track Designer");
        }
      }

      if (event.key.includes("cars")) {
        const updatedCars = loadCars();
        if (updatedCars.length > 0) {
          setCars(updatedCars);
          console.log("Cars updated from Track Designer");
        }
      }

      if (event.key.includes("simulation_results")) {
        const updatedResults = loadSimulationResults();
        if (updatedResults.length > 0) {
          setSimulationResults(updatedResults);
          console.log("Simulation results updated from Track Designer");
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-black border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left side - Back Arrow and Logo */}
          <div className="flex items-center gap-6">
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
                <span className="text-white text-md font-bold">
                  PARAMETER ANALYSIS
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)]">
        {track && cars.length > 0 ? (
          <div className="p-6">
            <ParameterCorrelationAnalysis
              cars={cars}
              simulationResults={simulationResults}
            />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Empty State UI */}
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
          </div>
        )}
      </div>
    </div>
  );
}
