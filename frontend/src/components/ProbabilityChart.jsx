import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer
} from 'recharts';

// Full clinical names mapping for clear patient-facing display
const CLASS_LABELS = {
  MEL: 'Melanoma (MEL)',
  NV: 'Melanocytic Nevi (NV)',
  BKL: 'Benign Keratosis (BKL)',
  BCC: 'Basal Cell Carcinoma (BCC)',
  AKIEC: 'Actinic Keratoses (AKIEC)',
  VASC: 'Vascular Lesion (VASC)',
  DF: 'Dermatofibroma (DF)'
};

export default function ProbabilityChart({ probabilities = {}, predictedClass = '' }) {
  // 1. Transform probabilities dictionary into sorted array for Recharts
  const data = Object.entries(probabilities)
    .map(([code, value]) => ({
      code: code.toUpperCase(),
      name: CLASS_LABELS[code.toUpperCase()] || code.toUpperCase(),
      percentage: Number((value * 100).toFixed(1)),
      isTop: code.toUpperCase() === predictedClass.toUpperCase()
    }))
    .sort((a, b) => b.percentage - a.percentage); // Sort highest to lowest

  // Custom modern tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-slate-700">
          <p className="font-semibold">{item.name}</p>
          <p className="text-sky-400 font-mono mt-0.5">{item.percentage.toFixed(2)}% probability</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase">
          Differential Diagnosis Distribution
        </h3>
        <span className="text-xs text-slate-500 font-medium">All 7 Classes</span>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
          No probability data available
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                type="category"
                dataKey="code"
                tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }}
                axisLine={{ stroke: '#cbd5e1' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              <Bar
                dataKey="percentage"
                radius={[0, 6, 6, 0]}
                barSize={18}
                label={{
                  position: 'right',
                  formatter: (v) => `${v}%`,
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#475569'
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.code}`}
                    fill={entry.isTop ? '#1565C0' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
