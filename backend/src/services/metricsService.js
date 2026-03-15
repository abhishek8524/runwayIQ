const prisma = require('../lib/prisma')



/**
 * Compute monthly snapshots from raw transactions and upsert into MonthlySnapshot.
 */
async function computeAndStoreSnapshots(businessId) {
  const transactions = await prisma.transaction.findMany({
    where: { businessId },
    orderBy: { date: 'asc' },
  })

  // Group by YYYY-MM
  const byMonth = {}
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(tx)
  }

  const sortedKeys = Object.keys(byMonth).sort()

  // Build snapshots
  const snapshots = sortedKeys.map(key => {
    const txs = byMonth[key]
    const revenue = txs
      .filter(t => t.direction === 'inflow' && t.category !== 'cogs')
      .reduce((s, t) => s + t.amount, 0)
    const cogs = txs
      .filter(t => t.category === 'cogs')
      .reduce((s, t) => s + t.amount, 0)
    const opex = txs
      .filter(t => t.direction === 'outflow' && t.category !== 'cogs')
      .reduce((s, t) => s + t.amount, 0)
    const grossProfit = revenue - cogs
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
    const netBurn = opex + cogs - revenue

    return { key, revenue, cogs, opex, grossProfit, grossMargin, netBurn }
  })

  // 3-month rolling burn rate (total spend = opex + cogs, always positive)
  const withBurnRate = snapshots.map((s, i) => {
    const window = snapshots.slice(Math.max(0, i - 2), i + 1)
    const burnRate = window.reduce((sum, w) => sum + w.opex + w.cogs, 0) / window.length
    return { ...s, burnRate }
  })

  // Volatility (coefficient of variation over trailing 3 months)
  const withVol = withBurnRate.map((s, i) => {
    const window = withBurnRate.slice(Math.max(0, i - 2), i + 1)
    const revVals = window.map(w => w.revenue)
    const expVals = window.map(w => w.opex + w.cogs)
    return {
      ...s,
      revenueVol: coefficientOfVariation(revVals),
      expenseVol: coefficientOfVariation(expVals),
    }
  })

  // Compute trailing burn rate from last 6 months that have expenses
  const monthsWithBurn = withVol.filter(s => (s.opex + s.cogs) > 0)
  const trailingBurn = monthsWithBurn.length > 0
    ? monthsWithBurn.slice(-6).reduce((sum, s) => sum + s.opex + s.cogs, 0) / Math.min(6, monthsWithBurn.length)
    : 0

  // Upsert snapshots
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  for (const s of withVol) {
    const effectiveBurn = s.burnRate > 0 ? s.burnRate : trailingBurn
    const runway = effectiveBurn > 0
      ? (business.cashOnHand / effectiveBurn)
      : 0

    await prisma.monthlySnapshot.upsert({
      where: {
        // compound unique not defined in schema; use findFirst + create pattern
        id: (await prisma.monthlySnapshot.findFirst({
          where: { businessId, month: new Date(`${s.key}-01`) },
          select: { id: true },
        }))?.id || 'new',
      },
      update: {
        revenue: s.revenue, cogs: s.cogs, opex: s.opex,
        grossProfit: s.grossProfit, grossMargin: s.grossMargin,
        netBurn: s.netBurn, burnRate: effectiveBurn, runway,
        revenueVol: s.revenueVol, expenseVol: s.expenseVol,
        computedAt: new Date(),
      },
      create: {
        businessId,
        month: new Date(`${s.key}-01`),
        revenue: s.revenue, cogs: s.cogs, opex: s.opex,
        grossProfit: s.grossProfit, grossMargin: s.grossMargin,
        netBurn: s.netBurn, burnRate: effectiveBurn, runway,
        revenueVol: s.revenueVol, expenseVol: s.expenseVol,
      },
    })
  }

  return getSnapshotHistory(businessId)
}

async function getSnapshotHistory(businessId) {
  return prisma.monthlySnapshot.findMany({
    where: { businessId },
    orderBy: { month: 'asc' },
  })
}

async function getLatestSnapshot(businessId) {
  return prisma.monthlySnapshot.findFirst({
    where: { businessId },
    orderBy: { month: 'desc' },
  })
}

function coefficientOfVariation(values) {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance) / Math.abs(mean)
}

/**
 * Compute MoM percentage deltas for revenue, netBurn, and grossMargin.
 * Returns the latest snapshot enriched with momDeltas.
 */
async function getMomDeltas(businessId) {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { businessId },
    orderBy: { month: 'desc' },
    take: 2,
  })

  if (snapshots.length < 2) return null

  const [latest, prev] = snapshots

  function pctChange(curr, prior) {
    if (!prior || prior === 0) return null
    return parseFloat(((curr - prior) / Math.abs(prior) * 100).toFixed(1))
  }

  return {
    revenue: pctChange(latest.revenue, prev.revenue),
    netBurn: pctChange(latest.netBurn, prev.netBurn),
    grossMargin: pctChange(latest.grossMargin, prev.grossMargin),
    opex: pctChange(latest.opex, prev.opex),
    runway: pctChange(latest.runway, prev.runway),
  }
}

module.exports = { computeAndStoreSnapshots, getSnapshotHistory, getLatestSnapshot, getMomDeltas }
