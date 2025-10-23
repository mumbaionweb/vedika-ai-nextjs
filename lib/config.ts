/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 * Updated: 2025-10-20 - Next.js 15 compatible, no WebSocket dependencies
 */

export const config = {
  api: {
    // Production API endpoint
    baseUrl: 'https://api.vedika.ai.in',
    websocketUrl: 'wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  app: {
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  },
  aws: {
    region: 'ap-south-1',
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    audioBucket: process.env.NEXT_PUBLIC_AUDIO_BUCKET || 'vedika-audio-temp',
  },
} as const;

// Debug log
console.log('🔧 Config loaded:', {
  baseUrl: config.api.baseUrl,
  websocketUrl: config.api.websocketUrl,
  environment: config.app.environment,
});

export default config;

