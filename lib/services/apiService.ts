// API Service for Chat Operations

export interface ChatStartResponse {
  conversation_id: string;
  model: string;
  model_name: string;
  transaction_id: string;
  vedika_coins_remaining: number;
  vedika_coins_used: number;
  status: 'conversation_created';
  message: string;
  websocket_route: 'stream_chat';
  routing?: {
    selected_model: string;
    reason: string;
    confidence: number;
  };
}

export interface ChatStartRequest {
  message: string;
  session_id: string;
  device_id?: string;
  model_id?: string;
  request_type?: 'anonymous' | 'authenticated';
  interaction_mode?: 'type' | 'dictation' | 'voice';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in';

/**
 * Step 1: Start a conversation and get conversation_id immediately
 */
export const startChatConversation = async (
  request: ChatStartRequest
): Promise<ChatStartResponse> => {
  const response = await fetch(`${API_BASE_URL}/ai/chat/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      session_id: request.session_id,
      device_id: request.device_id,
      model_id: request.model_id || 'best',
      request_type: request.request_type || 'anonymous',
      interaction_mode: request.interaction_mode || 'type',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to start conversation');
  }

  return await response.json();
};

/**
 * Step 2: WebSocket streaming request
 */
export interface WebSocketStreamRequest {
  routeKey: 'stream_chat';
  device_id: string;
  session_id: string;
  message: string;
  conversation_id: string;
  request_type: 'anonymous' | 'authenticated';
}

export const createWebSocketStreamRequest = (
  conversationId: string,
  message: string,
  sessionId: string,
  deviceId: string,
  requestType: 'anonymous' | 'authenticated' = 'anonymous'
): WebSocketStreamRequest => {
  return {
    routeKey: 'stream_chat',
    device_id: deviceId,
    session_id: sessionId,
    message: message,
    conversation_id: conversationId,
    request_type: requestType,
  };
};
