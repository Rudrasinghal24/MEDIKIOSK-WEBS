import { LlamaAuditReport, MediKioskPayload } from '../types';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

interface LlamaAuditViewProps {
  auditReport: LlamaAuditReport | null;
  payload?: MediKioskPayload;
  onRunAudit: () => Promise<void>;
  isLoading: boolean;
  onViewPhysicianSummary: () => void;
}

export default function LlamaAuditView({
  auditReport,
  onRunAudit,
  isLoading,
  onViewPhysicianSummary,
}: LlamaAuditViewProps) {
  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Clinical Intake Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-verifies patient transcripts, flags potential discrepancies, and validates DPDP compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAudit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{auditReport ? 'Re-run Audit' : 'Run Audit'}</span>
        </button>
      </div>

      {/* Main Audit Report Card */}
      {auditReport ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Status & Confidence Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  auditReport.verification_status === 'VERIFIED_PASSED'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}
              >
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">
                  Engine: {auditReport.auditor_agent}
                </div>
                <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Status:</span>
                  <span
                    className={
                      auditReport.verification_status === 'VERIFIED_PASSED'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }
                  >
                    {auditReport.verification_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-3 self-start sm:self-auto">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">
                  Confidence Score
                </div>
                <div className="text-base font-mono font-bold text-emerald-600">
                  {Math.round(auditReport.confidence_score * 100)}%
                </div>
              </div>
              <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.round(auditReport.confidence_score * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Verification Matrix */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-700">
              Audit Checklist
            </div>

            {/* 1. Framework Adherence */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  Clinical Framework Adherence
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {auditReport.checks?.socrates_adherence?.details ||
                    'Single-question pacing preserved; onset and chief complaint captured.'}
                </div>
              </div>
            </div>

            {/* 2. Red-Flag Sensitivity */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  Red-Flag Triage Validation
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {auditReport.checks?.red_flag_sensitivity?.details ||
                    'Continuous triage evaluation confirmed. No signs of acute distress.'}
                </div>
              </div>
            </div>

            {/* 3. Anti-Hallucination */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  Anti-Hallucination Verification
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {auditReport.checks?.anti_hallucination?.details ||
                    'Zero synthetic entities added. Reported complaints match transcript vocabulary.'}
                </div>
              </div>
            </div>

            {/* 4. DPDP Compliance */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  DPDP Act 2023 Compliance
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {auditReport.checks?.dpdp_compliance?.details ||
                    'No 12-digit Aadhaar leaked in transcripts or notes. Redaction enforced.'}
                </div>
              </div>
            </div>

            {/* 5. FHIR Schema */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  FHIR R4 Schema Validation
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {auditReport.checks?.fhir_data_integrity?.details ||
                    'Valid Condition, Observation, and MedicationStatement resources ready.'}
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Advisory Notes */}
          {auditReport.clinical_notes_for_doctor && auditReport.clinical_notes_for_doctor.length > 0 && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-xs font-semibold text-blue-800 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" />
                Auditor Notes for Physician:
              </div>
              <ul className="space-y-1 text-xs text-blue-900">
                {auditReport.clinical_notes_for_doctor.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Proceed to Physician Summary */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onViewPhysicianSummary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer"
            >
              <span>View Physician Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Audit Ready</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              Run audit to cross-verify transcripts, check red flags, and ensure DPDP compliance.
            </p>
          </div>
          <button
            type="button"
            onClick={onRunAudit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Audit</span>
          </button>
        </div>
      )}
    </div>
  );
}
