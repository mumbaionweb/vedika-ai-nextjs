interface Model {
  id: string;
  name: string;
  description: string;
  speed: string;
  cost: string;
  best_for: string;
}

interface ModelPreference {
  has_preference: boolean;
  preference_type: 'auto_select' | 'user_override' | null;
  preferred_model: string | null;
  usage_count: number;
  available_models: Model[];
  total_models: number;
}

interface ModelListResponse {
  models: Model[];
  total_count: number;
}

interface PreferenceResponse {
  success: boolean;
  message: string;
  current_preference?: {
    model_id: string;
    preference_type: string;
  } | null;
}

class RoutingApiService {
  private baseUrl: string;

  constructor() {
    // Use NEXT_PUBLIC_API_BASE_URL from environment or fallback to production API
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vedika.ai.in';
  }

  /**
   * Get list of available models
   */
  async getAvailableModels(): Promise<Model[]> {
    try {
      const url = `${this.baseUrl}/routing/models`;
      console.log('🔍 Fetching models from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        // If endpoint doesn't exist yet (404), return empty array
        if (response.status === 404) {
          console.warn('⚠️ Models endpoint not found (404). Using default "Best" option only.');
          return [];
        }
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data: ModelListResponse = await response.json();
      console.log('✅ Models data received:', data);
      console.log('📦 Number of models:', data.models?.length || 0);
      return data.models;
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // Return empty array so UI still shows "Best" option
      return [];
    }
  }

  /**
   * Get user's current model preference
   */
  async getUserPreference(
    deviceId: string,
    userId?: string
  ): Promise<ModelPreference> {
    try {
      const params = new URLSearchParams({ device_id: deviceId });
      if (userId) params.append('user_id', userId);

      const response = await fetch(
        `${this.baseUrl}/routing/stats?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user preference: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching user preference:', error);
      throw error;
    }
  }

  /**
   * Set user's model preference (override)
   */
  async setModelPreference(
    modelId: string,
    deviceId: string,
    userId?: string
  ): Promise<PreferenceResponse> {
    try {
      const params = new URLSearchParams({ device_id: deviceId });
      if (userId) params.append('user_id', userId);

      const response = await fetch(
        `${this.baseUrl}/routing/preferences?${params.toString()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_id: modelId })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to set model preference: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error setting model preference:', error);
      throw error;
    }
  }

  /**
   * Reset to auto-select
   */
  async resetToAutoSelect(
    deviceId: string,
    userId?: string
  ): Promise<PreferenceResponse> {
    try {
      const params = new URLSearchParams({ device_id: deviceId });
      if (userId) params.append('user_id', userId);

      const response = await fetch(
        `${this.baseUrl}/routing/preferences?${params.toString()}`,
        {
          method: 'DELETE'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to reset model preference: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error resetting model preference:', error);
      throw error;
    }
  }
}

export const routingApi = new RoutingApiService();
export type { Model, ModelPreference, PreferenceResponse };
