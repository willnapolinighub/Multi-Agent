/**
 * Analytics Agent API Endpoint
 * Direct access to the Analytics Orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsOrchestrator, Task, ToolResult } from '@/lib/agents';
import { analyticsTools } from '@/lib/agents/tools';

// Singleton instance
let analyticsOrchestrator: AnalyticsOrchestrator | null = null;

async function getAnalyticsOrchestrator() {
  if (!analyticsOrchestrator) {
    analyticsOrchestrator = new AnalyticsOrchestrator();
    await analyticsOrchestrator.initialize();
  }
  return analyticsOrchestrator;
}

// POST /api/agents/analytics - Execute analytics task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, data, tool, params } = body as {
      task?: string;
      data?: unknown;
      tool?: string;
      params?: Record<string, unknown>;
    };

    const orchestrator = await getAnalyticsOrchestrator();

    // Direct tool execution
    if (tool && params) {
      const toolDef = analyticsTools.find((t) => t.definition.name === tool);
      if (!toolDef) {
        return NextResponse.json(
          { error: `Unknown tool: ${tool}. Available: ${analyticsTools.map((t) => t.definition.name).join(', ')}` },
          { status: 400 }
        );
      }

      const result: ToolResult = await toolDef.execute(params);
      return NextResponse.json(result);
    }

    // Task-based execution
    if (task) {
      const taskObj: Task = {
        id: crypto.randomUUID(),
        description: task,
        priority: 'medium',
        status: 'pending',
        subTasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { data },
      };

      const result = await orchestrator.execute(taskObj);
      return NextResponse.json({
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
      });
    }

    return NextResponse.json(
      { error: 'Either task or tool with params is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Analytics agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/agents/analytics - Get available tools
export async function GET() {
  return NextResponse.json({
    name: 'Analytics Orchestrator',
    description: 'Data analysis, statistics, trends, and insights',
    tools: analyticsTools.map((t) => ({
      name: t.definition.name,
      description: t.definition.description,
      parameters: t.definition.parameters,
    })),
    examples: [
      {
        task: 'Analyze sales data and find trends',
        data: [
          { month: 'Jan', sales: 1000 },
          { month: 'Feb', sales: 1200 },
        ],
      },
      {
        tool: 'statistical_analysis',
        params: { data: [1, 2, 3, 4, 5] },
      },
    ],
  });
}
