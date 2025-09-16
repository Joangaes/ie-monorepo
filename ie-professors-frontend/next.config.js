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
