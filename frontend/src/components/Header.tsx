"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Predefined list of F1 tracks available for selection
// These tracks will appear in the dropdown menu
const tracks = [
  "Baku",
  "Abu Dhabi",
  "Sao Paulo",
  "Miami",
  "Monaco",
  "Silverstone",
  "Hungary",
  "Belgium",
  "Italy",
  "Singapore",
  "Japan",
  "Mexico",
  "Brazil",
];

export default function Header() {
  // State management for track selection and dropdown visibility
  const [selectedTrack, setSelectedTrack] = useState<string>(""); // Currently selected track (empty string = CUSTOM)
  const [dropdownOpen, setDropdownOpen] = useState(false); // Controls dropdown open/close state
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference to dropdown container for click-outside detection

  // Event listener to close dropdown when clicking outside of it
  // This provides better UX by allowing users to dismiss the dropdown without selecting an option
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener when component unmounts to prevent memory leaks
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              priority // Loads image with high priority for better performance
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
                // Custom dropdown arrow using SVG background image
                // This replaces the default browser arrow with a custom gray one
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%6b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.25rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2rem", // Space for the custom arrow
                }}
              >
                {/* Display selected track or "CUSTOM" as default */}
                {selectedTrack || "CUSTOM"}

                {/* Animated dropdown arrow that rotates when dropdown opens/closes */}
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

              {/* Dropdown Menu - Only visible when dropdownOpen is true */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded shadow-lg z-50 border border-gray-200">
                  {/* CUSTOM TRACK OPTION */}
                  <div
                    className="px-3 py-2 text-gray-800 text-sm hover:bg-red-600 hover:text-white cursor-pointer rounded-t"
                    onClick={() => {
                      setSelectedTrack(""); // Set to empty string for CUSTOM
                      setDropdownOpen(false); // Close dropdown after selection
                    }}
                  >
                    CUSTOM
                  </div>

                  {/* TRACK OPTIONS - Map through predefined tracks */}
                  {tracks.map((track, index) => (
                    <div
                      key={track}
                      className={`px-3 py-2 text-gray-800 text-sm hover:bg-red-600 hover:text-white cursor-pointer ${
                        index === tracks.length - 1 ? "rounded-b" : "" // Only last item gets rounded bottom
                      }`}
                      onClick={() => {
                        setSelectedTrack(track); // Set selected track
                        setDropdownOpen(false); // Close dropdown after selection
                      }}
                    >
                      {track.toUpperCase()}{" "}
                      {/* Display track name in uppercase */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Empty space for cleaner look */}
        <div className="flex items-center gap-4">
          {/* Status indicators removed for cleaner UI */}
        </div>
      </div>
    </header>
  );
}
