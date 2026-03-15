interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  sparkline?: number[];
  variant?: 'default' | 'danger';
  progress?: number;
}

export function KPICard({ label, value, subtitle, sparkline, variant = 'default', progress }: KPICardProps) {
  const isDanger = variant === 'danger';
  
  return (
    <div className={`bg-white border-[0.5px] rounded-[10px] p-[14px] ${
      isDanger ? 'bg-[#FFF5F5] border-[#FCA5A5]' : 'border-[#E5E7EB]'
    }`}>
      <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
        {label}
      </div>
      <div className={`text-[20px] mb-1 ${isDanger ? 'text-[#E24B4A]' : 'text-[#374151]'}`} style={{ fontWeight: 500 }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[8px] mb-2" style={{ color: '#9CA3AF' }}>
          {subtitle}
        </div>
      )}
      {sparkline && (
        <div className="flex items-end gap-[2px] h-[16px]">
          {sparkline.map((val, i) => (
            <div
              key={i}
              className={`w-[5px] rounded-sm ${isDanger ? 'bg-[#E24B4A]' : 'bg-[#1A56DB]'}`}
              style={{ height: `${val}%` }}
            />
          ))}
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-2 h-[4px] bg-[#FEE2E2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E24B4A] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
