import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages compatibility: remove standalone output
  // The @cloudflare/next-on-pages adapter handles the build output
  
  // Don't statically generate admin routes as they require authentication
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
