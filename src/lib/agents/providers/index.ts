/**
 * Provider Factory
 * Manages and creates AI provider instances
 */

import { AIProvider, ProviderConfig, ProviderType, ChatCompletionRequest, ChatCompletionResponse } from './types';
import { OpenAIProvider } from './OpenAIProvider';
import { OllamaProvider } from './OllamaProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { N8nProvider } from './N8nProvider';
import { AgentRouterProvider } from './AgentRouterProvider';
import { CustomProvider } from './CustomProvider';

class ProviderFactory {
  private providers: Map<ProviderType, AIProvider> = new Map();
  private activeProvider: ProviderType = 'openai';
  private configs: Map<ProviderType, ProviderConfig> = new Map();

  constructor() {
    // Register all providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('openrouter', new OpenRouterProvider());
    this.providers.set('n8n', new N8nProvider());
    this.providers.set('agentrouter', new AgentRouterProvider());
    this.providers.set('custom', new CustomProvider());
  }

  // Get available provider types
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  // Get provider instance
  getProvider(type: ProviderType): AIProvider | undefined {
    return this.providers.get(type);
  }

  // Get active provider
  getActiveProvider(): AIProvider {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`Active provider ${this.activeProvider} not found`);
    }
    return provider;
  }

  // Set active provider
  setActiveProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Unknown provider type: ${type}`);
    }
    this.activeProvider = type;
  }

  // Get active provider type
  getActiveProviderType(): ProviderType {
    return this.activeProvider;
  }

  // Initialize provider with config
  async initializeProvider(type: ProviderType, config: ProviderConfig): Promise<void> {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not found`);
    }
    
    this.configs.set(type, config);
    await provider.initialize(config);
  }

  // Get provider config
  getProviderConfig(type: ProviderType): ProviderConfig | undefined {
    return this.configs.get(type);
  }

  // Initialize all providers with their configs
  async initializeAll(configs: Record<ProviderType, ProviderConfig>): Promise<void> {
    for (const [type, config] of Object.entries(configs)) {
      const provider = this.providers.get(type as ProviderType);
      if (provider && config.enabled) {
        try {
          await provider.initialize(config);
          this.configs.set(type as ProviderType, config);
        } catch (error) {
          console.error(`Failed to initialize ${type} provider:`, error);
        }
      }
    }
  }

  // Create chat completion using active provider
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const provider = this.getActiveProvider();
    return provider.createChatCompletion(request);
  }

  // Test provider connection
  async testProvider(type: ProviderType): Promise<{ success: boolean; error?: string }> {
    const provider = this.providers.get(type);
    if (!provider) {
      return { success: false, error: `Provider ${type} not found` };
    }
    
    if (!provider.isReady()) {
      const config = this.configs.get(type);
      if (config) {
        await provider.initialize(config);
      } else {
        return { success: false, error: 'Provider not initialized' };
      }
    }
    
    return provider.testConnection();
  }

  // List models for provider
  async listModels(type: ProviderType): Promise<Array<{ id: string; name: string }>> {
    const provider = this.providers.get(type);
    if (!provider) {
      return [];
    }
    
    if (!provider.isReady()) {
      const config = this.configs.get(type);
      if (config) {
        await provider.initialize(config);
      }
    }
    
    const models = await provider.listModels();
    return models.map(m => ({ id: m.id, name: m.name }));
  }
}

// Singleton instance
export const providerFactory = new ProviderFactory();

// Export types
export * from './types';
