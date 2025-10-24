/**
 * Device Session API Service
 * Manages device session creation and validation for anonymous users
 */

import config from '../config';
import { DeviceManager } from '../utils/deviceManager';

interface DeviceSessionResponse {
  session_id: string;
  device_id: string;
  expires_at: string;
  max_conversations: number;
  plan: string;
  daily_credits: number;
  credits_remaining: number;
  message: string;
}

export class DeviceSessionApi {
  
  /**
   * Create a new device session
   * This registers the device with the backend and gets a session ID
   */
  static async createSession(): Promise<DeviceSessionResponse> {
    const deviceId = DeviceManager.getDeviceId();
    
    console.log('🔐 Creating device session for:', deviceId);
    
    console.log('🔗 Making request to:', `${config.api.baseUrl}/auth/device-session`);
    console.log('🔗 Config API base URL:', config.api.baseUrl);
    
    try {
      const response = await fetch(`${config.api.baseUrl}/auth/device-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: deviceId,
          device_info: {
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            language: typeof navigator !== 'undefined' ? navigator.language : 'en',
            screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown'
          }
        })
      });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to create device session: ${response.statusText}`);
    }
    
    const data: DeviceSessionResponse = await response.json();
    
    // Store session locally
    DeviceManager.setSession(data.session_id, data.expires_at);
    
    console.log('✅ Device session created:', {
      sessionId: data.session_id,
      credits: data.credits_remaining,
      expiresAt: data.expires_at
    });
    
    return data;
    } catch (error) {
      console.error('❌ Device session creation error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check if it's a network error
      if (error instanceof Error && error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('❌ Network error - API endpoint not accessible');
        console.error('❌ Check if API endpoint is correct:', config.api.baseUrl);
        console.error('❌ This might be a CORS issue or the API server is down');
      }
      
      throw error;
    }
  }
  
  /**
   * Validate existing session
   * Returns session info if valid, null if invalid/expired
   */
  static async validateSession(): Promise<DeviceSessionResponse | null> {
    const sessionId = DeviceManager.getSessionId();
    
    if (!sessionId) {
      console.log('⚠️ No session ID found');
      return null;
    }
    
    // Check local expiry first (avoid unnecessary API call)
    if (DeviceManager.isSessionExpired()) {
      console.log('⏰ Session expired locally');
      DeviceManager.clearSession();
      return null;
    }
    
    console.log('🔍 Validating session:', sessionId);
    console.log('🔍 Validating session URL:', `${config.api.baseUrl}/auth/device-session/validate?session_id=${sessionId}`);
    console.log('🔍 Config API base URL:', config.api.baseUrl);
    
    try {
      const response = await fetch(
        `${config.api.baseUrl}/auth/device-session/validate?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.log('❌ Session validation failed');
        DeviceManager.clearSession();
        return null;
      }
      
      const data: DeviceSessionResponse = await response.json();
      console.log('✅ Session valid:', {
        credits: data.credits_remaining,
        expiresAt: data.expires_at
      });
      
      return data;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a network error
      if (error instanceof Error && error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('❌ Network error - API endpoint not accessible');
        console.error('❌ Check if API endpoint is correct:', config.api.baseUrl);
        console.error('❌ This might be a CORS issue or the API server is down');
      }
      
      DeviceManager.clearSession();
      return null;
    }
  }
  
  /**
   * Get or create valid session
   * This is the main method to call before any API request
   */
  static async ensureSession(): Promise<DeviceSessionResponse> {
    // Try to validate existing session
    let session = await this.validateSession();
    
    if (!session) {
      // Create new session if validation failed
      console.log('🆕 Creating new device session...');
      session = await this.createSession();
    }
    
    return session;
  }
}

