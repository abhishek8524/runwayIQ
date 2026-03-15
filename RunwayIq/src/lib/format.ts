/** Convert a cent value (integer) to a display dollar string, e.g. 6_800_000 → "$68K" */
export function fmtMoney(cents: number): string {
  const dollars = cents / 100
  const abs = Math.abs(dollars)
  const sign = dollars < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`
  return `${sign}$${Math.round(abs).toLocaleString()}`
}

/** Format a runway value, e.g. 2.6 → "2.6 mo" */
export function fmtRunway(months: number): string {
  if (months >= 999) return '∞'
  return `${months.toFixed(1)} mo`
}

/** Format a MoM delta percentage, e.g. 8 → "↑ 8%" */
export function fmtDelta(pct: number | null | undefined, invert = false): string {
  if (pct == null) return '—'
  const up = invert ? pct < 0 : pct >= 0
  const arrow = up ? '↑' : '↓'
  return `${arrow} ${Math.abs(pct).toFixed(1)}%`
}

/** Format a signed percentage change for display, e.g. 8 → "+8%" */
export function fmtPct(pct: number | null | undefined): string {
  if (pct == null) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
