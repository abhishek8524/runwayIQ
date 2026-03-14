# RunwayIQ — Backend

Node.js + Express + Supabase (PostgreSQL) + Prisma ORM + Claude API

---

## What it does

Accepts a CSV of business transactions, computes financial metrics, runs a 3-agent Claude pipeline to identify problems and generate grounded solutions, and returns a structured CFO report.

---

## Project structure

```
backend/
├── src/
│   ├── index.js                     # Express app entry point
│   ├── routes/
│   │   ├── transactions.js          # CSV upload + transaction list
│   │   ├── metrics.js               # Monthly snapshot history
│   │   ├── forecast.js              # 3-month revenue forecast
│   │   ├── risk.js                  # Risk score + drivers
│   │   └── report.js                # AI report generation + retrieval
│   ├── services/
│   │   ├── aiService.js             # 3-agent Claude pipeline (core)
│   │   ├── knowledgeBase.js         # RAG knowledge base
│   │   ├── metricsService.js        # Snapshot computation
│   │   ├── forecastService.js       # Linear regression forecast
│   │   ├── riskService.js           # Rule-based risk scoring
│   │   └── csvParser.js             # CSV ingestion
│   └── middleware/
│       └── errorHandler.js
├── prisma/
│   └── schema.prisma                # DB schema
├── seed/
│   └── seed.js                      # Demo data (6 months, Demo SaaS Co)
├── uploads/                         # Temp CSV storage (gitignored)
├── .env.example
└── package.json
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
BUSINESS_ID=demo-biz-001
```

### 3. Push schema to Supabase
```bash
npx prisma db push
```

### 4. Seed demo data
```bash
node seed/seed.js
```

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/transactions/upload` | Upload a CSV file of transactions |
| `GET` | `/api/transactions` | List recent transactions |
| `GET` | `/api/metrics` | Monthly snapshot history + latest |
| `GET` | `/api/forecast` | 3-month revenue forecast |
| `GET` | `/api/risk` | Risk score + named drivers |
| `POST` | `/api/report/generate` | Run 3-agent pipeline, save + return report |
| `GET` | `/api/report/latest` | Retrieve most recent report |
| `GET` | `/health` | Health check |

### CSV upload format

`POST /api/transactions/upload` — `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `file` | CSV | Required. Max 10 MB. |
| `businessId` | string | Optional. Falls back to `BUSINESS_ID` env var. |

Expected CSV columns (case-insensitive):

```
date, amount, direction, category, description, merchant_name
```

- `direction`: `inflow` or `outflow`
- `category`: `revenue`, `cogs`, `payroll`, `marketing`, etc.
- `amount`: decimal dollars (stored internally as cents)

---

## 3-Agent Claude pipeline

`POST /api/report/generate` triggers three sequential Claude calls using `claude-sonnet-4-20250514`.

### Agent 1 — Problem Identifier
Reads the full financial context (metrics, risk score, forecast) and outputs a structured list of up to 4 problems with severity (`critical` / `high` / `medium`) and retrieval tags.

### Agent 2 — Solution Generator (RAG-grounded)
Uses Agent 1's tags to retrieve relevant chunks from the knowledge base, then generates one grounded solution per problem with a quantified estimated impact and timeframe.

### Agent 3 — CFO Report Writer
Synthesises the problems and solutions into a 2–3 sentence executive summary and 3 prioritised action items written as direct commands.

### Response shape

```json
{
  "id": "uuid",
  "businessId": "...",
  "reportText": "Executive summary...",
  "riskScore": 55,
  "riskLabel": "high",
  "riskDrivers": [{ "name": "Low runway (<6 months)", "points": 25 }],
  "actions": ["Freeze non-essential hires...", "..."],
  "problems": [
    {
      "title": "Declining Revenue",
      "severity": "high",
      "detail": "Revenue fell 17% over 2 months...",
      "tags": ["revenue", "decline"]
    }
  ],
  "solutions": [
    {
      "problem": "Declining Revenue",
      "action": "Launch annual prepay offer...",
      "estimatedImpact": "+2.3 months runway",
      "timeframe": "30 days",
      "kbSource": "kb-revenue-decline"
    }
  ],
  "agentTimings": {
    "agent1Ms": 1200,
    "agent2Ms": 1800,
    "agent3Ms": 1500,
    "totalMs": 4500
  },
  "kbChunksRetrieved": ["kb-revenue-decline", "kb-burn-rate-high"]
}
```

---

## RAG knowledge base

`knowledgeBase.js` contains 8 static financial best-practice chunks covering:

| Chunk ID | Topic |
|----------|-------|
| `kb-burn-rate-high` | High burn rate — payroll levers, 90-day targets |
| `kb-runway-critical` | Critical runway (<3 months) — bridge funding, prepay deals |
| `kb-gross-margin-low` | Low gross margin — infra optimisation, support cost reduction |
| `kb-revenue-decline` | Revenue decline — churn analysis, upsell motion, pricing |
| `kb-revenue-volatility` | High revenue volatility — annual billing, customer concentration |
| `kb-burn-growth` | Burn growing faster than revenue — Burn Multiple, opex audit |
| `kb-cash-optimization` | Working capital — DSO/DPO improvement, invoice factoring |
| `kb-fundraising-signals` | Fundraising timing — when to raise, bridge strategy |

Retrieval is tag-intersection scoring — no vector DB needed at this scale.

---

## Database schema

### `AIReport` (key columns)

| Column | Type | Description |
|--------|------|-------------|
| `reportText` | String | Agent 3 executive summary |
| `riskScore` | Int | 0–100 |
| `riskLabel` | String | `low` / `medium` / `high` / `critical` |
| `riskDrivers` | Json | Named risk factors with point values |
| `actions` | Json | 3 prioritised action strings |
| `problems` | Json | Agent 1 output — problem list with severity + tags |
| `solutions` | Json | Agent 2 output — grounded solutions with impact |

`problems` and `solutions` store the full agent reasoning chain so judges and users can inspect how the final report was produced.
