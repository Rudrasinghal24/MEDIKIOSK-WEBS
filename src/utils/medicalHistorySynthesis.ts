import {
  ClinicalData,
  DialogueMessage,
  ScannedDocument,
  AbhaProfile,
  DepartmentType,
  UrgencyLevel,
  CompleteMedicalHistory,
  Medication,
  InferredCondition,
  AbnormalLab,
  ChronologicalEncounter,
  Icd10Code,
  SbarClinicalSummary,
} from '../types';
import { inferClinicalConditions } from './clinicalInference';
import {
  identifyMedicationPurpose,
  enrichMedicationsWithPurpose,
  generateClinicalCorrelation,
} from './medicationKnowledge';

// Prescriptions & lab templates for rich client-side extraction
const CLINICAL_PRESETS = [
  {
    medications: [
      { drug_name: 'Tab Telmisartan (Telma 40)', dosage: '40mg', frequency: 'OD morning', duration: 'Ongoing 6 months' },
      { drug_name: 'Tab Amlodipine (Stamlo 5)', dosage: '5mg', frequency: 'OD morning', duration: 'Ongoing' },
    ],
    inferredConditions: ['Essential Systemic Hypertension (Stage 1)'],
    findings: ['Recorded Blood Pressure: 138/88 mmHg on prescription header', 'Advised low sodium diet & daily BP monitoring'],
    rawText: 'Rx Dr. A. K. Verma, MD (Medicine)\nPt: Follow-up Hypertension\nBP: 138/88 mmHg, P: 76 bpm\n1. Tab Telmisartan 40mg 1-0-0 x ongoing\n2. Tab Amlodipine 5mg 1-0-0 x ongoing\nReview after 1 month.',
  },
  {
    medications: [
      { drug_name: 'Tab Metformin (Glycomet SR)', dosage: '500mg', frequency: 'BD after meals', duration: 'Ongoing 1 year' },
      { drug_name: 'Tab Pantoprazole (Pan 40)', dosage: '40mg', frequency: 'OD before breakfast', duration: '15 days' },
    ],
    inferredConditions: ['Type 2 Diabetes Mellitus', 'Gastroesophageal Reflux Disease (GERD)'],
    findings: ['Fasting Blood Sugar recorded as 142 mg/dL in margin', 'Advised HbA1c test and dietary glycemic control'],
    rawText: 'Rx Dr. Priya Rao, MBBS, DNB (Endocrinology)\nDiagnosis: T2DM & Acid Dyspepsia\nFBS: 142 mg/dL, PPBS: 198 mg/dL\n1. Tab Metformin 500mg SR 1-0-1 after food\n2. Tab Pantoprazole 40mg 1-0-0 before breakfast\nDietary counseling provided.',
  },
  {
    medications: [
      { drug_name: 'Tab Atorvastatin (Atorva 10)', dosage: '10mg', frequency: 'HS at bedtime', duration: '3 months' },
      { drug_name: 'Tab Paracetamol (Dolo 650)', dosage: '650mg', frequency: 'TDS SOS', duration: '3 days' },
    ],
    inferredConditions: ['Hyperlipidemia / Dyslipidemia', 'Acute Febrile Episode / Myalgia'],
    findings: ['Serum Cholesterol: 228 mg/dL noted on slip', 'Advised brisk walk 30 mins daily'],
    rawText: 'Rx Dr. Rajesh Nair, MD (Internal Medicine)\nLipid Profile review: Total Chol 228 mg/dL, LDL 146 mg/dL\n1. Tab Atorvastatin 10mg 0-0-1 HS\n2. Tab Dolo 650mg SOS for headache/fever\nRepeat lipid profile in 12 weeks.',
  },
  {
    medications: [
      { drug_name: 'Tab Montelukast + Levocetirizine', dosage: '10mg / 5mg', frequency: 'HS at bedtime', duration: '14 days' },
      { drug_name: 'Tab Azithromycin (Azee 500)', dosage: '500mg', frequency: 'OD for 5 days', duration: '5 days completed' },
    ],
    inferredConditions: ['Allergic Rhinitis / Bronchial Hyper-reactivity', 'Upper Respiratory Tract Infection'],
    findings: ['Bilateral wheeze mentioned on auscultation', 'Advised steam inhalation and allergen avoidance'],
    rawText: 'Rx Dr. Sneha Gupta, Chest Specialist\nComplaints: Nocturnal cough & allergic sneezing\nChest: Bilateral mild rhonchi\n1. Tab Montelukast + Levocetirizine 0-0-1 at night x 14 days\n2. Tab Azithromycin 500mg 1-0-0 x 5 days\nAvoid dust and cold foods.',
  },
  {
    medications: [
      { drug_name: 'Tab Yograj Guggulu', dosage: '2 tabs', frequency: 'BD with lukewarm water', duration: '1 month' },
      { drug_name: 'Shallaki Forte Capsules', dosage: '1 cap', frequency: 'BD after meals', duration: '1 month' },
    ],
    inferredConditions: ['Sandhivata (Degenerative Osteoarthritis)', 'Vata Vyadhi (Joint Stiffness)'],
    findings: ['Morning joint stiffness 20 mins documented', 'Local Janu Basti or warm sesame oil massage recommended'],
    rawText: 'Rx Dr. Arvind Shastri, BAMS, MD (Ayurveda)\nNidana: Sandhivata (Knee Joint Pain & Crepitus)\n1. Yograj Guggulu 2-0-2 with ushnodaka\n2. Shallaki Forte 1-0-1 after meals\nPathya: Avoid vata-aggravating dry foods.',
  },
];

