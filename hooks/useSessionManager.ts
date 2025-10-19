/**
 * Session Manager Hook
 * Proactively refreshes device sessions before expiry
 * Runs in background to ensure seamless user experience
 */

'use client';

import { useEffect } from 'react';
import { DeviceSessionApi } from '@/lib/services/deviceSessionApi';
import { DeviceManager } from '@/lib/utils/deviceManager';

const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
const REFRESH_THRESHOLD_HOURS = 2; // Refresh if less than 2 hours remaining

export function useSessionManager() {
  useEffect(() => {
    const checkSession = async () => {
      try {
        const expiryStr = typeof window !== 'undefined' 
          ? localStorage.getItem('vedika_session_expiry') 
          : null;
        
        if (!expiryStr) {
          console.log('⚠️ No session expiry found');
          return;
        }
        
        const expiryTime = new Date(expiryStr);
        const now = new Date();
        const hoursUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        console.log(`⏰ Session expires in ${hoursUntilExpiry.toFixed(1)} hours`);
        
        // If less than threshold hours remaining, refresh proactively
        if (hoursUntilExpiry < REFRESH_THRESHOLD_HOURS && hoursUntilExpiry > 0) {
          console.log(`🔄 Proactively refreshing session (< ${REFRESH_THRESHOLD_HOURS} hours until expiry)...`);
          await DeviceSessionApi.createSession();
          console.log('✅ Session refreshed successfully');
        }
        
        // If already expired, refresh immediately
        if (hoursUntilExpiry <= 0) {
          console.log('⚠️ Session expired, creating new session...');
          await DeviceSessionApi.createSession();
          console.log('✅ Expired session renewed');
        }
        
      } catch (error) {
        console.error('❌ Error checking session:', error);
      }
    };
    
    // Check immediately on mount
    checkSession();
    
    // Then check periodically
    const interval = setInterval(checkSession, CHECK_INTERVAL);
    
    console.log(`🔐 Session manager started (checking every ${CHECK_INTERVAL / 1000 / 60} minutes)`);
    
    return () => {
      clearInterval(interval);
      console.log('🔐 Session manager stopped');
    };
  }, []);
}

