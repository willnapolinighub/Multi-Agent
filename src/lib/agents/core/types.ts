/**
 * Multi-Agent System Types
 * Core interfaces and types for the hierarchical agent architecture
 */

// ============================================
// Tool/Skill System Types
// ============================================

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool {
  definition: ToolDefinition;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

// ============================================
// Agent Types
// ============================================

export type AgentRole = 
  | 'master_orchestrator'
  | 'sub_orchestrator'
  | 'specialist';

export type AgentDomain = 
  | 'analytics'
  | 'research'
  | 'content'
  | 'code'
  | 'general';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  domain: AgentDomain;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AgentState {
  status: 'idle' | 'thinking' | 'executing' | 'waiting' | 'error';
  currentTask?: string;
  lastActivity?: Date;
  messages: AgentMessage[];
  context: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

// ============================================
// Task Types
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'delegated';

export interface Task {
  id: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string; // Agent ID
  delegatedTo?: string; // Sub-orchestrator ID
  parentTaskId?: string;
  subTasks: Task[];
  result?: TaskResult;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  output?: unknown;
  error?: string;
  artifacts?: Artifact[];
  executionTime?: number;
}

export interface Artifact {
  id: string;
  type: 'data' | 'report' | 'chart' | 'code' | 'document' | 'url';
  name: string;
  content: unknown;
  mimeType?: string;
}

// ============================================
// Communication Types
// ============================================

export interface AgentRequest {
  id: string;
  taskId: string;
  from: string; // Agent ID
  to: string; // Agent ID or 'broadcast'
  type: 'task' | 'query' | 'result' | 'error' | 'status';
  payload: unknown;
  timestamp: Date;
}

export interface AgentResponse {
  requestId: string;
  from: string;
  to: string;
  success: boolean;
  payload?: unknown;
  error?: string;
  timestamp: Date;
}

// ============================================
// LLM Integration Types
// ============================================

export interface LLMMessage {
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

export interface LLMResponse {
  content: string;
  toolCalls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// System Types
// ============================================

export interface AgentSystemConfig {
  masterOrchestrator: AgentConfig;
  subOrchestrators: AgentConfig[];
  tools: Tool[];
  maxIterations?: number;
  timeout?: number;
  debug?: boolean;
}

export interface SystemStatus {
  isRunning: boolean;
  activeAgents: string[];
  pendingTasks: number;
  completedTasks: number;
  errors: number;
  uptime: number;
}
