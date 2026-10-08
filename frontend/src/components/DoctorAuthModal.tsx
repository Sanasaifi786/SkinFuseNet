import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { DoctorProfile } from '../types';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDoctor: DoctorProfile;
  onUpdateDoctor: (updated: DoctorProfile) => void;
  isClinical?: boolean;
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  currentDoctor,
  onUpdateDoctor
}) => {
  const [name, setName] = useState(currentDoctor.name);
  const [specialty, setSpecialty] = useState(currentDoctor.specialty);
  const [institution, setInstitution] = useState(currentDoctor.institution);
  const [email, setEmail] = useState(currentDoctor.email);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(currentDoctor.isCloudSynced);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoctor({
      ...currentDoctor,
      name,
      specialty,
      institution,
      email,
      isCloudSynced: cloudSyncEnabled
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleQuickSwitch = (role: 'sameer' | 'fellow') => {
    if (role === 'sameer') {
      setName('Dr. Sameer Maurya');
      setSpecialty('Cutaneous Oncology & AI Diagnostics');
      setInstitution('Oncology Research & Clinical Translation Center');
      setEmail('sameermaurya97044@gmail.com');
    } else {
      setName('Dr. Elena Rostova');
      setSpecialty('Dermatopathology & Melanoma Specialist');
      setInstitution('Memorial Academic Skin Cancer Center');
      setEmail('e.rostova@dermatology-research.org');
    }
  };

  return (
    <div
      id="doctor-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="doctor-auth-modal-content"
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden my-auto text-slate-800"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Physician Credentials & Cloud Session
              </h3>
              <p className="text-xs text-slate-500">
                Verified clinical account settings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Switch Profile:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwitch('sameer')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  name.includes('Sameer')
                    ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900">Dr. Sameer Maurya</div>
                <div className="text-[10px] text-slate-500">Lead Investigator</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('fellow')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  name.includes('Elena')
                    ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900">Dr. Elena Rostova</div>
                <div className="text-[10px] text-slate-500">Clinical Fellow</div>
              </button>
            </div>
          </div>

          {/* Practitioner Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Physician Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Specialty / Title</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Institution */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Hospital / Clinical Affiliation</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Institutional Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Cloud Storage Synchronization Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-800">Automatic Cloud Case Backup</div>
                <div className="text-[10px] text-slate-500">
                  Safely preserves patient diagnosis records
                </div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={cloudSyncEnabled}
              onChange={(e) => setCloudSyncEnabled(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Practitioner Profile Saved & Synced!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-all"
            >
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
