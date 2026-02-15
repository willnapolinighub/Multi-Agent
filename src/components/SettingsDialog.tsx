'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Key,
  Server,
  Cpu,
  Clock,
  Bug,
  RefreshCw,
  Check,
  X,
  Loader2,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { useSettingsStore, useActiveProvider } from '@/lib/agents/providers/store';
import { ProviderType, PROVIDER_INFO } from '@/lib/agents/providers/client-types';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState<ProviderType | null>(null);
  const [testResult, setTestResult] = useState<{ provider: ProviderType; success: boolean; error?: string } | null>(null);

  const activeProvider = useActiveProvider();
  const {
    providers,
    masterOrchestratorModel,
    subOrchestratorModel,
    toolModel,
    maxIterations,
    defaultTemperature,
    timeout,
    debugMode,
    logApiCalls,
    setActiveProvider,
    updateProviderConfig,
    setModel,
    setMaxIterations,
    setDefaultTemperature,
    setTimeout,
    setDebugMode,
    setLogApiCalls,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useSettingsStore();

  const handleTestConnection = async (type: ProviderType) => {
    setTesting(type);
    setTestResult(null);

    try {
      // Call server API to test connection
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          provider: type,
          settings: { providers: { [type]: providers[type] } },
        }),
      });
      const result = await response.json();
      setTestResult({ provider: type, ...result });
    } catch (error) {
      setTestResult({
        provider: type,
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setTesting(null);
    }
  };

  const handleExport = () => {
    const settings = exportSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        importSettings(settings);
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
  };

  const currentConfig = providers[activeProvider];
  const providerInfo = PROVIDER_INFO[activeProvider];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Provider Settings
          </DialogTitle>
          <DialogDescription>
            Configure your AI provider and model settings for the multi-agent system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="providers" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-4 mt-4">
            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Provider</CardTitle>
                <CardDescription>Select the AI provider to use for all agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.entries(PROVIDER_INFO) as [ProviderType, typeof PROVIDER_INFO.openai][]).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => setActiveProvider(type)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        activeProvider === type
                          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{info.name}</span>
                        {activeProvider === type && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {info.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Provider Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {providerInfo.name} Configuration
                  <div className="flex gap-2">
                    {testResult?.provider === activeProvider && (
                      <Badge variant={testResult.success ? 'default' : 'destructive'}>
                        {testResult.success ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {testResult.success ? 'Connected' : 'Failed'}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key */}
                {providerInfo.requiresKey && (
                  <div>
                    <Label htmlFor="apiKey" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      API Key
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your API key"
                      value={currentConfig.apiKey || ''}
                      onChange={(e) => updateProviderConfig(activeProvider, { apiKey: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Base URL */}
                {activeProvider !== 'openai' && (
                  <div>
                    <Label htmlFor="baseUrl" className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Base URL
                    </Label>
                    <Input
                      id="baseUrl"
                      placeholder="https://api.example.com/v1"
                      value={currentConfig.baseUrl || ''}
                      onChange={(e) => updateProviderConfig(activeProvider, { baseUrl: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* n8n specific: Webhook Path */}
                {activeProvider === 'n8n' && (
                  <div>
                    <Label htmlFor="webhookPath">Webhook Path</Label>
                    <Input
                      id="webhookPath"
                      placeholder="/webhook/ai"
                      value={(currentConfig.options?.webhookPath as string) || '/webhook/ai'}
                      onChange={(e) => updateProviderConfig(activeProvider, {
                        options: { ...currentConfig.options, webhookPath: e.target.value }
                      })}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Test Connection */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection(activeProvider)}
                    disabled={testing === activeProvider}
                  >
                    {testing === activeProvider ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResult?.provider === activeProvider && !testResult.success && testResult.error && (
                  <p className="text-sm text-red-500">{testResult.error}</p>
                )}

                {providerInfo.docsUrl && (
                  <a
                    href={providerInfo.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Documentation →
                  </a>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Selection</CardTitle>
                <CardDescription>Choose models for different agent types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="masterModel" className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Master Orchestrator Model
                  </Label>
                  <Select value={masterOrchestratorModel} onValueChange={(v) => setModel('masterOrchestrator', v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConfig.availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for task planning and coordination
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="subModel" className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Sub-Orchestrator Model
                  </Label>
                  <Select value={subOrchestratorModel} onValueChange={(v) => setModel('subOrchestrator', v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConfig.availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used by Analytics, Research, and Content agents
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="toolModel" className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Tool Model
                  </Label>
                  <Select value={toolModel} onValueChange={(v) => setModel('tool', v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConfig.availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for simple tool tasks (cheaper model recommended)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent Settings</CardTitle>
                <CardDescription>Configure agent behavior and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center justify-between">
                    Max Iterations: {maxIterations}
                  </Label>
                  <Slider
                    value={[maxIterations]}
                    onValueChange={([v]) => setMaxIterations(v)}
                    min={5}
                    max={50}
                    step={5}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum agent loop iterations before stopping
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="flex items-center justify-between">
                    Temperature: {defaultTemperature.toFixed(1)}
                  </Label>
                  <Slider
                    value={[defaultTemperature * 10]}
                    onValueChange={([v]) => setDefaultTemperature(v / 10)}
                    min={0}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower = more deterministic, Higher = more creative
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="timeout" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timeout (ms)
                  </Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(parseInt(e.target.value) || 60000)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Request timeout in milliseconds
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Bug className="w-4 h-4" />
                      Debug Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show detailed agent reasoning
                    </p>
                  </div>
                  <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Log API Calls</Label>
                    <p className="text-xs text-muted-foreground">
                      Log all API requests to console
                    </p>
                  </div>
                  <Switch checked={logApiCalls} onCheckedChange={setLogApiCalls} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Settings Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button variant="outline" asChild>
                    <label>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Settings
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <Button variant="destructive" onClick={resetToDefaults}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
