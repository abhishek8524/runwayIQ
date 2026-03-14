import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const fmt = (v) =>
  `$${(v / 1000).toFixed(0)}k`;

export default function RevenueChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.slice(-6).map((d) => ({
    month: d.month,
    Revenue: d.revenue,
    Burn: d.burn,
  }));

  return (
    <div className="bg-card rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-medium text-text-muted mb-4">
        Revenue vs Burn Rate
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 12, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <Tooltip
            formatter={(v) => [`$${v.toLocaleString()}`, undefined]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,.1)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Revenue"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Burn"
            stroke="#7C3AED"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
