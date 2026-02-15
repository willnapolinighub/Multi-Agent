/**
 * Content Agent API Endpoint
 * Direct access to the Content Orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentOrchestrator, Task, ToolResult } from '@/lib/agents';
import { contentTools } from '@/lib/agents/tools';

// Singleton instance
let contentOrchestrator: ContentOrchestrator | null = null;

async function getContentOrchestrator() {
  if (!contentOrchestrator) {
    contentOrchestrator = new ContentOrchestrator();
    await contentOrchestrator.initialize();
  }
  return contentOrchestrator;
}

// POST /api/agents/content - Execute content task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, topic, tone, format, data, tool, params } = body as {
      task?: string;
      topic?: string;
      tone?: string;
      format?: string;
      data?: unknown;
      tool?: string;
      params?: Record<string, unknown>;
    };

    const orchestrator = await getContentOrchestrator();

    // Direct tool execution
    if (tool && params) {
      const toolDef = contentTools.find((t) => t.definition.name === tool);
      if (!toolDef) {
        return NextResponse.json(
          { error: `Unknown tool: ${tool}. Available: ${contentTools.map((t) => t.definition.name).join(', ')}` },
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
        metadata: { topic, tone, format, data },
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
    console.error('Content agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/agents/content - Get available tools
export async function GET() {
  return NextResponse.json({
    name: 'Content Orchestrator',
    description: 'Content creation, formatting, and enhancement',
    tools: contentTools.map((t) => ({
      name: t.definition.name,
      description: t.definition.description,
      parameters: t.definition.parameters,
    })),
    examples: [
      {
        task: 'Write a report on the analysis results',
        data: { findings: '...', recommendations: '...' },
      },
      {
        tool: 'generate_content',
        params: {
          topic: 'Multi-agent systems',
          contentType: 'article',
          tone: 'professional',
        },
      },
      {
        tool: 'enhance_content',
        params: {
          content: 'Some text to improve...',
          enhancements: ['grammar', 'clarity'],
        },
      },
    ],
  });
}
