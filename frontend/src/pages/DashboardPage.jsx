import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import KPICard from '../components/KPICard';
import RevenueChart from '../components/RevenueChart';
import ForecastCards from '../components/ForecastCards';
import RiskScoreCard from '../components/RiskScoreCard';
import CFOReportCard from '../components/CFOReportCard';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  getBusinessId,
  getMetricsSnapshot,
  getMetricsHistory,
  getForecast,
  getRiskScore,
  getLatestReport,
} from '../api/client';

const fmtCurrency = (v) =>
  `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtRunway = (v) => `${Number(v).toFixed(1)} months`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [risk, setRisk] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const businessId = getBusinessId();
    if (!businessId) {
      navigate('/', { replace: true });
      return;
    }

    const fetchAll = async () => {
      try {
        const [snapRes, histRes, foreRes, riskRes, reportRes] = await Promise.all([
          getMetricsSnapshot(businessId),
          getMetricsHistory(businessId),
          getForecast(businessId),
          getRiskScore(businessId),
          getLatestReport(businessId),
        ]);
        setSnapshot(snapRes.data);
        setHistory(histRes.data);
        setForecast(foreRes.data);
        setRisk(riskRes.data);
        setReport(reportRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg">
      <TopBar businessName={getBusinessId()} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-risk-high/10 border border-risk-high/20 rounded-xl">
            <p className="text-sm text-risk-high">{error}</p>
          </div>
        )}

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="space-y-6">
            {snapshot && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Revenue"
                  value={fmtCurrency(snapshot.revenue)}
                  change={snapshot.revenueChange}
                />
                <KPICard
                  title="Expenses"
                  value={fmtCurrency(snapshot.expenses)}
                  change={snapshot.expensesChange}
                />
                <KPICard
                  title="Burn Rate"
                  value={fmtCurrency(snapshot.burnRate)}
                  change={snapshot.burnRateChange}
                />
                <KPICard
                  title="Runway"
                  value={fmtRunway(snapshot.runway)}
                />
              </div>
            )}

            <RevenueChart data={history} />

            <ForecastCards forecasts={forecast} />

            {risk && (
              <RiskScoreCard
                score={risk.score}
                explanation={risk.explanation}
              />
            )}

            {report && <CFOReportCard report={report.report ?? report.text ?? report} />}
          </div>
        )}
      </main>
    </div>
  );
}
