'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain,
  Network,
  BarChart3,
  Search,
  FileText,
  Code,
  Zap,
  Settings,
  Play,
  ChevronRight,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Sun,
  Moon,
  Sparkles,
  Layers,
  GitBranch,
  Webhook,
  Clock,
  Globe,
  Shield,
  Rocket,
  Users,
  Star,
  Check,
  Menu,
  X,
  Copy,
  Terminal,
  Box,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Feature data
const features = [
  {
    icon: Network,
    title: 'Hierarchical Architecture',
    description: 'Master orchestrator coordinates specialized sub-agents for complex task execution with intelligent delegation.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Brain,
    title: 'Multi-Provider AI',
    description: 'Switch between OpenAI, Ollama, OpenRouter, n8n, or any custom OpenAI-compatible API seamlessly.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Layers,
    title: 'Visual Builder',
    description: 'n8n-style drag & drop canvas to create agents and workflows without writing code.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: GitBranch,
    title: 'Tool Calling',
    description: 'Native LLM function calling support with 15+ pre-built tools for analytics, research, and content.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Shield,
    title: 'Type-Safe',
    description: 'Built with TypeScript for maximum reliability and excellent developer experience.',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    icon: Rocket,
    title: 'Production Ready',
    description: 'REST API endpoints, workflow persistence, and scalable architecture for enterprise deployment.',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

const tools = [
  { name: 'Statistical Analysis', icon: BarChart3, category: 'Analytics' },
  { name: 'Trend Detection', icon: Zap, category: 'Analytics' },
  { name: 'Web Search', icon: Search, category: 'Research' },
  { name: 'Content Extraction', icon: Globe, category: 'Research' },
  { name: 'Report Generation', icon: FileText, category: 'Content' },
  { name: 'Translation', icon: Globe, category: 'Content' },
];

const providers = [
  { name: 'OpenAI', logo: '🤖', description: 'GPT-4o, GPT-4 Turbo' },
  { name: 'Ollama', logo: '🦙', description: 'Run locally, free' },
  { name: 'OpenRouter', logo: '🔀', description: 'Multi-model gateway' },
  { name: 'n8n', logo: '⚡', description: 'Workflow integration' },
  { name: 'Custom', logo: '🔧', description: 'Any OpenAI-compatible' },
];

const stats = [
  { value: '15+', label: 'Pre-built Tools' },
  { value: '6', label: 'AI Providers' },
  { value: '100%', label: 'TypeScript' },
  { value: 'MIT', label: 'License' },
];

const faqs = [
  {
    question: 'What AI models are supported?',
    answer: 'Multi-Agent System supports OpenAI (GPT-4o, GPT-4 Turbo), Ollama (Llama, Mistral, Qwen), OpenRouter (Claude, Gemini, GPT), n8n workflows, and any custom OpenAI-compatible API endpoint.',
  },
  {
    question: 'Can I run this locally without API costs?',
    answer: 'Yes! Use Ollama integration to run models like Llama 3.2 locally on your machine. Zero API costs, complete privacy, and works offline.',
  },
  {
    question: 'How does the visual builder work?',
    answer: 'The visual builder uses ReactFlow to provide a drag-and-drop canvas. Simply drag nodes (triggers, agents, tools) onto the canvas, connect them, configure properties, and generate production-ready TypeScript code.',
  },
  {
    question: 'Can I create custom tools?',
    answer: 'Absolutely! Create custom tools with JavaScript/TypeScript code. Define parameters, write your logic, and the tool becomes available to all agents automatically.',
  },
  {
    question: 'Is this suitable for production use?',
    answer: 'Yes. The system includes REST API endpoints, workflow persistence, error handling, and a scalable architecture. Generated code is production-ready TypeScript.',
  },
];

const codeExample = `// Create and execute a multi-agent workflow
import { createAgentSystem } from '@/lib/agents';

const system = await createAgentSystem();

// Master orchestrator automatically delegates
const result = await system.execute(
  'Analyze our Q4 sales data and write a summary report',
  { 
    data: salesData,
    format: 'markdown'
  }
);

console.log(result.output);`;

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeDemo, setActiveDemo] = useState('agent');

  const copyCode = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Multi-Agent</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</a>
              <a href="#tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tools</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              <Button className="hidden md:flex gap-2" onClick={onLaunchApp}>
                Launch App
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-background"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                <a href="#features" className="text-sm" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#demo" className="text-sm" onClick={() => setMobileMenuOpen(false)}>Demo</a>
                <a href="#tools" className="text-sm" onClick={() => setMobileMenuOpen(false)}>Tools</a>
                <a href="#faq" className="text-sm" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                <Button className="w-full gap-2" onClick={onLaunchApp}>
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              Open Source • TypeScript • Production Ready
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Build{' '}
              <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                AI Agent Systems
              </span>
              <br />
              Visually
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Hierarchical multi-agent architecture with visual builder. Create, orchestrate, 
              and deploy AI agents with drag-and-drop simplicity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="gap-2 text-lg px-8" onClick={onLaunchApp}>
                <Play className="w-5 h-5" />
                Try Demo
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-xl border shadow-2xl overflow-hidden bg-card">
              <div className="h-8 bg-muted flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground ml-2">Multi-Agent System</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 aspect-video flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                  {/* Mini preview of the builder */}
                  <div className="col-span-1 space-y-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="text-xs text-slate-400 mb-2">Palette</div>
                    {['Trigger', 'Agent', 'Tool'].map((item) => (
                      <div key={item} className="p-2 rounded bg-slate-700/50 text-xs text-slate-300 flex items-center gap-2">
                        <Box className="w-3 h-3" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="col-span-2 p-4 rounded-lg bg-slate-800/50 border border-slate-700 relative">
                    <div className="text-xs text-slate-400 mb-4">Canvas</div>
                    {/* Mini nodes */}
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                        <Play className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="h-0.5 w-8 bg-gradient-to-r from-green-500 to-purple-500" />
                      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Network className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="h-0.5 w-8 bg-gradient-to-r from-purple-500 to-blue-500" />
                      <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            WORKS WITH YOUR FAVORITE AI PROVIDERS
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {providers.map((provider) => (
              <div key={provider.name} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-2xl">{provider.logo}</span>
                <div>
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to Build
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Intelligent Agents
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for creating, orchestrating, and deploying AI agent systems
              with enterprise-grade reliability.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-border/50 hover:border-primary/50">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Interactive Demo</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the architecture and see how agents collaborate to solve complex tasks.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="agent">Agent Flow</TabsTrigger>
                <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                <TabsTrigger value="code">Code Output</TabsTrigger>
              </TabsList>

              <TabsContent value="agent" className="mt-0">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                      {/* User */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="text-sm font-medium">User</div>
                        <div className="text-xs text-muted-foreground">"Analyze sales"</div>
                      </motion.div>

                      <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />

                      {/* Master Orchestrator */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-2">
                          <Network className="w-10 h-10 text-purple-500" />
                        </div>
                        <div className="text-sm font-medium">Master</div>
                        <div className="text-xs text-muted-foreground">Plans & Delegates</div>
                      </motion.div>

                      <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />

                      {/* Sub-agents */}
                      <div className="flex flex-col gap-3">
                        {[
                          { icon: BarChart3, color: 'blue', name: 'Analytics' },
                          { icon: Search, color: 'green', name: 'Research' },
                          { icon: FileText, color: 'orange', name: 'Content' },
                        ].map((agent, i) => (
                          <motion.div
                            key={agent.name}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-${agent.color}-500/20 border border-${agent.color}-500/30 flex items-center justify-center`}>
                              <agent.icon className={`w-5 h-5 text-${agent.color}-500`} />
                            </div>
                            <span className="text-sm">{agent.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="builder" className="mt-0">
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-4 gap-4 h-64">
                      {/* Palette */}
                      <div className="col-span-1 border rounded-lg p-2 bg-muted/50">
                        <div className="text-xs text-muted-foreground mb-2">Palette</div>
                        <div className="space-y-2">
                          {[
                            { icon: Play, name: 'Trigger' },
                            { icon: Network, name: 'Agent' },
                            { icon: Box, name: 'Tool' },
                            { icon: GitBranch, name: 'Condition' },
                          ].map((item) => (
                            <div key={item.name} className="p-2 rounded bg-background border text-xs flex items-center gap-2 cursor-grab">
                              <item.icon className="w-3 h-3" />
                              {item.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Canvas */}
                      <div className="col-span-3 border rounded-lg bg-muted/30 relative p-4">
                        <div className="text-xs text-muted-foreground mb-4">Canvas</div>
                        <div className="flex items-center gap-6">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-3 rounded-lg bg-green-500/20 border border-green-500/30"
                          >
                            <Play className="w-5 h-5 text-green-500" />
                          </motion.div>
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-blue-500" />
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-4 rounded-lg bg-purple-500/20 border border-purple-500/30"
                          >
                            <Network className="w-6 h-6 text-purple-500" />
                          </motion.div>
                          <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                            className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30"
                          >
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                          </motion.div>
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                          Drag & drop to build
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code" className="mt-0">
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">workflow.ts</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={copyCode} className="gap-2">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <pre className="p-4 text-sm overflow-x-auto bg-slate-900 text-slate-100 rounded-b-lg">
                      <code>{codeExample}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">Built-in Tools</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              15+ Ready-to-Use Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pre-built tools for data analysis, web research, and content creation.
              Create custom tools with just a few lines of code.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50">
                  <tool.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.category}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Build Your
              <br />
              <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Agent System?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start building AI agent workflows in minutes. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 text-lg px-8" onClick={onLaunchApp}>
                Launch App
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8" asChild>
                <a href="#demo">
                  Watch Demo
                  <Play className="w-5 h-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">Multi-Agent</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Build intelligent AI agent systems with a visual builder and hierarchical architecture.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#demo" className="hover:text-foreground">Demo</a></li>
                <li><a href="#tools" className="hover:text-foreground">Tools</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground">Examples</a></li>
                <li><a href="#" className="hover:text-foreground">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Multi-Agent System. Open source under MIT license.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
