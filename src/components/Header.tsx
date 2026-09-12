import { DepartmentType, AbhaProfile, LanguageOption } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Stethoscope,
  Sparkles,
  RefreshCw,
  Layers,
  KeyRound,
  User,
  CheckCircle2,
  Languages,
} from 'lucide-react';

interface HeaderProps {
  department: DepartmentType;
  onDepartmentChange: (dept: DepartmentType) => void;
  onReset: () => void;
  onOpenScenarios: () => void;
  onOpenApiKeys: () => void;
  hasApiKey: boolean;
  activeMode: string;
  patientProfile?: AbhaProfile | null;
  selectedLanguage?: LanguageOption;
  onChangeLanguage?: () => void;
  onBackToAbha?: () => void;
  viewMode?: 'kiosk' | 'doctor';
  onToggleViewMode?: (mode: 'kiosk' | 'doctor') => void;
  doctorQueueCount?: number;
}

export default function Header({
  department,
  onDepartmentChange,
  onReset,
  onOpenScenarios,
  onOpenApiKeys,
  hasApiKey,
  patientProfile,
  selectedLanguage,
  onChangeLanguage,
  onBackToAbha,
  viewMode = 'kiosk',
  onToggleViewMode,
  doctorQueueCount = 0,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* Logo & Mode Switcher */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg leading-none shadow-xs">
              +
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
                  MediKiosk
                </h1>
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                  ABDM OPD
                </span>
              </div>
            </div>

            {/* View Mode Toggle (Kiosk vs Doctor OPD Desk) */}
            {onToggleViewMode && (
              <div className="ml-2 hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => onToggleViewMode('kiosk')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'kiosk'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Patient Kiosk
                </button>
                <button
                  type="button"
                  onClick={() => onToggleViewMode('doctor')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'doctor'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3 h-3" />
                  <span>Doctor Desk</span>
                  {doctorQueueCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        viewMode === 'doctor'
                          ? 'bg-white text-blue-700 font-black'
                          : 'bg-blue-600 text-white font-bold'
                      }`}
                    >
                      {doctorQueueCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Center: Linked Patient & Language Badges */}
          <div className="flex items-center gap-2">
            {patientProfile && (
              <button
                type="button"
                onClick={onBackToAbha}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors cursor-pointer group"
                title="Click to change patient"
              >
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  {patientProfile.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-900 text-[11px] leading-tight flex items-center gap-1">
                    <span className="truncate max-w-[100px]">{patientProfile.name}</span>
                    {patientProfile.is_verified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {patientProfile.is_verified ? patientProfile.abha_id : 'Walk-in'}
                  </div>
                </div>
              </button>
            )}

            {selectedLanguage && onChangeLanguage && (
              <button
                type="button"
                onClick={onChangeLanguage}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Change language"
              >
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-[11px]">{selectedLanguage.nativeName}</span>
              </button>
            )}
          </div>

          {/* Right: Department Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Department Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => onDepartmentChange('Allopathic')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  department === 'Allopathic'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3 h-3 text-blue-600" />
                <span className="hidden md:inline">Allopathic</span>
                <span className="md:hidden">Allo</span>
              </button>
              <button
                type="button"
                onClick={() => onDepartmentChange('AYUSH')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  department === 'AYUSH'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>AYUSH</span>
              </button>
            </div>

            {/* API Keys Modal Button */}
            <button
              type="button"
              onClick={onOpenApiKeys}
              className={`text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer border ${
                hasApiKey
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
              title="Configure Gemini & Sarvam API Keys"
            >
              <KeyRound className="w-3.5 h-3.5 text-current" />
              <span className="hidden lg:inline">{hasApiKey ? 'Keys Ready' : 'Setup Keys'}</span>
            </button>

            {/* Test Scenarios */}
            <button
              type="button"
              onClick={onOpenScenarios}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="Open test scenarios"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Scenarios</span>
            </button>

            {/* Install PWA App (If Supported) */}
            <PWAInstallButton />

            {/* Reset Kiosk */}
            <button
              type="button"
              onClick={onReset}
              title="Reset Kiosk (Next Patient)"
              className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
