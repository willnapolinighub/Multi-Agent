# 🤖 Multi-Agent System

A powerful, production-ready **hierarchical multi-agent framework** with a visual builder for creating, orchestrating, and deploying AI agent systems. Built with TypeScript, Next.js 16, and featuring a drag-and-drop workflow canvas.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)

## ✨ Features

### 🏗️ Hierarchical Architecture
- **Master Orchestrator**: Coordinates complex tasks across specialized sub-agents
- **Sub-Orchestrators**: Domain-specific coordinators (Analytics, Research, Content)
- **Specialist Agents**: Focused tools for specific operations
- **Intelligent Delegation**: Automatic task routing based on domain expertise

### 🎨 Visual Builder
- **n8n-style Canvas**: Drag-and-drop interface for creating agent workflows
- **Node Palette**: Pre-built nodes for triggers, agents, tools, and logic
- **Properties Panel**: Configure nodes with rich form controls
- **Code Generation**: Export visual workflows to production-ready TypeScript

### 🔌 Multi-Provider AI Support
| Provider | Models | Features |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4 Turbo | Full tool calling support |
| **Ollama** | Llama, Mistral, Qwen | Run locally, zero API costs |
| **OpenRouter** | Claude, Gemini, GPT | Multi-model gateway |
| **n8n** | Custom workflows | Integration with automation |
| **AgentRouter** | Auto-routing | Intelligent model selection |
| **Custom** | Any OpenAI-compatible | Bring your own API |

### 🛠️ 15+ Built-in Tools

**Analytics Tools:**
- Statistical Analysis
- Trend Detection
- Data Comparison
- Correlation Analysis
- Forecasting

**Research Tools:**
- Web Search
- Content Extraction
- Summarization
- Fact Verification

**Content Tools:**
- Report Generation
- Content Formatting
- Translation
- Sentiment Analysis

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/multi-agent-system.git
cd multi-agent-system

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
# Required: OpenAI API Key (for z-ai-web-dev-sdk)
OPENAI_API_KEY=your_openai_api_key

# Optional: Other provider API keys
OLLAMA_BASE_URL=http://localhost:11434
OPENROUTER_API_KEY=your_openrouter_key
N8N_WEBHOOK_URL=http://localhost:5678/webhook
CUSTOM_AI_API_KEY=your_custom_key
```

## 📖 Documentation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Landing Page│  │  Agent App  │  │   Visual Builder    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │ /api/agents   │  │ /api/settings │  │ /api/analytics │   │
│  └───────────────┘  └───────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Agent System Core                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Master Orchestrator                     │    │
│  │    (Plans, Coordinates, Aggregates Results)         │    │
│  └───────────┬──────────────┬──────────────┬───────────┘    │
│              │              │              │                 │
│  ┌───────────▼────┐ ┌──────▼───────┐ ┌────▼────────────┐   │
│  │   Analytics    │ │   Research   │ │     Content     │   │
│  │  Orchestrator  │ │ Orchestrator │ │  Orchestrator   │   │
│  └────────┬───────┘ └──────┬───────┘ └────────┬────────┘   │
│           │                │                 │              │
│  ┌────────▼────┐    ┌──────▼──────┐   ┌──────▼──────┐      │
│  │ Analytics   │    │  Research   │   │   Content   │      │
│  │   Tools     │    │   Tools     │   │   Tools     │      │
│  └─────────────┘    └─────────────┘   └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Provider Layer                            │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ ┌────────┐ ┌──────┐ │
│  │ OpenAI  │ │ Ollama  │ │OpenRouter │ │  n8n   │ │Custom│ │
│  └─────────┘ └─────────┘ └───────────┘ └────────┘ └──────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Creating Agents

#### Using Code

```typescript
import { MasterOrchestrator, AnalyticsOrchestrator } from '@/lib/agents';

// Create a master orchestrator
const master = new MasterOrchestrator({
  id: 'master-1',
  name: 'Task Coordinator',
  description: 'Main orchestrator for complex tasks',
  role: 'master_orchestrator',
  domain: 'general',
  model: 'gpt-4o',
});

// Execute a task
const result = await master.execute('Analyze Q4 sales and create a report');
```

#### Using Visual Builder

1. Open the app and click "Launch App"
2. Switch to the "Build" tab
3. Drag nodes from the palette onto the canvas
4. Connect nodes to define workflow
5. Configure each node's properties
6. Click "Generate Code" to export TypeScript

### Adding Custom Tools

```typescript
// src/lib/agents/tools/custom.ts
import { Tool } from '@/lib/agents/core/types';

