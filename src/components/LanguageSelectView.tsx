import { useState } from 'react';
import { LanguageOption, AbhaProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { speakPrompt, stopSpeaking } from '../utils/speechUtils';
import {
  Languages,
  Volume2,
  VolumeX,
  ArrowRight,
  Check,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface LanguageSelectViewProps {
  currentLanguage: LanguageOption;
  patientProfile: AbhaProfile | null;
  onSelectLanguage: (lang: LanguageOption) => void;
  onBackToAbha: () => void;
  sarvamKey?: string;
}

export default function LanguageSelectView({
  currentLanguage,
  patientProfile,
  onSelectLanguage,
  onBackToAbha,
  sarvamKey,
}: LanguageSelectViewProps) {
  const [selected, setSelected] = useState<LanguageOption>(currentLanguage);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePreviewAudio = (lang: LanguageOption) => {
    stopSpeaking();
    setSelected(lang);
    setIsPlayingAudio(true);
    speakPrompt(
      lang.sampleGreeting,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      lang.code,
      sarvamKey
    ).catch(() => {
      setIsPlayingAudio(false);
    });
  };

  const handleConfirm = () => {
    stopSpeaking();
    onSelectLanguage(selected);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToAbha}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to ABHA Login</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                <Languages className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Select Your Language / भाषा चुनें
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Choose your preferred language for the conversational AI voice assistant. The kiosk will speak and listen in your selected tongue.
            </p>
          </div>

          {/* Patient Badge */}
          {patientProfile && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs sm:text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Patient Linked
              </span>
              <div className="font-bold text-slate-900">{patientProfile.name}</div>
              <div className="text-emerald-700 font-mono text-[11px]">
                {patientProfile.is_verified ? `ABHA: ${patientProfile.abha_id}` : 'Walk-in Guest'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selected.code === lang.code;
          return (
            <div
              key={lang.code}
              onClick={() => setSelected(lang)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {lang.nativeName}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {lang.englishName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {lang.subtext}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewAudio(lang);
                    }}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isSelected && isPlayingAudio
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700'
                    }`}
                    title="Hear audio preview"
                  >
                    {isSelected && isPlayingAudio ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Sample greeting preview */}
              <div className="bg-slate-50/70 rounded-xl p-2.5 text-[11px] text-slate-600 border border-slate-100 line-clamp-2 italic">
                "{lang.sampleGreeting}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Action Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">
              Selected: <span className="text-blue-700 font-bold">{selected.name}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Two-way voice assistant and multilingual text transcription will initiate immediately.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>Confirm &amp; Start Intake</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
