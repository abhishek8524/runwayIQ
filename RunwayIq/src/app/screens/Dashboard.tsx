import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Upload, Send, RefreshCw, Loader2 } from 'lucide-react';
import {
  api, MetricsResponse, RiskResponse, Report,
  ForecastMonth, SimulateResponse, Business, ChatMessage,
} from '../../lib/api';
import { fmtMoney, fmtRunway, fmtDelta } from '../../lib/format';
import { RiskRing } from '../components/RiskRing';
import { SliderRow } from '../components/SliderRow';
import { ChatBubble } from '../components/ChatBubble';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { Pill } from '../components/Pill';
import { SeverityBadge } from '../components/SeverityBadge';

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] uppercase tracking-widest" style={{ color: '#9CA3AF', fontWeight: 600 }}>
        {children}
      </span>
      {badge && (
        <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wide"
          style={{ backgroundColor: '#D1FAE5', color: '#059669', fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KPIProps {
  label: string; value: string; sub: string;
  subColor?: string; danger?: boolean; sparkline?: number[];
  sparkColor?: string;
}

function KPI({ label, value, sub, subColor = '#9CA3AF', danger, sparkline, sparkColor }: KPIProps) {
  const minSpark = Math.min(0, ...(sparkline ?? [0]));
  const maxSpark = Math.max(1, ...(sparkline ?? [1]));
  const range = maxSpark - minSpark || 1;
  const barColor = danger ? '#E24B4A' : (sparkColor ?? '#1A56DB');
  return (
    <Card className={danger ? 'bg-[#FFF5F5] border-[#FCA5A5]' : ''}>
      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#9CA3AF', fontWeight: 600 }}>
        {label}
      </div>
      <div className="text-[24px] mb-1" style={{ color: danger ? '#E24B4A' : '#111827', fontWeight: 600 }}>
        {value}
      </div>
      <div className="text-[12px] mb-3" style={{ color: subColor, fontWeight: 500 }}>{sub}</div>
      {sparkline && (
        <div className="flex items-end gap-[2px] h-[22px]" style={{ maxWidth: '120px' }}>
          {sparkline.map((v, i) => (
            <div key={i}
              className="rounded-[2px] transition-all"
              style={{
                width: '10px',
                flexShrink: 0,
                height: `${Math.max(15, ((v - minSpark) / range) * 100)}%`,
                backgroundColor: barColor,
                opacity: i === sparkline.length - 1 ? 1 : 0.25 + (i / sparkline.length) * 0.6,
              }}
            />
          ))}
        </div>
      )}
      {danger && (
        <div className="mt-2 h-[2px] rounded-full bg-[#FEE2E2] overflow-hidden">
          <div className="h-full bg-[#E24B4A] rounded-full" style={{ width: '22%' }} />
        </div>
      )}
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [simulate, setSimulate] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // CSV upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generating report state
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Cash balance prompt
  const [cashInput, setCashInput] = useState('');
  const [cashSaving, setCashSaving] = useState(false);

  // What-if sliders
  const [opexCut, setOpexCut] = useState(20);
  const [revenueTargetK, setRevenueTargetK] = useState(50);
  const revenueInitialized = useRef(false);
  const simTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [m, r, rep, f, b] = await Promise.all([
      api.metrics.get().catch(() => null),
      api.risk.get().catch(() => null),
      api.report.latest().catch(() => null),
      api.forecast.get(3).catch(() => [] as ForecastMonth[]),
      api.businesses.get().catch(() => [] as Business[]),
    ]);
    setMetrics(m);
    setRisk(r);
    setReport(rep);
    setForecast(f);
    setBusiness(b[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Once metrics arrive, seed the revenue target slider to current revenue
  useEffect(() => {
    if (revenueInitialized.current || !metrics?.latest?.revenue) return;
    revenueInitialized.current = true;
    const currentRevenueK = Math.round(metrics.latest.revenue / 100 / 1000);
    setRevenueTargetK(Math.max(1, currentRevenueK));
  }, [metrics]);

  // Simulate on slider change
  useEffect(() => {
    if (!metrics?.latest) return;
    if (simTimer.current) clearTimeout(simTimer.current);
    simTimer.current = setTimeout(() => {
      const revenueTargetDollars = revenueTargetK * 1000;
      api.simulate.run({ opexCutPercent: opexCut, revenueTarget: revenueTargetDollars })
        .then(setSimulate).catch(() => null);
    }, 400);
    return () => { if (simTimer.current) clearTimeout(simTimer.current); };
  }, [opexCut, revenueTargetK, metrics]);

  // CSV upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const result = await api.transactions.upload(file);
      setUploadMsg({ type: 'success', text: `Imported ${result.imported} transactions — data refreshed.` });
      await loadData();
    } catch (err: unknown) {
      setUploadMsg({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Save cash on hand and recompute runway
  async function handleSaveCash() {
    const dollars = parseFloat(cashInput.replace(/[^0-9.]/g, ''));
    if (isNaN(dollars) || dollars < 0) return;
    setCashSaving(true);
    try {
      await api.businesses.update({ cashOnHand: dollars });
      await loadData();
      setCashInput('');
    } catch { /* ignore */ } finally {
      setCashSaving(false);
    }
  }

  // Generate AI report
  async function handleGenerateReport() {
    setGenerating(true);
    setReportError(null);
    try {
      const rep = await api.report.generate();
      setReport(rep);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  }

  // Chat
  async function sendChat() {
    const msg = chatMsg.trim();
    if (!msg || chatLoading) return;
    setChatMsg('');
    const next: ChatMessage[] = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(next);
    setChatLoading(true);
    try {
      const res = await api.chat.send(msg, chatHistory);
      setChatHistory(res.conversationHistory);
    } catch {
      setChatHistory([...next, { role: 'assistant', content: 'Unable to process that request right now.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  const latest = metrics?.latest;
  const deltas = metrics?.momDeltas;
  const history = metrics?.history ?? [];

  // Build horizontal chart data from last 3 snapshots
  const chartData = history.slice(-3).map(s => ({
    month: new Date(s.month).toLocaleString('default', { month: 'short' }),
    revenue: s.revenue,
    spend: s.cogs + s.opex,
  }));

  // Risk pill
  const riskVariant: Record<string, 'danger' | 'warning' | 'success'> = {
    critical: 'danger', high: 'danger', medium: 'warning', low: 'success', unknown: 'warning',
  };

  const riskLabel = risk?.label ?? 'unknown';

  return (
    <div className="p-5 max-w-[1440px] mx-auto space-y-4">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#9CA3AF' }}>
          <span className="text-[#1A56DB]" style={{ fontWeight: 600 }}>RunwayIQ</span>
          <span>/</span>
          <span>Businesses</span>
          <span>/</span>
          <span style={{ color: '#374151', fontWeight: 500 }}>{business?.name ?? '…'}</span>
        </div>
        <div className="flex items-center gap-3">
          {uploadMsg && (
            <span className="text-[10px]" style={{ color: uploadMsg.type === 'success' ? '#059669' : '#E24B4A' }}>
              {uploadMsg.text}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E7EB]"
            style={{ backgroundColor: '#F9FAFB' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span className="text-[10px]" style={{ color: '#374151', fontWeight: 500 }}>
              {business?.name ?? '—'}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[11px] disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#1A56DB', fontWeight: 600 }}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? 'Uploading…' : '+ Upload CSV'}
          </button>
        </div>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <KPI
          label="Monthly Revenue"
          value={loading ? '…' : fmtMoney(latest?.revenue ?? 0)}
          sub={deltas?.revenue != null ? fmtDelta(deltas.revenue) + ' vs last month' : '—'}
          subColor={deltas?.revenue != null && deltas.revenue >= 0 ? '#059669' : '#E24B4A'}
          sparkline={history.slice(-6).map(s => s.revenue)}
          sparkColor="#1A56DB"
        />
        <KPI
          label="Burn Rate"
          value={loading ? '…' : fmtMoney(latest?.burnRate ?? 0)}
          sub={deltas?.netBurn != null ? fmtDelta(deltas.netBurn, true) + ' vs last month' : '—'}
          subColor={deltas?.netBurn != null && deltas.netBurn <= 0 ? '#059669' : '#E24B4A'}
          sparkline={history.slice(-6).map(s => s.burnRate)}
          sparkColor="#E24B4A"
        />
        <KPI
          label="Runway"
          value={loading ? '…' : fmtRunway(latest?.runway ?? 0)}
          sub={(latest?.runway ?? 99) < 3 ? 'Critical — below 3 months' : (latest?.runway ?? 99) < 6 ? 'Low — act soon' : 'Healthy'}
          subColor={(latest?.runway ?? 99) < 3 ? '#E24B4A' : (latest?.runway ?? 99) < 6 ? '#D97706' : '#059669'}
          danger={(latest?.runway ?? 99) < 3}
          sparkline={history.slice(-6).map(s => s.runway).filter(r => r < 999)}
          sparkColor="#1A56DB"
        />
        <KPI
          label="Gross Margin"
          value={loading ? '…' : `${(latest?.grossMargin ?? 0).toFixed(0)}%`}
          sub={(latest?.grossMargin ?? 100) < 40 ? 'below 40% benchmark' : 'above benchmark'}
          subColor={(latest?.grossMargin ?? 100) < 40 ? '#D97706' : '#059669'}
          sparkline={history.slice(-6).map(s => s.grossMargin)}
          sparkColor="#059669"
        />
      </div>

      {/* ── Cash Balance Prompt ───────────────────────────────────────────── */}
      {!loading && business && business.cashOnHand === 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[10px] border"
          style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
          <span className="text-[13px]">💰</span>
          <div className="flex-1">
            <span className="text-[11px]" style={{ color: '#92400E', fontWeight: 600 }}>
              Set your current cash balance to calculate runway
            </span>
            <span className="text-[10px] ml-2" style={{ color: '#B45309' }}>
              Runway = Cash on hand ÷ monthly burn rate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cashInput}
              onChange={e => setCashInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCash()}
              placeholder="e.g. 500000"
              className="w-32 px-3 py-1.5 border border-[#FCD34D] rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
              style={{ backgroundColor: '#FFFDF0', color: '#374151' }}
            />
            <button
              onClick={handleSaveCash}
              disabled={cashSaving || !cashInput}
              className="px-3 py-1.5 rounded-md text-[11px] text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: '#D97706', fontWeight: 600 }}
            >
              {cashSaving ? 'Saving…' : 'Set Balance'}
            </button>
          </div>
        </div>
      )}

      {/* ── Revenue vs Burn + Risk ─────────────────────────────────────────── */}
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        {/* Left: chart + forecast cards */}
        <Card>
          <SectionLabel>Revenue vs Burn</SectionLabel>
          {chartData.length > 0 ? (
            <HorizontalBarChart data={chartData} />
          ) : (
            <div className="py-8 text-center text-[11px]" style={{ color: '#9CA3AF' }}>
              Upload a CSV to see your revenue vs burn chart
            </div>
          )}

          {/* AI anomaly detection */}
          {risk && risk.score >= 50 && risk.drivers.length > 0 && (
            <div className="mt-4 px-3 py-2 rounded-md flex items-center gap-2"
              style={{ backgroundColor: '#FEF3C7' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] shrink-0" />
              <span className="text-[10px]" style={{ color: '#B45309', fontWeight: 500 }}>
                AI detected: {risk.drivers[0]?.name?.toLowerCase()}
              </span>
            </div>
          )}

          {/* 3 forecast mini-cards */}
          {forecast.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {forecast.map((fc) => {
                const label = new Date(fc.month).toLocaleString('default', { month: 'short' });
                const prevRev = latest?.revenue ?? 0;
                const trend = prevRev > 0 ? ((fc.revenue - prevRev) / prevRev) * 100 : 0;
                return (
                  <div key={fc.month}
                    className={`p-3 rounded-md border-[0.5px] ${fc.cashOutRisk ? 'bg-[#FFF5F5] border-[#FCA5A5]' : 'border-[#E5E7EB]'}`}>
                    <div className="text-[9px] uppercase mb-1" style={{ color: '#9CA3AF' }}>{label}</div>
                    <div className="text-[16px] mb-0.5" style={{ color: fc.cashOutRisk ? '#E24B4A' : '#111827', fontWeight: 600 }}>
                      {fmtMoney(fc.revenue)}
                    </div>
                    <div className="text-[9px]" style={{ color: trend >= 0 ? '#059669' : '#E24B4A', fontWeight: 500 }}>
                      {trend >= 0 ? '+' : ''}{trend.toFixed(0)}%
                    </div>
                    {fc.cashOutRisk && (
                      <div className="text-[8px] mt-1" style={{ color: '#E24B4A' }}>cash-out risk</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Risk Score */}
        <Card>
          <SectionLabel>Risk Score</SectionLabel>
          <div className="flex flex-col items-center mb-4">
            <RiskRing score={risk?.score ?? 0} />
            <Pill variant={riskVariant[riskLabel]} size="md">
              {riskLabel.toUpperCase()} RISK
            </Pill>
          </div>
          <div className="space-y-2 mt-2">
            {(risk?.drivers ?? []).map((d, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-[#F3F4F6] last:border-0">
                <span className="text-[12px] truncate pr-2" style={{ color: '#374151' }}>{d.name}</span>
                <span className="text-[12px] shrink-0" style={{ color: '#E24B4A', fontWeight: 600 }}>+{d.points}</span>
              </div>
            ))}
            {!risk && !loading && (
              <p className="text-[10px] text-center py-4" style={{ color: '#9CA3AF' }}>Upload data to see risk drivers</p>
            )}
          </div>
        </Card>
      </div>

      {/* ── What-If Simulator ─────────────────────────────────────────────── */}
      <Card>
        <SectionLabel badge="NEW">What-If Simulator</SectionLabel>
        <div className="flex items-center gap-8">
          {/* Sliders */}
          <div className="flex-1 space-y-4">
            <SliderRow
              label="Cut OPEX by"
              value={opexCut}
              onChange={setOpexCut}
              color="#1A56DB"
            />
            <SliderRow
              label="Revenue target"
              value={revenueTargetK}
              onChange={setRevenueTargetK}
              max={Math.max(300, Math.round((metrics?.latest?.revenue ?? 0) / 100 / 1000) * 3)}
              color="#059669"
              formatter={(v) => `$${v}k`}
            />
          </div>
          {/* Results */}
          <div className="flex items-center gap-6 shrink-0 pl-6 border-l border-[#F3F4F6]">
            {[
              { label: 'New runway',  value: simulate?.simulated.runway != null ? fmtRunway(simulate.simulated.runway) : '—', color: '#059669' },
              { label: 'Risk score',  value: simulate?.simulated.riskScore != null ? String(simulate.simulated.riskScore) : '—', color: '#D97706' },
              {
                label: (simulate?.delta.cashSavedPerMonth ?? 0) >= 0 ? 'Cash saved' : 'Extra burn',
                value: simulate?.delta.cashSavedPerMonth != null ? fmtMoney(Math.abs(simulate.delta.cashSavedPerMonth)) : '—',
                color: (simulate?.delta.cashSavedPerMonth ?? 0) >= 0 ? '#059669' : '#E24B4A',
              },
            ].map(item => (
              <div key={item.label} className="text-center min-w-[72px]">
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#9CA3AF', fontWeight: 600 }}>{item.label}</div>
                <div className="text-[22px] leading-tight" style={{ color: item.color, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Agent Pipeline ────────────────────────────────────────────────── */}
      <Card className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {['Analyst', 'KB retrieval', 'Strategist', 'CFO writer'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  <span className="text-[10px]" style={{ color: '#374151', fontWeight: 500 }}>{step}</span>
                </div>
                {i < arr.length - 1 && <ArrowRight size={11} style={{ color: '#D1D5DB' }} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {report?.agentTimings && (
              <span className="text-[9px]" style={{ color: '#9CA3AF' }}>
                3 agents · {(report.agentTimings.totalMs / 1000).toFixed(1)}s
              </span>
            )}
            <span className="text-[8px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#D1FAE5', color: '#059669', fontWeight: 700 }}>
              {report ? 'complete' : 'ready'}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Agent Detail Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-3">

        {/* Agent 1 — Analyst */}
        <Card className="border-l-[3px] border-l-[#1A56DB]">
          <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#9CA3AF', fontWeight: 700 }}>Agent 1 — Analyst</div>
          <div className="space-y-3">
            {report?.problems?.length ? (
              report.problems.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <SeverityBadge severity={p.severity} />
                  <span className="text-[12px] leading-snug" style={{ color: '#374151' }}>{p.title}</span>
                </div>
              ))
            ) : (
              <p className="text-[12px] py-2" style={{ color: '#9CA3AF' }}>
                Generate a report to see analysis
              </p>
            )}
          </div>
        </Card>

        {/* Agent 2 — Strategist */}
        <Card className="border-l-[3px] border-l-[#7F77DD]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: '#9CA3AF', fontWeight: 700 }}>Agent 2 — Strategist</span>
            {report?.problems?.slice(0, 3).flatMap(p => p.tags?.slice(0, 1) ?? []).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#EBF0FF', color: '#1A56DB', fontWeight: 600 }}>
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          {report?.solutions?.length ? (
            <div className="space-y-4">
              {report.solutions.slice(0, 3).map((s, i) => (
                <div key={i} className="pb-4 border-b border-[#F3F4F6] last:border-0 last:pb-0">
                  <div className="text-[12px] leading-relaxed mb-1.5" style={{ color: '#374151', fontWeight: 500 }}>
                    {s.action.split(/[.!]/)[0].trim()}
                  </div>
                  <div className="text-[11px]" style={{ color: '#059669', fontWeight: 500 }}>
                    {s.estimatedImpact}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] py-2" style={{ color: '#9CA3AF' }}>
              Generate a report to see recommendations
            </p>
          )}
        </Card>

        {/* Knowledge Used */}
        <Card className="border-l-[3px] border-l-[#059669]">
          <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#9CA3AF', fontWeight: 700 }}>Knowledge Used</div>
          <div className="space-y-3">
            {(report?.kbChunksRetrieved?.length ? report.kbChunksRetrieved : [
              'kb-runway-critical', 'kb-burn-rate-high', 'kb-burn-growth', 'kb-revenue-decline',
            ]).slice(0, 5).map((src, i) => {
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
              return (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0 mt-1" />
                  <span className="text-[12px] leading-snug" style={{ color: '#374151' }}>
                    {KB_LABELS[src] ?? src}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── AI CFO Report ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] px-2 py-1 rounded-md"
            style={{ backgroundColor: '#EBF0FF', color: '#1A56DB', fontWeight: 600 }}>
            AI CFO Report
          </span>
          {report && (
            <span className="text-[11px]" style={{ color: '#374151', fontWeight: 500 }}>
              {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          )}
          <span className="text-[9px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#D1FAE5', color: '#059669', fontWeight: 700 }}>
            RAG-grounded
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] disabled:opacity-60 transition-colors hover:bg-[#F9FAFB]"
              style={{ borderColor: '#E5E7EB', color: '#374151' }}
            >
              {generating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {generating ? 'Generating…' : report ? 'Regenerate' : 'Generate Report'}
            </button>
          </div>
        </div>

        {reportError && (
          <div className="mb-3 px-3 py-2 rounded-lg text-[10px]"
            style={{ backgroundColor: '#FFF5F5', color: '#E24B4A', border: '1px solid #FCA5A5' }}>
            {reportError}
          </div>
        )}

        {report ? (
          <>
            <div className="pl-4 mb-5 text-[13px] leading-[1.75]"
              style={{ borderLeft: '3px solid #1A56DB', color: '#374151' }}>
              {report.reportText}
            </div>
            <div className="text-[10px] mb-4 uppercase tracking-widest" style={{ color: '#9CA3AF', fontWeight: 700 }}>
              Recommended actions
            </div>
            <div className="grid grid-cols-3 gap-4">
              {report.actions.slice(0, 3).map((action, i) => (
                <div key={i} className="p-4 rounded-lg border-[0.5px]"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}>
                  <div className="text-[14px] mb-2" style={{ color: '#1A56DB', fontWeight: 800 }}>
                    0{i + 1}
                  </div>
                  <div className="text-[12px] leading-relaxed" style={{ color: '#374151' }}>{action}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="text-[12px] mb-2" style={{ color: '#374151', fontWeight: 500 }}>
              No AI report yet
            </div>
            <div className="text-[11px] mb-4" style={{ color: '#9CA3AF' }}>
              {latest
                ? 'Click "Generate Report" to get your AI-powered CFO brief with RAG-grounded recommendations.'
                : 'Upload a CSV with your transactions first, then generate your report.'}
            </div>
          </div>
        )}
      </Card>

      {/* ── Ask Your CFO ──────────────────────────────────────────────────── */}
      <Card className="pb-0 overflow-hidden">
        <SectionLabel badge="NEW">Ask Your CFO</SectionLabel>

        <div className="max-h-[220px] overflow-y-auto space-y-3 mb-3 pr-1">
          {chatHistory.length === 0 ? (
            <ChatBubble type="ai">
              Hi! I'm your CFO agent. Ask me anything about your financials — burn rate, runway, scenarios, or strategic guidance.
            </ChatBubble>
          ) : (
            chatHistory.map((m, i) => (
              <ChatBubble key={i} type={m.role === 'user' ? 'user' : 'ai'}>{m.content}</ChatBubble>
            ))
          )}
          {chatLoading && <ChatBubble type="ai"><span className="animate-pulse">Thinking…</span></ChatBubble>}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-[#F3F4F6] -mx-4 px-4 py-3 flex gap-2">
          <input
            type="text"
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Ask anything about your finances..."
            className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
            style={{ color: '#374151' }}
          />
          <button
            onClick={sendChat}
            disabled={chatLoading}
            className="px-4 py-2 rounded-md text-white flex items-center gap-1.5 disabled:opacity-60"
            style={{ backgroundColor: '#1A56DB' }}
          >
            <Send size={13} />
            <span className="text-[11px]" style={{ fontWeight: 500 }}>Send</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
