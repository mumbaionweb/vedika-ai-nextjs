# Library Documentation

## API Integration

### Quick Start

```typescript
import { apiService } from '@/lib/services/api';

// Create a new conversation
const result = await apiService.createConversation({
  message: 'Hello, I need help with sales analysis',
  agent_type: 'search',
  user_id: null, // Anonymous user
});

if (result.success) {
  const { conversation_id, response } = result.data;
  console.log('Conversation ID:', conversation_id);
  console.log('AI Response:', response.content);
}
```

### API Service Methods

#### `createConversation(request)`
Start a new conversation with the AI agent.

**Parameters:**
- `message`: string - The user's initial message
- `agent_type`: 'search' | 'research' | 'agents' - The agent to use
- `user_id`: string | null - User ID or null for anonymous
- `metadata`: object (optional) - Additional metadata

**Returns:** `APIResponse<CreateConversationResponse>`

#### `sendMessage(request)`
Send a follow-up message to an existing conversation.

**Parameters:**
- `conversation_id`: string - The conversation ID
- `message`: string - The follow-up message
- `agent_type`: 'search' | 'research' | 'agents' - The agent to use
- `user_id`: string | null - User ID or null for anonymous
- `metadata`: object (optional) - Additional metadata

**Returns:** `APIResponse<SendMessageResponse>`

#### `getConversation(conversationId)`
Retrieve a conversation and all its messages.

**Parameters:**
- `conversationId`: string - The conversation ID

**Returns:** `APIResponse<GetConversationResponse>`

#### `listConversations(page, pageSize, userId)`
List all conversations with pagination.

**Parameters:**
- `page`: number - Page number (default: 1)
- `pageSize`: number - Items per page (default: 10)
- `userId`: string | null - Filter by user ID (optional)

**Returns:** `APIResponse<ListConversationsResponse>`

#### `deleteConversation(conversationId)`
Delete a conversation.

**Parameters:**
- `conversationId`: string - The conversation ID

**Returns:** `APIResponse<void>`

#### `healthCheck()`
Check if the backend API is accessible.

**Returns:** `Promise<boolean>`

### Error Handling

All API methods return an `APIResponse<T>` type:

```typescript
type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: APIError };
```

**Example:**
```typescript
const result = await apiService.createConversation(request);

if (result.success) {
  // Handle success
  const data = result.data;
} else {
  // Handle error
  const error = result.error;
  console.error(error.message);
}
```

### Configuration

Set environment variables in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Type Safety

All types are defined in `lib/types/api.ts`:
- `Message` - Chat message structure
- `Conversation` - Conversation structure
- `CreateConversationRequest` - Create conversation payload
- `SendMessageRequest` - Send message payload
- `CreateConversationResponse` - Create conversation response
- `SendMessageResponse` - Send message response
- `GetConversationResponse` - Get conversation response
- `ListConversationsResponse` - List conversations response
- `APIError` - Error structure

### Usage in Components

```typescript
'use client';

import { useState } from 'react';
import { apiService } from '@/lib/services/api';

export default function ChatComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (message: string, agent: string) => {
    setLoading(true);
    setError(null);

    const result = await apiService.createConversation({
      message,
      agent_type: agent as 'search' | 'research' | 'agents',
      user_id: null, // Anonymous user
    });

    setLoading(false);

    if (result.success) {
      // Handle success
      const { conversation_id } = result.data;
      // Redirect to conversation page
      router.push(`/chat/${conversation_id}`);
    } else {
      // Handle error
      setError(result.error.message);
    }
  };

  // ... component JSX
}
```

### Testing

Check backend connectivity:

```typescript
const isHealthy = await apiService.healthCheck();
console.log('Backend is', isHealthy ? 'online' : 'offline');
```

