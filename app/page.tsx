'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DeviceSessionApi } from '@/lib/services/deviceSessionApi';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { Search, FileText, Sparkles, Send } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState('search');
  const [sessionReady, setSessionReady] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: {
      device_id: DeviceManager.getDeviceId(),
      session_id: DeviceManager.getSessionId(),
      request_type: 'anonymous',
      model_id: 'best',
      query_type: selectedAgent === 'search' ? 'general' : selectedAgent === 'research' ? 'analytical' : 'technical',
    },
    onResponse: (response) => {
      console.log('📨 Response received:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      // Get conversation ID from response headers
      const conversationId = response.headers.get('x-conversation-id');
      console.log('🆔 Conversation ID from header:', conversationId);
      
      if (conversationId) {
        // Redirect to chat page
        console.log('🔄 Navigating to chat page:', `/chat/${conversationId}`);
        setTimeout(() => {
          router.push(`/chat/${conversationId}`);
        }, 100);
      }
    },
    onError: (error) => {
      console.error('❌ Chat error:', error);
    },
  });

  // Initialize device session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  async function initializeSession() {
    try {
      console.log('🚀 Initializing vedika-ai session...');
      
      // Use the ensureSession method which handles validation and creation
      const sessionResult = await DeviceSessionApi.ensureSession();
      
      console.log('✅ Session ready:', {
        sessionId: sessionResult.session_id,
        credits: sessionResult.credits_remaining,
      });
      
      setCredits(sessionResult.credits_remaining);
      setSessionReady(true);
    } catch (error) {
      console.error('❌ Session initialization failed:', error);
      console.error('Error details:', error);
      setSessionReady(false);
      
      // For debugging - let's also try to see what the error is
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  }

  const agents = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'research', icon: FileText, label: 'Research' },
    { id: 'agents', icon: Sparkles, label: 'Agents' },
  ];

  return (
    <div className="flex items-center justify-center h-full bg-white p-8">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-4">
            V.ai
          </h1>
          <p className="text-secondary-600 text-lg">
            Ask me anything about your business or get help with your tasks
          </p>
        </div>

        {/* Chat Box */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl shadow-2xl border-2 border-primary-300 overflow-hidden">
            {/* Input Area */}
            <div className="relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about your business or get help with your tasks."
                className="w-full px-6 py-6 text-lg bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder:text-secondary-400 placeholder:text-sm"
                rows={6}
                disabled={isLoading || !sessionReady}
              />
            </div>

            {/* Bottom Bar with Agents and Submit */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-primary-200">
              {/* Agent Selection */}
              <div className="flex gap-2">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = selectedAgent === agent.id;
                  
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                      }`}
                      title={agent.label}
                      disabled={isLoading}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !input?.trim() || !sessionReady}
                className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              <strong>Error:</strong> {error.message}
            </div>
          )}

          {/* Session Status */}
          {!sessionReady && (
            <div className="text-center text-secondary-500 text-sm">
              Initializing session...
            </div>
          )}
          
          {sessionReady && credits !== null && (
            <div className="text-center text-secondary-500 text-xs">
              Credits remaining: {credits}
            </div>
          )}
          
          {/* Debug info */}
          <div className="text-center text-xs text-gray-400 mt-2">
            Debug: sessionReady={sessionReady ? 'true' : 'false'}, input="{input}", input.trim()="{input?.trim()}"
          </div>
        </form>

        {/* Suggestions */}
        <div className="mt-8">
          <p className="text-center text-secondary-500 text-sm mb-4">Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleInputChange({ target: { value: 'Help me analyze sales data' } } as any)}
              className="p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-400 hover:shadow-md transition-all text-left text-sm text-secondary-700"
            >
              &ldquo;Help me analyze sales data&rdquo;
            </button>
            <button
              onClick={() => handleInputChange({ target: { value: 'Create a project plan' } } as any)}
              className="p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-400 hover:shadow-md transition-all text-left text-sm text-secondary-700"
            >
              &ldquo;Create a project plan&rdquo;
            </button>
            <button
              onClick={() => handleInputChange({ target: { value: 'Summarize this document' } } as any)}
              className="p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-400 hover:shadow-md transition-all text-left text-sm text-secondary-700"
            >
              &ldquo;Summarize this document&rdquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
