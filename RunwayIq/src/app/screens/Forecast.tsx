import { Pill } from '../components/Pill';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, ForecastMonth, MetricsResponse } from '../../lib/api';
import { fmtMoney, fmtRunway, fmtPct } from '../../lib/format';

export function Forecast() {
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.forecast.get(3),
      api.metrics.get().catch(() => null),
    ])
      .then(([f, m]) => {
        setForecast(f);
        setMetrics(m);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const latest = metrics?.latest;
  const deltas = metrics?.momDeltas;

  const metricTrends = latest ? [
    { label: 'Revenue', value: fmtMoney(latest.revenue), change: fmtPct(deltas?.revenue ?? null), direction: (deltas?.revenue ?? 0) >= 0 ? 'up' : 'down' as 'up' | 'down', color: '#059669' },
    { label: 'Burn', value: fmtMoney(latest.burnRate), change: fmtPct(deltas?.netBurn ?? null), direction: (deltas?.netBurn ?? 0) <= 0 ? 'up' : 'down' as 'up' | 'down', color: '#E24B4A' },
    { label: 'Margin', value: `${latest.grossMargin.toFixed(1)}%`, change: fmtPct(deltas?.grossMargin ?? null), direction: (deltas?.grossMargin ?? 0) >= 0 ? 'up' : 'down' as 'up' | 'down', color: '#D97706' },
    { label: 'Runway', value: fmtRunway(latest.runway), change: fmtPct(deltas?.runway ?? null), direction: (deltas?.runway ?? 0) >= 0 ? 'up' : 'down' as 'up' | 'down', color: latest.runway < 3 ? '#E24B4A' : '#374151' },
  ] : [];

  const cashOutMonths = forecast.filter(f => f.cashOutRisk);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">
      <div className="mb-6">
        <div className="text-[20px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>
          Financial Forecast
        </div>
        <div className="text-[12px]" style={{ color: '#9CA3AF' }}>
          3-month projection with confidence intervals
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[12px]" style={{ color: '#9CA3AF' }}>Loading forecast…</div>
      ) : error ? (
        <div className="text-center py-16 text-[12px]" style={{ color: '#E24B4A' }}>{error}</div>
      ) : forecast.length === 0 ? (
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-8 text-center">
          <div className="text-[12px] mb-2" style={{ color: '#374151', fontWeight: 500 }}>No forecast data yet</div>
          <div className="text-[11px]" style={{ color: '#9CA3AF' }}>Upload a transaction CSV to generate your financial forecast.</div>
        </div>
      ) : (
        <>
          {/* Month Cards */}
          <div className="grid grid-cols-3 gap-4">
            {forecast.map(card => {
              const isDanger = card.cashOutRisk;
              const monthLabel = new Date(card.month).toLocaleString('default', { month: 'short', year: 'numeric' });
              const prevIdx = forecast.indexOf(card) - 1;
              const prevRevenue = prevIdx >= 0 ? forecast[prevIdx].revenue : (latest?.revenue ?? 0);
              const trend = prevRevenue > 0 ? ((card.revenue - prevRevenue) / prevRevenue) * 100 : 0;
              const bandWidth = card.high - card.low;
              const confidence = bandWidth > 0 ? Math.round(Math.min(95, Math.max(30, 80 - (bandWidth / card.revenue) * 30))) : 65;

              return (
                <div
                  key={card.month}
                  className={`border-[0.5px] rounded-[10px] p-[14px] ${isDanger ? 'bg-[#FFF5F5] border-[#FCA5A5]' : 'bg-white border-[#E5E7EB]'}`}
                >
                  <div className="mb-3">
                    <div className="text-[10px] uppercase mb-2" style={{ color: '#9CA3AF' }}>{monthLabel}</div>
                    <div className={`text-[24px] mb-1 ${isDanger ? 'text-[#E24B4A]' : 'text-[#374151]'}`} style={{ fontWeight: 500 }}>
                      {fmtMoney(card.revenue)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] ${trend >= 0 ? 'text-[#059669]' : 'text-[#E24B4A]'}`} style={{ fontWeight: 500 }}>
                        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                      </span>
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>vs prior month</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-[8px] uppercase mb-2" style={{ color: '#9CA3AF' }}>Confidence Band</div>
                    <div className="h-[28px] bg-[#F3F4F6] rounded-md relative overflow-hidden">
                      <div
                        className={`h-full ${isDanger ? 'bg-[#FEE2E2]' : 'bg-[#EBF0FF]'}`}
                        style={{ width: `${confidence}%` }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 w-0.5 ${isDanger ? 'bg-[#E24B4A]' : 'bg-[#1A56DB]'}`}
                        style={{ left: `${confidence / 2}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[8px]" style={{ color: '#9CA3AF' }}>
                      <span>{fmtMoney(card.low)}</span>
                      <span>{fmtMoney(card.high)}</span>
                    </div>
                  </div>

                  <Pill variant={isDanger ? 'danger' : 'info'} size="sm">
                    {confidence}% CONFIDENCE
                  </Pill>
                </div>
              );
            })}
          </div>

          {/* Metric Trends */}
          {metricTrends.length > 0 && (
            <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
              <div className="mb-4">
                <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Key Metric Trends</div>
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Month-over-month changes</div>
              </div>
              <div className="space-y-3">
                {metricTrends.map(metric => (
                  <div key={metric.label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-[11px] w-20" style={{ color: '#9CA3AF' }}>{metric.label}</div>
                      <div className="text-[14px]" style={{ color: metric.color, fontWeight: 500 }}>{metric.value}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {metric.direction === 'up'
                        ? <TrendingUp size={14} style={{ color: metric.color }} />
                        : <TrendingDown size={14} style={{ color: metric.color }} />
                      }
                      <span className="text-[12px]" style={{ color: metric.color, fontWeight: 500 }}>{metric.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
            <div className="flex items-center gap-2 mb-3">
              <Pill variant="warning" size="sm">AI INSIGHT</Pill>
              <div className="text-[12px]" style={{ color: '#374151', fontWeight: 500 }}>Forecast Analysis</div>
            </div>
            <div className="space-y-2 text-[11px]" style={{ color: '#374151' }}>
              {cashOutMonths.length > 0 ? (
                <>
                  <p>
                    {cashOutMonths.map(m => new Date(m.month).toLocaleString('default', { month: 'long' })).join(', ')} show
                    {cashOutMonths.length > 1 ? '' : 's'} critical cash depletion risk based on your current burn trajectory.
                    Recommended actions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Implement immediate OPEX reduction</li>
                    <li>Accelerate accounts receivable collection</li>
                    <li>Consider bridge financing or extended runway plan</li>
                  </ul>
                  <div className="mt-3 p-2 rounded-md" style={{ backgroundColor: '#FEF3C7' }}>
                    <span className="text-[10px]" style={{ color: '#D97706', fontWeight: 500 }}>
                      Cash-out risk detected in {cashOutMonths.length} projected month{cashOutMonths.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </>
              ) : (
                <p>
                  Based on current revenue trajectory, your cash position looks stable over the next 3 months.
                  Continue monitoring burn rate to maintain healthy runway.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