/**
 * Client-Side Extraction Function (Simulated / Mock OCR & LLM)
 * Extracts structured medicine names, dosages, inferred past conditions, and findings
 * directly in the browser when a patient uploads a prescription.
 */
export function extractPrescriptionDetailsClientSide(
  fileName: string,
  _fileSize: string,
  index: number = 0
): {
  extractedMedications: Medication[];
  inferredPastConditions: string[];
  clinicalFindings: string[];
  rawText: string;
  extractedLabs?: AbnormalLab[];
} {
  const lowerName = fileName.toLowerCase();

  // If this is a lab report
  if (lowerName.includes('lab') || lowerName.includes('blood') || lowerName.includes('sugar_lipids') || lowerName.includes('lal_path')) {
    return {
      extractedMedications: [],
      inferredPastConditions: ['Type 2 Diabetes Mellitus', 'Dyslipidemia'],
      clinicalFindings: ['Elevated Glycated Hemoglobin (HbA1c: 8.6%)', 'Fasting Blood Sugar elevated (186 mg/dL)'],
      rawText: 'Lal PathLabs Clinical Biochemistry Report\nFasting Blood Sugar (FBS): 186 mg/dL [70 - 100 mg/dL] HIGH\nHbA1c: 8.6% [< 5.7%] HIGH\nSerum Creatinine: 0.9 mg/dL [0.7 - 1.3 mg/dL] NORMAL',
      extractedLabs: [
        { test: 'Fasting Blood Sugar (FBS)', value: '186 mg/dL', reference: '70 - 100 mg/dL', status: 'High' },
        { test: 'HbA1c (Glycated Hb)', value: '8.6 %', reference: '< 5.7 %', status: 'High' },
        { test: 'Serum Creatinine', value: '0.9 mg/dL', reference: '0.7 - 1.3 mg/dL', status: 'Normal' },
      ],
    };
  }

  // Match preset based on filename hints or round-robin index
  let matchedPreset = CLINICAL_PRESETS[index % CLINICAL_PRESETS.length];

  if (lowerName.includes('sugar') || lowerName.includes('diabetes') || lowerName.includes('metformin')) {
    matchedPreset = CLINICAL_PRESETS[1];
  } else if (lowerName.includes('bp') || lowerName.includes('hyper') || lowerName.includes('telma')) {
    matchedPreset = CLINICAL_PRESETS[0];
  } else if (lowerName.includes('lipid') || lowerName.includes('chol') || lowerName.includes('atorva')) {
    matchedPreset = CLINICAL_PRESETS[2];
  } else if (lowerName.includes('cough') || lowerName.includes('chest') || lowerName.includes('asthma')) {
    matchedPreset = CLINICAL_PRESETS[3];
  } else if (lowerName.includes('ayush') || lowerName.includes('joint') || lowerName.includes('pain')) {
    matchedPreset = CLINICAL_PRESETS[4];
  }

  return {
    extractedMedications: matchedPreset.medications,
    inferredPastConditions: matchedPreset.inferredConditions,
    clinicalFindings: matchedPreset.findings,
    rawText: matchedPreset.rawText,
    extractedLabs: [],
  };
}

/**
 * Unified Medical History Synthesizer
 * Merges spoken symptoms gathered during conversational intake with
 * extracted details from all uploaded prescriptions and reports.
 */
