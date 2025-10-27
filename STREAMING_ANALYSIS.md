# Streaming Implementation Analysis

## Current State (Commit: 07f7061)
- ✅ Chatbox features on homepage and chat history page
- ✅ Sources, Model selection, Smart dropdown positioning
- ✅ Server-side API routes for models and chat
- ✅ Environment-specific configuration

## Backend Streaming Support
According to the backend documentation:
- WebSocket URL: `wss://api.vedika.ai.in/ws`
- Route: `stream_chat`
- Events: `stream_start`, `content_chunk`, `stream_complete`, `stream_error`

## Implementation Challenges

### 1. Current Architecture
- Homepage (`app/page.tsx`): Uses REST API (`/api/chat`) - sends message → navigates to chat page
- Chat History (`app/chat/[chatId]/page.tsx`): Uses REST API (`/api/chat`) - continues conversation
- Both pages work with complete messages, not streaming

### 2. Routing Impact
- Homepage submits → navigates to `/chat/{conversation_id}`
- Chat history page shows messages from API
- WebSocket streaming needs to happen BEFORE navigation on homepage
- Chat history page needs to handle streaming for follow-up messages

### 3. WebSocket vs REST
- Currently: REST API sends request → waits for complete response → navigates
- Proposed: WebSocket sends request → streams chunks → navigates when complete
- This is a SIGNIFICANT architecture change

## Recommendation

### Option A: Hybrid Approach (Recommended)
1. Keep REST API as fallback
2. Add WebSocket for streaming on chat history page only
3. Homepage continues using REST (simpler flow)
4. Chat history uses WebSocket for real-time updates

### Option B: Full WebSocket (Complex)
1. Replace ALL REST calls with WebSocket
2. Handle streaming on both pages
3. More complex state management
4. Risk of breaking current functionality

## Implementation Plan

### Phase 1: Test WebSocket Service (Safety)
- Create WebSocket service ✅ (DONE)
- Test connection to backend
- Verify streaming events work

### Phase 2: Chat History Page
- Add streaming to chat history page only
- Keep REST as fallback
- Test thoroughly

### Phase 3: Homepage (Optional)
- Consider adding streaming to homepage
- But keep navigation flow intact

## Risk Assessment
- HIGH RISK: Could break current working flow
- MEDIUM IMPACT: Significant code changes required
- TIME ESTIMATE: 4-6 hours

## Backup Plan
If streaming doesn't work:
```bash
git reset --hard 07f7061
```

