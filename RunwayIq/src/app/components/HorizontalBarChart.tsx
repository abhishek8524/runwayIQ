import { fmtMoney } from '../../lib/format';

interface HBarItem {
  month: string;
  revenue: number;  // cents
  spend: number;    // cents (total outflows = cogs + opex)
}

interface HorizontalBarChartProps {
  data: HBarItem[];
}

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  const maxVal = Math.max(1, ...data.flatMap(d => [d.revenue, d.spend]));

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#1A56DB]" />
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#E24B4A]" />
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Burn</span>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {data.map((item) => {
          const revPct = (item.revenue / maxVal) * 100;
          const spendPct = (item.spend / maxVal) * 100;
          return (
            <div key={item.month} className="space-y-1">
              {/* Revenue row */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] w-7 text-right shrink-0" style={{ color: '#9CA3AF' }}>
                  {item.month}
                </span>
                <div className="flex-1 h-[14px] bg-[#F3F4F6] rounded-[3px] overflow-hidden">
                  <div
                    className="h-full bg-[#1A56DB] rounded-[3px] transition-all duration-500"
                    style={{ width: `${revPct}%` }}
                  />
                </div>
                <span className="text-[9px] w-12 text-right shrink-0" style={{ color: '#374151', fontWeight: 500 }}>
                  {fmtMoney(item.revenue)}
                </span>
              </div>
              {/* Spend/Burn row */}
              <div className="flex items-center gap-2">
                <div className="w-7 shrink-0" />
                <div className="flex-1 h-[10px] bg-[#F3F4F6] rounded-[3px] overflow-hidden">
                  <div
                    className="h-full bg-[#E24B4A] rounded-[3px] transition-all duration-500"
                    style={{ width: `${spendPct}%` }}
                  />
                </div>
                <span className="text-[9px] w-12 text-right shrink-0" style={{ color: '#9CA3AF' }}>
                  {fmtMoney(item.spend)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
