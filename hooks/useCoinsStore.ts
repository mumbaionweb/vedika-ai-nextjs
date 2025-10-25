/**
 * React Hook for Coins Store
 * Provides reactive access to centralized coins data
 */

import { useState, useEffect } from 'react';
import { coinsStore } from '../lib/stores/coinsStore';

export function useCoinsStore() {
  const [data, setData] = useState(() => coinsStore.getData());

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = coinsStore.subscribe(() => {
      setData(coinsStore.getData());
    });

    // Fetch initial data if needed
    coinsStore.fetchCoins();

    return unsubscribe;
  }, []);

  return {
    ...data,
    refresh: () => coinsStore.refresh(),
    updateUsage: (creditsUsed: number) => coinsStore.updateCoinsUsage(creditsUsed),
  };
}
