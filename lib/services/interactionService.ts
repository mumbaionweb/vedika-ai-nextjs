/**
 * Interaction Service
 * Manages interaction modes with Voice integration
 */

import { VoiceService } from './voiceService';
import { DeviceManager } from '../utils/deviceManager';

export class InteractionService {
  private voiceService: VoiceService;
  private currentMode: 'type' | 'dictation' | 'voice' = 'type';

  constructor() {
    this.voiceService = new VoiceService();
  }

  async startInteraction(mode: 'type' | 'dictation' | 'voice'): Promise<boolean> {
    this.currentMode = mode;
    
    switch (mode) {
      case 'voice':
        return await this.voiceService.startVoiceConversation({
          onError: (error) => {
            console.error('Voice interaction error:', error);
          },
          onTranscriptionUpdate: (transcript, isFinal) => {
            if (isFinal) {
              this.onFinalResult?.({ response: transcript });
            } else {
              this.onInterimResult?.(transcript);
            }
          }
        });
      default:
        return true;
    }
  }

  stopInteraction(): void {
    switch (this.currentMode) {
      case 'voice':
        this.voiceService.stopVoiceConversation();
        break;
    }
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