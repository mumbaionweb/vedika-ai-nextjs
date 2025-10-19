/**
 * API Types and Interfaces
 * Based on Vedika AI Backend OpenAPI specification
 */

// Session/Device Types for Anonymous Users
export interface DeviceSession {
  device_id: string;
  session_id: string;
}

// Message Types
export interface Message {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  tokens_used?: number;
}

// Conversation Types
export interface Conversation {
  conversation_id: string;
  title: string;
  topic?: string;
  model: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  total_tokens: number;
  session_type: string;
  plan?: string;
}

// Conversation with Messages
export interface ConversationDetail {
  conversation_id: string;
  messages: Message[];
  total: number;
}

// Chat Request (for sending messages)
export interface ChatRequest {
  message: string;
  conversation_id?: string;
  model_id?: 'best' | 'claude-sonnet-4.5' | 'claude-3-5-sonnet';
  query_type?: 'general' | 'technical' | 'creative' | 'analytical';
  // For authenticated users
  user_id?: string;
  request_type?: 'authenticated' | 'anonymous';
  // For anonymous users
  device_id?: string;
  session_id?: string;
}

// Chat Response
export interface ChatResponse {
  conversation_id: string;
  response: string;
  tokens_used: number;
  model: string;
  model_name: string;
  response_time_ms: number;
  timestamp: string;
  credits?: {
    remaining: number;
    daily_total: number;
    used_today: number;
    message: string;
  };
}

// List Conversations Request
export interface ListConversationsRequest {
  request_type: 'authenticated' | 'anonymous';
  user_id?: string;
  device_id?: string;
  session_id?: string;
  limit?: number;
}

// List Conversations Response
export interface ListConversationsResponse {
  conversations: Conversation[];
  total: number;
  owner_type: 'user' | 'device';
  owner_id: string;
}

// Get Conversation Request
export interface GetConversationRequest {
  conversation_id: string;
  request_type: 'authenticated' | 'anonymous';
  user_id?: string;
  device_id?: string;
  session_id?: string;
}

// Delete Conversation Request
export interface DeleteConversationRequest {
  conversation_id: string;
  request_type: 'authenticated' | 'anonymous';
  user_id?: string;
  device_id?: string;
  session_id?: string;
}

// Error Response
export interface APIError {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, any>;
}

// API Response Wrapper
export type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: APIError };

