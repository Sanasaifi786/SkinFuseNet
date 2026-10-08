import React from 'react';
import {
  User,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PatientMetadata } from '../types';

interface MetadataPanelProps {
  metadata: PatientMetadata;
  onChange: (updated: PatientMetadata) => void;
  isClinical?: boolean;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  metadata,
  onChange
}) => {
  const updateField = <K extends keyof PatientMetadata>(field: K, value: PatientMetadata[K]) => {
    onChange({
      ...metadata,
      [field]: value
    });
  };

  return (
    <div
      id="metadata-panel-root"
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-slate-800 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Step 2: Patient Demographics & Clinical Symptoms
            </h3>
            <p className="text-xs text-slate-500">
              Correlated with multi-modal neural network prior
            </p>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          Clinical Prior Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* Patient Age */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 flex items-center justify-between">
            <span>Patient Age:</span>
            <span className="font-mono text-blue-700 font-bold">{metadata.age} yrs</span>
          </label>
          <input
            id="metadata-age-slider"
            type="range"
            min="10"
            max="95"
            value={metadata.age}
            onChange={(e) => updateField('age', parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Biological Sex */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Biological Sex:</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => updateField('sex', 'male')}
              className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-all ${
                metadata.sex === 'male'
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => updateField('sex', 'female')}
              className={`py-1.5 px-2 rounded-lg text-center font-medium border transition-all ${
                metadata.sex === 'female'
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Female
            </button>
          </div>
        </div>

        {/* Anatomical Localization */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Anatomical Site:</span>
          </label>
          <select
            id="metadata-anatomical-site-select"
            value={metadata.anatomicalSite}
            onChange={(e) =>
              updateField('anatomicalSite', e.target.value as PatientMetadata['anatomicalSite'])
            }
            className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="face">Face / Nasal / Malar</option>
            <option value="back">Upper / Lower Back</option>
            <option value="chest">Anterior Chest</option>
            <option value="trunk">Abdomen / Trunk</option>
            <option value="upper_extremity">Upper Extremity / Arm</option>
            <option value="lower_extremity">Lower Extremity / Leg</option>
            <option value="scalp">Scalp</option>
            <option value="neck">Neck</option>
            <option value="acral">Acral (Palmar / Plantar)</option>
          </select>
        </div>

        {/* Fitzpatrick Skin Type */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Fitzpatrick Skin Phototype:</label>
          <select
            id="metadata-fitzpatrick-select"
            value={metadata.fitzpatrickSkinType}
            onChange={(e) =>
              updateField(
                'fitzpatrickSkinType',
                e.target.value as PatientMetadata['fitzpatrickSkinType']
              )
            }
            className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="I">Type I - Always burns, never tans (Pale)</option>
            <option value="II">Type II - Burns easily, tans minimally (Fair)</option>
            <option value="III">Type III - Burns moderately, tans uniformly (Medium)</option>
            <option value="IV">Type IV - Burns minimally, tans well (Olive)</option>
            <option value="V">Type V - Rarely burns, tans profusely (Brown)</option>
            <option value="VI">Type VI - Never burns (Deeply pigmented)</option>
          </select>
        </div>

        {/* Evolution Duration */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Evolution Duration:</span>
          </label>
          <select
            id="metadata-duration-select"
            value={metadata.lesionDuration}
            onChange={(e) =>
              updateField(
                'lesionDuration',
                e.target.value as PatientMetadata['lesionDuration']
              )
            }
            className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden"
          >
            <option value="<1 month">Sudden onset (&lt; 1 month)</option>
            <option value="1-6 months">Rapid change (1-6 months)</option>
            <option value="6-12 months">Gradual change (6-12 months)</option>
            <option value=">1 year">Longstanding stable (&gt; 1 year)</option>
            <option value="lifelong / congenital">Congenital / Lifelong</option>
          </select>
        </div>
      </div>

      {/* Clinical Alarm Checkboxes */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
          Clinical Symptoms & Red Flags:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              metadata.hasEnlarging
                ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={metadata.hasEnlarging}
              onChange={(e) => updateField('hasEnlarging', e.target.checked)}
              className="accent-rose-600 rounded"
            />
            <span className="text-xs">Rapid Enlarging</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              metadata.hasBleeding
                ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={metadata.hasBleeding}
              onChange={(e) => updateField('hasBleeding', e.target.checked)}
              className="accent-rose-600 rounded"
            />
            <span className="text-xs">Bleeding / Oozing</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              metadata.hasColorChange
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={metadata.hasColorChange}
              onChange={(e) => updateField('hasColorChange', e.target.checked)}
              className="accent-amber-600 rounded"
            />
            <span className="text-xs">Color Darkening</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              metadata.hasItching
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={metadata.hasItching}
              onChange={(e) => updateField('hasItching', e.target.checked)}
              className="accent-amber-600 rounded"
            />
            <span className="text-xs">Itching / Pain</span>
          </label>

          <label
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
              metadata.familyMelanomaHistory
                ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={metadata.familyMelanomaHistory}
              onChange={(e) => updateField('familyMelanomaHistory', e.target.checked)}
              className="accent-rose-600 rounded"
            />
            <span className="text-xs">Family Melanoma</span>
          </label>
        </div>
      </div>
    </div>
  );
};
