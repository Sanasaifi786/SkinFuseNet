import React, { useState } from 'react';
import {
  FolderArchive,
  Search,
  CloudCheck,
  Calendar,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  Printer,
  Scale,
  CheckSquare,
  Square,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import { PatientRecord, LesionClassCode } from '../types';
import { HAM10000_CLASSES } from '../data/lesionData';
import { LesionComparisonModal } from './LesionComparisonModal';

interface PatientRecordsPageProps {
  records: PatientRecord[];
  onSelectRecord: (record: PatientRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNewScan: () => void;
}

export const PatientRecordsPage: React.FC<PatientRecordsPageProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onNewScan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'malignant' | 'pre-malignant' | 'benign'>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

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

  const handleToggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, id]);
      } else {
        // If already 2 selected, replace the 2nd one
        setSelectedForCompare([selectedForCompare[0], id]);
      }
    }
  };

  const handleQuickComparePair = (idA: string, idB: string) => {
    setSelectedForCompare([idA, idB]);
    setIsComparisonModalOpen(true);
  };

  const handleOpenComparison = () => {
    if (selectedForCompare.length === 2) {
      setIsComparisonModalOpen(true);
    }
  };

  const recordA = records.find((r) => r.id === selectedForCompare[0]);
  const recordB = records.find((r) => r.id === selectedForCompare[1]);

  return (
    <div id="patient-records-page" className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Patient Case History & Diagnostic Archive
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal repository of AI skin lesion assessments and pathology notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedForCompare.length === 2 && (
            <button
              type="button"
              onClick={handleOpenComparison}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all animate-pulse"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Selected (2)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewScan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Examination Scan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, record ID, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="text-slate-500 font-medium">Filter Risk:</span>
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({records.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('malignant')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'malignant'
                ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Malignant (Urgent)
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('benign')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterSeverity === 'benign'
                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Benign (Low Risk)
          </button>
        </div>
      </div>

      {/* Comparison Instruction Info Bar */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-2.5">
          <Scale className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Longitudinal Evolution Tracking:</strong> Select any 2 records using the <strong>Compare</strong> button on cards to analyze dermoscopy differences, SAM morphometric growth, and AI confidence shifts side-by-side.
          </span>
        </div>
        {selectedForCompare.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-800">
              {selectedForCompare.length} of 2 selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white text-center py-16 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <FolderArchive className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-sm font-semibold text-slate-700">No matching patient records found</div>
            <p className="text-xs text-slate-400">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const info = HAM10000_CLASSES[rec.prediction.topClass];
            const isSelected = selectedForCompare.includes(rec.id);
            const selectionIndex = selectedForCompare.indexOf(rec.id);

            // Find other scans for the same patient to offer instant comparison
            const samePatientScans = records.filter(
              (r) => r.patientId === rec.patientId && r.id !== rec.id
            );

            return (
              <div
                key={rec.id}
                className={`bg-white p-5 rounded-2xl border shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Select for comparison checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleCompare(rec.id)}
                    title={isSelected ? 'Remove from comparison' : 'Select for side-by-side comparison'}
                    className={`mt-1 p-1 rounded-lg transition-colors shrink-0 ${
                      isSelected
                        ? 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                        : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <img
                    src={rec.imageSrc}
                    alt={rec.patientName}
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 shrink-0 bg-slate-100"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{rec.patientName}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {rec.patientId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          info.isMalignant
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : info.severity === 'pre-malignant'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {info.code} — {info.fullName}
                      </span>

                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          Selected for Compare {selectionIndex === 0 ? '(Scan A)' : '(Scan B)'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: {rec.timestamp}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {rec.metadata.age}y {rec.metadata.sex} • {rec.metadata.anatomicalSite}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-blue-700 font-bold">
                        {rec.prediction.topConfidence}% Confidence
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-600">
                        Ø {rec.prediction.morphometrics.estimatedDiameterMm} mm
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic max-w-2xl pt-0.5">
                      "{rec.doctorNotes}"
                    </p>

                    {/* Quick 1-click compare button if patient has other longitudinal records */}
                    {samePatientScans.length > 0 && (
                      <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>Longitudinal history:</span>
                        </span>
                        {samePatientScans.map((counterpart) => (
                          <button
                            key={counterpart.id}
                            type="button"
                            onClick={() => handleQuickComparePair(counterpart.id, rec.id)}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1"
                          >
                            <Scale className="w-3 h-3" />
                            <span>
                              Compare with {counterpart.timestamp.split(' ')[0]} ({counterpart.prediction.morphometrics.estimatedDiameterMm}mm)
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleCompare(rec.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Selected (Compare)' : 'Compare'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRecord(rec)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all"
                  >
                    Open in Scanner
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRecord(rec.id)}
                    title="Delete record"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Sticky Comparison Bottom Bar */}
      {selectedForCompare.length > 0 && (
        <div
          id="floating-compare-bar"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Lesion Comparison Tray</span>
                <span className="px-2 py-0.2 rounded-full bg-indigo-500 text-[10px] font-mono">
                  {selectedForCompare.length}/2 Selected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {selectedForCompare.length === 1 && recordA
                  ? `Selected Scan A: ${recordA.patientName} (${recordA.timestamp}). Select 1 more record to compare.`
                  : recordA && recordB
                  ? `Ready: ${recordA.patientName} (${recordA.timestamp}) vs ${recordB.patientName} (${recordB.timestamp})`
                  : 'Select two records to launch side-by-side evolution tracking.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={selectedForCompare.length !== 2}
              onClick={handleOpenComparison}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                selectedForCompare.length === 2
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer ring-2 ring-indigo-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Launch Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Render Side-by-Side Comparison Modal */}
      {recordA && recordB && (
        <LesionComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          recordA={recordA}
          recordB={recordB}
          onSelectForScanner={(rec) => {
            setIsComparisonModalOpen(false);
            onSelectRecord(rec);
          }}
        />
      )}
    </div>
  );
};

