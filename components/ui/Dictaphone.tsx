"use client";

import React from 'react';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

/**
 * A simple dictaphone component that uses the useSpeechRecognition hook.
 */
export default function Dictaphone() {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition();

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!hasRecognitionSupport) {
    return (
      <div style={styles.container}>
        <p style={styles.errorText}>
          Your browser does not support speech recognition. Please try Chrome,
          Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Real-Time Dictation</h2>
      <p style={styles.instructions}>
        Click the button and start speaking.
      </p>
      
      <button 
        onClick={handleToggleListening} 
        style={isListening ? styles.buttonListening : styles.button}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>

      <div style={styles.transcriptContainer}>
        <p style={styles.transcript}>{transcript || "Your transcribed text will appear here..."}</p>
      </div>
    </div>
  );
}

// Basic styling (optional, replace with your project's styling system)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  header: { 
    fontSize: '24px', 
    fontWeight: '600', 
    margin: '0 0 8px 0',
    color: '#333',
  },
  instructions: { 
    fontSize: '16px', 
    color: '#555', 
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  button: { 
    padding: '12px 24px', 
    fontSize: '16px', 
    fontWeight: '500', 
    color: '#fff', 
    backgroundColor: '#007aff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
  },
  buttonListening: { 
    padding: '12px 24px', 
    fontSize: '16px', 
    fontWeight: '500', 
    color: '#fff', 
    backgroundColor: '#ff3b30', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
  },
  transcriptContainer: { 
    width: '100%', 
    minHeight: '150px', 
    marginTop: '20px', 
    padding: '12px', 
    border: '1px solid #ccc', 
    borderRadius: '8px', 
    backgroundColor: '#fff', 
    textAlign: 'left',
  },
  transcript: { 
    fontSize: '16px', 
    color: '#333', 
    margin: 0, 
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  },
  errorText: { 
    fontSize: '16px', 
    color: 'red', 
    fontWeight: '500',
    textAlign: 'center',
  },
};
