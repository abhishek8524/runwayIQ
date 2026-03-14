const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Simple linear regression forecast.
 * Uses the last 6 months of snapshot revenue to project forward.
 */
async function getLinearForecast(businessId, months = 3) {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { businessId },
    orderBy: { month: 'asc' },
    take: 6,
  })

  if (snapshots.length === 0) return []

  const n = snapshots.length
  const xs = snapshots.map((_, i) => i)
  const ys = snapshots.map(s => s.revenue)

  const { slope, intercept } = linearRegression(xs, ys)

  // Volatility for confidence bands
  const revenueVol = snapshots[snapshots.length - 1].revenueVol || 0.1
  const lastRevenue = ys[ys.length - 1]
  const bandWidth = lastRevenue * revenueVol

  const forecast = []
  const lastMonth = snapshots[snapshots.length - 1].month

  for (let i = 1; i <= months; i++) {
    const projected = intercept + slope * (n - 1 + i)
    const month = new Date(lastMonth)
    month.setMonth(month.getMonth() + i)

    forecast.push({
      month: month.toISOString(),
      revenue: Math.max(0, Math.round(projected)),
      low: Math.max(0, Math.round(projected - bandWidth)),
      high: Math.round(projected + bandWidth),
    })
  }

  return forecast
}

function linearRegression(xs, ys) {
  const n = xs.length
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

module.exports = { getLinearForecast }
