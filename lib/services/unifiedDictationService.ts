import { EnhancedDictationService } from './enhancedDictationService';
import { MobileDictationService } from './mobileDictationService';
import { StreamingDictationService } from './streamingDictationService';

/**
 * Unified service that works on all devices
 */
export class UnifiedDictationService {
  private speechService: EnhancedDictationService;
  private mobileService: MobileDictationService;
  private streamingService: StreamingDictationService;
  private isMobile = false;
  private deviceId: string;

  // Callbacks
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.speechService = new EnhancedDictationService();
    this.mobileService = new MobileDictationService(deviceId);
    this.streamingService = new StreamingDictationService();
    
    // Detect mobile browser
    this.isMobile = this.detectMobileBrowser();
    
    console.log(`🎤 Using ${this.isMobile ? 'mobile' : 'desktop'} dictation service`);
  }

  private detectMobileBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768; // Also consider small screens as mobile
  }

  async startListening(mode: 'dictation' | 'voice' = 'dictation'): Promise<boolean> {
    if (mode === 'voice') {
      // Use streaming service for voice mode
      return await this.streamingService.startStreaming();
    } else if (this.isMobile) {
      return await this.mobileService.startRecording();
    } else {
      return await this.speechService.startListening();
    }
  }

  stopListening(): void {
    // Stop all services to be safe
    this.mobileService.stopRecording();
    this.speechService.stopListening();
    this.streamingService.stopStreaming();
  }

  setCallbacks(callbacks: {
    onInterimResult?: (text: string) => void;
    onFinalResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    this.onInterimResult = callbacks.onInterimResult;
    this.onFinalResult = callbacks.onFinalResult;
    this.onError = callbacks.onError;
    this.onStart = callbacks.onStart;
    this.onEnd = callbacks.onEnd;

    // Set callbacks for all services
    this.speechService.onInterimResult = callbacks.onInterimResult;
    this.speechService.onFinalResult = callbacks.onFinalResult;
    this.speechService.onError = callbacks.onError;
    this.speechService.onStart = callbacks.onStart;
    this.speechService.onEnd = callbacks.onEnd;

    this.mobileService.onFinalResult = callbacks.onFinalResult;
    this.mobileService.onInterimResult = callbacks.onInterimResult;
    this.mobileService.onError = callbacks.onError;
    this.mobileService.onStart = callbacks.onStart;
    this.mobileService.onEnd = callbacks.onEnd;

    this.streamingService.onInterimResult = callbacks.onInterimResult;
    this.streamingService.onFinalResult = callbacks.onFinalResult;
  }

  getIsListening(): boolean {
    if (this.isMobile) {
      return this.mobileService.getIsRecording();
    } else {
      return this.speechService.getIsListening();
    }
  }

  isSupported(): boolean {
    if (this.isMobile) {
      return this.mobileService.isSupported();
    } else {
      return this.speechService.isSupported();
    }
  }

  getServiceType(): 'mobile' | 'desktop' {
    return this.isMobile ? 'mobile' : 'desktop';
  }
}

// Create singleton instance
export const unifiedDictationService = new UnifiedDictationService('device_placeholder');
