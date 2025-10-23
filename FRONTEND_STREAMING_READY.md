# Frontend: Prepare for Streaming Responses

## 🎯 Goal
Make the frontend ready to handle streaming responses from the backend when it's implemented.

---

## 📊 Current vs Streaming Flow

### Current (Blocking):
```
User sends message → Wait 4.6 seconds → Show full response
```

### With Streaming (Non-blocking):
```
User sends message → Wait 0.5s → First word appears → Rest streams in
```

---

## 🔧 Frontend Changes Needed

### 1. Create Streaming Hook (`hooks/useStreamingChat.ts`)

```typescript
import { useState, useCallback } from 'react';

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');

  const sendMessage = useCallback(async (
    message: string,
    conversationId?: string
  ) => {
    setIsStreaming(true);
    setStreamedContent('');

    try {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) throw new Error('API error');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let accumulated = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        
        // Update UI in real-time
        setStreamedContent(accumulated);
      }

      setIsStreaming(false);
      return accumulated;

    } catch (error) {
      setIsStreaming(false);
      throw error;
    }
  }, []);

  return { sendMessage, isStreaming, streamedContent };
}
```

### 2. Update Chat Components to Support Streaming

```typescript
// In app/page.tsx and app/chat/[chatId]/page.tsx

import { useStreamingChat } from '@/hooks/useStreamingChat';

export default function ChatPage() {
  const { sendMessage, isStreaming, streamedContent } = useStreamingChat();
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Add user message
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Create placeholder for streaming response
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '', // Will be updated by streaming
      isStreaming: true
    }]);

    try {
      // Send message and handle streaming
      await sendMessage(input, chatId);
      
      // Finalize message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: streamedContent, isStreaming: false }
          : msg
      ));
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.isStreaming ? (
            <StreamingMessage content={streamedContent} />
          ) : (
            <Message content={msg.content} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### 3. Create Streaming Message Component

```typescript
// components/ui/StreamingMessage.tsx

import { useEffect, useState } from 'react';

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent(content);
  }, [content]);

  return (
    <div className="message-assistant">
      <p className="whitespace-pre-wrap">{displayedContent}</p>
      {/* Blinking cursor to show it's streaming */}
      <span className="inline-block w-2 h-5 bg-primary-500 animate-pulse ml-1" />
    </div>
  );
}
```

---

## 🚀 Implementation Plan

### Phase 1: Backend Enables Streaming
1. Backend implements Server-Sent Events (SSE) or WebSocket
2. Returns `Content-Type: text/event-stream`
3. Streams chunks as they arrive from Claude API

### Phase 2: Frontend Consumes Stream
1. Implement `useStreamingChat` hook
2. Update chat pages to use streaming
3. Add streaming UI indicators (blinking cursor, etc.)

### Phase 3: Fallback Support
1. Detect if backend supports streaming
2. Fall back to current non-streaming if needed
3. Progressive enhancement approach

---

## 📈 Expected Impact

| Metric | Before | After Streaming |
|--------|--------|-----------------|
| **Time to First Word** | 4600ms | 500ms (9x faster!) |
| **Perceived Speed** | Slow | Fast (like ChatGPT) |
| **User Experience** | Wait & wonder | See progress immediately |

---

## 🎯 Next Steps

1. ✅ Backend team: Enable streaming in Lambda (see BACKEND_PERFORMANCE_RECOMMENDATIONS.md)
2. ✅ Frontend team: Implement `useStreamingChat` hook (when backend ready)
3. ✅ Test with both streaming and non-streaming backends
4. ✅ Deploy progressively (test with 10% of users first)

---

## ⚠️ Important Notes

- Streaming requires HTTP/2 or SSE support
- API Gateway supports SSE (with Lambda function URLs or HTTP API)
- Need to handle connection interruptions
- Consider fallback for older browsers

