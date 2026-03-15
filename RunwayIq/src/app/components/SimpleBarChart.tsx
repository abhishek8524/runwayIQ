interface BarChartData {
  month: string;
  revenue: number;
  burn: number;
}

interface SimpleBarChartProps {
  data: BarChartData[];
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxValue = Math.max(1, ...data.flatMap(d => [Math.abs(d.revenue), Math.abs(d.burn)]));
  const chartHeight = 180;
  const barWidth = 24;
  const groupGap = 40;
  
  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <div className="relative h-full flex items-end justify-around px-8">
        {data.map((item, index) => {
          const revenueHeight = (Math.abs(item.revenue) / maxValue) * (chartHeight - 40);
          const burnHeight = (Math.abs(item.burn) / maxValue) * (chartHeight - 40);
          
          return (
            <div key={item.month} className="flex flex-col items-center" style={{ gap: '8px' }}>
              <div className="flex items-end gap-2">
                <div
                  className="rounded-t"
                  style={{
                    width: barWidth,
                    height: revenueHeight,
                    backgroundColor: '#1A56DB',
                  }}
                />
                <div
                  className="rounded-t"
                  style={{
                    width: barWidth,
                    height: burnHeight,
                    backgroundColor: '#E24B4A',
                  }}
                />
              </div>
              <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                {item.month}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
