export type OperationalMode = 'Dialogue' | 'OCR' | 'Summary' | 'Emergency Alert';
export type DepartmentType = 'Allopathic' | 'AYUSH';
export type UrgencyLevel = 'Routine' | 'Urgent' | 'Emergency';

export interface Medication {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  purpose?: string;
  inferred_condition?: string;
}

export interface AbnormalLab {
  test: string;
  value: string;
  reference: string;
  status: 'High' | 'Low' | 'Critical' | 'Normal';
}

export interface ClinicalData {
  chief_complaint: string;
  history_of_present_illness: string;
  past_medical_surgical_history: string[];
  medications: Medication[];
  allergies: string[];
  family_lifestyle_history: string;
  review_of_systems: string[];
  diagnoses?: string[];
}

export interface AyushData {
  prakriti: string | null;
  vikriti: string | null;
  agni: string | null;
  koshtha: string | null;
  ahara_vihara: string | null;
  satmya?: string | null;
  sattva?: string | null;
  vaya?: string | null;
}

export interface ChronologicalEncounter {
  date: string;
  facility?: string;
  doctor?: string;
  summary: string;
  medications?: Medication[];
  diagnoses?: string[];
}

export interface Icd10Code {
  code: string;
  description: string;
  category?: string;
}

export interface SbarClinicalSummary {
  situation: {
    demographics: string;
    chiefComplaint: string;
    timelineOnset: string;
    urgencyLevel: UrgencyLevel;
    redFlagDetected: boolean;
    redFlagReason?: string | null;
  };
  background: {
    hpiStructured: string;
    chronologicalTimeline: ChronologicalEncounter[];
    comorbidities: string[];
    knownAllergies: string[];
    activeMedications: Medication[];
  };
  assessment: {
    clinicalImpressions: string[];
    icd10Codes: Icd10Code[];
    outOfRangeLabs: AbnormalLab[];
    severityAnalysis: string;
  };
  recommendation: {
    immediatePhysicianActions: string[];
    medicationReconciliationAlerts: string[];
    suggestedInvestigations: string[];
    fhirResources: string[];
  };
}

export interface ExtractedDocumentData {
  diagnoses: string[];
  abnormal_labs: AbnormalLab[];
  extracted_medications?: Medication[];
  audit_report?: LlamaAuditReport;
  raw_text?: string;
  document_name?: string;
  chronological_encounters?: ChronologicalEncounter[];
}

export interface MediKioskPayload {
  system_state: {
    mode: OperationalMode;
    department: DepartmentType;
    session_complete: boolean;
  };
  triage: {
    red_flag_detected: boolean;
    urgency_level: UrgencyLevel;
    alert_reason: string | null;
  };
  interaction_output: {
    spoken_prompt: string;
    touch_options: string[];
  };
  clinical_data: ClinicalData;
  ayush_data: AyushData;
  extracted_document_data: ExtractedDocumentData;
  physician_summary_markdown: string;
  sbar_summary?: SbarClinicalSummary;
}

export interface DialogueMessage {
  id: string;
  sender: 'kiosk' | 'patient' | 'system';
  text: string;
  timestamp: string;
  audioPrompt?: string;
  touchOptions?: string[];
  mode?: OperationalMode;
  redFlag?: boolean;
}

export interface LlamaAuditReport {
  timestamp: string;
  auditor_agent: string;
  verification_status: 'VERIFIED_PASSED' | 'FLAGGED_ATTENTION' | 'CRITICAL_DISCREPANCY';
  confidence_score: number;
  checks: {
    socrates_adherence: { passed: boolean; details: string };
    red_flag_sensitivity: { passed: boolean; details: string };
    anti_hallucination: { passed: boolean; details: string };
    dpdp_compliance: { passed: boolean; details: string };
    fhir_data_integrity: { passed: boolean; details: string };
  };
  discrepancies: string[];
  clinical_notes_for_doctor: string[];
}

export interface AbhaProfile {
  abha_id: string; // e.g. "14-8921-4029-1102"
  abha_address: string; // e.g. "rahul.sharma@abdm"
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  dob?: string;
  mobile?: string;
  photo?: string;
  blood_group?: string;
  is_verified: boolean;
  past_diagnoses?: string[];
  chronic_conditions?: string[];
  known_allergies?: string[];
  past_medications?: Medication[];
  last_visit_date?: string;
}

export interface LanguageOption {
  code: string; // e.g. "hi-IN"
  name: string; // "हिन्दी (Hindi)"
  nativeName: string; // "हिन्दी"
  englishName: string; // "Hindi"
  sampleGreeting: string;
  subtext: string;
  sarvamCode?: string;
}

