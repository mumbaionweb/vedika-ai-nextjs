'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { DeviceSessionApi } from '@/lib/services/deviceSessionApi';
import { DeviceManager } from '@/lib/utils/deviceManager';

export default function Home() {
  const router = useRouter();
  const { subscribe, send, isConnected } = useWebSocket();
  const [message, setMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('search');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  // Initialize device session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = subscribe((data: any) => {
      if (data.type === 'conversation_started') {
        // Immediately redirect to chat page with conversation_id
        console.log('✅ Conversation started, redirecting to:', data.conversation_id);
        
        // Mark that we're in streaming mode
        sessionStorage.setItem('is_streaming', 'true');
        
        // Redirect immediately - streaming will happen on chat page
        router.push(`/chat/${data.conversation_id}`);
      } else if (data.type === 'error') {
        console.error('❌ Error:', data.error || data.message);
        setError(data.error || data.message || 'An error occurred');
        setIsSubmitting(false);
        // Clear pending message on error
        sessionStorage.removeItem('pending_message');
        sessionStorage.removeItem('pending_query_type');
      }
    });

    return unsubscribe;
  }, [subscribe, router]);

  async function initializeSession() {
    try {
      console.log('🚀 Initializing vedika-ai session...');
      
      // Ensure we have a valid device session
      const session = await DeviceSessionApi.ensureSession();
      
      setCredits(session.credits_remaining);
      setSessionReady(true);
      
      console.log('✅ Session ready:', {
        sessionId: session.session_id,
        credits: session.credits_remaining
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      setError('Failed to initialize session. Please refresh the page.');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting || !sessionReady) return;

    setIsSubmitting(true);
    setError(null);

    // Map agent selection to query type
    const queryTypeMap = {
      search: 'general' as const,
      research: 'analytical' as const,
      agents: 'technical' as const,
    };

    try {
      // Store the message BEFORE sending, so chat page can detect it immediately
      sessionStorage.setItem('pending_message', message);
      sessionStorage.setItem('pending_query_type', queryTypeMap[selectedAgent as keyof typeof queryTypeMap]);
      
      // Send message via WebSocket Context
      await send({
        routeKey: 'stream_chat',
        message: message,
        device_id: DeviceManager.getDeviceId(),
        session_id: DeviceManager.getSessionId(),
        request_type: 'anonymous',
        model_id: 'best',
        query_type: queryTypeMap[selectedAgent as keyof typeof queryTypeMap],
      });

      console.log('📤 Message sent, waiting for conversation_started...');

    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setIsSubmitting(false);
      sessionStorage.removeItem('pending_message');
      sessionStorage.removeItem('pending_query_type');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAgentSelect = (agent: string) => {
    setSelectedAgent(agent);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      <div className="text-center space-y-8 p-8 max-w-4xl mx-auto w-full">
        {/* V.ai Logo */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 text-transparent bg-clip-text drop-shadow-lg">
            V.ai
          </h1>
          {/* Credits Display */}
          {credits !== null && (
            <p className="text-sm text-secondary-500 mt-2">
              {credits} queries remaining today
            </p>
          )}
        </div>

        {/* Chat Box */}
        <div className="w-full max-w-2xl mx-auto">
          {/* Session Loading State */}
          {!sessionReady && (
            <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-primary-600 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Initializing session...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-lg border border-primary-200 overflow-hidden">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business or get help with your tasks."
                  className="w-full px-6 pt-6 pb-20 pr-16 rounded-2xl border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-secondary-400 placeholder:opacity-70"
                  disabled={isSubmitting || !sessionReady}
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
                  disabled={!message.trim() || isSubmitting || !sessionReady}
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
              </div>
            </div>
          </form>
        </div>

        {/* Quick Start Suggestions */}
        <div className="w-full max-w-2xl mx-auto mt-6">
          <div className="text-center">
            <p className="text-sm text-secondary-500 mb-3">Try asking:</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button 
                onClick={() => setMessage('Help me analyze sales data')}
                disabled={isSubmitting || !sessionReady}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &ldquo;Help me analyze sales data&rdquo;
              </button>
              <button 
                onClick={() => setMessage('Create a project plan')}
                disabled={isSubmitting || !sessionReady}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &ldquo;Create a project plan&rdquo;
              </button>
              <button 
                onClick={() => setMessage('Summarize this document')}
                disabled={isSubmitting || !sessionReady}
                className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &ldquo;Summarize this document&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
