/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

export const config = {
  api: {
    // Use proxy route to avoid CORS issues in development
    // In production, point directly to backend with CORS configured
    baseUrl: '/api/proxy', // Always use proxy in development
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  app: {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  },
} as const;

// Debug log
console.log('🔧 Config loaded:', {
  baseUrl: config.api.baseUrl,
  useProxy: process.env.NEXT_PUBLIC_USE_PROXY,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export default config;

