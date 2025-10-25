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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
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
            
            if (isFinal) {
              // Auto-stop after final result
              setTimeout(() => {
                stopListening();
              }, 1000);
            }
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
            break;
          case 1006:
            console.log('❌ Abnormal closure');
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
        
        cleanup();
      };
      
      setIsListening(true);
      setError(null);
      
    } catch (error) {
      console.error('❌ Failed to start transcription:', error);
      setError(error instanceof Error ? error.message : 'Failed to start');
      cleanup();
    }
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
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
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