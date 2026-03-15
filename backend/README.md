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

Single copy-paste command:
```bash
npm install express prisma @prisma/client @anthropic-ai/sdk @supabase/supabase-js multer csv-parse cors dotenv helmet express-rate-limit zod && npm install --save-dev nodemon
```

Or just:
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

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` — found in your Supabase project under **Settings → API**. The anon key is safe to use server-side.
- `FRONTEND_ORIGIN` — restricts CORS to your frontend URL. Set to your Vercel/Netlify URL in production.
- `DEMO_USER_ID` — used by the seed script. Replace with a real Supabase user UUID after creating a test account.

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
| `GET` | `/api/transactions` | ✓ | 200/15min | List recent transactions (last 200) |
| `GET` | `/api/metrics` | ✓ | 200/15min | Monthly snapshot history + latest |
| `GET` | `/api/forecast` | ✓ | 200/15min | Revenue forecast |
| `GET` | `/api/risk` | ✓ | 200/15min | Risk score + named drivers |
| `POST` | `/api/report/generate` | ✓ | **5/hr/user** | Run 3-agent pipeline, save + return report |
| `GET` | `/api/report/latest` | ✓ | 200/15min | Retrieve most recent report |
| `GET` | `/health` | — | — | Health check |

> **Out of scope for v1:** `/api/chat` (conversational follow-up) and `/api/whatif` (scenario modelling) are planned features not yet implemented.

### `GET /api/forecast` — query params

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `months` | integer | No | `3` | Number of months to forecast. Min 1, max 24. |

### `GET /api/metrics` — no query params

Returns `{ history: MonthlySnapshot[], latest: MonthlySnapshot }`. No params needed — business is resolved from JWT.

### `GET /api/risk` — no query params

Returns `{ score: number, label: string, drivers: { name, points }[] }`. No params needed.

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

**What it does:** Reads the full financial context (metrics, risk score, forecast) and outputs a structured list of up to 4 problems with severity and retrieval tags.

**System prompt (abridged):**
```
You are a financial analyst. Identify the top financial problems for this business.
Output ONLY valid JSON.

Schema: { "problems": [{ "title", "severity": "critical"|"high"|"medium", "detail", "tags": [] }] }

Rules:
- Maximum 4 problems
- Severity "critical" only if runway < 3 months OR risk score >= 70
- tags must come from: burn, burn_rate, runway, cash, gross_margin, cogs, revenue,
  churn, decline, growth, volatility, predictability, efficiency, working_capital,
  fundraising, survival
- Use exact dollar amounts and percentages from the data
```

### Agent 2 — Solution Generator (RAG-grounded)

**What it does:** Uses Agent 1's tags to retrieve the top 3 matching KB chunks, then generates one grounded solution per problem with a quantified estimated impact and timeframe.

**System prompt (abridged):**
```
You are a CFO advisor. Given financial problems and best-practice knowledge, generate grounded solutions.
Output ONLY valid JSON.

Schema: { "solutions": [{ "problem", "action", "estimatedImpact", "timeframe": "immediate"|"30 days"|"90 days", "kbSource" }], "kbChunksUsed": [] }

Rules:
- One solution per problem
- estimatedImpact MUST include a number derived from the financial data
- kbSource must be a chunk ID from the knowledge base, or null
```

### Agent 3 — CFO Report Writer

**What it does:** Synthesises the problems and solutions into a 2–3 sentence executive summary and 3 prioritised action items written as direct commands.

**System prompt (abridged):**
```
You are a CFO writing a concise report for a small business owner.
You have pre-analysed problems and solutions. Synthesise them into a final report.
Output ONLY valid JSON.

Schema: { "reportText": "2-3 sentence executive summary", "actions": ["action 1", "action 2", "action 3"] }