export const customTool: Tool = {
  definition: {
    name: 'my_custom_tool',
    description: 'Does something specific',
    parameters: {
      input: {
        type: 'string',
        description: 'Input parameter',
        required: true,
      },
    },
  },
  execute: async (params) => {
    // Your custom logic here
    return {
      success: true,
      data: { result: 'Processed: ' + params.input },
    };
  },
};
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | POST | Execute master orchestrator |
| `/api/agents/analytics` | POST | Execute analytics agent |
| `/api/agents/research` | POST | Execute research agent |
| `/api/agents/content` | POST | Execute content agent |
| `/api/settings` | GET/POST | Manage provider settings |

#### Example API Usage

```bash
# Execute a task
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze the latest market trends",
    "context": { "industry": "technology" }
  }'
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: Zustand
- **Visual Builder**: ReactFlow
- **Animations**: Framer Motion
- **AI SDK**: z-ai-web-dev-sdk (OpenAI compatible)

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── agents/               # Agent endpoints
│   │   │   ├── route.ts          # Master orchestrator
│   │   │   ├── analytics/        # Analytics agent
│   │   │   ├── research/         # Research agent
│   │   │   └── content/          # Content agent
│   │   └── settings/             # Settings management
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main entry (Landing → App)
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── builder/                  # Visual builder components
│   │   └── VisualBuilder.tsx     # Main canvas component
│   ├── landing/                  # Landing page components
│   │   ├── LandingPage.tsx       # Marketing page
│   │   └── ThemeProvider.tsx     # Dark/light theme
│   ├── MainApp.tsx               # Main application
│   ├── PageWrapper.tsx           # Page wrapper with providers
│   └── SettingsDialog.tsx        # Settings modal
│
├── lib/
│   ├── agents/                   # Agent system core
│   │   ├── core/                 # Base classes and types
│   │   │   ├── Agent.ts          # Base agent class
│   │   │   ├── Orchestrator.ts   # Orchestrator base
│   │   │   └── types.ts          # Type definitions
│   │   ├── orchestrators/        # Specialized orchestrators
│   │   │   ├── MasterOrchestrator.ts
│   │   │   ├── AnalyticsOrchestrator.ts
│   │   │   ├── ResearchOrchestrator.ts
│   │   │   └── ContentOrchestrator.ts
│   │   ├── providers/            # AI provider implementations
│   │   │   ├── types.ts          # Provider types
│   │   │   ├── store.ts          # Settings store
│   │   │   ├── OpenAIProvider.ts
│   │   │   ├── OllamaProvider.ts
│   │   │   ├── OpenRouterProvider.ts
│   │   │   ├── N8nProvider.ts
│   │   │   ├── AgentRouterProvider.ts
│   │   │   └── CustomProvider.ts
│   │   └── tools/                # Built-in tools
│   │       ├── analytics.ts      # Analytics tools
│   │       ├── research.ts       # Research tools
│   │       └── content.ts        # Content tools
│   │
│   ├── builder/                  # Visual builder core
│   │   ├── types.ts              # Builder types
│   │   ├── store.ts              # Builder state
│   │   ├── codeGenerator.ts      # Visual → Code
│   │   └── nodes/                # Custom ReactFlow nodes
│   │
│   ├── db.ts                     # Database client
│   └── utils.ts                  # Utility functions
│
└── hooks/                        # Custom React hooks
    ├── use-mobile.ts
    └── use-toast.ts
```

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/multi-agent-system)

1. Push your code to GitHub
2. Import your repository on Vercel
3. Set environment variables
4. Deploy!

### Docker

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Expose port
EXPOSE 3000

# Start
CMD ["bun", "start"]
```

```bash
docker build -t multi-agent-system .
docker run -p 3000:3000 multi-agent-system
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and install
git clone https://github.com/yourusername/multi-agent-system.git
cd multi-agent-system
bun install

# Run development server
bun run dev

# Run linting
bun run lint

# Build for production
bun run build
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema |
| `bun run db:generate` | Generate Prisma client |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT models
- [Ollama](https://ollama.ai/) for local LLM support
- [ReactFlow](https://reactflow.dev/) for the visual builder canvas
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting platform

## 📞 Support

- 📖 [Documentation](https://github.com/yourusername/multi-agent-system/wiki)
- 🐛 [Issue Tracker](https://github.com/yourusername/multi-agent-system/issues)
- 💬 [Discussions](https://github.com/yourusername/multi-agent-system/discussions)

---

Built with ❤️ by Will Napolini & Community. Powered by AI.
