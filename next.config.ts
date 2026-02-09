import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure we are using standalone output for production deployment
  output: 'standalone',
};

export default nextConfig;
