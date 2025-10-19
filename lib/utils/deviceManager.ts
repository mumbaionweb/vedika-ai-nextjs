/**
 * Device Manager Utility
 * Manages device ID and session ID for anonymous users
 */

export class DeviceManager {
  private static DEVICE_ID_KEY = 'vedika_device_id';
  private static SESSION_ID_KEY = 'vedika_session_id';
  private static SESSION_EXPIRY_KEY = 'vedika_session_expiry';
  
  /**
   * Get or create device ID
   * Device ID is permanent and uniquely identifies this browser/device
   */
  static getDeviceId(): string {
    if (typeof window === 'undefined') {
      // Server-side: return temporary ID
      return `device_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    }

    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate unique device ID
      const randomPart = Math.random().toString(36).substring(2, 11);
      const timestamp = Date.now();
      deviceId = `device_${randomPart}_${timestamp}`;
      
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      console.log('🆕 New device ID created:', deviceId);
    }
    
    return deviceId;
  }
  
  /**
   * Get session ID from localStorage
   */
  static getSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.SESSION_ID_KEY);
  }
  
  /**
   * Store session ID and expiry
   */
  static setSession(sessionId: string, expiresAt: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.SESSION_ID_KEY, sessionId);
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt);
    console.log('✅ Session stored:', { sessionId, expiresAt });
  }
  
  /**
   * Check if session is expired
   */
  static isSessionExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryStr = localStorage.getItem(this.SESSION_EXPIRY_KEY);
    if (!expiryStr) return true;
    
    const expiry = new Date(expiryStr);
    return new Date() > expiry;
  }
  
  /**
   * Clear session (not device ID)
   */
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.SESSION_ID_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
    console.log('🗑️ Session cleared');
  }
  
  /**
   * Clear everything (device + session)
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.DEVICE_ID_KEY);
    this.clearSession();
    console.log('🗑️ All device data cleared');
  }
}

