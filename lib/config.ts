/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 * Updated: 2025-10-20 - Next.js 15 compatible, no WebSocket dependencies
 */

export const config = {
  api: {
    // Use production API for development (recommended by backend team)
    baseUrl: 'https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod',
    websocketUrl: 'wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  app: {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  },
} as const;

// Debug log
console.log('🔧 Config loaded:', {
  baseUrl: config.api.baseUrl,
  websocketUrl: config.api.websocketUrl,
  environment: config.app.environment,
});

export default config;

