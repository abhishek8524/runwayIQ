import { supabase } from './supabase'
import {
  guestMode,
  guestBusiness,
  guestTransactions,
  guestMetrics,
  guestRisk,
  guestReport,
  guestForecast,
  guestSimulate,
} from './guestData'

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
    get: (): Promise<MetricsResponse> => {
      if (guestMode.isActive()) return Promise.resolve(guestMetrics)
      return get<MetricsResponse>('/metrics')
    },
  },
  risk: {
    get: (): Promise<RiskResponse> => {
      if (guestMode.isActive()) return Promise.resolve(guestRisk)
      return get<RiskResponse>('/risk')
    },
  },
  forecast: {
    get: (months = 3): Promise<ForecastMonth[]> => {
      if (guestMode.isActive()) return Promise.resolve(guestForecast.slice(0, months))
      return get<ForecastMonth[]>(`/forecast?months=${months}`)
    },
  },
  transactions: {
    getAll: (): Promise<Transaction[]> => {
      if (guestMode.isActive()) return Promise.resolve(guestTransactions)
      return get<Transaction[]>('/transactions')
    },
    upload: async (file: File): Promise<{ imported: number; snapshots: number }> => {
      if (guestMode.isActive()) {
        throw new Error('Guest mode — sign up for a free account to upload your own data.')
      }
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
    get: (): Promise<Business[]> => {
      if (guestMode.isActive()) return Promise.resolve([guestBusiness])
      return get<Business[]>('/businesses')
    },
    update: (data: { name?: string; cashOnHand?: number }): Promise<Business> => {
      if (guestMode.isActive()) return Promise.resolve({ ...guestBusiness, ...data })
      return request<Business>('/businesses/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    },
  },
  simulate: {
    run: (params: SimulateParams): Promise<SimulateResponse> => {
      if (guestMode.isActive()) {
        // Scale the static result based on the requested opex cut vs the demo 15%
        const factor = params.opexCutPercent / 15
        return Promise.resolve({
          ...guestSimulate,
          delta: {
            runwayMonths:      Math.round(guestSimulate.delta.runwayMonths * factor),
            burnReduction:     Math.round(guestSimulate.delta.burnReduction * factor),
            cashSavedPerMonth: Math.round(guestSimulate.delta.cashSavedPerMonth * factor),
            riskScoreChange:   Math.round(guestSimulate.delta.riskScoreChange * factor),
          },
        })
      }
      return post<SimulateResponse>('/simulate', params)
    },
  },
  chat: {
    send: (message: string, history: ChatMessage[]): Promise<ChatResponse> => {
      if (guestMode.isActive()) {
        return Promise.resolve({
          reply: 'CFO Chat is available to registered users. Sign up for free to ask unlimited questions about your finances.',
          conversationHistory: [
            ...history,
            { role: 'user' as const, content: message },
            { role: 'assistant' as const, content: 'CFO Chat is available to registered users. Sign up for free to ask unlimited questions about your finances.' },
          ],
        })
      }
      return post<ChatResponse>('/chat', { message, conversationHistory: history })
    },
    history: (): Promise<ChatMessage[]> => {
      if (guestMode.isActive()) return Promise.resolve([])
      return get<ChatMessage[]>('/chat/history')
    },
  },
  report: {
    latest: (): Promise<Report> => {
      if (guestMode.isActive()) return Promise.resolve(guestReport)
      return get<Report>('/report/latest')
    },
    generate: (): Promise<Report> => {
      if (guestMode.isActive()) return Promise.resolve(guestReport)
      return post<Report>('/report/generate', {})
    },
  },
}
