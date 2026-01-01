# VGrok Cloud Coding Agent

Production Cloud Coding & Automation Agent mit Supervisor, Runner, V1+V2, UIX.

## Quick Start

```bash
# 1. Infra starten (Redis, Postgres, MinIO)
cd infra
docker compose up -d

# 2. Dependencies installieren
pnpm install

# 3. Apps starten
pnpm -r dev
```

## Endpoints

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001

## API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/health` | GET | Health Check |
| `/api/tasks` | GET | Alle Tasks |
| `/api/tasks` | POST | Neuen Task erstellen |
| `/api/tasks/:id` | GET | Einzelnen Task abrufen |
| `/api/discovery` | GET | Capabilities auflisten |
| `/api/proposals` | GET | Verbesserungsvorschläge |

## Struktur

```
cloud-coding-agent-vgrok/
├── apps/
│   ├── supervisor-api/   # Node.js Express API
│   ├── dashboard/        # Next.js Frontend
│   └── worker/           # Task Worker
├── packages/
│   ├── agent-core/       # Shared agent logic
│   ├── agent-library/    # Agent templates
│   ├── mcp-server/       # MCP Server
│   ├── github/           # GitHub integration
│   ├── storage/          # MinIO storage
│   └── runner/           # Task runner
└── infra/
    └── docker-compose.yml
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **API**: Express.js
- **Frontend**: Next.js + Tailwind CSS
- **Queue**: BullMQ + Redis
- **Database**: PostgreSQL
- **Storage**: MinIO (S3-compatible)
- **AI**: Claude, GPT-4, Grok
