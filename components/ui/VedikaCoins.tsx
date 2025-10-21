'use client';

import React from 'react';

interface VedikaCoinsProps {
  used: number;
  total: number;
  className?: string;
}

export default function VedikaCoins({ used, total, className = '' }: VedikaCoinsProps) {
  return (
    <div className={`flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200 ${className}`}>
      {/* Golden Coin with Shining Animation */}
      <div className="relative">
        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-bold text-xs">V</span>
          
          {/* Shining effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 rounded-full animate-ping"></div>
          
          {/* Rotating shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 rounded-full animate-spin" 
               style={{ animationDuration: '3s' }}></div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 w-6 h-6 bg-yellow-400 rounded-full opacity-20 blur-sm animate-pulse"></div>
      </div>
      
      {/* Usage Display */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-800">
          {used}/{total}
        </span>
      </div>
    </div>
  );
}
