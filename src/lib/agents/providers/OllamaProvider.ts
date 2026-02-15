/**
 * Ollama Provider
 * For running local LLMs via Ollama
 */

import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types';

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama';
  readonly type = 'ollama' as const;
  
  private config: ProviderConfig | null = null;
  private baseUrl: string = 'http://localhost:11434';

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  isReady(): boolean {
    return this.config !== null;
  }

  async listModels(): Promise<ProviderModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      return (data.models || []).map((model: { name: string }) => ({
        id: model.name,
        name: model.name,
        provider: 'ollama' as const,
        supportsToolCalling: model.name.includes('llama3') || model.name.includes('mistral'),
      }));
    } catch {
      // Return default models if can't fetch
      return [
        { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama', supportsToolCalling: true },
        { id: 'llama3.1', name: 'Llama 3.1', provider: 'ollama', supportsToolCalling: true },
        { id: 'mistral', name: 'Mistral', provider: 'ollama', supportsToolCalling: true },
        { id: 'codellama', name: 'Code Llama', provider: 'ollama' },
        { id: 'qwen2.5', name: 'Qwen 2.5', provider: 'ollama', supportsToolCalling: true },
      ];
    }
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Ollama uses OpenAI-compatible API endpoint
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();

    return {
      id: data.id || `ollama-${Date.now()}`,
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
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { success: false, error: `Ollama not responding at ${this.baseUrl}` };
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running.` 
      };
    }
  }
}
