# API Documentation

This document describes the REST API endpoints available in the Multi-Agent System.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.vercel.app
```

## Authentication

Currently, the API does not require authentication. For production deployments, consider adding API key authentication.

## Endpoints

### Agents

#### Execute Master Orchestrator

Execute a task through the master orchestrator, which will automatically delegate to appropriate sub-agents.

```http
POST /api/agents
```

**Request Body:**

```json
{
  "message": "Analyze Q4 sales data and create a summary report",
  "context": {
    "data": { ... },
    "format": "markdown"
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | The task description for the orchestrator |
| `context` | object | No | Additional context data for the task |

**Response:**

```json
{
  "success": true,
  "result": {
    "output": "Analysis complete. Q4 sales increased by 15%...",
    "artifacts": [
      {
        "type": "report",
        "content": "..."
      }
    ]
  },
  "executionTime": 12345
}
```

---

#### Execute Analytics Agent

Execute analytics-specific tasks directly.

```http
POST /api/agents/analytics
```

**Request Body:**

```json
{
  "message": "Perform statistical analysis on this dataset",
  "data": [1, 2, 3, 4, 5],
  "analysis": "descriptive"
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "mean": 3,
    "median": 3,
    "stdDev": 1.41,
    "summary": "Dataset shows normal distribution..."
  }
}
```

---

#### Execute Research Agent

Execute research-specific tasks directly.

```http
POST /api/agents/research
```

**Request Body:**

```json
{
  "message": "Research the latest trends in AI agent systems",
  "depth": "comprehensive",
  "sources": ["web", "academic"]
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "findings": [
      {
        "topic": "Multi-agent orchestration",
        "summary": "...",
        "sources": ["https://..."]
      }
    ],
    "summary": "Research findings summary..."
  }
}
```

---

#### Execute Content Agent

Execute content-specific tasks directly.

```http
POST /api/agents/content
```

**Request Body:**

```json
{
  "message": "Generate a blog post about AI agents",
  "style": "professional",
  "length": 1000,
  "keywords": ["AI", "agents", "automation"]
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "content": "# The Rise of AI Agents\n\n...",
    "wordCount": 987,
    "readingTime": "5 min"
  }
}
```

---

### Settings

#### Get Settings

Retrieve current provider and system settings.

```http
GET /api/settings
```

**Response:**

```json
{
  "activeProvider": "openai",
  "providers": {
    "openai": {
      "enabled": true,
      "defaultModel": "gpt-4o",
      "availableModels": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
    },
    "ollama": {
      "enabled": false,
      "baseUrl": "http://localhost:11434",
      "defaultModel": "llama3.2"
    }
  },
  "maxIterations": 15,
  "defaultTemperature": 0.7,
  "timeout": 60000
}
```

---

#### Update Settings

Update provider and system settings.

```http
POST /api/settings
```

**Request Body:**

```json
{
  "activeProvider": "ollama",
  "providers": {
    "ollama": {
      "enabled": true,
      "baseUrl": "http://localhost:11434",
      "defaultModel": "llama3.2"
    }
  },
  "defaultTemperature": 0.5
}
```

**Response:**

```json
{
  "success": true,
  "settings": {
    "activeProvider": "ollama",
    ...
  }
}
```

---

### Health Check

#### API Health

Check if the API is running.

```http
GET /api
```

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is missing required fields",
    "details": {
      "field": "message",
      "reason": "required"
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Malformed or missing request data |
| `PROVIDER_ERROR` | AI provider returned an error |
| `TIMEOUT` | Request exceeded timeout limit |
| `RATE_LIMIT` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |

---

## Rate Limiting

Default rate limits per endpoint:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/agents/*` | 60 requests | 1 minute |
| `/api/settings` | 100 requests | 1 minute |

---

## Examples

### cURL

```bash
# Execute a task
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze the sentiment of this text: I love this product!",
    "context": {}
  }'

# Get settings
curl http://localhost:3000/api/settings

# Update settings
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "activeProvider": "ollama"
  }'
```

### JavaScript/TypeScript

```typescript
// Execute a task
const response = await fetch('/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Summarize this article',
    context: { article: '...' }
  })
});

const result = await response.json();
console.log(result);

// Get settings
const settings = await fetch('/api/settings').then(r => r.json());
console.log(settings);
```

### Python

```python
import requests

# Execute a task
response = requests.post(
    'http://localhost:3000/api/agents',
    json={
        'message': 'Translate this to Spanish',
        'context': {'text': 'Hello, world!'}
    }
)
result = response.json()
print(result)

# Get settings
settings = requests.get('http://localhost:3000/api/settings').json()
print(settings)
```

---

## WebSocket Support (Future)

WebSocket support for real-time agent execution is planned for a future release. This will enable:

- Real-time task progress updates
- Streaming responses
- Bidirectional communication

---

## OpenAPI Specification

A full OpenAPI 3.0 specification will be available at `/api/docs` in a future release.

---

## Versioning

The API uses URL path versioning. Current version is v1 (implicit in paths). Future versions will be prefixed:

- Current: `/api/agents`
- Future: `/api/v2/agents`

---

## Support

For API-related issues:
1. Check this documentation
2. Review error responses carefully
3. Open an issue on GitHub with:
   - Request/response details
   - Error messages
   - Steps to reproduce
