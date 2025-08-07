/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Disable ESLint during builds to avoid compatibility issues
    ignoreDuringBuilds: true,
  },
  // Windows-specific file system optimizations
  experimental: {
    // Turbopack for faster builds
    turbo: {
      // Add turbo-specific rules if needed
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable symlink watching on Windows
      config.watchOptions = {
        ...config.watchOptions,
        followSymlinks: false,
      }
      // Fix webpack cache issues on Windows
      if (process.platform === 'win32') {
        config.cache = {
          type: 'filesystem',
          allowCollectingMemory: true,
          buildDependencies: {
            config: [__filename],
          },
        }
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
