const prisma = require('../lib/prisma')
const Anthropic = require('@anthropic-ai/sdk')

const { retrieveChunks } = require('./knowledgeBase')
const metricsService = require('./metricsService')
const forecastService = require('./forecastService')
const riskService = require('./riskService')


const client = new Anthropic()
const MODEL = 'claude-opus-4-5'

// Strip markdown code fences that Claude sometimes adds despite instructions
function parseClaudeJSON(text) {
  const clean = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(clean)
}

// ---------------------------------------------------------------------------
// Shared financial context builder
// ---------------------------------------------------------------------------

function buildFinancialContext(business, snapshot, risk, forecast) {
  const latest = snapshot[snapshot.length - 1] || {}
  const prev = snapshot[snapshot.length - 2] || null

  const revenueChange = prev && prev.revenue
    ? (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
    : 'N/A'
  const burnChange = prev && prev.netBurn
    ? (((latest.netBurn - prev.netBurn) / Math.abs(prev.netBurn)) * 100).toFixed(1)
    : 'N/A'

  return `
BUSINESS: ${business.name}
Cash on hand: $${(business.cashOnHand / 100).toLocaleString()}

LATEST MONTHLY SNAPSHOT:
- Revenue:       $${(latest.revenue / 100).toLocaleString()} (${revenueChange}% MoM)
- COGS:          $${(latest.cogs / 100).toLocaleString()}
- OpEx:          $${(latest.opex / 100).toLocaleString()}
- Gross Profit:  $${(latest.grossProfit / 100).toLocaleString()}
- Gross Margin:  ${latest.grossMargin?.toFixed(1)}%
- Net Burn:      $${(latest.netBurn / 100).toLocaleString()} (${burnChange}% MoM)
- Burn Rate:     $${(latest.burnRate / 100).toLocaleString()}/mo (3-mo avg)
- Runway:        ${latest.runway?.toFixed(1)} months
- Revenue Vol:   ${latest.revenueVol?.toFixed(2)} (coefficient of variation)
- Expense Vol:   ${latest.expenseVol?.toFixed(2)}

RISK SCORE: ${risk.score}/100 (${risk.label.toUpperCase()})
Risk drivers:
${risk.drivers.map(d => `  - ${d.name}: +${d.points} pts`).join('\n')}

3-MONTH FORECAST:
${forecast.map(f => `  ${new Date(f.month).toLocaleString('default', { month: 'short', year: 'numeric' })}: revenue $${(f.revenue / 100).toLocaleString()} [low $${(f.low / 100).toLocaleString()} – high $${(f.high / 100).toLocaleString()}]`).join('\n')}
`.trim()
}

// ---------------------------------------------------------------------------
// Agent 1 — Problem Identifier
// ---------------------------------------------------------------------------

async function runAgent1(financialContext) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You are a financial analyst. Identify the top financial problems for this business.

Output ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "problems": [
    {
      "title": "short problem name",
      "severity": "critical" | "high" | "medium",
      "detail": "1-2 sentences with specific numbers from the data",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Maximum 4 problems
- Severity "critical" only if runway < 3 months OR risk score >= 70
- tags must come from: burn, burn_rate, runway, cash, gross_margin, cogs, margin, profitability, revenue, churn, decline, growth, volatility, predictability, burn_growth, efficiency, working_capital, fundraising, investors, survival
- Use exact dollar amounts and percentages from the data`,
    messages: [{ role: 'user', content: financialContext }],
  })

  return parseClaudeJSON(response.content[0].text)
}

// ---------------------------------------------------------------------------
// Agent 2 — Solution Generator (RAG-grounded)
// ---------------------------------------------------------------------------

async function runAgent2(financialContext, problems) {
  const allTags = problems.flatMap(p => p.tags || [])
  const kbChunks = retrieveChunks(allTags, 3)

  const kbContext = kbChunks.length > 0
    ? `\nKNOWLEDGE BASE:\n${kbChunks.map(c => `[${c.id}]\n${c.content}`).join('\n\n')}`
    : ''

  const problemsText = problems.map((p, i) =>
    `${i + 1}. [${p.severity.toUpperCase()}] ${p.title}: ${p.detail}`
  ).join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 900,
    system: `You are a CFO advisor. Given financial problems and best-practice knowledge, generate grounded solutions.

Output ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "solutions": [
    {
      "problem": "problem title this addresses",
      "action": "SHORT verb-first title, max 6 words, e.g. 'Cut OPEX 20-30% now'",
      "estimatedImpact": "quantified impact under 8 words, e.g. '+1.8 months runway' or '+$40k cash buffer'",
      "timeframe": "immediate" | "30 days" | "90 days",
      "kbSource": "kb chunk id used, or null"
    }
  ],
  "kbChunksUsed": ["id1", "id2"]
}

Rules:
- One solution per problem
- action MUST be a short punchy title — max 6 words, verb first, no full sentences, no periods
- estimatedImpact MUST include a number derived from the financial data, keep it under 8 words
- kbSource must be a chunk ID from the knowledge base, or null`,
    messages: [{
      role: 'user',
      content: `FINANCIAL DATA:\n${financialContext}\n\nPROBLEMS:\n${problemsText}${kbContext}`,
    }],
  })

  const result = parseClaudeJSON(response.content[0].text)
  result.kbChunksRetrieved = kbChunks.map(c => c.id)
  return result
}

// ---------------------------------------------------------------------------
// Agent 3 — CFO Report Writer
// ---------------------------------------------------------------------------

async function runAgent3(financialContext, problems, solutions) {
  const problemsSummary = problems
    .map(p => `[${p.severity}] ${p.title}: ${p.detail}`)
    .join('\n')
  const solutionsSummary = solutions
    .map(s => `${s.problem} → ${s.action} (${s.estimatedImpact})`)
    .join('\n')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: `You are a CFO writing a concise report for a small business owner.
You have pre-analysed problems and solutions. Synthesise them into a final report.

Output ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "reportText": "2-3 sentence executive summary using specific numbers",
  "actions": ["action 1", "action 2", "action 3"]
}

Rules:
- reportText must reference the risk score, runway, and at least one dollar amount
- actions are the 3 highest-priority items rewritten as direct commands
- Each action starts with a verb and includes a metric`,
    messages: [{
      role: 'user',
      content: `FINANCIAL DATA:\n${financialContext}\n\nPROBLEMS:\n${problemsSummary}\n\nSOLUTIONS:\n${solutionsSummary}`,
    }],
  })

  return parseClaudeJSON(response.content[0].text)
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

async function generateReport(businessId) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) throw new Error(`Business ${businessId} not found`)

  const [snapshot, risk, forecast] = await Promise.all([
    metricsService.getSnapshotHistory(businessId),
    riskService.getRiskScore(businessId),
    forecastService.getLinearForecast(businessId, 3),
  ])

  const financialContext = buildFinancialContext(business, snapshot, risk, forecast)

  const agent1Start = Date.now()
  const { problems } = await runAgent1(financialContext)
  const agent1Ms = Date.now() - agent1Start

  const agent2Start = Date.now()
  const { solutions, kbChunksRetrieved } = await runAgent2(financialContext, problems)
  const agent2Ms = Date.now() - agent2Start

  const agent3Start = Date.now()
  const { reportText, actions } = await runAgent3(financialContext, problems, solutions)
  const agent3Ms = Date.now() - agent3Start

  const report = await prisma.aIReport.create({
    data: {
      businessId,
      reportText,
      riskScore: risk.score,
      riskLabel: risk.label,
      riskDrivers: risk.drivers,
      actions,
      problems,
      solutions,
    },
  })

  return {
    ...report,
    agentTimings: { agent1Ms, agent2Ms, agent3Ms, totalMs: agent1Ms + agent2Ms + agent3Ms },
    kbChunksRetrieved,
  }
}

module.exports = { generateReport }
