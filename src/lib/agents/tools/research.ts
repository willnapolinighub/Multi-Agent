/**
 * Research Tools
 * Tools for web search, content extraction, and research tasks
 */

import ZAI from 'z-ai-web-dev-sdk';
import { Tool, ToolResult } from '../core/types';

// ============================================
// Web Search Tool
// ============================================

export const webSearchTool: Tool = {
  definition: {
    name: 'web_search',
    description: 'Search the web for information on a given topic',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query',
        required: true,
      },
      numResults: {
        type: 'number',
        description: 'Number of results to return (default: 5)',
        required: false,
        default: 5,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const query = params.query as string;
      const numResults = (params.numResults as number) || 5;

      if (!query) {
        return { success: false, error: 'Search query is required' };
      }

      const zai = await ZAI.create();
      const searchResult = await zai.functions.invoke('web_search', {
        query,
        num: numResults,
      });

      const results = searchResult.map((item: {
        url: string;
        name: string;
        snippet: string;
        host_name: string;
        date?: string;
      }) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        source: item.host_name,
        date: item.date,
      }));

      return {
        success: true,
        data: results,
        metadata: { query, resultCount: results.length },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Web Content Reader Tool
// ============================================

export const webContentReaderTool: Tool = {
  definition: {
    name: 'read_web_content',
    description: 'Extract and read content from a web page URL',
    parameters: {
      url: {
        type: 'string',
        description: 'The URL to read content from',
        required: true,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const url = params.url as string;

      if (!url) {
        return { success: false, error: 'URL is required' };
      }

      const zai = await ZAI.create();
      const result = await (zai.functions.invoke as (name: string, params: Record<string, unknown>) => Promise<{
        title?: string;
        content?: string;
        html?: string;
        publishedTime?: string;
      }>)('web_reader', { url });

      return {
        success: true,
        data: {
          title: result.title || '',
          content: result.content || '',
          html: result.html || '',
          publishedTime: result.publishedTime || '',
        },
        metadata: { url },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Summarization Tool
// ============================================

export const summarizationTool: Tool = {
  definition: {
    name: 'summarize_content',
    description: 'Summarize long text content into key points',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to summarize',
        required: true,
      },
      style: {
        type: 'string',
        description: 'Summary style: brief, detailed, bullet_points',
        required: false,
        default: 'brief',
        enum: ['brief', 'detailed', 'bullet_points'],
      },
      maxLength: {
        type: 'number',
        description: 'Maximum length of summary in words',
        required: false,
        default: 200,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;
      const style = (params.style as string) || 'brief';
      const maxLength = (params.maxLength as number) || 200;

      if (!content) {
        return { success: false, error: 'Content is required' };
      }

      const zai = await ZAI.create();

      const styleInstructions: Record<string, string> = {
        brief: 'Provide a concise summary in 2-3 sentences.',
        detailed: 'Provide a comprehensive summary covering all key points.',
        bullet_points: 'Summarize as a list of bullet points.',
      };

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a summarization assistant. ${styleInstructions[style] || styleInstructions.brief} Keep the summary under ${maxLength} words.`,
          },
          {
            role: 'user',
            content: `Summarize the following content:\n\n${content}`,
          },
        ],
        max_tokens: 500,
      });

      const summary = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          summary,
          style,
          originalLength: content.length,
          summaryLength: summary.length,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Fact Extraction Tool
// ============================================

export const factExtractionTool: Tool = {
  definition: {
    name: 'extract_facts',
    description: 'Extract key facts and information from text content',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to extract facts from',
        required: true,
      },
      factTypes: {
        type: 'array',
        description: 'Types of facts to extract: dates, numbers, names, locations, entities',
        required: false,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;
      const factTypes = (params.factTypes as string[]) || ['dates', 'numbers', 'names', 'locations', 'entities'];

      if (!content) {
        return { success: false, error: 'Content is required' };
      }

      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract facts from the content. Return a JSON object with the following structure:
{
  "dates": ["list of dates mentioned"],
  "numbers": ["list of important numbers with context"],
  "names": ["list of names mentioned"],
  "locations": ["list of locations mentioned"],
  "entities": ["list of organizations, products, or other entities"],
  "keyFacts": ["list of key facts as individual statements"]
}

Only include fields that have extracted data. Be precise and only extract factual information explicitly stated.`,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const facts = JSON.parse(response.choices[0]?.message?.content || '{}');

      // Filter to requested fact types
      const filteredFacts: Record<string, unknown> = {};
      for (const type of factTypes) {
        if (facts[type]) {
          filteredFacts[type] = facts[type];
        }
      }
      filteredFacts.keyFacts = facts.keyFacts;

      return {
        success: true,
        data: filteredFacts,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Topic Analysis Tool
// ============================================

export const topicAnalysisTool: Tool = {
  definition: {
    name: 'analyze_topics',
    description: 'Analyze text to identify main topics and themes',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to analyze',
        required: true,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;

      if (!content) {
        return { success: false, error: 'Content is required' };
      }

      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the content and identify the main topics and themes. Return a JSON object:
{
  "primaryTopic": "the main topic",
  "secondaryTopics": ["list of secondary topics"],
  "themes": ["list of themes"],
  "keywords": ["list of important keywords"],
  "category": "overall category of the content",
  "sentiment": "positive/negative/neutral"
}`,
          },
          {
            role: 'user',
            content: content.substring(0, 4000), // Limit content length
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Export All Research Tools
// ============================================

export const researchTools: Tool[] = [
  webSearchTool,
  webContentReaderTool,
  summarizationTool,
  factExtractionTool,
  topicAnalysisTool,
];
