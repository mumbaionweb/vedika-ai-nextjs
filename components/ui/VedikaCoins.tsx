'use client';

import React from 'react';

interface VedikaCoinsProps {
  used: number;
  total: number;
  className?: string;
}

export default function VedikaCoins({ used, total, className = '' }: VedikaCoinsProps) {
  return (
    <div className={`flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 ${className}`}>
      {/* Golden Coin with Shining Animation */}
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-bold text-sm">V</span>
          
          {/* Shining effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-ping"></div>
          
          {/* Rotating shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full animate-spin" 
               style={{ animationDuration: '3s' }}></div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 w-8 h-8 bg-yellow-400 rounded-full opacity-20 blur-sm animate-pulse"></div>
      </div>
      
      {/* Usage Display */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-800">
          {used}/{total}
        </span>
        <span className="text-xs text-gray-500">Vedika Coins</span>
      </div>
    </div>
  );
}
