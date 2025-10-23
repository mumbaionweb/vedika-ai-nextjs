/**
 * Simple Dictation Service
 * Uses browser's built-in Speech Recognition API for immediate, free transcription
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;
  private hasStartedListening = false;

  constructor() {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // Process speech and stop after each result
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      console.log('🎤 Speech Recognition settings:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang,
        maxAlternatives: this.recognition.maxAlternatives
      });
      
      // Try different language settings
      this.recognition.lang = 'en-US';
      console.log('🎤 Set language to en-US');
      
      console.log('✅ Speech Recognition initialized');
      
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        this.hasStartedListening = true;
        this.onStart?.();
        this.onSpeechStart?.();
      };
      
      this.recognition.onresult = (event: any) => {
        console.log('📝 Got speech recognition result:', event);
        console.log('📝 Result details:', {
          resultIndex: event.resultIndex,
          resultsLength: event.results.length,
          results: event.results
        });
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          console.log(`📝 Result ${i}:`, {
            transcript,
            confidence,
            isFinal: result.isFinal
          });
          
          if (result.isFinal) {
            finalTranscript += transcript;
            console.log('✅ Final transcript:', finalTranscript);
          } else {
            interimTranscript += transcript;
            console.log('⏳ Interim transcript:', interimTranscript);
          }
        }
        
        if (interimTranscript && interimTranscript.trim()) {
          console.log('📤 Calling onInterimResult with:', interimTranscript);
          this.onInterimResult?.(interimTranscript);
        } else if (interimTranscript) {
          console.log('📤 Calling onInterimResult with empty text, showing Processing...');
          this.onInterimResult?.('');
        }
        
        if (finalTranscript && finalTranscript.trim()) {
          console.log('📤 Calling onFinalResult with:', finalTranscript);
          this.onFinalResult?.(finalTranscript);
        }
      };
      
      // Add debugging to check if onresult is being called at all
      console.log('🔍 Setting up onresult listener...');
      setTimeout(() => {
        console.log('🔍 Checking if onresult was called after 8 seconds...');
        if (this.onInterimResult) {
          console.log('🧪 TEST: Manually calling onInterimResult to test callback system...');
          this.onInterimResult('Manual test result');
        }
      }, 8000);
      
      this.recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        console.error('❌ Error details:', event);
        this.onError?.(event.error);
      };
      
      this.recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        console.log('🛑 End reason - continuous mode:', this.recognition.continuous);
        console.log('🛑 End reason - was listening:', this.isListening);
        this.isListening = false;
        this.hasStartedListening = false;
        this.onEnd?.();
      };

      // Add more event listeners for debugging
      this.recognition.onaudiostart = () => {
        console.log('🎵 Audio input started');
      };
      
      this.recognition.onaudioend = () => {
        console.log('🎵 Audio input ended');
      };
      
      this.recognition.onsoundstart = () => {
        console.log('🔊 Sound detected');
      };
      
      this.recognition.onsoundend = () => {
        console.log('🔊 Sound ended');
      };
      
      this.recognition.onspeechstart = () => {
        console.log('🗣️ Speech detected');
      };
      
      this.recognition.onspeechend = () => {
        console.log('🗣️ Speech ended');
      };
      
      this.recognition.onnomatch = () => {
        console.log('❓ No speech match found');
      };
      
      // Add timeout debugging
      setTimeout(() => {
        console.log('⏰ 5 seconds elapsed - checking recognition state:', {
          isListening: this.isListening,
          hasStartedListening: this.hasStartedListening,
          recognition: this.recognition ? 'exists' : 'null'
        });
      }, 5000);
      
      setTimeout(() => {
        console.log('⏰ 10 seconds elapsed - checking recognition state:', {
          isListening: this.isListening,
          hasStartedListening: this.hasStartedListening,
          recognition: this.recognition ? 'exists' : 'null'
        });
      }, 10000);
    } else {
      console.error('❌ Speech Recognition not supported');
    }
  }

  async startListening(): Promise<boolean> {
    if (typeof window === 'undefined') {
      console.error('❌ Speech Recognition not available on server side');
      return false;
    }
    
    if (!this.recognition) {
      console.error('❌ Speech Recognition not available');
      return false;
    }
    
    if (this.isListening) {
      console.warn('⚠️ Already listening');
      return false;
    }
    
    try {
      // Request microphone with noise cancellation
      console.log('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('✅ Microphone access granted');
      
      // Get audio settings
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('🎤 Audio settings:', settings);
      
      // Stop any existing recognition first
      if (this.recognition && this.isListening) {
        console.log('🛑 Stopping existing recognition before starting new one...');
        this.recognition.stop();
        this.isListening = false;
        this.hasStartedListening = false;
        
        // Wait a bit for the recognition to fully stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Start recognition
      console.log('🎤 About to start recognition...');
      this.recognition.start();
      this.isListening = true;
      
      console.log('✅ Speech recognition started successfully');
      
      // Add debugging to check if recognition is actually running
      setTimeout(() => {
        console.log('🔍 Recognition check after 1 second:', {
          isListening: this.isListening,
          hasStartedListening: this.hasStartedListening,
          recognitionState: this.recognition ? 'exists' : 'null'
        });
      }, 1000);
      
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      this.onError?.(error instanceof Error ? error.message : 'Failed to start');
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log('🛑 Stopping speech recognition...');
      this.recognition.stop();
      this.isListening = false;
      this.hasStartedListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getStatus(): 'waiting' | 'listening' | 'processing' | 'idle' {
    if (!this.isListening) return 'idle';
    if (!this.hasStartedListening) return 'waiting';
    if (this.hasStartedListening) return 'listening';
    return 'idle';
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onSpeechStart?: () => void;
  onEnd?: () => void;
}
