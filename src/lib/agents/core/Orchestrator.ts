/**
 * Orchestrator Base Class
 * Handles task delegation and coordination between agents
 */

import { Agent } from './Agent';
import {
  AgentConfig,
  Task,
  TaskResult,
  TaskStatus,
  AgentRequest,
  AgentResponse,
  AgentMessage,
  LLMMessage,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export interface SubAgent {
  id: string;
  name: string;
  agent: Agent;
  capabilities: string[];
}

export abstract class Orchestrator extends Agent {
  protected subAgents: Map<string, SubAgent> = new Map();
  protected pendingTasks: Map<string, Task> = new Map();
  protected completedTasks: Map<string, TaskResult> = new Map();

  constructor(config: AgentConfig) {
    super(config);
  }

  // ============================================
  // Sub-Agent Management
  // ============================================

  registerSubAgent(agent: Agent, capabilities: string[]): void {
    this.subAgents.set(agent.id, {
      id: agent.id,
      name: agent.name,
      agent,
      capabilities,
    });

    // Register agent tool for calling sub-agents
    this.registerTool({
      definition: {
        name: `delegate_to_${agent.name.toLowerCase().replace(/\s+/g, '_')}`,
        description: `Delegate task to ${agent.name}. Capabilities: ${capabilities.join(', ')}`,
        parameters: {
          task_description: {
            type: 'string',
            description: 'Description of the task to delegate',
            required: true,
          },
          context: {
            type: 'object',
            description: 'Additional context for the task',
            required: false,
          },
        },
      },
      execute: async (params) => {
        return this.delegateTask(agent.id, params.task_description as string, params.context);
      },
    });
  }

  getSubAgent(agentId: string): SubAgent | undefined {
    return this.subAgents.get(agentId);
  }

  getAvailableAgents(): SubAgent[] {
    return Array.from(this.subAgents.values());
  }

  // ============================================
  // Task Delegation
  // ============================================

  async delegateTask(
    agentId: string,
    taskDescription: string,
    context?: unknown
  ): Promise<TaskResult> {
    const subAgent = this.subAgents.get(agentId);
    
    if (!subAgent) {
      return {
        success: false,
        error: `Sub-agent not found: ${agentId}`,
      };
    }

    // Create task
    const task: Task = {
      id: uuidv4(),
      description: taskDescription,
      priority: 'medium',
      status: 'in_progress',
      assignedTo: agentId,
      subTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { context },
    };

    this.pendingTasks.set(task.id, task);

    try {
      // Execute task on sub-agent
      const result = await subAgent.agent.execute(task);
      
      // Update task status
      task.status = result.success ? 'completed' : 'failed';
      task.result = result;
      task.updatedAt = new Date();

      // Move to completed
      this.pendingTasks.delete(task.id);
      this.completedTasks.set(task.id, result);

      return result;
    } catch (error) {
      task.status = 'failed';
      task.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      task.updatedAt = new Date();

      this.pendingTasks.delete(task.id);
      this.completedTasks.set(task.id, task.result);

      return task.result;
    }
  }

  // ============================================
  // Agent Selection
  // ============================================

  selectBestAgent(taskDescription: string): string | null {
    // Simple keyword-based selection
    // Override this method for more sophisticated selection
    const task = taskDescription.toLowerCase();
    
    for (const [id, subAgent] of this.subAgents) {
      for (const capability of subAgent.capabilities) {
        if (task.includes(capability.toLowerCase())) {
          return id;
        }
      }
    }

    // Return first available agent if no match
    const firstAgent = this.subAgents.values().next().value;
    return firstAgent?.id || null;
  }

  // ============================================
  // Planning
  // ============================================

  protected async planExecution(task: Task): Promise<Task[]> {
    const systemPrompt = this.getPlanningPrompt();
    
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Plan the execution of this task:\n\n${task.description}\n\nAvailable agents:\n${this.getAgentList()}`,
      },
    ];

    const response = await this.callLLM(messages, { temperature: 0.3 });
    
    // Parse plan from response
    // For now, return the main task
    // Override this for more sophisticated planning
    return [task];
  }

  protected getPlanningPrompt(): string {
    return `You are an orchestrator agent. Your job is to break down complex tasks into subtasks and delegate them to the appropriate agents.

Available agents:
${this.getAgentList()}

When planning:
1. Analyze the task requirements
2. Identify which agents are needed
3. Determine the order of execution
4. Consider dependencies between subtasks

Return a JSON plan with this structure:
{
  "subtasks": [
    {
      "description": "task description",
      "agent": "agent_id",
      "dependencies": ["task_id"]
    }
  ]
}`;
  }

  protected getAgentList(): string {
    return Array.from(this.subAgents.values())
      .map((a) => `- ${a.name} (${a.id}): ${a.capabilities.join(', ')}`)
      .join('\n');
  }

  // ============================================
  // Communication
  // ============================================

  async sendRequest(request: AgentRequest): Promise<AgentResponse> {
    const subAgent = this.subAgents.get(request.to);
    
    if (!subAgent) {
      return {
        requestId: request.id,
        from: this.id,
        to: request.from,
        success: false,
        error: `Agent not found: ${request.to}`,
        timestamp: new Date(),
      };
    }

    // Process request through sub-agent
    const task: Task = {
      id: uuidv4(),
      description: request.payload as string,
      priority: 'medium',
      status: 'pending',
      subTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await subAgent.agent.execute(task);

    return {
      requestId: request.id,
      from: subAgent.id,
      to: request.from,
      success: result.success,
      payload: result.output,
      error: result.error,
      timestamp: new Date(),
    };
  }

  // ============================================
  // Status & Monitoring
  // ============================================

  getPendingTasks(): Task[] {
    return Array.from(this.pendingTasks.values());
  }

  getCompletedTasks(): Map<string, TaskResult> {
    return new Map(this.completedTasks);
  }

  getStats(): {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    const completed = Array.from(this.completedTasks.values());
    return {
      totalTasks: this.pendingTasks.size + this.completedTasks.size,
      pendingTasks: this.pendingTasks.size,
      completedTasks: completed.filter((r) => r.success).length,
      failedTasks: completed.filter((r) => !r.success).length,
    };
  }
}
