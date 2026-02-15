/**
 * AI Provider Types
 * Defines the interface and types for multiple AI providers
 */

// ============================================
// Provider Types
// ============================================

export type ProviderType = 
  | 'openai'      // Default z-ai-web-dev-sdk (OpenAI)
  | 'ollama'      // Local Ollama
  | 'openrouter'  // OpenRouter API
  | 'n8n'         // n8n AI
  | 'agentrouter' // AgentRouter
  | 'custom';     // Custom OpenAI-compatible API

export interface ProviderConfig {
  type: ProviderType;
  enabled: boolean;
  
  // API Configuration
  apiKey?: string;
  baseUrl?: string;
  
  // Model Configuration
  defaultModel: string;
  availableModels: string[];
  
  // Provider-specific options
  options?: Record<string, unknown>;
}

export interface ProviderModel {
  id: string;
  name: string;
  provider: ProviderType;
  contextLength?: number;
  supportsToolCalling?: boolean;
  supportsVision?: boolean;
}

// ============================================
// LLM Request/Response Types
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  toolCallId?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      toolCalls?: {
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  }[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Provider Interface
// ============================================

export interface AIProvider {
  readonly name: string;
  readonly type: ProviderType;
  
  // Initialize provider with config
  initialize(config: ProviderConfig): Promise<void>;
  
  // Check if provider is ready
  isReady(): boolean;
  
  // List available models
  listModels(): Promise<ProviderModel[]>;
  
  // Create chat completion
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  
  // Test connection
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ============================================
// Settings Types
// ============================================

export interface AgentSystemSettings {
  // Provider settings
  activeProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;
  
  // Default model settings
  masterOrchestratorModel: string;
  subOrchestratorModel: string;
  toolModel: string;
  
  // Agent settings
  maxIterations: number;
  defaultTemperature: number;
  timeout: number;
  
  // Debug settings
  debugMode: boolean;
  logApiCalls: boolean;
}

// ============================================
// Default Configurations
// ============================================

export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  openai: {
    type: 'openai',
    enabled: true,
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  ollama: {
    type: 'ollama',
    enabled: false,
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    availableModels: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'qwen2.5'],
  },
  openrouter: {
    type: 'openrouter',
    enabled: false,
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    availableModels: [
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
    ],
  },
  n8n: {
    type: 'n8n',
    enabled: false,
    baseUrl: 'http://localhost:5678',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini'],
    options: {
      webhookPath: '/webhook/ai',
    },
  },
  agentrouter: {
    type: 'agentrouter',
    enabled: false,
    baseUrl: 'https://api.agentrouter.ai/v1',
    defaultModel: 'auto',
    availableModels: ['auto', 'gpt-4o', 'claude-3.5-sonnet', 'gemini-pro'],
  },
  custom: {
    type: 'custom',
    enabled: false,
    baseUrl: '',
    defaultModel: '',
    availableModels: [],
  },
};

export const DEFAULT_SETTINGS: AgentSystemSettings = {
  activeProvider: 'openai',
  providers: DEFAULT_PROVIDER_CONFIGS,
  masterOrchestratorModel: 'gpt-4o',
  subOrchestratorModel: 'gpt-4o',
  toolModel: 'gpt-4o-mini',
  maxIterations: 15,
  defaultTemperature: 0.7,
  timeout: 60000,
  debugMode: false,
  logApiCalls: false,
};
