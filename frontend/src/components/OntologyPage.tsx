import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { HAM10000_CLASSES } from '../data/lesionData';
import { LesionClassCode } from '../types';

interface OntologyPageProps {
  isClinical?: boolean;
}

export const OntologyPage: React.FC<OntologyPageProps> = () => {
  const [selectedClass, setSelectedClass] = useState<LesionClassCode>('MEL');

  const activeClass = HAM10000_CLASSES[selectedClass];
  const allCodes: LesionClassCode[] = ['MEL', 'BCC', 'AKIEC', 'NV', 'BKL', 'DF', 'VASC'];

  return (
    <div id="ontology-page" className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              HAM10000 7-Class Dermatology Diagnostic Guide
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardized clinical definitions, dermoscopic hallmarks, and peer-reviewed journal citations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: 7 Classes Selector */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-1 mb-1">
            Lesion Classification Types:
          </span>

          <div className="space-y-1.5">
            {allCodes.map((code) => {
              const info = HAM10000_CLASSES[code];
              const isSelected = code === selectedClass;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedClass(code)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-600/30 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-xs ${
                        info.isMalignant
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : info.severity === 'pre-malignant'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {code}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{info.fullName}</div>
                      <div className="text-[11px] text-slate-500">{info.commonName}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Class Insights */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-700 uppercase">
                HAM10000 Category: {activeClass.code}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  activeClass.isMalignant
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : activeClass.severity === 'pre-malignant'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {activeClass.severity}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {activeClass.fullName} ({activeClass.commonName})
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeClass.typicalAppearance}
            </p>
          </div>

          {/* Dermoscopic Features */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Key Dermatoscopic Features:
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {activeClass.dermatoscopicFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Protocol */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recommended Clinical Management:
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeClass.clinicalProtocol}
            </p>
          </div>

          {/* Research Citations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Scientific Literature Citations:</span>
            </h3>

            <div className="space-y-2.5">
              {activeClass.citations.map((cite) => (
                <div
                  key={cite.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-800">{cite.title}</div>
                  <div className="text-slate-500">
                    {cite.authors} ({cite.year}) — <span className="italic">{cite.journal}</span>
                  </div>
                  {cite.doi && (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 text-[11px]"
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
      </div>
    </div>
  );
};
