'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { websocketManager } from '@/lib/websocketSingleton';
import { DeviceManager } from '@/lib/utils/deviceManager';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('search');

  // Check if we're on a chat page
  const isChatPage = pathname?.startsWith('/chat/');
  const chatId = isChatPage ? pathname?.split('/chat/')[1] : null;

  // Subscribe to WebSocket messages for follow-ups
  useEffect(() => {
    if (!websocketManager) return;
    
    const unsubscribe = websocketManager.subscribe((data: any) => {
      if (data.type === 'stream_complete') {
        console.log('✅ Follow-up streaming complete, reloading page...');
        setIsSubmitting(false);
        setMessage('');
        
        // Reload page to show updated conversation
        window.location.reload();
      } else if (data.type === 'error') {
        console.error('❌ Follow-up streaming error:', data.error || data.message);
        setIsSubmitting(false);
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    if (isChatPage && chatId) {
      // Handle follow-up question on chat page via WebSocket
      await handleFollowUp(chatId);
    } else {
      // Redirect to homepage for new conversation
      router.push('/');
    }
  };

  const handleFollowUp = async (conversationId: string) => {
    try {
      // Map agent selection to query type
      const queryTypeMap = {
        search: 'general' as const,
        research: 'analytical' as const,
        agents: 'technical' as const,
      };

      // Store optimistic message for chat page to display immediately
      const optimisticMessage = {
        message_id: `optimistic-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        optimistic: true,
      };
      
      sessionStorage.setItem('optimistic_message', JSON.stringify(optimisticMessage));
      sessionStorage.setItem('optimistic_is_followup', 'true');

      // Send follow-up message via WebSocket Singleton
      if (!websocketManager) {
        throw new Error('WebSocket not initialized');
      }
      
      await websocketManager.send({
        routeKey: 'stream_chat',
        message: message,
        conversation_id: conversationId,
        device_id: DeviceManager.getDeviceId(),
        session_id: DeviceManager.getSessionId(),
        request_type: 'anonymous',
        model_id: 'best',
        query_type: queryTypeMap[selectedAgent as keyof typeof queryTypeMap],
      });

      console.log('📤 Follow-up message sent');

    } catch (error) {
      console.error('Failed to send follow-up:', error);
      setIsSubmitting(false);
      // Clear optimistic message on error
      sessionStorage.removeItem('optimistic_message');
      sessionStorage.removeItem('optimistic_is_followup');
    }
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <footer className="bg-white p-4 flex-shrink-0">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a Follow-up"
              className="w-full px-6 pt-6 pb-20 pr-16 rounded-2xl border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-secondary-400 placeholder:opacity-70"
              disabled={isSubmitting}
            />
            
            {/* Agent Selection Buttons - Left Bottom */}
            <div className="absolute left-3 bottom-3 flex gap-1">
              <button 
                type="button"
                onClick={() => handleAgentSelect('search')}
                disabled={isSubmitting}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'search' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Search Agent"
                title="Search"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'search' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleAgentSelect('research')}
                disabled={isSubmitting}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'research' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Research Agent"
                title="Research"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'research' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleAgentSelect('agents')}
                disabled={isSubmitting}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedAgent === 'agents' 
                    ? 'bg-primary-600 hover:bg-primary-700' 
                    : 'bg-secondary-100 hover:bg-secondary-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Agents"
                title="Agents"
              >
                <svg className={`w-4 h-4 ${selectedAgent === 'agents' ? 'text-white' : 'text-primary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>

            {/* Submit Button - Right Bottom */}
            <button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {isSubmitting ? (
                <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
