const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Rule-based risk scoring (0–100).
 * Higher = riskier.
 */
async function getRiskScore(businessId) {
  const snapshot = await prisma.monthlySnapshot.findFirst({
    where: { businessId },
    orderBy: { month: 'desc' },
  })

  if (!snapshot) return { score: 0, label: 'unknown', drivers: [] }

  const drivers = []
  let score = 0

  // Runway risk
  if (snapshot.runway < 3) {
    score += 40
    drivers.push({ name: 'Critical runway (<3 months)', points: 40 })
  } else if (snapshot.runway < 6) {
    score += 25
    drivers.push({ name: 'Low runway (<6 months)', points: 25 })
  } else if (snapshot.runway < 12) {
    score += 10
    drivers.push({ name: 'Moderate runway (<12 months)', points: 10 })
  }

  // Burn trend
  if (snapshot.netBurn > 0) {
    score += 15
    drivers.push({ name: 'Positive net burn (spending > revenue)', points: 15 })
  }

  // Gross margin
  if (snapshot.grossMargin < 20) {
    score += 15
    drivers.push({ name: 'Low gross margin (<20%)', points: 15 })
  } else if (snapshot.grossMargin < 40) {
    score += 8
    drivers.push({ name: 'Below-average gross margin (<40%)', points: 8 })
  }

  // Revenue volatility
  if (snapshot.revenueVol > 0.5) {
    score += 15
    drivers.push({ name: 'High revenue volatility (CV >0.5)', points: 15 })
  } else if (snapshot.revenueVol > 0.3) {
    score += 8
    drivers.push({ name: 'Moderate revenue volatility (CV >0.3)', points: 8 })
  }

  // Expense volatility
  if (snapshot.expenseVol > 0.4) {
    score += 10
    drivers.push({ name: 'High expense volatility (CV >0.4)', points: 10 })
  }

  score = Math.min(100, score)

  let label = 'low'
  if (score >= 70) label = 'critical'
  else if (score >= 40) label = 'high'
  else if (score >= 20) label = 'medium'

  return { score, label, drivers }
}

module.exports = { getRiskScore }
