import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sparkles,
  RefreshCw,
  Scale,
  Maximize2,
  FileText,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { PatientRecord } from '../types';
import { HAM10000_CLASSES } from '../data/lesionData';

interface LesionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordA: PatientRecord;
  recordB: PatientRecord;
  onSelectForScanner: (record: PatientRecord) => void;
}

export const LesionComparisonModal: React.FC<LesionComparisonModalProps> = ({
  isOpen,
  onClose,
  recordA: initialRecordA,
  recordB: initialRecordB,
  onSelectForScanner
}) => {
  // Support chronological ordering and swapping
  const [swapped, setSwapped] = useState(false);
  const [activeTab, setActiveTab] = useState<'morphometrics' | 'probabilities' | 'symptoms'>('morphometrics');

  if (!isOpen || !initialRecordA || !initialRecordB) return null;

  const firstRec = swapped ? initialRecordB : initialRecordA;
  const secondRec = swapped ? initialRecordA : initialRecordB;

  // Calculate chronological difference if parseable
  const dateA = new Date(firstRec.timestamp.replace(' ', 'T'));
  const dateB = new Date(secondRec.timestamp.replace(' ', 'T'));
  const hasValidDates = !isNaN(dateA.getTime()) && !isNaN(dateB.getTime());
  
  let daysDiff = 0;
  if (hasValidDates) {
    const diffMs = Math.abs(dateB.getTime() - dateA.getTime());
    daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  const isSamePatient = firstRec.patientId === secondRec.patientId;

  // Diagnostic Info
  const classA = HAM10000_CLASSES[firstRec.prediction.topClass];
  const classB = HAM10000_CLASSES[secondRec.prediction.topClass];

  // Morphometric Deltas
  const morphA = firstRec.prediction.morphometrics;
  const morphB = secondRec.prediction.morphometrics;

  const diameterDelta = +(morphB.estimatedDiameterMm - morphA.estimatedDiameterMm).toFixed(1);
  const diameterPercentChange = morphA.estimatedDiameterMm > 0
    ? +(((morphB.estimatedDiameterMm - morphA.estimatedDiameterMm) / morphA.estimatedDiameterMm) * 100).toFixed(1)
    : 0;

  const asymmetryDelta = +(morphB.asymmetryScore - morphA.asymmetryScore).toFixed(1);
  const borderDelta = +(morphB.borderIrregularity - morphA.borderIrregularity).toFixed(1);
  const colorDelta = +(morphB.colorVarianceScore - morphA.colorVarianceScore).toFixed(1);
  const confidenceDelta = +(secondRec.prediction.topConfidence - firstRec.prediction.topConfidence).toFixed(1);

  // Overall evolution risk score
  const isEnlargingSignificantly = diameterDelta >= 1.5 || diameterPercentChange >= 20;
  const isAsymmetryDeteriorating = asymmetryDelta >= 1.5;
  const isBorderWorsening = borderDelta >= 1.5;
  const hasNewRedFlags =
    (!firstRec.metadata.hasBleeding && secondRec.metadata.hasBleeding) ||
    (!firstRec.metadata.hasItching && secondRec.metadata.hasItching) ||
    (!firstRec.metadata.hasEnlarging && secondRec.metadata.hasEnlarging);

  const isSignificantEvolution =
    isEnlargingSignificantly ||
    isAsymmetryDeteriorating ||
    isBorderWorsening ||
    hasNewRedFlags ||
    (firstRec.prediction.topClass !== 'MEL' && secondRec.prediction.topClass === 'MEL');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="lesion-comparison-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="lesion-comparison-container"
        className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Longitudinal Lesion Evolution Comparison
                </h2>
                {isSamePatient ? (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Same Patient ({firstRec.patientName} • {firstRec.patientId})
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Cross-Case Comparative Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Side-by-side dermatoscopy evaluation, morphological delta tracking, and AI trajectory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSwapped(!swapped)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              title="Swap Scan A and Scan B"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Swap Position</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition-all"
              title="Print comparative report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Leaflet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Longitudinal Trajectory Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Time Interval:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {daysDiff > 0 ? `${daysDiff} days elapsed` : 'Different / Concurrent sessions'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Evolution Trajectory:</span>
            {isSignificantEvolution ? (
              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Marked Dysplastic Progression Detected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Morphologically Stable Over Interval</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main 2-Column Side-by-Side Images & Primary Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Record A Column */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Earlier Baseline Examination
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{firstRec.timestamp}</span>
                  </span>
                </div>

                {/* Patient / Session details */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{firstRec.patientName}</span>
                  <span className="font-mono text-slate-500">ID: {firstRec.patientId}</span>
                </div>

                {/* Dermoscopic Image */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner group">
                  <img
                    src={firstRec.imageSrc}
                    alt="Scan A Dermoscopy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                    SCAN A • {morphA.estimatedDiameterMm} mm
                  </div>
                </div>

                {/* AI Prediction Tag */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Diagnosis:
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        classA.isMalignant
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : classA.severity === 'pre-malignant'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {classA.code} — {classA.fullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Confidence:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {firstRec.prediction.topConfidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Epistemic Uncertainty:</span>
                    <span className="font-mono text-slate-700">
                      {firstRec.prediction.uncertaintyScore}%
                    </span>
                  </div>
                </div>

                {/* Key Clinical Notes */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Doctor's Notes (Visit A):
                  </span>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{firstRec.doctorNotes}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectForScanner(firstRec)}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold shadow-xs transition-all text-center"
              >
                Open Scan A in Full Diagnostic Scanner →
              </button>
            </div>

            {/* Record B Column */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      B
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Follow-up / Recent Examination
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{secondRec.timestamp}</span>
                  </span>
                </div>

                {/* Patient / Session details */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{secondRec.patientName}</span>
                  <span className="font-mono text-slate-500">ID: {secondRec.patientId}</span>
                </div>

                {/* Dermoscopic Image */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner group">
                  <img
                    src={secondRec.imageSrc}
                    alt="Scan B Dermoscopy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                    SCAN B • {morphB.estimatedDiameterMm} mm
                  </div>
                </div>

                {/* AI Prediction Tag */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Diagnosis:
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        classB.isMalignant
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : classB.severity === 'pre-malignant'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {classB.code} — {classB.fullName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Confidence:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {secondRec.prediction.topConfidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Epistemic Uncertainty:</span>
                    <span className="font-mono text-slate-700">
                      {secondRec.prediction.uncertaintyScore}%
                    </span>
                  </div>
                </div>

                {/* Key Clinical Notes */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Doctor's Notes (Visit B):
                  </span>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{secondRec.doctorNotes}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectForScanner(secondRec)}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs transition-all text-center"
              >
                Open Scan B in Full Diagnostic Scanner →
              </button>
            </div>
          </div>

          {/* Morphometric & Biological Delta Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quantitative Morphometric Delta Analysis
                </h3>
                <p className="text-xs text-slate-500">
                  Automated SAM segmentation boundary & color variance tracking between visits
                </p>
              </div>

              {/* Quick Tab switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('morphometrics')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'morphometrics'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Morphometrics (ABCDE)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('probabilities')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'probabilities'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Class Probabilities
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('symptoms')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'symptoms'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Symptoms
                </button>
              </div>
            </div>

            {/* Tab 1: Morphometrics */}
            {activeTab === 'morphometrics' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Metric 1: Diameter */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Estimated Diameter:</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
                        diameterDelta > 0
                          ? 'text-rose-700'
                          : diameterDelta < 0
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {diameterDelta > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : diameterDelta < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {diameterDelta > 0 ? `+${diameterDelta}` : diameterDelta} mm ({diameterPercentChange > 0 ? `+${diameterPercentChange}` : diameterPercentChange}%)
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan A</div>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {morphA.estimatedDiameterMm} mm
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan B</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {morphB.estimatedDiameterMm} mm
                      </div>
                    </div>
                  </div>

                  {diameterDelta >= 1.5 && (
                    <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-center">
                      ⚠ Clinically significant growth
                    </div>
                  )}
                </div>

                {/* Metric 2: Asymmetry Score */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Asymmetry Score:</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
                        asymmetryDelta > 0
                          ? 'text-rose-700'
                          : asymmetryDelta < 0
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {asymmetryDelta > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : asymmetryDelta < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>{asymmetryDelta > 0 ? `+${asymmetryDelta}` : asymmetryDelta}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan A</div>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {morphA.asymmetryScore}/10
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan B</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {morphB.asymmetryScore}/10
                      </div>
                    </div>
                  </div>

                  {asymmetryDelta >= 1.5 && (
                    <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-center">
                      Increasing dysplastic contour
                    </div>
                  )}
                </div>

                {/* Metric 3: Border Irregularity */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Border Irregularity:</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
                        borderDelta > 0
                          ? 'text-rose-700'
                          : borderDelta < 0
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {borderDelta > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : borderDelta < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>{borderDelta > 0 ? `+${borderDelta}` : borderDelta}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan A</div>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {morphA.borderIrregularity}/10
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan B</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {morphB.borderIrregularity}/10
                      </div>
                    </div>
                  </div>

                  {borderDelta >= 1.5 && (
                    <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-center">
                      Edge notch / scalloping expansion
                    </div>
                  )}
                </div>

                {/* Metric 4: Color Variance */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Color Variance:</span>
                    <span
                      className={`flex items-center gap-0.5 text-xs font-mono font-bold ${
                        colorDelta > 0
                          ? 'text-rose-700'
                          : colorDelta < 0
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {colorDelta > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : colorDelta < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      <span>{colorDelta > 0 ? `+${colorDelta}` : colorDelta}</span>
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan A</div>
                      <div className="text-sm font-mono font-bold text-slate-800">
                        {morphA.colorVarianceScore}/10
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] text-slate-400">Scan B</div>
                      <div className="text-sm font-mono font-bold text-slate-900">
                        {morphB.colorVarianceScore}/10
                      </div>
                    </div>
                  </div>

                  {colorDelta >= 1.5 && (
                    <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-center">
                      Color variegation emergence
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Probabilities */}
            {activeTab === 'probabilities' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">
                  Model probability shift across the 7 HAM10000 categories:
                </div>
                <div className="space-y-2">
                  {(['MEL', 'NV', 'BCC', 'AKIEC', 'BKL', 'DF', 'VASC'] as const).map((code) => {
                    const pA = firstRec.prediction.classProbabilities[code] || 0;
                    const pB = secondRec.prediction.classProbabilities[code] || 0;
                    const diff = +(pB - pA).toFixed(1);

                    return (
                      <div key={code} className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-mono font-bold text-slate-800">{code}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="w-24 text-right font-mono text-slate-600">{pA}%</div>
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${pB}%` }}
                            />
                          </div>
                          <div className="w-24 font-mono font-bold text-slate-900">{pB}%</div>
                          <div
                            className={`w-16 font-mono text-right text-[11px] font-bold ${
                              diff > 0
                                ? code === 'MEL' || code === 'BCC'
                                  ? 'text-rose-700'
                                  : 'text-blue-700'
                                : diff < 0
                                ? 'text-slate-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff}%` : `${diff}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Symptoms */}
            {activeTab === 'symptoms' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    label: 'Rapid Enlarging',
                    valA: firstRec.metadata.hasEnlarging,
                    valB: secondRec.metadata.hasEnlarging
                  },
                  {
                    label: 'Bleeding / Oozing',
                    valA: firstRec.metadata.hasBleeding,
                    valB: secondRec.metadata.hasBleeding
                  },
                  {
                    label: 'Color Darkening',
                    valA: firstRec.metadata.hasColorChange,
                    valB: secondRec.metadata.hasColorChange
                  },
                  {
                    label: 'Itching / Pruritus',
                    valA: firstRec.metadata.hasItching,
                    valB: secondRec.metadata.hasItching
                  }
                ].map((s) => {
                  const isNew = !s.valA && s.valB;
                  const isResolved = s.valA && !s.valB;

                  return (
                    <div
                      key={s.label}
                      className={`p-3 rounded-xl border ${
                        isNew
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold mb-1">{s.label}</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Scan A: {s.valA ? 'Yes' : 'No'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold">Scan B: {s.valB ? 'Yes' : 'No'}</span>
                      </div>
                      {isNew && (
                        <div className="text-[10px] font-bold text-rose-700 mt-1 uppercase">
                          ★ Newly emerged symptom
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clinical Progression & Management Recommendation */}
          <div
            className={`p-5 rounded-2xl border ${
              isSignificantEvolution
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {isSignificantEvolution ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <h4 className="text-sm font-bold">
                  {isSignificantEvolution
                    ? 'Clinical Alert: Morphologic & Biological Progression Detected'
                    : 'Clinical Consensus: Indolent / Stable Morphologic Pattern'}
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  {isSignificantEvolution
                    ? `Over the course of ${daysDiff > 0 ? `${daysDiff} days` : 'the observation window'}, the lesion demonstrated measurable dimensional expansion (${diameterDelta > 0 ? `+${diameterDelta} mm` : ''}) alongside increased structural asymmetry and dermatoscopic irregularity. Follow standard clinical protocols: an excisional biopsy with 2mm safety margin is strongly indicated to evaluate histopathology and Breslow depth.`
                    : `Comparative analysis demonstrates negligible morphometric fluctuation across observation intervals. Border stability and absence of pigment network restructuring support routine photographic monitoring at 6-to-12 month intervals.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Comparing <span className="font-semibold text-slate-800">{firstRec.patientName} ({firstRec.timestamp})</span> with <span className="font-semibold text-slate-800">{secondRec.patientName} ({secondRec.timestamp})</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all"
          >
            Done / Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
