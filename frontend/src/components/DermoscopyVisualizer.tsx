import React, { useRef, useEffect, useState } from 'react';
import {
  Layers,
  Sliders,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
  Cpu,
  Scan,
  RotateCcw,
  Zap
} from 'lucide-react';
import { applyClaheToCanvas, drawSamOverlay, drawVitAttentionHeatmap } from '../utils/imageProcessing';
import { Morphometrics } from '../types';

interface DermoscopyVisualizerProps {
  imageSrc: string;
  samPolygon: [number, number][];
  morphometrics: Morphometrics;
  isClinical?: boolean;
  onOpenUploader: () => void;
}

export type ViewLayer = 'raw' | 'clahe' | 'sam' | 'vit_attention';

const PERFORMANCE_COMPARISON = [
  { metric: 'Accuracy (%)', proposed: '97.1', baseline1: '96.4', baseline2: '94.1' },
  { metric: 'Precision (%)', proposed: 'Not reported', baseline1: '95.0', baseline2: '93.0' },
  { metric: 'Recall (%)', proposed: 'Not reported', baseline1: '95.0', baseline2: '92.0' },
  { metric: 'F1-score (%)', proposed: '96.0', baseline1: '95.0', baseline2: '92.0' },
  { metric: 'Time (ms)', proposed: 'Not reported', baseline1: 'Not reported', baseline2: 'Not reported' }
] as const;

