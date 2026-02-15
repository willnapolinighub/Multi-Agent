/**
 * Base Agent Class
 * Foundation class for all agents in the system
 * Updated to support multiple AI providers
 */

import ZAI from 'z-ai-web-dev-sdk';
import {
  AgentConfig,
  AgentState,
  AgentMessage,
  Tool,
  ToolCall,
  ToolResult,
  Task,
  TaskResult,
  LLMMessage,
  LLMResponse,
} from './types';
import { 
  providerFactory, 
  ChatCompletionRequest, 
  ProviderType 
} from '../providers';
import { v4 as uuidv4 } from 'uuid';

export abstract class Agent {
  protected config: AgentConfig;
  protected state: AgentState;
  protected tools: Map<string, Tool> = new Map();
  protected zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  protected messageHistory: AgentMessage[] = [];
  protected providerType: ProviderType = 'openai';
  protected providerConfig: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  } = {};

  constructor(config: AgentConfig) {
    this.config = config;
    this.state = {
      status: 'idle',
      messages: [],
      context: {},
    };
  }

  // ============================================
  // Initialization
  // ============================================

  async initialize(): Promise<void> {
    // Initialize default OpenAI provider via SDK
    this.zai = await ZAI.create();
    this.state.status = 'idle';
  }

  // ============================================
  // Provider Configuration
  // ============================================

  setProvider(type: ProviderType, config?: { apiKey?: string; baseUrl?: string; model?: string }): void {
    this.providerType = type;
    this.providerConfig = config || {};
  }

  // ============================================
  // Tool Management
  // ============================================

  registerTool(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  registerTools(tools: Tool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
  }

  getToolDefinitions(): Tool['definition'][] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  // ============================================
  // Message Handling
  // ============================================

  addMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    this.messageHistory.push({
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    });
  }

  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  // ============================================
  // LLM Integration - Multi-Provider Support
  // ============================================

  protected async callLLM(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<LLMResponse> {
    const tools = this.getToolDefinitions();
    const hasTools = tools.length > 0;
    const model = options?.model || this.providerConfig.model || this.config.model || 'gpt-4o';

    // Use provider factory for non-OpenAI providers
    if (this.providerType !== 'openai') {
      try {
        const request: ChatCompletionRequest = {
          model,
          messages: messages.map(m => ({
            role: m.role === 'tool' ? 'user' as const : m.role as 'system' | 'user' | 'assistant' | 'tool',
            content: m.content,
            ...(m.toolCalls && { toolCalls: m.toolCalls }),
            ...(m.toolCallId && { toolCallId: m.toolCallId }),
          })),
          temperature: options?.temperature ?? this.config.temperature ?? 0.7,
          maxTokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
          ...(hasTools && {
            tools: tools.map(t => ({
              type: 'function' as const,
              function: {
                name: t.name,
                description: t.description,
                parameters: {
                  type: 'object' as const,
                  properties: t.parameters,
                  required: Object.entries(t.parameters)
                    .filter(([, p]) => p.required)
                    .map(([name]) => name),
                },
              },
            })),
          }),
        };

        const response = await providerFactory.createChatCompletion(request);
        
        const choice = response.choices[0];
        return {
          content: choice.message.content || '',
          toolCalls: choice.message.toolCalls?.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
          finishReason: choice.finishReason || 'stop',
          usage: response.usage,
        };
      } catch (error) {
        console.error('Provider error, falling back to OpenAI:', error);
        // Fall through to OpenAI fallback
      }
    }

    // Default OpenAI via z-ai-web-dev-sdk
    if (!this.zai) {
      this.zai = await ZAI.create();
    }

    const response = await this.zai.chat.completions.create({
      model,
      messages: messages.map(m => ({
        role: m.role === 'tool' ? 'user' as const : m.role,
        content: m.content,
        ...(m.toolCalls && { tool_calls: m.toolCalls }),
        ...(m.toolCallId && { tool_call_id: m.toolCallId }),
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      ...(hasTools && {
        tools: tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: {
              type: 'object',
              properties: t.parameters,
              required: Object.entries(t.parameters)
                .filter(([, p]) => p.required)
                .map(([name]) => name),
            },
          },
        })),
      }),
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      finishReason: choice.finish_reason as LLMResponse['finishReason'],
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  // ============================================
  // Tool Execution
  // ============================================

  protected async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.toolName}`,
      };
    }

    try {
      const result = await tool.execute(toolCall.arguments);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  protected parseToolCalls(
    toolCalls: NonNullable<LLMResponse['toolCalls']>
  ): ToolCall[] {
    return toolCalls.map((tc) => ({
      id: tc.id,
      toolName: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
  }

  // ============================================
  // Agent Loop
  // ============================================

  async runAgentLoop(
    initialMessages: LLMMessage[],
    maxIterations: number = 10
  ): Promise<{ messages: AgentMessage[]; result: unknown }> {
    const allMessages: AgentMessage[] = [];
    let messages = [...initialMessages];
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;
      this.state.status = 'thinking';

      // Call LLM
      const response = await this.callLLM(messages);

      // Add assistant message
      const assistantMessage: AgentMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls
          ? this.parseToolCalls(response.toolCalls)
          : undefined,
      };
      allMessages.push(assistantMessage);

      // Check if done
      if (response.finishReason === 'stop' || !response.toolCalls?.length) {
        this.state.status = 'idle';
        return {
          messages: allMessages,
          result: response.content,
        };
      }

      // Execute tools
      this.state.status = 'executing';
      const toolResults: LLMMessage[] = [];

      for (const tc of response.toolCalls) {
        const toolCall: ToolCall = {
          id: tc.id,
          toolName: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        };

        const result = await this.executeToolCall(toolCall);

        // Add tool result message
        const toolMessage: AgentMessage = {
          id: uuidv4(),
          role: 'tool',
          content: JSON.stringify(result),
          timestamp: new Date(),
          toolResult: result,
        };
        allMessages.push(toolMessage);

        // Add to LLM messages
        toolResults.push({
          role: 'tool',
          toolCallId: tc.id,
          content: JSON.stringify(result),
        });

        // Also add assistant message with tool call
        messages.push({
          role: 'assistant',
          content: response.content,
          toolCalls: response.toolCalls,
        });
      }

      messages.push(...toolResults);
    }

    this.state.status = 'idle';
    return {
      messages: allMessages,
      result: 'Maximum iterations reached',
    };
  }

  // ============================================
  // Abstract Methods
  // ============================================

  abstract execute(task: Task): Promise<TaskResult>;

  // ============================================
  // Getters
  // ============================================

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get role(): string {
    return this.config.role;
  }

  get domain(): string {
    return this.config.domain;
  }

  getStatus(): AgentState {
    return { ...this.state };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
