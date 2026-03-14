const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /api/simulate
 *
 * What-If Simulator — in-memory only, no DB writes.
 *
 * Body:
 *   opexCutPercent  number  0-100  — how much to cut operating expenses by
 *   revenueTarget   number         — target monthly revenue in dollars (optional)
 *
 * Returns:
 *   current   — baseline metrics from latest snapshot
 *   simulated — adjusted metrics after applying the what-if
 *   delta     — difference between simulated and current
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { opexCutPercent = 0, revenueTarget } = req.body

    // Validate inputs
    const cut = Math.max(0, Math.min(100, Number(opexCutPercent) || 0))
    const targetRevenue = revenueTarget
      ? Math.max(0, Math.round(Number(revenueTarget) * 100)) // convert to cents
      : null

    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: { cashOnHand: true },
    })

    const snapshot = await prisma.monthlySnapshot.findFirst({
      where: { businessId: req.businessId },
      orderBy: { month: 'desc' },
    })

    if (!snapshot) {
      return res.status(404).json({ error: 'No snapshot data found. Upload a CSV first.' })
    }

    // ── Baseline ──────────────────────────────────────────────────
    const baseRevenue = snapshot.revenue
    const baseCogs = snapshot.cogs
    const baseOpex = snapshot.opex
    const baseGrossProfit = baseRevenue - baseCogs
    const baseGrossMargin = baseRevenue > 0 ? (baseGrossProfit / baseRevenue) * 100 : 0
    const baseNetBurn = baseOpex + baseCogs - baseRevenue
    const baseBurnRate = snapshot.burnRate
    const baseRunway = baseBurnRate > 0 ? business.cashOnHand / baseBurnRate : 999

    // ── Simulated ─────────────────────────────────────────────────
    const simOpex = Math.round(baseOpex * (1 - cut / 100))
    const simRevenue = targetRevenue !== null ? targetRevenue : baseRevenue
    const simGrossProfit = simRevenue - baseCogs
    const simGrossMargin = simRevenue > 0 ? (simGrossProfit / simRevenue) * 100 : 0
    const simNetBurn = simOpex + baseCogs - simRevenue
    // Simulated burn rate: blend current month with new netBurn
    const simBurnRate = simNetBurn > 0 ? simNetBurn : 0
    const simRunway = simBurnRate > 0 ? business.cashOnHand / simBurnRate : 999

    // ── Risk score (simplified re-run of riskService rules) ───────
    const simRiskScore = computeSimRisk(simRunway, simNetBurn, simGrossMargin, snapshot.revenueVol)

    // ── Cash saved per month ──────────────────────────────────────
    const cashSavedPerMonth = baseOpex - simOpex + (simRevenue - baseRevenue)

    res.json({
      current: {
        revenue: baseRevenue,
        opex: baseOpex,
        netBurn: baseNetBurn,
        burnRate: baseBurnRate,
        runway: parseFloat(baseRunway.toFixed(1)),
        grossMargin: parseFloat(baseGrossMargin.toFixed(1)),
        riskScore: snapshot.revenueVol !== undefined
          ? computeSimRisk(baseRunway, baseNetBurn, baseGrossMargin, snapshot.revenueVol)
          : null,
      },
      simulated: {
        revenue: simRevenue,
        opex: simOpex,
        netBurn: simNetBurn,
        burnRate: simBurnRate,
        runway: parseFloat(simRunway.toFixed(1)),
        grossMargin: parseFloat(simGrossMargin.toFixed(1)),
        riskScore: simRiskScore,
      },
      delta: {
        runwayMonths: parseFloat((simRunway - baseRunway).toFixed(1)),
        burnReduction: baseNetBurn - simNetBurn,
        cashSavedPerMonth,
        riskScoreChange: simRiskScore - computeSimRisk(baseRunway, baseNetBurn, baseGrossMargin, snapshot.revenueVol),
      },
    })
  } catch (err) {
    next(err)
  }
})

function computeSimRisk(runway, netBurn, grossMargin, revenueVol) {
  let score = 0
  if (runway < 3) score += 40
  else if (runway < 6) score += 25
  else if (runway < 12) score += 10
  if (netBurn > 0) score += 15
  if (grossMargin < 20) score += 15
  else if (grossMargin < 40) score += 8
  if (revenueVol > 0.5) score += 15
  else if (revenueVol > 0.3) score += 8
  return Math.min(100, score)
}

module.exports = router
