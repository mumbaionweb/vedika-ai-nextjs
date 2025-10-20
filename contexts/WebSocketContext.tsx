/**
 * WebSocket Context Provider
 * Maintains a single persistent WebSocket connection across the entire app
 * Implements auto-reconnect with exponential backoff
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { DeviceManager } from '@/lib/utils/deviceManager';
import { useSessionManager } from '@/hooks/useSessionManager';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

// Connection state constants
export const CONNECTION_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

type ConnectionState = typeof CONNECTION_STATE[keyof typeof CONNECTION_STATE];

interface WebSocketContextType {
  send: (message: any) => Promise<void>;
  subscribe: (handler: MessageHandler) => () => void;
  isConnected: boolean;
  reconnecting: boolean;
  connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
  'wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod';

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  // Initialize session manager for proactive refresh
  useSessionManager();
  
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<MessageHandler>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(CONNECTION_STATE.CLOSED);
  
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    try {
      const attempt = reconnectAttemptsRef.current + 1;
      console.log(`🔌 Connecting to WebSocket (attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS})...`, WS_URL);
      
      wsRef.current = new WebSocket(WS_URL);
      setConnectionState(CONNECTION_STATE.CONNECTING);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setReconnecting(false);
        setConnectionState(CONNECTION_STATE.OPEN);
        reconnectAttemptsRef.current = 0; // Reset counter on successful connection
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [WEBSOCKET CONTEXT] ========== RAW MESSAGE RECEIVED ==========');
          console.log('📨 [WEBSOCKET CONTEXT] Full message:', JSON.stringify(data, null, 2));
          console.log('📨 [WEBSOCKET CONTEXT] Message type:', data.type);
          console.log('📨 [WEBSOCKET CONTEXT] Timestamp:', new Date().toISOString());
          console.log('📨 [WEBSOCKET CONTEXT] Active listeners:', listenersRef.current.size);
          console.log('👥 Notifying', listenersRef.current.size, 'handler(s)');
          
          // Notify ALL registered listeners
          let handlerIndex = 0;
          listenersRef.current.forEach(listener => {
            handlerIndex++;
            console.log(`  ↳ Calling handler #${handlerIndex}`);
            try {
              listener(data);
            } catch (error) {
              console.error(`  ❌ Handler #${handlerIndex} error:`, error);
            }
          });
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        setConnectionState(CONNECTION_STATE.CLOSED);
      };
      
      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: code=${event.code}, reason="${event.reason}"`);
        setIsConnected(false);
        setConnectionState(CONNECTION_STATE.CLOSED);
        
        // Don't reconnect if intentional close (code 1000)
        if (event.code === 1000) {
          console.log('👋 Intentional disconnect, not reconnecting');
          return;
        }
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_DELAY
          );
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          setReconnecting(true);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached. Please refresh the page.');
          setReconnecting(false);
        }
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState(WebSocket.CLOSED);
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    console.log('🚀 WebSocket Provider initializing...');
    connect();
    
    // Cleanup on app unmount (NOT on page navigation)
    return () => {
      console.log('🛑 WebSocket Provider unmounting, closing connection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'App unmounting');
      }
      listenersRef.current.clear();
    };
  }, [connect]);
  
  const send = useCallback(async (message: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected, attempting to connect...');
      await connect();
      
      // Wait for connection to open
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('WebSocket connection timeout'));
        }, 5000);
      });
    }
    
    wsRef.current!.send(JSON.stringify(message));
    console.log('📤 Sent WebSocket message:', { ...message, message: message.message?.substring(0, 50) + '...' || 'N/A' });
  }, [connect]);
  
  const subscribe = useCallback((handler: MessageHandler) => {
    listenersRef.current.add(handler);
    console.log('➕ Added message listener, total:', listenersRef.current.size);
    
    // Return unsubscribe function
    return () => {
      listenersRef.current.delete(handler);
      console.log('➖ Removed message listener, remaining:', listenersRef.current.size);
    };
  }, []);
  
  const value: WebSocketContextType = {
    send,
    subscribe,
    isConnected,
    reconnecting,
    connectionState,
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

