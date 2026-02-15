/**
 * Agent System API Routes
 * REST API for interacting with the multi-agent system
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createAgentSystem,
  Task,
  TaskResult,
  AnalyticsOrchestrator,
  ResearchOrchestrator,
  ContentOrchestrator,
} from '@/lib/agents';

// Singleton agent system instance
let agentSystem: Awaited<ReturnType<typeof createAgentSystem>> | null = null;

async function getAgentSystem() {
  if (!agentSystem) {
    agentSystem = await createAgentSystem();
  }
  return agentSystem;
}

// POST /api/agents - Execute a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, context, directTo } = body as {
      task: string;
      context?: Record<string, unknown>;
      directTo?: 'analytics' | 'research' | 'content';
    };

    if (!task) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    const system = await getAgentSystem();

    let result: TaskResult;

    if (directTo) {
      // Direct to specific sub-orchestrator
      const taskObj: Task = {
        id: crypto.randomUUID(),
        description: task,
        priority: 'medium',
        status: 'pending',
        subTasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { context },
      };

      switch (directTo) {
        case 'analytics':
          const analytics = new AnalyticsOrchestrator();
          await analytics.initialize();
          result = await analytics.execute(taskObj);
          break;
        case 'research':
          const research = new ResearchOrchestrator();
          await research.initialize();
          result = await research.execute(taskObj);
          break;
        case 'content':
          const content = new ContentOrchestrator();
          await content.initialize();
          result = await content.execute(taskObj);
          break;
        default:
          result = await system.execute(task, context);
      }
    } else {
      // Use master orchestrator
      result = await system.execute(task, context);
    }

    return NextResponse.json({
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
    });
  } catch (error) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/agents - Get system status
export async function GET() {
  try {
    const system = await getAgentSystem();
    const status = system.getStatus();

    return NextResponse.json({
      status: 'operational',
      orchestrators: {
        master: status.master.status,
        analytics: status.analytics.status,
        research: status.research.status,
        content: status.content.status,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
