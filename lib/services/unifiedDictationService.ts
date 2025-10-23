import { EnhancedDictationService } from './enhancedDictationService';
import { MobileDictationService } from './mobileDictationService';

/**
 * Unified service that works on all devices
 */
export class UnifiedDictationService {
  private speechService: EnhancedDictationService;
  private mobileService: MobileDictationService;
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
    
    // Detect mobile browser
    this.isMobile = this.detectMobileBrowser();
    
    console.log(`🎤 Using ${this.isMobile ? 'mobile' : 'desktop'} dictation service`);
  }

  private detectMobileBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth < 768; // Also consider small screens as mobile
  }

  async startListening(): Promise<boolean> {
    if (this.isMobile) {
      return await this.mobileService.startRecording();
    } else {
      return await this.speechService.startListening();
    }
  }

  stopListening(): void {
    if (this.isMobile) {
      this.mobileService.stopRecording();
    } else {
      this.speechService.stopListening();
    }
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

    // Set callbacks for both services
    this.speechService.onInterimResult = callbacks.onInterimResult;
    this.speechService.onFinalResult = callbacks.onFinalResult;
    this.speechService.onError = callbacks.onError;
    this.speechService.onStart = callbacks.onStart;
    this.speechService.onEnd = callbacks.onEnd;

    this.mobileService.onFinalResult = callbacks.onFinalResult;
    this.mobileService.onError = callbacks.onError;
    this.mobileService.onStart = callbacks.onStart;
    this.mobileService.onEnd = callbacks.onEnd;
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
