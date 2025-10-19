/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

export const config = {
  api: {
    // Use proxy route to avoid CORS issues in development
    // In production, point directly to backend with CORS configured
    baseUrl: process.env.NEXT_PUBLIC_USE_PROXY === 'true' 
      ? '/api/proxy'
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'),
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  app: {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  },
} as const;

export default config;

