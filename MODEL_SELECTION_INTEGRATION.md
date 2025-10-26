# Model Selection Backend Integration

## Overview
This document describes the backend integration for model selection functionality.

## Files Created/Modified

### 1. New File: `lib/services/routingApi.ts`
- **Purpose**: API service for routing/model selection endpoints
- **Endpoints**:
  - `GET /routing/models` - Get available models
  - `GET /routing/stats` - Get user preference
  - `POST /routing/preferences` - Set model preference
  - `DELETE /routing/preferences` - Reset to auto-select

### 2. Modified: `app/page.tsx`
- Added imports for `routingApi` and `Model` type
- Added state for `availableModels` and `loadingModels`

## Integration Steps

### Step 1: Load Models on Page Load
Add a useEffect to load models when the component mounts:

```typescript
useEffect(() => {
  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const models = await routingApi.getAvailableModels();
      setAvailableModels(models);
      console.log('✅ Loaded models from API:', models);
    } catch (error) {
      console.error('❌ Failed to load models:', error);
      // Fallback to hardcoded models if API fails
    } finally {
      setLoadingModels(false);
    }
  };

  if (sessionReady) {
    loadModels();
  }
}, [sessionReady]);
```

### Step 2: Replace Hardcoded Models Array
Update the models array to use the API data:

```typescript
// Remove hardcoded models array or use it as fallback
const models = availableModels.length > 0 
  ? availableModels.map(model => ({
      id: model.id,
      label: model.name,
      description: model.description
    }))
  : [
      { id: 'best', label: 'Best', description: 'Best overall performance' },
      // ... fallback models
    ];
```

### Step 3: Handle Model Selection
Update the model dropdown onClick handler to save to backend:

```typescript
const handleModelSelect = async (modelId: string) => {
  try {
    const deviceId = DeviceManager.getDeviceId();
    await routingApi.setModelPreference(modelId, deviceId);
    setSelectedModel(modelId);
    setShowModelDropdown(false);
    console.log('✅ Model preference saved:', modelId);
  } catch (error) {
    console.error('❌ Failed to save model preference:', error);
    // Show error message to user
  }
};
```

### Step 4: Load User Preference on Mount
Load user's saved preference when component mounts:

```typescript
useEffect(() => {
  const loadUserPreference = async () => {
    try {
      const deviceId = DeviceManager.getDeviceId();
      const preference = await routingApi.getUserPreference(deviceId);
      
      if (preference.has_preference && preference.preferred_model) {
        setSelectedModel(preference.preferred_model);
      }
    } catch (error) {
      console.error('Failed to load user preference:', error);
    }
  };

  if (sessionReady) {
    loadUserPreference();
  }
}, [sessionReady]);
```

## API Configuration

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8002
```

## Testing

1. Start the backend API server
2. Run the frontend: `npm run dev`
3. Open browser console to see API calls
4. Test model selection dropdown

## Next Steps

1. Complete the UI integration in `app/page.tsx`
2. Add error handling and user feedback
3. Add loading states for model selection
4. Test the complete flow

## Notes

- The API service is ready but not yet fully integrated into the UI
- Backend must be running on port 8002 or update `NEXT_PUBLIC_API_URL`
- Device ID is retrieved from `DeviceManager.getDeviceId()`
- User ID is optional and can be added later when auth is integrated
