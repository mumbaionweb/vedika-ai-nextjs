/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Disabled to prevent double-rendering and WebSocket disconnection issues
  
  // Compiler optimizations
  compiler: {
    removeConsole: false, // Temporarily enabled for UAT debugging
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Output optimizations
  poweredByHeader: false,  // Remove X-Powered-By header
  generateEtags: false,  // Disable ETag generation for performance
  
  // Development optimizations for memory
  experimental: {
    // Reduce memory usage in development
    optimizePackageImports: ['lucide-react', 'react-markdown'],
  },
  
  // Webpack optimizations for development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce memory usage in development mode
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      };
      
      // Optimize cache for development
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      };
      
      // Reduce memory footprint
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };
    }
    
    return config;
  },
}

module.exports = nextConfig

