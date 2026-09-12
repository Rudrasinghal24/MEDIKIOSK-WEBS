import { AlertOctagon, Siren, PhoneCall, ArrowRight, UserCheck, QrCode } from 'lucide-react';

interface TriageAlertModalProps {
  isOpen: boolean;
  alertReason: string | null;
  patientStatement?: string;
  onDismiss: () => void;
  onProceedToEmergency: () => void;
}

export default function TriageAlertModal({
  isOpen,
  alertReason,
  patientStatement,
  onDismiss,
  onProceedToEmergency,
}: TriageAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-2 border-red-500 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        {/* Top Emergency Header */}
        <div className="bg-red-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-100">
                Triage Alert: Emergency
              </div>
              <h2 className="text-base sm:text-lg font-bold">
                Emergency Red Flag Detected
              </h2>
            </div>
          </div>
          <AlertOctagon className="w-6 h-6 text-white/50" />
        </div>

        {/* Instruction Content */}
        <div className="p-5 space-y-4 text-slate-800">
          {/* Hindi Prompt */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
            <p className="text-sm font-bold text-red-800">
              तत्काल आपातकालीन नर्सिंग काउंटर / कैजुअल्टी वार्ड में जाएं!
            </p>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              आपकी बताई गई शिकायत में गंभीर लक्षण पाए गए हैं। सामान्य ओपीडी की कतार में प्रतीक्षा न करें।
            </p>
          </div>

          {/* Clinical Trigger Reason */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Identified Trigger
            </div>
            <div className="text-xs sm:text-sm font-medium text-red-700 mt-1">
              {alertReason || 'Acute symptom profile requiring immediate physician triage.'}
            </div>
            {patientStatement && (
              <div className="mt-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                &ldquo;{patientStatement}&rdquo;
              </div>
            )}
          </div>

          {/* Emergency Pass Token & Alert info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg text-emerald-600 border border-slate-200">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Emergency Pass</div>
                <div className="text-xs font-bold text-slate-800 font-mono">EMG-049</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2.5">
              <div className="p-2 bg-white rounded-lg text-red-600 border border-slate-200">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Nursing Station</div>
                <div className="text-xs font-bold text-slate-800">Attendant Alerted</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onProceedToEmergency}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Proceed to Casualty</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-3.5 rounded-xl transition-colors text-xs cursor-pointer"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
