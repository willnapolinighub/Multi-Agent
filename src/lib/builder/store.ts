/**
 * Visual Builder Store
 * Zustand store for managing the visual builder state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { 
  BuilderNodeData, 
  WorkflowDefinition, 
  BuilderNodeType,
  NodeTemplate,
} from './types';
import { v4 as uuidv4 } from 'uuid';

interface BuilderState {
  // Canvas state
  nodes: Node<BuilderNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  // Workflow state
  currentWorkflow: WorkflowDefinition | null;
  workflows: WorkflowDefinition[];
  
  // UI state
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  codePreviewOpen: boolean;
  
  // Actions - Nodes
  addNode: (type: BuilderNodeType, position: { x: number; y: number }, template?: Partial<BuilderNodeData>) => void;
  updateNodeData: (nodeId: string, data: Partial<BuilderNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  
  // Actions - Edges
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Actions - Selection
  selectNode: (nodeId: string | null) => void;
  
  // Actions - Workflow
  newWorkflow: () => void;
  saveWorkflow: (name: string, description?: string) => void;
  loadWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
  
  // Actions - UI
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  toggleCodePreview: () => void;
  
  // Helpers
  getNodeById: (nodeId: string) => Node<BuilderNodeData> | undefined;
  getConnectedNodes: (nodeId: string) => Node<BuilderNodeData>[];
}

// Node templates for the palette
export const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Manual Trigger',
    description: 'Manually trigger the workflow',
    icon: 'Play',
    category: 'trigger',
    defaultData: {
      label: 'Manual Trigger',
      triggerType: 'manual',
      config: {},
    },
    inputs: [],
    outputs: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  {
    type: 'trigger',
    label: 'Webhook Trigger',
    description: 'Trigger via webhook URL',
    icon: 'Webhook',
    category: 'trigger',
    defaultData: {
      label: 'Webhook',
      triggerType: 'webhook',
      webhookPath: '/webhook/trigger',
      config: {},
    },
    inputs: [],
    outputs: [{ id: 'output', label: 'Payload', type: 'object' }],
  },
  {
    type: 'trigger',
    label: 'Schedule Trigger',
    description: 'Trigger on a schedule',
    icon: 'Clock',
    category: 'trigger',
    defaultData: {
      label: 'Schedule',
      triggerType: 'schedule',
      schedule: '0 * * * *',
      config: {},
    },
    inputs: [],
    outputs: [{ id: 'output', label: 'Trigger', type: 'any' }],
  },
  
  // Agents
  {
    type: 'agent',
    label: 'Master Orchestrator',
    description: 'Top-level coordinator agent',
    icon: 'Network',
    category: 'agent',
    defaultData: {
      label: 'Master Orchestrator',
      agentType: 'master',
      domain: 'general',
      systemPrompt: 'You are a master orchestrator that coordinates tasks between specialized agents.',
      temperature: 0.3,
      tools: [],
      config: {},
    },
    inputs: [{ id: 'input', label: 'Task', type: 'string' }],
    outputs: [{ id: 'output', label: 'Result', type: 'any' }],
  },
  {
    type: 'agent',
    label: 'Analytics Agent',
    description: 'Data analysis and statistics',
    icon: 'BarChart3',
    category: 'agent',
    defaultData: {
      label: 'Analytics Agent',
      agentType: 'sub_orchestrator',
      domain: 'analytics',
      systemPrompt: 'You are an analytics agent that performs data analysis and statistical operations.',
      temperature: 0.2,
      tools: [],
      config: {},
    },
    inputs: [{ id: 'input', label: 'Data', type: 'any' }],
    outputs: [{ id: 'output', label: 'Analysis', type: 'object' }],
  },
  {
    type: 'agent',
    label: 'Research Agent',
    description: 'Web search and content extraction',
    icon: 'Search',
    category: 'agent',
    defaultData: {
      label: 'Research Agent',
      agentType: 'sub_orchestrator',
      domain: 'research',
      systemPrompt: 'You are a research agent that searches the web and extracts information.',
      temperature: 0.5,
      tools: [],
      config: {},
    },
    inputs: [{ id: 'input', label: 'Query', type: 'string' }],
    outputs: [{ id: 'output', label: 'Findings', type: 'object' }],
  },
  {
    type: 'agent',
    label: 'Content Agent',
    description: 'Content generation and formatting',
    icon: 'FileText',
    category: 'agent',
    defaultData: {
      label: 'Content Agent',
      agentType: 'sub_orchestrator',
      domain: 'content',
      systemPrompt: 'You are a content agent that creates, formats, and enhances text content.',
      temperature: 0.7,
      tools: [],
      config: {},
    },
    inputs: [{ id: 'input', label: 'Request', type: 'string' }],
    outputs: [{ id: 'output', label: 'Content', type: 'string' }],
  },
  
  // Tools
  {
    type: 'tool',
    label: 'Statistical Analysis',
    description: 'Perform statistical analysis on data',
    icon: 'Calculator',
    category: 'tool',
    defaultData: {
      label: 'Statistical Analysis',
      toolType: 'analytics',
      functionName: 'statistical_analysis',
      parameters: [
        { name: 'data', type: 'array', description: 'Data to analyze', required: true },
        { name: 'operations', type: 'array', description: 'Operations to perform', required: false },
      ],
      config: {},
    },
    inputs: [{ id: 'data', label: 'Data', type: 'array' }],
    outputs: [{ id: 'output', label: 'Results', type: 'object' }],
  },
  {
    type: 'tool',
    label: 'Web Search',
    description: 'Search the web for information',
    icon: 'Globe',
    category: 'tool',
    defaultData: {
      label: 'Web Search',
      toolType: 'research',
      functionName: 'web_search',
      parameters: [
        { name: 'query', type: 'string', description: 'Search query', required: true },
        { name: 'numResults', type: 'number', description: 'Number of results', required: false },
      ],
      config: {},
    },
    inputs: [{ id: 'query', label: 'Query', type: 'string' }],
    outputs: [{ id: 'output', label: 'Results', type: 'array' }],
  },
  {
    type: 'tool',
    label: 'Generate Content',
    description: 'Generate written content',
    icon: 'Pen',
    category: 'tool',
    defaultData: {
      label: 'Generate Content',
      toolType: 'content',
      functionName: 'generate_content',
      parameters: [
        { name: 'topic', type: 'string', description: 'Topic to write about', required: true },
        { name: 'contentType', type: 'string', description: 'Type of content', required: false },
        { name: 'tone', type: 'string', description: 'Writing tone', required: false },
      ],
      config: {},
    },
    inputs: [{ id: 'topic', label: 'Topic', type: 'string' }],
    outputs: [{ id: 'output', label: 'Content', type: 'string' }],
  },
  {
    type: 'tool',
    label: 'Custom Tool',
    description: 'Create a custom tool with code',
    icon: 'Code',
    category: 'tool',
    defaultData: {
      label: 'Custom Tool',
      toolType: 'custom',
      functionName: 'custom_function',
      parameters: [],
      code: `// Custom tool implementation
export default async function execute(params) {
  const { input } = params;
  
  // Your code here
  const result = input;
  
  return {
    success: true,
    data: result
  };
}`,
      config: {},
    },
    inputs: [{ id: 'input', label: 'Input', type: 'any' }],
    outputs: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  
  // Logic
  {
    type: 'condition',
    label: 'IF Condition',
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    category: 'logic',
    defaultData: {
      label: 'IF Condition',
      conditions: [],
      defaultHandle: 'else',
      config: {},
    },
    inputs: [{ id: 'input', label: 'Input', type: 'any' }],
    outputs: [
      { id: 'then', label: 'Then', type: 'any' },
      { id: 'else', label: 'Else', type: 'any' },
    ],
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over items',
    icon: 'Repeat',
    category: 'logic',
    defaultData: {
      label: 'Loop',
      loopType: 'forEach',
      maxIterations: 100,
      config: {},
    },
    inputs: [
      { id: 'items', label: 'Items', type: 'array' },
      { id: 'body', label: 'Body', type: 'any' },
    ],
    outputs: [
      { id: 'item', label: 'Item', type: 'any' },
      { id: 'done', label: 'Done', type: 'array' },
    ],
  },
  
  // I/O
  {
    type: 'input',
    label: 'Input',
    description: 'Define workflow input',
    icon: 'ArrowRight',
    category: 'io',
    defaultData: {
      label: 'Input',
      inputType: 'json',
      config: {},
    },
    inputs: [],
    outputs: [{ id: 'output', label: 'Value', type: 'any' }],
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Define workflow output',
    icon: 'ArrowLeft',
    category: 'io',
    defaultData: {
      label: 'Output',
      outputType: 'json',
      config: {},
    },
    inputs: [{ id: 'input', label: 'Value', type: 'any' }],
    outputs: [],
  },
];

// Create the store
export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNodeId: null,
      currentWorkflow: null,
      workflows: [],
      sidebarOpen: true,
      propertiesPanelOpen: true,
      codePreviewOpen: false,

      // Node actions
      addNode: (type, position, template) => {
        const nodeTemplate = nodeTemplates.find(t => t.type === type);
        const id = uuidv4();
        
        const newNode: Node<BuilderNodeData> = {
          id,
          type,
          position,
          data: {
            ...(nodeTemplate?.defaultData as BuilderNodeData),
            ...template,
            label: template?.label || nodeTemplate?.label || type,
            config: template?.config || {},
          } as BuilderNodeData,
        };

        set(state => ({
          nodes: [...state.nodes, newNode],
        }));
      },

      updateNodeData: (nodeId, data) => {
        set(state => ({
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } as BuilderNodeData }
              : node
          ),
        }));
      },

      deleteNode: (nodeId) => {
        set(state => ({
          nodes: state.nodes.filter(node => node.id !== nodeId),
          edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      duplicateNode: (nodeId) => {
        const node = get().nodes.find(n => n.id === nodeId);
        if (!node) return;

        const newNode: Node<BuilderNodeData> = {
          ...node,
          id: uuidv4(),
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          data: { ...node.data },
        };

        set(state => ({
          nodes: [...state.nodes, newNode],
        }));
      },

      onNodesChange: (changes) => {
        set(state => ({
          nodes: applyNodeChanges(changes, state.nodes),
        }));
      },

      onEdgesChange: (changes) => {
        set(state => ({
          edges: applyEdgeChanges(changes, state.edges),
        }));
      },

      onConnect: (connection) => {
        set(state => ({
          edges: addEdge(
            {
              ...connection,
              id: uuidv4(),
              type: 'smoothstep',
              animated: true,
            },
            state.edges
          ),
        }));
      },

      deleteEdge: (edgeId) => {
        set(state => ({
          edges: state.edges.filter(edge => edge.id !== edgeId),
        }));
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      // Workflow actions
      newWorkflow: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          currentWorkflow: null,
        });
      },

      saveWorkflow: (name, description) => {
        const { nodes, edges, currentWorkflow, workflows } = get();
        
        const workflow: WorkflowDefinition = {
          id: currentWorkflow?.id || uuidv4(),
          name,
          description,
          version: '1.0.0',
          nodes,
          edges,
          createdAt: currentWorkflow?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        const existingIndex = workflows.findIndex(w => w.id === workflow.id);
        const updatedWorkflows = existingIndex >= 0
          ? workflows.map(w => w.id === workflow.id ? workflow : w)
          : [...workflows, workflow];

        set({
          currentWorkflow: workflow,
          workflows: updatedWorkflows,
        });
      },

      loadWorkflow: (workflowId) => {
        const workflow = get().workflows.find(w => w.id === workflowId);
        if (!workflow) return;

        set({
          nodes: workflow.nodes,
          edges: workflow.edges,
          currentWorkflow: workflow,
          selectedNodeId: null,
        });
      },

      deleteWorkflow: (workflowId) => {
        set(state => ({
          workflows: state.workflows.filter(w => w.id !== workflowId),
          currentWorkflow: state.currentWorkflow?.id === workflowId ? null : state.currentWorkflow,
        }));
      },

      exportWorkflow: () => {
        const { nodes, edges, currentWorkflow } = get();
        return JSON.stringify({
          ...currentWorkflow,
          nodes,
          edges,
        }, null, 2);
      },

      importWorkflow: (json) => {
        try {
          const workflow = JSON.parse(json) as WorkflowDefinition;
          set({
            nodes: workflow.nodes,
            edges: workflow.edges,
            currentWorkflow: workflow,
            selectedNodeId: null,
          });
        } catch (error) {
          console.error('Failed to import workflow:', error);
        }
      },

      // UI actions
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      togglePropertiesPanel: () => set(state => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
      toggleCodePreview: () => set(state => ({ codePreviewOpen: !state.codePreviewOpen })),

      // Helpers
      getNodeById: (nodeId) => {
        return get().nodes.find(n => n.id === nodeId);
      },

      getConnectedNodes: (nodeId) => {
        const { nodes, edges } = get();
        const connectedIds = edges
          .filter(e => e.source === nodeId || e.target === nodeId)
          .map(e => e.source === nodeId ? e.target : e.source);
        return nodes.filter(n => connectedIds.includes(n.id));
      },
    }),
    {
      name: 'visual-builder-storage',
      partialize: (state) => ({
        workflows: state.workflows,
        nodes: state.nodes,
        edges: state.edges,
        currentWorkflow: state.currentWorkflow,
      }),
    }
  )
);
