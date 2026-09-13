import type { NextConfig } from 'next'

// Intentionally empty: no transpilePackages / optimizePackageImports workarounds.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default nextConfig
