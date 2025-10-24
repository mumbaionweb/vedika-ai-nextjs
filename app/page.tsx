'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DeviceSessionApi } from '@/lib/services/deviceSessionApi';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { useCoinsRefresh } from '@/contexts/CoinsContext';
import { config } from '@/lib/config';
import { InteractionService } from '@/lib/services/interactionService';
import { checkBrowserSupport } from '@/lib/utils/browserSupport';
import { VoiceService } from '@/lib/services/voiceService';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import VoiceModePopup from '@/components/ui/VoiceModePopup';
import { Search, FileText, Sparkles, Send, Type, Mic, MessageCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { refreshCoins } = useCoinsRefresh();
  const [selectedAgent, setSelectedAgent] = useState('search');
  const [sessionReady, setSessionReady] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interaction Mode State
  const [interactionMode, setInteractionMode] = useState<'type' | 'dictation' | 'voice'>('type');
  const [isTyping, setIsTyping] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [dictationTranscript, setDictationTranscript] = useState('');
  const [interactionService] = useState(() => new InteractionService());
  const [voiceService] = useState(() => new VoiceService());
  
  // ✅ Use Web Speech API hook
  const {
    transcript: speechTranscript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition();

  // Remove useChat hook since we're not using it anymore

  // Initialize device session on mount
  useEffect(() => {
    initializeSession();
    checkBrowserSupport();
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 State changed - inputValue:', inputValue, 'dictationTranscript:', dictationTranscript);
  }, [inputValue, dictationTranscript]);

  // Handle speech recognition transcript updates
  useEffect(() => {
    if (speechTranscript) {
      console.log('📝 Speech transcript updated:', speechTranscript);
      setDictationTranscript(speechTranscript);
      setInputValue(speechTranscript);
    }
  }, [speechTranscript]);

  async function initializeSession() {
    try {
      console.log('🚀 Initializing vedika-ai session...');
      
      // Log browser capabilities
      checkBrowserSupport();
      
      // Use the ensureSession method which handles validation and creation
      const sessionResult = await DeviceSessionApi.ensureSession();
      
      console.log('✅ Session ready:', {
        sessionId: sessionResult.session_id,
        credits: sessionResult.credits_remaining,
      });
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

  const interactionModes = [
    { id: 'type', icon: Type, label: 'Type Mode', description: 'Type your input' },
    { id: 'dictation', icon: Mic, label: 'Dictation Mode', description: 'Dictate your input' },
    { id: 'voice', icon: MessageCircle, label: 'Voice Mode', description: 'Voice conversation' },
  ];

  // Dictation Mode Handlers
  const handleDictationStart = async () => {
    console.log('🎤 Dictation start clicked');
    console.log('Current state:', { isDictating, isVoiceMode, interactionMode, isTyping });
    
    // Stop any active voice mode
    if (isVoiceMode) {
      handleVoiceStop();
    }
    
    setIsDictating(true);
    setDictationTranscript('');
    setInputValue('');
    
    console.log('Starting Web Speech API...');
    if (hasRecognitionSupport) {
      startListening();
      setIsDictating(true);
      console.log('🎤 Web Speech API started');
    } else {
      console.error('❌ Web Speech API not supported in this browser');
      setIsDictating(false);
    }
  };

  const handleDictationStop = () => {
    console.log('🛑 Stopping Web Speech API...');
    stopListening();
    setIsDictating(false);
    setDictationTranscript('');
  };

  // Voice Mode Handlers
  const handleVoiceStart = () => {
    if (!voiceService.isSupported()) {
      setError('Voice mode is not supported in this browser');
      return;
    }

    setIsVoiceMode(true);
    setInputValue('');

    voiceService.startVoiceConversation({
      onError: (error: string) => {
        setError(error);
        setIsVoiceMode(false);
      },
      onTranscriptionUpdate: (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setInputValue(transcript);
        }
      }
    });
  };

  const handleVoiceStop = () => {
    voiceService.stopVoiceConversation();
    setIsVoiceMode(false);
  };

  // Voice Mode Popup Handlers
  const handleVoiceModeClose = () => {
    console.log('🎙️ Closing voice mode popup');
    handleVoiceStop();
    handleInteractionModeChange('type');
  };

  const handleVoiceModeToggleRecording = () => {
    console.log('🎙️ Toggling voice recording, current state:', isVoiceMode);
    console.log('🎙️ Voice service recording state:', voiceService.getIsRecording());
    
    // Check if voice service is actually recording
    const isCurrentlyRecording = voiceService.getIsRecording();
    
    if (isCurrentlyRecording) {
      console.log('🎙️ Stopping voice recording');
      handleVoiceStop();
    } else {
      console.log('🎙️ Starting voice recording');
      handleVoiceStart();
    }
  };

  const handleVoiceModeSettings = () => {
    console.log('🎙️ Opening voice mode settings');
    // TODO: Implement voice mode settings
    alert('Voice mode settings coming soon!');
  };

  // Handle interaction mode changes
  const handleInteractionModeChange = (mode: 'type' | 'dictation' | 'voice') => {
    console.log('🔄 Switching interaction mode to:', mode);
    console.log('🔄 Current state before switch:', { isDictating, isVoiceMode, interactionMode });
    
    // Stop any active recording when switching modes
    if (isDictating && mode !== 'dictation') {
      console.log('🔄 Stopping dictation mode');
      handleDictationStop();
    }
    if (isVoiceMode && mode !== 'voice') {
      console.log('🔄 Stopping voice mode');
      handleVoiceStop();
    }
    
    setInteractionMode(mode);
    
    // Clear input when switching to dictation or voice mode
    if (mode === 'dictation' || mode === 'voice') {
      setInputValue('');
      setIsTyping(false);
    }
  };

  return (
    <div className="flex justify-center h-full bg-white pt-48 pb-8">
      <div className="w-full max-w-3xl">
        {/* Logo */}
        <div className="text-center mb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
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
              
              // Make API call to Vedika API
              const response = await fetch(`${config.api.baseUrl}/ai/chat`, {
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
                  interaction_mode: interactionMode,
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
                  
                  // Navigate immediately without waiting for coins refresh
                  console.log('🔄 Navigating to chat page:', `/chat/${conversationId}`);
                  router.push(`/chat/${conversationId}`);
                  
                  // Refresh coins display in background (non-blocking)
                  console.log('🔄 Refreshing coins display in background...');
                  refreshCoins();
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
                value={dictationTranscript || inputValue}
                onChange={(e) => {
                  console.log('📝 Input changed:', e.target.value);
                  console.log('📝 Current inputValue:', inputValue);
                  console.log('📝 Current dictationTranscript:', dictationTranscript);
                  console.log('📝 Current field value:', e.target.value);
                  setInputValue(e.target.value);
                  
                  // When user starts typing, switch to type mode and hide other modes
                  if (e.target.value.length > 0 && !isTyping) {
                    setIsTyping(true);
                    setInteractionMode('type');
                  } else if (e.target.value.length === 0 && isTyping) {
                    setIsTyping(false);
                  }
                }}
                placeholder={
                  interactionMode === 'dictation' 
                    ? (isDictating ? "Listening... Speak now" : "Click microphone to start dictating")
                    : interactionMode === 'voice'
                    ? (isVoiceMode ? "Voice conversation active..." : "Click to start voice conversation")
                    : "Ask me anything about your business or get help with your tasks."
                }
                className={`w-full px-6 py-6 text-lg bg-stone-50 border-none focus:outline-none focus:ring-0 placeholder:text-secondary-400 placeholder:text-sm h-24 placeholder:text-left ${
                  isDictating && dictationTranscript ? 'text-blue-600' : ''
                }`}
                disabled={isLoading || !sessionReady || isDictating || isVoiceMode}
              />
              {/* Processing animation for dictation */}
              {isDictating && dictationTranscript && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar with Agents and Interaction Modes/Submit */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-primary-200">
              {/* Agent Selection */}
              <div className="flex items-center bg-secondary-50 rounded-lg p-1 border border-secondary-200">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = selectedAgent === agent.id;
                  
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgent(agent.id)}
                      className={`p-1.5 rounded-md transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                          : 'bg-white text-secondary-600 hover:bg-secondary-100'
                      }`}
                      title={agent.label}
                      disabled={isLoading}
                    >
                      <Icon className="w-2.5 h-2.5" />
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Interaction Modes or Submit Button */}
              <div className="flex items-center gap-2">
                {!isTyping ? (
                  /* Show Interaction Mode Buttons when not typing */
                  <div className="flex items-center bg-secondary-50 rounded-lg p-1 border border-secondary-200">
                    {interactionModes.map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = interactionMode === mode.id;
                      const isActive = (mode.id === 'dictation' && isDictating) || (mode.id === 'voice' && isVoiceMode);
                      
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 Interaction mode button clicked:', mode.id);
                            console.log('🔘 Button element:', e.currentTarget);
                            console.log('🔘 Event type:', e.type);
                            
                            if (mode.id === 'dictation') {
                              console.log('🎤 Dictation button clicked, isDictating:', isDictating);
                              if (isDictating) {
                                // Stop dictation
                                handleDictationStop();
                                handleInteractionModeChange('type');
                              } else {
                                // Stop voice mode if active
                                if (isVoiceMode) {
                                  handleVoiceStop();
                                }
                                // Start dictation
                                handleDictationStart();
                                setInteractionMode('dictation');
                              }
                            } else if (mode.id === 'voice') {
                              console.log('🎙️ Voice button clicked, isVoiceMode:', isVoiceMode);
                              if (isVoiceMode) {
                                // Stop voice mode
                                handleVoiceStop();
                                handleInteractionModeChange('type');
                              } else {
                                // Stop dictation if active
                                if (isDictating) {
                                  handleDictationStop();
                                }
                                // Start voice mode
                                handleVoiceStart();
                                setInteractionMode('voice');
                              }
                            } else {
                              // Type mode - stop any active modes
                              if (isDictating) {
                                handleDictationStop();
                              }
                              if (isVoiceMode) {
                                handleVoiceStop();
                              }
                              handleInteractionModeChange(mode.id as 'type' | 'dictation' | 'voice');
                            }
                          }}
                          className={`p-1.5 rounded-md transition-all ${
                            isSelected || isActive
                              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                              : 'bg-white text-secondary-600 hover:bg-secondary-100'
                          } ${isActive ? 'animate-pulse' : ''}`}
                          title={
                            mode.id === 'dictation' 
                              ? (isDictating ? 'Stop dictation' : mode.description)
                              : mode.id === 'voice'
                              ? (isVoiceMode ? 'Stop voice conversation' : mode.description)
                              : mode.description
                          }
                          disabled={isLoading}
                        >
                          <Icon className="w-2.5 h-2.5" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Show Submit Button when typing */
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue?.trim() || !sessionReady}
                    onClick={(e) => {
                      console.log('🖱️ Submit button clicked');
                      console.log('Button disabled state:', isLoading || !inputValue?.trim() || !sessionReady);
                      console.log('Input value when clicked:', inputValue);
                      console.log('Interaction mode:', interactionMode);
                      // The form onSubmit will handle the actual submission
                    }}
                    className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    title="Send message"
                  >
                    <Send className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
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
          
          
          {/* Debug info - commented out for production
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
          */}
        </form>

      </div>

      {/* Voice Mode Popup */}
      <VoiceModePopup
        isOpen={isVoiceMode}
        onClose={handleVoiceModeClose}
        isRecording={voiceService.getIsRecording()}
        onToggleRecording={handleVoiceModeToggleRecording}
        onSettings={handleVoiceModeSettings}
      />
    </div>
  );
}
