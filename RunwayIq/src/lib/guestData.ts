// ─── Guest mode flag ─────────────────────────────────────────────────────────
// Module-level flag shared between AuthContext (writer) and api.ts (reader).
// Resets on page refresh, which is intentional — guests are session-only.

let _active = false

export const guestMode = {
  isActive: () => _active,
  enable:   () => { _active = true },
  disable:  () => { _active = false },
}

// ─── Static demo data ─────────────────────────────────────────────────────────
// All values mirror the exact shapes returned by the real API.
// Amounts follow the same unit convention as the backend (integer, same scale
// as the seed script — e.g. 120000 = $120,000 in display).

export const guestBusiness = {
  id: 'guest-biz-001',
  name: 'Demo Company',
  cashOnHand: 150000,
  createdAt: '2024-01-01T00:00:00.000Z',
}

// ── Transactions ──────────────────────────────────────────────────────────────

export const guestTransactions = [
  { id: 'gt-01', date: '2024-01-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 120000, direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-02', date: '2024-01-12T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 30000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-03', date: '2024-01-15T00:00:00.000Z', description: 'Salaries',             category: 'payroll',   amount: 55000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-04', date: '2024-01-20T00:00:00.000Z', description: 'Ad spend',             category: 'marketing', amount: 8000,   direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-05', date: '2024-02-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 115000, direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-06', date: '2024-02-10T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 32000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-07', date: '2024-02-15T00:00:00.000Z', description: 'Salaries',             category: 'payroll',   amount: 55000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-08', date: '2024-02-22T00:00:00.000Z', description: 'Ad spend',             category: 'marketing', amount: 9000,   direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-09', date: '2024-03-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 98000,  direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-10', date: '2024-03-10T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 34000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-11', date: '2024-03-15T00:00:00.000Z', description: 'Salaries + new hire', category: 'payroll',   amount: 60000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-12', date: '2024-03-25T00:00:00.000Z', description: 'Ad spend',             category: 'marketing', amount: 12000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-13', date: '2024-04-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 89000,  direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-14', date: '2024-04-10T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 34000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-15', date: '2024-04-15T00:00:00.000Z', description: 'Salaries',             category: 'payroll',   amount: 60000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-16', date: '2024-05-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 93000,  direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-17', date: '2024-05-10T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 35000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-18', date: '2024-05-15T00:00:00.000Z', description: 'Salaries',             category: 'payroll',   amount: 60000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-19', date: '2024-06-05T00:00:00.000Z', description: 'SaaS subscriptions',  category: 'revenue',   amount: 101000, direction: 'inflow'  as const, source: 'demo' },
  { id: 'gt-20', date: '2024-06-10T00:00:00.000Z', description: 'Hosting & infra',      category: 'cogs',      amount: 35000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-21', date: '2024-06-15T00:00:00.000Z', description: 'Salaries',             category: 'payroll',   amount: 62000,  direction: 'outflow' as const, source: 'demo' },
  { id: 'gt-22', date: '2024-06-20T00:00:00.000Z', description: 'Ad spend',             category: 'marketing', amount: 8000,   direction: 'outflow' as const, source: 'demo' },
]

// ── Monthly snapshots ─────────────────────────────────────────────────────────
// Narrative: healthy → revenue dip in Q1 → burn starts Mar/Apr → recovery Jun

const snapshots = [
  {
    id: 'gs-01',
    month:        '2024-01-01T00:00:00.000Z',
    revenue:      120000,
    cogs:         30000,
    opex:         63000,
    grossProfit:  90000,
    grossMargin:  75.0,
    netBurn:      -27000,   // profitable
    burnRate:     -27000,
    runway:       999,
    revenueVol:   0.05,
    expenseVol:   0.04,
  },
  {
    id: 'gs-02',
    month:        '2024-02-01T00:00:00.000Z',
    revenue:      115000,
    cogs:         32000,
    opex:         64000,
    grossProfit:  83000,
    grossMargin:  72.2,
    netBurn:      -19000,
    burnRate:     -23000,
    runway:       999,
    revenueVol:   0.06,
    expenseVol:   0.04,
  },
  {
    id: 'gs-03',
    month:        '2024-03-01T00:00:00.000Z',
    revenue:      98000,
    cogs:         34000,
    opex:         72000,
    grossProfit:  64000,
    grossMargin:  65.3,
    netBurn:      8000,    // tipped into burn
    burnRate:     -12667,
    runway:       50,
    revenueVol:   0.10,
    expenseVol:   0.08,
  },
  {
    id: 'gs-04',
    month:        '2024-04-01T00:00:00.000Z',
    revenue:      89000,
    cogs:         34000,
    opex:         70000,
    grossProfit:  55000,
    grossMargin:  61.8,
    netBurn:      15000,
    burnRate:     1333,
    runway:       18,
    revenueVol:   0.13,
    expenseVol:   0.09,
  },
  {
    id: 'gs-05',
    month:        '2024-05-01T00:00:00.000Z',
    revenue:      93000,
    cogs:         35000,
    opex:         69000,
    grossProfit:  58000,
    grossMargin:  62.4,
    netBurn:      11000,
    burnRate:     11333,
    runway:       13,
    revenueVol:   0.11,
    expenseVol:   0.08,
  },
  {
    id: 'gs-06',
    month:        '2024-06-01T00:00:00.000Z',
    revenue:      101000,
    cogs:         35000,
    opex:         70000,
    grossProfit:  66000,
    grossMargin:  65.3,
    netBurn:      4000,    // burn shrinking — recovering
    burnRate:     10000,
    runway:       15,
    revenueVol:   0.09,
    expenseVol:   0.07,
  },
]

export const guestMetrics = {
  history: snapshots,
  latest:  snapshots[5],
  momDeltas: {
    revenue:     8.6,    // +8.6% Jun vs May
    netBurn:     -63.6,  // burn dropped 63.6%
    grossMargin: 2.9,    // +2.9 pp
    opex:        1.4,    // +1.4%
    runway:      15.4,   // +15.4%
  },
}

// ── Risk ──────────────────────────────────────────────────────────────────────

export const guestRisk = {
  score: 42,
  label: 'medium' as const,
  drivers: [
    { name: 'Revenue decline (Jan–Apr)',  points: 18 },
    { name: 'Rising opex',                points: 12 },
    { name: 'Runway below 18 months',     points: 8  },
    { name: 'Elevated revenue volatility', points: 4  },
  ],
}

// ── Report ────────────────────────────────────────────────────────────────────

export const guestReport = {
  id: 'gr-001',
  reportText: `Demo Company entered a burn phase in March 2024 after revenue declined 18% from its January peak while headcount costs rose with a new hire. April represented the highest monthly burn at $15,000, compressing runway to 18 months. The good news: June shows early signs of recovery — revenue rebounded 13.5% from April's trough, and monthly burn fell to $4,000. If the June trajectory holds, the company could return to breakeven within two months. The primary near-term risk is opex rigidity: payroll at $62,000/month leaves limited flex if revenue softens again. Recommended action: lock in two anchor customer contracts to reduce revenue volatility, and defer any additional headcount until runway exceeds 24 months.`,
  riskScore: 42,
  riskLabel: 'medium',
  riskDrivers: [
    { name: 'Revenue decline (Jan–Apr)',  points: 18 },
    { name: 'Rising opex',                points: 12 },
    { name: 'Runway below 18 months',     points: 8  },
    { name: 'Elevated revenue volatility', points: 4  },
  ],
  actions: [
    'Close 2 anchor contracts in the next 30 days to stabilise revenue.',
    'Freeze discretionary opex (marketing, tooling) until runway > 24 months.',
    'Review hosting costs — $35k/month cogs may have optimisation headroom.',
    'Establish a 3-month cash reserve target of $45,000.',
  ],
  problems: [
    {
      title:    'Revenue concentration risk',
      severity: 'high' as const,
      detail:   'Revenue fell 26% over four months, suggesting dependence on a small customer cohort.',
      tags:     ['revenue', 'churn'],
    },
    {
      title:    'Opex inflexibility',
      severity: 'medium' as const,
      detail:   'Payroll jumped 9% in March and has not corrected, leaving limited downside buffer.',
      tags:     ['opex', 'payroll'],
    },
    {
      title:    'Runway below comfort threshold',
      severity: 'medium' as const,
      detail:   'At current burn, runway is 15 months — below the 18-month target for fundraising optionality.',
      tags:     ['runway', 'burn'],
    },
  ],
  solutions: [
    {
      problem:          'Revenue concentration risk',
      action:           'Implement multi-tier pricing and target mid-market accounts to diversify.',
      estimatedImpact:  '+$12,000/month revenue within 60 days',
      timeframe:        '30–60 days',
      kbSource:         null,
    },
    {
      problem:          'Opex inflexibility',
      action:           'Negotiate contractor arrangements for next hires rather than FTE.',
      estimatedImpact:  'Reduces fixed opex risk by ~20%',
      timeframe:        'Next hire cycle',
      kbSource:         null,
    },
    {
      problem:          'Runway below comfort threshold',
      action:           'Cut marketing spend 30% and redirect budget to sales-assisted motions.',
      estimatedImpact:  '+2 months runway',
      timeframe:        'Immediate',
      kbSource:         null,
    },
  ],
  createdAt: '2024-06-30T12:00:00.000Z',
}

// ── Forecast ──────────────────────────────────────────────────────────────────

export const guestForecast = [
  {
    month:          '2024-07-01T00:00:00.000Z',
    revenue:        106000,
    low:            95000,
    high:           117000,
    cashOutRisk:    false,
    projectedCash:  161000,
  },
  {
    month:          '2024-08-01T00:00:00.000Z',
    revenue:        110000,
    low:            97000,
    high:           123000,
    cashOutRisk:    false,
    projectedCash:  171000,
  },
  {
    month:          '2024-09-01T00:00:00.000Z',
    revenue:        113000,
    low:            99000,
    high:           127000,
    cashOutRisk:    false,
    projectedCash:  180000,
  },
]

// ── Simulate ──────────────────────────────────────────────────────────────────
// Represents a 15% opex cut scenario applied to the Jun 2024 baseline.

export const guestSimulate = {
  current: {
    revenue:     101000,
    opex:        70000,
    netBurn:     4000,
    burnRate:    10000,
    runway:      15,
    grossMargin: 65.3,
    riskScore:   42,
  },
  simulated: {
    revenue:     101000,
    opex:        59500,    // 15% cut
    netBurn:     -6500,    // back to profitable
    burnRate:    4833,
    runway:      31,
    grossMargin: 65.3,
    riskScore:   28,
  },
  delta: {
    runwayMonths:       16,
    burnReduction:      10500,
    cashSavedPerMonth:  10500,
    riskScoreChange:    -14,
  },
}
