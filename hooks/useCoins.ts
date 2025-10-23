/**
 * React Hook for managing coins/credits state
 * Uses device session validation to get real-time credits data
 */

import { useState, useEffect, useCallback } from 'react';
import { DeviceSessionApi } from '../lib/services/deviceSessionApi';

interface UseCoinsReturn {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Computed values for easy display
  usedCredits: number;
  totalCredits: number;
  remainingCredits: number;
}

export function useCoins(): UseCoinsReturn {
  const [vedikaCoinsRemaining, setVedikaCoinsRemaining] = useState<number>(0);
  const [dailyVedikaCoins, setDailyVedikaCoins] = useState<number>(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🪙 [useCoins] Fetching session/credits data...');
      const session = await DeviceSessionApi.validateSession();
      
      if (session) {
        console.log('🪙 [useCoins] Session data:', {
          vedikaCoinsRemaining: session.vedika_coins.remaining,
          dailyVedikaCoins: session.daily_vedika_coins
        });
        setVedikaCoinsRemaining(session.vedika_coins.remaining);
        setDailyVedikaCoins(session.daily_vedika_coins);
      } else {
        console.warn('⚠️ [useCoins] No valid session, creating new one...');
        const newSession = await DeviceSessionApi.createSession();
        setVedikaCoinsRemaining(newSession.vedika_coins.remaining);
        setDailyVedikaCoins(newSession.daily_vedika_coins);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ [useCoins] Error fetching credits:', err);
      // Fallback to defaults on error
      setVedikaCoinsRemaining(20);
      setDailyVedikaCoins(20);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Computed values for easy display
  const usedCredits = dailyVedikaCoins - vedikaCoinsRemaining;

  console.log('🪙 [useCoins] Computed values:', {
    usedCredits,
    totalCredits: dailyVedikaCoins,
    remainingCredits: vedikaCoinsRemaining,
    loading,
    error
  });

  return {
    loading,
    error,
    refetch: fetchBalance,
    usedCredits,
    totalCredits: dailyVedikaCoins,
    remainingCredits: vedikaCoinsRemaining,
  };
}
