/**
 * Analytics Sub-Orchestrator
 * Handles data analysis tasks with specialized analytical tools
 */

import { Orchestrator } from '../core/Orchestrator';
import { AgentConfig, Task, TaskResult, LLMMessage } from '../core/types';
import { analyticsTools } from '../tools';

export class AnalyticsOrchestrator extends Orchestrator {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: 'analytics-orchestrator',
      name: 'Analytics Orchestrator',
      description: 'Coordinates data analysis tasks including statistics, trends, and insights',
      role: 'sub_orchestrator',
      domain: 'analytics',
      model: 'gpt-4o',
      temperature: 0.3,
      systemPrompt: `You are the Analytics Orchestrator, a specialized agent responsible for data analysis tasks.

Your capabilities include:
- Statistical analysis (mean, median, variance, etc.)
- Trend analysis and forecasting
- Data comparison and correlation
- Data aggregation and filtering
- Insight generation

When analyzing data:
1. First understand the data structure and context
2. Choose appropriate analytical methods
3. Apply tools systematically
4. Interpret results clearly
5. Provide actionable insights

Always validate data quality before analysis and explain your methodology.`,
      ...config,
    });

    // Register analytics tools
    this.registerTools(analyticsTools);
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
          content: this.config.systemPrompt || 'You are an analytics orchestrator.',
        },
        {
          role: 'user',
          content: this.buildTaskPrompt(task),
        },
      ];

      // Run the agent loop
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
        error: error instanceof Error ? error.message : 'Unknown error during analytics execution',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private buildTaskPrompt(task: Task): string {
    let prompt = `Task: ${task.description}\n`;

    if (task.metadata?.data) {
      prompt += `\nData provided:\n${JSON.stringify(task.metadata.data, null, 2)}\n`;
    }

    if (task.metadata?.context) {
      prompt += `\nContext: ${JSON.stringify(task.metadata.context)}\n`;
    }

    prompt += `\nAnalyze the data and provide insights using the available tools.`;

    return prompt;
  }
}
