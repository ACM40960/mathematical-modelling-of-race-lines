"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - Logo and Track Selection */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/F1-logo.svg"
              alt="F1 Logo"
              width={80}
              height={40}
              priority
            />
          </Link>
          
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-800 font-mono text-sm transition-colors focus:outline-none focus:border-blue-500"
            >
              <span className="text-gray-600 text-xs">CIRCUIT:</span>
              <span className="text-gray-800 font-bold">
                {selectedTrack ? selectedTrack.toUpperCase() : "CUSTOM"}
              </span>
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
            {dropdownOpen && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                <li
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 font-mono text-sm border-b border-gray-200"
                  onClick={() => {
                    setSelectedTrack(null);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="text-green-500">●</span> CUSTOM TRACK
                </li>
                {tracks.map((track) => (
                  <li
                    key={track}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 font-mono text-sm border-b border-gray-200 last:border-b-0"
                    onClick={() => {
                      setSelectedTrack(track);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="text-gray-400">○</span> {track.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
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
