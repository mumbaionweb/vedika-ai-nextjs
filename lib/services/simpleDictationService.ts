/**
 * Simple Dictation Service
 * Uses browser's built-in Speech Recognition API for immediate, free transcription
 */

export class SimpleDictationService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    console.log('🔧 Constructing SimpleDictationService...');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('❌ Speech Recognition not supported');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      
      // Settings MUST be set BEFORE any event handlers
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      console.log('🎤 Speech Recognition settings:', {
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        lang: this.recognition.lang,
        maxAlternatives: this.recognition.maxAlternatives
      });
      
      // Attach ALL event handlers immediately
      this.attachEventHandlers();
      
      console.log('✅ Speech Recognition initialized');
    } catch (error) {
      console.error('❌ Error initializing Speech Recognition:', error);
    }
  }

  private attachEventHandlers() {
    if (!this.recognition) {
      console.error('❌ No recognition object to attach handlers to');
      return;
    }

    console.log('🔧 Attaching event handlers...');

    // CRITICAL: onstart
    this.recognition.onstart = () => {
      console.log('🎤 [EVENT] Speech recognition started');
    };

    // CRITICAL: onaudiostart
    this.recognition.onaudiostart = () => {
      console.log('🎵 [EVENT] Audio input started');
    };

    // CRITICAL: onsoundstart
    this.recognition.onsoundstart = () => {
      console.log('🔊 [EVENT] Sound detected');
    };

    // CRITICAL: onspeechstart
    this.recognition.onspeechstart = () => {
      console.log('🗣️ [EVENT] Speech detected');
    };

    // ✅✅✅ MOST CRITICAL: onresult
    this.recognition.onresult = (event: any) => {
      console.log('═══════════════════════════════════════');
      console.log('📝📝📝 [EVENT] ON RESULT FIRED!!!');
      console.log('📊 Event object:', event);
      console.log('📊 Results:', event.results);
      console.log('📊 Results length:', event.results?.length);
      
      if (!event.results) {
        console.error('❌ No results in event!');
        return;
      }

      try {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || !result[0]) {
            console.warn('⚠️ Empty result at index', i);
            continue;
          }
          
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          const isFinal = result.isFinal;
          
          console.log(`📌 Result[${i}]:`, {
            transcript,
            confidence,
            isFinal
          });
          
          if (isFinal) {
            finalTranscript += transcript;
            console.log('✅ FINAL TRANSCRIPT:', finalTranscript);
          } else {
            interimTranscript += transcript;
            console.log('⏳ INTERIM TRANSCRIPT:', interimTranscript);
          }
        }
        
        console.log('Final:', finalTranscript, 'Interim:', interimTranscript);
        
        // Call callbacks with safety checks
        if (interimTranscript) {
          console.log('📤 Calling onInterimResult with:', interimTranscript);
          if (typeof this.onInterimResult === 'function') {
            this.onInterimResult(interimTranscript);
          } else {
            console.warn('⚠️ onInterimResult is not a function');
          }
        }
        
        if (finalTranscript) {
          console.log('📤 Calling onFinalResult with:', finalTranscript);
          if (typeof this.onFinalResult === 'function') {
            this.onFinalResult(finalTranscript);
          } else {
            console.warn('⚠️ onFinalResult is not a function');
          }
        }
        
        console.log('═══════════════════════════════════════');
      } catch (error) {
        console.error('❌ Error in onresult handler:', error);
      }
    };

    // CRITICAL: onspeechend
    this.recognition.onspeechend = () => {
      console.log('🗣️ [EVENT] Speech ended');
      console.log('💡 Waiting for results...');
    };

    // CRITICAL: onsoundend
    this.recognition.onsoundend = () => {
      console.log('🔊 [EVENT] Sound ended');
    };

    // CRITICAL: onaudioend
    this.recognition.onaudioend = () => {
      console.log('🎵 [EVENT] Audio input ended');
      console.log('💡 Audio processing complete, results should fire now...');
    };

    // CRITICAL: onnomatch
    this.recognition.onnomatch = (event: any) => {
      console.warn('⚠️ [EVENT] No match found');
      console.warn('📊 Event:', event);
      console.warn('💡 Speech was detected but not recognized');
    };

    // CRITICAL: onerror
    this.recognition.onerror = (event: any) => {
      console.error('═══════════════════════════════════════');
      console.error('❌ [EVENT] Recognition error:', event.error);
      console.error('📊 Error event:', event);
      console.error('═══════════════════════════════════════');
      
      if (typeof this.onError === 'function') {
        this.onError(event.error);
      }
    };

    // CRITICAL: onend
    this.recognition.onend = () => {
      console.log('═══════════════════════════════════════');
      console.log('🛑 [EVENT] Recognition ended');
      console.log('═══════════════════════════════════════');
      this.isListening = false;
    };

    // Verify handlers are attached
    console.log('✅ Event handlers attached. Verification:', {
      hasOnResult: typeof this.recognition.onresult === 'function',
      hasOnError: typeof this.recognition.onerror === 'function',
      hasOnEnd: typeof this.recognition.onend === 'function'
    });
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
      console.log('═══════════════════════════════════════');
      console.log('🎤 STARTING DICTATION');
      console.log('═══════════════════════════════════════');
      
      console.log('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      console.log('✅ Microphone access granted');
      
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log('🎤 Audio settings:', settings);
      
      // Final verification before start
      console.log('🔍 Pre-start verification:', {
        hasRecognition: !!this.recognition,
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
        hasOnResult: typeof this.recognition.onresult === 'function'
      });
      
      console.log('🎤 About to call recognition.start()...');
      this.recognition.start();
      this.isListening = true;
      
      console.log('✅ Recognition.start() called successfully');
      console.log('👂 Listening... Speak now!');
      console.log('💡 Say something like: "Hello world"');
      console.log('═══════════════════════════════════════');
      
      return true;
      
    } catch (error) {
      console.error('═══════════════════════════════════════');
      console.error('❌ Failed to start:', error);
      console.error('═══════════════════════════════════════');
      if (typeof this.onError === 'function') {
        this.onError(error instanceof Error ? error.message : 'Failed to start');
      }
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log('🛑 Manually stopping recognition...');
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

  // Public callbacks - set these from your component
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onSpeechStart?: () => void;
  onEnd?: () => void;
}