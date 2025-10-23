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
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);
  const [dailyCredits, setDailyCredits] = useState<number>(20);
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
          creditsRemaining: session.credits_remaining,
          dailyCredits: session.daily_credits
        });
        setCreditsRemaining(session.credits_remaining);
        setDailyCredits(session.daily_credits);
      } else {
        console.warn('⚠️ [useCoins] No valid session, creating new one...');
        const newSession = await DeviceSessionApi.createSession();
        setCreditsRemaining(newSession.credits_remaining);
        setDailyCredits(newSession.daily_credits);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ [useCoins] Error fetching credits:', err);
      // Fallback to defaults on error
      setCreditsRemaining(20);
      setDailyCredits(20);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Computed values for easy display
  const usedCredits = dailyCredits - creditsRemaining;

  console.log('🪙 [useCoins] Computed values:', {
    usedCredits,
    totalCredits: dailyCredits,
    remainingCredits: creditsRemaining,
    loading,
    error
  });

  return {
    loading,
    error,
    refetch: fetchBalance,
    usedCredits,
    totalCredits: dailyCredits,
    remainingCredits: creditsRemaining,
  };
}
