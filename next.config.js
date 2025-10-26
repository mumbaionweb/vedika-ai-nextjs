/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Disabled to prevent double-rendering and WebSocket disconnection issues
  
  // Performance optimizations
  swcMinify: true,  // Use SWC for minification (faster than Terser)
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',  // Remove console.log in production
  },
  
  // Experimental optimizations
  experimental: {
    optimizeCss: true,  // Optimize CSS loading
    turbo: {
      resolveAlias: {
        // Optimize imports
        'lucide-react': 'lucide-react/dist/esm/icons/index.js',
      },
    },
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Reduce memory usage
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      minimize: true,
    };
    
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Output optimizations
  poweredByHeader: false,  // Remove X-Powered-By header
  generateEtags: false,  // Disable ETag generation for performance
}

module.exports = nextConfig

