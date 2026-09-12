import { useState, useMemo, useRef } from 'react';
import {
  MediKioskPayload,
  DepartmentType,
  AbhaProfile,
  DialogueMessage,
  ScannedDocument,
  DoctorQueuePatient,
  CompleteMedicalHistory,
} from '../types';
import { synthesizeCompleteMedicalHistory } from '../utils/medicalHistorySynthesis';
import { enrichMedicationsWithPurpose } from '../utils/medicationKnowledge';
import { generatePatientSummaryPdf } from '../utils/pdfGenerator';
import {
  Printer,
  Download,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Stethoscope,
  Pill,
  Hospital,
  ShieldCheck,
  RotateCcw,
  Check,
  FileType,
  Activity,
  AlertCircle,
  Microscope,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

interface PatientSummaryReportViewProps {
  payload: MediKioskPayload;
  patientProfile?: AbhaProfile | null;
  department: DepartmentType;
  conversationHistory: DialogueMessage[];
  uploadedDocuments: ScannedDocument[];
  onSendToDoctor: (patientRecord: DoctorQueuePatient) => void;
  onBackToEdit: () => void;
  onNewSession: () => void;
  onViewDoctorDesk?: () => void;
  tokenNumber?: string;
}

export default function PatientSummaryReportView({
  payload,
  patientProfile,
  department,
  conversationHistory,
  uploadedDocuments,
  onSendToDoctor,
  onBackToEdit,
  onNewSession,
  onViewDoctorDesk,
  tokenNumber: initialToken,
}: PatientSummaryReportViewProps) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isSentToDoctor, setIsSentToDoctor] = useState(false);
  const [assignedToken] = useState<string>(() => {
    return initialToken || `OPD-${Math.floor(100 + Math.random() * 900)}`;
  });

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Synthesize Complete Medical History
  const completeMedicalHistory = useMemo<CompleteMedicalHistory>(() => {
    return synthesizeCompleteMedicalHistory({
      clinicalData: payload.clinical_data,
      conversationHistory,
      uploadedDocuments,
      patientProfile,
      department,
      triage: payload.triage,
    });
  }, [payload.clinical_data, conversationHistory, uploadedDocuments, patientProfile, department, payload.triage]);

  // 2. Smart Medication Purpose Enrichment
  const enrichedMedications = useMemo(() => {
    return enrichMedicationsWithPurpose(completeMedicalHistory.combinedMedications);
  }, [completeMedicalHistory.combinedMedications]);

  // 3. Clinical Impressions & Inferences
  const inferredConditions = completeMedicalHistory.inferredClinicalImpressions;

  // 4. Clinical Correlation details
  const correlation = completeMedicalHistory.clinicalCorrelation;
  const simplifiedContext = completeMedicalHistory.simplifiedMedicalContext;

  // Triage state
  const isEmergency =
    payload.triage.red_flag_detected ||
    payload.triage.urgency_level === 'Emergency' ||
    inferredConditions.some((c) => c.isRedFlag);

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print error, triggering PDF download:', err);
      handleDownloadPdf();
    }
  };

  const handleDownloadPdf = () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      const patientName = patientProfile?.name || 'Patient';
      const cleanFileName = `OPD_Summary_${patientName.replace(/\s+/g, '_')}_${assignedToken}.pdf`;
      const doc = generatePatientSummaryPdf({
        assignedToken,
        department,
        patientProfile,
        payload,
        inferredConditions,
        enrichedMedications,
        uploadedDocuments,
        completeMedicalHistory,
        currentDate,
        currentTime,
        isEmergency,
      });

      doc.save(cleanFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Doctor Handoff Simulation Handler
  const handleHandoff = () => {
    const queueRecord: DoctorQueuePatient = {
      id: `queue_${Date.now()}`,
      tokenNumber: assignedToken,
      patientProfile: patientProfile || {
        abha_id: 'WALKIN-OPD',
        abha_address: 'walkin@abdm.local',
        name: 'Walk-in Patient',
        gender: 'Male',
        age: 35,
        is_verified: false,
      },
      department,
      intakeTimestamp: `${currentDate} at ${currentTime}`,
      status: 'Waiting',
      triage: {
        urgency_level: isEmergency ? 'Emergency' : payload.triage.urgency_level || 'Routine',
        red_flag_detected: isEmergency,
        alert_reason: payload.triage.alert_reason || (isEmergency ? 'Critical Symptoms Detected' : null),
      },
      clinical_data: {
        ...payload.clinical_data,
        medications: completeMedicalHistory.combinedMedications,
      },
      inferredConditions,
      medications: completeMedicalHistory.combinedMedications,
      uploadedDocuments,
      conversationHistory,
      physician_summary_markdown: payload.physician_summary_markdown,
      completeMedicalHistory,
    };

    try {
      const existingStr = localStorage.getItem('medikiosk_doctor_queue');
      const existingQueue: DoctorQueuePatient[] = existingStr ? JSON.parse(existingStr) : [];
      const updatedQueue = [queueRecord, ...existingQueue.filter((q) => q.tokenNumber !== assignedToken)];
      localStorage.setItem('medikiosk_doctor_queue', JSON.stringify(updatedQueue));
    } catch (e) {
      console.warn('LocalStorage queue write error:', e);
    }

    onSendToDoctor(queueRecord);
    setIsSentToDoctor(true);
  };

  const primaryComplaint =
    simplifiedContext?.primaryChiefComplaint ||
    payload.clinical_data.chief_complaint ||
    'General Consultation';

  const durationOrTimeline =
    simplifiedContext?.timeline ||
    completeMedicalHistory.reportedSymptoms.timelineOnset ||
    '';

  const pastHistoryText =
    simplifiedContext?.pastHistorySummary ||
    (completeMedicalHistory.inferredPastConditions.length > 0
      ? completeMedicalHistory.inferredPastConditions.join(' • ')
      : 'No chronic illnesses identified on record');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Action Chrome (Hidden during print) */}
      <div className="no-print bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <button
          id="btn-back-intake"
          type="button"
          onClick={onBackToEdit}
          className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Intake
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print Button */}
          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Official Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Report</span>
          </button>

          {/* Download PDF Button */}
          <button
            id="btn-download-pdf"
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download PDF Document"
          >
            {isExportingPdf ? (
              <>
                <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800 font-bold">PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Download as PDF</span>
              </>
            )}
          </button>

          {/* Submit to Doctor Button */}
          <button
            id="btn-submit-doctor"
            type="button"
            onClick={handleHandoff}
            disabled={isSentToDoctor}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isSentToDoctor
                ? 'bg-emerald-700 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSentToDoctor ? (
              <>
                <Check className="w-4 h-4" />
                <span>Submitted to Doctor (Token #{assignedToken})</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit to Doctor Desk</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Banner for Doctor Handoff */}
      {isSentToDoctor && (
        <div className="no-print p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-3xl text-emerald-950 shadow-md">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-sm sm:text-base text-emerald-900 flex flex-wrap items-center gap-2">
                  <span>Intake Successfully Dispatched to OPD Queue!</span>
                  <span className="font-mono text-xs font-black bg-emerald-200/90 text-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300">
                    Token #{assignedToken}
                  </span>
                </div>
                <p className="text-emerald-800 text-xs mt-0.5">
                  The clinical synthesis is now live on the physician's OPD consultation desk. You can review the queue, download the PDF, or print.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto justify-start lg:justify-end">
              {onViewDoctorDesk && (
                <button
                  type="button"
                  onClick={onViewDoctorDesk}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Open Doctor Desk</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={onNewSession}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Next Intake</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLINICAL SUMMARY REPORT DOCUMENT (Printed & Captured by PDF) */}
      {/* ========================================================================= */}
      <div
        id="clinical-summary-report"
        ref={reportRef}
        className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-slate-900 font-sans print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Hospital Header & Token */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-slate-900 print-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold">
              <Hospital className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                NATIONAL HEALTH AUTHORITY • ABDM DIGITAL OPD
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                PATIENT SUMMARY REPORT
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                {department} Outpatient Department • Integrated Kiosk Intake Station
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">OPD QUEUE TOKEN</div>
            <div className="text-2xl font-black font-mono text-blue-800 tracking-wider">
              {assignedToken}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {currentDate} • {currentTime}
            </div>
          </div>
        </div>

        {/* Patient Demographics & Triage Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs print-break-inside-avoid">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patientProfile?.name || 'Walk-in Patient'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Age / Gender</span>
            <span className="font-bold text-slate-900">
              {patientProfile?.age || 35} Yrs • {patientProfile?.gender || 'Male'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">ABHA Identifier</span>
            <span className="font-mono font-bold text-blue-900 truncate block">
              {patientProfile?.abha_id || 'NOT LINKED'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Triage Status</span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[11px] ${
                isEmergency
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : payload.triage.urgency_level === 'Urgent'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isEmergency && <AlertTriangle className="w-3 h-3" />}
              {!isEmergency && <ShieldCheck className="w-3 h-3" />}
              {isEmergency ? 'EMERGENCY' : payload.triage.urgency_level || 'Routine'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REQUIREMENT 1: CURRENT CHIEF COMPLAINT AT TOP */}
        {/* ========================================================================= */}
        <div className="bg-blue-50/80 border-2 border-blue-300 rounded-2xl p-4 space-y-2 print-break-inside-avoid">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-200/80 px-2 py-0.5 rounded-md">
                Presenting Chief Complaint
              </span>
              {durationOrTimeline && (
                <span className="text-xs font-bold text-blue-800 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  Duration: {durationOrTimeline}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-blue-700">
              Session ID: {completeMedicalHistory.sessionId}
            </span>
          </div>

          <div className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
            {primaryComplaint}
          </div>

          {/* Spoken details bullet points */}
          {completeMedicalHistory.reportedSymptoms.dialogueKeyPoints.length > 0 ? (
            <div className="pt-1.5 border-t border-blue-200/60">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Reported Intake Findings:
              </span>
              <ul className="space-y-1 text-xs text-slate-800">
                {completeMedicalHistory.reportedSymptoms.dialogueKeyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            payload.clinical_data.history_of_present_illness && (
              <p className="text-xs text-slate-700 pt-1 border-t border-blue-200/60 leading-relaxed">
                {payload.clinical_data.history_of_present_illness}
              </p>
            )
          )}
        </div>

        {/* ========================================================================= */}
        {/* REQUIREMENT 1 (CONT.): DIRECT CLINICAL CORRELATION */}
        {/* [Current Complaint] + [Extracted History/Medication Context] */}
        {/* ========================================================================= */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-3 print-break-inside-avoid">
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Direct Clinical Correlation &amp; Background Synthesis
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
              Complaint + Past History
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Box A: Current Presentation */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Current Presentation
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {correlation?.currentPresentation || primaryComplaint}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Onset: {durationOrTimeline || 'Acute presentation'}
              </div>
            </div>

            {/* Box B: Background History & Active Meds Context */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Extracted Medical Context
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {pastHistoryText}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {enrichedMedications.length > 0
                  ? `${enrichedMedications.length} active medication(s) identified on record`
                  : 'No active prescriptions extracted'}
              </div>
            </div>
          </div>

          {/* High-yield physician correlation summary */}
          <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Physician Correlation:
                </span>
                <p className="text-slate-800 text-xs leading-relaxed mt-0.5">
                  {correlation?.clinicalCorrelationSummary || completeMedicalHistory.synthesisNarrative}
                </p>
              </div>
            </div>

            {correlation?.keyActionItem && (
              <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-emerald-950 font-medium bg-emerald-100/50 p-2 rounded-lg">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Priority Action / Workup:</strong> {correlation.keyActionItem}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* REQUIREMENT 2: SMART MEDICATION PURPOSE IDENTIFICATION TABLE */}
        <div className="space-y-2 print-break-inside-avoid">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              <h2 className="text-base font-black uppercase tracking-wider text-slate-800">
                Active Medications &amp; Identified Therapeutic Purposes
              </h2>
            </div>
            <span className="text-xs bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
              Smart Therapeutic Mapping
            </span>
          </div>

          {enrichedMedications.length === 0 ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-500 italic">
              No existing prescription slips or regular medications reported by patient.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-base border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Medication &amp; Strength</th>
                    <th className="py-2.5 px-3">Dosage / Frequency</th>
                    <th className="py-2.5 px-3">Primary Therapeutic Purpose</th>
                    <th className="py-2.5 px-3">Inferred Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-base">
                  {enrichedMedications.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      {/* Drug Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                          <span>{med.drugName}</span>
                          {med.isHighAlert && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                              Alert
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 block">{med.category}</span>
                      </td>

                      {/* Frequency */}
                      <td className="py-2.5 px-3 font-mono text-base text-slate-700">
                        <div className="font-semibold text-slate-900">{med.dosage}</div>
                        <div className="text-xs text-slate-500">{med.frequency} {med.duration ? `(${med.duration})` : ''}</div>
                      </td>

                      {/* Primary Therapeutic Purpose */}
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-purple-950 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md inline-block text-xs sm:text-sm">
                          {med.purpose}
                        </span>
                      </td>

                      {/* Inferred Condition */}
                      <td className="py-2.5 px-3 text-slate-800 font-bold text-base">
                        {med.inferredCondition}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION: Extracted Laboratory Investigations (if present) */}
        {((completeMedicalHistory.combinedLabs && completeMedicalHistory.combinedLabs.length > 0) ||
          (payload.extracted_document_data?.abnormal_labs && payload.extracted_document_data.abnormal_labs.length > 0)) && (
          <div className="space-y-2 print-break-inside-avoid">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-teal-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Laboratory Investigations &amp; Diagnostic Findings
                </h2>
              </div>
              <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                OCR Extracted Labs
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2 px-3">Test / Investigation</th>
                    <th className="py-2 px-3">Observed Value</th>
                    <th className="py-2 px-3">Reference Range</th>
                    <th className="py-2 px-3">Status Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(completeMedicalHistory.combinedLabs?.length
                    ? completeMedicalHistory.combinedLabs
                    : payload.extracted_document_data?.abnormal_labs || []
                  ).map((lab, idx) => {
                    const isHigh =
                      lab.status?.toLowerCase().includes('high') ||
                      lab.status?.toLowerCase().includes('critical');
                    const isLow = lab.status?.toLowerCase().includes('low');
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{lab.test}</td>
                        <td
                          className={`py-2 px-3 font-bold font-mono ${
                            isHigh ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {lab.value}
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          {lab.reference || 'Standard Range'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {lab.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION: Inferred Clinical Impressions (Actionable for Physician) */}
        {inferredConditions.length > 0 && (
          <div className="space-y-2 print-break-inside-avoid">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Clinical Impressions &amp; Differential Considerations
                </h2>
              </div>
              <span className="text-[10px] text-slate-500">
                Guidance for OPD Consultation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {inferredConditions.map((cond) => (
                <div
                  key={cond.id}
                  className={`p-3 rounded-2xl border text-xs ${
                    cond.isRedFlag
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                      : 'bg-white border-slate-200 shadow-2xs text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-950 truncate">{cond.condition}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        cond.confidence === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {cond.confidence}
                    </span>
                  </div>

                  {cond.suggestedAction && (
                    <div className="text-[11px] text-slate-600 mt-1 flex items-start gap-1">
                      <Stethoscope className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                      <span>{cond.suggestedAction}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Structured Prescription Extractions from Uploaded Slips */}
        {uploadedDocuments.some((d) => d.structuredSummary) && (
          <div className="space-y-3 pt-2 border-t border-slate-200 print-break-inside-avoid">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  Structured Prescription Regimens (OCR Digitize)
                </h2>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                Gemini Multi-Modal Schema
              </span>
            </div>

            {uploadedDocuments
              .filter((d) => d.structuredSummary)
              .map((d) => {
                const s = d.structuredSummary!;
                return (
                  <div key={d.id} className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-2.5 text-base">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-100">
                      <div className="text-base font-bold text-slate-950">
                        {d.name} <span className="text-sm text-slate-600 font-normal">({s.consultation_date || 'Date not recorded'})</span>
                      </div>
                      <div className="text-base text-slate-700">
                        Physician: <strong className="text-base font-bold text-slate-900">{s.doctor_name || 'Not specified'}</strong>
                      </div>
                    </div>

                    <div className="text-base text-slate-700">
                      Diagnosis: <span className="text-base font-bold text-slate-900">{s.diagnosis || 'General Consultation'}</span>
                    </div>

                    {s.medications && s.medications.length > 0 && (
                      <div className="border border-amber-200/80 rounded-xl overflow-x-auto bg-white mt-2">
                        <table className="w-full text-left text-base border-collapse">
                          <thead>
                            <tr className="bg-amber-100/60 text-xs sm:text-sm font-bold text-amber-950 uppercase border-b border-amber-200">
                              <th className="py-2 px-3">Medication</th>
                              <th className="py-2 px-3">Dosage</th>
                              <th className="py-2 px-3">Frequency</th>
                              <th className="py-2 px-3">Duration</th>
                              <th className="py-2 px-3">Indication</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-base">
                            {s.medications.map((m, mIdx) => (
                              <tr key={mIdx}>
                                <td className="py-2 px-3 font-bold text-slate-900 text-base">{m.drug_name}</td>
                                <td className="py-2 px-3 text-slate-800 text-base">{m.dosage}</td>
                                <td className="py-2 px-3 text-slate-800 text-base">{m.frequency}</td>
                                <td className="py-2 px-3 text-slate-800 text-base">{m.duration}</td>
                                <td className="py-2 px-3 text-emerald-800 font-semibold text-base">{m.purpose}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* SECTION: Allergies & Scanned Document Attachments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs print-break-inside-avoid">
          {/* Allergies Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
              Documented Drug Allergies
            </span>
            <span className="font-bold text-slate-900">
              {patientProfile?.known_allergies && patientProfile.known_allergies.length > 0
                ? patientProfile.known_allergies.join(', ')
                : 'No Known Drug Allergies (NKDA)'}
            </span>
          </div>

          {/* Attached Slips Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
              Attached Physical Slips
            </span>
            <span className="font-bold text-slate-900">
              {uploadedDocuments.length > 0
                ? `${uploadedDocuments.length} document(s) (${uploadedDocuments.map((d) => d.documentCategory).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`
                : 'None scanned (oral intake only)'}
            </span>
          </div>
        </div>

        {/* Doctor OPD Signature & Stamp Footer */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between text-xs text-slate-500 print-break-inside-avoid">
          <div>
            <div className="font-bold text-slate-900">Ayushman Bharat Digital Mission (ABDM)</div>
            <div className="text-[10px] text-slate-400">
              Generated securely at hospital intake kiosk • FHIR compliant digital summary
            </div>
          </div>

          <div className="text-center w-52">
            <div className="border-b border-slate-400 mb-1 h-10" />
            <div className="font-bold text-slate-800">Examining Physician's Signature</div>
            <div className="text-[10px] text-slate-400">OPD Room No. &amp; Reg. Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
