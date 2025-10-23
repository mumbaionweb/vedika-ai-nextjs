/**
 * Simple Dictation Service
 * Uses browser's built-in Speech Recognition API for immediate, free transcription
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Keep listening until manually stopped
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      console.log('🎤 Speech Recognition settings:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang,
        maxAlternatives: this.recognition.maxAlternatives
      });
      
      console.log('✅ Speech Recognition initialized');
      
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        this.onStart?.();
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
      
      this.recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        console.error('❌ Error details:', event);
        this.onError?.(event.error);
      };
      
      this.recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        this.isListening = false;
        this.onEnd?.();
        
        // Restart recognition if it ended unexpectedly (for continuous mode)
        if (this.recognition && !this.recognition.continuous) {
          console.log('🔄 Restarting recognition...');
          setTimeout(() => {
            if (this.isListening) {
              this.recognition.start();
            }
          }, 100);
        }
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
      
      // Start recognition
      this.recognition.start();
      this.isListening = true;
      
      console.log('✅ Speech recognition started successfully');
      
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
    }
  }

  getIsListening(): boolean {
    return this.isListening;
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
  onEnd?: () => void;
}
