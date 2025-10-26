/**
 * App Initializer
 * Centralized initialization logic to prevent duplicate setup calls
 */

import { sessionManager } from './sessionManager';
import { coinsStore } from '../stores/coinsStore';

interface InitializationResult {
  sessionId: string;
  remainingCredits: number;
}

class AppInitializer {
  private isInitialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;

  // Single initialization for the entire app
  async initialize(): Promise<InitializationResult> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      console.log('⏳ [AppInitializer] Waiting for existing initialization...');
      return this.initializationPromise;
    }

    // Return cached result if already initialized
    if (this.isInitialized) {
      const cachedSession = sessionManager.getCachedSession();
      if (cachedSession) {
        console.log('⚡ [AppInitializer] App already initialized');
        return {
          sessionId: cachedSession.session_id,
          remainingCredits: cachedSession.credits_remaining,
        };
      }
    }

    // Start initialization
    this.initializationPromise = this._performInitialization();
    
    try {
      const result = await this.initializationPromise;
      this.isInitialized = true;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _performInitialization(): Promise<InitializationResult> {
    console.log('🚀 [AppInitializer] Starting app initialization...');
    
    // 1. Initialize session (this will also initialize coins store)
    const session = await sessionManager.getSession();
    
    // 2. Ensure coins store is ready (will use cached session data)
    await coinsStore.fetchCoins();
    
    console.log('✅ [AppInitializer] App initialization complete');
    
    return {
      sessionId: session.session_id,
      remainingCredits: session.credits_remaining,
    };
  }

  // Reset initialization state (for testing or error recovery)
  reset() {
    this.isInitialized = false;
    this.initializationPromise = null;
    sessionManager.clear();
    coinsStore.reset();
  }

  // Check if app is ready
  isReady(): boolean {
    return this.isInitialized && sessionManager.getCachedSession() !== null;
  }
}

// Singleton instance
export const appInitializer = new AppInitializer();
