/**
 * knowledgeBase.js
 * Static RAG knowledge base for financial best practices.
 * Each entry has an id, tags for retrieval matching, and content for the agent prompt.
 */

const KB = [
  {
    id: 'kb-burn-rate-high',
    tags: ['burn', 'burn_rate', 'runway', 'cash'],
    content: `High burn rate management: Industry benchmark for early-stage SaaS is 15-20% of ARR per month in net burn. If burn exceeds this, the primary lever is payroll (typically 60-70% of opex). Freeze non-essential hires, renegotiate SaaS subscriptions, and push AP terms to Net-60. Target: reduce burn by 20-30% within 90 days without touching R&D headcount.`,
  },
  {
    id: 'kb-runway-critical',
    tags: ['runway', 'cash', 'survival'],
    content: `Critical runway (<3 months): Immediate actions — (1) send a bridge funding ask to existing investors within 48 hours, (2) identify your top 3 customers and propose annual prepay in exchange for a 10-15% discount, (3) cut all discretionary spend immediately (travel, events, software trials). Historical data: 78% of startups that hit <3 months runway without taking action fold within 6 months.`,
  },
  {
    id: 'kb-gross-margin-low',
    tags: ['gross_margin', 'cogs', 'margin', 'profitability'],
    content: `Low gross margin benchmarks by sector: SaaS software should target 70-80% GM; marketplace/transactional 40-60%; hardware 30-50%; services 20-40%. If below benchmark, investigate COGS line items: hosting/infra costs (migrate to reserved instances — avg 30% savings), third-party API costs (negotiate volume pricing), and support costs (improve self-serve to reduce tickets per customer).`,
  },
  {
    id: 'kb-revenue-decline',
    tags: ['revenue', 'churn', 'decline', 'growth'],
    content: `Revenue decline response: A 2+ month decline signals either churn acceleration or acquisition slowdown. Calculate net revenue retention (NRR) — healthy SaaS is >100%. Immediate actions: (1) churn analysis — which customer segments are leaving and why, (2) upsell motion — existing customers are 5x cheaper to expand than new acquisition, (3) pricing audit — if you haven't raised prices in 12+ months, you likely can by 10-15% with minimal churn impact.`,
  },
  {
    id: 'kb-revenue-volatility',
    tags: ['revenue', 'volatility', 'predictability'],
    content: `High revenue volatility: Coefficient of variation >0.4 indicates unpredictable revenue. Fix: shift customers from monthly to annual billing (offer 1-2 months free), implement usage-based floors in contracts, diversify customer concentration (top customer should be <20% of revenue). Predictable revenue commands a 2-3x higher valuation multiple.`,
  },
  {
    id: 'kb-burn-growth',
    tags: ['burn', 'burn_rate', 'growth', 'efficiency'],
    content: `Burn growing faster than revenue: The Burn Multiple (net burn / net new ARR) should be below 1.5x for Series A readiness. If burn is growing >30% MoM, you are destroying capital efficiency. Audit the last 90 days of opex for recurring charges that have crept up. Top culprits: unmanaged cloud costs (enable cost alerts), marketing spend without attribution, and headcount added ahead of revenue milestones.`,
  },
  {
    id: 'kb-cash-optimization',
    tags: ['cash', 'working_capital', 'ar', 'ap'],
    content: `Working capital optimization: Improve Days Sales Outstanding (DSO) by switching to automated invoicing with net-15 terms and 1.5% late fees. Extend Days Payable Outstanding (DPO) by negotiating Net-45 to Net-60 with suppliers. A 15-day improvement in both DSO and DPO can free 2-4 weeks of operating cash. Consider invoice factoring for immediate cash (cost: 1-3% of invoice value).`,
  },
  {
    id: 'kb-fundraising-signals',
    tags: ['fundraising', 'investors', 'runway', 'bridge'],
    content: `Fundraising timing: Start fundraising at 9-12 months of runway — never below 6. With <6 months runway, valuation is compressed 30-50% due to distress signal. If below 6 months: prioritize a small bridge ($250k-$1M) from existing investors over a full round, as this buys time without dilution pressure. Document your path to profitability — investors want to see a credible 18-month plan to break-even.`,
  },
]

/**
 * Retrieve the most relevant KB chunks for a given set of problem tags.
 * Simple tag-intersection scoring — no vector DB needed for this scale.
 *
 * @param {string[]} problemTags - Tags from Agent 1's problem analysis
 * @param {number} topK - Max chunks to return
 * @returns {{ id: string, content: string }[]}
 */
function retrieveChunks(problemTags, topK = 3) {
  const normalised = problemTags.map(t => t.toLowerCase())

  const scored = KB.map(entry => {
    const hits = entry.tags.filter(tag => normalised.includes(tag)).length
    return { ...entry, score: hits }
  })

  return scored
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ id, content }) => ({ id, content }))
}

/**
 * Return all KB entries (used for display in the reasoning chain).
 */
function getAllChunkIds() {
  return KB.map(e => e.id)
}

module.exports = { retrieveChunks, getAllChunkIds }
