"use client";

import { useEffect, useState, useRef } from 'react';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onnomatch: (() => void) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Define the shape of the hook's return value
interface UseSpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
}

// Check if the browser supports SpeechRecognition
const hasSupport = () =>
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

/**
 * A custom React hook to manage speech recognition.
 *
 * @returns {UseSpeechRecognitionHook} An object containing the transcript,
 * listening state, start/stop functions, and support status.
 */
export const useSpeechRecognition = (): UseSpeechRecognitionHook => {
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!hasSupport()) {
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Set desired language

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 Speech recognition result received:', event.results.length, 'results');
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;
        
        console.log(`Result ${i}: "${transcript}" (final: ${result.isFinal}, confidence: ${confidence})`);
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      const combinedTranscript = finalTranscript + interimTranscript;
      console.log('📝 Setting transcript:', combinedTranscript);
      setTranscript(combinedTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          console.log('🔇 No speech detected, continuing to listen...');
          // Don't stop for no-speech errors, just continue listening
          break;
        case 'audio-capture':
          console.error('🎤 Audio capture error - microphone may be busy or not available');
          setIsListening(false);
          break;
        case 'not-allowed':
          console.error('🚫 Microphone permission denied');
          setIsListening(false);
          break;
        case 'network':
          console.error('🌐 Network error');
          setIsListening(false);
          break;
        default:
          console.error('❌ Unknown error:', event.error);
          setIsListening(false);
      }
    };
    
    recognition.onend = () => {
       // Check the ref directly and the state, as state updates might be async
      if (recognitionRef.current && isListening) {
          // If it ended prematurely (browser timeout, network issue) and we still intended to listen, restart it.
          // Check if the component is still mounted implicitly via effect cleanup.
          console.log("Recognition ended, restarting due to continuous mode.");
          recognitionRef.current.start(); 
      } else {
          // If stopListening was called, or if it ended naturally after stopListening
          setIsListening(false); 
      }
    };

    // Cleanup function: ensure recognition is stopped when component unmounts.
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]); // Re-run effect dependencies carefully. Added isListening to manage restart logic.

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(""); // Clear previous transcript
      
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone permission granted');
        
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      } catch (error) {
        console.error("Error starting recognition:", error);
        setIsListening(false); // Ensure state is correct if start fails
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
       // Set state *before* stopping, so onend handler knows it was intentional
       setIsListening(false); 
       recognitionRef.current.stop();
    }
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport: hasSupport(),
  };
};
