# Environment Configuration Guide

## Overview
This application supports multiple environments, each with its own API endpoint. The API base URL is configurable via environment variables.

## Environment-Specific API Endpoints

### Production
- **URL**: `https://api.vedika.ai.in`
- **Environment File**: `.env.local` or `.env.production`
- **Purpose**: Live production environment

### Preprod
- **URL**: `https://preprod.api.vedika.ai.in`
- **Environment File**: `.env.preprod`
- **Purpose**: Pre-production testing environment (mirrors production)

### UAT (User Acceptance Testing)
- **URL**: `https://uat.api.vedika.ai.in`
- **Environment File**: `.env.uat`
- **Purpose**: User acceptance testing environment

## Configuration Files

### 1. `.env.local` (Development/Production)
Used for local development and production deployments:
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.vedika.ai.in
NEXT_PUBLIC_ENVIRONMENT=production
```

### 2. `.env.preprod` (Preprod)
Used for pre-production deployments:
```bash
NEXT_PUBLIC_API_BASE_URL=https://preprod.api.vedika.ai.in
NEXT_PUBLIC_ENVIRONMENT=preprod
```

### 3. `.env.uat` (UAT)
Used for UAT deployments:
```bash
NEXT_PUBLIC_API_BASE_URL=https://uat.api.vedika.ai.in
NEXT_PUBLIC_ENVIRONMENT=uat
```

## Code Implementation

### API Routes
All API routes use the environment variable:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in';
```

**Files**:
- `app/api/models/route.ts`
- `app/api/chat/route.ts`

### Application Config
The main config file also uses the environment variable:
```typescript
// lib/config.ts
baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in',
```

## How It Works

1. **Environment Detection**: The application reads `NEXT_PUBLIC_API_BASE_URL` from the appropriate `.env` file
2. **API Calls**: All API routes use this environment variable
3. **Server-Side**: API routes fetch from the configured backend
4. **No CORS Issues**: All requests go through Next.js API routes (server-side)

## Deployment

### Local Development
1. Use `.env.local` with the desired environment URL
2. Run `npm run dev`

### Production Deployment
1. Set environment variable in deployment platform (AWS Amplify, Vercel, etc.)
2. Or use `.env.production` file

### Switching Environments

**Switch to UAT**:
```bash
cp .env.uat .env.local
npm run dev
```

**Switch to Preprod**:
```bash
cp .env.preprod .env.local
npm run dev
```

**Switch to Production**:
```bash
cp .env.production .env.local
npm run dev
```

## Files Modified

### Configuration Files
- `lib/config.ts` - Updated to use environment variable
- `app/api/models/route.ts` - Added environment-specific URLs
- `app/api/chat/route.ts` - Added environment-specific URLs

### Environment Files Created
- `.env.local` - Updated with production URL
- `.env.production` - Updated with production URL
- `.env.preprod` - Created with preprod URL
- `.env.uat` - Created with UAT URL

## Benefits

1. **Easy Environment Switching**: Just change the `NEXT_PUBLIC_API_BASE_URL` value
2. **No Code Changes**: All environment-specific config is in `.env` files
3. **Secure**: Each environment can have its own configuration
4. **CI/CD Ready**: Environment variables can be set in deployment pipelines

## Testing

### Test Different Environments Locally

1. **Test UAT API**:
```bash
cp .env.uat .env.local
npm run dev
# Visit http://localhost:3000
# API calls will go to https://uat.api.vedika.ai.in
```

2. **Test Preprod API**:
```bash
cp .env.preprod .env.local
npm run dev
# Visit http://localhost:3000
# API calls will go to https://preprod.api.vedika.ai.in
```

3. **Test Production API**:
```bash
cp .env.production .env.local
npm run dev
# Visit http://localhost:3000
# API calls will go to https://api.vedika.ai.in
```

## Troubleshooting

### API calls failing
- Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Verify the API endpoint is accessible
- Check browser console for errors

### Wrong API being called
- Verify `.env.local` has the correct `NEXT_PUBLIC_API_BASE_URL`
- Restart the dev server after changing environment variables
- Clear `.next` cache: `rm -rf .next`

## Summary

- ✅ All API endpoints now use environment-specific URLs
- ✅ Configuration is centralized in environment variables
- ✅ Easy to switch between environments
- ✅ No CORS issues (server-side API routes)
- ✅ CI/CD ready for different environments
