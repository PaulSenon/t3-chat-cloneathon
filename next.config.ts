import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only non-default optimizations needed for competition
  experimental: {
    dynamicIO: true,
    optimizeCss: true, // Not default - enables better CSS bundling
  },
};

export default nextConfig;
