const fmtCurrency = (v) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function ForecastCards({ forecasts }) {
  if (!forecasts || forecasts.length === 0) return null;

  const labels = ['Next Month', 'Month 2', 'Month 3'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {forecasts.slice(0, 3).map((f, i) => (
        <div key={i} className="bg-card rounded-xl shadow-sm p-5">
          <span className="text-sm text-text-muted">{labels[i]}</span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-xl font-semibold text-text">
              {fmtCurrency(f.revenue)}
            </span>
            <span className="text-xs text-text-muted">revenue</span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-lg font-medium text-accent">
              {fmtCurrency(f.expenses)}
            </span>
            <span className="text-xs text-text-muted">expenses</span>
          </div>
        </div>
      ))}
    </div>
  );
}