export const DermoscopyVisualizer: React.FC<DermoscopyVisualizerProps> = ({
  imageSrc,
  samPolygon,
  morphometrics,
  onOpenUploader
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeLayer, setActiveLayer] = useState<ViewLayer>('sam');
  const [claheClipLimit, setClaheClipLimit] = useState<number>(2.5);
  const [samOpacity, setSamOpacity] = useState<number>(0.45);
  const [showContour, setShowContour] = useState<boolean>(true);
  const [attentionIntensity, setAttentionIntensity] = useState<number>(0.65);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Redraw canvas whenever settings or imageSrc changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const width = 600;
      const height = 450;
      canvas.width = width;
      canvas.height = height;

      // Draw base image
      ctx.drawImage(img, 0, 0, width, height);

      // Apply layers based on selection
      if (activeLayer === 'clahe') {
        applyClaheToCanvas(ctx, width, height, claheClipLimit);
      } else if (activeLayer === 'sam') {
        // Base CLAHE subtle contrast enhancement + SAM segment
        applyClaheToCanvas(ctx, width, height, 1.4);
        drawSamOverlay(ctx, width, height, samPolygon, samOpacity, showContour);
      } else if (activeLayer === 'vit_attention') {
        applyClaheToCanvas(ctx, width, height, 1.2);
        drawVitAttentionHeatmap(ctx, width, height, samPolygon, attentionIntensity);
      }

      setIsProcessing(false);
    };

    img.onerror = () => {
      setIsProcessing(false);
    };
  }, [
    imageSrc,
    activeLayer,
    claheClipLimit,
    samOpacity,
    showContour,
    attentionIntensity,
    samPolygon
  ]);

  return (
    <div
      id="dermoscopy-visualizer-card"
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-slate-800 space-y-0"
    >
      {/* Header controls bar */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Preprocessed Dermoscopic Inspection
            </h3>
            <p className="text-[11px] text-slate-500">
              SAM Boundary Isolation + Contrast Enhancement Pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="change-sample-image-btn"
            type="button"
            onClick={onOpenUploader}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all"
          >
            Upload / Change Lesion
          </button>

          <button
            id="toggle-zoom-btn"
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            title={isZoomed ? 'Reset Zoom' : 'Magnify 1.4x'}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-all"
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer selector tabs */}
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider mr-1 text-slate-500">
          Visual Layer:
        </span>

        <button
          id="layer-raw-btn"
          type="button"
          onClick={() => setActiveLayer('raw')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
            activeLayer === 'raw'
              ? 'bg-white text-blue-800 border border-blue-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Raw RGB (HAM10000)
        </button>

        <button
          id="layer-clahe-btn"
          type="button"
          onClick={() => setActiveLayer('clahe')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
            activeLayer === 'clahe'
              ? 'bg-white text-amber-900 border border-amber-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3 h-3 text-amber-600" />
          <span>2. CLAHE Equalized</span>
        </button>

        <button
          id="layer-sam-btn"
          type="button"
          onClick={() => setActiveLayer('sam')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
            activeLayer === 'sam'
              ? 'bg-white text-blue-700 border border-blue-500 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-3 h-3 text-blue-600" />
          <span>3. SAM Segmentation Mask</span>
        </button>

        <button
          id="layer-vit-btn"
          type="button"
          onClick={() => setActiveLayer('vit_attention')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
            activeLayer === 'vit_attention'
              ? 'bg-white text-purple-800 border border-purple-300 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3 h-3 text-purple-600" />
          <span>4. ViT Self-Attention</span>
        </button>
      </div>

      {/* Main Canvas Viewport with neutral dark backdrop for true dermatoscopy rendition */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 flex items-center justify-center overflow-hidden min-h-[340px] max-h-[500px]"
      >
        <canvas
          ref={canvasRef}
          className={`max-w-full h-auto object-contain transition-transform duration-300 cursor-crosshair ${
            isZoomed ? 'scale-125' : 'scale-100'
          }`}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-xs font-mono text-cyan-400 gap-2">
            <Zap className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Computing GPU Tensor Transformation...</span>
          </div>
        )}

        {/* Overlay HUD indicators */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <div className="bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-300 backdrop-blur-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              MODE: {activeLayer.toUpperCase()} • 224×224 TENSOR
            </span>
          </div>
        </div>

        {/* Morphometric Live HUD on Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 text-[10px] font-mono text-slate-300 space-y-0.5 backdrop-blur-xs max-w-xs pointer-events-none shadow-lg">
          <div className="text-cyan-400 font-bold border-b border-slate-700 pb-0.5 mb-1 flex items-center justify-between">
            <span>SAM MORPHOMETRY</span>
            <span>DIAMETER: {morphometrics.estimatedDiameterMm} mm</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Asymmetry Score:</span>
            <span className="text-white font-semibold">{morphometrics.asymmetryScore}/10</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Border Irregularity:</span>
            <span className="text-white font-semibold">{morphometrics.borderIrregularity}/10</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Color Variance:</span>
            <span className="text-white font-semibold">{morphometrics.colorVarianceScore}/10</span>
          </div>
        </div>
      </div>

      {/* Layer-Specific Fine Adjustment Controls */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {activeLayer === 'clahe' && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-semibold text-amber-700 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              CLAHE Clip Limit:
            </span>
            <input
              id="clahe-clip-slider"
              type="range"
              min="1.0"
              max="4.5"
              step="0.25"
              value={claheClipLimit}
              onChange={(e) => setClaheClipLimit(parseFloat(e.target.value))}
              className="w-32 accent-amber-600 cursor-pointer"
            />
            <span className="font-mono text-[11px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-800">
              {claheClipLimit.toFixed(2)}x
            </span>
            <span className="text-[11px] text-slate-500">
              (Reveals sub-dermal pigment net)
            </span>
          </div>
        )}

        {activeLayer === 'sam' && (
          <div className="flex items-center gap-4 flex-wrap w-full">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Mask Opacity:</span>
              <input
                id="sam-opacity-slider"
                type="range"
                min="0.1"
                max="0.85"
                step="0.05"
                value={samOpacity}
                onChange={(e) => setSamOpacity(parseFloat(e.target.value))}
                className="w-28 accent-blue-600 cursor-pointer"
              />
              <span className="font-mono text-[11px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-800">
                {Math.round(samOpacity * 100)}%
              </span>
            </div>

            <button
              id="toggle-contour-btn"
              type="button"
              onClick={() => setShowContour(!showContour)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                showContour
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              {showContour ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Contour Boundary</span>
            </button>

            <span className="text-[11px] text-slate-500 ml-auto">
              Meta SAM Zero-Shot Lesion Boundary
            </span>
          </div>
        )}

        {activeLayer === 'vit_attention' && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-semibold text-purple-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              ViT Cross-Attention Scale:
            </span>
            <input
              id="vit-intensity-slider"
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={attentionIntensity}
              onChange={(e) => setAttentionIntensity(parseFloat(e.target.value))}
              className="w-32 accent-purple-600 cursor-pointer"
            />
            <span className="font-mono text-[11px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-800">
              {Math.round(attentionIntensity * 100)}%
            </span>
            <span className="text-[11px] text-slate-500">
              Red indicates peak transformer attention
            </span>
          </div>
        )}

        {activeLayer === 'raw' && (
          <div className="text-xs text-slate-500">
            Standard 224×224 RGB Dermoscopy image from the HAM10000 Kaggle dataset.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Benchmark Performance</h4>
            <p className="text-[11px] text-slate-500">
              HAM10000 test-set comparison from the project evaluation results
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Higher is better
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="bg-rose-800 text-white">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-bold">Metric</th>
                <th scope="col" className="px-3 py-2 text-center font-bold">Proposed</th>
                <th scope="col" className="px-3 py-2 text-center font-bold">Baseline 1</th>
                <th scope="col" className="px-3 py-2 text-center font-bold">Baseline 2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {PERFORMANCE_COMPARISON.map((row) => (
                <tr key={row.metric} className="hover:bg-slate-50">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-slate-700">
                    {row.metric}
                  </th>
                  <td className="px-3 py-2 text-center font-semibold text-blue-700">{row.proposed}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{row.baseline1}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{row.baseline2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
