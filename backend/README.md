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
│   ├── index.js                     # Express app entry point (helmet, cors, rate limit)
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
│   │   └── csvParser.js             # CSV ingestion + validation
│   └── middleware/
│       ├── auth.js                  # Supabase JWT verification + tenant isolation
│       ├── validate.js              # Zod schemas + validator factory
│       └── errorHandler.js          # Sanitized error responses
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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
BUSINESS_ID=demo-biz-001
DEMO_USER_ID=00000000-0000-0000-0000-000000000001
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are found in your Supabase project under **Settings → API**. The anon key is safe to use server-side.

`FRONTEND_ORIGIN` restricts CORS to your frontend URL. Set to your Vercel/Netlify URL in production.

`DEMO_USER_ID` is used by the seed script — replace with a real Supabase user UUID after creating a test account.

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

## Authentication

Every endpoint (except `/health`) requires a valid Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

The token is verified server-side via `supabase.auth.getUser()`. The `businessId` is then resolved from the token — clients never pass it directly. This enforces strict multi-tenant isolation: users can only access their own business's data.

The frontend should attach the token automatically using an Axios interceptor:

```js
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

---

## API endpoints

All protected routes return `401` if no token is provided and `403` if the token is valid but no business account exists for that user.

| Method | Path | Auth | Rate limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/api/transactions/upload` | ✓ | 200/15min | Upload a CSV file of transactions |
| `GET` | `/api/transactions` | ✓ | 200/15min | List recent transactions |
| `GET` | `/api/metrics` | ✓ | 200/15min | Monthly snapshot history + latest |
| `GET` | `/api/forecast` | ✓ | 200/15min | 3-month revenue forecast |
| `GET` | `/api/risk` | ✓ | 200/15min | Risk score + named drivers |
| `POST` | `/api/report/generate` | ✓ | **5/hr/user** | Run 3-agent pipeline, save + return report |
| `GET` | `/api/report/latest` | ✓ | 200/15min | Retrieve most recent report |
| `GET` | `/health` | — | — | Health check |

### CSV upload format

`POST /api/transactions/upload` — `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `file` | CSV | Required. Max 10 MB, max 5,000 rows. |

Expected CSV columns (case-insensitive):

```
date, amount, direction, category, description, merchant_name
```

- `direction`: `inflow` or `outflow`
- `category`: must be one of `revenue`, `cogs`, `payroll`, `rent`, `utilities`, `marketing`, `software`, `travel`, `tax`, `refund`, `transfer`, `uncategorised`
- `amount`: decimal dollars between -$10M and $10M (stored internally as cents)
- Invalid rows return `422` with per-row error details so you can fix and re-upload

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

## Security model

| Layer | Implementation |
|-------|---------------|
| Authentication | Supabase JWT verified server-side on every request |
| Tenant isolation | `businessId` derived from JWT — never from client body/query |
| Security headers | `helmet()` — sets CSP, X-Frame-Options, X-Content-Type-Options, etc. |
| CORS | Restricted to `FRONTEND_ORIGIN` env var only |
| Rate limiting | 200 req/15min global; 5 req/hr per user on report generation |
| Input validation | Zod schemas on all inputs; `months` param bounded 1–24 |
| CSV validation | Max 5,000 rows; date, amount bounds, category whitelist per row |
| File handling | Temp CSV deleted immediately after parsing (success or failure) |
| Error responses | 5xx returns generic message in production; full detail in dev only |
| Audit logging | Structured JSON log on every authenticated request (userId, path, IP, ts) |

---

## Database schema

### `Business` (key columns)

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | UUID primary key |
| `userId` | String | Supabase auth user ID — `@unique`, anchor for tenant isolation |
| `name` | String | Business name |
| `cashOnHand` | Int | Current cash in cents |

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

`problems` and `solutions` store the full agent reasoning chain so the frontend can render it visually and judges can inspect how the final report was produced.
