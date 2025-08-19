import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config: any) => {
    // Prevent Paper.js from trying to load in Node.js environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      canvas: false,
      jsdom: false,
    };
    
    return config;
  }
};

export default nextConfig;
