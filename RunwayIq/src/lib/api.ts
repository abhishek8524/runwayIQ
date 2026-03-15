import { supabase } from './supabase'

// In dev the Vite proxy rewrites /api → http://localhost:3000/api.
// In production set VITE_API_BASE_URL to the deployed backend origin.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api'

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function get<T>(path: string) {
  return request<T>(path)
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface Snapshot {
  id: string
  month: string           // ISO date string
  revenue: number         // cents
  cogs: number            // cents
  opex: number            // cents
  grossProfit: number     // cents
  grossMargin: number     // percent 0-100
  netBurn: number         // cents
  burnRate: number        // cents (3-mo rolling average)
  runway: number          // months
  revenueVol: number
  expenseVol: number
}

export interface MomDeltas {
  revenue: number | null
  netBurn: number | null
  grossMargin: number | null
  opex: number | null
  runway: number | null
}

export interface MetricsResponse {
  history: Snapshot[]
  latest: Snapshot | null
  momDeltas: MomDeltas | null
}

export interface RiskDriver {
  name: string
  points: number
}

export interface RiskResponse {
  score: number
  label: 'low' | 'medium' | 'high' | 'critical' | 'unknown'
  drivers: RiskDriver[]
}

export interface ForecastMonth {
  month: string       // ISO date string
  revenue: number     // cents
  low: number         // cents
  high: number        // cents
  cashOutRisk: boolean
  projectedCash: number // cents
}

export interface Transaction {
  id: string
  date: string        // ISO date string
  description: string
  category: string
  amount: number      // cents
  direction: 'inflow' | 'outflow'
  source: string
}

export interface SimulateParams {
  opexCutPercent: number
  revenueTarget?: number  // dollars
}

export interface SimulateMetrics {
  revenue: number     // cents
  opex: number        // cents
  netBurn: number     // cents
  burnRate: number    // cents
  runway: number      // months
  grossMargin: number // percent
  riskScore: number | null
}

export interface SimulateResponse {
  current: SimulateMetrics
  simulated: SimulateMetrics
  delta: {
    runwayMonths: number
    burnReduction: number   // cents
    cashSavedPerMonth: number // cents
    riskScoreChange: number
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  conversationHistory: ChatMessage[]
}

export interface ReportProblem {
  title: string
  severity: 'critical' | 'high' | 'medium'
  detail: string
  tags: string[]
}

export interface ReportSolution {
  problem: string
  action: string
  estimatedImpact: string
  timeframe: string
  kbSource: string | null
}

export interface Report {
  id: string
  reportText: string
  riskScore: number
  riskLabel: string
  riskDrivers: RiskDriver[]
  actions: string[]
  problems: ReportProblem[]
  solutions: ReportSolution[]
  createdAt: string
  agentTimings?: { agent1Ms: number; agent2Ms: number; agent3Ms: number; totalMs: number }
  kbChunksRetrieved?: string[]
}

export interface Business {
  id: string
  name: string
  cashOnHand: number
  createdAt: string
}

// ─── API methods ──────────────────────────────────────────────────────────────

export const api = {
  metrics: {
    get: () => get<MetricsResponse>('/metrics'),
  },
  risk: {
    get: () => get<RiskResponse>('/risk'),
  },
  forecast: {
    get: (months = 3) => get<ForecastMonth[]>(`/forecast?months=${months}`),
  },
  transactions: {
    getAll: () => get<Transaction[]>('/transactions'),
    upload: async (file: File): Promise<{ imported: number; snapshots: number }> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE}/transactions/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      return res.json()
    },
  },
  businesses: {
    get: () => get<Business[]>('/businesses'),
  },
  simulate: {
    run: (params: SimulateParams) => post<SimulateResponse>('/simulate', params),
  },
  chat: {
    send: (message: string, history: ChatMessage[]) =>
      post<ChatResponse>('/chat', { message, conversationHistory: history }),
    history: () => get<ChatMessage[]>('/chat/history'),
  },
  report: {
    latest: () => get<Report>('/report/latest'),
    generate: () => post<Report>('/report/generate', {}),
  },
}
