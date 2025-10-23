/**
 * Simple Dictation Service
 * Uses browser's built-in Speech Recognition API for immediate, free transcription
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;
  private isInitialized = false;

  constructor() {
    if (this.isInitialized) {
      console.warn('⚠️ Service already initialized, skipping...');
      return;
    }

    console.log('🔧 Constructing SimpleDictationService...');
    
    // Only initialize on client side
    if (typeof window === 'undefined') {
      console.log('🔧 Server-side rendering, skipping initialization');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech Recognition not supported');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      
      // Settings - Try continuous = true to see if it helps
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      console.log('🎤 Speech Recognition settings:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang
      });
      
      this.attachEventHandlers();
      this.isInitialized = true;
      
      console.log('✅ Speech Recognition initialized');
    } catch (error) {
      console.error('❌ Error initializing:', error);
    }
  }

  private attachEventHandlers() {
    if (!this.recognition) return;

    console.log('🔧 Attaching event handlers...');

    this.recognition.onstart = () => {
      console.log('🎤 [onstart] Recognition started');
      this.isListening = true;
    };

    this.recognition.onaudiostart = () => {
      console.log('🎵 [onaudiostart] Audio input started');
    };

    this.recognition.onsoundstart = () => {
      console.log('🔊 [onsoundstart] Sound detected');
    };

    this.recognition.onspeechstart = () => {
      console.log('🗣️ [onspeechstart] Speech detected');
    };

    // ✅ CRITICAL: onresult handler
    this.recognition.onresult = (event: any) => {
      console.log('═══════════════════════════════════════');
      console.log('📝 [onresult] FIRED!!!');
      console.log('📊 Event object:', event);
      console.log('📊 Results:', event.results);
      console.log('📊 Results length:', event.results?.length);
      console.log('📊 ResultIndex:', event.resultIndex);
      
      try {
        let finalTranscript = '';
        let interimTranscript = '';
        
        if (!event.results || event.results.length === 0) {
          console.warn('⚠️ No results in event');
          return;
        }
        
        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const result = event.results[i];
          console.log(`📊 Processing result[${i}]:`, result);
          
          if (!result || !result[0]) {
            console.warn(`⚠️ Empty result at index ${i}`);
            continue;
          }
          
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          const isFinal = result.isFinal;
          
          console.log(`Result[${i}]: "${transcript}" (final: ${isFinal}, confidence: ${confidence})`);
          
          if (isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (interimTranscript) {
          console.log('⏳ INTERIM:', interimTranscript);
          this.onInterimResult?.(interimTranscript);
        }
        
        if (finalTranscript) {
          console.log('✅ FINAL:', finalTranscript);
          this.onFinalResult?.(finalTranscript);
        }
        
        console.log('═══════════════════════════════════════');
      } catch (error) {
        console.error('❌ Error processing result:', error);
      }
    };

    this.recognition.onspeechend = () => {
      console.log('🗣️ [onspeechend] Speech ended, waiting for results...');
    };

    this.recognition.onsoundend = () => {
      console.log('🔊 [onsoundend] Sound ended');
    };

    this.recognition.onaudioend = () => {
      console.log('🎵 [onaudioend] Audio ended, results should fire now...');
    };

    this.recognition.onnomatch = (event: any) => {
      console.warn('═══════════════════════════════════════');
      console.warn('⚠️ [onnomatch] NO MATCH - Speech not recognized!');
      console.warn('💡 Try:');
      console.warn('   - Speaking louder');
      console.warn('   - Speaking more clearly');
      console.warn('   - Using common phrases like "Hello world"');
      console.warn('═══════════════════════════════════════');
    };

    this.recognition.onerror = (event: any) => {
      console.error('═══════════════════════════════════════');
      console.error('❌ [onerror] Error:', event.error);
      
      // Handle "already started" error gracefully
      if (event.error === 'aborted' || event.error.includes('already started')) {
        console.log('💡 Recognition aborted or already running - this is normal');
      }
      
      console.error('═══════════════════════════════════════');
      this.onError?.(event.error);
    };

    this.recognition.onend = () => {
      console.log('═══════════════════════════════════════');
      console.log('🛑 [onend] Recognition ended');
      console.log('═══════════════════════════════════════');
      this.isListening = false;
    };

    console.log('✅ All event handlers attached');
  }

  async startListening(): Promise<boolean> {
    if (!this.recognition) {
      console.error('❌ No recognition object');
      return false;
    }
    
    // ✅ CRITICAL: Check if already listening
    if (this.isListening) {
      console.warn('⚠️ Already listening, stopping first...');
      this.recognition.abort(); // Use abort instead of stop
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for abort
      this.isListening = false;
    }
    
    try {
      console.log('═══════════════════════════════════════');
      console.log('🎤 STARTING DICTATION');
      console.log('═══════════════════════════════════════');
      
      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Microphone granted');
      
      // Start recognition with try-catch
      try {
        this.recognition.start();
        console.log('✅ Recognition started');
        console.log('👂 Speak clearly: "Hello world"');
        console.log('═══════════════════════════════════════');
        
        // Manual test after 3 seconds to verify callback system
        setTimeout(() => {
          console.log('🧪 MANUAL TEST: Triggering result callback after 3 seconds...');
          if (this.onFinalResult) {
            this.onFinalResult('Manual test result: Hello world');
            console.log('✅ Manual test callback triggered');
          } else {
            console.warn('⚠️ onFinalResult callback not set');
          }
        }, 3000);
        
        return true;
      } catch (error: any) {
        if (error.message.includes('already started')) {
          console.log('🔄 Recognition already active, aborting and restarting...');
          this.recognition.abort();
          await new Promise(resolve => setTimeout(resolve, 200));
          this.recognition.start();
          console.log('✅ Recognition restarted');
          return true;
        }
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Failed to start:', error);
      this.onError?.(error instanceof Error ? error.message : 'Failed');
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log('🛑 Stopping recognition...');
      this.recognition.abort(); // Use abort for immediate stop
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
  onSpeechStart?: () => void;
  onEnd?: () => void;
}