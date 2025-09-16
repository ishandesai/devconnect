// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // disable this while debugging liveblocks
    optimizePackageImports: undefined,
  },
};

export default nextConfig;
