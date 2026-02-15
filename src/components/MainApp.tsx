'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Search,
  FileText,
  BarChart3,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Network,
  BookOpen,
  Sparkles,
  Settings,
  Bot,
  Layout,
  ArrowLeft,
} from 'lucide-react';
import { SettingsDialog } from '@/components/SettingsDialog';
import dynamic from 'next/dynamic';

const VisualBuilder = dynamic(() => import('@/components/builder/VisualBuilder').then((mod) => mod.VisualBuilder), { ssr: false });

import { useSettingsStore, useActiveProvider } from '@/lib/agents/providers/store';
import { ProviderType } from '@/lib/agents/providers/types';

type AgentType = 'master' | 'analytics' | 'research' | 'content';

interface AgentResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  data?: unknown;
}

interface MainAppProps {
  onBackToLanding: () => void;
}

export default function MainApp({ onBackToLanding }: MainAppProps) {
  const [mainTab, setMainTab] = useState<'run' | 'build'>('run');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('master');
  const [task, setTask] = useState('');
  const [data, setData] = useState('');
  const [tool, setTool] = useState('');
  const [toolParams, setToolParams] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [activeTab, setActiveTab] = useState('task');

  const activeProvider = useActiveProvider();
  const { providers, masterOrchestratorModel } = useSettingsStore();

  const getProviderHeaders = () => {
    const config = providers[activeProvider];
    return {
      'X-Provider': activeProvider,
      'X-Model': selectedAgent === 'master' ? masterOrchestratorModel : masterOrchestratorModel,
      ...(config.apiKey && { 'X-API-Key': config.apiKey }),
      ...(config.baseUrl && { 'X-Base-URL': config.baseUrl }),
    };
  };

  const executeTask = async () => {
    if (!task.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const endpoint = selectedAgent === 'master' ? '/api/agents' : `/api/agents/${selectedAgent}`;
      const body: Record<string, unknown> = { task };
      if (data.trim()) {
        try {
          body.data = JSON.parse(data);
        } catch {
          body.data = data;
        }
      }
      if (selectedAgent !== 'master') body.directTo = selectedAgent;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getProviderHeaders() },
        body: JSON.stringify(body),
      });
      const resultData = await response.json();
      setResult(resultData);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const executeTool = async () => {
    if (!tool.trim() || !toolParams.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const endpoint = selectedAgent === 'master' ? '/api/agents' : `/api/agents/${selectedAgent}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getProviderHeaders() },
        body: JSON.stringify({ tool, params: JSON.parse(toolParams) }),
      });
      const resultData = await response.json();
      setResult(resultData);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Invalid JSON' });
    } finally {
      setLoading(false);
    }
  };

  const agentConfig = {
    master: { name: 'Master Orchestrator', description: 'Top-level coordinator', icon: Network, tools: ['delegate_to_analytics', 'delegate_to_research', 'delegate_to_content'] },
    analytics: { name: 'Analytics Orchestrator', description: 'Data analysis & statistics', icon: BarChart3, tools: ['statistical_analysis', 'trend_analysis', 'data_comparison', 'data_aggregation', 'data_filtering'] },
    research: { name: 'Research Orchestrator', description: 'Web search & extraction', icon: Search, tools: ['web_search', 'read_web_content', 'summarize_content', 'extract_facts', 'analyze_topics'] },
    content: { name: 'Content Orchestrator', description: 'Content creation & formatting', icon: FileText, tools: ['generate_content', 'format_content', 'translate_content', 'enhance_content', 'generate_report'] },
  };

  const currentAgent = agentConfig[selectedAgent];
  const AgentIcon = currentAgent.icon;
  const providerDisplayName: Record<ProviderType, string> = {
    openai: 'OpenAI', ollama: 'Ollama (Local)', openrouter: 'OpenRouter', n8n: 'n8n', agentrouter: 'AgentRouter', custom: 'Custom'
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Multi-Agent System</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hierarchical AI architecture with visual builder for creating custom agents and workflows
          </p>
        </div>

        {/* Status Bar */}
        <Card className="mb-6">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBackToLanding} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {providerDisplayName[activeProvider]}
                </Badge>
                <span className="text-sm text-muted-foreground">Model: {masterOrchestratorModel}</span>
              </div>
              <SettingsDialog />
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'run' | 'build')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="run" className="flex items-center gap-2">
              <Bot className="w-4 h-4" /> Run Agents
            </TabsTrigger>
            <TabsTrigger value="build" className="flex items-center gap-2">
              <Layout className="w-4 h-4" /> Visual Builder
            </TabsTrigger>
          </TabsList>

          {/* Run Agents Tab */}
          <TabsContent value="run" className="space-y-6">
            {/* Architecture */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" /> System Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <Network className="w-8 h-8 text-primary" />
                    </div>
                    <span className="mt-2 text-sm font-medium text-primary">Master</span>
                  </div>
                  <div className="text-muted-foreground text-2xl hidden md:block">→</div>
                  <div className="text-muted-foreground text-2xl md:hidden">↓</div>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="mt-1 text-xs text-blue-500 font-medium">Analytics</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <Search className="w-6 h-6 text-green-500" />
                      </div>
                      <span className="mt-1 text-xs text-green-500 font-medium">Research</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <FileText className="w-6 h-6 text-orange-500" />
                      </div>
                      <span className="mt-1 text-xs text-orange-500 font-medium">Content</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Agent Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" /> Select Agent
                  </CardTitle>
                  <CardDescription>Choose orchestrator</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.entries(agentConfig) as [AgentType, typeof agentConfig.master][]).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedAgent === key;
                    return (
                      <button key={key} onClick={() => { setSelectedAgent(key); setTool(''); setResult(null); }}
                        className={`w-full p-4 rounded-lg border transition-all text-left ${isSelected ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/30' : 'bg-muted/50 border-border hover:bg-muted'}`}>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-xs text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Input Panel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AgentIcon className="w-5 h-5 text-primary" /> {currentAgent.name}
                  </CardTitle>
                  <CardDescription>Enter task or use tool</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="task">Task Mode</TabsTrigger>
                      <TabsTrigger value="tool">Tool Mode</TabsTrigger>
                    </TabsList>

                    <TabsContent value="task" className="space-y-4">
                      <div>
                        <Label>Task Description</Label>
                        <Textarea placeholder="Describe what you want..." value={task} onChange={(e) => setTask(e.target.value)} className="mt-2 min-h-[120px]" />
                      </div>
                      <div>
                        <Label>Additional Data (JSON, optional)</Label>
                        <Textarea placeholder='{"key": "value"}' value={data} onChange={(e) => setData(e.target.value)} className="mt-2 min-h-[80px] font-mono text-sm" />
                      </div>
                      <Button onClick={executeTask} disabled={loading || !task.trim()} className="w-full">
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Executing...</> : <><Send className="w-4 h-4 mr-2" />Execute Task</>}
                      </Button>
                    </TabsContent>

                    <TabsContent value="tool" className="space-y-4">
                      <div>
                        <Label>Select Tool</Label>
                        <Select value={tool} onValueChange={setTool}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Choose tool" /></SelectTrigger>
                          <SelectContent>
                            {currentAgent.tools.map((t) => (
                              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Parameters (JSON)</Label>
                        <Textarea placeholder='{"param": "value"}' value={toolParams} onChange={(e) => setToolParams(e.target.value)} className="mt-2 min-h-[120px] font-mono text-sm" />
                      </div>
                      <Button onClick={executeTool} disabled={loading || !tool || !toolParams.trim()} className="w-full">
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Executing...</> : <><Sparkles className="w-4 h-4 mr-2" />Execute Tool</>}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Result */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    Result
                    {result.executionTime && <Badge variant="outline" className="ml-auto"><Clock className="w-3 h-3 mr-1" />{result.executionTime}ms</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {result.success ? JSON.stringify(result.output || result.data, null, 2) : result.error}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-500" /> Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <button onClick={() => { setSelectedAgent('analytics'); setTask('Analyze this sales data'); setData(JSON.stringify([100, 150, 200, 175, 250])); setActiveTab('task'); }}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted text-left transition-colors">
                    <div className="font-medium mb-1">Statistical Analysis</div>
                    <div className="text-sm text-muted-foreground">Analyze sales data</div>
                  </button>
                  <button onClick={() => { setSelectedAgent('research'); setTask('Search for latest AI agent developments'); setData(''); setActiveTab('task'); }}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted text-left transition-colors">
                    <div className="font-medium mb-1">Web Research</div>
                    <div className="text-sm text-muted-foreground">Search AI developments</div>
                  </button>
                  <button onClick={() => { setSelectedAgent('content'); setTask('Write about multi-agent systems'); setData(''); setActiveTab('task'); }}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:bg-muted text-left transition-colors">
                    <div className="font-medium mb-1">Generate Report</div>
                    <div className="text-sm text-muted-foreground">Write article</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Builder Tab */}
          <TabsContent value="build">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="w-5 h-5 text-primary" /> Visual Builder
                </CardTitle>
                <CardDescription>Drag & drop to create agents and workflows</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <VisualBuilder />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
