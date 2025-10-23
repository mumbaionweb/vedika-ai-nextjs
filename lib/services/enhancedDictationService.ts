/**
 * Enhanced Dictation Service
 * Uses AWS SDK v3 for production-grade speech recognition with noise cancellation
 */

import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export class EnhancedDictationService {
  private transcribeClient: TranscribeClient;
  private s3Client: S3Client;
  private bucketName: string;
  private isListening: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    // Initialize AWS clients with proper configuration
    this.transcribeClient = new TranscribeClient({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      }
    });
    
    this.s3Client = new S3Client({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      }
    });
    
    this.bucketName = process.env.NEXT_PUBLIC_AUDIO_BUCKET || 'vedika-audio-temp';
  }

  async startListening(): Promise<boolean> {
    if (this.isListening) {
      console.warn('🎤 Already listening');
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
      
      // Create MediaRecorder with noise cancellation
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processAudioWithAWS(audioBlob);
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      this.isListening = true;
      
      console.log('🎤 Dictation started with noise cancellation');
      return true;

    } catch (error) {
      console.error('🎤 Failed to start listening:', error);
      return false;
    }
  }

  stopListening(): void {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.isListening = false;
      console.log('🎤 Dictation stopped');
    }
  }

  private async processAudioWithAWS(audioBlob: Blob): Promise<void> {
    try {
      // Convert to base64
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
            audio_format: 'webm',
            language_code: 'en-US',
            enable_noise_cancellation: true
          })
        });

        const result = await response.json();
        
        if (result.status === 'completed') {
          this.onFinalResult?.(result.transcribed_text);
        }
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('🎤 AWS processing failed:', error);
    }
  }

  // Callbacks
  onFinalResult?: (text: string) => void;
}