# Production Configuration Guide

## Environment Variables for Production

To deploy this application to production, ensure the following environment variables are set in your hosting platform (Vercel, Netlify, AWS Amplify, etc.):

### Required Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod
NEXT_PUBLIC_WEBSOCKET_URL=wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod

# Environment
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_USE_PROXY=false

# API Timeout
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Platform-Specific Instructions

#### Vercel
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above with the exact values
4. Redeploy your application

#### Netlify
1. Go to your site dashboard
2. Navigate to Site Settings → Environment Variables
3. Add each variable above with the exact values
4. Trigger a new deploy

#### AWS Amplify
1. Go to your app dashboard
2. Navigate to App Settings → Environment Variables
3. Add each variable above with the exact values
4. Redeploy your application

## Current Issue Fixed

The production logs showed the app was trying to connect to `localhost:8002` instead of the production backend. This was caused by:

1. **Proxy Route Default**: The `/api/proxy/[...path]/route.ts` was defaulting to `localhost:8002`
2. **Missing Environment Variables**: Production environment didn't have the correct API URL configured

## Fix Applied

✅ Updated proxy route to default to production URL instead of localhost
✅ Created this configuration guide for proper production deployment

## Verification

After setting the environment variables and redeploying, you should see:

✅ No CORS errors in console
✅ Successful API calls to production backend
✅ Proper WebSocket connection to production endpoint
✅ Session creation working correctly

## Backend CORS Configuration

The backend team should ensure CORS is configured to allow requests from your production domain:

```javascript
// Backend CORS configuration needed
{
  origin: ['https://ai.vedika.ai.in', 'https://vedika.ai.in'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```
