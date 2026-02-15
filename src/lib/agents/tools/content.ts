/**
 * Content Tools
 * Tools for content generation, writing, and formatting
 */

import ZAI from 'z-ai-web-dev-sdk';
import { Tool, ToolResult } from '../core/types';

// ============================================
// Content Generation Tool
// ============================================

export const contentGenerationTool: Tool = {
  definition: {
    name: 'generate_content',
    description: 'Generate written content such as articles, reports, or documentation',
    parameters: {
      topic: {
        type: 'string',
        description: 'The topic or subject to write about',
        required: true,
      },
      contentType: {
        type: 'string',
        description: 'Type of content: article, report, summary, documentation, email',
        required: false,
        default: 'article',
        enum: ['article', 'report', 'summary', 'documentation', 'email'],
      },
      tone: {
        type: 'string',
        description: 'Writing tone: formal, casual, professional, technical',
        required: false,
        default: 'professional',
        enum: ['formal', 'casual', 'professional', 'technical'],
      },
      length: {
        type: 'string',
        description: 'Target length: short, medium, long',
        required: false,
        default: 'medium',
        enum: ['short', 'medium', 'long'],
      },
      context: {
        type: 'string',
        description: 'Additional context or background information',
        required: false,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const topic = params.topic as string;
      const contentType = (params.contentType as string) || 'article';
      const tone = (params.tone as string) || 'professional';
      const length = (params.length as string) || 'medium';
      const context = params.context as string | undefined;

      if (!topic) {
        return { success: false, error: 'Topic is required' };
      }

      const zai = await ZAI.create();

      const lengthGuides: Record<string, string> = {
        short: '200-300 words',
        medium: '400-600 words',
        long: '800-1200 words',
      };

      const toneGuides: Record<string, string> = {
        formal: 'Use formal language, avoid contractions, maintain professional distance.',
        casual: 'Use conversational language, feel free to use contractions and informal expressions.',
        professional: 'Balance professionalism with readability, clear and concise.',
        technical: 'Use technical terminology where appropriate, include detailed explanations.',
      };

      const contentTypeGuides: Record<string, string> = {
        article: 'Write an engaging article with an introduction, body, and conclusion.',
        report: 'Write a structured report with clear sections and data-driven insights.',
        summary: 'Write a concise summary highlighting key points.',
        documentation: 'Write clear documentation with examples where appropriate.',
        email: 'Write a professional email with appropriate greeting and sign-off.',
      };

      const response = await zai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional content writer. 
${contentTypeGuides[contentType] || contentTypeGuides.article}

Tone: ${toneGuides[tone] || toneGuides.professional}
Target length: ${lengthGuides[length] || lengthGuides.medium}

Write well-structured, engaging content. Use markdown formatting where appropriate.`,
          },
          {
            role: 'user',
            content: `${context ? `Context: ${context}\n\n` : ''}Write ${contentType === 'article' ? 'an' : 'a'} ${contentType} about: ${topic}`,
          },
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          content,
          metadata: {
            topic,
            contentType,
            tone,
            length,
            wordCount: content.split(/\s+/).length,
          },
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Content Formatting Tool
// ============================================

export const contentFormattingTool: Tool = {
  definition: {
    name: 'format_content',
    description: 'Format and structure existing content',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to format',
        required: true,
      },
      format: {
        type: 'string',
        description: 'Output format: markdown, html, plain_text, json',
        required: false,
        default: 'markdown',
        enum: ['markdown', 'html', 'plain_text', 'json'],
      },
      structure: {
        type: 'string',
        description: 'Structure to apply: headings, bullet_points, numbered_list, table',
        required: false,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;
      const format = (params.format as string) || 'markdown';
      const structure = params.structure as string | undefined;

      if (!content) {
        return { success: false, error: 'Content is required' };
      }

      const zai = await ZAI.create();

      const structureInstructions = structure
        ? `Apply ${structure} structure to organize the content.`
        : 'Maintain the existing structure but improve formatting.';

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content formatter. Reformats content into the specified format.
${structureInstructions}

Output format: ${format}
Ensure proper formatting and structure. Do not change the meaning of the content.`,
          },
          {
            role: 'user',
            content: `Format this content:\n\n${content}`,
          },
        ],
        max_tokens: 2000,
      });

      const formattedContent = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          content: formattedContent,
          format,
          originalLength: content.length,
          formattedLength: formattedContent.length,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Translation Tool
// ============================================

