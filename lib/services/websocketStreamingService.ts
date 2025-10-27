/**
 * WebSocket Streaming Service
 * Handles real-time streaming responses from Vedika AI backend
 */

interface StreamingCallbacks {
  onStreamStart?: (data: StreamStartEvent) => void;
  onContentChunk?: (data: ContentChunkEvent) => void;
  onStreamComplete?: (data: StreamCompleteEvent) => void;
  onStreamError?: (error: string) => void;
  onConnectionOpen?: () => void;
  onConnectionClose?: () => void;
  onConnectionError?: (error: Event) => void;
  onCreditsInfo?: (data: CreditsInfoEvent) => void;
  onCreditsExhausted?: (data: CreditsExhaustedEvent) => void;
}

interface StreamStartEvent {
  type: 'stream_start';
  model: string;
  timestamp: string;
}

interface ContentChunkEvent {
  type: 'content_chunk';
  content: string;
  chunk_id: number;
  timestamp: string;
}

interface StreamCompleteEvent {
  type: 'stream_complete';
  full_response: string;
  total_chunks: number;
  tokens: number;
  input_tokens: number;
  output_tokens: number;
  citations?: any[];
  credits?: {
    remaining: number;
    daily_total: number;
    used_today: number;
  };
  timestamp: string;
}

interface StreamErrorEvent {
  type: 'stream_error';
  error: string;
}

interface CreditsInfoEvent {
  type: 'credits_info';
  vedika_coins_remaining: number;
  daily_credits: number;
  message: string;
}

interface CreditsExhaustedEvent {
  type: 'credits_exhausted';
  vedika_coins_remaining: number;
  daily_credits: number;
  message: string;
  action_required?: string;
}

export class WebSocketStreamingService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isReconnecting = false;
  private callbacks: StreamingCallbacks = {};
  private shouldReconnect = true;

  constructor(private wsUrl: string) {}

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 [WebSocket] Connecting to:', this.wsUrl);
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('✅ [WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          this.callbacks.onConnectionOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [WebSocket] Connection error:', error);
          this.callbacks.onConnectionError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 [WebSocket] Connection closed');
          this.callbacks.onConnectionClose?.();
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`🔄 [WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
            this.isReconnecting = true;
            setTimeout(() => this.connect(), delay);
          }
        };

      } catch (error) {
        console.error('❌ [WebSocket] Failed to create connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    console.log('📨 [WebSocket] Received event:', data.type);

    switch (data.type) {
      case 'stream_start':
        console.log('🎬 [WebSocket] Stream started');
        this.callbacks.onStreamStart?.(data);
        break;

      case 'content_chunk':
        console.log('📦 [WebSocket] Chunk received:', data.chunk_id);
        this.callbacks.onContentChunk?.(data);
        break;

      case 'stream_complete':
        console.log('✅ [WebSocket] Stream complete:', {
          chunks: data.total_chunks,
          tokens: data.tokens,
        });
        this.callbacks.onStreamComplete?.(data);
        break;

      case 'stream_error':
        console.error('❌ [WebSocket] Stream error:', data.error);
        this.callbacks.onStreamError?.(data.error);
        break;

      case 'connection_established':
        console.log('✅ [WebSocket] Connection established');
        break;

      case 'credits_info':
        console.log('🪙 [WebSocket] Credits info:', {
          vedika_coins_remaining: data.vedika_coins_remaining,
          daily_credits: data.daily_credits,
          message: data.message
        });
        this.callbacks.onCreditsInfo?.(data as CreditsInfoEvent);
        break;

      case 'credits_exhausted':
        console.warn('⚠️ [WebSocket] Credits exhausted:', {
          vedika_coins_remaining: data.vedika_coins_remaining,
          message: data.message
        });
        this.callbacks.onCreditsExhausted?.(data as CreditsExhaustedEvent);
        break;

      default:
        console.log('📨 [WebSocket] Unknown event type:', data.type);
    }
  }

  /**
   * Send message via WebSocket
   */
  sendMessage(message: {
    routeKey: string;
    device_id: string;
    session_id: string;
    message: string;
    conversation_id?: string;
    request_type: string;
    model_id?: string;
    query_type?: string;
    interaction_mode?: string;
  }): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ [WebSocket] Not connected. State:', this.ws?.readyState);
      return false;
    }

    try {
      console.log('📤 [WebSocket] Sending message:', message.routeKey);
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ [WebSocket] Error sending message:', error);
      return false;
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: StreamingCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log('🔌 [WebSocket] Disconnecting...');
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): number | undefined {
    return this.ws?.readyState;
  }
}
