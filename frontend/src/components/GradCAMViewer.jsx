import React, { useState } from 'react';

export default function GradCAMViewer({ originalImage = null, gradcamImage = '' }) {

  const [viewMode, setViewMode] = useState('heatmap');

  const heatmapSrc = gradcamImage
    ? (gradcamImage.startsWith('data:') ? gradcamImage : `data:image/png;base64,${gradcamImage.trim()}`)
    : null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-800 uppercase flex items-center gap-2">
            <span>Explainable AI Heatmap</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              GradCAM
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Highlights lesion regions most influential to the model's prediction
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'original'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'heatmap'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GradCAM Overlay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`flex flex-col items-center ${viewMode === 'heatmap' ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
            {originalImage ? (
              <img
                src={originalImage}
                alt="Original Dermoscopic Lesion"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-400">No original image selected</span>
            )}
            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded">
              Original Photo
            </span>
          </div>
        </div>

        <div className={`flex flex-col items-center ${viewMode === 'original' ? 'hidden md:flex' : 'flex'}`}>
          <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
            {heatmapSrc ? (
              <img
                src={heatmapSrc}
                alt="GradCAM Attention Overlay"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-xs text-slate-400 font-medium">No GradCAM heatmap available</p>
                <p className="text-[11px] text-slate-400 mt-1">Submit an image to compute attention maps</p>
              </div>
            )}
            <span className="absolute top-2 left-2 bg-blue-700/80 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded">
              Attention Heatmap
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Red/Warm: High diagnostic weight</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
          <span>Blue/Cool: Low diagnostic influence</span>
        </div>
      </div>
    </div>
  );
}
