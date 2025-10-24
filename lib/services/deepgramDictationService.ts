/**
 * Deepgram Dictation Service
 * Real-time speech-to-text using Deepgram SDK
 */

import { 
  useDeepgram, 
  LiveConnectionState, 
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent 
} from '@/contexts/DeepgramContext';
import { 
  useMicrophone, 
  MicrophoneState, 
  MicrophoneEvents 
} from '@/contexts/MicrophoneContext';
import { useEffect, useRef, useState } from 'react';

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
  
  const { connection, connectToDeepgram, disconnectFromDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone, microphoneState } = useMicrophone();
  
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  // Setup microphone on mount
  useEffect(() => {
    setupMicrophone();
  }, [setupMicrophone]);

  // Connect to Deepgram when microphone is ready
  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
      });
    }
  }, [microphoneState, connectToDeepgram]);

  // Handle transcription events
  useEffect(() => {
    if (!connection) return;

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      console.log("Deepgram transcript:", thisCaption);
      
      if (thisCaption !== "") {
        setTranscript(thisCaption);
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setTranscript('');
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    }

    return () => {
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      clearTimeout(captionTimeout.current);
    };
  }, [connection, connectionState]);

  // Handle microphone data streaming
  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      startMicrophone();
    }

    return () => {
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
    };
  }, [microphone, connection, connectionState, startMicrophone]);

  // Keep connection alive
  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
  }, [microphoneState, connectionState, connection]);

  const startListening = async () => {
    if (microphoneState === MicrophoneState.Ready && connectionState === LiveConnectionState.OPEN) {
      setIsListening(true);
      setTranscript('');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    stopMicrophone();
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
