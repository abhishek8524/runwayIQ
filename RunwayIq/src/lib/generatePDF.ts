import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmtMoney, fmtRunway } from './format'
import type { MetricsResponse, RiskResponse, Report, ForecastMonth, Business } from './api'

interface PDFData {
  business: Business | null
  metrics: MetricsResponse | null
  risk: RiskResponse | null
  report: Report
  forecast: ForecastMonth[]
  chartData: { month: string; revenue: number; spend: number }[]
}

type RGB = [number, number, number]

const BRAND: RGB   = [26, 86, 219]
const NAVY: RGB    = [15, 23, 42]
const DARK: RGB    = [30, 41, 59]
const BODY: RGB    = [71, 85, 105]
const MUTED: RGB   = [148, 163, 184]
const LIGHT: RGB   = [241, 245, 249]
const BORDER: RGB  = [226, 232, 240]
const WHITE: RGB   = [255, 255, 255]
const GREEN: RGB   = [16, 185, 129]
const RED: RGB     = [239, 68, 68]
const AMBER: RGB   = [245, 158, 11]
const PURPLE: RGB  = [139, 92, 246]

const KB_LABELS: Record<string, string> = {
  'kb-burn-rate-high':     'Burn rate benchmarks',
  'kb-runway-critical':    'Low runway playbook',
  'kb-gross-margin-low':   'Gross margin benchmarks',
  'kb-revenue-decline':    'Revenue recovery guide',
  'kb-revenue-volatility': 'Revenue predictability guide',
  'kb-burn-growth':        'Burn efficiency playbook',
  'kb-cash-optimization':  'Cash flow optimization',
  'kb-fundraising-signals':'Fundraising timing guide',
}

