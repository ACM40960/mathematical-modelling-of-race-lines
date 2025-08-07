"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to track-designer page immediately
    router.replace("/track-designer");
  }, [router]);

  // Show loading screen while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">F1</div>
        <div className="text-xl text-gray-600">
          Loading F1 Racing Line Designer...
        </div>
      </div>
    </div>
  );
}
