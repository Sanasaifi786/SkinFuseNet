import React from 'react';
import {
  Scan,
  BarChart3,
  FolderArchive,
  Heart,
  BookOpen,
  Stethoscope
} from 'lucide-react';
import { AppPage } from '../types';

interface HeaderProps {
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  totalRecords: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onSelectPage,
  totalRecords,
}) => {
  return (
    <header
      id="app-header"
      className="w-full sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 border-b bg-white/95 border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onSelectPage('scan')}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                SkinFuseNet
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Clinical AI
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden sm:block">
              HAM10000 Multi-Modal Skin Lesion Diagnostic System
            </p>
          </div>
        </div>

        {/* Center: Clean White-Theme Multi-Page Navigation Tabs */}
        <nav
          id="main-navigation-tabs"
          className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs"
        >
          <button
            type="button"
            id="nav-tab-scan"
            onClick={() => onSelectPage('scan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activePage === 'scan'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Scan & Diagnose</span>
          </button>

          <button
            type="button"
            id="nav-tab-models"
            onClick={() => onSelectPage('models')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activePage === 'models'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Model Benchmarks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              V1–V6
            </span>
          </button>

          <button
            type="button"
            id="nav-tab-records"
            onClick={() => onSelectPage('records')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activePage === 'records'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Patient Records</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-medium">
              {totalRecords}
            </span>
          </button>

          <button
            type="button"
            id="nav-tab-patient"
            onClick={() => onSelectPage('patient')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activePage === 'patient'
                ? 'bg-white text-teal-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Patient View</span>
          </button>

          <button
            type="button"
            id="nav-tab-ontology"
            onClick={() => onSelectPage('ontology')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activePage === 'ontology'
                ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>7 Lesion Types</span>
          </button>
        </nav>

        {/* Right: Mobile Selector Only */}
        <div className="flex items-center">
          {/* Mobile dropdown */}
          <select
            value={activePage}
            onChange={(e) => onSelectPage(e.target.value as AppPage)}
            className="md:hidden px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 shadow-xs"
          >
            <option value="scan">🔬 Scan & Diagnose</option>
            <option value="models">📊 Model Benchmarks (V1-V6)</option>
            <option value="records">📁 Patient Records ({totalRecords})</option>
            <option value="patient">🌿 Patient View</option>
            <option value="ontology">📚 7 Lesion Types</option>
          </select>
        </div>
      </div>
    </header>
  );
};
