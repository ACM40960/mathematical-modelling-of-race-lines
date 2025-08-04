"use client";

import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">
              🏁 F1 Racing Lines
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            F1 Racing Line Simulator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Design tracks, configure cars, and analyze physics-based racing
            lines with real-time parameter sensitivity analysis.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Track Designer Card */}
          <Link href="/track-designer" className="group">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="text-6xl mb-4">🏁</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  Track Designer
                </h2>
                <p className="text-gray-600 mb-6">
                  Design custom tracks, configure F1 cars, and simulate
                  physics-based racing lines with our interactive canvas.
                </p>

                {/* Features */}
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Interactive track drawing canvas
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    2025 F1 circuit presets
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Car configuration controls
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Physics-based simulation
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Two step algorithm implementation
                  </div>
                </div>

                <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-blue-700 transition-colors">
                  Open Track Designer →
                </div>
              </div>
            </div>
          </Link>

          {/* Parameter Analysis Card */}
          <Link href="/parameter-analysis" className="group">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="text-6xl mb-4">🔬</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  Parameter Analysis
                </h2>
                <p className="text-gray-600 mb-6">
                  Real-time parameter sensitivity analysis showing how car
                  physics affect lap times and performance.
                </p>

                {/* Features */}
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Auto-run parameter analysis
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Real-time graph updates
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Interactive parameter controls
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    Physics simulation based
                  </div>
                </div>

                <div className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium group-hover:bg-purple-700 transition-colors">
                  Open Parameter Analysis →
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
