/**
 * Centralized Coins Store
 * Single source of truth for coins/credits data with caching
 */

import { sessionManager } from '../utils/sessionManager';

interface CoinsData {
  remainingCredits: number;
  lastUpdated: number;
  loading: boolean;
  error: string | null;
}

class CoinsStore {
  private data: CoinsData = {
    remainingCredits: 20,
    lastUpdated: 0,
    loading: false,
    error: null,
  };

  private listeners = new Set<() => void>();
  private cacheTimeout = 30000; // 30 seconds cache
  private fetchPromise: Promise<void> | null = null;

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('❌ [CoinsStore] Error in listener:', error);
      }
    });
  }

  // Get current data
  getData(): CoinsData {
    return { ...this.data };
  }

  // Check if cache is valid
  private isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.data.lastUpdated) < this.cacheTimeout;
  }

  // Fetch fresh data from API
  async fetchCoins(force = false): Promise<void> {
    // Return existing promise if already fetching
    if (this.fetchPromise && !force) {
      return this.fetchPromise;
    }

    // Use cache if valid and not forced
    if (!force && this.isCacheValid() && !this.data.error) {
      console.log('🪙 [CoinsStore] Using cached data');
      return;
    }

    // Set loading state
    this.data.loading = true;
    this.data.error = null;
    this.notify();

    this.fetchPromise = this._performFetch();
    
    try {
      await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async _performFetch(): Promise<void> {
    try {
      console.log('🪙 [CoinsStore] Updating coins from session data...');
      
      // Use sessionManager to avoid duplicate API calls
      const session = await sessionManager.getSession();
      
      const remainingCredits = session.credits_remaining;

      this.data = {
        remainingCredits,
        lastUpdated: Date.now(),
        loading: false,
        error: null,
      };

      console.log('🪙 [CoinsStore] Updated coins balance:', remainingCredits);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.data.loading = false;
      this.data.error = errorMessage;
      
      console.error('❌ [CoinsStore] Error fetching coins:', error);
      
      // Don't update other values on error - keep last known good state
    }
    
    this.notify();
  }

  // Manually update coins (e.g., after sending a message)
  updateCoinsUsage(creditsUsed: number) {
    if (creditsUsed > 0) {
      this.data.remainingCredits = Math.max(
        this.data.remainingCredits - creditsUsed,
        0
      );
      
      console.log('🪙 [CoinsStore] Updated balance locally:', this.data.remainingCredits);
      
      this.notify();
    }
  }

  // Update coins directly from chat response
  updateFromChatResponse(balance: number) {
    if (typeof balance === 'number' && balance >= 0) {
      this.data.remainingCredits = balance;
      this.data.lastUpdated = Date.now();
      this.data.loading = false;
      this.data.error = null;
      
      console.log('🪙 [CoinsStore] Updated from chat response:', balance);
      
      this.notify();
    } else {
      console.warn('⚠️ [CoinsStore] Invalid balance value:', balance);
    }
  }

  // Force refresh (e.g., after message sent)
  async refresh(): Promise<void> {
    return this.fetchCoins(true);
  }

  // Clear cache and reset
  reset() {
    this.data = {
      remainingCredits: 20,
      lastUpdated: 0,
      loading: false,
      error: null,
    };
    this.notify();
  }
}

// Singleton instance
export const coinsStore = new CoinsStore();
