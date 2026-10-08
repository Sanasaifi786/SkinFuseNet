import React from 'react';
import {
  Heart,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Printer,
  Calendar,
  PhoneCall,
  Sparkles,
  Info,
  Shield,
  FileText
} from 'lucide-react';
import { EnsemblePrediction, PatientMetadata, SampleCase } from '../types';
import { HAM10000_CLASSES } from '../data/lesionData';

interface PatientViewProps {
  prediction: EnsemblePrediction;
  metadata: PatientMetadata;
  imageSrc: string;
  onSwitchToClinical: () => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  prediction,
  metadata,
  imageSrc,
  onSwitchToClinical
}) => {
  const info = HAM10000_CLASSES[prediction.topClass];

  const isLowRisk = prediction.urgencyLevel === 'low';
  const isModerateRisk = prediction.urgencyLevel === 'moderate';
  const isHighRisk = prediction.urgencyLevel === 'critical';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-stone-800" id="patient-view-root">
      {/* Friendly reassurance banner */}
      <div
        id="patient-reassurance-banner"
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isLowRisk
            ? 'bg-emerald-50/90 border-emerald-200 shadow-sm'
            : isModerateRisk
            ? 'bg-amber-50/90 border-amber-200 shadow-sm'
            : 'bg-rose-50/90 border-rose-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-2xl ${
                  isLowRisk
                    ? 'bg-emerald-100 text-emerald-700'
                    : isModerateRisk
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase font-bold tracking-wider text-stone-600">
                Patient Consultation Overview
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif">
              {info.commonName}
            </h1>

            <p className="text-sm text-stone-600 max-w-xl leading-relaxed">
              {info.patientExplanation}
            </p>
          </div>

          {/* Calm Risk Badge */}
          <div
            className={`px-4 py-3 rounded-2xl text-center shrink-0 border ${
              isLowRisk
                ? 'bg-white border-emerald-200 text-emerald-800'
                : isModerateRisk
                ? 'bg-white border-amber-200 text-amber-800'
                : 'bg-white border-rose-200 text-rose-800'
            }`}
          >
            <div className="text-xs uppercase font-bold tracking-wider opacity-75">
              Assessed Status
            </div>
            <div className="text-lg font-bold font-serif">
              {isLowRisk
                ? 'Reassuring / Benign'
                : isModerateRisk
                ? 'Needs Check-Up'
                : 'Evaluation Recommended'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Image & Plain-English Explanation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lesion Photo Card */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            Your Scanned Skin Lesion
          </h3>
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            <img
              src={imageSrc}
              alt="Dermoscopic photograph"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-stone-700 border border-stone-200 shadow-xs">
              Location: {metadata.anatomicalSite.replace('_', ' ')}
            </div>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            This image was evaluated using our clinical AI model trained on over 10,000 dermatoscopic images (HAM10000) from academic medical centers.
          </p>
        </div>

        {/* What this means for you */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <span>What Does This Mean For You?</span>
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm text-stone-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <strong>Condition: </strong>
                  {info.fullName} is categorized medically as{' '}
                  <span className="font-semibold text-stone-900">{info.severity}</span>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <strong>Recommended Next Step: </strong>
                  {isHighRisk ? (
                    <span className="text-rose-700 font-semibold">
                      Schedule a prompt appointment with a board-certified dermatologist for a simple, in-person examination and possible biopsy.
                    </span>
                  ) : isModerateRisk ? (
                    <span className="text-amber-700 font-semibold">
                      Arrange a routine dermatological visit within the next few weeks for specialized dermoscopic follow-up.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      Continue routine self-monitoring at home. If you notice rapid changes in size or color, book a check-up.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <strong>Biopsy Reassurance: </strong>
                  If a biopsy is suggested, it is a very gentle, quick 5-minute in-office procedure performed under a local numbing injection with minimal discomfort.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Patient Summary</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToClinical}
              className="text-xs font-semibold text-[#0D9488] hover:underline"
            >
              View Full Clinical Telemetry →
            </button>
          </div>
        </div>
      </div>

      {/* ABCDE Education Guide Cards */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-stone-900 font-serif">
            The ABCDE Rule of Skin Self-Checks
          </h3>
          <p className="text-xs text-stone-500">
            Dermatologists recommend checking your skin once a month using these five visual clues:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center font-serif text-sm">
              A
            </div>
            <div className="font-bold text-stone-900">Asymmetry</div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              One half does not match the other half in shape or contour.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center font-serif text-sm">
              B
            </div>
            <div className="font-bold text-stone-900">Border</div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              The edges are irregular, ragged, notched, or blurred.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center font-serif text-sm">
              C
            </div>
            <div className="font-bold text-stone-900">Color</div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Varied shades of brown, black, red, white, or blue.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center font-serif text-sm">
              D
            </div>
            <div className="font-bold text-stone-900">Diameter</div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Larger than 6 millimeters across (about the size of a pencil eraser).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1">
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-[#0D9488] font-bold flex items-center justify-center font-serif text-sm">
              E
            </div>
            <div className="font-bold text-stone-900">Evolution</div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Any change in size, shape, color, elevation, or symptom like itching or bleeding.
            </p>
          </div>
        </div>
      </div>

      {/* Questions to ask your doctor */}
      <div className="bg-[#F4EFEA] p-5 sm:p-6 rounded-3xl border border-[#E8E2D9] space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#0D9488]" />
          <span>Recommended Questions To Ask Your Doctor</span>
        </h4>

        <ul className="list-disc list-inside text-xs sm:text-sm text-stone-700 space-y-1.5">
          <li>"Do you recommend an in-office dermoscopic evaluation or a small biopsy for this spot?"</li>
          <li>"Should we take digital baseline photos to monitor whether it changes over 3 to 6 months?"</li>
          <li>"What is my personal risk profile given my skin phototype ({metadata.fitzpatrickSkinType}) and sun history?"</li>
          <li>"How often should I schedule a full-body skin examination?"</li>
        </ul>
      </div>
    </div>
  );
};
