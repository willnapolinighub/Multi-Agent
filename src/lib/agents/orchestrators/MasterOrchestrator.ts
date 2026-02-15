/**
 * Master Orchestrator
 * Top-level coordinator that delegates to specialized sub-orchestrators
 */

import { Orchestrator } from '../core/Orchestrator';
import { AgentConfig, Task, TaskResult, LLMMessage, Tool } from '../core/types';
import { AnalyticsOrchestrator } from './AnalyticsOrchestrator';
import { ResearchOrchestrator } from './ResearchOrchestrator';
import { ContentOrchestrator } from './ContentOrchestrator';
import { v4 as uuidv4 } from 'uuid';

export class MasterOrchestrator extends Orchestrator {
  private analyticsOrchestrator: AnalyticsOrchestrator;
  private researchOrchestrator: ResearchOrchestrator;
  private contentOrchestrator: ContentOrchestrator;

  constructor(config?: Partial<AgentConfig>) {
    super({
      id: 'master-orchestrator',
      name: 'Master Orchestrator',
      description: 'Top-level coordinator that plans and delegates tasks to specialized agents',
      role: 'master_orchestrator',
      domain: 'general',
      model: 'gpt-4o',
      temperature: 0.3,
      systemPrompt: `You are the Master Orchestrator, the top-level coordinator of a multi-agent system.

Your role is to:
1. Understand user requests and goals
2. Break down complex tasks into subtasks
3. Delegate to specialized sub-orchestrators
4. Coordinate execution and gather results
5. Synthesize outputs into a final response

Available Sub-Orchestrators:
- Analytics Orchestrator: Data analysis, statistics, trends, insights
- Research Orchestrator: Web search, content extraction, fact-checking
- Content Orchestrator: Writing, formatting, report generation

When handling requests:
1. Analyze the request to determine what capabilities are needed
2. Plan the execution order and dependencies
3. Delegate tasks to appropriate orchestrators
4. Monitor progress and handle errors
5. Combine results into a coherent response

You can delegate multiple tasks in parallel when there are no dependencies.
Always think step-by-step and explain your reasoning.`,
      ...config,
    });

    // Initialize sub-orchestrators
    this.analyticsOrchestrator = new AnalyticsOrchestrator();
    this.researchOrchestrator = new ResearchOrchestrator();
    this.contentOrchestrator = new ContentOrchestrator();

    // Register delegation tools
    this.registerDelegationTools();
  }

  private registerDelegationTools(): void {
    // Analytics delegation tool
    const analyticsTool: Tool = {
      definition: {
        name: 'delegate_to_analytics',
        description: 'Delegate a data analysis task to the Analytics Orchestrator. Use for statistics, trends, comparisons, and data insights.',
        parameters: {
          task_description: {
            type: 'string',
            description: 'Detailed description of the analysis task',
            required: true,
          },
          data: {
            type: 'object',
            description: 'Data to analyze (if applicable)',
            required: false,
          },
          context: {
            type: 'object',
            description: 'Additional context for the analysis',
            required: false,
          },
        },
      },
      execute: async (params) => {
        const task: Task = {
          id: uuidv4(),
          description: params.task_description as string,
          priority: 'medium',
          status: 'pending',
          subTasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            data: params.data,
            context: params.context,
          },
        };
        return this.analyticsOrchestrator.execute(task);
      },
    };

    // Research delegation tool
    const researchTool: Tool = {
      definition: {
        name: 'delegate_to_research',
        description: 'Delegate a research task to the Research Orchestrator. Use for web search, content extraction, and fact-checking.',
        parameters: {
          task_description: {
            type: 'string',
            description: 'Detailed description of the research task',
            required: true,
          },
          urls: {
            type: 'array',
            description: 'URLs to investigate (if applicable)',
            required: false,
          },
          context: {
            type: 'object',
            description: 'Additional context for the research',
            required: false,
          },
        },
      },
      execute: async (params) => {
        const task: Task = {
          id: uuidv4(),
          description: params.task_description as string,
          priority: 'medium',
          status: 'pending',
          subTasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            urls: params.urls,
            context: params.context,
          },
        };
        return this.researchOrchestrator.execute(task);
      },
    };

    // Content delegation tool
    const contentTool: Tool = {
      definition: {
        name: 'delegate_to_content',
        description: 'Delegate a content creation task to the Content Orchestrator. Use for writing, formatting, and report generation.',
        parameters: {
          task_description: {
            type: 'string',
            description: 'Detailed description of the content task',
            required: true,
          },
          topic: {
            type: 'string',
            description: 'Topic or subject of the content',
            required: false,
          },
          tone: {
            type: 'string',
            description: 'Writing tone: formal, casual, professional, technical',
            required: false,
          },
          format: {
            type: 'string',
            description: 'Output format: markdown, html, plain_text',
            required: false,
          },
          data: {
            type: 'object',
            description: 'Data to include in the content',
            required: false,
          },
        },
      },
      execute: async (params) => {
        const task: Task = {
          id: uuidv4(),
          description: params.task_description as string,
          priority: 'medium',
          status: 'pending',
          subTasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            topic: params.topic,
            tone: params.tone,
            format: params.format,
            data: params.data,
          },
        };
        return this.contentOrchestrator.execute(task);
      },
    };

    this.registerTools([analyticsTool, researchTool, contentTool]);
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      this.state.status = 'thinking';
      this.state.currentTask = task.id;

      // Build message context
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: this.config.systemPrompt || 'You are a master orchestrator.',
        },
        {
          role: 'user',
          content: task.description,
        },
      ];

      // Add context if available
      if (task.metadata?.context) {
        messages.push({
          role: 'user',
          content: `Additional context: ${JSON.stringify(task.metadata.context)}`,
        });
      }

      // Run the agent loop
      const { result } = await this.runAgentLoop(messages, 20);

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
        error: error instanceof Error ? error.message : 'Unknown error during orchestration',
        executionTime: Date.now() - startTime,
      };
    }
  }

  // Initialize all orchestrators
  async initializeAll(): Promise<void> {
    await this.initialize();
    await this.analyticsOrchestrator.initialize();
    await this.researchOrchestrator.initialize();
    await this.contentOrchestrator.initialize();
  }

  // Get status of all orchestrators
  getSystemStatus(): {
    master: ReturnType<MasterOrchestrator['getStatus']>;
    analytics: ReturnType<AnalyticsOrchestrator['getStatus']>;
    research: ReturnType<ResearchOrchestrator['getStatus']>;
    content: ReturnType<ContentOrchestrator['getStatus']>;
  } {
    return {
      master: this.getStatus(),
      analytics: this.analyticsOrchestrator.getStatus(),
      research: this.researchOrchestrator.getStatus(),
      content: this.contentOrchestrator.getStatus(),
    };
  }

  // Direct access to sub-orchestrators
  getAnalyticsOrchestrator(): AnalyticsOrchestrator {
    return this.analyticsOrchestrator;
  }

  getResearchOrchestrator(): ResearchOrchestrator {
    return this.researchOrchestrator;
  }

  getContentOrchestrator(): ContentOrchestrator {
    return this.contentOrchestrator;
  }
}
