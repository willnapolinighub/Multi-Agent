/**
 * Custom Provider
 * For any OpenAI-compatible API endpoint
 */

import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types';

export class CustomProvider implements AIProvider {
  readonly name = 'Custom';
  readonly type = 'custom' as const;
  
  private config: ProviderConfig | null = null;
  private baseUrl: string = '';
  private apiKey: string = '';

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey || '';
  }

  isReady(): boolean {
    return this.config !== null && this.baseUrl !== '';
  }

  async listModels(): Promise<ProviderModel[]> {
    if (!this.baseUrl) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });
      
      if (!response.ok) {
        return this.getDefaultModels();
      }
      
      const data = await response.json();
      
      return (data.data || data.models || []).map((model: { id: string; name?: string }) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'custom' as const,
        supportsToolCalling: true,
      }));
    } catch {
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ProviderModel[] {
    return [
      { id: this.config?.defaultModel || 'default', name: 'Default Model', provider: 'custom', supportsToolCalling: true },
    ];
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.baseUrl) {
      throw new Error('Custom provider not configured. Please set a base URL.');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        tools: request.tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom API error: ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id || `custom-${Date.now()}`,
      model: data.model || request.model,
      choices: (data.choices || []).map((choice: {
        index: number;
        message?: { role: string; content?: string; tool_calls?: Array<{ id?: string; type?: string; function?: { name?: string; arguments?: string } }> };
        finish_reason?: string;
      }) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message?.content || null,
          ...(choice.message?.tool_calls && {
            toolCalls: choice.message.tool_calls.map((tc) => ({
              id: tc.id || `tc-${Date.now()}`,
              type: 'function' as const,
              function: {
                name: tc.function?.name || '',
                arguments: tc.function?.arguments || '{}',
              },
            })),
          }),
        },
        finishReason: (choice.finish_reason || 'stop') as ChatCompletionResponse['choices'][0]['finishReason'],
      })),
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.baseUrl) {
      return { success: false, error: 'Base URL is required' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });
      
      if (response.ok || response.status === 404) {
        // 404 is okay - some APIs don't have /models endpoint
        return { success: true };
      }
      
      return { success: false, error: `API returned status ${response.status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}
