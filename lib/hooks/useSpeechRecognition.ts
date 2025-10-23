"use client";

import { useEffect, useState, useRef } from 'react';

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
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (recognitionRef.current && isListening) { // Ensure stop is called only if it was listening
           recognitionRef.current.stop();
      }
      setIsListening(false);
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

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(""); // Clear previous transcript
      try {
           recognitionRef.current.start();
           setIsListening(true);
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
