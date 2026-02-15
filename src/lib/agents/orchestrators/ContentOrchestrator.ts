/**
 * Content Sub-Orchestrator
 * Handles content creation, formatting, and enhancement tasks
 */

import { Orchestrator } from '../core/Orchestrator';
import { AgentConfig, Task, TaskResult, LLMMessage } from '../core/types';
import { contentTools } from '../tools';

export class ContentOrchestrator extends Orchestrator {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: 'content-orchestrator',
      name: 'Content Orchestrator',
      description: 'Coordinates content creation, formatting, and enhancement tasks',
      role: 'sub_orchestrator',
      domain: 'content',
      model: 'gpt-4o',
      temperature: 0.7,
      systemPrompt: `You are the Content Orchestrator, a specialized agent responsible for content tasks.

Your capabilities include:
- Content generation (articles, reports, summaries)
- Content formatting (markdown, HTML)
- Content enhancement (grammar, clarity, style)
- Translation
- Report generation

When creating content:
1. Understand the topic and target audience
2. Choose appropriate tone and style
3. Structure content logically
4. Ensure clarity and engagement
5. Review and refine

Create high-quality, well-structured content that meets the user's requirements.`,
      ...config,
    });

    // Register content tools
    this.registerTools(contentTools);
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
          content: this.config.systemPrompt || 'You are a content orchestrator.',
        },
        {
          role: 'user',
          content: this.buildTaskPrompt(task),
        },
      ];

      // Run the agent loop
      const { result } = await this.runAgentLoop(messages, 10);

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
        error: error instanceof Error ? error.message : 'Unknown error during content execution',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private buildTaskPrompt(task: Task): string {
    let prompt = `Content Task: ${task.description}\n`;

    if (task.metadata?.topic) {
      prompt += `\nTopic: ${task.metadata.topic}\n`;
    }

    if (task.metadata?.tone) {
      prompt += `\nTone: ${task.metadata.tone}\n`;
    }

    if (task.metadata?.format) {
      prompt += `\nFormat: ${task.metadata.format}\n`;
    }

    if (task.metadata?.data) {
      prompt += `\nData to include:\n${JSON.stringify(task.metadata.data, null, 2)}\n`;
    }

    prompt += `\nCreate the requested content.`;

    return prompt;
  }
}
