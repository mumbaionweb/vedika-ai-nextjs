'use client';

import { useState, useEffect, useRef } from 'react';
import { apiService } from '@/lib/services/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import type { Message } from '@/lib/types/api';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatHistoryPage({ params }: ChatPageProps) {
  const { chatId } = params;
  const { subscribe } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSetupStreamingRef = useRef(false); // Prevent double setup in Strict Mode

  useEffect(() => {
    // Check if this is a new conversation with streaming in progress
    const pendingMessage = sessionStorage.getItem('pending_message');
    
    if (pendingMessage && !hasSetupStreamingRef.current) {
      // This is a new conversation - streaming will happen here
      console.log('🆕 New conversation detected, setting up streaming...');
      hasSetupStreamingRef.current = true; // Mark as setup to prevent double runs
      
      // Create initial user message in UI
      const userMsg: Message = {
        message_id: 'temp-user',
        role: 'user',
        content: pendingMessage,
        created_at: new Date().toISOString(),
      };
      setMessages([userMsg]);
      setConversationTitle(pendingMessage.length > 50 ? pendingMessage.substring(0, 50) + '...' : pendingMessage);
      
      // Clear the pending message AFTER reading it
      sessionStorage.removeItem('pending_message');
      sessionStorage.removeItem('pending_query_type');
      
      // Set up streaming listener
      const unsubscribe = setupStreamingListener();
      setIsStreaming(true);
      setLoading(false);
      
      // Return cleanup function
      return () => {
        console.log('🧹 Cleaning up chat page streaming listener');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else if (!pendingMessage) {
      // Load existing conversation from backend (only if not streaming)
      loadConversation();
      
      // No cleanup needed for API call
      return undefined;
    }
  }, [chatId]);

  // Auto-scroll to the latest message when messages load or update
  useEffect(() => {
    if ((messages.length > 0 || streamingContent) && messagesEndRef.current) {
      // Use setTimeout to ensure the DOM has been updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest' 
        });
      }, 100);
    }
  }, [messages, streamingContent]);

  function setupStreamingListener() {
    console.log('🎧 Setting up streaming listener for chat page...');
    
    const unsubscribe = subscribe((data: any) => {
      console.log('📨 Chat page received:', data);

      if (data.type === 'conversation_started') {
        console.log('📝 Conversation started (already redirected)');
      } else if (data.type === 'stream_start') {
        console.log('▶️ Stream started');
        setStreamingContent('');
      } else if (data.type === 'content_chunk') {
        console.log('📝 Adding chunk:', data.content);
        setStreamingContent(prev => prev + data.content);
      } else if (data.type === 'stream_complete') {
        console.log('✅ Streaming complete, loading full conversation...');
        setIsStreaming(false);
        setStreamingContent('');
        
        // Wait a bit before loading to ensure backend has saved everything
        setTimeout(() => {
          loadConversation();
        }, 500);
      } else if (data.type === 'error') {
        console.error('❌ Streaming error:', data.error || data.message);
        setError(data.error || data.message || 'An error occurred');
        setIsStreaming(false);
      }
    });
    
    // Return the unsubscribe function
    return unsubscribe;
  }

  async function loadConversation() {
    // Don't try to load if we're currently streaming
    if (isStreaming) {
      console.log('⏸️ Skipping API load - streaming in progress');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getConversation(chatId);

      if (result.success) {
        setMessages(result.data.messages);
        
        // Set title from first user message
        const firstUserMessage = result.data.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const title = firstUserMessage.content.length > 50 
            ? firstUserMessage.content.substring(0, 50) + '...'
            : firstUserMessage.content;
          setConversationTitle(title);
        }
      } else {
        // Only show error if we're not streaming (to avoid showing errors during new conversation creation)
        if (!isStreaming) {
          setError(result.error.message);
        }
      }
    } catch (err) {
      // Only show error if we're not streaming
      if (!isStreaming) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  }

  // Format timestamp
  function formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  }

  // Show loading only if not streaming and loading
  if (loading && !isStreaming) {
    return (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-secondary-600">Loading conversation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error only if not streaming
  if (error && !isStreaming) {
    return (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-900 mb-2">Error Loading Conversation</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadConversation}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-6 h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Chat Not Found
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-secondary-600">
              The chat with ID &quot;{chatId}&quot; could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            {conversationTitle || 'Conversation'}
          </h1>
          <div className="flex items-center gap-4 text-sm text-secondary-600">
            <span>Conversation ID: {chatId}</span>
            <span>•</span>
            <span>{messages.length} messages</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.message_id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-secondary-500 to-secondary-700' 
                  : 'bg-gradient-to-br from-primary-500 to-primary-700'
              }`}>
                {message.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className={`flex-1 rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-secondary-100'
                  : 'bg-primary-50 border border-primary-200'
              }`}>
                <p className="text-secondary-900 whitespace-pre-line">
                  {message.content}
                </p>
                <p className="text-xs text-secondary-400 mt-2">
                  {formatTimestamp(message.created_at)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Streaming Response */}
          {isStreaming && (
            <div key="streaming-message" className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs bg-gradient-to-br from-primary-500 to-primary-700">
                AI
              </div>
              <div className="flex-1 rounded-lg p-3 bg-primary-50 border border-primary-200">
                {streamingContent ? (
                  <>
                    <p className="text-secondary-900 whitespace-pre-line">
                      {streamingContent}
                      <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1"></span>
                    </p>
                    <p className="text-xs text-secondary-400 mt-2">
                      Streaming...
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-secondary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <p className="text-sm">Waiting for response...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Invisible div at the end for scroll target */}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-6 bg-primary-50 border-2 border-primary-300 rounded-lg p-4">
          <p className="text-sm text-secondary-700">
            💡 <strong>Tip:</strong> Use the chatbox at the bottom to continue this conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
