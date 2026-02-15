'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Connection,
  Edge,
  BackgroundVariant,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  Copy,
  Settings,
  Zap,
  Plus,
  X,
  Code2,
  ChevronLeft,
} from 'lucide-react';

import { nodeTypes } from '@/lib/builder/nodes';
import { useBuilderStore, nodeTemplates } from '@/lib/builder/store';
import { generateCode, exportWorkflowJson } from '@/lib/builder/codeGenerator';
import { BuilderNodeData, NodeTemplate, GeneratedCode } from '@/lib/builder/types';

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

export function VisualBuilder() {
  const {
    nodes,
    edges,
    selectedNodeId,
    sidebarOpen,
    propertiesPanelOpen,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeData,
    deleteNode,
    duplicateNode,
    selectNode,
    saveWorkflow,
    newWorkflow,
    exportWorkflow,
    importWorkflow,
    toggleSidebar,
    togglePropertiesPanel,
    getNodeById,
  } = useBuilderStore();

  const [workflowName, setWorkflowName] = useState('my-workflow');
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeTab, setActiveTab] = useState('agents');

  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle drag from palette
  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop on canvas
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;
    
    const template = JSON.parse(data) as NodeTemplate;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 100,
      y: event.clientY - bounds.top - 50,
    };
    
    addNode(template.type, position, template.defaultData);
  }, [addNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Generate code from workflow
  const handleGenerateCode = () => {
    const code = generateCode(nodes, edges, workflowName);
    setGeneratedCode(code);
    setShowCodePreview(true);
  };

  // Export workflow
  const handleExport = () => {
    const json = exportWorkflowJson(nodes, edges, workflowName);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import workflow
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importWorkflow(content);
    };
    reader.readAsText(file);
  };

  // Group templates by category
  const templatesByCategory = nodeTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  const categoryLabels: Record<string, string> = {
    trigger: 'Triggers',
    agent: 'Agents',
    tool: 'Tools',
    logic: 'Logic',
    io: 'Input/Output',
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] border rounded-lg overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Node Palette */}
        <div className={`border-r bg-muted/30 flex flex-col transition-all shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="p-3 border-b bg-background shrink-0">
            <h3 className="font-semibold">Node Palette</h3>
            <p className="text-xs text-muted-foreground">Drag nodes to canvas</p>
          </div>
          
          <ScrollArea className="flex-1 h-0">
            <div className="p-2">
              {Object.entries(templatesByCategory).map(([category, templates]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-1">
                    {templates.map((template) => {
                      const Icon = iconMap[template.icon] || Zap;
                      return (
                        <div
                          key={template.label}
                          draggable
                          onDragStart={(e) => onDragStart(e, template)}
                          className="flex items-center gap-2 p-2 rounded border bg-background cursor-grab hover:bg-accent active:cursor-grabbing transition-colors"
                        >
                          <div className="p-1 rounded bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{template.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {template.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b p-2 flex items-center gap-2 bg-background">
            <Button variant="ghost" size="sm" onClick={toggleSidebar}>
              <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-40 h-8"
              placeholder="Workflow name"
            />
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="outline" size="sm" onClick={newWorkflow}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => saveWorkflow(workflowName)}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-1" />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button variant="default" size="sm" onClick={handleGenerateCode}>
              <Code2 className="w-4 h-4 mr-1" />
              Generate Code
            </Button>
          </div>

          {/* ReactFlow Canvas */}
          <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes as NodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
              }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedNode && (
          <div className="w-72 border-l bg-muted/30 flex flex-col">
            <div className="p-3 border-b bg-background flex items-center justify-between">
              <h3 className="font-semibold">Properties</h3>
              <Button variant="ghost" size="sm" onClick={() => selectNode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Node Info */}
                <div>
                  <Label>Node ID</Label>
                  <Input value={selectedNode.id} disabled className="mt-1 h-8 text-xs font-mono" />
                </div>
                
                <div>
                  <Label>Label</Label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    className="mt-1 h-8"
                  />
                </div>

                {/* Agent-specific properties */}
                {selectedNode.type === 'agent' && (
                  <>
                    <div>
                      <Label>System Prompt</Label>
                      <Textarea
                        value={(selectedNode.data as any).systemPrompt || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { systemPrompt: e.target.value })}
                        className="mt-1 text-xs"
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label>Model</Label>
                      <Select
                        value={(selectedNode.data as any).model || 'gpt-4o'}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { model: v })}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Temperature</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={(selectedNode.data as any).temperature || 0.5}
                        onChange={(e) => updateNodeData(selectedNode.id, { temperature: parseFloat(e.target.value) })}
                        className="mt-1 h-8"
                      />
                    </div>
                  </>
                )}

                {/* Tool-specific properties */}
                {selectedNode.type === 'tool' && (
                  <>
                    <div>
                      <Label>Function Name</Label>
                      <Input
                        value={(selectedNode.data as any).functionName || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { functionName: e.target.value })}
                        className="mt-1 h-8 font-mono text-xs"
                      />
                    </div>
                    
                    {(selectedNode.data as any).toolType === 'custom' && (
                      <div>
                        <Label>Custom Code</Label>
                        <Textarea
                          value={(selectedNode.data as any).code || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value })}
                          className="mt-1 font-mono text-xs"
                          rows={8}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Trigger-specific properties */}
                {selectedNode.type === 'trigger' && (
                  <>
                    <div>
                      <Label>Trigger Type</Label>
                      <Select
                        value={(selectedNode.data as any).triggerType || 'manual'}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { triggerType: v as 'manual' | 'webhook' | 'schedule' | 'event' })}
                      >
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(selectedNode.data as any).triggerType === 'webhook' && (
                      <div>
                        <Label>Webhook Path</Label>
                        <Input
                          value={(selectedNode.data as any).webhookPath || '/webhook'}
                          onChange={(e) => updateNodeData(selectedNode.id, { webhookPath: e.target.value })}
                          className="mt-1 h-8 font-mono text-xs"
                        />
                      </div>
                    )}
                    
                    {(selectedNode.data as any).triggerType === 'schedule' && (
                      <div>
                        <Label>Cron Schedule</Label>
                        <Input
                          value={(selectedNode.data as any).schedule || '0 * * * *'}
                          onChange={(e) => updateNodeData(selectedNode.id, { schedule: e.target.value })}
                          className="mt-1 h-8 font-mono text-xs"
                          placeholder="0 * * * *"
                        />
                      </div>
                    )}
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => duplicateNode(selectedNode.id)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Code Preview Dialog */}
      <Dialog open={showCodePreview} onOpenChange={setShowCodePreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated Code</DialogTitle>
            <DialogDescription>
              Copy these files to your project to use the workflow
            </DialogDescription>
          </DialogHeader>
          
          {generatedCode && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue={generatedCode.files[0]?.path}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {generatedCode.files.map((file) => (
                    <TabsTrigger key={file.path} value={file.path} className="text-xs">
                      {file.path.split('/').pop()}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {generatedCode.files.map((file) => (
                  <TabsContent key={file.path} value={file.path} className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[400px]">
                      <pre className="p-4 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                        {file.content}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Instructions</h4>
                <pre className="text-xs whitespace-pre-wrap">{generatedCode.instructions}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
