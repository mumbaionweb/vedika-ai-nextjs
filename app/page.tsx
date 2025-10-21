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
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remove useChat hook since we're not using it anymore

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
        <form onSubmit={async (e) => {
          console.log('🚀 Form submit triggered');
          console.log('Input value:', inputValue);
          console.log('Session ready:', sessionReady);
          console.log('Is loading:', isLoading);
          e.preventDefault();
          
          if (inputValue.trim() && sessionReady && !isLoading) {
            setIsLoading(true);
            setError(null);
            
            try {
              console.log('📤 Submitting message:', inputValue);
              console.log('🔍 Device ID:', DeviceManager.getDeviceId());
              console.log('🔍 Session ID:', DeviceManager.getSessionId());
              
              // Make API call directly to AWS
              const response = await fetch('https://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod/ai/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: inputValue,
                  device_id: DeviceManager.getDeviceId(),
                  session_id: DeviceManager.getSessionId(),
                  request_type: 'anonymous',
                  model_id: 'best',
                  query_type: selectedAgent === 'search' ? 'general' : selectedAgent === 'research' ? 'analytical' : 'technical',
                }),
              });

              console.log('📨 Response status:', response.status);
              console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

              if (response.ok) {
                const data = await response.json();
                console.log('✅ Response data:', data);
                
                const conversationId = response.headers.get('x-conversation-id') || data.conversation_id;
                console.log('✅ Message sent, conversation ID:', conversationId);
                
                if (conversationId) {
                  // Store initial messages for the chat page
                  const initialMessages = [
                    {
                      id: `user-${Date.now()}`,
                      role: 'user',
                      content: inputValue,
                      timestamp: new Date().toISOString(),
                    },
                    {
                      id: `assistant-${Date.now()}-1`,
                      role: 'assistant',
                      content: data.response,
                      timestamp: new Date().toISOString(),
                    },
                  ];
                  sessionStorage.setItem(`chat-${conversationId}`, JSON.stringify(initialMessages));
                  console.log('💾 Stored initial messages in sessionStorage');
                  
                  // Redirect to chat page with a slight delay
                  console.log('🔄 Navigating to chat page:', `/chat/${conversationId}`);
                  setTimeout(() => {
                    router.push(`/chat/${conversationId}`);
                  }, 300);
                } else {
                  console.log('⚠️ No conversation ID found in response');
                  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
                  console.log('Response data:', data);
                }
                
                setInputValue(''); // Clear input after submit
              } else {
                const errorText = await response.text();
                console.error('❌ Failed to send message:', response.status, errorText);
                setError(`Failed to send message: ${response.status} - ${errorText}`);
              }
            } catch (error) {
              console.error('❌ Error sending message:', error);
              setError(`Error sending message: ${error}`);
            } finally {
              setIsLoading(false);
            }
          }
        }} className="space-y-4">
          <div className="bg-stone-50 rounded-2xl shadow-2xl border-2 border-primary-300 overflow-hidden">
            {/* Input Area */}
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  console.log('📝 Input changed:', e.target.value);
                  setInputValue(e.target.value);
                }}
                placeholder="Ask me anything about your business or get help with your tasks."
                className="w-full px-6 py-6 text-lg bg-stone-50 border-none focus:outline-none focus:ring-0 placeholder:text-secondary-400 placeholder:text-sm h-24 placeholder:text-left"
                disabled={isLoading || !sessionReady}
              />
            </div>

            {/* Bottom Bar with Agents and Submit */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-primary-200">
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
                      className={`p-1.5 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                      }`}
                      title={agent.label}
                      disabled={isLoading}
                    >
                      <Icon className="w-2.5 h-2.5" />
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !inputValue?.trim() || !sessionReady}
                onClick={(e) => {
                  console.log('🖱️ Submit button clicked');
                  console.log('Button disabled state:', isLoading || !inputValue?.trim() || !sessionReady);
                  console.log('Input value when clicked:', inputValue);
                  // The form onSubmit will handle the actual submission
                }}
                className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                title="Send message"
              >
                <Send className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              <strong>Error:</strong> {error}
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
          <div className="text-center text-sm bg-yellow-100 p-2 rounded mt-2">
            <strong>Debug:</strong> sessionReady={sessionReady ? 'true' : 'false'}, inputValue=&quot;{inputValue}&quot;, inputValue.trim()=&quot;{inputValue?.trim()}&quot;, isLoading={isLoading ? 'true' : 'false'}
            <br />
            <strong>Button disabled because:</strong> {
              isLoading ? 'isLoading=true' : 
              !inputValue?.trim() ? 'no input text' : 
              !sessionReady ? 'session not ready' : 
              'SHOULD BE ENABLED - CHECK BUTTON LOGIC'
            }
            <br />
            <strong>Button disabled condition:</strong> {isLoading || !inputValue?.trim() || !sessionReady ? 'true' : 'false'}
            <br />
            <button 
              onClick={() => {
                DeviceManager.clearSession();
                window.location.reload();
              }}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Reset Session (Dev)
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div className="mt-8">
          <p className="text-center text-secondary-500 text-sm mb-4">Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setInputValue('Help me analyze sales data')}
              className="p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-400 hover:shadow-md transition-all text-left text-sm text-secondary-700"
            >
              &ldquo;Help me analyze sales data&rdquo;
            </button>
            <button
              onClick={() => setInputValue('Create a project plan')}
              className="p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-400 hover:shadow-md transition-all text-left text-sm text-secondary-700"
            >
              &ldquo;Create a project plan&rdquo;
            </button>
            <button
              onClick={() => setInputValue('Summarize this document')}
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
