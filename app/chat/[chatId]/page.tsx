'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const loadConversation = useCallback(async () => {
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
  }, [chatId, isStreaming]);

  // OPTIMIZATION: Load conversation with optimistic message (for follow-ups)
  const loadConversationWithOptimisticMessage = useCallback(async (optimisticMsg: any) => {
    console.log('⚡ Loading conversation with optimistic message (parallel)...');
    setLoading(true);
    setError(null);

    try {
      // Fetch conversation from backend
      const result = await apiService.getConversation(chatId);

      if (result.success) {
        // Add existing messages + optimistic message
        const allMessages = [...result.data.messages, optimisticMsg];
        setMessages(allMessages);
        
        console.log('✅ Loaded conversation + optimistic message:', allMessages.length, 'total messages');
        
        // Set title from first user message
        const firstUserMessage = result.data.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          const title = firstUserMessage.content.length > 50 
            ? firstUserMessage.content.substring(0, 50) + '...'
            : firstUserMessage.content;
          setConversationTitle(title);
        }
      } else {
        // On error, still show optimistic message
        setMessages([optimisticMsg]);
        console.warn('⚠️ Failed to load conversation, showing optimistic message only');
      }
    } catch (err) {
      // On error, still show optimistic message
      setMessages([optimisticMsg]);
      console.error('❌ Error loading conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const setupStreamingListener = useCallback(() => {
    console.log('🎧 Setting up streaming listener for chat page...');
    
    const unsubscribe = subscribe((data: any) => {
      console.log('📨 Chat page received:', data);
      
      if (data.type === 'stream_start') {
        setStreamingContent('');
        setIsStreaming(true);
      } else if (data.type === 'stream_chunk') {
        setStreamingContent(prev => prev + (data.content || ''));
      } else if (data.type === 'stream_complete') {
        console.log('✅ Stream complete, reloading conversation...');
        setIsStreaming(false);
        setStreamingContent('');
        // Reload the conversation to get the final messages
        setTimeout(() => {
          loadConversation();
        }, 500);
      } else if (data.type === 'stream_error') {
        console.error('❌ Streaming error:', data.error || data.message);
        setError(data.error || data.message || 'An error occurred');
        setIsStreaming(false);
      }
    });
    
    // Return the unsubscribe function
    return unsubscribe;
  }, [subscribe, loadConversation]);

  useEffect(() => {
    // Check if this is a new conversation with streaming in progress
    const pendingMessage = sessionStorage.getItem('pending_message');
    const optimisticMessageStr = sessionStorage.getItem('optimistic_message');
    const isFollowup = sessionStorage.getItem('optimistic_is_followup') === 'true';
    
    if (pendingMessage && !hasSetupStreamingRef.current) {
      // This is a NEW conversation - streaming will happen here
      console.log('🆕 New conversation detected, setting up streaming...');
      hasSetupStreamingRef.current = true; // Mark as setup to prevent double runs
      
      // Create initial user message in UI
      const userMsg: Message = {
        message_id: 'temp-user',
        role: 'user',
        content: pendingMessage,
        timestamp: new Date().toISOString(),
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
    } else if (optimisticMessageStr && isFollowup && !hasSetupStreamingRef.current) {
      // This is a FOLLOW-UP with optimistic message - show it immediately
      console.log('💬 Follow-up detected with optimistic message...');
      hasSetupStreamingRef.current = true;
      
      const optimisticMsg = JSON.parse(optimisticMessageStr);
      
      // Clear optimistic flags
      sessionStorage.removeItem('optimistic_message');
      sessionStorage.removeItem('optimistic_is_followup');
      
      // Load existing conversation FIRST (parallel with WebSocket setup)
      loadConversationWithOptimisticMessage(optimisticMsg);
      
      // Set up streaming listener for the AI response
      const unsubscribe = setupStreamingListener();
      setIsStreaming(true);
      
      // Return cleanup function
      return () => {
        console.log('🧹 Cleaning up follow-up streaming listener');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else if (!pendingMessage && !optimisticMessageStr) {
      // Load existing conversation from backend (normal case)
      loadConversation();
      
      // No cleanup needed for API call
      return undefined;
    }
  }, [chatId, loadConversation, loadConversationWithOptimisticMessage, setupStreamingListener]);

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

  // Format timestamp with relative time display
  function formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      // Handle future dates (shouldn't happen but just in case)
      if (diffMs < 0) {
        return 'Just now';
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // For older dates, show the actual date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return 'Invalid Date';
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
                  {formatTimestamp(message.timestamp)}
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
                  <React.Fragment key="streaming-content">
                    <p className="text-secondary-900 whitespace-pre-line">
                      {streamingContent}
                      <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1"></span>
                    </p>
                    <p className="text-xs text-secondary-400 mt-2">
                      Streaming...
                    </p>
                  </React.Fragment>
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
          <div key="messages-end" ref={messagesEndRef} />
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
