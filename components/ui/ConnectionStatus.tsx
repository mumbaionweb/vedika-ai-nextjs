/**
 * Connection Status Indicator
 * Shows real-time WebSocket connection status
 */

'use client';

import { useState, useEffect } from 'react';
import { websocketManager } from '@/lib/websocketSingleton';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  
  useEffect(() => {
    if (!websocketManager) return;
    
    // Check initial state
    setIsConnected(websocketManager.isConnected());
    
    // Poll connection status every second
    const interval = setInterval(() => {
      const state = websocketManager.getConnectionState();
      setIsConnected(state === 'connected');
      setReconnecting(state === 'connecting');
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-xs">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="hidden sm:inline">Connected</span>
      </div>
    );
  }
  
  if (reconnecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-xs">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
        <span className="hidden sm:inline">Reconnecting...</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-red-600 text-xs">
      <span className="w-2 h-2 bg-red-500 rounded-full" />
      <span className="hidden sm:inline">Disconnected</span>
    </div>
  );
}

