/**
 * API Service Layer
 * Handles all backend API communications for Vedika AI
 */

import config from '../config';
import { getOrCreateDeviceSession } from '../utils/session';
import type {
  ChatRequest,
  ChatResponse,
  ListConversationsRequest,
  ListConversationsResponse,
  GetConversationRequest,
  ConversationDetail,
  DeleteConversationRequest,
  CoinsBalance,
  CoinsTransaction,
  APIResponse,
  APIError,
} from '../types/api';

class APIService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        const error: APIError = {
          error: data.error || 'API Error',
          message: data.message || data.detail || 'An error occurred',
          status_code: response.status,
          details: data.details || data,
        };
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const apiError: APIError = {
        error: 'Parse Error',
        message: error instanceof Error ? error.message : 'Failed to parse response',
        status_code: response.status,
      };
      return { success: false, error: apiError };
    }
  }

  /**
   * Send a chat message (create new conversation or continue existing)
   * Automatically handles anonymous user sessions
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    options?: {
      modelId?: 'best' | 'claude-sonnet-4.5' | 'claude-3-5-sonnet';
      queryType?: 'general' | 'technical' | 'creative' | 'analytical';
      userId?: string;
    }
  ): Promise<APIResponse<ChatResponse>> {
    try {
      // Get device session for anonymous users
      const session = getOrCreateDeviceSession();

      const payload: ChatRequest = {
        message,
        conversation_id: conversationId,
        model_id: options?.modelId || 'best',
        query_type: options?.queryType || 'general',
        request_type: options?.userId ? 'authenticated' : 'anonymous',
      };

      // Add authentication details
      if (options?.userId) {
        payload.user_id = options.userId;
      } else {
        payload.device_id = session.device_id;
        payload.session_id = session.session_id;
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/ai/chat`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      return this.handleResponse<ChatResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to send message',
          status_code: 0,
        },
      };
    }
  }

  /**
   * Get a specific conversation by ID with all messages
   */
  async getConversation(
    conversationId: string,
    userId?: string
  ): Promise<APIResponse<ConversationDetail>> {
    try {
      const session = getOrCreateDeviceSession();

      const params = new URLSearchParams({
        request_type: userId ? 'authenticated' : 'anonymous',
      });

      if (userId) {
        params.append('user_id', userId);
      } else {
        params.append('device_id', session.device_id);
        params.append('session_id', session.session_id);
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/ai/conversations/${conversationId}?${params}`
      );

      return this.handleResponse<ConversationDetail>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to get conversation',
          status_code: 0,
        },
      };
    }
  }

  /**
   * List all conversations (with pagination)
   */
  async listConversations(
    limit: number = 50,
    userId?: string
  ): Promise<APIResponse<ListConversationsResponse>> {
    try {
      const session = getOrCreateDeviceSession();

      const params = new URLSearchParams({
        request_type: userId ? 'authenticated' : 'anonymous',
        limit: limit.toString(),
      });

      if (userId) {
        params.append('user_id', userId);
      } else {
        params.append('device_id', session.device_id);
        params.append('session_id', session.session_id);
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/ai/conversations?${params}`
      );

      return this.handleResponse<ListConversationsResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to list conversations',
          status_code: 0,
        },
      };
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId?: string
  ): Promise<APIResponse<void>> {
    try {
      const session = getOrCreateDeviceSession();

      const params = new URLSearchParams({
        request_type: userId ? 'authenticated' : 'anonymous',
      });

      if (userId) {
        params.append('user_id', userId);
      } else {
        params.append('device_id', session.device_id);
        params.append('session_id', session.session_id);
      }

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/ai/conversations/${conversationId}?${params}`,
        {
          method: 'DELETE',
        }
      );

      return this.handleResponse<void>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to delete conversation',
          status_code: 0,
        },
      };
    }
  }

  /**
   * Get coins balance for user or device
   */
  async getCoinsBalance(userId?: string): Promise<APIResponse<CoinsBalance>> {
    try {
      const session = getOrCreateDeviceSession();

      const params = new URLSearchParams({
        request_type: userId ? 'authenticated' : 'anonymous',
      });

      if (userId) {
        params.append('user_id', userId);
      } else {
        params.append('device_id', session.device_id);
        params.append('session_id', session.session_id);
      }

      const url = `${this.baseUrl}/coins/balance?${params}`;
      console.log('🪙 [API] Fetching coins balance from:', url);
      console.log('🪙 [API] Session:', session);

      const response = await this.fetchWithTimeout(url);
      
      console.log('🪙 [API] Response status:', response.status);
      console.log('🪙 [API] Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await this.handleResponse<CoinsBalance>(response);
      console.log('🪙 [API] Parsed result:', result);

      return result;
    } catch (error) {
      console.error('❌ [API] Error fetching coins balance:', error);
      return {
        success: false,
        error: {
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Failed to get coins balance',
          status_code: 0,
        },
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
