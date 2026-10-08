import React, { useState } from 'react';
import {
  X,
  Search,
  FolderArchive,
  CloudCheck,
  Calendar,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Trash2,
  Download,
  ExternalLink
} from 'lucide-react';
import { PatientRecord, LesionClassCode } from '../types';
import { HAM10000_CLASSES } from '../data/lesionData';

interface PatientRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PatientRecord[];
  onSelectRecord: (record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  isClinical: boolean;
}

export const PatientRecordsModal: React.FC<PatientRecordsModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onDeleteRecord,
  isClinical
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'malignant' | 'pre-malignant' | 'benign'>('all');

  if (!isOpen) return null;

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.prediction.topClass.toLowerCase().includes(searchTerm.toLowerCase());

    const classInfo = HAM10000_CLASSES[rec.prediction.topClass];
    const matchesSeverity =
      filterSeverity === 'all' || classInfo.severity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div
      id="patient-records-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="patient-records-modal-content"
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Patient Dermatological Case Archive
                </h2>
                <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CloudCheck className="w-3 h-3 text-emerald-400" />
                  <span>Cloud Encrypted</span>
                </div>
              </div>
              <p
                className={`text-xs ${isClinical ? 'text-slate-400' : 'text-stone-500'}`}
              >
                Historical HAM10000 multi-modal diagnoses, biopsy trackers, and clinical logs
              </p>
            </div>
          </div>

          <button
            id="close-records-modal-btn"
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isClinical
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isClinical ? 'bg-slate-900/30 border-slate-800' : 'bg-stone-100/60 border-stone-200'
          }`}
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID, or class code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs ${
                isClinical
                  ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500'
                  : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className={isClinical ? 'text-slate-400' : 'text-stone-500'}>Filter:</span>
            <button
              type="button"
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('malignant')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'malignant'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              Malignant
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('benign')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'benign'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Benign
            </button>
          </div>
        </div>

        {/* Record List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching patient records found.
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const info = HAM10000_CLASSES[rec.prediction.topClass];
              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isClinical
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200'
                      : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={rec.imageSrc}
                      alt={rec.patientName}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{rec.patientName}</span>
                        <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {rec.patientId}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            info.isMalignant
                              ? 'bg-rose-950 text-rose-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {info.code} - {info.commonName}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>{rec.timestamp}</span>
                        <span>•</span>
                        <span>
                          {rec.metadata.age}y {rec.metadata.sex} • {rec.metadata.anatomicalSite}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-cyan-400">
                          {rec.prediction.topConfidence}% Conf.
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 italic line-clamp-1">
                        "{rec.doctorNotes}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecord(rec);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all"
                    >
                      Load into Workbench
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(rec.id)}
                      title="Delete case"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isClinical ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <span className={isClinical ? 'text-slate-400' : 'text-stone-500'}>
            Total Saved Patient Charts: {records.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
};
