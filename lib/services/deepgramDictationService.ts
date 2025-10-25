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
      mediaRecorderRef.current.stop();
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
          const data = JSON.parse(message.data);
          
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
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection failed');
        cleanup();
      };
      
      socket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
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
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(event.data);
          console.log('📤 Sent audio chunk:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
      };
      
      mediaRecorder.onerror = (error) => {
        console.error('❌ MediaRecorder error:', error);
        setError('Recording failed');
        cleanup();
      };
      
      // Start recording - send chunks every 250ms for real-time
      mediaRecorder.start(250);
      isRecordingRef.current = true;
      
      console.log('✅ Audio streaming started (chunks every 250ms)');
      
    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error);
      setError('Audio streaming failed');
      cleanup();
    }
  };

  const stopListening = () => {
    console.log('🛑 Stopping transcription...');
    
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
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