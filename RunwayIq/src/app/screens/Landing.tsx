import { useNavigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import './Landing.css'

const Check = () => (
  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
)

export function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const goLogin = () => navigate('/login')
  const goDashboard = () => navigate(session ? '/' : '/login')

  return (
    <div className="landing">
      {/* ── NAV ── */}
      <nav>
        <a className="nav-logo" href="#">
          <div className="nav-logo-box"><span>RIQ</span></div>
          <span className="nav-brand">RunwayIQ</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-sp" />
        <div className="nav-cta">
          <button className="btn-ghost" onClick={goLogin}>Sign in</button>
          <button className="btn-primary" onClick={goLogin}>Start free →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            AI-powered financial intelligence
          </div>
          <h1>Your business deserves a <span className="accent">virtual CFO</span></h1>
          <p className="hero-sub">
            RunwayIQ turns raw transaction data into survival probabilities, risk scores, and
            plain-English recommendations — before it's too late.
          </p>
          <div className="hero-actions">
            <button className="btn-hero" onClick={goDashboard}>
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload your CSV
            </button>
            <button className="btn-hero-ghost" onClick={goDashboard}>See a live demo</button>
          </div>
          <div className="hero-trust">
            <span>No credit card required</span>
            <div className="trust-dot" />
            <span>Free forever for 1 business</span>
            <div className="trust-dot" />
            <span>Results in under 60 seconds</span>
          </div>

          {/* MINI DASHBOARD PREVIEW */}
          <div className="dashboard-preview">
            <div className="preview-shadow">
              <div className="preview-chrome">
                <div className="chrome-dot" style={{ background: '#FF5F57' }} />
                <div className="chrome-dot" style={{ background: '#FEBC2E' }} />
                <div className="chrome-dot" style={{ background: '#28C840' }} />
                <div className="chrome-url">app.runwayiq.com</div>
              </div>
              <div className="preview-body">
                <div className="mini-topbar">
                  <div className="mini-logo-box"><span className="mini-logo-text">RIQ</span></div>
                  <span className="mini-brand">RUNWAYIQ</span>
                  <div className="mini-sp" />
                  <div className="mini-notif" />
                  <div className="mini-biz">Acme Corp</div>
                  <div className="mini-btn">⚙ Settings</div>
                </div>
                <div className="mini-body">
                  <div className="mini-sidebar">
                    <div className="mini-si on">
                      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                    </div>
                    <div className="mini-si">
                      <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div className="mini-si">
                      <svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
                    </div>
                    <div className="mini-si">
                      <svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="20" y1="21" x2="20" y2="16" /></svg>
                    </div>
                    <div className="mini-si">
                      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    </div>
                  </div>
                  <div className="mini-main">
                    {/* KPIs */}
                    <div className="mini-kpis">
                      <div className="mini-kpi">
                        <div className="mk-l">Monthly Revenue</div>
                        <div className="mk-v">$1.3M</div>
                        <div className="mk-s" style={{ color: '#22C55E' }}>↑ 7.4% vs last month</div>
                        <div className="mk-spark">
                          {[8,9,10,11,12,14].map((h,i) => (
                            <div key={i} className="msk" style={{ height: h, background: i === 5 ? '#2563EB' : '#93C5FD' }} />
                          ))}
                        </div>
                      </div>
                      <div className="mini-kpi">
                        <div className="mk-l">Burn Rate</div>
                        <div className="mk-v">$115K</div>
                        <div className="mk-s" style={{ color: '#EF4444' }}>↑ 32.7% vs last month</div>
                        <div className="mk-spark">
                          {[5,7,9,10,12,14].map((h,i) => (
                            <div key={i} className="msk" style={{ height: h, background: i >= 4 ? '#EF4444' : '#FCA5A5' }} />
                          ))}
                        </div>
                      </div>
                      <div className="mini-kpi">
                        <div className="mk-l">Runway</div>
                        <div className="mk-v" style={{ color: '#22C55E' }}>8.7 mo</div>
                        <div className="mk-s" style={{ color: '#22C55E' }}>Healthy</div>
                        <div className="mk-spark">
                          {[8,9,10,11,12,14].map((h,i) => (
                            <div key={i} className="msk" style={{ height: h, background: i === 5 ? '#2563EB' : '#93C5FD' }} />
                          ))}
                        </div>
                      </div>
                      <div className="mini-kpi">
                        <div className="mk-l">Gross Margin</div>
                        <div className="mk-v">75%</div>
                        <div className="mk-s" style={{ color: '#22C55E' }}>above benchmark</div>
                        <div className="mk-spark">
                          {[10,11,12,12,13,14].map((h,i) => (
                            <div key={i} className="msk" style={{ height: h, background: i === 5 ? '#16A34A' : '#6EE7B7' }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rev vs Burn + Risk */}
                    <div className="mini-row2">
                      <div className="mini-card">
                        <div className="mc-t">Revenue vs Burn</div>
                        <div className="mini-bars">
                          {[
                            { mo: 'Mar', rev: 72, revV: '$1.1M', burn: 82, burnV: '$1.3M' },
                            { mo: 'Apr', rev: 78, revV: '$1.2M', burn: 84, burnV: '$1.3M' },
                            { mo: 'May', rev: 84, revV: '$1.3M', burn: 90, burnV: '$1.4M' },
                          ].map(r => (
                            <div key={r.mo}>
                              <div className="mb-row">
                                <span className="mb-mo">{r.mo}</span>
                                <div className="mb-track"><div className="mb-rev" style={{ width: `${r.rev}%` }} /></div>
                                <span className="mb-val">{r.revV}</span>
                              </div>
                              <div className="mb-row">
                                <span className="mb-mo" />
                                <div className="mb-track"><div className="mb-burn" style={{ width: `${r.burn}%` }} /></div>
                                <span className="mb-val">{r.burnV}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mini-fc">
                          <div className="mfc"><div className="mfc-mo">Jun</div><div className="mfc-v">$1.3M</div><div className="mfc-t" style={{ color: '#22C55E' }}>+2%</div></div>
                          <div className="mfc"><div className="mfc-mo">Jul</div><div className="mfc-v">$1.4M</div><div className="mfc-t" style={{ color: '#22C55E' }}>+6%</div></div>
                          <div className="mfc mfc-d"><div className="mfc-mo">Aug</div><div className="mfc-v">$1.4M</div><div className="mfc-t" style={{ color: '#EF4444' }}>+10%</div></div>
                        </div>
                      </div>
                      <div className="mini-card">
                        <div className="mc-t">Risk Score</div>
                        <div className="mini-risk">
                          <div className="mr-ring">
                            <svg viewBox="0 0 70 70" width="70" height="70">
                              <circle cx="35" cy="35" r="27" fill="none" stroke="#F0F0F0" strokeWidth="7" />
                              <circle cx="35" cy="35" r="27" fill="none" stroke="#EF4444" strokeWidth="7" strokeDasharray="170" strokeDashoffset="139" strokeLinecap="round" transform="rotate(-90 35 35)" />
                              <text x="35" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111" fontFamily="DM Sans,sans-serif">18/100</text>
                            </svg>
                          </div>
                          <div className="mr-badge">LOW RISK</div>
                          <div style={{ width: '100%' }}>
                            <div className="mr-drv">Runway &lt;12mo<span>+8</span></div>
                            <div className="mr-drv">Positive net burn<span>+10</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* What-If */}
                    <div className="mini-wi">
                      <div className="mwi-hdr">
                        <span className="mwi-title">What-If Simulator</span>
                        <span className="mwi-new">NEW</span>
                      </div>
                      <div className="mwi-row">
                        <div className="mwi-lr"><span className="mwi-l">Cut OPEX by</span><span className="mwi-v">20%</span></div>
                        <div className="mwi-track">
                          <div className="mwi-fill-b" style={{ width: '40%' }} />
                          <div className="mwi-thumb" style={{ left: '40%', color: '#2563EB' }} />
                        </div>
                      </div>
                      <div className="mwi-row" style={{ marginTop: 8 }}>
                        <div className="mwi-lr"><span className="mwi-l">Revenue target</span><span className="mwi-v">$1,311k</span></div>
                        <div className="mwi-track">
                          <div className="mwi-fill-g" style={{ width: '55%' }} />
                          <div className="mwi-thumb" style={{ left: '55%', color: '#22C55E' }} />
                        </div>
                      </div>
                      <div className="mwi-res">
                        <div className="mwr"><div className="mwr-l">New Runway</div><div className="mwr-v" style={{ color: '#111' }}>∞</div></div>
                        <div className="mwr"><div className="mwr-l">Risk Score</div><div className="mwr-v" style={{ color: '#111' }}>0</div></div>
                        <div className="mwr"><div className="mwr-l">Cash Saved</div><div className="mwr-v" style={{ color: '#22C55E' }}>$210,924</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="stats-bar">
        {[
          { val: '9', lbl: 'Financial metrics computed' },
          { val: '3', lbl: 'AI agents in the pipeline' },
          { val: '<60s', lbl: 'From CSV to CFO report' },
          { val: '8', lbl: 'RAG knowledge playbooks' },
        ].map(s => (
          <div key={s.lbl} className="stat-item">
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how">
        <div className="landing-section">
          <div className="section-eyebrow">How it works</div>
          <div className="section-title">From CSV to CFO report<br />in under 60 seconds</div>
          <p className="section-sub">Upload your transaction data and RunwayIQ does the rest — no accountant, no spreadsheets, no guesswork.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">01 — INGEST</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <div className="step-title">Upload your transactions</div>
              <div className="step-desc">Drop in a CSV of your business transactions. RunwayIQ parses, normalizes, and categorizes everything automatically — revenue, COGS, payroll, OPEX.</div>
            </div>
            <div className="step">
              <div className="step-num">02 — ANALYZE</div>
              <div className="step-icon" style={{ background: '#FEF3C7' }}>
                <svg viewBox="0 0 24 24" style={{ stroke: '#D97706' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              <div className="step-title">Metrics + risk computed</div>
              <div className="step-desc">Burn rate, runway, gross margin, MoM deltas, 3-month forecast with confidence bands, and a composite risk score 0–100 — all calculated instantly.</div>
            </div>
            <div className="step">
              <div className="step-num">03 — REPORT</div>
              <div className="step-icon" style={{ background: '#DCFCE7' }}>
                <svg viewBox="0 0 24 24" style={{ stroke: '#16A34A' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div className="step-title">AI CFO report generated</div>
              <div className="step-desc">A 3-agent Claude pipeline — Analyst, Strategist, CFO Writer — produces a grounded, specific report with 3 prioritized actions backed by real financial playbooks.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="features">
        <div className="features-section">
          <div className="features-inner">
            <div className="section-eyebrow">Features</div>
            <div className="section-title">Everything your CFO would tell you</div>
            <p className="section-sub">Built for founders and finance managers who need answers, not dashboards.</p>
            <div className="features-grid">
              {[
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#2563EB' }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, bg: '#EEF2FF', title: 'Real-time metrics engine', desc: 'Revenue, COGS, OPEX, gross margin, net burn, burn rate, runway — all computed from raw transactions on every upload.', tag: '9 metrics', tagBg: '#EEF2FF', tagColor: '#1D4ED8' },
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#D97706' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, bg: '#FEF3C7', title: '3-month linear forecast', desc: 'Projects revenue and expenses forward with confidence bands so you can see the range of outcomes, not just the midpoint.', tag: '±1 std dev bands', tagBg: '#FEF3C7', tagColor: '#92400E' },
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#DC2626' }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, bg: '#FEE2E2', title: 'Risk score 0–100', desc: 'Rule-based composite score across runway, burn growth, margin compression, and revenue volatility — with top 3 named drivers.', tag: 'Green / Amber / Red', tagBg: '#FEE2E2', tagColor: '#991B1B' },
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#7C3AED' }}><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></svg>, bg: '#EEEDFE', title: '3-agent RAG pipeline', desc: 'Analyst identifies problems, Strategist retrieves grounded playbooks, CFO Writer synthesizes into a plain-English report with specific actions.', tag: 'RAG-grounded', tagBg: '#EEEDFE', tagColor: '#5B21B6' },
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#16A34A' }}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>, bg: '#DCFCE7', title: 'What-if simulator', desc: 'Drag sliders to model OPEX cuts, revenue targets, and cash injections. See how each scenario changes your runway and risk score instantly.', tag: 'Live recalculation', tagBg: '#DCFCE7', tagColor: '#166534' },
                { icon: <svg viewBox="0 0 24 24" style={{ stroke: '#2563EB' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>, bg: '#EEF2FF', title: 'AI CFO chat', desc: 'Ask anything about your finances. The AI has full context of your snapshot and responds with specific, numbers-grounded answers — not generic advice.', tag: 'Context-aware', tagBg: '#EEF2FF', tagColor: '#1D4ED8' },
              ].map(f => (
                <div key={f.title} className="feat">
                  <div className="feat-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                  <div className="feat-tag" style={{ background: f.tagBg, color: f.tagColor }}>{f.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RISK SHOWCASE ── */}
      <div className="risk-section">
        <div>
          <div className="section-eyebrow">Risk scoring</div>
          <div className="section-title" style={{ fontSize: 34 }}>Know your risk<br />before it's too late</div>
          <p className="section-sub" style={{ fontSize: 15 }}>RunwayIQ scores your financial health on a 0–100 composite scale and tells you exactly what's driving it — not just a number.</p>
          <div className="risk-items">
            {[
              { color: '#EF4444', title: 'Runway under 3 months', desc: '— the single biggest predictor of failure. Caught early, fixable.' },
              { color: '#F59E0B', title: 'Burn rate growing faster than revenue', desc: '— the gap widens every month. Act before it\'s irreversible.' },
              { color: '#8B5CF6', title: 'Gross margin compression', desc: '— pricing or COGS problem. Benchmarked against your industry.' },
              { color: '#2563EB', title: 'Revenue volatility', desc: '— unpredictable cashflow means unpredictable runway. Flagged automatically.' },
            ].map(r => (
              <div key={r.title} className="ri">
                <div className="ri-dot" style={{ background: r.color }} />
                <div className="ri-text"><b>{r.title}</b> {r.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="risk-right">
          {[
            { name: 'Vaultly Inc — May 2025', score: 74, cls: 'score-red', fill: '#EF4444', drivers: [['Runway under 3 months', '+25', '#EF4444'], ['Revenue declining 3 months', '+15', '#EF4444'], ['Burn rate grew +12% MoM', '+10', '#EF4444'], ['Gross margin below 40%', '+10', '#F59E0B']] },
            { name: 'NorthStack — May 2025', score: 42, cls: 'score-amber', fill: '#F59E0B', drivers: [['Runway under 6 months', '+10', '#F59E0B'], ['Burn rate grew +11% MoM', '+10', '#F59E0B'], ['Gross margin below 40%', '+10', '#F59E0B']] },
            { name: 'Fendly Corp — May 2025', score: 18, cls: 'score-green', fill: '#22C55E', drivers: [['Runway under 12 months', '+8', '#22C55E'], ['Positive net burn', '+10', '#22C55E']] },
          ].map(card => (
            <div key={card.name} className="risk-card">
              <div className="risk-card-hdr">
                <div className="risk-card-title">{card.name}</div>
                <div className={`score-pill ${card.cls}`}>{card.score} / 100</div>
              </div>
              <div className="risk-meter"><div className="risk-fill" style={{ width: `${card.score}%`, background: card.fill }} /></div>
              <div className="risk-drivers">
                {card.drivers.map(([label, pts, color]) => (
                  <div key={label} className="rdrv">{label}<span style={{ color }}>{pts}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI SECTION ── */}
      <div className="ai-section-wrap" style={{ padding: '80px 40px' }}>
      <div className="ai-section">
        <div className="ai-bg" />
        <div className="ai-inner">
          <div className="ai-left">
            <div className="section-eyebrow">AI pipeline</div>
            <div className="section-title">3 agents. Not 1 API call.</div>
            <p className="section-sub">Most AI finance tools just send your numbers to a model and hope for the best. RunwayIQ runs a structured 3-agent chain grounded in real financial playbooks.</p>
            <div className="agent-steps">
              {[
                { num: '01', title: 'Analyst — identifies problems', desc: 'Reads your metrics and outputs a structured problem list with severity ratings (critical / high / medium).' },
                { num: '02', title: 'Strategist — retrieves playbooks', desc: 'Uses RAG to pull relevant financial playbooks (burn rate, runway, margin, revenue recovery) and generates grounded solutions with estimated impact.' },
                { num: '03', title: 'CFO Writer — synthesizes report', desc: 'Combines problem analysis and solutions into a plain-English executive report with 3 prioritized, specific actions.' },
              ].map(s => (
                <div key={s.num} className="agent-step">
                  <div className="agent-step-num">{s.num}</div>
                  <div><div className="agent-step-title">{s.title}</div><div className="agent-step-desc">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="ai-right">
            <div className="ai-card">
              <div className="ai-card-badge">AI CFO REPORT</div>
              <div className="ai-card-text">
                Acme Corp is burning <b>$18,400/month</b> while revenue has declined <b>16%</b> over 5 months
                — runway is <b>2.6 months</b>. Based on SME turnaround benchmarks, cutting OPEX 20% and securing
                client prepayments extends runway to 4.4 months without external funding.
              </div>
            </div>
            <div className="ai-card">
              <div className="ai-card-badge">RECOMMENDED ACTIONS</div>
              <div className="ai-actions">
                {[
                  { n: '01', t: 'Cut OPEX 20-30% — targets +1.8 months runway immediately' },
                  { n: '02', t: 'Offer 5% discount for 6-month client prepayment (+$40k)' },
                  { n: '03', t: 'Bridge financing over fundraising — 3-6mo faster at 2.6mo runway' },
                ].map(a => (
                  <div key={a.n} className="ai-act"><div className="ai-act-n">{a.n}</div><div className="ai-act-t">{a.t}</div></div>
                ))}
              </div>
            </div>
            <div className="ai-card" style={{ background: 'rgba(37,99,235,.06)', borderColor: 'rgba(37,99,235,.2)' }}>
              <div className="ai-card-badge" style={{ background: 'rgba(37,99,235,.4)', color: '#93C5FD' }}>RAG KNOWLEDGE BASE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                {['Low runway playbook','Burn benchmarks','SME turnaround tactics','Revenue recovery guide','Fundraising signals','Bridge financing guide'].map(k => (
                  <div key={k} style={{ fontSize: 10, color: '#64748B', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{k}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing">
        <div className="pricing-section">
          <div className="section-eyebrow">Pricing</div>
          <div className="section-title" style={{ maxWidth: 480 }}>Simple, transparent pricing</div>
          <p className="section-sub">Start free. Upgrade when you need more businesses or advanced features.</p>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-plan">Starter</div>
              <div className="price-val">$0 <span>/ month</span></div>
              <div className="price-desc">Perfect for solo founders keeping an eye on one business.</div>
              <div className="price-divider" />
              <div className="price-features">
                {['1 business','CSV upload (500 rows)','All 9 financial metrics','Risk score + forecast','5 AI reports / month'].map(f => (
                  <div key={f} className="pf"><Check />{f}</div>
                ))}
              </div>
              <button className="price-btn price-btn-ghost" onClick={goLogin}>Get started free</button>
            </div>
            <div className="price-card featured">
              <div className="featured-badge">MOST POPULAR</div>
              <div className="price-plan">Growth</div>
              <div className="price-val">$49 <span>/ month</span></div>
              <div className="price-desc">For growing startups that need deeper insight and more AI reports.</div>
              <div className="price-divider" />
              <div className="price-features">
                {['5 businesses','CSV upload (5,000 rows)','Everything in Starter','Unlimited AI reports','CFO chat (history saved)','What-if simulator','Weekly auto-reports'].map(f => (
                  <div key={f} className="pf"><Check />{f}</div>
                ))}
              </div>
              <button className="price-btn price-btn-primary" onClick={goLogin}>Start 14-day free trial</button>
            </div>
            <div className="price-card">
              <div className="price-plan">Enterprise</div>
              <div className="price-val">Custom</div>
              <div className="price-desc">For finance teams and accelerators managing multiple portfolio companies.</div>
              <div className="price-divider" />
              <div className="price-features">
                {['Unlimited businesses','API access','Everything in Growth','Banking API integration','Custom knowledge base','Dedicated support'].map(f => (
                  <div key={f} className="pf"><Check />{f}</div>
                ))}
              </div>
              <button className="price-btn price-btn-ghost">Contact sales</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="cta-section">
        <div className="cta-bg" />
        <div className="section-title">Know your runway.<br />Before it runs out.</div>
        <p>Upload your first CSV and get a full CFO report in under 60 seconds.</p>
        <div className="cta-actions">
          <button className="btn-white" onClick={goDashboard}>Upload CSV free →</button>
          <button className="btn-white-ghost" onClick={goDashboard}>Watch 2-min demo</button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand"><div className="footer-brand-box">RIQ</div>RunwayIQ</div>
              <div className="footer-tagline">AI-powered financial intelligence for small and medium businesses. Built at Hack Canada 2026.</div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Product</div>
              <a href="#" onClick={goDashboard}>Dashboard</a>
              <a href="#" onClick={goDashboard}>Forecast</a>
              <a href="#" onClick={goDashboard}>What-if</a>
              <a href="#" onClick={goDashboard}>CFO Chat</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Resources</div>
              <a href="#">Documentation</a>
              <a href="#">API reference</a>
              <a href="#">CSV format</a>
              <a href="#">Changelog</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Company</div>
              <a href="#">About</a>
              <a href="https://github.com/abhishek8524/runwayIQ" target="_blank" rel="noreferrer">GitHub</a>
              <a href="#">Twitter</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">© 2026 RunwayIQ. Built at Hack Canada 2026.</div>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
