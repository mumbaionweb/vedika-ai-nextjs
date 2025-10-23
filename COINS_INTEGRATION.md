# 🪙 Vedika Coins Integration

## Overview
The Vedika Coins system has been integrated to display real-time usage data from the backend API. Users can now see their actual coin usage in the format `used/total` (e.g., `2/20`).

## 🏗️ Architecture

### Components
- **`VedikaCoins`** - UI component displaying the golden coin with usage stats
- **`useCoins`** - React hook managing coins state using session validation
- **`DeviceSessionApi.validateSession()`** - API method to validate session and get credits

### API Integration
- **Endpoint**: `/auth/device-session/validate`
- **Method**: GET
- **Authentication**: Uses device session for anonymous users
- **Response**: Returns session data including `vedika_coins_remaining` and `daily_vedika_coins`

## 🔄 Data Flow

1. **Component Mount**: `VedikaCoins` component mounts
2. **Hook Initialization**: `useCoins` hook initializes and validates session
3. **API Call**: `DeviceSessionApi.validateSession()` fetches session data from backend
4. **Vedika Coins Extraction**: Hook extracts `vedika_coins_remaining` and `daily_vedika_coins` from session
5. **Compute Used**: Calculate `usedCredits = daily_vedika_coins - vedika_coins_remaining`
6. **UI Render**: Component displays `usedCredits/totalCredits`

## 📊 Data Structure

```typescript
interface DeviceSessionResponse {
  session_id: string;        // Session identifier
  device_id: string;         // Device identifier
  expires_at: string;        // Session expiry timestamp
  max_conversations: number; // Max allowed conversations
  plan: string;              // User plan (free, basic, pro, enterprise)
  daily_vedika_coins: number;     // Daily vedika coins limit (e.g., 20)
  vedika_coins_remaining: number; // Vedika coins remaining today (e.g., 18)
  message: string;           // User-friendly message
}

// Computed values in useCoins hook:
// usedCredits = daily_vedika_coins - vedika_coins_remaining (e.g., 20 - 18 = 2)
// totalCredits = daily_vedika_coins (e.g., 20)
// Display format: "2/20"
```

## 🎨 UI States

### Loading State
- Shows animated placeholder with gray coin
- Displays "..." for usage numbers
- Prevents layout shift during data fetch

### Error State
- Logs error to console
- Falls back to default values (0/20)
- Gracefully handles API failures

### Success State
- Displays real usage data from API
- Shows golden coin with animations
- Updates automatically when data changes

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_ENVIRONMENT=uat` - Sets environment
- `NEXT_PUBLIC_API_TIMEOUT=30000` - API timeout (optional)

### API Endpoints
- **Production**: `https://api.vedika.ai.in/Prod`
- **Local Dev**: `http://localhost:8002` (when backend is running)

## 🚀 Usage

The component is automatically integrated into the header and will:
1. Fetch coins balance on page load
2. Display real usage data
3. Handle loading and error states gracefully
4. Show format: `usedCredits/totalCredits` (e.g., `2/20`)

## 🔍 Testing

To test the integration:
1. Start the development server: `npm run dev`
2. Open the application in browser
3. Check the header for the coins display
4. Verify the API call in browser dev tools
5. Test error handling by stopping the backend

## 📝 Notes

- The component handles both authenticated and anonymous users
- Anonymous users get 20 daily credits by default
- The API automatically manages device sessions
- Loading states prevent UI flicker
- Error states provide graceful fallbacks
