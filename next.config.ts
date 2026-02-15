import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker and Vercel deployment
  output: "standalone",

  // TypeScript configuration
  typescript: {
    // Set to false in production for type safety
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // React strict mode for better development experience
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Rewrites for API proxying if needed
  async rewrites() {
    return [
      // Add any necessary rewrites here
    ];
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