export interface InferredCondition {
  id: string;
  condition: string;
  category: string;
  confidence: 'High' | 'Moderate' | 'Differential';
  evidence: string[];
  suggestedAction?: string;
  isRedFlag?: boolean;
}

export interface ScannedDocument {
  id: string;
  name: string;
  type: string; // e.g. "image/jpeg" | "application/pdf"
  size?: string;
  base64Data: string;
  documentCategory: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Other';
  timestamp: string;
  extractedText?: string;
  extractedMedsCount?: number;
  extractedMeds?: Medication[];
  extractedLabs?: AbnormalLab[];
  inferredPastConditions?: string[];
  clinicalFindings?: string[];
  isProcessing?: boolean;
  errorMessage?: string;
  auditReport?: LlamaAuditReport;
  enhancementApplied?: string[];
  rotation?: number;
  chronologicalEncounters?: ChronologicalEncounter[];
  structuredSummary?: StructuredPrescriptionSummary;
}

export interface PrescribedMedicationDetail {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string; // why it was prescribed
}

export interface StructuredPrescriptionSummary {
  patient_name: string; // Default "NA" if not found
  doctor_name: string; // Default "NA" if not found
  consultation_date: string; // Default "NA" if not found
  diagnosis: string; // Default "NA" if not found
  medications: PrescribedMedicationDetail[];
  raw_ocr_text?: string;
  confidence_note?: string;
}

export interface CompleteMedicalHistory {
  sessionId: string;
  generatedAt: string;
  // Spoken Symptoms from Dialogue
  reportedSymptoms: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    timelineOnset?: string;
    severity?: string;
    urgencyLevel: UrgencyLevel;
    redFlagDetected: boolean;
    redFlagReason?: string | null;
    dialogueKeyPoints: string[];
  };
  // Extracted Document Details
  extractedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    category: string;
    extractedMedications: Medication[];
    extractedLabs?: AbnormalLab[];
    inferredPastConditions: string[];
    clinicalFindings: string[];
    chronologicalEncounters?: ChronologicalEncounter[];
  }>;
  // Unified / Synthesized
  combinedMedications: Medication[];
  combinedLabs?: AbnormalLab[];
  inferredPastConditions: string[];
  inferredClinicalImpressions: InferredCondition[];
  chronologicalTimeline?: ChronologicalEncounter[];
  sbarSummary?: SbarClinicalSummary;
  knownAllergies: string[];
  chronicConditions: string[];
  synthesisNarrative: string;
  clinicalCorrelation?: {
    currentPresentation: string;
    underlyingContext: string;
    clinicalCorrelationSummary: string;
    keyActionItem: string;
  };
  simplifiedMedicalContext?: {
    primaryChiefComplaint: string;
    timeline: string;
    pastHistorySummary: string;
  };
}

export interface PrescribedRxItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string; // e.g. "OD", "BD", "TDS", "SOS", "QID"
  duration: string;  // e.g. "3 days", "5 days", "14 days", "1 month"
  instructions: string; // e.g. "After meals", "Before food", "At bedtime", "With warm water"
}

export interface DoctorPrescriptionOrder {
  doctorName: string;
  doctorRegNo: string;
  doctorSpecialty: string;
  finalDiagnosis: string;
  clinicalNotes: string;
  prescribedMeds: PrescribedRxItem[];
  orderedLabs: string[];
  dietLifestyleAdvice: string;
  disposition: 'Discharged with Rx' | 'Follow-up in 3 Days' | 'Follow-up in 1 Week' | 'Admit to Ward' | 'ER Transfer' | 'Specialist Referral';
  followUpDate?: string;
  prescribedAt: string;
}

export interface DoctorQueuePatient {
  id: string;
  tokenNumber: string; // e.g. "OPD-102"
  patientProfile: AbhaProfile;
  department: DepartmentType;
  intakeTimestamp: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Admitted' | 'Referred';
  triage: {
    urgency_level: UrgencyLevel;
    red_flag_detected: boolean;
    alert_reason: string | null;
  };
  clinical_data: ClinicalData;
  inferredConditions: InferredCondition[];
  medications: Medication[];
  uploadedDocuments: ScannedDocument[];
  conversationHistory: DialogueMessage[];
  physician_summary_markdown: string;
  completeMedicalHistory?: CompleteMedicalHistory;
  doctorNotes?: string;
  doctorPrescription?: DoctorPrescriptionOrder;
  syncedReceipt?: AbhaSyncReceipt;
}

export interface AbhaSyncReceipt {
  sync_id: string;
  timestamp: string;
  abha_id: string;
  patient_name: string;
  status: 'SYNCED_TO_ABDM_LOCKER';
  fhir_bundle_id: string;
  records_count: number;
  gateway_tx_hash: string;
}

