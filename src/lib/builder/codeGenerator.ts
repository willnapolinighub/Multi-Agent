/**
 * Code Generator
 * Generates code from visual workflow definitions
 */

import { Node, Edge } from 'reactflow';
import {
  BuilderNodeData,
  AgentNodeData,
  ToolNodeData,
  GeneratedCode,
  WorkflowDefinition,
} from './types';

export function generateCode(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  workflowName: string
): GeneratedCode {
  const files: GeneratedCode['files'] = [];
  const dependencies: string[] = ['z-ai-web-dev-sdk', 'uuid'];
  
  // Generate tool files
  const toolNodes = nodes.filter(n => n.type === 'tool');
  const customTools = toolNodes.filter(n => (n.data as ToolNodeData).toolType === 'custom');
  
  if (customTools.length > 0) {
    const toolsCode = generateToolsFile(customTools as Node<ToolNodeData>[]);
    files.push({
      path: `src/lib/agents/tools/customTools.ts`,
      content: toolsCode,
      language: 'typescript',
    });
  }
  
  // Generate agent files
  const agentNodes = nodes.filter(n => n.type === 'agent');
  
  if (agentNodes.length > 0) {
    const agentsCode = generateAgentsFile(
      agentNodes as Node<AgentNodeData>[], 
      edges,
      toolNodes as Node<ToolNodeData>[]
    );
    files.push({
      path: `src/lib/agents/orchestrators/customOrchestrators.ts`,
      content: agentsCode,
      language: 'typescript',
    });
  }
  
  // Generate workflow file
  const workflowCode = generateWorkflowFile(nodes, edges, workflowName);
  files.push({
    path: `src/lib/agents/workflows/${workflowName}.ts`,
    content: workflowCode,
    language: 'typescript',
  });
  
  // Generate API route
  const apiCode = generateApiRoute(workflowName);
  files.push({
    path: `src/app/api/workflows/${workflowName}/route.ts`,
    content: apiCode,
    language: 'typescript',
  });
  
  return {
    files,
    dependencies,
    instructions: `
1. Install dependencies: bun add ${dependencies.join(' ')}
2. Copy generated files to your project
3. Import and use: import { ${workflowName}Workflow } from '@/lib/agents/workflows/${workflowName}'
4. Execute: const result = await ${workflowName}Workflow.execute(input)
    `.trim(),
  };
}

function generateToolsFile(tools: Node<ToolNodeData>[]): string {
  const toolImports = `/**
 * Custom Tools - Auto-generated from Visual Builder
 */

import { Tool, ToolResult } from '../core/types';`;

  const toolDefinitions = tools.map(node => {
    const data = node.data;
    const params = data.parameters || [];
    
    const paramsType = params.map(p => 
      `${p.name}: ${p.type === 'array' ? 'unknown[]' : p.type === 'object' ? 'Record<string, unknown>' : p.type}`
    ).join(', ');
    
    const paramsObj = params.length > 0 
      ? `const { ${params.map(p => p.name).join(', ')} } = params;`
      : '';
    
    return `
export const ${toFunctionName(data.functionName)}: Tool = {
  definition: {
    name: '${data.functionName}',
    description: '${data.description || data.label}',
    parameters: {
      ${params.map(p => `'${p.name}': {
        type: '${p.type}' as const,
        description: '${p.description}',
        required: ${p.required},
      }`).join(',\n      ')}
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      ${paramsObj}
      
      // Custom tool code
      ${data.code || '// Add your implementation here'}
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};`;
  }).join('\n');

  const exports = `
export const customTools = [
  ${tools.map(t => toFunctionName((t.data as ToolNodeData).functionName)).join(',\n  ')}
];`;

  return `${toolImports}
${toolDefinitions}
${exports}`;
}

