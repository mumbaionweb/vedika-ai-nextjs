/**
 * Connection Status Indicator
 * Shows real-time WebSocket connection status
 */

'use client';

import { useWebSocket } from '@/contexts/WebSocketContext';

export default function ConnectionStatus() {
  const { isConnected, reconnecting } = useWebSocket();
  
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

