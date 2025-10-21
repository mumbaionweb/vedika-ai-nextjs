'use client';

import { useEffect, useRef, use, useState } from 'react';
import { apiService } from '@/lib/services/api';
import { DeviceManager } from '@/lib/utils/deviceManager';
import type { Message } from '@/lib/types/api';
import { Send } from 'lucide-react';

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatHistoryPage({ params }: ChatPageProps) {
  const { chatId } = use(params);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistoryRef = useRef(false);

  // Remove useChat hook - we'll handle chat manually
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Manual form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      console.log('📤 [CHAT PAGE] Submitting message:', userMessage);
      
      // Make API call directly to AWS
      const response = await fetch('https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          device_id: DeviceManager.getDeviceId(),
          session_id: DeviceManager.getSessionId(),
          conversation_id: chatId,
          request_type: 'anonymous',
          model_id: 'best',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [CHAT PAGE] Response received:', data);
        
        // Add assistant response to chat
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorText = await response.text();
        console.error('❌ [CHAT PAGE] Failed to send message:', response.status, errorText);
        setError(`Failed to send message: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [CHAT PAGE] Error sending message:', error);
      setError(`Error sending message: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversation history on mount
  useEffect(() => {
    if (hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;

    async function loadHistory() {
      try {
        // First check if we have initial messages in sessionStorage
        const cachedMessages = sessionStorage.getItem(`chat-${chatId}`);
        if (cachedMessages) {
          console.log('💾 [CHAT PAGE] Loading messages from sessionStorage');
          const initialMessages = JSON.parse(cachedMessages);
          setMessages(initialMessages);
          sessionStorage.removeItem(`chat-${chatId}`); // Clean up
          console.log('✅ [CHAT PAGE] Loaded from cache:', {
            messageCount: initialMessages.length,
          });
          return; // Skip API call if we have cached messages
        }

        console.log('📖 [CHAT PAGE] Loading conversation history from API for:', chatId);
        
        const result = await apiService.getConversation(chatId);
        
        if (!result.success) {
          console.error('❌ [CHAT PAGE] API error:', result.error);
          return;
        }
        
        const data = result.data;

        console.log('✅ [CHAT PAGE] History loaded from API:', {
          messageCount: data.messages?.length || 0,
          title: data.title,
        });

        // Convert backend messages to our format
        const formattedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.message_id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp,
        }));

        setMessages(formattedMessages);
        
        console.log('📝 [CHAT PAGE] Messages set from API:', {
          count: formattedMessages.length,
          messages: formattedMessages,
        });
      } catch (error) {
        console.error('❌ [CHAT PAGE] Failed to load history:', error);
      }
    }

    loadHistory();
  }, [chatId]);

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