Rules:
- reportText must reference the risk score, runway, and at least one dollar amount
- actions start with a verb and include a metric
```

### Response shape

```json
{
  "id": "uuid",
  "businessId": "...",
  "reportText": "Executive summary...",
  "riskScore": 55,
  "riskLabel": "high",
  "riskDrivers": [{ "name": "Low runway (<6 months)", "points": 25 }],
  "actions": ["Freeze non-essential hires immediately...", "..."],
  "problems": [
    {
      "title": "Declining Revenue",
      "severity": "high",
      "detail": "Revenue fell 17% over 2 months from $120k to $89k.",
      "tags": ["revenue", "decline"]
    }
  ],
  "solutions": [
    {
      "problem": "Declining Revenue",
      "action": "Launch annual prepay offer at 10% discount to existing customers",
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

`knowledgeBase.js` contains 8 static financial best-practice chunks. Agent 2 retrieves the top 3 by tag-intersection scoring — no vector DB needed at this scale.

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

**Sample chunk content (`kb-runway-critical`):**
> Critical runway (<3 months): Immediate actions — (1) send a bridge funding ask to existing investors within 48 hours, (2) identify your top 3 customers and propose annual prepay in exchange for a 10-15% discount, (3) cut all discretionary spend immediately (travel, events, software trials). Historical data: 78% of startups that hit <3 months runway without taking action fold within 6 months.

**Sample chunk content (`kb-burn-rate-high`):**
> High burn rate management: Industry benchmark for early-stage SaaS is 15-20% of ARR per month in net burn. If burn exceeds this, the primary lever is payroll (typically 60-70% of opex). Freeze non-essential hires, renegotiate SaaS subscriptions, and push AP terms to Net-60. Target: reduce burn by 20-30% within 90 days without touching R&D headcount.

**Sample chunk content (`kb-revenue-decline`):**
> Revenue decline response: A 2+ month decline signals either churn acceleration or acquisition slowdown. Calculate net revenue retention (NRR) — healthy SaaS is >100%. Immediate actions: (1) churn analysis — which customer segments are leaving and why, (2) upsell motion — existing customers are 5x cheaper to expand than new acquisition, (3) pricing audit — if you haven't raised prices in 12+ months, you likely can by 10-15% with minimal churn impact.

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

### `Business`

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | UUID primary key |
| `userId` | String | Supabase auth user ID — `@unique`, anchor for tenant isolation |
| `name` | String | Business name |
| `cashOnHand` | Int | Current cash in cents |

### `Transaction`

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | UUID primary key |
| `businessId` | String | FK → Business |
| `date` | DateTime | Transaction date |
| `amount` | Int | Amount in cents |
| `direction` | String | `inflow` or `outflow` |
| `category` | String | e.g. `revenue`, `cogs`, `payroll` |
| `description` | String? | Optional free text |
| `merchantName` | String? | Optional merchant |
| `source` | String | `csv` or `seed` |

### `MonthlySnapshot`

Computed monthly from transactions by `metricsService.js`. Written once per month per business, recomputed on every CSV upload.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | UUID primary key |
| `businessId` | String | FK → Business |
| `month` | DateTime | First day of the month |
| `revenue` | Int | Total inflow (non-COGS) in cents |
| `cogs` | Int | Cost of goods sold in cents |
| `opex` | Int | Total outflow (non-COGS) in cents |
| `grossProfit` | Int | `revenue - cogs` in cents |
| `grossMargin` | Float | `grossProfit / revenue * 100` |
| `netBurn` | Int | `opex + cogs - revenue` in cents |
| `burnRate` | Float | 3-month rolling average burn in cents/mo |
| `runway` | Float | `cashOnHand / burnRate` in months |
| `revenueVol` | Float | Revenue coefficient of variation (trailing 3mo) |
| `expenseVol` | Float | Expense coefficient of variation (trailing 3mo) |

### `AIReport`

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | UUID primary key |
| `businessId` | String | FK → Business |
| `reportText` | String | Agent 3 executive summary |
| `riskScore` | Int | 0–100 |
| `riskLabel` | String | `low` / `medium` / `high` / `critical` |
| `riskDrivers` | Json | Named risk factors with point values |
| `actions` | Json | 3 prioritised action strings |
| `problems` | Json | Agent 1 output — problem list with severity + tags |
| `solutions` | Json | Agent 2 output — grounded solutions with impact |

`problems` and `solutions` store the full agent reasoning chain so the frontend can render it visually and judges can inspect how the final report was produced.
