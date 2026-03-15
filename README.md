# RunwayIQ

**AI-powered financial co-pilot for startups.**  
Upload your transactions, get your runway, and let three specialized AI agents tell you exactly what to do next.

---

## What it does

RunwayIQ connects to your transaction data, computes real-time financial metrics, and runs an autonomous multi-agent AI pipeline to surface problems, generate grounded recommendations, and produce a full CFO-grade report — all in seconds.

| Feature | Description |
|---|---|
| **Live KPI Dashboard** | Revenue, burn rate, runway, gross margin with 6-month sparklines |
| **CSV Upload** | Drop in any transaction export — auto-parses, validates, and refreshes all metrics |
| **Risk Engine** | Rule-based risk score (0–100) with named drivers and severity levels |
| **3-Month Forecast** | Revenue projections with confidence bands and cash-out risk flags |
| **What-If Simulator** | Drag sliders to model OPEX cuts and revenue targets — runway updates instantly |
| **AI Agent Pipeline** | 3 chained Claude agents: Analyst → Strategist (RAG-grounded) → CFO Writer |
| **PDF Report** | Download a full multi-page styled CFO report with charts, tables, and executive summary |
| **Ask Your CFO** | Chat interface backed by Claude — answers questions using your live financial data |

---

## Tech Stack

### Frontend
- **React 18** + **Vite 6** + **TypeScript**
- **Tailwind CSS 4**
- **React Router 7**
- **Supabase JS** (auth)
- **jsPDF** + **jspdf-autotable** (PDF generation)

### Backend
- **Node.js** + **Express**
- **Prisma ORM** + **Supabase (PostgreSQL)**
- **Anthropic Claude** (`claude-opus-4-5`) — 3-agent pipeline
- **Multer** (CSV upload), **Zod** (validation)
- **Helmet** + **express-rate-limit** (security)

---

## AI Agent Pipeline

```
┌──────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Agent 1     │────▶│  Agent 2             │────▶│  Agent 3     │
│  Analyst     │     │  Strategist          │     │  CFO Writer  │
│              │     │  (RAG-grounded)      │     │              │
│ Detects      │     │ Retrieves relevant   │     │ Writes the   │
│ financial    │     │ KB chunks, generates │     │ executive    │
│ problems +   │     │ action plans with    │     │ narrative +  │
│ severity     │     │ estimated impact     │     │ 3 actions    │
└──────────────┘     └──────────────────────┘     └──────────────┘
```

The knowledge base contains 8 domain-specific playbooks covering: burn rate management, critical runway, gross margin benchmarks, revenue recovery, volatility, burn efficiency, cash flow optimization, and fundraising timing.

---

## Project Structure

```
RUNWAYIQ/
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── routes/           # API route handlers
│   │   │   ├── businesses.js
│   │   │   ├── transactions.js
│   │   │   ├── metrics.js
│   │   │   ├── forecast.js
│   │   │   ├── risk.js
│   │   │   ├── report.js
│   │   │   ├── simulate.js
│   │   │   └── chat.js
│   │   ├── services/         # Business logic
│   │   │   ├── aiService.js        # 3-agent Claude pipeline
│   │   │   ├── metricsService.js   # Snapshot computation
│   │   │   ├── riskService.js      # Rule-based risk scoring
│   │   │   ├── forecastService.js  # 3-month projections
│   │   │   ├── csvParser.js        # CSV ingestion + validation
│   │   │   └── knowledgeBase.js    # Static RAG knowledge base
│   │   ├── middleware/
│   │   │   ├── auth.js             # Supabase JWT verification
│   │   │   ├── validate.js         # Zod schemas
│   │   │   └── errorHandler.js
│   │   └── lib/
│   │       └── prisma.js           # PrismaClient singleton
│   ├── seed/
│   │   └── seed.js           # Demo data seeder
│   └── package.json
│
├── RunwayIq/                 # React frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── screens/      # Page components
│   │   │   │   ├── Dashboard.tsx     # Main dashboard
│   │   │   │   ├── Transactions.tsx  # Transaction explorer
│   │   │   │   ├── Forecast.tsx      # 3-month forecast
│   │   │   │   ├── WhatIf.tsx        # Scenario simulator
│   │   │   │   ├── Chat.tsx          # CFO chat interface
│   │   │   │   ├── Landing.tsx       # Public landing page
│   │   │   │   └── Login.tsx         # Auth screen
│   │   │   ├── components/   # Shared UI components
│   │   │   └── routes.tsx    # React Router config
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Supabase auth state
│   │   └── lib/
│   │       ├── api.ts                # Typed API client
│   │       ├── supabase.ts           # Supabase client init
│   │       ├── format.ts             # Number/currency helpers
│   │       └── generatePDF.ts        # jsPDF report generator
│   └── package.json
│
└── Datasets/                 # Sample CSV files for testing
    ├── dataset1_northstack_healthy.csv
    ├── dataset2_vaultly_struggling.csv
    ├── dataset3_fendly_recovering.csv
    ├── dataset4_tradeloop_volatile.csv
    └── dataset5_paysift_critical.csv
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key

### 1. Clone the repo

```bash
git clone https://github.com/abhishek8524/runwayIQ.git
cd runwayIQ
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=your_supabase_postgres_connection_string
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Push the database schema:

