# Server-Side Fetching Implementation - CORS Fix

## Problem
The application was experiencing CORS (Cross-Origin Resource Sharing) errors when making API calls directly from the client:
1. **Model Fetching**: Failed to fetch models from the backend API
2. **Chat API**: Failed to send chat messages to the backend API

### Root Cause
- Client-side browser was trying to fetch from `https://api.vedika.ai.in` or AWS API Gateway
- Browsers enforce CORS policies that block cross-origin requests
- Server-to-server requests don't have CORS restrictions

## Solution: Server-Side API Routes

### 1. Models API Route (`/api/models`)
**File**: `app/api/models/route.ts`

**Purpose**: Fetch available models from the backend API server-side

**Features**:
- Uses Next.js API route to handle requests server-side
- Fetches from the correct backend API URL
- Returns models array or empty array on error
- Cached for 5 minutes for better performance

**Response**:
```json
{
  "models": [
    {
      "id": "claude-3-haiku",
      "name": "Claude 3 Haiku",
      "description": "Fast and efficient for simple queries",
      "speed": "Very Fast (1-2s)",
      "cost": "1 coin",
      "best_for": "Quick questions, definitions, simple tasks"
    },
    ...
  ],
  "total_count": 3
}
```

### 2. Chat API Route (`/api/chat`)
**File**: `app/api/chat/route.ts`

**Purpose**: Handle chat message submissions server-side

**Features**:
- Accepts POST requests with chat message data
- Forwards requests to the backend API
- Returns response with conversation ID
- Handles errors gracefully

**Request Body**:
```json
{
  "message": "User's message",
  "device_id": "device_xxx",
  "session_id": "session_xxx",
  "request_type": "anonymous",
  "model_id": "best",
  "query_type": "general",
  "interaction_mode": "type"
}
```

**Response**:
```json
{
  "response": "AI's response",
  "conversation_id": "conv_xxx",
  "vedika_coins": {
    "balance": 20
  }
}
```

## Changes Made

### 1. `app/page.tsx`
- Changed from `${config.api.baseUrl}/ai/chat` to `/api/chat`
- Updated `model_id` to use `selectedModel || 'best'` instead of hardcoded `'best'`

### 2. `lib/services/routingApi.ts`
- Updated `getAvailableModels()` to use `/api/models` instead of direct external API call
- Removed CORS-related error handling
- Simplified error handling for API route

### 3. New Files Created
- `app/api/models/route.ts` - Models API route
- `app/api/chat/route.ts` - Chat API route

## Benefits

### 1. No CORS Issues
- All requests go through Next.js server
- Server-to-server communication doesn't have CORS restrictions
- Client never directly calls external APIs

### 2. Better Security
- API keys and sensitive data stay on the server
- Client doesn't need to know backend API URLs
- Centralized API management

### 3. Better Performance
- Models API cached for 5 minutes
- Reduced client-side network requests
- Faster page loads

### 4. Easier Debugging
- Single point of API management
- Server-side logging
- Better error handling

## Testing

### Test Models API
```bash
curl http://localhost:3000/api/models
```

**Expected Response**:
```json
{
  "models": [...],
  "total_count": 3
}
```

### Test Chat API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "device_id": "device_test",
    "session_id": "session_test",
    "request_type": "anonymous",
    "model_id": "best",
    "query_type": "general",
    "interaction_mode": "type"
  }'
```

## Environment Variables

The API routes use the following environment variable:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL (defaults to `https://api.vedika.ai.in`)

## Current Status

✅ Models API working through server-side route
✅ Chat API working through server-side route
✅ No CORS errors in console
✅ Model list populating correctly
✅ Chat messages sending successfully
✅ Model selection working

## Next Steps

1. Deploy to preprod and main branches
2. Test in production environment
3. Monitor API route performance
4. Consider adding rate limiting if needed

## Files Modified/Created

### Created
- `app/api/models/route.ts`
- `app/api/chat/route.ts`
- `SERVER_SIDE_FETCHING_FIX.md` (this file)

### Modified
- `app/page.tsx` - Updated to use `/api/chat`
- `lib/services/routingApi.ts` - Updated to use `/api/models`

## Related Issues
- CORS errors in console logs
- "Failed to fetch" errors
- Model list not populating
- Chat API failures

## Resolution Date
December 23, 2024
