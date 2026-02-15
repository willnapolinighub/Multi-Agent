/**
 * Visual Builder Types
 * Types for the node-based agent builder
 */

import { Node, Edge } from 'reactflow';

// ============================================
// Node Types
// ============================================

export type BuilderNodeType = 
  | 'agent'           // Agent/Orchestrator node
  | 'tool'            // Tool node
  | 'input'           // Input node (data source)
  | 'output'          // Output node (result)
  | 'condition'       // Conditional branch
  | 'loop'            // Loop node
  | 'transform'       // Data transformation
  | 'trigger';        // Trigger node (webhook, schedule, etc.)

// ============================================
// Node Data Types
// ============================================

export interface BaseNodeData {
  label: string;
  description?: string;
  config: Record<string, unknown>;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export interface AgentNodeData extends BaseNodeData {
  agentType: 'master' | 'sub_orchestrator' | 'specialist';
  domain: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  tools: string[];  // Connected tool IDs
}

export interface ToolNodeData extends BaseNodeData {
  toolType: 'analytics' | 'research' | 'content' | 'custom';
  functionName: string;
  parameters: ToolParameter[];
  code?: string;  // Custom code for execution
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface InputNodeData extends BaseNodeData {
  inputType: 'text' | 'json' | 'file' | 'webhook' | 'api';
  defaultValue?: unknown;
  schema?: Record<string, unknown>;
}

export interface OutputNodeData extends BaseNodeData {
  outputType: 'text' | 'json' | 'file' | 'webhook' | 'api';
  format?: string;
}

export interface ConditionNodeData extends BaseNodeData {
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists';
    value: unknown;
    outputHandle: string;
  }[];
  defaultHandle: string;
}

export interface LoopNodeData extends BaseNodeData {
  loopType: 'forEach' | 'while' | 'times';
  maxIterations?: number;
  collectionField?: string;
}

export interface TransformNodeData extends BaseNodeData {
  transformType: 'map' | 'filter' | 'reduce' | 'merge' | 'split';
  expression?: string;
  code?: string;
}

export interface TriggerNodeData extends BaseNodeData {
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event';
  schedule?: string;  // Cron expression
  webhookPath?: string;
  eventType?: string;
}

// Union type for all node data
export type BuilderNodeData = 
  | AgentNodeData 
  | ToolNodeData 
  | InputNodeData 
  | OutputNodeData 
  | ConditionNodeData 
  | LoopNodeData 
  | TransformNodeData 
  | TriggerNodeData;

// ============================================
// Workflow Types
// ============================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: Node<BuilderNodeData>[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  nodeExecutions: NodeExecution[];
  error?: string;
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
}

// ============================================
// Template Types
// ============================================

export interface NodeTemplate {
  type: BuilderNodeType;
  label: string;
  description: string;
  icon: string;
  category: 'trigger' | 'agent' | 'tool' | 'logic' | 'io';
  defaultData: Partial<BuilderNodeData>;
  inputs: { id: string; label: string; type: string }[];
  outputs: { id: string; label: string; type: string }[];
}

// ============================================
// Code Generation Types
// ============================================

export interface GeneratedCode {
  files: {
    path: string;
    content: string;
    language: string;
  }[];
  dependencies: string[];
  instructions: string;
}
