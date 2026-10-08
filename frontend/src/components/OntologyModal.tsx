import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileText
} from 'lucide-react';
import { HAM10000_CLASSES } from '../data/lesionData';
import { LesionClassCode } from '../types';

interface OntologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isClinical: boolean;
}

export const OntologyModal: React.FC<OntologyModalProps> = ({
  isOpen,
  onClose,
  isClinical
}) => {
  const [selectedClass, setSelectedClass] = useState<LesionClassCode>('MEL');

  if (!isOpen) return null;

  const activeClass = HAM10000_CLASSES[selectedClass];
  const allCodes: LesionClassCode[] = ['MEL', 'BCC', 'AKIEC', 'NV', 'BKL', 'DF', 'VASC'];

  return (
    <div
      id="ontology-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="ontology-modal-content"
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isClinical
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between gap-4 ${
            isClinical ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                HAM10000 7-Class Dermatology Ontology & Citations
              </h2>
              <p
                className={`text-xs ${isClinical ? 'text-slate-400' : 'text-stone-500'}`}
              >
                Comprehensive reference for cutaneous lesion taxonomy and research citations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Class Sidebar Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              The 7 HAM10000 Diagnostic Classes:
            </span>
            {allCodes.map((code) => {
              const info = HAM10000_CLASSES[code];
              const isSelected = code === selectedClass;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedClass(code)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? isClinical
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-xs'
                        : 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                      : isClinical
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        info.isMalignant
                          ? 'bg-rose-950 text-rose-300'
                          : info.severity === 'pre-malignant'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {code}
                    </span>
                    <span className="text-xs truncate">{info.fullName}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Class Information */}
          <div className="md:col-span-2 space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  Class: {activeClass.code}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeClass.isMalignant
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : activeClass.severity === 'pre-malignant'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {activeClass.severity}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                {activeClass.fullName} ({activeClass.commonName})
              </h3>

              <p className="text-slate-300 leading-relaxed">
                {activeClass.typicalAppearance}
              </p>
            </div>

            {/* Dermatoscopic Features */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Key Dermatoscopic Features (7-Point Checklist):
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {activeClass.dermatoscopicFeatures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Clinical Protocol */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Recommended Clinical Protocol:
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {activeClass.clinicalProtocol}
              </p>
            </div>

            {/* Literature Citations */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-cyan-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Primary Benchmark Citations:</span>
              </h4>
              {activeClass.citations.map((cite) => (
                <div
                  key={cite.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]"
                >
                  <div className="font-semibold text-slate-200">{cite.title}</div>
                  <div className="text-slate-400 mt-0.5">
                    {cite.authors} ({cite.year}) — <span className="italic">{cite.journal}</span>
                  </div>
                  {cite.doi && (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <span>DOI: {cite.doi}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`p-4 border-t flex items-center justify-end ${
            isClinical ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Ontology
          </button>
        </div>
      </div>
    </div>
  );
};
