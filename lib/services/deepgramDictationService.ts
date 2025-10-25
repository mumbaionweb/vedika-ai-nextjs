/**
 * Deepgram Dictation Service
 * Real-time speech-to-text using backend API token
 */

import { useEffect, useRef, useState } from 'react';
import { config } from '@/lib/config';

export interface DeepgramDictationService {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  isSupported: () => boolean;
}

export const useDeepgramDictation = (): DeepgramDictationService => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;
  const reconnectAttemptsRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecordingRef.current) {
      if ((mediaRecorderRef.current as any).audioContext) {
        (mediaRecorderRef.current as any).audioContext.close();
      }
      isRecordingRef.current = false;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsListening(false);
    reconnectAttemptsRef.current = 0;
  };

  const startListening = async () => {
    if (isListening) {
      console.warn('⚠️ Already listening');
      return;
    }

    try {
      console.log('🎤 Starting Deepgram transcription...');
      
      // 1. Get Deepgram API key from backend
      const response = await fetch(`${config.api.baseUrl}/deepgram/token`);
      const data = await response.json();
      
      if (!data.apiKey) {
        throw new Error('Failed to get Deepgram API key from backend');
      }
      
      console.log('✅ Got API key from backend');
      
      // 2. Get microphone with noise cancellation
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });
      
      mediaStreamRef.current = mediaStream;
      console.log('✅ Microphone access granted with noise cancellation');
      
      // 3. Connect to Deepgram WebSocket
      const wsUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        model: 'nova-2',
        language: 'en-US',
        punctuate: 'true',
        interim_results: 'true',
        endpointing: '300',
        smart_format: 'true'
      });
      
      const socket = new WebSocket(wsUrl, ['token', data.apiKey]);
      socketRef.current = socket;
      
      // 4. Setup WebSocket event handlers
      socket.onopen = () => {
        console.log('✅ Connected to Deepgram');
        startAudioStreaming();
        
        // Start keep-alive mechanism to prevent connection drops
        keepAliveIntervalRef.current = setInterval(() => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Send a ping to keep connection alive
            socketRef.current.send(JSON.stringify({ type: 'KeepAlive' }));
            console.log('💓 Keep-alive sent');
          }
        }, 30000); // Send every 30 seconds
      };
      
      socket.onmessage = (message) => {
        try {
          console.log('📨 Received message from Deepgram:', message.data);
          const data = JSON.parse(message.data);
          
          // Log the full response structure for debugging
          console.log('📋 Deepgram response structure:', data);
          
          if (data.channel?.alternatives?.[0]?.transcript) {
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final;
            const confidence = data.channel.alternatives[0].confidence;
            
            console.log(
              isFinal ? '✅ Final:' : '⏳ Interim:', 
              transcript,
              `(${(confidence * 100).toFixed(1)}%)`
            );
            
            setTranscript(transcript);
            
            // Don't auto-stop - let user control when to stop
            // This makes it feel more natural and continuous
          } else {
            console.log('📝 No transcript in response:', data);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          console.error('❌ Raw message data:', message.data);
        }
      };
      
      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('❌ WebSocket error details:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget
        });
        setError('WebSocket connection failed');
        cleanup();
      };
      
      socket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        console.log('🔌 WebSocket close details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // Log specific close codes for debugging
        switch (event.code) {
          case 1000:
            console.log('✅ Normal closure');
            break;
          case 1001:
            console.log('🚪 Going away');
            break;
          case 1002:
            console.log('❌ Protocol error');
            break;
          case 1003:
            console.log('❌ Unsupported data');
            break;
          case 1005:
            console.log('❌ No status received (connection lost)');
            // Attempt reconnection for connection lost
            if (isListening && reconnectAttemptsRef.current < maxReconnectAttempts) {
              attemptReconnection();
            }
            break;
          case 1006:
            console.log('❌ Abnormal closure');
            // Attempt reconnection for abnormal closure
            if (isListening && reconnectAttemptsRef.current < maxReconnectAttempts) {
              attemptReconnection();
            }
            break;
          case 1007:
            console.log('❌ Invalid frame payload data');
            break;
          case 1008:
            console.log('❌ Policy violation');
            break;
          case 1009:
            console.log('❌ Message too big');
            break;
          case 1010:
            console.log('❌ Missing extension');
            break;
          case 1011:
            console.log('❌ Internal error');
            break;
          case 1012:
            console.log('❌ Service restart');
            break;
          case 1013:
            console.log('❌ Try again later');
            break;
          case 1014:
            console.log('❌ Bad gateway');
            break;
          case 1015:
            console.log('❌ TLS handshake');
            break;
          default:
            console.log('❓ Unknown close code:', event.code);
        }
        
        // Only cleanup if we're not attempting reconnection
        if (reconnectAttemptsRef.current >= maxReconnectAttempts || 
            (event.code !== 1005 && event.code !== 1006)) {
          cleanup();
        }
      };
      
      setIsListening(true);
      setError(null);
      
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      setError(error instanceof Error ? error.message : 'Failed to start');
      cleanup();
    }
  };

  const attemptReconnection = async () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      cleanup();
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
    
    console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms...`);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        // Get fresh API key
        const response = await fetch(`${config.api.baseUrl}/deepgram/token`);
        const data = await response.json();
        
        if (!data.apiKey) {
          throw new Error('Failed to get fresh API key');
        }
        
        // Create new WebSocket connection
        const wsUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
          encoding: 'linear16',
          sample_rate: '16000',
          channels: '1',
          model: 'nova-2',
          language: 'en-US',
          punctuate: 'true',
          interim_results: 'true',
          endpointing: '300',
          smart_format: 'true'
        });
        
        const newSocket = new WebSocket(wsUrl, ['token', data.apiKey]);
        
        // Copy event handlers from the original socket
        newSocket.onopen = () => {
          console.log('✅ Reconnected to Deepgram');
          socketRef.current = newSocket;
          reconnectAttemptsRef.current = 0; // Reset on successful reconnection
        };
        
        // Only assign handlers if they exist
        if (socketRef.current?.onmessage) {
          newSocket.onmessage = socketRef.current.onmessage;
        }
        if (socketRef.current?.onerror) {
          newSocket.onerror = socketRef.current.onerror;
        }
        if (socketRef.current?.onclose) {
          newSocket.onclose = socketRef.current.onclose;
        }
        
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        attemptReconnection(); // Try again
      }
    }, delay);
  };

  const startAudioStreaming = () => {
    if (!mediaStreamRef.current || !socketRef.current) {
      console.error('❌ No media stream or socket');
      return;
    }

    try {
      // Create AudioContext for proper audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      
      // Create a ScriptProcessorNode to process audio in real-time
      // Using larger buffer size for more stable processing
      const processor = audioContext.createScriptProcessor(8192, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0);
          
          // Convert Float32 to Int16 PCM (Deepgram expects linear16)
          const pcmData = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          // Send PCM data to Deepgram
          socketRef.current.send(pcmData.buffer);
          console.log('📤 Sent audio chunk:', pcmData.length, 'samples');
        }
      };
      
      // Connect audio processing chain
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store references for cleanup
      (mediaRecorderRef as any).current = { audioContext, processor };
      isRecordingRef.current = true;
      
      console.log('✅ Audio streaming started (PCM format, 16kHz)');
      
    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error);
      setError('Audio streaming failed');
      cleanup();
    }
  };

  const stopListening = () => {
    console.log('🛑 Stopping transcription...');
    
    if (mediaRecorderRef.current && isRecordingRef.current) {
      if ((mediaRecorderRef.current as any).audioContext) {
        (mediaRecorderRef.current as any).audioContext.close();
      }
      isRecordingRef.current = false;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    cleanup();
    console.log('✅ Transcription stopped');
  };

  const isSupported = () => {
    return typeof window !== 'undefined' && 
           'MediaRecorder' in window && 
           'getUserMedia' in navigator.mediaDevices;
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported
  };
};