import { SliderRow } from '../components/SliderRow';
import { Pill } from '../components/Pill';
import { useState, useEffect, useRef } from 'react';
import { api, SimulateResponse, MetricsResponse } from '../../lib/api';
import { fmtMoney, fmtRunway } from '../../lib/format';

export function WhatIf() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [opexCut, setOpexCut] = useState(15);
  const [revenueGrowth, setRevenueGrowth] = useState(25);
  const [cashInfusion, setCashInfusion] = useState(0);
  const [cogsCut, setCogsCut] = useState(10);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.metrics.get().then(setMetrics).catch(() => null);
  }, []);

  useEffect(() => {
    if (!metrics?.latest) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const currentRevDollars = metrics.latest!.revenue / 100;
      const targetRevDollars = currentRevDollars * (1 + revenueGrowth / 100) + cashInfusion * 1000;
      setSimLoading(true);
      api.simulate
        .run({ opexCutPercent: opexCut, revenueTarget: targetRevDollars })
        .then(setResult)
        .catch(() => null)
        .finally(() => setSimLoading(false));
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [opexCut, revenueGrowth, cashInfusion, cogsCut, metrics]);

  const current = result?.current;
  const simulated = result?.simulated;
  const delta = result?.delta;

  const comparisonMetrics = current && simulated ? [
    { label: 'Monthly Burn', base: fmtMoney(current.burnRate), new: fmtMoney(simulated.burnRate), impact: simulated.burnRate <= current.burnRate ? 'positive' : 'negative' as 'positive' | 'negative' },
    { label: 'Revenue', base: fmtMoney(current.revenue), new: fmtMoney(simulated.revenue), impact: simulated.revenue >= current.revenue ? 'positive' : 'negative' as 'positive' | 'negative' },
    { label: 'Gross Margin', base: `${current.grossMargin.toFixed(1)}%`, new: `${simulated.grossMargin.toFixed(1)}%`, impact: simulated.grossMargin >= current.grossMargin ? 'positive' : 'negative' as 'positive' | 'negative' },
    { label: 'OPEX', base: fmtMoney(current.opex), new: fmtMoney(simulated.opex), impact: simulated.opex <= current.opex ? 'positive' : 'negative' as 'positive' | 'negative' },
    { label: 'Risk Score', base: String(current.riskScore ?? '—'), new: String(simulated.riskScore ?? '—'), impact: (simulated.riskScore ?? 100) <= (current.riskScore ?? 100) ? 'positive' : 'negative' as 'positive' | 'negative' },
  ] : [];

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">
      <div className="mb-6">
        <div className="text-[20px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
          What-If Simulator
        </div>
        <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
          Model financial scenarios and impact
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.6fr] gap-4">
        {/* Left Column: Controls */}
        <div className="space-y-4">
          {/* Sliders Card */}
          <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
            <div className="mb-4">
              <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Scenario Parameters</div>
              <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Adjust levers to model impact</div>
            </div>
            <div className="space-y-5">
              <SliderRow label="OPEX Reduction" value={opexCut} onChange={setOpexCut} color="#1A56DB" hint="Cut operational expenses" />
              <SliderRow label="Revenue Growth Target" value={revenueGrowth} onChange={setRevenueGrowth} color="#059669" hint="Increase monthly revenue %" />
              <SliderRow label="Cash Infusion ($K)" value={cashInfusion} onChange={setCashInfusion} color="#D97706" hint="External financing" />
              <SliderRow label="COGS Optimization" value={cogsCut} onChange={setCogsCut} color="#1A56DB" hint="Reduce cost of goods sold" />
            </div>
          </div>

          {/* Baseline context */}
          {metrics?.latest && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-3">
                <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Current Baseline</div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Runway', value: fmtRunway(metrics.latest.runway) },
                  { label: 'Burn Rate', value: fmtMoney(metrics.latest.burnRate) + '/mo' },
                  { label: 'Revenue', value: fmtMoney(metrics.latest.revenue) + '/mo' },
                  { label: 'Gross Margin', value: metrics.latest.grossMargin.toFixed(1) + '%' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-[10px]">
                    <span style={{ color: '#9CA3AF' }}>{item.label}</span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-4">
          {/* KPI Results */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>New Runway</div>
              {current && <div className="mb-1"><span className="text-[12px] line-through" style={{ color: '#9CA3AF' }}>{fmtRunway(current.runway)}</span></div>}
              <div className="text-[24px] mb-1 text-[#059669]" style={{ fontWeight: 500 }}>
                {simLoading ? '…' : simulated ? fmtRunway(simulated.runway) : '—'}
              </div>
              {delta && <div className="text-[10px] text-[#059669]" style={{ fontWeight: 500 }}>+{delta.runwayMonths.toFixed(1)} mo</div>}
            </div>

            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Risk Score</div>
              {current?.riskScore != null && <div className="mb-1"><span className="text-[12px] line-through" style={{ color: '#9CA3AF' }}>{current.riskScore}</span></div>}
              <div className="text-[24px] mb-1 text-[#D97706]" style={{ fontWeight: 500 }}>
                {simLoading ? '…' : simulated?.riskScore ?? '—'}
              </div>
              {delta && simulated?.riskScore != null && current?.riskScore != null && (
                <div className="text-[10px] text-[#059669]" style={{ fontWeight: 500 }}>
                  {delta.riskScoreChange <= 0 ? delta.riskScoreChange : `+${delta.riskScoreChange}`} pts
                </div>
              )}
            </div>

            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Cash Saved</div>
              <div className="text-[24px] mb-1 text-[#059669]" style={{ fontWeight: 500 }}>
                {simLoading ? '…' : delta ? fmtMoney(delta.cashSavedPerMonth) : '—'}
              </div>
              <div className="text-[10px]" style={{ color: '#9CA3AF' }}>per month</div>
            </div>
          </div>

          {/* Before/After Comparison */}
          {comparisonMetrics.length > 0 && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Before / After Comparison</div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Impact analysis</div>
              </div>
              <div className="space-y-3">
                {comparisonMetrics.map(metric => (
                  <div key={metric.label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                    <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{metric.label}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{metric.base}</span>
                      <span className="text-[11px]" style={{ color: '#374151' }}>→</span>
                      <span className="text-[12px] min-w-[50px] text-right" style={{ color: '#374151', fontWeight: 500 }}>{metric.new}</span>
                      <Pill variant={metric.impact === 'positive' ? 'success' : 'danger'} size="sm">
                        {metric.impact === 'positive' ? '✓' : '!'}
                      </Pill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-[#EBF0FF] border-[0.5px] border-[#1A56DB] rounded-[10px] p-[14px]">
            <div className="flex items-center gap-2 mb-3">
              <Pill variant="info" size="sm">AI ANALYSIS</Pill>
              <div className="text-[12px]" style={{ color: '#374151', fontWeight: 500 }}>Scenario Assessment</div>
            </div>
            <div className="space-y-2 text-[11px]" style={{ color: '#374151' }}>
              {delta ? (
                <>
                  <p>
                    By implementing a {opexCut}% OPEX reduction and targeting {revenueGrowth}% revenue growth, you can:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Extend runway by {delta.runwayMonths.toFixed(1)} months</li>
                    {delta.cashSavedPerMonth > 0 && <li>Save {fmtMoney(delta.cashSavedPerMonth)} per month</li>}
                    {delta.riskScoreChange < 0 && <li>Reduce financial risk by {Math.abs(delta.riskScoreChange)} points</li>}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-[#1A56DB]/20">
                    <div className="text-[10px]" style={{ color: '#1A56DB', fontWeight: 500 }}>
                      Recommendation: Proceed with phased implementation over 45 days
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  {metrics?.latest
                    ? 'Adjust the scenario parameters above to see projected impact on your runway, risk score, and cash savings.'
                    : 'Upload financial data to enable the What-If simulator.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
