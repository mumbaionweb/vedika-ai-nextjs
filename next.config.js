/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // Disabled to prevent double-rendering and WebSocket disconnection issues
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',  // Remove console.log in production
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

