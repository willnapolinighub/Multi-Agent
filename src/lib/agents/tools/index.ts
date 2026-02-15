/**
 * Tools Index
 * Export all tools for the multi-agent system
 */

export * from './analytics';
export * from './research';
export * from './content';

import { Tool } from '../core/types';
import { analyticsTools } from './analytics';
import { researchTools } from './research';
import { contentTools } from './content';

export const allTools: Tool[] = [
  ...analyticsTools,
  ...researchTools,
  ...contentTools,
];

export const toolsByDomain = {
  analytics: analyticsTools,
  research: researchTools,
  content: contentTools,
};
