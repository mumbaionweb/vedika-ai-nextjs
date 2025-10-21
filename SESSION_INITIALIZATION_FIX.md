# Session Initialization Fix

## Problem
The session validation and initialization was only happening on the homepage (`app/page.tsx`), but not on the chat history page (`app/chat/[chatId]/page.tsx`). This caused:
- Missing session logs on chat history page
- Potential issues with API calls without valid session
- Inconsistent behavior between pages

## Solution
Added session initialization to the chat history page to match the homepage implementation.

## Changes Made

### 1. Added Session Import
```typescript
import { DeviceSessionApi } from '@/lib/services/deviceSessionApi';
```

### 2. Added Session State
```typescript
const [sessionReady, setSessionReady] = useState(false);
```

### 3. Added Session Initialization useEffect
```typescript
useEffect(() => {
  async function initSession() {
    try {
      console.log('🚀 [CHAT PAGE] Initializing vedika-ai session...');
      const session = await DeviceSessionApi.ensureSession();
      console.log('✅ [CHAT PAGE] Session ready:', {
        sessionId: session.session_id,
        credits: session.credits_remaining
      });
      setSessionReady(true);
    } catch (error) {
      console.error('❌ [CHAT PAGE] Session initialization failed:', error);
      setError('Failed to initialize session. Please refresh the page.');
    }
  }

  initSession();
}, []);
```

### 4. Updated Submit Button
```typescript
<button
  type="submit"
  disabled={!sessionReady || isLoading || !input?.trim()}
  className="..."
  title={!sessionReady ? 'Initializing session...' : undefined}
>
  <Send className="w-4 h-4" />
</button>
```

## Expected Console Logs

Now when navigating to a chat history page, you should see:

```
🚀 [CHAT PAGE] Initializing vedika-ai session...
🔍 Validating session: <session-id>
✅ Session valid: {credits: 18, expiresAt: '...'}
✅ [CHAT PAGE] Session ready: {sessionId: '...', credits: 18}
```

## Benefits

1. **Consistent Session Handling**: Both homepage and chat page now initialize sessions
2. **Better Debugging**: Console logs show session status on all pages
3. **Error Handling**: Displays error message if session initialization fails
4. **Submit Protection**: Button disabled until session is ready
5. **Credits Tracking**: VedikaCoins component can now fetch credits on chat page too

## Testing

1. Navigate to homepage - see session initialization logs
2. Submit a message - navigate to chat history page
3. Verify console shows session initialization logs on chat page
4. Verify VedikaCoins component shows correct usage
5. Verify submit button is disabled until session ready
