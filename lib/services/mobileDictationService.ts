/**
 * Mobile fallback using MediaRecorder + backend
 */
export class MobileDictationService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private deviceId: string;
  private chunkInterval: NodeJS.Timeout | null = null;
  private chunkDuration = 2000; // Process chunks every 2 seconds for more responsive transcription

  // Callbacks
  onFinalResult?: (text: string) => void;
  onInterimResult?: (text: string) => void; // Add interim result callback
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  async startRecording(): Promise<boolean> {
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

      console.log('🎤 Mobile recording started with noise cancellation');

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        await this.processAudioWithBackend(audioBlob, true); // Final result
      };

      // Start chunked processing for real-time transcription
      this.startChunkedProcessing();

      this.mediaRecorder.start();
      this.isRecording = true;

      if (this.onStart) this.onStart();

      return true;

    } catch (error) {
      console.error('🎤 Mobile recording failed:', error);
      if (this.onError) this.onError('Mobile recording failed');
      return false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Stop chunked processing
      if (this.chunkInterval) {
        clearInterval(this.chunkInterval);
        this.chunkInterval = null;
      }
      
      if (this.onEnd) this.onEnd();
    }
  }

  private startChunkedProcessing(): void {
    // Process audio chunks every few seconds for real-time transcription
    this.chunkInterval = setInterval(async () => {
      if (this.isRecording && this.audioChunks.length > 0) {
        const currentChunks = [...this.audioChunks];
        this.audioChunks = []; // Clear chunks for next processing
        
        if (currentChunks.length > 0) {
          const audioBlob = new Blob(currentChunks, { type: 'audio/wav' });
          await this.processAudioWithBackend(audioBlob, false); // Interim result
        }
      }
    }, this.chunkDuration);
  }

  private async processAudioWithBackend(audioBlob: Blob, isFinal: boolean = false): Promise<void> {
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) return;

        // Send to backend for processing
        const response = await fetch('/api/dictation/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio_data: base64Audio,
            audio_format: 'wav',
            language_code: 'en-US',
            device_id: this.deviceId,
            enable_noise_cancellation: true,
            is_final: isFinal
          })
        });

        if (!response.ok) {
          throw new Error(`Backend processing failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'completed' && result.transcribed_text) {
          if (isFinal) {
            // Final result
            if (this.onFinalResult) {
              this.onFinalResult(result.transcribed_text);
            }
          } else {
            // Interim result for real-time transcription
            if (this.onInterimResult) {
              this.onInterimResult(result.transcribed_text);
            }
          }
        } else {
          console.error('🎤 Backend processing failed:', result);
          if (this.onError) this.onError('Backend processing failed');
        }
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('🎤 Backend processing failed:', error);
      if (this.onError) this.onError('Backend processing failed');
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && 
           typeof navigator.mediaDevices !== 'undefined' &&
           typeof navigator.mediaDevices.getUserMedia !== 'undefined';
  }
}
