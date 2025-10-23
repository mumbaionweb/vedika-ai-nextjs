/**
 * Streaming Dictation Service
 * Uses AWS Transcribe Streaming for real-time transcription
 */

import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";

export class StreamingDictationService {
  private streamingClient: TranscribeStreamingClient;
  private isStreaming: boolean = false;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  constructor() {
    this.streamingClient = new TranscribeStreamingClient({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      }
    });
  }

  async startStreaming(): Promise<boolean> {
    if (this.isStreaming) {
      console.warn('🎤 Already streaming');
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

      // Create audio context for real-time processing
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create processor for real-time audio
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = async (event) => {
        const inputBuffer = event.inputBuffer;
        const audioData = inputBuffer.getChannelData(0);
        
        // Convert to PCM and send to AWS
        await this.sendAudioToAWS(audioData);
      };
      
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isStreaming = true;
      console.log('🎤 Real-time streaming started');
      return true;

    } catch (error) {
      console.error('🎤 Streaming failed:', error);
      return false;
    }
  }

  stopStreaming(): void {
    if (this.processor && this.audioContext) {
      this.processor.disconnect();
      this.audioContext.close();
      this.isStreaming = false;
      console.log('🎤 Streaming stopped');
    }
  }

  private async sendAudioToAWS(audioData: Float32Array): Promise<void> {
    try {
      // Convert Float32Array to PCM
      const pcmData = this.convertToPCM(audioData);
      
      // Send to AWS Transcribe Streaming
      const command = new StartStreamTranscriptionCommand({
        LanguageCode: 'en-US',
        MediaSampleRateHertz: 44100,
        MediaEncoding: 'pcm',
        AudioStream: {
          AudioEvent: {
            AudioChunk: pcmData
          }
        }
      });

      const response = await this.streamingClient.send(command);
      
      // Handle streaming response
      if (response.TranscriptResultStream) {
        for await (const event of response.TranscriptResultStream) {
          if (event.TranscriptEvent?.Transcript?.Results) {
            const results = event.TranscriptEvent.Transcript.Results;
            for (const result of results) {
              if (result.Alternatives && result.Alternatives.length > 0) {
                const transcript = result.Alternatives[0].Transcript;
                const isFinal = result.IsPartial === false;
                
                if (isFinal) {
                  this.onFinalResult?.(transcript);
                } else {
                  this.onInterimResult?.(transcript);
                }
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('🎤 AWS streaming error:', error);
    }
  }

  private convertToPCM(audioData: Float32Array): Uint8Array {
    // Convert Float32Array to PCM format for AWS Transcribe
    const buffer = new ArrayBuffer(audioData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return new Uint8Array(buffer);
  }

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
}
