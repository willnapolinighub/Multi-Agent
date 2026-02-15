/**
 * Multi-Agent System
 * Main entry point for the hierarchical agent architecture
 */

// Core
export * from './core/types';
export * from './core/Agent';
export * from './core/Orchestrator';

// Orchestrators
export * from './orchestrators';

// Tools
export * from './tools';

// Re-export commonly used items
import { MasterOrchestrator } from './orchestrators/MasterOrchestrator';
import { AnalyticsOrchestrator } from './orchestrators/AnalyticsOrchestrator';
import { ResearchOrchestrator } from './orchestrators/ResearchOrchestrator';
import { ContentOrchestrator } from './orchestrators/ContentOrchestrator';
import { Task, TaskResult } from './core/types';

/**
 * Create and initialize a complete multi-agent system
 */
export async function createAgentSystem(): Promise<{
  masterOrchestrator: MasterOrchestrator;
  execute: (description: string, context?: Record<string, unknown>) => Promise<TaskResult>;
  getStatus: () => ReturnType<MasterOrchestrator['getSystemStatus']>;
}> {
  const masterOrchestrator = new MasterOrchestrator();
  await masterOrchestrator.initializeAll();

  const execute = async (
    description: string,
    context?: Record<string, unknown>
  ): Promise<TaskResult> => {
    const task: Task = {
      id: crypto.randomUUID(),
      description,
      priority: 'medium',
      status: 'pending',
      subTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { context },
    };

    return masterOrchestrator.execute(task);
  };

  return {
    masterOrchestrator,
    execute,
    getStatus: () => masterOrchestrator.getSystemStatus(),
  };
}

/**
 * Quick task execution helper
 */
export async function executeTask(
  description: string,
  context?: Record<string, unknown>
): Promise<TaskResult> {
  const system = await createAgentSystem();
  return system.execute(description, context);
}

// Export agent classes for custom configurations
export const Agents = {
  MasterOrchestrator,
  AnalyticsOrchestrator,
  ResearchOrchestrator,
  ContentOrchestrator,
};
