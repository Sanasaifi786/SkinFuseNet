import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

const CLASS_NAMES = {
  AKIEC: { fullName: 'Actinic Keratosis', severity: 'pre-malignant', protocol: 'Requires localized treatment (cryotherapy/topical) and vigilant monitoring to prevent squamous cell carcinoma progression.' },
  BCC: { fullName: 'Basal Cell Carcinoma', severity: 'malignant', protocol: 'Schedule biopsy. Surgical excision is typically curative, but prompt intervention prevents local tissue destruction.' },
  BKL: { fullName: 'Benign Keratosis', severity: 'benign', protocol: 'No immediate action required. Routine annual full-body skin check recommended.' },
  DF: { fullName: 'Dermatofibroma', severity: 'benign', protocol: 'Benign fibroblastic proliferation. Reassure patient; no excision necessary unless symptomatic.' },
  MEL: { fullName: 'Melanoma', severity: 'malignant', protocol: 'URGENT: Immediate excision biopsy required. Perform full lymph node examination. High risk of metastasis.' },
  NV: { fullName: 'Melanocytic Nevus', severity: 'benign', protocol: 'Standard benign mole. Monitor for changes using ABCDE criteria.' },
  VASC: { fullName: 'Vascular Lesion', severity: 'benign', protocol: 'Benign vascular anomaly. Laser therapy is an option for cosmetic concerns, but medically safe.' },
};

const HIGH_RISK_CLASSES = ['MEL', 'BCC', 'AKIEC'];

export default function ResultsPanel({ result, originalImage }) {
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'original'

  if (!result) return null;

  const topClassCode = result.predicted_class;
  const topClassInfo = CLASS_NAMES[topClassCode] || { fullName: topClassCode, severity: 'benign', protocol: '' };
  const confidencePct = (result.confidence * 100).toFixed(1);

  // Sort probabilities in descending order
  const sortedProbabilities = Object.entries(result.probabilities || {})
    .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Diagnostic Analysis & Recommendation
        </span>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
            topClassInfo.severity === 'malignant'
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : topClassInfo.severity === 'pre-malignant'
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          {topClassInfo.severity === 'malignant'
            ? 'Urgent: Malignant'
            : topClassInfo.severity === 'pre-malignant'
            ? 'Pre-Malignant'
            : 'Benign (Low Risk)'}
        </span>
      </div>

      {/* Primary diagnosis card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Classification Result [{topClassCode}]
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
            {topClassInfo.fullName}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <div className="text-3xl font-black text-blue-700 font-mono">
            {confidencePct}%
          </div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
            Model Confidence
          </div>
        </div>
      </div>

      {/* Clinical Action Recommendation */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 ${
          topClassInfo.severity === 'malignant'
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : topClassInfo.severity === 'pre-malignant'
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}
      >
        {topClassInfo.severity === 'malignant' ? (
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        ) : topClassInfo.severity === 'pre-malignant' ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-sm">Recommended Protocol</div>
          <p className="leading-relaxed opacity-90">
            {topClassInfo.protocol}
          </p>
        </div>
      </div>

      {/* Visual Explainability (Grad-CAM) */}
      {result.gradcam_image && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              AI Attention Map (Grad-CAM)
            </h4>
            <div className="flex bg-slate-200 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('heatmap')}
                className={`px-3 py-1 rounded-md transition ${
                  activeTab === 'heatmap'
                    ? 'bg-white text-blue-700 shadow border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Heatmap
              </button>
              {originalImage && (
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'original'
                      ? 'bg-white text-blue-700 shadow border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-square max-w-[280px] mx-auto rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {activeTab === 'heatmap' ? (
              <img
                src={
                  result.gradcam_image.startsWith('data:')
                    ? result.gradcam_image
                    : `data:image/png;base64,${result.gradcam_image}`
                }
                alt="Grad-CAM visual explanation"
                className="w-full h-full object-cover mix-blend-multiply"
              />
            ) : (
              <img
                src={originalImage}
                alt="Original skin lesion"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      )}

      {/* Class Probabilities Distribution */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Probability Distribution Across HAM10000 7 Classes:
        </span>
        <div className="space-y-2 text-xs">
          {sortedProbabilities.map(([key, value]) => {
            const prob = (parseFloat(value) * 100).toFixed(1);
            const isTop = key === result.predicted_class;

            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={`w-12 font-mono text-[11px] font-bold ${
                    isTop ? 'text-blue-700' : 'text-slate-500'
                  }`}
                >
                  {key}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isTop ? 'bg-blue-600' : 'bg-slate-400'
                    }`}
                    style={{ width: `${prob}%` }}
                  />
                </div>
                <span
                  className={`w-10 text-right font-mono text-[11px] ${
                    isTop ? 'text-blue-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  {prob}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
