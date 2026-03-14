export default function KPICard({ title, value, change }) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-card rounded-xl shadow-sm p-5 flex flex-col gap-1">
      <span className="text-sm text-text-muted">{title}</span>
      <span className="text-2xl font-semibold text-text">{value}</span>
      {change !== undefined && change !== null && (
        <span
          className={`text-xs font-medium ${
            isPositive ? 'text-risk-low' : isNegative ? 'text-risk-high' : 'text-text-muted'
          }`}
        >
          {isPositive ? '+' : ''}{change}%
        </span>
      )}
    </div>
  );
}
