/**
 * Dictation Service - Handles speech-to-text functionality
 * Uses browser's Speech Recognition API for dictation mode
 */

export interface DictationResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface DictationCallbacks {
  onResult?: (result: DictationResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class DictationService {
  private recognition: any = null;
  private isListening = false;
  private callbacks: DictationCallbacks = {};

  constructor() {
    // Only setup on client side
    if (typeof window !== 'undefined') {
      this.setupSpeechRecognition();
    }
  }

  private setupSpeechRecognition() {
    // Check if Speech Recognition is supported
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition settings
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      // Handle recognition results
      this.recognition.onresult = (event: any) => {
        console.log('🎤 Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`🎤 Result ${i}:`, { transcript, confidence, isFinal: event.results[i].isFinal });
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Call onResult callback with interim results
        if (interimTranscript && this.callbacks.onResult) {
          console.log('🎤 Sending interim result:', interimTranscript);
          this.callbacks.onResult({
            transcript: interimTranscript,
            isFinal: false,
          });
        }
        
        // Call onResult callback with final results
        if (finalTranscript && this.callbacks.onResult) {
          console.log('🎤 Sending final result:', finalTranscript);
          this.callbacks.onResult({
            transcript: finalTranscript,
            isFinal: true,
            confidence: event.results[event.results.length - 1][0].confidence,
          });
        }
      };
      
      // Handle recognition errors
      this.recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        this.isListening = false;
        
        if (this.callbacks.onError) {
          let errorMessage = 'Speech recognition error occurred';
          
          switch (event.error) {
            case 'aborted':
              console.log('🎤 Recognition was aborted - this is usually normal when stopping');
              // Don't show error for aborted - it's expected when stopping
              return;
            case 'no-speech':
              errorMessage = 'No speech was detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone was found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            case 'service-not-allowed':
              errorMessage = 'Speech recognition service is not available.';
              break;
            case 'bad-grammar':
              errorMessage = 'Speech recognition grammar error.';
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          this.callbacks.onError(errorMessage);
        }
      };
      
      // Handle recognition end
      this.recognition.onend = () => {
        this.isListening = false;
        if (this.callbacks.onEnd) {
          this.callbacks.onEnd();
        }
      };
      
      // Handle recognition start
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        this.isListening = true;
        if (this.callbacks.onStart) {
          this.callbacks.onStart();
        }
      };
    } else {
      console.warn('Speech recognition is not supported in this browser');
    }
  }

  /**
   * Start listening for speech
   */
  public startListening(callbacks?: DictationCallbacks): boolean {
    console.log('🎤 DictationService.startListening called');
    console.log('🎤 Recognition object:', this.recognition);
    console.log('🎤 Is listening:', this.isListening);
    
    if (!this.recognition) {
      console.error('🎤 No recognition object available');
      if (callbacks?.onError) {
        callbacks.onError('Speech recognition is not supported in this browser');
      }
      return false;
    }

    if (this.isListening) {
      console.warn('🎤 Already listening for speech');
      return false;
    }

    // Update callbacks if provided
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    try {
      console.log('🎤 Starting speech recognition...');
      
      // Stop any existing recognition first
      if (this.recognition && this.recognition.state === 'listening') {
        console.log('🎤 Stopping existing recognition first');
        this.recognition.stop();
      }
      
      // Small delay to ensure previous recognition is stopped
      setTimeout(() => {
        try {
          this.recognition.start();
          console.log('🎤 Speech recognition started successfully');
        } catch (startError) {
          console.error('🎤 Failed to start speech recognition after delay:', startError);
          if (this.callbacks.onError) {
            this.callbacks.onError('Failed to start speech recognition');
          }
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('🎤 Failed to start speech recognition:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to start speech recognition');
      }
      return false;
    }
  }

  /**
   * Stop listening for speech
   */
  public stopListening(): boolean {
    console.log('🎤 Stopping speech recognition...');
    console.log('🎤 Recognition object:', this.recognition);
    console.log('🎤 Is listening:', this.isListening);
    
    if (!this.recognition) {
      console.log('🎤 No recognition object to stop');
      return false;
    }

    try {
      if (this.isListening) {
        this.recognition.stop();
        console.log('🎤 Speech recognition stopped');
      } else {
        console.log('🎤 Recognition was not listening, setting state to false');
        this.isListening = false;
      }
      return true;
    } catch (error) {
      console.error('🎤 Failed to stop speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Get recognition state
   */
  public getRecognitionState(): string {
    if (!this.recognition) return 'not-initialized';
    return this.recognition.state || 'unknown';
  }

  /**
   * Check if speech recognition is supported
   */
  public isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * Get available languages (if supported)
   */
  public getSupportedLanguages(): string[] {
    // Default languages - in a real implementation, you might want to fetch this from the API
    return ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'hi-IN'];
  }

  /**
   * Set recognition language
   */
  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
}

// Create a singleton instance
export const dictationService = new DictationService();
