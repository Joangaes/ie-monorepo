// NOTE: Only this JS config is used in production. Avoid also having next.config.ts.
// output: 'standalone' expects the server to start from project root (node server.js)
// and .next/static present at /app/.next/static in the container.
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds (optional)
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://django:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
