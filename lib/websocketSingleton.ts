/**
 * WebSocket Singleton Manager
 * 
 * This singleton ensures only ONE WebSocket connection exists across the entire app,
 * preventing React component lifecycle issues, double connections, and message loss.
 * 
 * Key Benefits:
 * - Single persistent connection across all components
 * - Survives React component mount/unmount cycles
 * - No connection drops during navigation
 * - Automatic reconnection with exponential backoff
 * - Multiple components can subscribe to same connection
 */

type MessageHandler = (data: any) => void;

interface WebSocketConfig {
  url: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  private constructor(config: WebSocketConfig) {
    this.config = {
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectDelay: config.maxReconnectDelay || 30000,
      ...config,
    };
    
    console.log('🔌 [WebSocket Singleton] Initializing WebSocket Manager');
    this.connect();
  }

  static getInstance(config?: WebSocketConfig): WebSocketManager {
    if (!WebSocketManager.instance) {
      if (!config) {
        throw new Error('WebSocketManager must be initialized with config on first call');
      }
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }

  private connect(): void {
    if (this.isConnecting) {
      console.log('⏸️ [WebSocket Singleton] Connection already in progress');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('✅ [WebSocket Singleton] Already connected');
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';
    console.log(`🔌 [WebSocket Singleton] Connecting to ${this.config.url} (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('✅ [WebSocket Singleton] Connected successfully');
        this.isConnecting = false;
        this.connectionState = 'connected';
        this.reconnectAttempts = 0; // Reset on successful connection
        
        // Clear any pending reconnect timeout
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [WebSocket Singleton] Message received:', {
            type: data.type,
            timestamp: new Date().toISOString(),
            listenerCount: this.listeners.size,
          });
          
          // Notify all registered listeners
          this.listeners.forEach((listener, index) => {
            try {
              listener(data);
            } catch (error) {
              console.error(`❌ [WebSocket Singleton] Error in listener #${index}:`, error);
            }
          });
        } catch (error) {
          console.error('❌ [WebSocket Singleton] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ [WebSocket Singleton] WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 [WebSocket Singleton] Connection closed: code=${event.code}, reason="${event.reason}"`);
        this.isConnecting = false;
        this.connectionState = 'disconnected';
        this.ws = null;

        // Don't reconnect if it was a clean close
        if (event.code === 1000) {
          console.log('👋 [WebSocket Singleton] Clean disconnect, not reconnecting');
          return;
        }

        // Attempt reconnection with exponential backoff
        if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
          const delay = Math.min(
            this.config.reconnectDelay! * Math.pow(2, this.reconnectAttempts),
            this.config.maxReconnectDelay!
          );
          
          console.log(`🔄 [WebSocket Singleton] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else {
          console.error('❌ [WebSocket Singleton] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('❌ [WebSocket Singleton] Error creating WebSocket:', error);
      this.isConnecting = false;
      this.connectionState = 'disconnected';
    }
  }

  /**
   * Subscribe to WebSocket messages
   * @param handler Function to call when messages are received
   * @returns Unsubscribe function
   */
  subscribe(handler: MessageHandler): () => void {
    console.log(`➕ [WebSocket Singleton] Adding listener (total: ${this.listeners.size + 1})`);
    this.listeners.add(handler);
    
    return () => {
      console.log(`➖ [WebSocket Singleton] Removing listener (remaining: ${this.listeners.size - 1})`);
      this.listeners.delete(handler);
    };
  }

  /**
   * Send a message through the WebSocket
   * @param message Message to send (will be JSON stringified)
   */
  async send(message: any): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('📤 [WebSocket Singleton] Sending message:', {
        type: message.routeKey || message.type,
        timestamp: new Date().toISOString(),
      });
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ [WebSocket Singleton] WebSocket not connected, attempting to connect...');
      
      // Attempt to connect if not already connecting
      if (!this.isConnecting) {
        this.connect();
      }
      
      // Wait for connection (with timeout)
      await this.waitForConnection(5000);
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('📤 [WebSocket Singleton] Connection established, sending message');
        this.ws.send(JSON.stringify(message));
      } else {
        throw new Error('Failed to establish WebSocket connection');
      }
    }
  }

  /**
   * Wait for WebSocket to be in OPEN state
   * @param timeout Maximum time to wait in milliseconds
   */
  private waitForConnection(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('WebSocket connection timeout'));
        }
      }, 100);
    });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Manually reconnect (useful for testing or after errors)
   */
  reconnect(): void {
    console.log('🔄 [WebSocket Singleton] Manual reconnect requested');
    if (this.ws) {
      this.ws.close();
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Close the WebSocket connection
   * @param code Close code (default: 1000 for normal closure)
   * @param reason Close reason
   */
  close(code: number = 1000, reason: string = 'Client closing connection'): void {
    console.log(`🛑 [WebSocket Singleton] Closing connection: ${reason}`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
  }

  /**
   * Get the number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Get WebSocket URL from environment
const getWebSocketUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: return a dummy URL (won't be used)
    return '';
  }
  
  return process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://wa33d8dcw2.execute-api.ap-south-1.amazonaws.com/prod';
};

// Initialize singleton (only on client side)
let websocketManager: WebSocketManager | null = null;

if (typeof window !== 'undefined') {
  websocketManager = WebSocketManager.getInstance({
    url: getWebSocketUrl(),
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
  });
}

// Export the singleton instance
export { websocketManager, WebSocketManager };
export type { MessageHandler };

