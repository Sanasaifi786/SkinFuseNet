import React, { useState } from 'react';

const CLASS_NAMES = {
  AKIEC: 'Actinic Keratosis',
  BCC: 'Basal Cell Carcinoma',
  BKL: 'Benign Keratosis',
  DF: 'Dermatofibroma',
  MEL: 'Melanoma',
  NV: 'Melanocytic Nevus',
  VASC: 'Vascular Lesion',
};

const HIGH_RISK_CLASSES = ['MEL', 'BCC', 'AKIEC'];

export default function ResultsPanel({ result, originalImage }) {
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'original'

  if (!result) return null;

  const isHighRisk = HIGH_RISK_CLASSES.includes(result.predicted_class);
  const fullName = CLASS_NAMES[result.predicted_class] || result.predicted_class;
  const confidencePct = (result.confidence * 100).toFixed(1);

  // Sort probabilities in descending order
  const sortedProbabilities = Object.entries(result.probabilities || {})
    .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-2xl border border-slate-800 space-y-6 animate-fadeIn">
      {/* Header / Diagnosis summary */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Diagnostic Assessment
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isHighRisk
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isHighRisk ? '⚠️ High Risk' : '✓ Low / Benign Risk'}
          </span>
          <span className="text-xl font-bold text-white">{fullName}</span>
          <span className="text-sm text-slate-400 font-mono">({confidencePct}%)</span>
        </div>
      </div>

      {/* Visual Explainability (Grad-CAM) */}
      {result.gradcam_image && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🔬</span> AI Attention Map (Grad-CAM)
            </h4>
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('heatmap')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'heatmap'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Heatmap
              </button>
              {originalImage && (
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'original'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-square max-w-[280px] mx-auto rounded-lg overflow-hidden border border-slate-700/60 bg-black/40 flex items-center justify-center">
            {activeTab === 'heatmap' ? (
              <img
                src={
                  result.gradcam_image.startsWith('data:')
                    ? result.gradcam_image
                    : `data:image/png;base64,${result.gradcam_image}`
                }
                alt="Grad-CAM visual explanation"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={originalImage}
                alt="Original skin lesion"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Color scale guide */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Low Focus
            </span>
            <span className="text-slate-500 font-mono">← Attention Spectrum →</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> High Focus (Lesion Core)
            </span>
          </div>
        </div>
      )}

      {/* Class Probabilities Distribution */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Class Probability Distribution
        </h4>
        <div className="space-y-2.5">
          {sortedProbabilities.map(([key, value]) => {
            const prob = parseFloat(value);
            const isWinner = key === result.predicted_class;
            const isDanger = HIGH_RISK_CLASSES.includes(key);

            let barColor = 'bg-blue-500';
            if (isDanger && isWinner) barColor = 'bg-red-500';
            else if (!isDanger && isWinner) barColor = 'bg-emerald-500';
            else if (isDanger) barColor = 'bg-amber-500/70';

            return (
              <div key={key} className="text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className={isWinner ? 'text-white font-semibold' : 'text-slate-400'}>
                    {CLASS_NAMES[key] || key}
                  </span>
                  <span className="font-mono text-slate-300">{prob.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${prob}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
