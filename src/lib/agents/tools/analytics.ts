/**
 * Analytical Tools
 * Tools for data analysis, statistics, and insights generation
 */

import { Tool, ToolResult } from '../core/types';

// ============================================
// Statistical Analysis Tool
// ============================================

export const statisticalAnalysisTool: Tool = {
  definition: {
    name: 'statistical_analysis',
    description: 'Perform statistical analysis on numerical data including mean, median, mode, standard deviation, and variance',
    parameters: {
      data: {
        type: 'array',
        description: 'Array of numerical values to analyze',
        required: true,
      },
      operations: {
        type: 'array',
        description: 'Statistical operations to perform: mean, median, mode, std, variance, min, max, sum, count',
        required: false,
        default: ['mean', 'median', 'std', 'min', 'max', 'sum', 'count'],
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const data = params.data as number[];
      const operations = (params.operations as string[]) || ['mean', 'median', 'std', 'min', 'max', 'sum', 'count'];
      
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: 'Data must be a non-empty array of numbers' };
      }

      const numericData = data.filter((n) => typeof n === 'number' && !isNaN(n));
      
      if (numericData.length === 0) {
        return { success: false, error: 'No valid numeric values in data' };
      }

      const sorted = [...numericData].sort((a, b) => a - b);
      const n = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / n;

      const results: Record<string, number | number[]> = {};

      if (operations.includes('count')) results.count = n;
      if (operations.includes('sum')) results.sum = sum;
      if (operations.includes('mean')) results.mean = mean;
      if (operations.includes('min')) results.min = sorted[0];
      if (operations.includes('max')) results.max = sorted[n - 1];
      
      if (operations.includes('median')) {
        results.median = n % 2 === 0 
          ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
          : sorted[Math.floor(n / 2)];
      }

      if (operations.includes('mode')) {
        const freq: Record<number, number> = {};
        sorted.forEach((n) => { freq[n] = (freq[n] || 0) + 1; });
        const maxFreq = Math.max(...Object.values(freq));
        results.mode = Object.entries(freq)
          .filter(([, f]) => f === maxFreq)
          .map(([n]) => parseFloat(n));
      }

      if (operations.includes('variance') || operations.includes('std')) {
        const variance = sorted.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / n;
        results.variance = variance;
        results.std = Math.sqrt(variance);
      }

      if (operations.includes('quartiles')) {
        results.q1 = sorted[Math.floor(n * 0.25)];
        results.q3 = sorted[Math.floor(n * 0.75)];
        results.iqr = (results.q3 as number) - (results.q1 as number);
      }

      return {
        success: true,
        data: results,
        metadata: { dataSize: n, operationsPerformed: operations },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Trend Analysis Tool
// ============================================

export const trendAnalysisTool: Tool = {
  definition: {
    name: 'trend_analysis',
    description: 'Analyze trends in time series data, calculate growth rates, and detect patterns',
    parameters: {
      data: {
        type: 'array',
        description: 'Array of objects with date and value fields',
        required: true,
      },
      dateField: {
        type: 'string',
        description: 'Name of the date field',
        required: false,
        default: 'date',
      },
      valueField: {
        type: 'string',
        description: 'Name of the value field',
        required: false,
        default: 'value',
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const data = params.data as Array<Record<string, unknown>>;
      const dateField = (params.dateField as string) || 'date';
      const valueField = (params.valueField as string) || 'value';

      if (!Array.isArray(data) || data.length < 2) {
        return { success: false, error: 'Data must have at least 2 data points' };
      }

      // Sort by date
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a[dateField] as string).getTime();
        const dateB = new Date(b[dateField] as string).getTime();
        return dateA - dateB;
      });

      const values = sorted.map((d) => Number(d[valueField]));
      const n = values.length;

      // Calculate basic trend metrics
      const firstValue = values[0];
      const lastValue = values[n - 1];
      const totalChange = lastValue - firstValue;
      const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

      // Calculate average growth rate
      const growthRates: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] !== 0) {
          growthRates.push(((values[i] - values[i - 1]) / Math.abs(values[i - 1])) * 100);
        }
      }
      const avgGrowthRate = growthRates.length > 0
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0;

      // Simple linear regression for trend direction
      const xMean = (n - 1) / 2;
      const yMean = values.reduce((a, b) => a + b, 0) / n;
      
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += Math.pow(i - xMean, 2);
      }
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = yMean - slope * xMean;

      // Detect trend direction
      let trendDirection: 'upward' | 'downward' | 'stable';
      if (Math.abs(slope) < 0.01 * yMean) {
        trendDirection = 'stable';
      } else {
        trendDirection = slope > 0 ? 'upward' : 'downward';
      }

      // Detect volatility
      const mean = yMean;
      const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

      // Detect seasonality (simple check)
      const recentTrend = values.slice(-Math.min(7, n));
      const previousTrend = values.slice(0, Math.min(7, n));
      const recentMean = recentTrend.reduce((a, b) => a + b, 0) / recentTrend.length;
      const previousMean = previousTrend.reduce((a, b) => a + b, 0) / previousTrend.length;

      return {
        success: true,
        data: {
          trendDirection,
          slope,
          intercept,
          totalChange,
          percentChange: parseFloat(percentChange.toFixed(2)),
          avgGrowthRate: parseFloat(avgGrowthRate.toFixed(2)),
          volatility: {
            standardDeviation: parseFloat(stdDev.toFixed(4)),
            coefficientOfVariation: parseFloat(coefficientOfVariation.toFixed(2)),
          },
          comparison: {
            recentPeriodAvg: recentMean,
            previousPeriodAvg: previousMean,
            periodChange: recentMean - previousMean,
          },
          dataPoints: n,
          startDate: sorted[0][dateField],
          endDate: sorted[n - 1][dateField],
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Data Comparison Tool
// ============================================

export const dataComparisonTool: Tool = {
  definition: {
    name: 'data_comparison',
    description: 'Compare two datasets and identify differences, correlations, and patterns',
    parameters: {
      dataset1: {
        type: 'array',
        description: 'First dataset',
        required: true,
      },
      dataset2: {
        type: 'array',
        description: 'Second dataset',
        required: true,
      },
      comparisonType: {
        type: 'string',
        description: 'Type of comparison: statistical, correlation, difference',
        required: false,
        default: 'statistical',
        enum: ['statistical', 'correlation', 'difference'],
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const dataset1 = params.dataset1 as number[];
      const dataset2 = params.dataset2 as number[];
      const comparisonType = (params.comparisonType as string) || 'statistical';

      if (!Array.isArray(dataset1) || !Array.isArray(dataset2)) {
        return { success: false, error: 'Both datasets must be arrays' };
      }

      const n1 = dataset1.length;
      const n2 = dataset2.length;
      const minLen = Math.min(n1, n2);

      const mean1 = dataset1.reduce((a, b) => a + b, 0) / n1;
      const mean2 = dataset2.reduce((a, b) => a + b, 0) / n2;

      const results: Record<string, unknown> = {
        dataset1Size: n1,
        dataset2Size: n2,
        dataset1Mean: mean1,
        dataset2Mean: mean2,
        meanDifference: mean1 - mean2,
      };

      if (comparisonType === 'correlation' && n1 === n2) {
        // Pearson correlation coefficient
        const stdDev1 = Math.sqrt(dataset1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / n1);
        const stdDev2 = Math.sqrt(dataset2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / n2);
        
        let covariance = 0;
        for (let i = 0; i < n1; i++) {
          covariance += (dataset1[i] - mean1) * (dataset2[i] - mean2);
        }
        covariance /= n1;

        const correlation = stdDev1 !== 0 && stdDev2 !== 0 
          ? covariance / (stdDev1 * stdDev2) 
          : 0;

        results.correlation = parseFloat(correlation.toFixed(4));
        results.correlationStrength = 
          Math.abs(correlation) > 0.7 ? 'strong' :
          Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
        results.correlationDirection = correlation > 0 ? 'positive' : 'negative';
      }

      if (comparisonType === 'difference') {
        const differences: number[] = [];
        for (let i = 0; i < minLen; i++) {
          differences.push(dataset1[i] - dataset2[i]);
        }
        
        results.pointByPointDifferences = differences;
        results.avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
        results.maxDifference = Math.max(...differences);
        results.minDifference = Math.min(...differences);
      }

      if (comparisonType === 'statistical') {
        const stdDev1 = Math.sqrt(dataset1.reduce((acc, v) => acc + Math.pow(v - mean1, 2), 0) / n1);
        const stdDev2 = Math.sqrt(dataset2.reduce((acc, v) => acc + Math.pow(v - mean2, 2), 0) / n2);
        
        results.dataset1StdDev = parseFloat(stdDev1.toFixed(4));
        results.dataset2StdDev = parseFloat(stdDev2.toFixed(4));
        
        // Effect size (Cohen's d)
        const pooledStdDev = Math.sqrt(((n1 - 1) * Math.pow(stdDev1, 2) + (n2 - 1) * Math.pow(stdDev2, 2)) / (n1 + n2 - 2));
        results.effectSize = pooledStdDev !== 0 
          ? parseFloat(((mean1 - mean2) / pooledStdDev).toFixed(4))
          : 0;
        results.effectInterpretation = 
          Math.abs(results.effectSize as number) > 0.8 ? 'large' :
          Math.abs(results.effectSize as number) > 0.5 ? 'medium' : 'small';
      }

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Data Aggregation Tool
// ============================================

export const dataAggregationTool: Tool = {
  definition: {
    name: 'data_aggregation',
    description: 'Aggregate data by grouping and calculating summary statistics',
    parameters: {
      data: {
        type: 'array',
        description: 'Array of objects to aggregate',
        required: true,
      },
      groupBy: {
        type: 'string',
        description: 'Field to group by',
        required: true,
      },
      aggregations: {
        type: 'object',
        description: 'Fields and aggregation types to compute',
        required: true,
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const data = params.data as Array<Record<string, unknown>>;
      const groupBy = params.groupBy as string;
      const aggregations = params.aggregations as Record<string, string[]>;

      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: 'Data must be a non-empty array' };
      }

      // Group data
      const groups: Record<string, Array<Record<string, unknown>>> = {};
      
      for (const item of data) {
        const key = String(item[groupBy] ?? 'undefined');
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      }

      // Calculate aggregations for each group
      const results: Array<Record<string, unknown>> = [];

      for (const [groupKey, items] of Object.entries(groups)) {
        const result: Record<string, unknown> = {
          [groupBy]: groupKey,
          count: items.length,
        };

        for (const [field, ops] of Object.entries(aggregations)) {
          const values = items
            .map((i) => i[field])
            .filter((v) => typeof v === 'number' && !isNaN(v)) as number[];

          if (values.length === 0) continue;

          for (const op of ops as string[]) {
            const key = `${field}_${op}`;
            
            switch (op) {
              case 'sum':
                result[key] = values.reduce((a, b) => a + b, 0);
                break;
              case 'avg':
              case 'mean':
                result[key] = values.reduce((a, b) => a + b, 0) / values.length;
                break;
              case 'min':
                result[key] = Math.min(...values);
                break;
              case 'max':
                result[key] = Math.max(...values);
                break;
              case 'count':
                result[key] = values.length;
                break;
            }
          }
        }

        results.push(result);
      }

      return {
        success: true,
        data: results,
        metadata: {
          totalRecords: data.length,
          groupCount: results.length,
          groupByField: groupBy,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Data Filtering Tool
// ============================================

export const dataFilteringTool: Tool = {
  definition: {
    name: 'data_filtering',
    description: 'Filter data based on conditions and criteria',
    parameters: {
      data: {
        type: 'array',
        description: 'Array of objects to filter',
        required: true,
      },
      conditions: {
        type: 'array',
        description: 'Array of filter conditions',
        required: true,
      },
      operator: {
        type: 'string',
        description: 'How to combine conditions: AND or OR',
        required: false,
        default: 'AND',
        enum: ['AND', 'OR'],
      },
    },
  },
  execute: async (params): Promise<ToolResult> => {
    try {
      const data = params.data as Array<Record<string, unknown>>;
      const conditions = params.conditions as Array<{
        field: string;
        operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
        value: unknown;
      }>;
      const operator = (params.operator as 'AND' | 'OR') || 'AND';

      if (!Array.isArray(data)) {
        return { success: false, error: 'Data must be an array' };
      }

      const evaluateCondition = (
        item: Record<string, unknown>,
        condition: typeof conditions[0]
      ): boolean => {
        const fieldValue = item[condition.field];
        const { operator: op, value } = condition;

        switch (op) {
          case 'eq':
            return fieldValue === value;
          case 'neq':
            return fieldValue !== value;
          case 'gt':
            return Number(fieldValue) > Number(value);
          case 'gte':
            return Number(fieldValue) >= Number(value);
          case 'lt':
            return Number(fieldValue) < Number(value);
          case 'lte':
            return Number(fieldValue) <= Number(value);
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          case 'startsWith':
            return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
          default:
            return false;
        }
      };

      const filtered = data.filter((item) => {
        const results = conditions.map((c) => evaluateCondition(item, c));
        return operator === 'AND'
          ? results.every(Boolean)
          : results.some(Boolean);
      });

      return {
        success: true,
        data: filtered,
        metadata: {
          originalCount: data.length,
          filteredCount: filtered.length,
          removedCount: data.length - filtered.length,
          conditionsApplied: conditions.length,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

// ============================================
// Export All Analytics Tools
// ============================================

export const analyticsTools: Tool[] = [
  statisticalAnalysisTool,
  trendAnalysisTool,
  dataComparisonTool,
  dataAggregationTool,
  dataFilteringTool,
];