export function generateCFOReport(data: PDFData) {
  const { business, metrics, risk, report, forecast, chartData } = data
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const ML = 20
  const MR = 20
  const CW = PW - ML - MR

  const latest = metrics?.latest
  const deltas = metrics?.momDeltas
  const bizName = business?.name ?? 'Your Business'
  const reportDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── helpers ────────────────────────────────────────────────────────────────
  function font(size: number, weight: 'normal' | 'bold' = 'normal', color: RGB = NAVY) {
    doc.setFontSize(size); doc.setFont('helvetica', weight); doc.setTextColor(...color)
  }

  function fill(x: number, y: number, w: number, h: number, c: RGB) {
    doc.setFillColor(...c); doc.rect(x, y, w, h, 'F')
  }

  function line(y: number, c: RGB = BORDER) {
    doc.setDrawColor(...c); doc.setLineWidth(0.3); doc.line(ML, y, PW - MR, y)
  }

  function roundedBox(x: number, y: number, w: number, h: number, bg: RGB, borderColor?: RGB) {
    doc.setFillColor(...bg)
    if (borderColor) {
      doc.setDrawColor(...borderColor); doc.setLineWidth(0.4)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')
    } else {
      doc.roundedRect(x, y, w, h, 2, 2, 'F')
    }
  }

  function addFooter() {
    const pageCount = doc.getNumberOfPages()
    for (let p = 2; p <= pageCount; p++) {
      doc.setPage(p)
      line(PH - 14, BORDER)
      font(7, 'normal', MUTED)
      doc.text(`RunwayIQ  ·  AI CFO Report  ·  ${bizName}`, ML, PH - 8)
      doc.text(`${p} / ${pageCount}`, PW - MR, PH - 8, { align: 'right' })
    }
  }

  function pageHeader(title: string, subtitle?: string) {
    fill(0, 0, PW, 1.5, BRAND)
    font(8, 'bold', BRAND)
    doc.text('RUNWAYIQ', ML, 12)
    font(7, 'normal', MUTED)
    doc.text(bizName, PW - MR, 12, { align: 'right' })
    line(16, BORDER)
    font(13, 'bold', NAVY)
    doc.text(title, ML, 26)
    if (subtitle) {
      font(8, 'normal', MUTED)
      doc.text(subtitle, ML, 32)
    }
    line(subtitle ? 36 : 30, BORDER)
    return subtitle ? 42 : 36
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 1 — COVER
  // ═══════════════════════════════════════════════════════════════════════════
  fill(0, 0, PW, PH, NAVY)

  // Accent stripe at top
  fill(0, 0, PW, 4, BRAND)

  // Subtle geometric accent
  doc.setFillColor(30, 41, 59)
  doc.triangle(PW, 80, PW, PH, 60, PH, 'F')

  // Logo area
  font(10, 'bold', BRAND)
  doc.text('RUNWAYIQ', ML + 4, 52)
  fill(ML + 4, 55, 18, 1, BRAND)

  font(36, 'bold', WHITE)
  doc.text('AI CFO', ML + 4, 86)
  doc.text('Report', ML + 4, 102)

  // Divider
  fill(ML + 4, 112, 40, 0.5, [51, 65, 85] as RGB)

  // Business name
  font(14, 'normal', [148, 163, 184] as RGB)
  doc.text(bizName, ML + 4, 126)

  // Date
  font(10, 'normal', [100, 116, 139] as RGB)
  doc.text(reportDate, ML + 4, 136)

  // Agent timings
  if (report.agentTimings) {
    font(9, 'normal', [100, 116, 139] as RGB)
    doc.text(`3 AI agents  ·  ${(report.agentTimings.totalMs / 1000).toFixed(1)}s processing`, ML + 4, 148)
  }

  // Badges
  const badgeY = 164
  roundedBox(ML + 4, badgeY - 4.5, 32, 7, [5, 46, 22] as RGB)
  font(7, 'bold', GREEN)
  doc.text('RAG-GROUNDED', ML + 8, badgeY)

  roundedBox(ML + 40, badgeY - 4.5, 28, 7, [30, 41, 59] as RGB)
  font(7, 'bold', [100, 116, 139] as RGB)
  doc.text('CONFIDENTIAL', ML + 43, badgeY)

  // Bottom bar
  fill(0, PH - 30, PW, 30, DARK)
  font(8, 'normal', [71, 85, 105] as RGB)
  doc.text('Powered by Claude AI  ·  For internal use only', ML + 4, PH - 12)
  font(8, 'bold', [100, 116, 139] as RGB)
  doc.text(bizName, PW - MR - 4, PH - 12, { align: 'right' })


  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 2 — FINANCIAL OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage()
  let y = pageHeader('Financial Overview', `Key metrics as of ${reportDate}`)

  // KPI boxes
  const boxW = (CW - 9) / 4
  const kpis = [
    { label: 'Monthly Revenue', value: fmtMoney(latest?.revenue ?? 0), delta: deltas?.revenue != null ? `${deltas.revenue >= 0 ? '+' : ''}${deltas.revenue.toFixed(0)}% MoM` : '—', pos: (deltas?.revenue ?? 0) >= 0, accent: BRAND },
    { label: 'Burn Rate', value: fmtMoney(latest?.burnRate ?? 0), delta: deltas?.netBurn != null ? `${deltas.netBurn <= 0 ? '↓' : '↑'} ${Math.abs(deltas.netBurn).toFixed(0)}% MoM` : '—', pos: (deltas?.netBurn ?? 0) <= 0, accent: RED },
    { label: 'Runway', value: fmtRunway(latest?.runway ?? 0), delta: (latest?.runway ?? 99) < 3 ? 'Critical' : (latest?.runway ?? 99) < 6 ? 'Low' : 'Healthy', pos: (latest?.runway ?? 99) >= 6, accent: (latest?.runway ?? 99) < 3 ? RED : (latest?.runway ?? 99) < 6 ? AMBER : GREEN },
    { label: 'Gross Margin', value: `${(latest?.grossMargin ?? 0).toFixed(0)}%`, delta: (latest?.grossMargin ?? 100) < 40 ? 'Below benchmark' : 'Above benchmark', pos: (latest?.grossMargin ?? 100) >= 40, accent: GREEN },
  ]

  kpis.forEach((kpi, i) => {
    const bx = ML + i * (boxW + 3)
    roundedBox(bx, y, boxW, 32, LIGHT, BORDER)
    fill(bx, y, boxW, 2, kpi.accent)
    font(6.5, 'bold', MUTED)
    doc.text(kpi.label.toUpperCase(), bx + 5, y + 9)
    font(16, 'bold', NAVY)
    doc.text(kpi.value, bx + 5, y + 20)
    font(7, 'bold', kpi.pos ? GREEN : RED)
    doc.text(kpi.delta, bx + 5, y + 27)
  })

  y += 42

  // Revenue vs Burn chart
  font(11, 'bold', NAVY)
  doc.text('Revenue vs Burn', ML, y)
  font(8, 'normal', MUTED)
  doc.text('Last 3 months', ML + 42, y)
  y += 4

  if (chartData.length > 0) {
    const chartH = 50
    const chartL = ML + 18
    const chartR = PW - MR
    const chartW = chartR - chartL
    const chartB = y + chartH + 6
    const maxVal = Math.max(1, ...chartData.map(d => Math.max(d.revenue, d.spend)))

    // Background grid
    for (const pct of [0.25, 0.5, 0.75, 1]) {
      const ly = chartB - pct * chartH
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.15)
      doc.line(chartL, ly, chartR, ly)
      font(6, 'normal', MUTED)
      doc.text(fmtMoney(maxVal * pct), chartL - 3, ly + 1.5, { align: 'right' })
    }
    // Baseline
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.4)
    doc.line(chartL, chartB, chartR, chartB)

    const groupW = chartW / chartData.length
    const barW = groupW * 0.25

    chartData.forEach((d, idx) => {
      const gx = chartL + idx * groupW + groupW * 0.15
      const rH = Math.max(1.5, (d.revenue / maxVal) * chartH)
      const sH = Math.max(1.5, (d.spend / maxVal) * chartH)

      // Revenue bar (rounded top)
      doc.setFillColor(...BRAND)
      doc.roundedRect(gx, chartB - rH, barW, rH, 1, 1, 'F')

      // Spend bar
      doc.setFillColor(...RED)
      doc.roundedRect(gx + barW + 3, chartB - sH, barW, sH, 1, 1, 'F')

      // Value labels
      font(6, 'bold', BRAND)
      doc.text(fmtMoney(d.revenue), gx + barW / 2, chartB - rH - 2, { align: 'center' })
      font(6, 'bold', RED)
      doc.text(fmtMoney(d.spend), gx + barW + 3 + barW / 2, chartB - sH - 2, { align: 'center' })

      font(7, 'normal', BODY)
      doc.text(d.month, gx + barW + 1.5, chartB + 5, { align: 'center' })
    })

    // Legend
    const lgX = PW - MR - 44
    fill(lgX, y + 2, 4, 4, BRAND)
    font(7, 'normal', BODY)
    doc.text('Revenue', lgX + 6, y + 5.5)
    fill(lgX + 26, y + 2, 4, 4, RED)
    doc.text('Burn', lgX + 32, y + 5.5)

    y = chartB + 12
  } else {
    roundedBox(ML, y + 2, CW, 20, LIGHT)
    font(9, 'normal', MUTED)
    doc.text('No chart data available — upload transactions to visualize.', PW / 2, y + 14, { align: 'center' })
    y += 28
  }

  // 3-month Forecast
  if (forecast.length > 0) {
    font(11, 'bold', NAVY)
    doc.text('3-Month Revenue Forecast', ML, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Month', 'Projected Revenue', 'Cash-Out Risk', 'Trend']],
      body: forecast.map(fc => {
        const cur = latest?.revenue ?? 0
        const pct = cur > 0 ? (((fc.revenue - cur) / cur) * 100).toFixed(0) : '—'
        return [
          new Date(fc.month).toLocaleString('default', { month: 'long', year: 'numeric' }),
          fmtMoney(fc.revenue),
          fc.cashOutRisk ? '⚠ Yes' : '—',
          pct !== '—' ? `${Number(pct) >= 0 ? '+' : ''}${pct}%` : '—',
        ]
      }),
      styles: { fontSize: 8, cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 }, lineColor: BORDER, lineWidth: 0.2 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGB },
      margin: { left: ML, right: MR },
      tableLineColor: BORDER,
      didParseCell: (h) => {
        if (h.section === 'body' && h.column.index === 2 && String(h.cell.raw).includes('⚠')) {
          h.cell.styles.textColor = RED; h.cell.styles.fontStyle = 'bold'
        }
        if (h.section === 'body' && h.column.index === 3) {
          const v = String(h.cell.raw)
          h.cell.styles.textColor = v.startsWith('+') ? GREEN : v.startsWith('-') ? RED : BODY
          h.cell.styles.fontStyle = 'bold'
        }
      },
    })
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 3 — RISK ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage()
  y = pageHeader('Risk Analysis', 'Automated scoring across financial health indicators')

  if (risk) {
    const sc = risk.score
    const riskCol: RGB = sc >= 70 ? RED : sc >= 40 ? AMBER : GREEN
    const riskBg: RGB = sc >= 70 ? [254, 242, 242] as RGB : sc >= 40 ? [255, 251, 235] as RGB : [240, 253, 244] as RGB

    // Score card (left)
    roundedBox(ML, y, 50, 50, riskBg, BORDER)
    fill(ML, y, 50, 2, riskCol)
    font(7, 'bold', MUTED)
    doc.text('RISK SCORE', ML + 25, y + 12, { align: 'center' })
    font(32, 'bold', riskCol)
    doc.text(String(sc), ML + 25, y + 34, { align: 'center' })
    font(9, 'bold', riskCol)
    doc.text(`${risk.label.toUpperCase()} RISK`, ML + 25, y + 43, { align: 'center' })

    // Gauge + context (right)
    const gx = ML + 60
    const gw = CW - 60

    // Full gauge background
    roundedBox(gx, y + 6, gw, 7, [226, 232, 240] as RGB)
    // Filled portion
    const fillW = Math.max(2, (sc / 100) * gw)
    roundedBox(gx, y + 6, fillW, 7, riskCol)
    // Gauge text
    font(6.5, 'normal', MUTED)
    doc.text('0', gx, y + 19)
    doc.text('50', gx + gw / 2, y + 19, { align: 'center' })
    doc.text('100', gx + gw, y + 19, { align: 'right' })

    // Context blurb
    const ctx = sc >= 70
      ? 'Critical risk level. Immediate intervention required — the business faces severe financial pressures that could threaten operational continuity within the near term.'
      : sc >= 40
      ? 'Elevated risk. Multiple warning indicators present. Strategic adjustments recommended within the next 30–60 days to improve trajectory.'
      : 'Healthy risk profile. The business is in a stable financial position. Continue monitoring key metrics and maintain spending discipline.'
    font(8.5, 'normal', BODY)
    const ctxLines = doc.splitTextToSize(ctx, gw)
    doc.text(ctxLines, gx, y + 28)

    y += 60

    // Risk drivers table
    if (risk.drivers.length > 0) {
      font(11, 'bold', NAVY)
      doc.text('Risk Drivers', ML, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Risk Factor', 'Points', 'Weight']],
        body: risk.drivers.map(d => [
          d.name,
          `+${d.points}`,
          `${((d.points / Math.max(1, sc)) * 100).toFixed(0)}%`,
        ]),
        foot: [['Total', String(sc), '100%']],
        styles: { fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, lineColor: BORDER, lineWidth: 0.2 },
        headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        footStyles: { fillColor: LIGHT, fontStyle: 'bold', textColor: NAVY },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: 'center', fontStyle: 'bold', textColor: RED },
          2: { halign: 'center', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] as RGB },
        margin: { left: ML, right: MR },
      })
    }
  } else {
    roundedBox(ML, y, CW, 24, LIGHT)
    font(9, 'normal', MUTED)
    doc.text('Risk data not yet available.', PW / 2, y + 14, { align: 'center' })
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 4 — PROBLEMS IDENTIFIED
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage()
  y = pageHeader('Problems Identified', 'Agent 1 — Analyst findings')

  if (report.problems?.length) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Problem', 'Severity', 'Detail']],
      body: report.problems.map((p, i) => [
        `${i + 1}`,
        p.title,
        p.severity.toUpperCase(),
        p.detail ?? '—',
      ]),
      styles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 }, lineColor: BORDER, lineWidth: 0.2, overflow: 'linebreak' },
      headStyles: { fillColor: BRAND, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 44, fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 94 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGB },
      margin: { left: ML, right: MR },
      didParseCell: (h) => {
        if (h.section === 'body' && h.column.index === 2) {
          const sev = String(h.cell.raw)
          if (sev === 'HIGH' || sev === 'CRITICAL') { h.cell.styles.textColor = RED; h.cell.styles.fontStyle = 'bold' }
          else if (sev === 'MEDIUM') { h.cell.styles.textColor = AMBER; h.cell.styles.fontStyle = 'bold' }
          else { h.cell.styles.textColor = GREEN; h.cell.styles.fontStyle = 'bold' }
        }
      },
    })
  } else {
    roundedBox(ML, y, CW, 20, LIGHT)
    font(9, 'normal', MUTED)
    doc.text('No problems identified.', PW / 2, y + 12, { align: 'center' })
  }

  // Solutions — on same page if space, otherwise new page
  const afterProblems = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 24) + 14
  if (afterProblems > 220) doc.addPage()
  const solY = afterProblems > 220 ? pageHeader('Recommended Actions', 'Agent 2 — Strategist solutions') : afterProblems

  if (afterProblems <= 220) {
    font(11, 'bold', NAVY)
    doc.text('Recommended Actions', ML, solY - 4)
    font(8, 'normal', MUTED)
    doc.text('Agent 2 — Strategist', ML + 52, solY - 4)
  }

  if (report.solutions?.length) {
    autoTable(doc, {
      startY: afterProblems > 220 ? solY : solY + 2,
      head: [['Action', 'Impact', 'Timeline', 'Source']],
      body: report.solutions.map(s => [
        s.action.split(/[.!]/)[0].trim(),
        s.estimatedImpact,
        s.timeframe,
        KB_LABELS[s.kbSource ?? ''] ?? s.kbSource ?? '—',
      ]),
      styles: { fontSize: 8.5, cellPadding: { top: 4, bottom: 4, left: 5, right: 5 }, lineColor: BORDER, lineWidth: 0.2, overflow: 'linebreak' },
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 45, textColor: GREEN, fontStyle: 'bold' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 46 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as RGB },
      margin: { left: ML, right: MR },
      didParseCell: (h) => {
        if (h.section === 'body' && h.column.index === 2) {
          const tf = String(h.cell.raw)
          if (tf === 'immediate') { h.cell.styles.textColor = RED; h.cell.styles.fontStyle = 'bold' }
          else if (tf === '30 days') { h.cell.styles.textColor = AMBER; h.cell.styles.fontStyle = 'bold' }
          else { h.cell.styles.textColor = GREEN; h.cell.styles.fontStyle = 'bold' }
        }
      },
    })
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PAGE 5 — CFO NARRATIVE & ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage()
  y = pageHeader('Executive Summary', 'AI-generated CFO narrative')

  // Blue left border for narrative
  const narrative = report.reportText ?? ''
  font(9.5, 'normal', BODY)
  const narLines = doc.splitTextToSize(narrative, CW - 10)
  const narH = narLines.length * 4.5

  fill(ML, y, 2.5, Math.min(narH, 140), BRAND)
  doc.text(narLines, ML + 8, y + 5)
  y += Math.min(narH + 10, 150)

  // Recommended action cards
  if (report.actions?.length) {
    y += 4
    font(7.5, 'bold', MUTED)
    doc.text('RECOMMENDED ACTIONS', ML, y)
    y += 6

    const cardW = (CW - 8) / 3
    report.actions.slice(0, 3).forEach((action, i) => {
      const cx = ML + i * (cardW + 4)
      roundedBox(cx, y, cardW, 36, LIGHT, BORDER)
      fill(cx, y, cardW, 2, BRAND)

      // Number
      font(16, 'bold', BRAND)
      doc.text(`0${i + 1}`, cx + 5, y + 12)

      // Action text
      font(8, 'normal', BODY)
      const actLines = doc.splitTextToSize(action, cardW - 10)
      doc.text(actLines.slice(0, 4), cx + 5, y + 19)
    })

    y += 46
  }

  // Knowledge sources
  const kbChunks = report.kbChunksRetrieved ?? []
  if (kbChunks.length > 0) {
    y += 4
    font(7.5, 'bold', MUTED)
    doc.text('KNOWLEDGE SOURCES CONSULTED', ML, y)
    y += 3
    line(y, BORDER)
    y += 6

    kbChunks.forEach(id => {
      doc.setFillColor(...GREEN)
      doc.circle(ML + 2, y - 1.2, 1.2, 'F')
      font(9, 'normal', BODY)
      doc.text(KB_LABELS[id] ?? id, ML + 7, y)
      y += 7
    })
  }

  // ── Agent performance box ────────────────────────────────────────────────
  if (report.agentTimings) {
    y += 8
    roundedBox(ML, y, CW, 18, LIGHT, BORDER)
    font(7, 'bold', MUTED)
    doc.text('GENERATION DETAILS', ML + 5, y + 6)
    font(8, 'normal', BODY)
    const t = report.agentTimings
    doc.text(
      `Analyst: ${(t.agent1Ms / 1000).toFixed(1)}s   ·   Strategist: ${(t.agent2Ms / 1000).toFixed(1)}s   ·   CFO Writer: ${(t.agent3Ms / 1000).toFixed(1)}s   ·   Total: ${(t.totalMs / 1000).toFixed(1)}s`,
      ML + 5, y + 13,
    )
  }


  // ── Apply footers ────────────────────────────────────────────────────────
  addFooter()

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = bizName.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`RunwayIQ_CFO_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
