'use client';

import React, { useEffect, useRef, use, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '@/lib/services/api';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { appInitializer } from '@/lib/utils/appInitializer';
import { sessionManager } from '@/lib/utils/sessionManager';
import { coinsStore } from '@/lib/stores/coinsStore';
import { config } from '@/lib/config';
import { VoiceService } from '@/lib/services/voiceService';
import { useDeepgramDictation } from '@/lib/services/deepgramDictationService';
import VoiceModePopup from '@/components/ui/VoiceModePopup';
import type { Message } from '@/lib/types/api';
import { Send, Search, FileText, Sparkles, Type, Mic, MessageCircle, Loader, Globe, Paperclip, Bot } from 'lucide-react';
import { routingApi, type Model } from '@/lib/services/routingApi';

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatHistoryPage({ params }: ChatPageProps) {
  const { chatId } = use(params);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistoryRef = useRef(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Session state
  const [sessionReady, setSessionReady] = useState(false);

  // Remove useChat hook - we'll handle chat manually
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('search');
  
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
  const [voiceService] = useState(() => new VoiceService());
  
  // ✅ Use Deepgram dictation hook
  const {
    transcript: speechTranscript,
    isListening,
    startListening,
    stopListening,
    isSupported: hasRecognitionSupport,
  } = useDeepgramDictation();

  // Agent definitions
  const agents = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'research', label: 'Research', icon: FileText },
    { id: 'agents', label: 'Agents', icon: Sparkles },
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

  // Initialize session on mount - optimized to skip if session exists
  useEffect(() => {
    async function initSession() {
      try {
        // Quick check: if we have a session ID, assume it's valid (saves ~200-300ms)
        const existingSessionId = DeviceManager.getSessionId();
        if (existingSessionId) {
          console.log('⚡ [CHAT PAGE] Using existing session:', existingSessionId);
          setSessionReady(true);
          return;
        }
        
        // Use centralized app initializer
        const result = await appInitializer.initialize();
        console.log('✅ [CHAT PAGE] Ready with session:', result.sessionId);
        setSessionReady(true);
      } catch (error) {
        console.error('❌ [CHAT PAGE] Session initialization failed:', error);
        setError('Failed to initialize session. Please refresh the page.');
      }
    }

    initSession();
  }, []);

  // Load available models from API
  useEffect(() => {
    const loadModels = async () => {
      if (!sessionReady) return;
      
      try {
        setLoadingModels(true);
        console.log('🔄 [CHAT PAGE] Loading models from API...');
        const models = await routingApi.getAvailableModels();
        console.log('✅ [CHAT PAGE] Loaded models from API:', models);
        setAvailableModels(models);
      } catch (error) {
        console.warn('⚠️ [CHAT PAGE] Failed to load models from API (this is normal if backend is not running):', error);
        setAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [sessionReady]);

  // Handle speech recognition transcript updates
  useEffect(() => {
    if (speechTranscript) {
      console.log('📝 Speech transcript updated:', speechTranscript);
      setDictationTranscript(speechTranscript);
      setInput(speechTranscript);
    }
  }, [speechTranscript]);

  // Manual input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // When user starts typing, switch to type mode and hide other modes
    if (e.target.value.length > 0 && !isTyping) {
      setIsTyping(true);
      setInteractionMode('type');
    } else if (e.target.value.length === 0 && isTyping) {
      setIsTyping(false);
    }
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
      
      // Make API call through Next.js API route (server-side, no CORS issues)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          device_id: DeviceManager.getDeviceId(),
          session_id: sessionManager.getCachedSession()?.session_id || DeviceManager.getSessionId(),
          conversation_id: chatId,
          request_type: 'anonymous',
          model_id: selectedModel || 'best',
          query_type: selectedAgent === 'search' ? 'general' : selectedAgent === 'research' ? 'analytical' : 'technical',
          interaction_mode: interactionMode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [CHAT PAGE] Response received:', data);
        
        // ✅ Update coins from chat response if available
        if (data.vedika_coins && typeof data.vedika_coins.balance === 'number') {
          console.log('🪙 [CHAT PAGE] Received vedika_coins from response:', data.vedika_coins);
          coinsStore.updateFromChatResponse(data.vedika_coins.balance);
        } else {
          console.warn('⚠️ [CHAT PAGE] No vedika_coins in response, using session refresh as fallback');
          coinsStore.refresh();
        }
        
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

  // Dictation Mode Handlers
  const handleDictationStart = async () => {
    console.log('🎤 Dictation start clicked');
    console.log('Current state:', { isDictating, isVoiceMode, interactionMode });
    
    // Stop any active voice mode
    if (isVoiceMode) {
      handleVoiceStop();
    }
    
    setIsDictating(true);
    setDictationTranscript('');
    setInput('');
    
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
    setInput('');

    voiceService.startVoiceConversation({
      onError: (error: string) => {
        setError(error);
        setIsVoiceMode(false);
      },
      onTranscriptionUpdate: (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setInput(transcript);
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
      setInput('');
      setIsTyping(false);
    }
  };

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
                  {message.timestamp && (
                    <p className="text-xs text-secondary-400 mt-2">
                      {formatTimestamp(message.timestamp)}
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
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {/* Scroll anchor */}
            <div key="messages-end" ref={messagesEndRef} />
          </div>
          
        </div>
      </div>

      {/* Input Form at Bottom */}
      <div className="bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-stone-50 rounded-2xl shadow-2xl border-2 border-primary-300 overflow-visible">
            {/* Input Area */}
            <div className="relative">
              <input
                type="text"
                value={dictationTranscript || input}
                onChange={handleInputChange}
                placeholder={
                  interactionMode === 'dictation' 
                    ? (isDictating ? "Listening... Speak now" : "Click microphone to start dictating")
                    : interactionMode === 'voice'
                    ? (isVoiceMode ? "Voice conversation active..." : "Click to start voice conversation")
                    : "Ask a Follow-up Question"
                }
                className={`w-full px-6 py-6 text-lg bg-stone-50 border-none focus:outline-none focus:ring-0 placeholder:text-secondary-400 placeholder:text-sm h-24 placeholder:text-left ${
                  isDictating && dictationTranscript ? 'text-gray-600' : ''
                }`}
                disabled={isLoading || !sessionReady || isDictating || isVoiceMode}
              />
              {/* Processing animation for dictation and loading */}
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
                        onClick={() => {
                          if (mode.id === 'dictation') {
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

                {/* Submit Button - Always visible */}
                <button
                  type="submit"
                  disabled={!sessionReady || isLoading || !input?.trim()}
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
          const dropdownHeight = 250; // Approximate height of dropdown
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
          
          return createPortal(
            <>
              {/* Backdrop overlay */}
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowModelDropdown(false)} />
              
              {/* Dropdown menu - positioned above or below button based on available space */}
              <div 
                className="fixed w-64 bg-white border border-secondary-200 rounded-lg shadow-xl py-2 z-[9999]" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  [shouldShowAbove ? 'bottom' : 'top']: shouldShowAbove ? `${window.innerHeight - rect.top + 8}px` : `${rect.bottom + 8}px`,
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
