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
      console.log('🎤 SpeechRecognition constructor:', SpeechRecognition);
      console.log('🎤 Available on window:', {
        SpeechRecognition: !!window.SpeechRecognition,
        webkitSpeechRecognition: !!window.webkitSpeechRecognition
      });
      
      this.recognition = new SpeechRecognition();
      console.log('🎤 Recognition instance created:', this.recognition);
      console.log('🎤 Recognition properties:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang,
        maxAlternatives: this.recognition.maxAlternatives
      });
      
      // Configure recognition settings
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      console.log('🎤 Recognition configured with settings');
      
      // Handle recognition results
      this.recognition.onresult = (event: any) => {
        console.log('🎤 Speech recognition result:', event);
        console.log('🎤 Event details:', {
          resultIndex: event.resultIndex,
          resultsLength: event.results.length,
          results: event.results
        });
        
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
        
        console.log('🎤 Transcripts:', { finalTranscript, interimTranscript });
        
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
      
      // Add debugging for when no speech is detected
      this.recognition.onnomatch = (event: any) => {
        console.log('🎤 No speech match detected:', event);
        console.log('🎤 This means speech was detected but not recognized');
        console.log('🎤 Event details:', {
          type: event.type,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted
        });
      };
      
      // Add debugging for audio events
      this.recognition.onaudiostart = () => {
        console.log('🎤 Audio input started');
      };
      
      this.recognition.onaudioend = () => {
        console.log('🎤 Audio input ended');
      };
      
      this.recognition.onsoundstart = () => {
        console.log('🎤 Sound detected');
      };
      
      this.recognition.onsoundend = () => {
        console.log('🎤 Sound ended');
      };
      
      this.recognition.onspeechstart = () => {
        console.log('🎤 Speech detected');
      };
      
      this.recognition.onspeechend = () => {
        console.log('🎤 Speech ended');
        console.log('🎤 Speech ended - checking for results...');
        
        // Add a small delay to see if results come after speech ends
        setTimeout(() => {
          console.log('🎤 Speech ended - checking recognition state:', {
            isListening: this.isListening,
            recognitionState: this.recognition.state
          });
        }, 100);
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
        console.log('🎤 Speech recognition ended');
        console.log('🎤 Recognition state after end:', this.recognition.state);
        console.log('🎤 Recognition ended - checking if any results were processed');
        this.isListening = false;
        if (this.callbacks.onEnd) {
          this.callbacks.onEnd();
        }
      };
      
      // Handle recognition start
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        console.log('🎤 Recognition state after start:', this.recognition.state);
        console.log('🎤 Recognition properties on start:', {
          continuous: this.recognition.continuous,
          interimResults: this.recognition.interimResults,
          lang: this.recognition.lang,
          maxAlternatives: this.recognition.maxAlternatives
        });
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
      console.log('🎤 Checking microphone permissions...');
      
      // Check microphone permissions
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
          console.log('🎤 Microphone permission:', result.state);
        }).catch((err) => {
          console.log('🎤 Could not check microphone permissions:', err);
        });
      }
      
      // Test microphone access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🎤 Testing microphone access...');
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            console.log('🎤 Microphone access granted, stream:', stream);
            // Stop the stream immediately as we just wanted to test access
            stream.getTracks().forEach(track => track.stop());
          })
          .catch((error) => {
            console.error('🎤 Microphone access denied:', error);
          });
      }
      
      // Stop any existing recognition first
      if (this.recognition && this.recognition.state === 'listening') {
        console.log('🎤 Stopping existing recognition first');
        this.recognition.stop();
      }
      
      // Small delay to ensure previous recognition is stopped
      setTimeout(() => {
        try {
          console.log('🎤 Attempting to start recognition...');
          console.log('🎤 Recognition before start:', {
            state: this.recognition.state,
            readyState: (this.recognition as any).readyState,
            continuous: this.recognition.continuous,
            interimResults: this.recognition.interimResults
          });
          
          this.recognition.start();
          console.log('🎤 Speech recognition started successfully');
          console.log('🎤 Recognition after start:', {
            state: this.recognition.state,
            readyState: (this.recognition as any).readyState
          });
          
          // Add timeout to detect if recognition is hanging
          setTimeout(() => {
            if (this.isListening && this.recognition.state === 'listening') {
              console.log('🎤 Recognition still listening after 10 seconds');
              console.log('🎤 Recognition state:', this.recognition.state);
              console.log('🎤 Is listening flag:', this.isListening);
            }
          }, 10000);
          
          // Add periodic state checking
          const stateCheckInterval = setInterval(() => {
            if (this.isListening) {
              console.log('🎤 Recognition state check:', this.recognition.state);
              console.log('🎤 Recognition properties check:', {
                state: this.recognition.state,
                readyState: (this.recognition as any).readyState,
                isListening: this.isListening
              });
            } else {
              clearInterval(stateCheckInterval);
            }
          }, 2000);
          
          // Add a test to see if recognition is working
          setTimeout(() => {
            if (this.isListening) {
              console.log('🎤 Testing recognition after 3 seconds...');
              console.log('🎤 Recognition still active:', this.recognition);
              console.log('🎤 Recognition state:', this.recognition.state);
              
              // Try to manually trigger a test
              if (this.callbacks.onResult) {
                console.log('🎤 Testing callback manually...');
                this.callbacks.onResult({
                  transcript: 'TEST - Recognition is working',
                  isFinal: true,
                  confidence: 0.9
                });
              }
            }
          }, 3000);
          
          // Add a test to see if recognition is detecting speech
          setTimeout(() => {
            if (this.isListening) {
              console.log('🎤 Testing speech detection after 5 seconds...');
              console.log('🎤 Recognition properties:', {
                continuous: this.recognition.continuous,
                interimResults: this.recognition.interimResults,
                lang: this.recognition.lang,
                maxAlternatives: this.recognition.maxAlternatives
              });
              
              // Check if there are any issues with the recognition
              console.log('🎤 Recognition object keys:', Object.keys(this.recognition));
              console.log('🎤 Recognition object:', this.recognition);
              
              // Try to access recognition properties directly
              console.log('🎤 Direct property access:', {
                continuous: this.recognition.continuous,
                interimResults: this.recognition.interimResults,
                lang: this.recognition.lang,
                maxAlternatives: this.recognition.maxAlternatives,
                grammars: this.recognition.grammars,
                serviceURI: (this.recognition as any).serviceURI
              });
              
              // Check if recognition has any methods
              console.log('🎤 Recognition methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.recognition)));
              
              // Try to check if recognition is actually detecting audio
              console.log('🎤 Recognition status check:', {
                isListening: this.isListening,
                recognitionExists: !!this.recognition,
                hasOnResult: !!this.recognition.onresult,
                hasOnStart: !!this.recognition.onstart,
                hasOnEnd: !!this.recognition.onend,
                hasOnError: !!this.recognition.onerror
              });
              
              // Test if we can manually trigger speech detection
              console.log('🎤 Testing manual speech detection...');
              try {
                // Check if recognition is already running before trying to restart
                console.log('🎤 Checking if recognition can be restarted...');
                if (this.isListening) {
                  console.log('🎤 Recognition is already running, skipping restart test');
                } else {
                  console.log('🎤 Recognition not running, attempting to start...');
                  this.recognition.start();
                  console.log('🎤 Recognition started for testing');
                }
              } catch (restartError) {
                console.error('🎤 Failed to restart recognition:', restartError);
              }
              
              // Add additional debugging for speech detection
              console.log('🎤 Speech detection debugging:');
              console.log('🎤 - Try speaking clearly into your microphone');
              console.log('🎤 - Make sure your microphone is not muted');
              console.log('🎤 - Check if other applications can hear your microphone');
              console.log('🎤 - Try speaking louder or closer to the microphone');
            }
          }, 5000);
          
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
    
    // Try different ways to get the state
    const state = this.recognition.state || 
                  (this.recognition as any).readyState || 
                  (this.isListening ? 'listening' : 'not-listening');
    
    console.log('🎤 Getting recognition state:', {
      state: this.recognition.state,
      readyState: (this.recognition as any).readyState,
      isListening: this.isListening,
      finalState: state
    });
    
    return state;
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
