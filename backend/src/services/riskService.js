const prisma = require('../lib/prisma')



/**
 * Rule-based risk scoring (0–100).
 * Higher = riskier.
 */
async function getRiskScore(businessId) {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { businessId },
    orderBy: { month: 'desc' },
    take: 4,
  })

  if (!snapshots.length) return { score: 0, label: 'unknown', drivers: [] }

  const snapshot = snapshots[0]
  const drivers = []
  let score = 0

  // Runway risk
  if (snapshot.runway < 3) {
    score += 25
    drivers.push({ name: 'Runway < 3 months', points: 25 })
  } else if (snapshot.runway < 6) {
    score += 15
    drivers.push({ name: 'Runway < 6 months', points: 15 })
  } else if (snapshot.runway < 12) {
    score += 8
    drivers.push({ name: 'Runway < 12 months', points: 8 })
  }

  // Revenue declining for 3+ consecutive months
  if (snapshots.length >= 3) {
    const [s0, s1, s2] = snapshots
    if (s0.revenue < s1.revenue && s1.revenue < s2.revenue) {
      score += 15
      drivers.push({ name: 'Revenue declining 3mo', points: 15 })
    }
  }

  // Burn growing MoM
  if (snapshots.length >= 2 && snapshots[1].burnRate > 0 && snapshots[0].burnRate > 0) {
    const burnGrowthPct = ((snapshots[0].burnRate - snapshots[1].burnRate) / snapshots[1].burnRate) * 100
    if (burnGrowthPct >= 10) {
      score += 10
      drivers.push({ name: `Burn grew ${burnGrowthPct.toFixed(0)}% MoM`, points: 10 })
    }
  }

  // Gross margin
  if (snapshot.grossMargin < 20) {
    score += 15
    drivers.push({ name: 'Margin below 20%', points: 15 })
  } else if (snapshot.grossMargin < 40) {
    score += 10
    drivers.push({ name: 'Margin below 40%', points: 10 })
  }

  // Positive net burn (spending > revenue)
  if (snapshot.netBurn > 0) {
    score += 10
    drivers.push({ name: 'Positive net burn (spending > revenue)', points: 10 })
  }

  // Revenue volatility
  if (snapshot.revenueVol > 0.5) {
    score += 15
    drivers.push({ name: 'High revenue volatility', points: 15 })
  } else if (snapshot.revenueVol > 0.3) {
    score += 8
    drivers.push({ name: 'Moderate revenue volatility', points: 8 })
  }

  score = Math.min(100, score)

  let label = 'low'
  if (score >= 70) label = 'critical'
  else if (score >= 40) label = 'high'
  else if (score >= 20) label = 'medium'

  return { score, label, drivers }
}

module.exports = { getRiskScore }
