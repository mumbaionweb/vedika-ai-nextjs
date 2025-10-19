/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  app: {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  },
} as const;

export default config;

