import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds (optional)
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
