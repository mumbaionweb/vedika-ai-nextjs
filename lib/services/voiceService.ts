/**
 * Voice Service
 * Uses AWS Polly for text-to-speech conversion
 */

import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

export class VoiceService {
  private pollyClient: PollyClient;
  private audioContext: AudioContext | null = null;
  private isRecording: boolean = false;

  constructor() {
    this.pollyClient = new PollyClient({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      }
    });
  }

  async textToSpeech(text: string, voiceId: string = 'Joanna'): Promise<AudioBuffer> {
    try {
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId as any,
        Engine: 'neural'
      });

      const response = await this.pollyClient.send(command);
      
      if (response.AudioStream) {
        const audioData = await response.AudioStream.transformToByteArray();
        const audioBuffer = await this.audioContext!.decodeAudioData(audioData.buffer as ArrayBuffer);
        return audioBuffer;
      }
      
      throw new Error('No audio stream received');
      
    } catch (error) {
      console.error('🎤 Text-to-speech failed:', error);
      throw error;
    }
  }

  async playAudio(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await this.pollyClient.send({
        command: 'DescribeVoices'
      });
      
      return response.Voices || [];
      
    } catch (error) {
      console.error('🎤 Get voices failed:', error);
      return [];
    }
  }

  // Voice conversation methods
  async startVoiceConversation(callbacks: {
    onError?: (error: string) => void;
    onTranscriptionUpdate?: (transcript: string, isFinal: boolean) => void;
  }): Promise<boolean> {
    this.isRecording = true;
    console.log('🎤 Voice conversation started');
    return true;
  }

  stopVoiceConversation(): void {
    this.isRecording = false;
    console.log('🎤 Voice conversation stopped');
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.AudioContext;
  }
}