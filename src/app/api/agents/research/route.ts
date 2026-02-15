/**
 * Research Agent API Endpoint
 * Direct access to the Research Orchestrator
 */

import { NextRequest, NextResponse } from 'next/server';
import { ResearchOrchestrator, Task, ToolResult } from '@/lib/agents';
import { researchTools } from '@/lib/agents/tools';

// Singleton instance
let researchOrchestrator: ResearchOrchestrator | null = null;

async function getResearchOrchestrator() {
  if (!researchOrchestrator) {
    researchOrchestrator = new ResearchOrchestrator();
    await researchOrchestrator.initialize();
  }
  return researchOrchestrator;
}

// POST /api/agents/research - Execute research task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, urls, tool, params } = body as {
      task?: string;
      urls?: string[];
      tool?: string;
      params?: Record<string, unknown>;
    };

    const orchestrator = await getResearchOrchestrator();

    // Direct tool execution
    if (tool && params) {
      const toolDef = researchTools.find((t) => t.definition.name === tool);
      if (!toolDef) {
        return NextResponse.json(
          { error: `Unknown tool: ${tool}. Available: ${researchTools.map((t) => t.definition.name).join(', ')}` },
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
        metadata: { urls },
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
    console.error('Research agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/agents/research - Get available tools
export async function GET() {
  return NextResponse.json({
    name: 'Research Orchestrator',
    description: 'Web search, content extraction, and fact-checking',
    tools: researchTools.map((t) => ({
      name: t.definition.name,
      description: t.definition.description,
      parameters: t.definition.parameters,
    })),
    examples: [
      {
        task: 'Research the latest developments in AI agents',
      },
      {
        tool: 'web_search',
        params: { query: 'multi-agent systems 2024', numResults: 5 },
      },
      {
        tool: 'read_web_content',
        params: { url: 'https://example.com/article' },
      },
    ],
  });
}
