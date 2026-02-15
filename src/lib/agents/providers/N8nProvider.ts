/**
 * n8n Provider
 * Integration with n8n AI capabilities via webhook
 */

import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types';

export class N8nProvider implements AIProvider {
  readonly name = 'n8n';
  readonly type = 'n8n' as const;
  
  private config: ProviderConfig | null = null;
  private baseUrl: string = 'http://localhost:5678';
  private apiKey: string = '';
  private webhookPath: string = '/webhook/ai';

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:5678';
    this.apiKey = config.apiKey || '';
    this.webhookPath = (config.options?.webhookPath as string) || '/webhook/ai';
  }

  isReady(): boolean {
    return this.config !== null;
  }

  async listModels(): Promise<ProviderModel[]> {
    // n8n uses configured AI models, return common ones
    return [
      { id: 'gpt-4o', name: 'GPT-4o (via n8n)', provider: 'n8n', supportsToolCalling: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (via n8n)', provider: 'n8n', supportsToolCalling: true },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via n8n)', provider: 'n8n', supportsToolCalling: true },
      { id: 'gemini-pro', name: 'Gemini Pro (via n8n)', provider: 'n8n' },
    ];
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // n8n expects a specific webhook payload
    const webhookUrl = `${this.baseUrl}${this.webhookPath}`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        action: 'chat',
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        tools: request.tools,
        // n8n-specific fields
        options: {
          returnFullResponse: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`n8n webhook error: ${error}`);
    }

    const data = await response.json();

    // Handle n8n response format
    // n8n might return in different formats depending on workflow configuration
    const message = data.message || data.output || data.response || data;
    const toolCalls = data.toolCalls || data.tool_calls;

    return {
      id: data.id || `n8n-${Date.now()}`,
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant' as const,
            content: typeof message === 'string' ? message : JSON.stringify(message),
            ...(toolCalls && {
              toolCalls: Array.isArray(toolCalls) ? toolCalls.map((tc: {
                id?: string;
                name?: string;
                function?: { name?: string; arguments?: string };
              }) => ({
                id: tc.id || `tc-${Date.now()}`,
                type: 'function' as const,
                function: {
                  name: tc.function?.name || tc.name || '',
                  arguments: typeof tc.function?.arguments === 'string' 
                    ? tc.function.arguments 
                    : JSON.stringify(tc.function?.arguments || {}),
                },
              })) : [],
            }),
          },
          finishReason: 'stop',
        },
      ],
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
      // Try to hit the n8n webhook with a test request
      const response = await fetch(`${this.baseUrl}${this.webhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test',
          message: 'connection test',
        }),
      });
      
      // n8n returns 200 even for simple acknowledgment
      if (response.ok) {
        return { success: true };
      }
      
      return { success: false, error: `n8n returned status ${response.status}` };
    } catch (error) {
      return { 
        success: false, 
        error: `Cannot connect to n8n at ${this.baseUrl}. Make sure n8n is running and webhook is configured.` 
      };
    }
  }
}
