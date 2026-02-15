/**
 * Client-side Provider Types
 * Types only - no Node.js dependencies
 */

export type ProviderType = 
  | 'openai'      
  | 'ollama'      
  | 'openrouter'  
  | 'n8n'         
  | 'agentrouter' 
  | 'custom';     

export interface ProviderConfig {
  type: ProviderType;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  defaultModel: string;
  availableModels: string[];
  options?: Record<string, unknown>;
}

export interface AgentSystemSettings {
  activeProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;
  masterOrchestratorModel: string;
  subOrchestratorModel: string;
  toolModel: string;
  maxIterations: number;
  defaultTemperature: number;
  timeout: number;
  debugMode: boolean;
  logApiCalls: boolean;
}

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

export const PROVIDER_INFO: Record<ProviderType, { 
  name: string; 
  description: string; 
  requiresKey: boolean; 
  docsUrl?: string 
}> = {
  openai: {
    name: 'OpenAI',
    description: 'Official OpenAI API via z-ai-web-dev-sdk',
    requiresKey: false,
    docsUrl: 'https://platform.openai.com/docs',
  },
  ollama: {
    name: 'Ollama',
    description: 'Run LLMs locally with Ollama',
    requiresKey: false,
    docsUrl: 'https://ollama.ai',
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Multi-provider API gateway',
    requiresKey: true,
    docsUrl: 'https://openrouter.ai/docs',
  },
  n8n: {
    name: 'n8n',
    description: 'Connect to n8n AI workflows via webhook',
    requiresKey: false,
    docsUrl: 'https://docs.n8n.io',
  },
  agentrouter: {
    name: 'AgentRouter',
    description: 'AI agent routing service',
    requiresKey: true,
    docsUrl: 'https://agentrouter.ai/docs',
  },
  custom: {
    name: 'Custom',
    description: 'Any OpenAI-compatible API endpoint',
    requiresKey: false,
  },
};
