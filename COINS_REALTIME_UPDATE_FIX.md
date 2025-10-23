# Coins Real-time Update Fix

## Problem
The VedikaCoins component was only fetching credits data once on mount, and not updating after messages were sent. This caused:
- Credits usage count remaining stale after sending messages
- User confusion about whether credits were being consumed
- Inconsistent display between actual usage and displayed usage

## Root Cause
The `useCoins` hook fetched data once via `useEffect` on component mount, but had no mechanism to refresh when new messages were sent.

## Solution
Implemented a global coins refresh system using React Context that allows any component to trigger a refresh of the coins display.

## Architecture

### 1. **CoinsContext** (`contexts/CoinsContext.tsx`)
- Provides global `refreshCoins()` function
- Maintains a Set of refresh callbacks
- Broadcasts refresh events to all registered listeners
- Uses callback registration pattern for decoupled communication

### 2. **CoinsProvider** (in `app/layout.tsx`)
- Wraps the entire application
- Makes coins refresh functionality available globally
- No props drilling required

### 3. **useCoinsRefreshCallback Hook**
- Allows components to register for refresh events
- Auto-cleanup on component unmount
- Prevents memory leaks

### 4. **Updated Components**

#### VedikaCoins Component
- Registers its `refetch` function with the global refresh system
- Automatically updates when `refreshCoins()` is called from anywhere

#### Homepage (`app/page.tsx`)
- Calls `refreshCoins()` after successful message send
- Triggers before navigation to chat page

#### Chat History Page (`app/chat/[chatId]/page.tsx`)
- Calls `refreshCoins()` after successful message send
- Updates coins display in real-time during conversation

## Data Flow

```
1. User sends message
   ↓
2. API call succeeds
   ↓
3. Component calls refreshCoins()
   ↓
4. CoinsContext broadcasts to all listeners
   ↓
5. VedikaCoins receives event
   ↓
6. refetch() is called
   ↓
7. Session validation API called
   ↓
8. New credits data received
   ↓
9. UI updates with new values
```

## Implementation Details

### CoinsContext.tsx
```typescript
// Global refresh callbacks stored in a Set
const refreshCallbacks = new Set<() => void>();

// Provider broadcasts to all callbacks
const refreshCoins = () => {
  refreshCallbacks.forEach(callback => callback());
};

// Hook to register callbacks
export function useCoinsRefreshCallback(callback: () => void) {
  useEffect(() => {
    refreshCallbacks.add(callback);
    return () => refreshCallbacks.delete(callback);
  }, [callback]);
}
```

### VedikaCoins.tsx
```typescript
export default function VedikaCoins() {
  const { refetch } = useCoins();
  
  // Register for global refresh events
  useCoinsRefreshCallback(refetch);
  
  // ... rest of component
}
```

### Usage in Pages
```typescript
const { refreshCoins } = useCoinsRefresh();

// After successful API call
if (response.ok) {
  // ... handle response
  refreshCoins(); // Trigger coins update
}
```

## Console Logs

You should now see these logs when a message is sent:

```
📤 Submitting message: ...
✅ Response received: ...
🔄 Refreshing coins display...
🔄 [CoinsContext] Broadcasting coins refresh to all listeners
📝 [CoinsContext] Registered refresh callback, total: 1
🪙 [useCoins] Fetching session/credits data...
🔍 Validating session: ...
✅ Session valid: {credits: 17, expiresAt: '...'}
🪙 [useCoins] Session data: {vedikaCoinsRemaining: 17, dailyVedikaCoins: 20}
🪙 [useCoins] Computed values: {usedCredits: 3, totalCredits: 20, ...}
```

## Benefits

1. ✅ **Real-time Updates** - Coins display updates immediately after message send
2. ✅ **Decoupled Architecture** - No prop drilling or tight coupling
3. ✅ **Memory Safe** - Proper cleanup prevents memory leaks
4. ✅ **Scalable** - Easy to add more refresh triggers if needed
5. ✅ **Works Everywhere** - Homepage and chat history both update coins
6. ✅ **Debug Friendly** - Comprehensive logging for troubleshooting

## Testing

1. Open the application
2. Check initial coins display (e.g., "0/20")
3. Send a message from homepage
4. Verify coins update before navigation (e.g., "1/20")
5. Send a follow-up message from chat page
6. Verify coins update immediately after response (e.g., "2/20")
7. Check console logs for refresh events

## Files Changed

### New Files (1):
- `contexts/CoinsContext.tsx` - Global coins refresh system

### Modified Files (4):
- `app/layout.tsx` - Added CoinsProvider
- `components/ui/VedikaCoins.tsx` - Register for refresh events
- `app/page.tsx` - Call refreshCoins() after message send
- `app/chat/[chatId]/page.tsx` - Call refreshCoins() after message send

## Notes

- Refresh happens after successful API response (not before)
- Uses session validation endpoint (same as initial fetch)
- Loading state shown briefly during refresh
- Error states handled gracefully with fallback values
- Multiple components can register for refresh events
- Context provider at app root ensures global availability
