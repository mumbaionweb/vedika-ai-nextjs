/**
 * Global Session Manager
 * Prevents duplicate session validation calls and manages session state
 */

import { DeviceSessionApi } from '../services/deviceSessionApi';
import { DeviceManager } from './deviceManager';

interface SessionData {
  session_id: string;
  credits_remaining: number;
  daily_credits: number;
  lastValidated: number;
}

class SessionManager {
  private sessionData: SessionData | null = null;
  private validationPromise: Promise<SessionData> | null = null;
  private cacheTimeout = 60000; // 1 minute cache for session validation

  // Check if cached session is still valid
  private isCacheValid(): boolean {
    if (!this.sessionData) return false;
    const now = Date.now();
    return (now - this.sessionData.lastValidated) < this.cacheTimeout;
  }

  // Get session with caching to prevent duplicate API calls
  async getSession(): Promise<SessionData> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      console.log('⚡ [SessionManager] Using cached session data');
      return this.sessionData!;
    }

    // Return existing promise if already validating
    if (this.validationPromise) {
      console.log('⏳ [SessionManager] Waiting for existing validation...');
      return this.validationPromise;
    }

    // Start new validation
    this.validationPromise = this._performValidation();
    
    try {
      const result = await this.validationPromise;
      return result;
    } finally {
      this.validationPromise = null;
    }
  }

  private async _performValidation(): Promise<SessionData> {
    try {
      console.log('🔍 [SessionManager] Validating session...');
      
      // Check if we have a session ID first
      const existingSessionId = DeviceManager.getSessionId();
      if (!existingSessionId) {
        console.log('🆕 [SessionManager] No session ID, creating new session...');
        const newSession = await DeviceSessionApi.createSession();
        this.sessionData = {
          ...newSession,
          lastValidated: Date.now(),
        };
        return this.sessionData;
      }

      // Validate existing session
      const session = await DeviceSessionApi.validateSession();
      if (session) {
        this.sessionData = {
          ...session,
          lastValidated: Date.now(),
        };
        console.log('✅ [SessionManager] Session validated successfully');
        return this.sessionData;
      } else {
        // Session invalid, create new one
        console.log('🔄 [SessionManager] Session invalid, creating new one...');
        const newSession = await DeviceSessionApi.createSession();
        this.sessionData = {
          ...newSession,
          lastValidated: Date.now(),
        };
        return this.sessionData;
      }
    } catch (error) {
      console.error('❌ [SessionManager] Session validation failed:', error);
      throw error;
    }
  }

  // Force refresh session data
  async refresh(): Promise<SessionData> {
    this.sessionData = null;
    this.validationPromise = null;
    return this.getSession();
  }

  // Clear cached session
  clear() {
    this.sessionData = null;
    this.validationPromise = null;
  }

  // Get cached session data without API call
  getCachedSession(): SessionData | null {
    return this.isCacheValid() ? this.sessionData : null;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
