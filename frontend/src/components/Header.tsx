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
    <header className="w-full bg-black shadow flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
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
            className="flex items-center gap-1 px-4 py-2 hover:cursor-pointer focus:outline-none font-medium text-md text-white"
          >
            {selectedTrack ? `Track: ${selectedTrack}` : "Tracks"}
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
            <ul className="absolute left-0 mt-2 w-40 bg-white rounded shadow-lg z-10">
              {tracks.map((track) => (
                <li
                  key={track}
                  className="px-4 py-2 hover:bg-red-500 cursor-pointer first:rounded-t last:rounded-b hover:text-black hover:font-bold"
                  onClick={() => {
                    setSelectedTrack(track);
                    setDropdownOpen(false);
                  }}
                >
                  {track}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
