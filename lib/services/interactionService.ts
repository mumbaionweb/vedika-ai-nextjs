/**
 * Unified Interaction Service
 * Manages all interaction modes (Type, Dictation, Voice) with AWS integration
 */

import { EnhancedDictationService } from './enhancedDictationService';
import { StreamingDictationService } from './streamingDictationService';
import { VoiceService } from './voiceService';
import { DeviceManager } from '../utils/deviceManager';

export class InteractionService {
  private dictationService: EnhancedDictationService;
  private streamingService: StreamingDictationService;
  private voiceService: VoiceService;
  private currentMode: 'type' | 'dictation' | 'voice' = 'type';

  constructor() {
    this.dictationService = new EnhancedDictationService();
    this.streamingService = new StreamingDictationService();
    this.voiceService = new VoiceService();
    
    this.setupCallbacks();
  }

  private setupCallbacks(): void {
    this.dictationService.onFinalResult = (text) => {
      this.handleFinalResult(text);
    };
    
    this.streamingService.onInterimResult = (text) => {
      this.handleInterimResult(text);
    };
    
    this.streamingService.onFinalResult = (text) => {
      this.handleFinalResult(text);
    };
  }

  async startInteraction(mode: 'type' | 'dictation' | 'voice'): Promise<boolean> {
    this.currentMode = mode;
    
    switch (mode) {
      case 'dictation':
        return await this.dictationService.startListening();
      case 'voice':
        return await this.streamingService.startStreaming();
      default:
        return true;
    }
  }

  stopInteraction(): void {
    switch (this.currentMode) {
      case 'dictation':
        this.dictationService.stopListening();
        break;
      case 'voice':
        this.streamingService.stopStreaming();
        break;
    }
  }

  private handleInterimResult(text: string): void {
    // Update UI with interim results
    this.onInterimResult?.(text);
  }

  private async handleFinalResult(text: string): Promise<void> {
    // Send to chat API with interaction mode
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        interaction_mode: this.currentMode,
        device_id: DeviceManager.getDeviceId(),
        session_id: DeviceManager.getSessionId(),
        request_type: 'anonymous'
      })
    });

    const result = await response.json();
    
    if (this.currentMode === 'voice' && result.response) {
      // Convert AI response to speech
      const audioBuffer = await this.voiceService.textToSpeech(result.response);
      await this.voiceService.playAudio(audioBuffer);
    }
    
    this.onFinalResult?.(result);
  }

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (result: any) => void;
}
