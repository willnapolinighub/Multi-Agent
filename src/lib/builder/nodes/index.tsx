/**
 * Custom Node Components for Visual Builder
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  Webhook,
  Clock,
  Network,
  BarChart3,
  Search,
  FileText,
  Calculator,
  Globe,
  Pen,
  Code,
  GitBranch,
  Repeat,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Copy,
  Settings,
  Zap,
} from 'lucide-react';
import {
  AgentNodeData,
  ToolNodeData,
  InputNodeData,
  OutputNodeData,
  ConditionNodeData,
  LoopNodeData,
  TransformNodeData,
  TriggerNodeData,
} from '../types';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Play,
  Webhook,
  Clock,
  Network,
  BarChart3,
  Search,
  FileText,
  Calculator,
  Globe,
  Pen,
  Code,
  GitBranch,
  Repeat,
  ArrowRight,
  ArrowLeft,
  Settings,
  Zap,
};

// Base node wrapper
const BaseNode = memo(({ 
  children, 
  data, 
  selected, 
  type,
  icon,
  color,
  inputs = [],
  outputs = [],
}: { 
  children?: React.ReactNode;
  data: { label: string; description?: string; status?: string; config?: Record<string, unknown> };
  selected: boolean;
  type: string;
  icon: string;
  color: string;
  inputs?: { id: string; label: string }[];
  outputs?: { id: string; label: string }[];
}) => {
  const IconComponent = iconMap[icon] || Zap;
  
  return (
    <Card 
      className={`min-w-[180px] shadow-lg border-2 transition-all ${
        selected ? `border-${color}-500 ring-2 ring-${color}-500/20` : 'border-border'
      } ${data.status === 'running' ? 'animate-pulse' : ''}`}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b border-border bg-${color}-500/10 rounded-t-lg`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded bg-${color}-500/20`}>
            <IconComponent className={`w-4 h-4 text-${color}-500`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label}</div>
            <div className="text-xs text-muted-foreground capitalize">{type}</div>
          </div>
          {data.status && (
            <Badge 
              variant={data.status === 'success' ? 'default' : data.status === 'error' ? 'destructive' : 'outline'}
              className="text-xs"
            >
              {data.status}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Content */}
      {children && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {children}
        </div>
      )}
      
      {/* Handles */}
      {inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          className={`w-3 h-3 bg-${color}-500 border-2 border-background`}
          style={{ top: `${((index + 1) / (inputs.length + 1)) * 100}%` }}
        />
      ))}
      
      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          className={`w-3 h-3 bg-${color}-500 border-2 border-background`}
          style={{ top: `${((index + 1) / (outputs.length + 1)) * 100}%` }}
        />
      ))}
    </Card>
  );
});

BaseNode.displayName = 'BaseNode';

// Trigger Node
export const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="trigger"
    icon={data.triggerType === 'webhook' ? 'Webhook' : data.triggerType === 'schedule' ? 'Clock' : 'Play'}
    color="green"
    outputs={[{ id: 'output', label: 'Output' }]}
  >
    {data.triggerType === 'webhook' && data.webhookPath && (
      <div className="font-mono text-xs">{data.webhookPath}</div>
    )}
    {data.triggerType === 'schedule' && data.schedule && (
      <div className="font-mono text-xs">{data.schedule}</div>
    )}
  </BaseNode>
));

TriggerNode.displayName = 'TriggerNode';

// Agent Node
export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="agent"
    icon={data.agentType === 'master' ? 'Network' : data.domain === 'analytics' ? 'BarChart3' : data.domain === 'research' ? 'Search' : 'FileText'}
    color="purple"
    inputs={[{ id: 'input', label: 'Input' }]}
    outputs={[{ id: 'output', label: 'Output' }]}
  >
    <div className="space-y-1">
      {data.model && <div>Model: {data.model}</div>}
      {data.tools?.length > 0 && <div>Tools: {data.tools.length}</div>}
    </div>
  </BaseNode>
));

AgentNode.displayName = 'AgentNode';

// Tool Node
export const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="tool"
    icon={data.toolType === 'custom' ? 'Code' : 'Calculator'}
    color="blue"
    inputs={data.parameters?.filter(p => p.required).map(p => ({ id: p.name, label: p.name })) || [{ id: 'input', label: 'Input' }]}
    outputs={[{ id: 'output', label: 'Output' }]}
  >
    <div className="font-mono text-xs">{data.functionName}</div>
  </BaseNode>
));

ToolNode.displayName = 'ToolNode';

// Input Node
export const InputNode = memo(({ data, selected }: NodeProps<InputNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="input"
    icon="ArrowRight"
    color="cyan"
    outputs={[{ id: 'output', label: 'Value' }]}
  >
    <div>Type: {data.inputType}</div>
  </BaseNode>
));

InputNode.displayName = 'InputNode';

// Output Node
export const OutputNode = memo(({ data, selected }: NodeProps<OutputNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="output"
    icon="ArrowLeft"
    color="orange"
    inputs={[{ id: 'input', label: 'Value' }]}
  />
));

OutputNode.displayName = 'OutputNode';

// Condition Node
export const ConditionNode = memo(({ data, selected }: NodeProps<ConditionNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="condition"
    icon="GitBranch"
    color="yellow"
    inputs={[{ id: 'input', label: 'Input' }]}
    outputs={[
      { id: 'then', label: 'Then' },
      { id: 'else', label: 'Else' },
    ]}
  >
    <div>{data.conditions?.length || 0} condition(s)</div>
  </BaseNode>
));

ConditionNode.displayName = 'ConditionNode';

// Loop Node
export const LoopNode = memo(({ data, selected }: NodeProps<LoopNodeData>) => (
  <BaseNode
    data={data}
    selected={selected}
    type="loop"
    icon="Repeat"
    color="pink"
    inputs={[
      { id: 'items', label: 'Items' },
      { id: 'body', label: 'Body' },
    ]}
    outputs={[
      { id: 'item', label: 'Item' },
      { id: 'done', label: 'Done' },
    ]}
  >
    <div>Type: {data.loopType}</div>
  </BaseNode>
));

LoopNode.displayName = 'LoopNode';

// Node types mapping
export const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  tool: ToolNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
  loop: LoopNode,
};