```bash
npx prisma db push
```

(Optional) Seed demo data:

```bash
node seed/seed.js
```

Start the backend:

```bash
npm run dev
# Running on http://localhost:3000
```

### 3. Set up the frontend

```bash
cd RunwayIq
npm install
```

Create `RunwayIq/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# Leave VITE_API_BASE_URL empty for local dev (uses Vite proxy)
# Set to your deployed backend URL in production:
# VITE_API_BASE_URL=https://your-backend.onrender.com
```

Start the frontend:

```bash
npm run dev
# Running on http://localhost:5173
```

---

## CSV Format

Upload any CSV with these columns:

| Column | Required | Example |
|---|---|---|
| `date` | ✅ | `2024-01-15` |
| `description` | ✅ | `AWS Invoice` |
| `amount` | ✅ | `4200.00` |
| `direction` | ✅ | `inflow` or `outflow` |
| `category` | ✅ | `revenue`, `opex`, `cogs`, `payroll` |

Sample datasets are in the `/Datasets` folder to get started immediately.

---

## API Reference

All endpoints require a `Authorization: Bearer <supabase_jwt>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/metrics` | Financial snapshots + MoM deltas |
| `GET` | `/api/risk` | Risk score + named drivers |
| `GET` | `/api/forecast?months=3` | Revenue projections |
| `GET` | `/api/transactions` | All transactions |
| `POST` | `/api/transactions/upload` | Upload CSV (`multipart/form-data`) |
| `GET` | `/api/businesses` | Current business profile |
| `PATCH` | `/api/businesses/current` | Update cash on hand / name |
| `POST` | `/api/simulate` | What-if scenario calculation |
| `POST` | `/api/report/generate` | Run AI agent pipeline |
| `GET` | `/api/report/latest` | Fetch last generated report |
| `POST` | `/api/chat` | Send message to CFO agent |
| `GET` | `/health` | Health check |

---

## Deployment

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npm start` |
| Environment | Add all vars from `.env` |

### Frontend → Netlify

| Setting | Value |
|---|---|
| Base Directory | `RunwayIq` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `RunwayIq/dist` |
| `VITE_API_BASE_URL` | Your Render backend URL |

> After Netlify deploys, go back to Render and set `FRONTEND_ORIGIN` to your Netlify URL.

---

## Environment Variables Reference

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `FRONTEND_ORIGIN` | Comma-separated allowed frontend URLs |
| `PORT` | Server port (default: `3000`) |
| `NODE_ENV` | `development` or `production` |

### Frontend

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_BASE_URL` | Backend URL (empty = use Vite proxy for local dev) |

---

## License

MIT

---

<div align="center">
  Built with Claude · Supabase · React · Prisma
</div>
