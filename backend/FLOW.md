# RunwayIQ — App Flow

How data moves through the system from CSV upload to AI report.

---

## End-to-end overview

```
User uploads CSV
      ↓
POST /api/transactions/upload
      ↓
csvParser.js — validate + parse rows
      ↓
Prisma — insert into Transaction table
      ↓
metricsService.js — compute MonthlySnapshot per month
      ↓
Frontend requests dashboard data
  ├── GET /api/metrics    → snapshot history
  ├── GET /api/forecast   → 3-month linear regression
  └── GET /api/risk       → rule-based risk score
      ↓
User triggers report generation
      ↓
POST /api/report/generate
      ↓
aiService.js — 3-agent Claude pipeline
  ├── Agent 1 → identify problems
  ├── Agent 2 → RAG retrieval + solutions
  └── Agent 3 → write CFO report
      ↓
Prisma — save AIReport to DB
      ↓
Response sent to frontend
```

---

## Step 1 — CSV Upload

**Endpoint:** `POST /api/transactions/upload`

1. Multer receives the file (max 10 MB)
2. `csvParser.js` streams the file row by row
   - Normalises column names to lowercase/underscore
   - Validates every row against a Zod schema (date format, amount bounds, category whitelist)
   - Stops at 5,000 rows
   - Deletes the temp file after parsing regardless of success or failure
3. Valid rows are bulk-inserted into the `Transaction` table via Prisma
4. `metricsService.computeAndStoreSnapshots()` is called immediately to rebuild monthly snapshots

---

## Step 2 — Metrics Computation

**Service:** `metricsService.js`

Runs automatically after every CSV upload. Groups transactions by month and computes:

| Metric | How it's calculated |
|--------|---------------------|
| `revenue` | Sum of `inflow` transactions where category ≠ `cogs` |
| `cogs` | Sum of transactions where category = `cogs` |
| `opex` | Sum of all `outflow` transactions where category ≠ `cogs` |
| `grossProfit` | `revenue - cogs` |
| `grossMargin` | `grossProfit / revenue × 100` |
| `netBurn` | `opex + cogs - revenue` |
| `burnRate` | 3-month rolling average of `netBurn` |
| `runway` | `business.cashOnHand / burnRate` |
| `revenueVol` | Coefficient of variation of revenue over trailing 3 months |
| `expenseVol` | Coefficient of variation of expenses over trailing 3 months |

Each month's snapshot is upserted into `MonthlySnapshot`.

---

## Step 3 — Dashboard Queries

Three independent endpoints the frontend calls in parallel:

### `GET /api/metrics`
Returns the full `MonthlySnapshot` history array + the latest snapshot. Used to render KPI cards and the revenue chart.

### `GET /api/forecast`
**Service:** `forecastService.js`

Takes the last 6 months of revenue snapshots, runs a linear regression, and projects forward N months (default 3). Returns:
```json
[
  { "month": "2024-07-01T00:00:00.000Z", "revenue": 105000, "low": 90000, "high": 120000 }
]
```
The `low`/`high` band width is derived from the latest `revenueVol` — more volatile history = wider band.

### `GET /api/risk`
**Service:** `riskService.js`

Rule-based scoring (0–100) against the latest snapshot:

| Rule | Points |
|------|--------|
| Runway < 3 months | +40 |
| Runway 3–6 months | +25 |
| Runway 6–12 months | +10 |
| Positive net burn | +15 |
| Gross margin < 20% | +15 |
| Gross margin 20–40% | +8 |
| Revenue volatility (CV) > 0.5 | +15 |
| Revenue volatility (CV) > 0.3 | +8 |
| Expense volatility (CV) > 0.4 | +10 |

Score is capped at 100. Label: `low` (<20), `medium` (20–39), `high` (40–69), `critical` (≥70).

---

## Step 4 — 3-Agent Claude Pipeline

**Endpoint:** `POST /api/report/generate`
**Service:** `aiService.js`
**Model:** `claude-sonnet-4-20250514`

The three agents run sequentially — each one feeds into the next.

### Agent 1 — Problem Identifier

**Input:** Full financial context string (business name, cash, all snapshot metrics, risk score + drivers, 3-month forecast)

**Output:**
```json
{
  "problems": [
    {
      "title": "Declining Revenue",
      "severity": "high",
      "detail": "Revenue fell 17% over 2 months from $120k to $89k.",
      "tags": ["revenue", "decline"]
    }
  ]
}
```

Severity is `critical` only if runway < 3 months or risk score ≥ 70.

---

### Agent 2 — Solution Generator (RAG)

**Input:** Financial context + Agent 1's problems + retrieved KB chunks

**RAG retrieval:** Agent 1's tags are passed to `knowledgeBase.retrieveChunks()`. This scores every KB entry by tag-intersection count and returns the top 3 matches. Example: tags `["revenue", "decline"]` matches `kb-revenue-decline` (score 2) over `kb-burn-rate-high` (score 0).

**Output:**
```json
{
  "solutions": [
    {
      "problem": "Declining Revenue",
      "action": "Launch annual prepay offer at 10% discount to existing customers",
      "estimatedImpact": "+2.3 months runway",
      "timeframe": "30 days",
      "kbSource": "kb-revenue-decline"
    }
  ],
  "kbChunksUsed": ["kb-revenue-decline"]
}
```

`estimatedImpact` must include a number derived from the actual financial data — the agent is prompted to calculate, not guess.

---

### Agent 3 — CFO Report Writer

**Input:** Financial context + Agent 1's problems + Agent 2's solutions

**Output:**
```json
{
  "reportText": "Your business carries a high risk score of 55/100 with 4.2 months of runway remaining at the current $27k/mo burn rate. Revenue has declined 17% over two months, and gross margin has compressed to 31%.",
  "actions": [
    "Freeze all non-essential hires and renegotiate SaaS subscriptions to reduce burn by $8k/mo within 30 days",
    "Launch annual prepay offer at 10% discount to existing customers to pull forward 2+ months of runway",
    "Conduct a churn analysis on the last 60 days of lost accounts and present findings to the team within 1 week"
  ]
}
```

---

### What gets saved

All agent outputs are persisted in a single `AIReport` row:

| Field | Source |
|-------|--------|
| `reportText` | Agent 3 |
| `riskScore`, `riskLabel`, `riskDrivers` | `riskService` (computed before agents run) |
| `actions` | Agent 3 |
| `problems` | Agent 1 |
| `solutions` | Agent 2 |

The response also includes `agentTimings` (ms per agent) and `kbChunksRetrieved` (which KB chunks were pulled) — these are returned to the frontend but not stored in DB.

---

## Data flow diagram (simplified)

```
Transaction (raw)
      │
      ▼
MonthlySnapshot (computed)
      │
      ├──────────────────────────────────────┐
      ▼                                      ▼
forecastService              riskService
(linear regression)          (rule scoring)
      │                                      │
      └──────────────┬───────────────────────┘
                     ▼
              aiService (context string)
                     │
              ┌──────▼──────┐
              │   Agent 1   │  identifies problems
              └──────┬──────┘
                     │ problems + tags
              ┌──────▼──────┐
              │ knowledgeBase│  RAG retrieval by tags
              └──────┬──────┘
                     │ kb chunks
              ┌──────▼──────┐
              │   Agent 2   │  generates solutions
              └──────┬──────┘
                     │ solutions
              ┌──────▼──────┐
              │   Agent 3   │  writes CFO report
              └──────┬──────┘
                     │
              AIReport (saved to DB)
```
