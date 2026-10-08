import React, { useState } from 'react';
import {
  Trophy,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { SKINFUSENET_BENCHMARKS } from '../data/lesionData';

interface SkinFuseNetDashboardProps {
  isClinical?: boolean;
}

export const SkinFuseNetDashboard: React.FC<SkinFuseNetDashboardProps> = () => {
  const [activeMetricTab, setActiveMetricTab] = useState<'val' | 'train' | 'gap' | 'loss'>('val');

  // Exact data from user's uploaded training HTML
  const models = SKINFUSENET_BENCHMARKS;

  return (
    <div
      id="skinfusenet-dashboard-page"
      className="max-w-6xl mx-auto space-y-6 animate-fadeIn"
    >
      {/* Top Title & Badges */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Research Model Evaluation</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          SkinFuseNet Model Performance (V1 – V6)
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Comparison of training iterations on the HAM10000 7-class dermatoscopy dataset.
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>4 Architecture Iterations</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>14 Training Runs</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>170+ Epochs Total</span>
          </span>
        </div>
      </div>

      {/* Winner Banner */}
      {(() => {
        const bestModel = models.find(m => m.isBest) || models[2]; // Fallback to V3 if none found
        return (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-blue-50/40 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                  🏆
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                    <span>Top Performing Checkpoint</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Best Model: {bestModel.version} — {bestModel.name}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    Achieved highest validation accuracy and macro F1 score.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0 bg-white px-5 py-3.5 rounded-xl border border-emerald-200 shadow-xs">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {bestModel.valAccuracy}%
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
                    Val Accuracy
                  </div>
                </div>
                <div className="w-px h-9 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {bestModel.valMacroF1}%
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
                    Val Macro F1
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6 Model Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m, idx) => {
          const isBestModel = m.isBest;
          const isInProgressModel = m.isInProgress;

          return (
            <div
              key={m.version}
              className={`relative p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isBestModel
                  ? 'bg-white border-emerald-400 shadow-sm ring-2 ring-emerald-400/20'
                  : isInProgressModel
                  ? 'bg-white border-amber-300 border-dashed shadow-xs'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Badge top right */}
              {isBestModel && (
                <span className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  ★ BEST
                </span>
              )}
              {isInProgressModel && (
                <span className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                  ⏳ IN TRAINING
                </span>
              )}

              <div>
                <div
                  className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    ['text-blue-600', 'text-purple-600', 'text-emerald-700', 'text-amber-700', 'text-rose-600', 'text-indigo-600'][idx] || 'text-slate-600'
                  }`}
                >
                  Version {m.version.replace('V', '')}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-3">{m.name}</h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Val Accuracy</span>
                    <span
                      className={`font-mono font-bold ${
                        isBestModel ? 'text-emerald-700 text-sm' : 'text-slate-800'
                      }`}
                    >
                      {m.valAccuracy}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Val Macro F1</span>
                    <span
                      className={`font-mono font-bold ${
                        isBestModel ? 'text-emerald-700 text-sm' : 'text-slate-800'
                      }`}
                    >
                      {m.valMacroF1}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Train Accuracy</span>
                    <span className="font-mono text-slate-700">{m.trainAccuracy}%</span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Train Macro F1</span>
                    <span className="font-mono text-slate-700">{m.trainMacroF1}%</span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500">Epochs Trained</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {m.epochLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress mini-bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'][idx] || 'bg-slate-500'
                    }`}
                    style={{ width: `${m.valAccuracy}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Visual Charts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Interactive Comparison Charts
            </h2>
            <p className="text-xs text-slate-500">
              Metrics captured at optimal validation epoch checkpoints
            </p>
          </div>

          {/* Metric switcher tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveMetricTab('val')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMetricTab === 'val'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Validation Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricTab('train')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMetricTab === 'train'
                  ? 'bg-white text-purple-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Training Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricTab('gap')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMetricTab === 'gap'
                  ? 'bg-white text-rose-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overfitting Gap
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricTab('loss')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeMetricTab === 'loss'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loss Comparison
            </button>
          </div>
        </div>

        {/* Dynamic Chart Display Container */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          {activeMetricTab === 'val' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Validation Accuracy vs Macro F1 Score (%):</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Val Accuracy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400 inline-block" /> Val Macro F1
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
                {models.map((m, idx) => {
                  const colors = [
                    { bar1: 'bg-blue-600', bar2: 'bg-blue-200 border border-blue-400' },
                    { bar1: 'bg-purple-600', bar2: 'bg-purple-200 border border-purple-400' },
                    { bar1: 'bg-emerald-600', bar2: 'bg-emerald-200 border border-emerald-400' },
                    { bar1: 'bg-amber-500', bar2: 'bg-amber-200 border border-amber-400' },
                    { bar1: 'bg-rose-500', bar2: 'bg-rose-200 border border-rose-400' },
                    { bar1: 'bg-indigo-500', bar2: 'bg-indigo-200 border border-indigo-400' }
                  ][idx] || { bar1: 'bg-slate-500', bar2: 'bg-slate-200 border border-slate-400' };

                  return (
                    <div key={m.version} className="space-y-2 text-center">
                      <div className="h-44 flex items-end justify-center gap-2 px-2 bg-white rounded-lg border border-slate-200 p-2 shadow-xs">
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                            {m.valAccuracy}%
                          </span>
                          <div
                            className={`w-full rounded-t transition-all duration-300 ${colors.bar1}`}
                            style={{ height: `${((m.valAccuracy - 50) / 50) * 100}%` }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                            {m.valMacroF1}%
                          </span>
                          <div
                            className={`w-full rounded-t transition-all duration-300 ${colors.bar2}`}
                            style={{ height: `${((m.valMacroF1 - 50) / 50) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{m.version}</div>
                      <div className="text-[11px] text-slate-500 truncate">{m.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMetricTab === 'train' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Training Accuracy vs Macro F1 Score (%):</span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Train Accuracy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-200 border border-purple-400 inline-block" /> Train Macro F1
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
                {models.map((m) => (
                  <div key={m.version} className="space-y-2 text-center">
                    <div className="h-44 flex items-end justify-center gap-2 px-2 bg-white rounded-lg border border-slate-200 p-2 shadow-xs">
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                          {m.trainAccuracy}%
                        </span>
                        <div
                          className="w-full bg-purple-600 rounded-t transition-all duration-300"
                          style={{ height: `${((m.trainAccuracy - 50) / 50) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                          {m.trainMacroF1}%
                        </span>
                        <div
                          className="w-full bg-purple-200 border border-purple-400 rounded-t transition-all duration-300"
                          style={{ height: `${((m.trainMacroF1 - 50) / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{m.version}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMetricTab === 'gap' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Overfitting Gap (Train − Val, lower difference is better):</span>
                <span className="text-[11px] text-slate-500">
                  Smaller divergence = superior generalization
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
                {models.map((m) => {
                  const accGap = (m.trainAccuracy - m.valAccuracy).toFixed(1);
                  const f1Gap = (m.trainMacroF1 - m.valMacroF1).toFixed(1);

                  return (
                    <div key={m.version} className="space-y-2 text-center">
                      <div className="h-44 flex items-end justify-center gap-2 px-2 bg-white rounded-lg border border-slate-200 p-2 shadow-xs">
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono text-rose-700 font-bold mb-1">
                            +{accGap}%
                          </span>
                          <div
                            className="w-full bg-rose-500 rounded-t"
                            style={{ height: `${Math.max(10, Math.min(100, parseFloat(accGap) * 4))}%` }}
                          />
                          <span className="text-[9px] text-slate-500 mt-1">Acc</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-mono text-rose-700 font-bold mb-1">
                            +{f1Gap}%
                          </span>
                          <div
                            className="w-full bg-rose-200 border border-rose-400 rounded-t"
                            style={{ height: `${Math.max(10, Math.min(100, parseFloat(f1Gap) * 3))}%` }}
                          />
                          <span className="text-[9px] text-slate-500 mt-1">F1</span>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{m.version}</div>
                      <div className="text-[11px] text-slate-500 truncate">{m.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMetricTab === 'loss' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Loss Comparison (Train vs Val Loss, lower is better):</span>
                <span className="text-[11px] text-slate-500">
                  V4 achieves lowest validation loss (0.4530)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
                {models.map((m) => (
                  <div key={m.version} className="space-y-2 text-center">
                    <div className="h-44 flex items-end justify-center gap-2 px-2 bg-white rounded-lg border border-slate-200 p-2 shadow-xs">
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                          {m.trainLoss}
                        </span>
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${(m.trainLoss / 0.6) * 100}%` }}
                        />
                        <span className="text-[9px] text-slate-500 mt-1">Train</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-mono text-slate-700 font-bold mb-1">
                          {m.valLoss}
                        </span>
                        <div
                          className="w-full bg-emerald-600 rounded-t"
                          style={{ height: `${(m.valLoss / 0.6) * 100}%` }}
                        />
                        <span className="text-[9px] text-slate-500 mt-1">Val</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{m.version}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Detailed Metrics Summary Table
        </h2>
        <p className="text-xs text-slate-500">
          Recorded at optimal validation checkpoints during training
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="p-3">Model</th>
                <th className="p-3">Val Accuracy</th>
                <th className="p-3">Val Macro F1</th>
                <th className="p-3">Val Loss</th>
                <th className="p-3">Train Accuracy</th>
                <th className="p-3">Train Macro F1</th>
                <th className="p-3">Train Loss</th>
                <th className="p-3">Best Epoch</th>
                <th className="p-3">Total Epochs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {models.map((m) => (
                <tr key={m.version} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-sans font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'][models.indexOf(m)] || 'bg-slate-500'
                      }`}
                    />
                    <span>{m.version} {m.name}</span>
                    {m.isBest && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        BEST
                      </span>
                    )}
                    {m.isInProgress && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        RUNNING
                      </span>
                    )}
                  </td>
                  <td
                    className={`p-3 font-bold ${
                      m.isBest ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-800'
                    }`}
                  >
                    {m.valAccuracy}%
                  </td>
                  <td
                    className={`p-3 font-bold ${
                      m.isBest ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-800'
                    }`}
                  >
                    {m.valMacroF1}%
                  </td>
                  <td
                    className={`p-3 ${
                      m.version === 'V4' ? 'text-emerald-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {m.valLoss}
                  </td>
                  <td className="p-3 text-slate-700">{m.trainAccuracy}%</td>
                  <td className="p-3 text-slate-700">{m.trainMacroF1}%</td>
                  <td className="p-3 text-slate-700">{m.trainLoss}</td>
                  <td className="p-3 text-slate-600">{m.bestEpoch}</td>
                  <td className="p-3 text-slate-800 font-semibold">{m.epochLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* What Changed Between Versions Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          Architecture & Hyperparameter Shifts
        </h2>
        <p className="text-xs text-slate-500">
          Key model variations tested during research experimentation
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {models.map((m, idx) => (
            <div
              key={m.version}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
            >
              <div
                className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b border-slate-200 ${
                  ['text-blue-700', 'text-purple-700', 'text-emerald-700', 'text-amber-700', 'text-rose-700', 'text-indigo-700'][idx] || 'text-slate-700'
                }`}
              >
                {m.version} — {m.name}
              </div>

              <div className="space-y-1.5 text-xs">
                {m.changes.map((c, cIdx) => (
                  <div key={cIdx} className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">{c.label}:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-slate-900 font-semibold">{c.value}</span>
                      {c.note && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            c.isImprovement
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : c.isDecline
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-slate-500 py-3">
        SkinFuseNet Research Report • Data extracted from offline experiment logs
      </div>
    </div>
  );
};
