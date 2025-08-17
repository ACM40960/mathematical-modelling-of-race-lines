"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrackListItem, TrackPreset } from "@/types";

interface HeaderProps {
  selectedTrackName?: string;
  onTrackSelect: (trackPreset: TrackPreset) => void;
  onCustomTrack: () => void;
}

export default function Header({
  selectedTrackName,
  onTrackSelect,
  onCustomTrack,
}: HeaderProps) {
  // State management for track selection and dropdown visibility
  const [tracks, setTracks] = useState<TrackListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tracks from API
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/tracks");
        if (response.ok) {
          const tracksData = await response.json();
          setTracks(tracksData);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Event listener to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle track selection
  const handleTrackSelect = async (trackId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/tracks/${trackId}`);
      if (response.ok) {
        const trackPreset: TrackPreset = await response.json();
        onTrackSelect(trackPreset);
        setDropdownOpen(false);
      }
    } catch (error) {
      console.error("Error fetching track details:", error);
    }
  };

  // Handle custom track selection
  const handleCustomTrack = () => {
    onCustomTrack();
    setDropdownOpen(false);
  };

  return (
    <header className="w-full bg-black border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Logo and Track Selection */}
        <div className="flex items-center gap-6">
          {/* F1 Logo with link to home page */}
          <Link href="/" className="flex items-center">
            <Image
              src="/F1-logo.svg"
              alt="F1 Logo"
              width={80}
              height={40}
              priority
            />
          </Link>

          {/* Track Selection Dropdown */}
          <div className="flex items-center gap-2 ml-6 hover:text-white transition-colors hover:cursor-pointer">
            {/* Label for the dropdown */}
            <div className="flex items-center gap-2 hover:text-white">
              <svg
                className="w-4 h-4 text-gray-400 rotate-25"
                width="67"
                height="54"
                viewBox="0 0 67 54"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Track icon */}
                <path
                  d="M14.027 7.27604C11.1539 11.5079 10 16 9 18C8.3687 19.2626 7.77151 20.3427 7 21.5C3.95697 26.0646 2.73837 30.9705 1.60282 35.542L1.56757 35.6839C1.57332 36.8412 1.89905 38.5851 2.7306 38.3554C6.96241 37.1866 11.3369 33.1691 15.2073 28.7403C19.2376 24.1285 23.8434 14.583 28.8354 16.6724C31.1327 17.6339 35.2413 18.615 35.1573 21.4915C34.9442 28.7806 31.8812 33.3751 28.8067 37.9869C25.7321 42.5988 17.9298 50.1701 22.4964 52.1794C24.2236 52.9394 26.6587 52.8155 29.0312 51.5863C34.5988 48.7018 39.1808 45.6285 42.6479 41.4069C46.1139 37.1866 50.5628 33.8554 54.9345 27.7788C58.3891 22.9769 64.2063 19.4698 65.0967 13.1833C65.6667 9.15877 65.0856 5.52047 63.1564 3.60271C62.1891 2.64119 61.0792 1.66396 59.1088 1.50119C54.5085 1.12119 50.8275 2.03246 48.3767 2.47422C36.7176 4.57574 16.7337 3.28915 14.027 7.27604Z"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-gray-400 text-md text-bold">CIRCUIT:</span>
            </div>

            {/* Custom Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Trigger Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1 bg-transparent text-gray-300 text-sm focus:outline-none focus:text-white transition-colors cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%6b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.25rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2rem",
                }}
              >
                {/* Display selected track or "CUSTOM" as default */}
                {selectedTrackName || "CUSTOM"}

                {/* Animated dropdown arrow */}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded shadow-lg z-50 border border-gray-200 max-h-80 overflow-y-auto">
                  {/* CUSTOM TRACK OPTION */}
                  <div
                    className="px-3 py-2 text-gray-800 text-sm hover:bg-red-600 hover:text-white cursor-pointer rounded-t font-semibold"
                    onClick={handleCustomTrack}
                  >
                    CUSTOM TRACK
                  </div>

                  {/* Loading state */}
                  {loading && (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Loading tracks...
                    </div>
                  )}

                  {/* TRACK OPTIONS */}
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`px-3 py-3 text-gray-800 text-sm hover:bg-red-600 hover:text-white cursor-pointer border-t border-gray-100 ${
                        index === tracks.length - 1 ? "rounded-b" : ""
                      }`}
                      onClick={() => handleTrackSelect(track.id)}
                    >
                      <div className="font-semibold">
                        {track.name.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 hover:text-red-200">
                        {track.country} • {track.circuit_type} •{" "}
                        {(track.track_length / 1000).toFixed(1)}km
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {!loading && tracks.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      No tracks available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* This is for future purposes hence commented out */}
          {/* Analytics Link
          <Link
            href="/parameter-analysis"
            className="flex items-center gap-2 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
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
            ANALYTICS
          </Link> */}
        </div>
      </div>
    </header>
  );
}
