import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Enable standalone output for Docker
  eslint: {
    // Skip ESLint during build in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Skip TypeScript errors during build in production
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
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
