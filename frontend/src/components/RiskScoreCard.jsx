function riskMeta(score) {
  if (score <= 30) return { label: 'Low', color: 'bg-risk-low', text: 'text-risk-low' };
  if (score <= 60) return { label: 'Moderate', color: 'bg-risk-moderate', text: 'text-risk-moderate' };
  return { label: 'High', color: 'bg-risk-high', text: 'text-risk-high' };
}

export default function RiskScoreCard({ score, explanation }) {
  if (score === undefined || score === null) return null;

  const { label, color, text } = riskMeta(score);

  return (
    <div className="bg-card rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-medium text-text-muted mb-4">Risk Assessment</h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className={`text-4xl font-bold ${text}`}>{score}</span>
          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-medium text-white ${color}`}
          >
            {label}
          </span>
        </div>
        {explanation && (
          <p className="text-sm text-text-muted leading-relaxed flex-1">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
