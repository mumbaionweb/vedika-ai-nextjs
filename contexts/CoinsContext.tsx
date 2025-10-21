/**
 * Coins Context
 * Provides global coins refresh functionality across the app
 */

'use client';

import React, { createContext, useContext, useCallback } from 'react';

interface CoinsContextType {
  refreshCoins: () => void;
}

const CoinsContext = createContext<CoinsContextType | undefined>(undefined);

// Global refresh callbacks
const refreshCallbacks = new Set<() => void>();

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const refreshCoins = useCallback(() => {
    console.log('🔄 [CoinsContext] Broadcasting coins refresh to all listeners');
    refreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('❌ [CoinsContext] Error in refresh callback:', error);
      }
    });
  }, []);

  return (
    <CoinsContext.Provider value={{ refreshCoins }}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoinsRefresh() {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error('useCoinsRefresh must be used within CoinsProvider');
  }
  return context;
}

// Hook to register a refresh callback
export function useCoinsRefreshCallback(callback: () => void) {
  React.useEffect(() => {
    refreshCallbacks.add(callback);
    console.log('📝 [CoinsContext] Registered refresh callback, total:', refreshCallbacks.size);
    
    return () => {
      refreshCallbacks.delete(callback);
      console.log('🗑️ [CoinsContext] Unregistered refresh callback, remaining:', refreshCallbacks.size);
    };
  }, [callback]);
}

