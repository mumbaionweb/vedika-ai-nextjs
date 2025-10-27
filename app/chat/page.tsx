'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { sessionManager } from '@/lib/utils/sessionManager';
import { config } from '@/lib/config';
import { createWebSocketStreamRequest } from '@/lib/services/apiService';
import { WebSocketStreamingService } from '@/lib/services/websocketStreamingService';
import { startChatConversation } from '@/lib/services/apiService';
import ReactMarkdown from 'react-markdown';
import { Send, Loader } from 'lucide-react';
import { coinsStore } from '@/lib/stores/coinsStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversation_id');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsServiceRef = useRef<WebSocketStreamingService | null>(null);
  const isConnectingRef = useRef(false);
  
  // Chatbox state
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      console.error('No conversation_id provided');
      return;
    }

    // Prevent double connection in React Strict Mode
    if (isConnectingRef.current) {
      console.log('⚠️ Already connecting, skipping...');
      return;
    }

    isConnectingRef.current = true;

    // Get pending message from home page
    const pendingMessage = sessionStorage.getItem('pending_message');
    const conversationData = sessionStorage.getItem('pending_conversation_data');
    
    if (pendingMessage) {
      // Add user message to UI
      setMessages([{
        id: Date.now().toString(),
        role: 'user',
        content: pendingMessage
      }]);
      
      // Clean up
      sessionStorage.removeItem('pending_message');
      sessionStorage.removeItem('pending_conversation_data');
    }

    // Initialize WebSocket service
    const wsService = new WebSocketStreamingService(config.api.websocketUrl);
    wsServiceRef.current = wsService;

    // Set up callbacks
    wsService.setCallbacks({
      onStreamStart: (event) => {
        console.log('🎬 Stream started:', event);
        
        // Create empty message for streaming
        const messageId = Date.now().toString();
        setStreamingMessageId(messageId);
        setMessages(prev => [...prev, {
          id: messageId,
          role: 'assistant',
          content: '',
          isStreaming: true
        }]);
        setIsConnected(true);
        // Don't disconnect! Wait for chunks
      },

      onConnectionOpen: () => {
        console.log('✅ WebSocket connection opened');
        setIsConnected(true);
      },
      
      onContentChunk: (event) => {
        console.log('📦 Chunk received:', event.content);
        
        // Append chunk to streaming message - use functional update to get latest state
        setMessages(prev => prev.map((msg, idx) => {
          // The streaming message is the last assistant message
          if (msg.role === 'assistant' && msg.isStreaming === true) {
            return { ...msg, content: msg.content + event.content };
          }
          return msg;
        }));
      },
      
      onStreamComplete: (event) => {
        console.log('✅ Stream complete:', event);
        
        // Mark complete - find the streaming assistant message
        setMessages(prev => prev.map(msg => {
          if (msg.role === 'assistant' && msg.isStreaming === true) {
            return { ...msg, content: event.full_response, isStreaming: false };
          }
          return msg;
        }));
        setStreamingMessageId(null);
        
        // ✅ NOW close WebSocket after stream is complete
        console.log('🔌 Closing WebSocket after stream complete');
        setTimeout(() => {
          if (wsServiceRef.current) {
            wsServiceRef.current.disconnect();
          }
        }, 1000);
      },
      
      onStreamError: (error) => {
        console.error('❌ Stream error:', error);
      }
    });

    // Connect and start streaming
    const connectAndStream = async () => {
      try {
        await wsService.connect();
        console.log('✅ WebSocket connected');

        // Create stream request
        const request = createWebSocketStreamRequest(
          conversationId,
          pendingMessage || '',
          DeviceManager.getSessionId() || '',
          DeviceManager.getDeviceId() || '',
          'anonymous'
        );

        // Send streaming request
        wsService.sendMessage(request);
        console.log('📡 Streaming request sent for conversation:', conversationId);
        
      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
      }
    };

    connectAndStream();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleanup: Disconnecting WebSocket');
      wsService.disconnect();
      isConnectingRef.current = false;
    };
  }, [conversationId]);

  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Chat with Vedika AI
          </h1>
          
          {messages.length === 0 && (
            <div className="text-center text-secondary-500 mt-20">
              {isConnected ? 'Waiting for response...' : 'Connecting...'}
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? '' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700' 
                  : 'bg-gradient-to-br from-primary-600 to-primary-800'
              }`}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className={`flex-1 rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-secondary-100' 
                  : 'bg-primary-50 border border-primary-200'
              }`}>
                <div className="text-secondary-900">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1">▋</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {!isConnected && (
        <div className="p-6 bg-blue-50 border-t border-blue-200 text-center">
          <p className="text-blue-800 text-sm">Connecting to AI assistant...</p>
        </div>
      )}
      
      {/* Chatbox - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-secondary-200 bg-white p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inputValue.trim() || isSubmitting) return;

              try {
                setIsSubmitting(true);
                const deviceId = DeviceManager.getDeviceId() ?? '';
                const session = await sessionManager.getSession();
                const sessionId = session?.session_id ?? '';

                // Start new conversation
                const result = await startChatConversation({
                  message: inputValue,
                  session_id: sessionId,
                  device_id: deviceId,
                  request_type: 'anonymous',
                  interaction_mode: 'type',
                });

                // Update coins
                coinsStore.setCoins(result.vedika_coins_remaining);

                // Add user message to UI
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'user',
                  content: inputValue
                }]);

                // Store data for streaming
                sessionStorage.setItem('pending_message', inputValue);
                sessionStorage.setItem('current_conversation_id', result.conversation_id);

                // Navigate to chat page with new conversation_id
                router.push(`/chat/${result.conversation_id}`);

                // Clear input
                setInputValue('');
              } catch (error: any) {
                console.error('Failed to start conversation:', error);
                setError(error.message || 'Failed to send message');
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

