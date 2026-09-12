import { useState, useEffect } from 'react';
import { KeyRound, X, Check, ShieldCheck, Eye, EyeOff, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiKey: string;
  sarvamKey: string;
  onSaveKeys: (geminiKey: string, sarvamKey: string) => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  geminiKey: initialGeminiKey,
  sarvamKey: initialSarvamKey,
  onSaveKeys,
}: ApiKeyModalProps) {
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [sarvamKey, setSarvamKey] = useState(initialSarvamKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showSarvam, setShowSarvam] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGeminiKey(initialGeminiKey);
    setSarvamKey(initialSarvamKey);
  }, [initialGeminiKey, initialSarvamKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(geminiKey.trim(), sarvamKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setGeminiKey('');
    setSarvamKey('');
    onSaveKeys('', '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">API Configuration</h3>
              <p className="text-[11px] text-slate-500">Provide keys for live AI models</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="gemini-key-input" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                Gemini API Key
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-mono border border-blue-200">
                  Required for AI
                </span>
              </label>
              {geminiKey ? (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Not set</span>
              )}
            </div>
            <div className="relative">
              <input
                id="gemini-key-input"
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 placeholder-slate-400 outline-none font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Powers conversational clinical intake, multimodal prescription OCR, and report generation.
            </p>
          </div>

          {/* Sarvam AI API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sarvam-key-input" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                Sarvam AI API Key
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                  Optional
                </span>
              </label>
              {sarvamKey ? (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Uses Browser Speech</span>
              )}
            </div>
            <div className="relative">
              <input
                id="sarvam-key-input"
                type={showSarvam ? 'text' : 'password'}
                value={sarvamKey}
                onChange={(e) => setSarvamKey(e.target.value)}
                placeholder="sarvam_..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 pr-9 text-xs text-slate-800 placeholder-slate-400 outline-none font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSarvam(!showSarvam)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showSarvam ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Used for Indian language Speech-to-Text (Saaras v3) and Text-to-Speech (Bulbul v3).
            </p>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Keys are stored locally in your browser session and sent securely to backend endpoints.
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            {(geminiKey || sarvamKey) ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Keys</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{saved ? 'Saved' : 'Save Keys'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
