/**
 * WebSocket Service for Streaming Chat
 * Handles real-time chat streaming with Vedika AI backend
 */

import config from '../config';
import { DeviceManager } from '../utils/deviceManager';

// WebSocket URL (replace with your actual WebSocket URL)
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
  'wss://9blg9pjpfc.execute-api.ap-south-1.amazonaws.com/Prod';

export interface StreamChatMessage {
  message: string;
  conversation_id?: string;
  model_id?: 'best' | 'claude-sonnet-4.5' | 'claude-3-5-sonnet';
  query_type?: 'general' | 'technical' | 'creative' | 'analytical';
  user_id?: string;
}

export interface ChatChunk {
  type: 'conversation_started' | 'stream_start' | 'content_chunk' | 'stream_complete' | 'error';
  conversation_id?: string;
  content?: string;
  chunk_id?: number;
  timestamp?: string;
  full_response?: string;
  total_chunks?: number;
  credits?: {
    remaining: number;
    used_today: number;
    daily_total: number;
    message: string;
  };
  error?: string;
  message?: string;
}

type MessageHandler = (chunk: ChatChunk) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ WebSocket connection in progress...');
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting to WebSocket:', WS_URL);
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data);
            
            // Notify all handlers
            this.messageHandlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.ws = null;

          // Auto-reconnect if not exceeded max attempts
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
          }
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Send streaming chat message
   */
  async sendMessage(params: StreamChatMessage): Promise<void> {
    // Ensure connection
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    const deviceId = DeviceManager.getDeviceId();
    const sessionId = DeviceManager.getSessionId();

    if (!sessionId) {
      throw new Error('No active session. Please refresh the page.');
    }

    const payload = {
      routeKey: 'stream_chat',
      device_id: deviceId,
      session_id: sessionId,
      message: params.message,
      conversation_id: params.conversation_id,
      request_type: params.user_id ? 'authenticated' : 'anonymous',
      model_id: params.model_id || 'best',
      query_type: params.query_type || 'general',
      ...(params.user_id && { user_id: params.user_id }),
    };

    console.log('📤 Sending WebSocket message:', { ...payload, message: params.message.substring(0, 50) + '...' });
    this.ws!.send(JSON.stringify(payload));
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

