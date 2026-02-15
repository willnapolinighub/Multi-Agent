/**
 * Research Sub-Orchestrator
 * Handles research tasks including web search, content extraction, and analysis
 */

import { Orchestrator } from '../core/Orchestrator';
import { AgentConfig, Task, TaskResult, LLMMessage } from '../core/types';
import { researchTools } from '../tools';

export class ResearchOrchestrator extends Orchestrator {
  constructor(config?: Partial<AgentConfig>) {
    super({
      id: 'research-orchestrator',
      name: 'Research Orchestrator',
      description: 'Coordinates research tasks including web search, content extraction, and analysis',
      role: 'sub_orchestrator',
      domain: 'research',
      model: 'gpt-4o',
      temperature: 0.5,
      systemPrompt: `You are the Research Orchestrator, a specialized agent responsible for research tasks.

Your capabilities include:
- Web search for information
- Content extraction from URLs
- Summarization of long content
- Fact extraction and verification
- Topic analysis

When conducting research:
1. Understand the research question
2. Search for relevant information
3. Extract and verify facts
4. Summarize findings
5. Cite sources properly

Be thorough but efficient. Always verify information from multiple sources when possible.`,
      ...config,
    });

    // Register research tools
    this.registerTools(researchTools);
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
          content: this.config.systemPrompt || 'You are a research orchestrator.',
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
        error: error instanceof Error ? error.message : 'Unknown error during research execution',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private buildTaskPrompt(task: Task): string {
    let prompt = `Research Task: ${task.description}\n`;

    if (task.metadata?.urls) {
      prompt += `\nURLs to investigate:\n${JSON.stringify(task.metadata.urls, null, 2)}\n`;
    }

    if (task.metadata?.context) {
      prompt += `\nContext: ${JSON.stringify(task.metadata.context)}\n`;
    }

    prompt += `\nConduct research and provide comprehensive findings.`;

    return prompt;
  }
}
