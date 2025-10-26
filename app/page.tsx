'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { appInitializer } from '@/lib/utils/appInitializer';
import { sessionManager } from '@/lib/utils/sessionManager';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { coinsStore } from '@/lib/stores/coinsStore';
import { config } from '@/lib/config';
import { InteractionService } from '@/lib/services/interactionService';
import { VoiceService } from '@/lib/services/voiceService';
import { useDeepgramDictation } from '@/lib/services/deepgramDictationService';
import VoiceModePopup from '@/components/ui/VoiceModePopup';
import { Search, FileText, Sparkles, Send, Type, Mic, MessageCircle, Loader, Globe, Paperclip, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { routingApi, type Model } from '@/lib/services/routingApi';

export default function Home() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [selectedAgent, setSelectedAgent] = useState('search');
  const [sessionReady, setSessionReady] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState('best');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Sources state
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  
  
  // Interaction Mode State
  const [interactionMode, setInteractionMode] = useState<'type' | 'dictation' | 'voice'>('type');
  const [isTyping, setIsTyping] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [dictationTranscript, setDictationTranscript] = useState('');
  const [interactionService] = useState(() => new InteractionService());
  const [voiceService] = useState(() => new VoiceService());
  
  // ✅ Use Deepgram dictation hook
  const {
    transcript: speechTranscript,
    isListening,
    startListening,
    stopListening,
    isSupported: hasRecognitionSupport,
  } = useDeepgramDictation();

  // Remove useChat hook since we're not using it anymore

  // Initialize device session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Load available models from API
  useEffect(() => {
    const loadModels = async () => {
      if (!sessionReady) return;
      
      try {
        setLoadingModels(true);
        console.log('🔄 Loading models from API...');
        const models = await routingApi.getAvailableModels();
        console.log('✅ Loaded models from API:', models);
        setAvailableModels(models);
      } catch (error) {
        console.warn('⚠️ Failed to load models from API (this is normal if backend is not running):', error);
        // Keep default "Best" option even if API fails
        setAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [sessionReady]);

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
      // Use centralized app initializer to prevent duplicate setup
      const result = await appInitializer.initialize();
      
      console.log('✅ [Homepage] Ready with session:', result.sessionId);
      setSessionReady(true);
    } catch (error) {
      console.error('❌ [Homepage] Initialization failed:', error);
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

  // Combine "Best" default option with API models
  const models = React.useMemo(() => {
    const bestOption = { id: 'best', name: 'Best', description: 'Best overall performance (Auto-select)', speed: 'Automatic', cost: 'Variable', best_for: 'All use cases' };
    if (availableModels.length === 0) {
      return [bestOption];
    }
    return [bestOption, ...availableModels];
  }, [availableModels]);

  const sources = [
    { id: 'web', icon: Globe, label: 'Web', description: 'Search the web' },
    { id: 'attach', icon: Paperclip, label: 'Attach', description: 'Upload files' },
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
    
    console.log('Starting Deepgram dictation...');
    if (hasRecognitionSupport()) {
      await startListening();
      setIsDictating(true);
      console.log('🎤 Deepgram dictation started');
    } else {
      console.error('❌ Speech recognition not supported in this browser');
      setIsDictating(false);
    }
  };

  const handleDictationStop = () => {
    console.log('🛑 Stopping Deepgram dictation...');
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
                  session_id: sessionManager.getCachedSession()?.session_id || DeviceManager.getSessionId(),
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
                
                // ✅ Update coins from chat response if available
                if (data.vedika_coins && typeof data.vedika_coins.balance === 'number') {
                  console.log('🪙 Received vedika_coins from chat response:', data.vedika_coins);
                  coinsStore.updateFromChatResponse(data.vedika_coins.balance);
                } else {
                  console.warn('⚠️ No vedika_coins in chat response, using session refresh as fallback');
                  coinsStore.refresh();
                }
                
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
                  
                  // Navigate to chat page
                  console.log('🔄 Navigating to chat page:', `/chat/${conversationId}`);
                  router.push(`/chat/${conversationId}`);
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
          <div className="bg-stone-50 rounded-2xl shadow-2xl border-2 border-primary-300 overflow-visible">
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
                  isDictating && dictationTranscript ? 'text-gray-600' : ''
                }`}
                disabled={isLoading || !sessionReady || isDictating || isVoiceMode}
              />
              {/* Processing animation for dictation OR loading state */}
              {(isDictating && dictationTranscript) || isLoading ? (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {isLoading ? (
                    <Loader className="w-5 h-5 text-primary-500 animate-spin" />
                  ) : (
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-gray-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-4 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-4 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Bottom Bar with Sources, Agents, Model, Interaction Modes and Submit */}
            <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-primary-200">
              {/* Left Side: Sources and Agents */}
              <div className="flex items-center gap-2">
                {/* Sources */}
                <div className="flex items-center bg-secondary-50 rounded-lg p-1 border border-secondary-200">
                  {sources.map((source) => {
                    const Icon = source.icon;
                    const isSelected = selectedSources.includes(source.id);
                    
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => {
                          setSelectedSources(prev => 
                            prev.includes(source.id) 
                              ? prev.filter(id => id !== source.id)
                              : [...prev, source.id]
                          );
                        }}
                        className={`p-1.5 rounded-md transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md'
                            : 'bg-white text-secondary-600 hover:bg-secondary-100'
                        }`}
                        title={source.label}
                        disabled={isLoading}
                      >
                        <Icon className="w-2.5 h-2.5" />
                      </button>
                    );
                  })}
                </div>

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
              </div>

              {/* Right Side: Model, Interaction Modes and Submit Button */}
              <div className="flex items-center gap-2">
                {/* Model Selection Button */}
                <div className="relative" ref={buttonRef}>
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    title={`AI Model: ${models.find(m => m.id === selectedModel)?.name || 'Best'}`}
                    disabled={isLoading}
                  >
                    <Bot className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Interaction Mode Buttons */}
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
                          
                          if (mode.id === 'dictation') {
                            console.log('🎤 Dictation button clicked, isDictating:', isDictating);
                            if (isDictating) {
                              handleDictationStop();
                              handleInteractionModeChange('type');
                            } else {
                              if (isVoiceMode) {
                                handleVoiceStop();
                              }
                              handleDictationStart();
                              setInteractionMode('dictation');
                            }
                          } else if (mode.id === 'voice') {
                            console.log('🎙️ Voice button clicked, isVoiceMode:', isVoiceMode);
                            if (isVoiceMode) {
                              handleVoiceStop();
                              handleInteractionModeChange('type');
                            } else {
                              if (isDictating) {
                                handleDictationStop();
                              }
                              handleVoiceStart();
                              setInteractionMode('voice');
                            }
                          } else {
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

                {/* Submit Button - Always visible */}
                <button
                  type="submit"
                  disabled={isLoading || !inputValue?.trim() || !sessionReady}
                  onClick={(e) => {
                    console.log('🖱️ Submit button clicked');
                    console.log('Button disabled state:', isLoading || !inputValue?.trim() || !sessionReady);
                    console.log('Input value when clicked:', inputValue);
                    console.log('Interaction mode:', interactionMode);
                  }}
                  className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  title={isLoading ? "Sending..." : "Send message"}
                >
                  {isLoading ? (
                    <Loader className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Send className="w-2.5 h-2.5" />
                  )}
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
          </div>
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
      
      {/* Model Dropdown Portal - rendered outside overflow container */}
      {typeof document !== 'undefined' && showModelDropdown && buttonRef.current && (() => {
        try {
          const rect = buttonRef.current.getBoundingClientRect();
          return createPortal(
            <>
              {/* Backdrop overlay */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowModelDropdown(false)} />
              
              {/* Dropdown menu - positioned below button */}
              <div 
                className="fixed w-64 bg-white border border-secondary-200 rounded-lg shadow-xl py-2 z-[9999]" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  top: rect.bottom + 8,
                  left: rect.left
                }}
              >
                {models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-secondary-50 transition-all ${
                      selectedModel === model.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium text-sm ${
                          selectedModel === model.id ? 'text-primary-600' : 'text-secondary-900'
                        }`}>
                          {model.name}
                        </div>
                        <div className="text-xs text-secondary-500">{model.description}</div>
                        {model.speed && model.cost && (
                          <div className="text-xs text-secondary-400 mt-1">
                            {model.speed} • {model.cost}
                          </div>
                        )}
                      </div>
                      {selectedModel === model.id && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>,
            document.body
          );
        } catch (error) {
          console.error('Error rendering dropdown:', error);
          return null;
        }
      })()}
    </div>
  );
}
