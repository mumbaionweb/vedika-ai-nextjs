/**
 * Voice Service - Handles real-time voice conversations
 * Records audio, sends to AWS Transcribe + Polly for voice-to-voice conversation
 */

export interface VoiceCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onAudioPlay?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: string) => void;
  onTranscriptionUpdate?: (transcript: string, isFinal: boolean) => void;
}

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private isRecording = false;
  private isVoiceMode = false;
  private callbacks: VoiceCallbacks = {};

  constructor() {
    // Only setup on client side
    if (typeof window !== 'undefined') {
      this.setupAudioContext();
    }
  }

  private setupAudioContext() {
    // Initialize audio context if needed
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      // Audio context will be created when needed
    }
  }

  /**
   * Start voice conversation mode
   */
  public async startVoiceConversation(callbacks?: VoiceCallbacks): Promise<boolean> {
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });

      this.isVoiceMode = true;
      await this.startRecording();
      return true;
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      const errorMessage = this.getErrorMessage(error);
      if (this.callbacks.onError) {
        this.callbacks.onError(errorMessage);
      }
      return false;
    }
  }

  /**
   * Stop voice conversation mode
   */
  public stopVoiceConversation(): void {
    this.isVoiceMode = false;
    this.stopRecording();
    this.cleanup();
  }

  /**
   * Start recording audio
   */
  private async startRecording(): Promise<void> {
    if (!this.audioStream || this.isRecording) {
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: this.getSupportedMimeType(),
      });

      const audioChunks: Blob[] = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { 
          type: this.getSupportedMimeType() || 'audio/webm' 
        });
        await this.processVoiceConversation(audioBlob);
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      if (this.callbacks.onRecordingStart) {
        this.callbacks.onRecordingStart();
      }

      // Auto-stop after 10 seconds of silence or manual stop
      setTimeout(() => {
        if (this.isRecording && this.isVoiceMode) {
          this.stopRecording();
        }
      }, 10000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to start audio recording');
      }
    }
  }

  /**
   * Stop recording audio
   */
  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      if (this.callbacks.onRecordingStop) {
        this.callbacks.onRecordingStop();
      }
    }
  }

  /**
   * Process voice conversation with backend
   */
  private async processVoiceConversation(audioBlob: Blob): Promise<void> {
    try {
      // Convert audio to base64
      const base64Audio = await this.audioToBase64(audioBlob);
      
      // Send to voice conversation API
      const response = await fetch('/api/voice/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          audio_format: this.getAudioFormat(audioBlob.type),
          language_code: 'en-US',
          voice_id: 'Joanna', // Default AWS Polly voice
          device_id: this.getDeviceId(),
          conversation_id: this.getConversationId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.audio_response) {
        // Play the AI's voice response
        await this.playAudioResponse(result.audio_response);
        
        // Continue conversation if in voice mode
        if (this.isVoiceMode) {
          setTimeout(() => {
            this.startRecording();
          }, 1000);
        }
      }

      if (result.transcription && this.callbacks.onTranscriptionUpdate) {
        this.callbacks.onTranscriptionUpdate(result.transcription, true);
      }

    } catch (error) {
      console.error('Failed to process voice conversation:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to process voice conversation');
      }
    }
  }

  /**
   * Play audio response from AI
   */
  private async playAudioResponse(base64Audio: string): Promise<void> {
    try {
      // Convert base64 to audio blob
      const audioData = atob(base64Audio);
      const audioBytes = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioBytes[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => {
        if (this.callbacks.onAudioPlay) {
          this.callbacks.onAudioPlay();
        }
      };
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (this.callbacks.onAudioEnd) {
          this.callbacks.onAudioEnd();
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio response:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to play audio response');
      }
    }
  }

  /**
   * Convert audio blob to base64
   */
  private audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Get audio format from MIME type
   */
  private getAudioFormat(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm'; // default
  }

  /**
   * Get device ID (placeholder - should come from your device manager)
   */
  private getDeviceId(): string {
    // This should come from your DeviceManager
    return 'device_placeholder';
  }

  /**
   * Get conversation ID (placeholder - should come from your chat context)
   */
  private getConversationId(): string | null {
    // This should come from your chat context
    return null;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Microphone permission denied. Please allow microphone access.';
    } else if (error.name === 'NotFoundError') {
      return 'No microphone found. Please check your microphone connection.';
    } else if (error.name === 'NotReadableError') {
      return 'Microphone is being used by another application.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Microphone constraints cannot be satisfied.';
    } else {
      return 'Failed to access microphone. Please check your microphone settings.';
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  /**
   * Check if voice mode is active
   */
  public getIsVoiceMode(): boolean {
    return this.isVoiceMode;
  }

  /**
   * Check if currently recording
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if media devices are supported
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getUserMedia' in navigator.mediaDevices;
  }
}

// Create a singleton instance
export const voiceService = new VoiceService();
