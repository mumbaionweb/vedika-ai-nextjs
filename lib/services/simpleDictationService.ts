/**
 * Simple Dictation Service
 * Uses browser's built-in Speech Recognition API for immediate, free transcription
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      
      console.log('✅ Speech Recognition initialized');
      
      this.recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
      };
      
      this.recognition.onresult = (event: any) => {
        console.log('📝 Got speech recognition result:', event);
        
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('✅ Final transcript:', finalTranscript);
          } else {
            interimTranscript += transcript;
            console.log('⏳ Interim transcript:', interimTranscript);
          }
        }
        
        if (interimTranscript) {
          this.onInterimResult?.(interimTranscript);
        }
        
        if (finalTranscript) {
          this.onFinalResult?.(finalTranscript);
        }
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        this.onError?.(event.error);
      };
      
      this.recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        this.isListening = false;
      };
    } else {
      console.error('❌ Speech Recognition not supported');
    }
  }

  async startListening(): Promise<boolean> {
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
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}
