# Streaming Implementation Plan

## Current Situation

### How it works now:
1. User submits message on homepage
2. Frontend calls `/api/chat` (Next.js API route)
3. API route forwards to backend REST API
4. Backend returns full response + conversation_id
5. Frontend navigates to `/chat/{conversation_id}`

### Backend Streaming Support:
- WebSocket URL: Already configured in `config.api.websocketUrl`
- Events: `stream_start`, `content_chunk`, `stream_complete`
- **IMPORTANT**: Backend needs to return `conversation_id` IMMEDIATELY

## Recommended Approach

### Option 1: Minimal Change (Recommended)
Keep REST API for homepage submission, but ask backend to:
1. Return conversation_id in response headers IMMEDIATELY
2. Continue processing full response
3. Frontend: Get conversation_id → Navigate immediately → Chat page handles rest

**Backend Change Needed:**
```
Response Headers:
  x-conversation-id: "abc-123"  ← Return this IMMEDIATELY
```

**Frontend Change:**
- Homepage: Get conversation_id from headers → Navigate
- Chat history: Can add WebSocket streaming for follow-up messages

### Option 2: Full WebSocket
- Replace REST with WebSocket on homepage
- More complex, higher risk
- Requires significant refactoring

## My Recommendation

**Ask Backend to return conversation_id immediately.**

Then we can:
1. Homepage submits via REST (simple, works now)
2. Get conversation_id from response headers
3. Navigate to chat page immediately
4. Chat page can optionally use WebSocket for real-time updates

This gives you fast navigation without complex changes!

## Next Steps

1. ✅ WebSocket service created
2. ⏸️  Wait for backend to return conversation_id immediately
3. ⏸️  Update frontend to use conversation_id from headers
4. ⏸️  Optional: Add WebSocket streaming on chat history page