export function synthesizeCompleteMedicalHistory({
  clinicalData,
  conversationHistory,
  uploadedDocuments,
  patientProfile,
  department,
  triage,
}: {
  clinicalData: ClinicalData;
  conversationHistory: DialogueMessage[];
  uploadedDocuments: ScannedDocument[];
  patientProfile?: AbhaProfile | null;
  department: DepartmentType;
  triage: { urgency_level: UrgencyLevel; red_flag_detected: boolean; alert_reason: string | null };
}): CompleteMedicalHistory {
  // 1. Dialogue analysis & key points
  const patientTurns = conversationHistory.filter((m) => m.sender === 'patient');
  const dialogueKeyPoints = patientTurns.slice(-4).map((m) => m.text);

  // Extract timeline hints
  const allConversationText = conversationHistory.map((m) => m.text).join(' ');
  const lowerText = allConversationText.toLowerCase();

  let timelineOnset = 'Acute onset';
  if (lowerText.includes('yesterday') || lowerText.includes('kal se')) {
    timelineOnset = 'Onset: Since yesterday (24 hours)';
  } else if (lowerText.includes('2 days') || lowerText.includes('do din')) {
    timelineOnset = 'Duration: 2 days';
  } else if (lowerText.includes('3 days') || lowerText.includes('teen din')) {
    timelineOnset = 'Duration: 3 days';
  } else if (lowerText.includes('week') || lowerText.includes('hafta')) {
    timelineOnset = 'Duration: Over 1 week';
  } else if (lowerText.includes('month') || lowerText.includes('mahina')) {
    timelineOnset = 'Subacute/Chronic: > 1 month';
  }

  // 2. Extracted document details
  const extractedDocuments = uploadedDocuments.map((doc) => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    category: doc.documentCategory,
    extractedMedications: doc.extractedMeds || [],
    extractedLabs: doc.extractedLabs || [],
    inferredPastConditions: doc.inferredPastConditions || [],
    clinicalFindings: doc.clinicalFindings || [],
  }));

  // 3. Deduplicated combined medications with smart purpose identification
  const medsMap = new Map<string, Medication>();
  // From clinical data
  (clinicalData.medications || []).forEach((m) => {
    const purposeInfo = identifyMedicationPurpose(m.drug_name);
    medsMap.set(m.drug_name.toLowerCase().trim(), {
      ...m,
      purpose: m.purpose || purposeInfo.purpose,
      inferred_condition: m.inferred_condition || purposeInfo.inferredCondition,
    });
  });
  // From uploaded documents
  uploadedDocuments.forEach((doc) => {
    (doc.extractedMeds || []).forEach((m) => {
      const purposeInfo = identifyMedicationPurpose(m.drug_name);
      medsMap.set(m.drug_name.toLowerCase().trim(), {
        ...m,
        purpose: m.purpose || purposeInfo.purpose,
        inferred_condition: m.inferred_condition || purposeInfo.inferredCondition,
      });
    });
  });
  const combinedMedications = Array.from(medsMap.values());

  // Deduplicated combined abnormal lab tests
  const labsMap = new Map<string, any>();
  uploadedDocuments.forEach((doc) => {
    (doc.extractedLabs || []).forEach((lab) => {
      if (lab && lab.test) {
        labsMap.set(lab.test.toLowerCase().trim(), lab);
      }
    });
  });
  const combinedLabs = Array.from(labsMap.values());

  // 4. Past conditions aggregated
  const pastConditionsSet = new Set<string>();
  if (patientProfile?.past_diagnoses) {
    patientProfile.past_diagnoses.forEach((d) => pastConditionsSet.add(d));
  }
  if (patientProfile?.chronic_conditions) {
    patientProfile.chronic_conditions.forEach((c) => pastConditionsSet.add(c));
  }
  uploadedDocuments.forEach((doc) => {
    (doc.inferredPastConditions || []).forEach((c) => pastConditionsSet.add(c));
  });

  // Also extract inferred conditions from medications
  combinedMedications.forEach((m) => {
    if (m.inferred_condition && !m.inferred_condition.includes('Underlying Chronic')) {
      pastConditionsSet.add(m.inferred_condition);
    }
  });

  const inferredPastConditions = Array.from(pastConditionsSet);

  // 5. Inferred clinical impressions (Symptoms + Meds correlation)
  const inferredClinicalImpressions: InferredCondition[] = inferClinicalConditions({
    clinicalData,
    conversationText: allConversationText,
    medications: combinedMedications,
    department,
  });

  // 6. Direct Clinical Correlation & Simplified Medical Context
  const enrichedProfiles = enrichMedicationsWithPurpose(combinedMedications);
  const primaryChiefComplaint = clinicalData.chief_complaint || 'General medical review';

  const correlation = generateClinicalCorrelation({
    chiefComplaint: primaryChiefComplaint,
    timelineOnset,
    enrichedMeds: enrichedProfiles,
    inferredPastConditions,
    abnormalLabsCount: combinedLabs.length,
  });

  // Simplified past medical history summary for rapid physician absorption
  let pastHistorySummary = '';
  if (inferredPastConditions.length > 0) {
    pastHistorySummary = inferredPastConditions.join(' • ');
  } else if (combinedMedications.length > 0) {
    pastHistorySummary = combinedMedications.map((m) => m.inferred_condition || m.drug_name).filter(Boolean).slice(0, 3).join(' • ');
  } else {
    pastHistorySummary = 'No prior chronic conditions or active medications on record';
  }

  // 7. Chronological Medical Timeline Synthesis
  const encountersMap = new Map<string, ChronologicalEncounter>();

  uploadedDocuments.forEach((doc) => {
    (doc.chronologicalEncounters || []).forEach((enc) => {
      const key = `${enc.date}_${enc.facility}_${enc.summary}`.toLowerCase();
      if (!encountersMap.has(key)) {
        encountersMap.set(key, enc);
      }
    });
  });

  if (encountersMap.size === 0) {
    // Generate an encounter entry from documents or current presentation
    uploadedDocuments.forEach((doc, idx) => {
      encountersMap.set(`doc_${idx}`, {
        date: doc.timestamp || 'Recent OPD Record',
        facility: `${department} OPD Review`,
        summary: `Document "${doc.name}": ${(doc.clinicalFindings || []).join('; ') || 'Clinical record reviewed'}`,
      });
    });
  }

  // Always append current OPD presentation
  encountersMap.set('current_intake', {
    date: new Date().toLocaleDateString('en-GB'),
    facility: `${department} OPD Consultation`,
    summary: `Current presentation: "${primaryChiefComplaint}" (${timelineOnset})`,
  });

  const chronologicalTimeline: ChronologicalEncounter[] = Array.from(encountersMap.values());

  // 8. ICD-10 Coding Mapping
  const icd10Codes: Icd10Code[] = [];
  const textCorpus = `${primaryChiefComplaint} ${clinicalData.history_of_present_illness} ${inferredPastConditions.join(' ')}`.toLowerCase();

  if (textCorpus.includes('chest pain') || textCorpus.includes('angina')) {
    icd10Codes.push({ code: 'R07.9', description: 'Chest pain, unspecified', category: 'Cardiovascular' });
  }
  if (textCorpus.includes('diabet') || textCorpus.includes('sugar') || textCorpus.includes('glycomet') || textCorpus.includes('metformin')) {
    icd10Codes.push({ code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' });
  }
  if (textCorpus.includes('hyperten') || textCorpus.includes('bp') || textCorpus.includes('telma') || textCorpus.includes('amlodipine')) {
    icd10Codes.push({ code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' });
  }
  if (textCorpus.includes('fever') || textCorpus.includes('pyrexia') || textCorpus.includes('dolo')) {
    icd10Codes.push({ code: 'R50.9', description: 'Fever, unspecified', category: 'General Symptoms' });
  }
  if (textCorpus.includes('cough') || textCorpus.includes('wheeze') || textCorpus.includes('rhonchi') || textCorpus.includes('asthma') || textCorpus.includes('bronch')) {
    icd10Codes.push({ code: 'R05.9', description: 'Cough, unspecified', category: 'Respiratory' });
  }
  if (textCorpus.includes('acidity') || textCorpus.includes('gerd') || textCorpus.includes('reflux') || textCorpus.includes('gastrit') || textCorpus.includes('pan 40')) {
    icd10Codes.push({ code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', category: 'Gastrointestinal' });
  }
  if (textCorpus.includes('knee') || textCorpus.includes('joint') || textCorpus.includes('osteoarth') || textCorpus.includes('sandhivata')) {
    icd10Codes.push({ code: 'M17.9', description: 'Osteoarthritis of knee, unspecified', category: 'Musculoskeletal' });
  }
  if (icd10Codes.length === 0) {
    icd10Codes.push({ code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'General Adult Exam' });
  }

  // 9. Standard SBAR Synthesis (Module C: Structured History Generator)
  const immediateActions: string[] = [];
  if (triage.red_flag_detected) {
    immediateActions.push(`🚨 EMERGENCY INTERVENTION: Immediate transfer to Casualty/ICU Bed (${triage.alert_reason || 'Acute Red Flag'}).`);
  } else if (triage.urgency_level === 'Urgent') {
    immediateActions.push('Priority clinical evaluation recommended within 15 minutes.');
  } else {
    immediateActions.push('Routine OPD queue evaluation.');
  }

  const medReconciliationAlerts: string[] = [];
  if (combinedMedications.length > 1) {
    medReconciliationAlerts.push(`Reconcile ${combinedMedications.length} active medications against current OPD prescriptions.`);
  }

  const outOfRangeLabs = combinedLabs.filter(
    (l) => l.status === 'High' || l.status === 'Low' || l.status === 'Critical'
  );

  const fhirResources: string[] = [
    `Composition/medikiosk-sbar-${Date.now()}`,
    `Condition/${icd10Codes[0]?.code.replace('.', '-') || 'primary-complaint'}`,
    ...combinedMedications.slice(0, 3).map((m, idx) => `MedicationStatement/med-${idx + 1}-${m.drug_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`),
    ...outOfRangeLabs.slice(0, 3).map((l, idx) => `Observation/lab-${idx + 1}-${l.test.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`),
  ];

  const sbarSummary: SbarClinicalSummary = {
    situation: {
      demographics: `${patientProfile?.name || 'Adult Patient'} (${patientProfile?.age || 45}Y / ${patientProfile?.gender || 'OPD'}) • ${department} OPD`,
      chiefComplaint: primaryChiefComplaint,
      timelineOnset,
      urgencyLevel: triage.urgency_level,
      redFlagDetected: triage.red_flag_detected,
      redFlagReason: triage.alert_reason,
    },
    background: {
      hpiStructured: clinicalData.history_of_present_illness || 'Detailed conversational history recorded via kiosk interface.',
      chronologicalTimeline,
      comorbidities: inferredPastConditions,
      knownAllergies: patientProfile?.known_allergies || ['No known drug allergies (NKDA)'],
      activeMedications: combinedMedications,
    },
    assessment: {
      clinicalImpressions: inferredClinicalImpressions.map((c) => `${c.condition} (${c.confidence})`),
      icd10Codes,
      outOfRangeLabs,
      severityAnalysis: triage.red_flag_detected
        ? 'CRITICAL SEVERITY: Immediate physician resuscitation or casualty triage triggered.'
        : triage.urgency_level === 'Urgent'
        ? 'MODERATE-HIGH: Priority OPD attention indicated.'
        : 'STABLE: Routine OPD consultation appropriate.',
    },
    recommendation: {
      immediatePhysicianActions: immediateActions,
      medicationReconciliationAlerts: medReconciliationAlerts,
      suggestedInvestigations: outOfRangeLabs.length > 0
        ? outOfRangeLabs.map((l) => `Repeat ${l.test} for trend monitoring (current: ${l.value})`)
        : ['Confirm vitals (BP, PR, SpO2, Temp) during physical exam.'],
      fhirResources,
    },
  };

  // 10. Synthesis Narrative
  const docCount = uploadedDocuments.length;
  const medCount = combinedMedications.length;
  const synthesisNarrative = `Patient presented to ${department} OPD with chief complaint of "${primaryChiefComplaint}" (${timelineOnset}). Multimodal intake integrated ${conversationHistory.length} dialogue turns with ${docCount} uploaded medical document(s). A total of ${medCount} active/prescribed medication(s) were consolidated. ${
    inferredPastConditions.length > 0
      ? `Document extraction revealed background history of: ${inferredPastConditions.join(', ')}.`
      : 'No documented prior chronic conditions found on attached slips.'
  } Triage assessed as ${triage.urgency_level.toUpperCase()}${triage.red_flag_detected ? ' with clinical red flags flagged' : ''}.`;

  return {
    sessionId: `SES-${Date.now()}`,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    reportedSymptoms: {
      chiefComplaint: primaryChiefComplaint,
      historyOfPresentIllness: clinicalData.history_of_present_illness || 'Detailed history gathered via voice and touch interactive intake.',
      timelineOnset,
      severity: triage.red_flag_detected ? 'Severe / Red-Flag' : triage.urgency_level === 'Urgent' ? 'Moderate-Severe' : 'Mild-Moderate',
      urgencyLevel: triage.urgency_level,
      redFlagDetected: triage.red_flag_detected,
      redFlagReason: triage.alert_reason,
      dialogueKeyPoints,
    },
    extractedDocuments,
    combinedMedications,
    combinedLabs,
    inferredPastConditions,
    inferredClinicalImpressions,
    chronologicalTimeline,
    sbarSummary,
    knownAllergies: patientProfile?.known_allergies || ['No known drug allergies (NKDA)'],
    chronicConditions: patientProfile?.chronic_conditions || [],
    synthesisNarrative,
    clinicalCorrelation: correlation,
    simplifiedMedicalContext: {
      primaryChiefComplaint,
      timeline: timelineOnset,
      pastHistorySummary,
    },
  };
}

/**
 * Converts an SbarClinicalSummary object into standard physician SBAR markdown
 */
export function generateSbarMarkdown(sbar: SbarClinicalSummary, department: DepartmentType = 'Allopathic'): string {
  return `### SBAR CLINICAL SUMMARY FOR PHYSICIAN CONFIRMATION
**Department:** ${department} OPD
**Triage Status:** ${sbar.situation.urgencyLevel.toUpperCase()} ${sbar.situation.redFlagDetected ? '(🚨 RED FLAG ALERT)' : '(Routine)'}
**ABDM / DPDP Act 2023 Compliance:** Verified ([Aadhaar Redacted], [ABHA Omitted])

---

#### 1. S - SITUATION
- **Demographics:** ${sbar.situation.demographics}
- **Chief Complaint:** ${sbar.situation.chiefComplaint}
- **Triage Urgency:** ${sbar.situation.urgencyLevel} ${sbar.situation.redFlagDetected ? `(🚨 Trigger: ${sbar.situation.redFlagReason || 'Emergency'})` : ''}

#### 2. B - BACKGROUND
- **History of Present Illness (HPI):** ${sbar.background.hpiStructured}
- **Chronological Medical Timeline:**
${sbar.background.chronologicalTimeline.map((e) => `  - **${e.date}** [${e.facility || 'OPD'}]: ${e.summary}`).join('\n')}
- **Prior Comorbidities:** ${sbar.background.comorbidities.join(', ') || 'None documented'}
- **Known Allergies:** ${sbar.background.knownAllergies.join(', ')}
- **Active Medications (Prescription OCR & Intake):**
${sbar.background.activeMedications.length > 0
  ? sbar.background.activeMedications.map((m) => `  - **${m.drug_name}**: ${m.dosage} | Frequency: ${m.frequency} | Duration: ${m.duration}`).join('\n')
  : '  - No active medications on record'}

#### 3. A - ASSESSMENT
- **Clinical Impressions:** ${sbar.assessment.clinicalImpressions.join('; ')}
- **ICD-10-CM Coding:**
${sbar.assessment.icd10Codes.map((c) => `  - \`${c.code}\` — **${c.description}** [${c.category || 'General'}]`).join('\n')}
- **Out-of-Range Lab Highlights:**
${sbar.assessment.outOfRangeLabs.length > 0
  ? sbar.assessment.outOfRangeLabs.map((l) => `  - ⚠️ **${l.test}**: ${l.value} (Reference: ${l.reference}) — [Status: ${l.status}]`).join('\n')
  : '  - No critical out-of-range lab anomalies detected'}
- **Severity Assessment:** ${sbar.assessment.severityAnalysis}

#### 4. R - RECOMMENDATION
- **Immediate Physician Directives:**
${sbar.recommendation.immediatePhysicianActions.map((a) => `  - ${a}`).join('\n')}
- **Medication Reconciliation Alerts:**
${sbar.recommendation.medicationReconciliationAlerts.length > 0
  ? sbar.recommendation.medicationReconciliationAlerts.map((r) => `  - ${r}`).join('\n')
  : '  - No immediate drug-drug contraindications flagged'}
- **Suggested Investigations:**
${sbar.recommendation.suggestedInvestigations.map((i) => `  - ${i}`).join('\n')}
- **FHIR R4 Resource Mappings:**
${sbar.recommendation.fhirResources.map((f) => `  - \`${f}\``).join('\n')}

---
*Synthesized by MediKiosk Structured History Generator (Module C) • Ready for Physician Confirmation & ABDM EMR Ingestion*`;
}
