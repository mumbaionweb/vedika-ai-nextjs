/**
 * Simple Dictation Service - Minimal Working Version
 * Last attempt before switching to AWS SDK
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    // Simple event handlers
    this.recognition.onstart = () => {
      console.log('🎤 Recognition started');
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      console.log('📝 Result received:', event.results);
      let finalTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          this.onInterimResult?.(result[0].transcript);
        }
      }
      
      if (finalTranscript) {
        this.onFinalResult?.(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Recognition error:', event.error);
      this.onError?.(event.error);
    };

    this.recognition.onend = () => {
      console.log('🛑 Recognition ended');
      this.isListening = false;
    };
  }

  async startListening(): Promise<boolean> {
    if (!this.recognition) return false;
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ Failed to start:', error);
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
    if (typeof window === 'undefined') return false;
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