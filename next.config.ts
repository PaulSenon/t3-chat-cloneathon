import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Performance optimizations for competition readiness */
  experimental: {
    // Enable for better performance
    optimizeCss: true,
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analysis will be added after package installation
    return config;
  },
};

export default nextConfig;
