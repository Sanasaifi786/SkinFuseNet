import React, { useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  FolderOpen,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { SAMPLE_CASES, HAM10000_CLASSES } from '../data/lesionData';
import { SampleCase, LesionClassCode } from '../types';

interface SampleCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleCase) => void;
  onUploadCustomImage: (dataUrl: string) => void;
  currentCaseId: string;
  isClinical: boolean;
}

export const SampleCaseModal: React.FC<SampleCaseModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  onUploadCustomImage,
  currentCaseId,
  isClinical
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        onUploadCustomImage(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        onUploadCustomImage(dataUrl);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      id="sample-case-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="sample-case-modal-content"
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isClinical
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between gap-4 ${
            isClinical ? 'bg-slate-900/60 border-slate-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Select HAM10000 Benchmark Sample or Upload Dermoscopy
              </h2>
              <p
                className={`text-xs ${isClinical ? 'text-slate-400' : 'text-stone-500'}`}
              >
                Curated multi-source cases with verified histopathological ground truths
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Custom Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all ${
              isClinical
                ? 'bg-slate-900/40 border-slate-700 hover:border-cyan-400 hover:bg-slate-900/80'
                : 'bg-stone-50 border-stone-300 hover:border-teal-500 hover:bg-teal-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <UploadCloud className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
            <div className="text-xs sm:text-sm font-bold text-slate-200">
              Drag and drop any dermoscopic photo here, or click to browse
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports JPEG, PNG, WebP dermoscopic or clinical skin scans
            </p>
          </div>

          {/* Curated Sample Grid */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or Choose a Curated HAM10000 Research Case:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SAMPLE_CASES.map((sample) => {
                const isSelected = sample.id === currentCaseId;
                const info = HAM10000_CLASSES[sample.diagnosisCode];

                return (
                  <div
                    key={sample.id}
                    onClick={() => {
                      onSelectSample(sample);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? isClinical
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-teal-50 border-teal-500 shadow-sm'
                        : isClinical
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-2.5 bg-slate-950">
                        <img
                          src={sample.imageUrl}
                          alt={sample.title}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            info.isMalignant
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {info.code}
                        </span>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-cyan-400 text-slate-950 rounded-full p-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <h4 className="font-bold text-xs line-clamp-1">{sample.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {sample.clinicalVignette}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {sample.metadata.age}y {sample.metadata.sex} • {sample.metadata.anatomicalSite}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">
                        Ground Truth: {sample.diagnosisCode}
                      </span>
                    </div>
                  </div>
                );
              })}
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