function generateAgentsFile(
  agents: Node<AgentNodeData>[],
  edges: Edge[],
  tools: Node<ToolNodeData>[]
): string {
  const imports = `/**
 * Custom Orchestrators - Auto-generated from Visual Builder
 */

import { Orchestrator } from '../core/Orchestrator';
import { AgentConfig, Task, TaskResult, LLMMessage } from '../core/types';
import { customTools } from '../tools/customTools';
${tools.length > 0 ? "import { analyticsTools, researchTools, contentTools } from '../tools';" : ''}

import { v4 as uuidv4 } from 'uuid';`;

  const agentDefinitions = agents.map(node => {
    const data = node.data;
    
    // Find connected tools
    const connectedToolIds = edges
      .filter(e => e.target === node.id)
      .map(e => e.source);
    const connectedTools = tools.filter(t => connectedToolIds.includes(t.id));
    
    const className = toClassName(data.label);
    
    return `
export class ${className} extends Orchestrator {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: '${node.id}',
      name: '${data.label}',
      description: '${data.description || `Custom ${data.agentType} agent`}',
      role: '${data.agentType}',
      domain: '${data.domain}',
      model: '${data.model || 'gpt-4o'}',
      temperature: ${data.temperature || 0.5},
      systemPrompt: \`${data.systemPrompt || `You are a ${data.label}.`}\`,
      ...config,
    });

    // Register tools
    ${connectedTools.length > 0 
      ? 'this.registerTools([\n        ' + connectedTools.map(t => '...(' + ((t.data as ToolNodeData).toolType === 'custom' ? 'customTools' : '[]') + ')').join(',\n        ') + '\n      ]);'
      : '// No tools registered'
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      this.state.status = 'thinking';
      this.state.currentTask = task.id;

      const messages: LLMMessage[] = [
        { role: 'system', content: this.config.systemPrompt || '' },
        { role: 'user', content: task.description },
      ];

      const { result } = await this.runAgentLoop(messages, 15);

      this.state.status = 'idle';
      this.state.lastActivity = new Date();

      return {
        success: true,
        output: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.state.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }
}`;
  }).join('\n');

  const exports = `
export const customOrchestrators = {
  ${agents.map(a => `${toFunctionName((a.data as AgentNodeData).label)}: new ${toClassName((a.data as AgentNodeData).label)}()`).join(',\n  ')}
};`;

  return `${imports}
${agentDefinitions}
${exports}`;
}

function generateWorkflowFile(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  workflowName: string
): string {
  const imports = `/**
 * ${workflowName} Workflow - Auto-generated from Visual Builder
 */

import { Task, TaskResult } from '../core/types';
import { customOrchestrators } from '../orchestrators/customOrchestrators';`;

  // Find trigger node
  const triggerNode = nodes.find(n => n.type === 'trigger');
  const agentNodes = nodes.filter(n => n.type === 'agent');
  
  const executeFunction = `
export async function execute${toClassName(workflowName)}(
  input: Record<string, unknown>
): Promise<TaskResult> {
  const startTime = Date.now();
  
  try {
    ${agentNodes.length > 0 ? `
    // Get the primary agent
    const primaryAgent = customOrchestrators.${toFunctionName((agentNodes[0].data as AgentNodeData).label)};
    
    // Create task
    const task: Task = {
      id: crypto.randomUUID(),
      description: input.query as string || JSON.stringify(input),
      priority: 'medium',
      status: 'pending',
      subTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { data: input },
    };
    
    // Execute
    const result = await primaryAgent.execute(task);
    
    return result;` : `
    // No agents defined in workflow
    return {
      success: false,
      error: 'No agents configured in workflow',
      executionTime: Date.now() - startTime,
    };`}
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
    };
  }
}`;

  const exports = `
export const ${toFunctionName(workflowName)}Workflow = {
  name: '${workflowName}',
  execute: execute${toClassName(workflowName)},
  nodes: ${JSON.stringify(nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label })), null, 2)},
};`;

  return `${imports}
${executeFunction}
${exports}`;
}

function generateApiRoute(workflowName: string): string {
  return `/**
 * ${workflowName} Workflow API Route
 * Auto-generated from Visual Builder
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute${toClassName(workflowName)} } from '@/lib/agents/workflows/${workflowName}';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await execute${toClassName(workflowName)}(body);
    
    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    workflow: '${workflowName}',
    endpoints: {
      POST: 'Execute the workflow with input data',
    },
  });
}`;
}

// Helper functions
function toFunctionName(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^([A-Z])/, (m) => m.toLowerCase())
    .replace(/ ([A-Z])/g, (_, l) => l.toUpperCase());
}

function toClassName(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+(.)/g, (_, l) => l.toUpperCase())
    .replace(/^([a-z])/, (_, l) => l.toUpperCase());
}

// Export workflow as JSON
export function exportWorkflowJson(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  name: string,
  description?: string
): string {
  const workflow: WorkflowDefinition = {
    id: crypto.randomUUID(),
    name,
    description,
    version: '1.0.0',
    nodes,
    edges,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return JSON.stringify(workflow, null, 2);
}
