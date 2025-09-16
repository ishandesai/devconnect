// next.config.ts
import type { NextConfig } from 'next'
import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Keep only the heavy libs that need it
    optimizePackageImports: [
      '@tiptap/react',
      '@tiptap/core',
      '@tiptap/pm',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      '@liveblocks/react',
      '@liveblocks/react-ui',
      '@liveblocks/react-tiptap',
      '@liveblocks/client',
      '@liveblocks/yjs',
      'yjs',
      'graphql-ws',
      '@apollo/client',
    ],
    // Debug which element is your LCP/CLS
    webVitalsAttribution: ['LCP', 'CLS'],
    // Stream dynamic parts to improve LCP (App Router)
    ppr: 'incremental',
  },

  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      // Cache Next Image responses (helps repeat views)
      {
        source: '/_next/image(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Your own static assets
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
}

export default withBundleAnalyzer(nextConfig)
