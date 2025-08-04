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

export default function Header({ selectedTrackName, onTrackSelect, onCustomTrack }: HeaderProps) {
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
          <div className="flex items-center gap-2 ml-6">
            {/* Label for the dropdown */}
            <span className="text-gray-400 text-xs">CIRCUIT:</span>

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
                      <div className="font-semibold">{track.name.toUpperCase()}</div>
                      <div className="text-xs text-gray-500 hover:text-red-200">
                        {track.country} • {track.circuit_type} • {(track.track_length / 1000).toFixed(1)}km
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
        </div>

        {/* Right side - Track info */}
        <div className="flex items-center gap-4">
          {selectedTrackName && (
            <div className="text-gray-400 text-xs">
              <span className="text-red-500">●</span> PRESET LOADED
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
