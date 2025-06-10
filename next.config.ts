import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ===== PERFORMANCE OPTIMIZATIONS FOR COMPETITION =====
  
  experimental: {
    // Automatically optimize CSS bundling for faster load times
    // This reduces CSS file sizes and improves page load speed
    optimizeCss: true,
  },
  
  // ===== IMAGE OPTIMIZATION =====
  images: {
    // Use modern image formats (AVIF, WebP) which are smaller than JPEG/PNG
    // This reduces bandwidth usage and improves loading speed
    // Falls back to original format if browser doesn't support modern formats
    formats: ['image/avif', 'image/webp'],
  },
  
  // ===== COMPRESSION =====
  // Enable gzip compression for all responses
  // This reduces file sizes sent over the network by ~70%
  compress: true,
  
  // ===== WEBPACK CONFIGURATION =====
  // Webpack is the bundler that packages your code for production
  webpack: (config, { isServer }) => {
    
    // CLIENT-SIDE OPTIMIZATIONS (browser code)
    if (!isServer) {
      // Tell webpack to ignore Node.js modules that don't work in browsers
      // This prevents errors and reduces bundle size
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,        // File system operations (Node.js only)
        net: false,       // Network operations (Node.js only)
        tls: false,       // TLS/SSL operations (Node.js only)
      };
    }
    
    // TODO: Bundle analyzer will be added here after installing dependencies
    // This would help analyze what's making your app bundle large
    
    return config;
  },
};

export default nextConfig;
