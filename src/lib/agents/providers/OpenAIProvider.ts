/**
 * OpenAI Provider
 * Uses z-ai-web-dev-sdk for OpenAI API
 */

import ZAI from 'z-ai-web-dev-sdk';
import {
  AIProvider,
  ProviderConfig,
  ProviderModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
} from './types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly type = 'openai' as const;
  
  private config: ProviderConfig | null = null;
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.zai = await ZAI.create();
  }

  isReady(): boolean {
    return this.zai !== null && this.config !== null;
  }

  async listModels(): Promise<ProviderModel[]> {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000, supportsToolCalling: true, supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextLength: 128000, supportsToolCalling: true, supportsVision: true },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextLength: 128000, supportsToolCalling: true, supportsVision: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', contextLength: 16384, supportsToolCalling: true },
    ];
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.zai) {
      throw new Error('Provider not initialized');
    }

    const response = await this.zai.chat.completions.create({
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role === 'tool' ? 'user' as const : m.role,
        content: m.content,
        ...(m.toolCalls && { tool_calls: m.toolCalls }),
        ...(m.toolCallId && { tool_call_id: m.toolCallId }),
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      ...(request.tools && {
        tools: request.tools as unknown as Array<{
          type: 'function';
          function: { name: string; description: string; parameters: object };
        }>,
      }),
    });

    return {
      id: response.id,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: 'assistant' as const,
          content: choice.message.content,
          ...(choice.message.tool_calls && {
            toolCalls: choice.message.tool_calls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            })),
          }),
        },
        finishReason: (choice.finish_reason || 'stop') as ChatCompletionResponse['choices'][0]['finishReason'],
      })),
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.zai) {
        return { success: false, error: 'Provider not initialized' };
      }
      // Simple test call
      await this.zai.chat.completions.create({
        model: this.config?.defaultModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
