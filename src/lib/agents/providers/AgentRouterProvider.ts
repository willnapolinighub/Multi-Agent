/**
 * AgentRouter Provider
 * AI agent routing service
 */

import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types';

export class AgentRouterProvider implements AIProvider {
  readonly name = 'AgentRouter';
  readonly type = 'agentrouter' as const;
  
  private config: ProviderConfig | null = null;
  private baseUrl: string = 'https://api.agentrouter.ai/v1';
  private apiKey: string = '';

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.agentrouter.ai/v1';
    this.apiKey = config.apiKey || '';
  }

  isReady(): boolean {
    return this.config !== null && this.apiKey !== '';
  }

  async listModels(): Promise<ProviderModel[]> {
    // AgentRouter has an "auto" mode that picks the best model
    return [
      { id: 'auto', name: 'Auto (Best Available)', provider: 'agentrouter', supportsToolCalling: true },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'agentrouter', supportsToolCalling: true },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'agentrouter', supportsToolCalling: true },
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'agentrouter', supportsToolCalling: true },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'agentrouter', supportsToolCalling: true },
    ];
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        tools: request.tools,
        // AgentRouter specific options
        agent_options: {
          enable_routing: true,
          optimize_for: 'balanced', // or 'speed', 'cost', 'quality'
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AgentRouter API error: ${error}`);
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
      return { success: false, error: 'API key is required for AgentRouter' };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      if (response.ok) {
        return { success: true };
      }
      
      return { success: false, error: `AgentRouter returned status ${response.status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}
