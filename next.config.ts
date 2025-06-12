import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: false,
    ppr: false,
  },
};

export default nextConfig;
