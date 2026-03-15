interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = {
    critical: { bg: '#FEE2E2', text: '#991B1B' },
    high: { bg: '#FEE2E2', text: '#E24B4A' },
    medium: { bg: '#FEF3C7', text: '#D97706' },
    low: { bg: '#D1FAE5', text: '#059669' },
  };
  
  const { bg, text } = config[severity];
  
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[8px] uppercase tracking-wide"
      style={{ backgroundColor: bg, color: text, fontWeight: 500 }}
    >
      {severity}
    </span>
  );
}
