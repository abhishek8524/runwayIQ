interface SliderRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  color?: string;
  hint?: string;
  formatter?: (v: number) => string;
}

export function SliderRow({ label, value, onChange, min = 0, max = 100, color = '#1A56DB', hint, formatter }: SliderRowProps) {
  const display = formatter ? formatter(value) : `${value}%`;
  const fillPct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[12px]" style={{ color: '#374151', fontWeight: 500 }}>
          {label}
        </div>
        <div className="text-[12px]" style={{ color: '#374151', fontWeight: 500 }}>
          {display}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${fillPct}%, #E5E7EB ${fillPct}%, #E5E7EB 100%)`
        }}
      />
      {hint && (
        <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
