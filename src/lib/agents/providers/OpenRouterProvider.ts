/**
 * OpenRouter Provider
 * Multi-model API gateway supporting many providers
 */

import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  readonly type = 'openrouter' as const;
  
  private config: ProviderConfig | null = null;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private apiKey: string = '';

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.apiKey = config.apiKey || '';
  }

  isReady(): boolean {
    return this.config !== null && this.apiKey !== '';
  }

  async listModels(): Promise<ProviderModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      const data = await response.json();
      
      return (data.data || []).map((model: {
        id: string;
        name?: string;
        context_length?: number;
      }) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'openrouter' as const,
        contextLength: model.context_length,
        supportsToolCalling: true, // Most OpenRouter models support this
      }));
    } catch {
      // Return default popular models
      return [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', supportsToolCalling: true },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'openrouter', supportsToolCalling: true },
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter', supportsToolCalling: true },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter', supportsToolCalling: true },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter', supportsToolCalling: true },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter', supportsToolCalling: true },
      ];
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
        'X-Title': 'Multi-Agent System',
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
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      model: data.model,
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
    if (!this.apiKey) {
      return { success: false, error: 'API key is required for OpenRouter' };
    }
    
    try {
      await this.listModels();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}
