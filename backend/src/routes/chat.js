const prisma = require('../lib/prisma')
const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')

const { requireAuth } = require('../middleware/auth')
const metricsService = require('../services/metricsService')
const forecastService = require('../services/forecastService')
const riskService = require('../services/riskService')

const router = express.Router()

const client = new Anthropic()
const MODEL = 'claude-sonnet-4-20250514'

/**
 * POST /api/chat
 *
 * Ask Your CFO — conversational AI grounded in live financial data.
 *
 * Body:
 *   message            string    required  — user's question
 *   conversationHistory array    optional  — previous turns [{ role, content }]
 *   saveHistory        boolean   optional  — persist messages to DB (default true)
 *
 * Returns:
 *   { reply: string, conversationHistory: [...] }
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { message, conversationHistory = [], saveHistory = true } = req.body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required' })
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'message too long (max 2000 characters)' })
    }

    const businessId = req.businessId

    // Build live financial context
    const business = await prisma.business.findUnique({ where: { id: businessId } })
    const [snapshot, risk, forecast] = await Promise.all([
      metricsService.getSnapshotHistory(businessId),
      riskService.getRiskScore(businessId),
      forecastService.getLinearForecast(businessId, 3),
    ])

    const financialContext = buildContext(business, snapshot, risk, forecast)

    // Build message history for Claude
    const history = conversationHistory.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content),
    }))

    history.push({ role: 'user', content: message.trim() })

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: `You are a virtual CFO assistant for a small business. You have access to the business's live financial data and answer questions concisely and specifically.

Always ground your answers in the numbers provided. When making recommendations, reference the specific figures (e.g. "your current burn rate of $X" not just "your burn rate"). Keep responses under 4 sentences unless a detailed breakdown is genuinely necessary.

CURRENT FINANCIAL DATA:
${financialContext}`,
      messages: history,
    })

    const reply = response.content[0].text.trim()

    // Persist to DB if requested
    if (saveHistory) {
      await prisma.chatMessage.createMany({
        data: [
          { businessId, role: 'user', content: message.trim() },
          { businessId, role: 'assistant', content: reply },
        ],
      })
    }

    res.json({
      reply,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message.trim() },
        { role: 'assistant', content: reply },
      ],
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/chat/history
 * Returns the last 50 chat messages for the business.
 */
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { businessId: req.businessId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

function buildContext(business, snapshots, risk, forecast) {
  const latest = snapshots[snapshots.length - 1] || {}
  const prev = snapshots[snapshots.length - 2] || null
  const revenueChange = prev && prev.revenue
    ? (((latest.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
    : 'N/A'

  return `
Business: ${business.name} | Cash on hand: $${(business.cashOnHand / 100).toLocaleString()}
Revenue: $${(latest.revenue / 100).toLocaleString()}/mo (${revenueChange}% MoM)
Gross Margin: ${latest.grossMargin?.toFixed(1)}% | COGS: $${(latest.cogs / 100).toLocaleString()}
OpEx: $${(latest.opex / 100).toLocaleString()}/mo | Net Burn: $${(latest.netBurn / 100).toLocaleString()}/mo
Burn Rate (3mo avg): $${(latest.burnRate / 100).toLocaleString()}/mo | Runway: ${latest.runway?.toFixed(1)} months
Risk Score: ${risk.score}/100 (${risk.label}) | Top driver: ${risk.drivers[0]?.name || 'N/A'}
Forecast: ${forecast.map(f => `${new Date(f.month).toLocaleString('default', { month: 'short' })}: $${(f.revenue / 100).toLocaleString()}`).join(', ')}
  `.trim()
}

module.exports = router