export const translationTool: Tool = {
  definition: {
    name: 'translate_content',
    description: 'Translate content to a different language',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to translate',
        required: true,
      },
      targetLanguage: {
        type: 'string',
        description: 'Target language code (e.g., en, zh, es, fr, de, ja)',
        required: true,
      },
      sourceLanguage: {
        type: 'string',
        description: 'Source language code (auto-detect if not specified)',
        required: false,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;
      const targetLanguage = params.targetLanguage as string;
      const sourceLanguage = params.sourceLanguage as string | undefined;

      if (!content || !targetLanguage) {
        return { success: false, error: 'Content and target language are required' };
      }

      const zai = await ZAI.create();

      const languageNames: Record<string, string> = {
        en: 'English',
        zh: 'Chinese',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        ja: 'Japanese',
        ko: 'Korean',
        pt: 'Portuguese',
        ru: 'Russian',
        ar: 'Arabic',
      };

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the content to ${languageNames[targetLanguage] || targetLanguage}.
Maintain the original tone, style, and formatting. Preserve any technical terms or proper nouns appropriately.`,
          },
          {
            role: 'user',
            content: sourceLanguage
              ? `Translate from ${languageNames[sourceLanguage] || sourceLanguage}:\n\n${content}`
              : content,
          },
        ],
        max_tokens: 2000,
      });

      const translatedContent = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          translation: translatedContent,
          targetLanguage,
          sourceLanguage: sourceLanguage || 'auto-detected',
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Content Enhancement Tool
// ============================================

export const contentEnhancementTool: Tool = {
  definition: {
    name: 'enhance_content',
    description: 'Enhance content by improving clarity, grammar, and style',
    parameters: {
      content: {
        type: 'string',
        description: 'The content to enhance',
        required: true,
      },
      enhancements: {
        type: 'array',
        description: 'Types of enhancements: grammar, clarity, style, conciseness, expand',
        required: false,
        default: ['grammar', 'clarity'],
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const content = params.content as string;
      const enhancements = (params.enhancements as string[]) || ['grammar', 'clarity'];

      if (!content) {
        return { success: false, error: 'Content is required' };
      }

      const zai = await ZAI.create();

      const enhancementInstructions = enhancements.map((e) => {
        switch (e) {
          case 'grammar':
            return 'Fix any grammatical errors.';
          case 'clarity':
            return 'Improve clarity and readability.';
          case 'style':
            return 'Improve writing style and flow.';
          case 'conciseness':
            return 'Make the content more concise.';
          case 'expand':
            return 'Expand on key points with more detail.';
          default:
            return '';
        }
      }).join(' ');

      const response = await zai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an editor. Enhance the content with the following improvements:
${enhancementInstructions}

Maintain the original meaning and intent. Return only the enhanced content.`,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        max_tokens: 2000,
      });

      const enhancedContent = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          content: enhancedContent,
          enhancementsApplied: enhancements,
          originalLength: content.length,
          enhancedLength: enhancedContent.length,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Report Generation Tool
// ============================================

export const reportGenerationTool: Tool = {
  definition: {
    name: 'generate_report',
    description: 'Generate a structured report from data and insights',
    parameters: {
      title: {
        type: 'string',
        description: 'Report title',
        required: true,
      },
      data: {
        type: 'object',
        description: 'Data to include in the report',
        required: true,
      },
      sections: {
        type: 'array',
        description: 'Report sections to include',
        required: false,
        default: ['summary', 'findings', 'recommendations'],
      },
      format: {
        type: 'string',
        description: 'Report format: markdown, html',
        required: false,
        default: 'markdown',
        enum: ['markdown', 'html'],
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const title = params.title as string;
      const data = params.data as Record<string, unknown>;
      const sections = (params.sections as string[]) || ['summary', 'findings', 'recommendations'];
      const format = (params.format as string) || 'markdown';

      if (!title || !data) {
        return { success: false, error: 'Title and data are required' };
      }

      const zai = await ZAI.create();

      const response = await zai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a report writer. Generate a professional, structured report.
Include the following sections: ${sections.join(', ')}

Use ${format} formatting. Make the report clear, data-driven, and actionable.`,
          },
          {
            role: 'user',
            content: `Generate a report titled "${title}" based on this data:\n\n${JSON.stringify(data, null, 2)}`,
          },
        ],
        max_tokens: 3000,
      });

      const report = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: {
          report,
          title,
          sections,
          format,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Export All Content Tools
// ============================================

export const contentTools: Tool[] = [
  contentGenerationTool,
  contentFormattingTool,
  translationTool,
  contentEnhancementTool,
  reportGenerationTool,
];
