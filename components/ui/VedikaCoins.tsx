'use client';

import React from 'react';
import { useCoins } from '../../hooks/useCoins';
import { useCoinsRefreshCallback } from '@/contexts/CoinsContext';

interface VedikaCoinsProps {
  className?: string;
}

export default function VedikaCoins({ className = '' }: VedikaCoinsProps) {
  const { usedCredits, totalCredits, loading, error, refetch } = useCoins();
  
  // Register for global refresh events
  useCoinsRefreshCallback(refetch);

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200 ${className}`}>
        <div className="relative">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-gray-600 font-bold text-xs">V</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-500 animate-pulse">
            ...
          </span>
        </div>
      </div>
    );
  }

  // Show error state with fallback values
  if (error) {
    console.warn('Failed to load coins balance:', error);
    // Fallback to default values on error
  }

  return (
    <div className={`flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200 ${className}`}>
      {/* Golden Coin with Shining Animation */}
      <div className="relative">
        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg" 
             style={{ animation: 'pulse 3.9s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          <span className="text-white font-bold text-xs">V</span>
          
          {/* Shining effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full" 
               style={{ animation: 'ping 3.9s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
          
          {/* Rotating shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full" 
               style={{ animationDuration: '3.9s' }}></div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 w-6 h-6 bg-yellow-400 rounded-full opacity-20 blur-sm" 
             style={{ animation: 'pulse 3.9s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      </div>
      
      {/* Usage Display */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-800">
          {usedCredits}/{totalCredits}
        </span>
      </div>
    </div>
  );
}
