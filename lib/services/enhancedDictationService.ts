/**
 * Enhanced dictation service with noise cancellation
 */
export class EnhancedDictationService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (typeof window === 'undefined') {
      console.warn('🎤 Running on server side, skipping speech recognition initialization');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('🎤 Speech Recognition not supported, using fallback');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Enhanced error handling
    this.recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'aborted':
          console.log('🎤 Recognition aborted - this is normal when stopping');
          break;
        case 'not-allowed':
          console.error('🎤 Microphone permission denied');
          if (this.onError) this.onError('Microphone permission denied');
          break;
        case 'no-speech':
          console.warn('🎤 No speech detected');
          if (this.onError) this.onError('No speech detected');
          break;
        case 'audio-capture':
          console.error('🎤 Audio capture failed');
          if (this.onError) this.onError('Audio capture failed');
          break;
        case 'network':
          console.error('🎤 Network error');
          if (this.onError) this.onError('Network error');
          break;
        default:
          console.error('🎤 Unknown error:', event.error);
          if (this.onError) this.onError(`Unknown error: ${event.error}`);
      }
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && this.onInterimResult) {
        this.onInterimResult(interimTranscript);
      }

      if (finalTranscript && this.onFinalResult) {
        this.onFinalResult(finalTranscript);
      }
    };

    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };
  }

  async startListening(): Promise<boolean> {
    if (!this.recognition) {
      console.error('🎤 Speech Recognition not available');
      return false;
    }

    try {
      // Request microphone with noise cancellation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,  // Browser noise cancellation
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      console.log('🎤 Microphone access granted with noise cancellation');
      
      // Start speech recognition
      this.recognition.start();
      this.isListening = true;
      
      return true;

    } catch (error) {
      console.error('🎤 Failed to start listening:', error);
      if (this.onError) this.onError('Failed to start listening');
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }
}
