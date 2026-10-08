import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Cpu,
  Brain,
  FileText,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { EnsemblePrediction, LesionClassCode } from '../types';
import { HAM10000_CLASSES } from '../data/lesionData';

interface EnsembleTelemetryProps {
  prediction: EnsemblePrediction;
  isClinical: boolean;
  onSaveToRecords: () => void;
}

export const EnsembleTelemetry: React.FC<EnsembleTelemetryProps> = ({
  prediction,
  isClinical,
  onSaveToRecords
}) => {
  const topInfo = HAM10000_CLASSES[prediction.topClass];
  const allCodes: LesionClassCode[] = ['MEL', 'BCC', 'AKIEC', 'NV', 'BKL', 'DF', 'VASC'];

  // Sort classes by predicted probability
  const sortedProbabilities = [...allCodes].sort(
    (a, b) => prediction.classProbabilities[b] - prediction.classProbabilities[a]
  );

  return (
    <div className="space-y-4" id="ensemble-telemetry-root">
      {/* Primary Diagnosis Header Card */}
      <div
        id="primary-diagnosis-card"
        className={`p-5 rounded-2xl border transition-all ${
          isClinical
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-lg'
            : 'bg-white border-stone-200 text-stone-900 shadow-md'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  topInfo.isMalignant
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : topInfo.severity === 'pre-malignant'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}
              >
                HAM10000: {topInfo.code}
              </span>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  topInfo.isMalignant
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : topInfo.severity === 'pre-malignant'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {topInfo.isMalignant ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Malignant Neoplasm</span>
                  </>
                ) : topInfo.severity === 'pre-malignant' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Pre-Malignant / In-Situ</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Benign Lesion</span>
                  </>
                )}
              </span>

              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isClinical ? 'bg-slate-800 text-slate-300' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Uncertainty: ±{prediction.uncertaintyScore}%
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
              {topInfo.fullName}
              <span
                className={`text-sm font-normal ml-2 ${
                  isClinical ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                ({topInfo.commonName})
              </span>
            </h2>
          </div>

          {/* Large Confidence Badge */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono tracking-tight">
                {prediction.topConfidence}%
              </span>
            </div>
            <span
              className={`text-[11px] uppercase tracking-wider font-semibold ${
                isClinical ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              Ensemble Confidence
            </span>
          </div>
        </div>

        {/* Clinical Action Recommendation Box */}
        <div
          className={`p-3.5 rounded-xl border mb-4 ${
            prediction.urgencyLevel === 'critical'
              ? isClinical
                ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-900'
              : prediction.urgencyLevel === 'moderate'
              ? isClinical
                ? 'bg-amber-950/30 border-amber-900/60 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
              : isClinical
              ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recommended Clinical Protocol</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed">{topInfo.clinicalProtocol}</p>
        </div>

        {/* Multi-Modal Sub-Model Weight Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Multi-Modal Parallel Architecture Weights
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* CNN Branch */}
            <div
              className={`p-3 rounded-xl border ${
                isClinical
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold flex items-center gap-1 text-cyan-400">
                  <Cpu className="w-3.5 h-3.5" />
                  CNN Branch
                </span>
                <span className="font-mono text-[11px] opacity-75">35% w</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-200">
                {prediction.modelSubScores.cnn.confidence}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {prediction.modelSubScores.cnn.featureHighlights.join(', ')}
              </p>
            </div>

            {/* ViT Branch */}
            <div
              className={`p-3 rounded-xl border ${
                isClinical
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold flex items-center gap-1 text-rose-400">
                  <Brain className="w-3.5 h-3.5" />
                  ViT Branch
                </span>
                <span className="font-mono text-[11px] opacity-75">40% w</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-200">
                {prediction.modelSubScores.vit.confidence}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {prediction.modelSubScores.vit.featureHighlights.join(', ')}
              </p>
            </div>

            {/* BERT Branch */}
            <div
              className={`p-3 rounded-xl border ${
                isClinical
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold flex items-center gap-1 text-amber-400">
                  <FileText className="w-3.5 h-3.5" />
                  Clinical BERT
                </span>
                <span className="font-mono text-[11px] opacity-75">25% w</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-200">
                {prediction.modelSubScores.bert.confidence}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {prediction.modelSubScores.bert.riskFactorContribution[0] || 'Demographic risk'}
              </p>
            </div>
          </div>
        </div>

        {/* Save to Patient Chart button */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span
            className={`text-[11px] ${isClinical ? 'text-slate-400' : 'text-stone-500'}`}
          >
            Verified with SAM Zero-Shot Segmentation & CLAHE Normalization
          </span>
          <button
            id="save-to-patient-chart-btn"
            type="button"
            onClick={onSaveToRecords}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isClinical
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save Case to Patient Chart</span>
          </button>
        </div>
      </div>

      {/* 7-Class HAM10000 Probability Distribution Bars */}
      <div
        id="probability-distribution-card"
        className={`p-4 rounded-2xl border transition-all ${
          isClinical
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>HAM10000 7-Class Softmax Probabilities</span>
          </h4>
          <span className="text-[11px] text-cyan-400 font-mono">
            Ensemble Fused Output
          </span>
        </div>

        <div className="space-y-2">
          {sortedProbabilities.map((code) => {
            const info = HAM10000_CLASSES[code];
            const prob = prediction.classProbabilities[code] || 0;
            const isTop = code === prediction.topClass;

            return (
              <div key={code} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        info.isMalignant
                          ? 'bg-rose-950 text-rose-400 border border-rose-900'
                          : info.severity === 'pre-malignant'
                          ? 'bg-amber-950 text-amber-400 border border-amber-900'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {code}
                    </span>
                    <span className={isTop ? 'font-bold text-cyan-300' : 'text-slate-300'}>
                      {info.fullName}
                    </span>
                  </div>
                  <span className={isTop ? 'font-bold text-cyan-400' : 'text-slate-400'}>
                    {prob.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isClinical ? 'bg-slate-800' : 'bg-stone-100'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      info.isMalignant
                        ? isTop
                          ? 'bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-rose-500/70'
                        : isTop
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'bg-cyan-600/60'
                    }`}
                    style={{ width: `${Math.max(2, prob)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relevant Literature Citations for This Diagnosis */}
      <div
        id="literature-citations-card"
        className={`p-4 rounded-2xl border transition-all ${
          isClinical
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Peer-Reviewed Literature & Ground Truth Citations
          </h4>
        </div>

        <div className="space-y-2.5">
          {topInfo.citations.map((cite) => (
            <div
              key={cite.id}
              className={`p-3 rounded-xl border text-xs ${
                isClinical
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-cyan-300 leading-snug">
                  "{cite.title}"
                </span>
                <a
                  href={cite.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-cyan-400 p-1 shrink-0"
                  title="Open DOI / Publication"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {cite.authors} ({cite.year}) — <span className="italic">{cite.journal}</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1.5 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                <span className="text-cyan-400 font-semibold mr-1">Relevance:</span>
                {cite.relevance}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
