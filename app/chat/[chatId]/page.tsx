'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { apiService } from '@/lib/services/api';
import { DeviceManager } from '@/lib/utils/deviceManager';
import type { Message } from '@/lib/types/api';
import { Send } from 'lucide-react';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatHistoryPage({ params }: ChatPageProps) {
  const { chatId } = params;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistoryRef = useRef(false);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    setMessages,
    error 
  } = useChat({
    api: '/api/chat',
    id: chatId,
    body: {
      conversation_id: chatId,
      device_id: DeviceManager.getDeviceId(),
      session_id: DeviceManager.getSessionId(),
      request_type: 'anonymous',
      model_id: 'best',
    },
    onResponse: (response) => {
      console.log('📨 [CHAT PAGE] Response received:', {
        status: response.status,
        conversationId: chatId,
      });
    },
    onFinish: (message) => {
      console.log('✅ [CHAT PAGE] Message complete:', {
        role: message.role,
        contentLength: message.content.length,
      });
    },
    onError: (error) => {
      console.error('❌ [CHAT PAGE] Error:', error);
    },
  });

  // Load conversation history on mount
  useEffect(() => {
    if (hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;

    async function loadHistory() {
      try {
        console.log('📖 [CHAT PAGE] Loading conversation history for:', chatId);
        
        const data = await apiService.getConversation(chatId, {
          device_id: DeviceManager.getDeviceId(),
          session_id: DeviceManager.getSessionId(),
          request_type: 'anonymous',
        });

        console.log('✅ [CHAT PAGE] History loaded:', {
          messageCount: data.messages?.length || 0,
          title: data.title,
        });

        // Convert backend messages to AI SDK format
        const formattedMessages = (data.messages || []).map((msg: Message) => ({
          id: msg.message_id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          createdAt: new Date(msg.timestamp),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('❌ [CHAT PAGE] Failed to load history:', error);
      }
    }

    loadHistory();
  }, [chatId, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }, 100);
    }
  }, [messages, isLoading]);

  // Format timestamp
  function formatTimestamp(timestamp: string | Date): string {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return 'Just now';
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Date';
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Chat
            </h1>
            <div className="flex items-center gap-4 text-sm text-secondary-600">
              <span>Conversation ID: {chatId}</span>
              <span>•</span>
              <span>{messages.length} messages</span>
            </div>
          </div>
          
          {/* Messages */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
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
                  {message.createdAt && (
                    <p className="text-xs text-secondary-400 mt-2">
                      {formatTimestamp(message.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs bg-gradient-to-br from-primary-500 to-primary-700">
                  AI
                </div>
                <div className="flex-1 rounded-lg p-3 bg-primary-50 border border-primary-200">
                  <div className="flex items-center gap-2 text-secondary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <strong>Error:</strong> {error.message}
              </div>
            )}
            
            {/* Scroll anchor */}
            <div key="messages-end" ref={messagesEndRef} />
          </div>
          
        </div>
      </div>

      {/* Input Form at Bottom */}
      <div className="border-t border-secondary-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-xl shadow-lg border-2 border-primary-300 overflow-hidden">
            {/* Input Area */}
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a follow-up question..."
                className="w-full px-6 py-4 text-base bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-secondary-400 placeholder:text-sm"
                disabled={isLoading}
              />
            </div>

            {/* Bottom Bar with Submit */}
            <div className="flex items-center justify-end px-6 py-3 bg-white border-t border-primary-200">
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
