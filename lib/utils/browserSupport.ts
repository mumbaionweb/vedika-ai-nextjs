/**
 * Browser Support Utilities
 * Check for various browser capabilities
 */

export const BrowserSupport = {
  /**
   * Check if Speech Recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  /**
   * Check if MediaDevices (microphone) is supported
   */
  isMediaDevicesSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  },

  /**
   * Check if Web Audio API is supported
   */
  isWebAudioSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    return 'AudioContext' in window || 'webkitAudioContext' in window;
  },

  /**
   * Get browser info
   */
  getBrowserInfo(): { name: string; version: string; userAgent: string } {
    if (typeof window === 'undefined') {
      return { name: 'Server', version: 'Unknown', userAgent: 'Server-side' };
    }

    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match) browserVersion = match[1];
    }
    // Firefox
    else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      if (match) browserVersion = match[1];
    }
    // Safari
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      if (match) browserVersion = match[1];
    }
    // Edge
    else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      if (match) browserVersion = match[1];
    }

    return { name: browserName, version: browserVersion, userAgent };
  },

  /**
   * Check if HTTPS is required for microphone access
   */
  isHTTPSRequired(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.location.protocol !== 'https:' && window.location.hostname !== 'localhost';
  },

  /**
   * Log browser capabilities
   */
  logBrowserCapabilities(): void {
    if (typeof window === 'undefined') return;

    const browserInfo = this.getBrowserInfo();
    const capabilities = {
      speechRecognition: this.isSpeechRecognitionSupported(),
      mediaDevices: this.isMediaDevicesSupported(),
      webAudio: this.isWebAudioSupported(),
      https: window.location.protocol === 'https:',
      localhost: window.location.hostname === 'localhost',
    };

    console.log('🔍 Browser Capabilities:', {
      browser: `${browserInfo.name} ${browserInfo.version}`,
      capabilities,
      userAgent: browserInfo.userAgent,
    });
  }
};
