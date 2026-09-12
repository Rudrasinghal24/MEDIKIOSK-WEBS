import { jsPDF } from 'jspdf';
import {
  AbhaProfile,
  DepartmentType,
  MediKioskPayload,
  ScannedDocument,
  InferredCondition,
  CompleteMedicalHistory,
  DoctorPrescriptionOrder,
} from '../types';

export interface GeneratePdfOptions {
  assignedToken: string;
  department: DepartmentType;
  patientProfile?: AbhaProfile | null;
  payload: MediKioskPayload;
  inferredConditions: InferredCondition[];
  enrichedMedications: Array<{
    drugName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    purpose: string;
    inferredCondition: string;
    category?: string;
    isHighAlert?: boolean;
  }>;
  uploadedDocuments: ScannedDocument[];
  completeMedicalHistory: CompleteMedicalHistory;
  currentDate: string;
  currentTime: string;
  isEmergency: boolean;
}

export function generatePatientSummaryPdf(options: GeneratePdfOptions): jsPDF {
  const {
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
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin;
      renderHeader(true);
    }
  };

  const renderHeader = (isContinuation = false) => {
    // Top banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('NATIONAL HEALTH AUTHORITY (ABDM) • OPD CLINICAL SUMMARY', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(
      `Ayushman Bharat Digital Mission • Smart Triage & Clinical Handoff ${isContinuation ? '(Continued)' : ''}`,
      margin + 4,
      y + 13
    );

    // Token Badge
    doc.setFillColor(isEmergency ? 220 : 30, isEmergency ? 38 : 64, isEmergency ? 38 : 175); // red-600 or blue-700
    doc.roundedRect(pageWidth - margin - 36, y + 2.5, 32, 13, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('TOKEN NUMBER', pageWidth - margin - 20, y + 6.5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(assignedToken, pageWidth - margin - 20, y + 12.5, { align: 'center' });

    y += 22;
  };

  // Render initial header
  renderHeader(false);

  // Meta Info Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`Department: ${department} OPD`, margin + 3, y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${currentDate} | Time: ${currentTime}`, margin + 65, y + 5.2);
  doc.text(`Status: ${isEmergency ? 'CRITICAL / EMERGENCY' : 'Standard Queue'}`, pageWidth - margin - 3, y + 5.2, {
    align: 'right',
  });

  y += 11;

  // Patient Demographics Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PATIENT DEMOGRAPHICS & ABDM PROFILE', margin + 3, y + 5);

  const pName = patientProfile?.name || 'Walk-in Patient';
  const pAge = patientProfile?.age ? `${patientProfile.age} Yrs` : 'Not specified';
  const pGender = patientProfile?.gender || 'Unknown';
  const pAbha = patientProfile?.abha_id || 'WALKIN-OPD';
  const pPhone = patientProfile?.mobile || 'Not Registered';
  const pBlood = patientProfile?.blood_group || 'O+ (Self reported)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Name: ${pName}`, margin + 3, y + 11.5);
  doc.text(`Age / Gender: ${pAge} / ${pGender}`, margin + 3, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`ABHA ID: ${pAbha}`, margin + 70, y + 11.5);
  doc.text(`ABHA Address: ${patientProfile?.abha_address || 'walkin@abdm.local'}`, margin + 70, y + 18);

  doc.text(`Mobile: ${pPhone}`, margin + 135, y + 11.5);
  doc.text(`Blood Group: ${pBlood}`, margin + 135, y + 18);

  y += 26;

  // Emergency / Triage Banner if applicable
  if (isEmergency) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(248, 113, 113); // red-400
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('ALERT: PRIORITY TRIAGE — RED FLAG SYMPTOMS DETECTED', margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    const alertMsg = payload.triage.alert_reason || 'Requires immediate clinical examination and vital signs assessment.';
    doc.text(alertMsg, margin + 3, y + 9.5);
    y += 15;
  }

  // Chief Complaint & Clinical Overview
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CHIEF COMPLAINT & PRESENTING ILLNESS', margin, y + 4);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 18, 1, 1, 'FD');

  const cc = payload.clinical_data.chief_complaint || 'General Consultation';
  const duration = completeMedicalHistory.reportedSymptoms.timelineOnset || 'Not specified';
  const severity = completeMedicalHistory.reportedSymptoms.severity || 'Moderate';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Primary Complaint: ${cc}`, margin + 3, y + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Duration / Onset: ${duration}  |  Reported Severity: ${severity}`, margin + 3, y + 10.5);

  const pastHistory =
    completeMedicalHistory.inferredPastConditions.length > 0
      ? completeMedicalHistory.inferredPastConditions.join(' • ')
      : 'No chronic illnesses recorded.';
  doc.text(`Past History: ${pastHistory}`, margin + 3, y + 15);

  y += 22;

  // Inferred Conditions / Clinical Impressions
  if (inferredConditions.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. INFERRED CLINICAL IMPRESSIONS & DIFFERENTIAL CONSIDERATIONS', margin, y + 4);
    y += 6;

    inferredConditions.slice(0, 4).forEach((cond) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(cond.isRedFlag ? 185 : 15, cond.isRedFlag ? 28 : 23, cond.isRedFlag ? 28 : 42);
      doc.text(`${cond.condition} (${cond.confidence} likelihood)`, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const hint = cond.evidence && cond.evidence.length > 0 ? cond.evidence.join('; ').slice(0, 110) : 'Based on reported symptoms and profile.';
      doc.text(hint, margin + 3, y + 8);

      y += 12;
    });
    y += 2;
  }

  // Active Medications & Identified Therapeutic Purposes Table
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. ACTIVE MEDICATIONS & IDENTIFIED THERAPEUTIC PURPOSES', margin, y + 4);
  y += 6;

  if (enrichedMedications.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No active regular medications reported or extracted from prescription slips.', margin + 3, y + 5.5);
    y += 13;
  } else {
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('MEDICATION & STRENGTH', margin + 3, y + 4.5);
    doc.text('DOSAGE & FREQUENCY', margin + 58, y + 4.5);
    doc.text('PRIMARY PURPOSE', margin + 105, y + 4.5);
    doc.text('INFERRED CONDITION', margin + 148, y + 4.5);
    y += 6.5;

    enrichedMedications.forEach((m) => {
      checkPageBreak(8.5);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(m.drugName.slice(0, 28), margin + 3, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(m.category || 'Medication', margin + 3, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`${m.dosage} - ${m.frequency}`, margin + 58, y + 5.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(88, 28, 135); // purple-900
      doc.text(m.purpose.slice(0, 26), margin + 105, y + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(m.inferredCondition.slice(0, 22), margin + 148, y + 5.2);

      y += 8;
    });
    y += 4;
  }

  // Structured OCR Extractions (if present)
  const structuredDocs = uploadedDocuments.filter((d) => d.structuredSummary);
  if (structuredDocs.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('4. DIGITIZED PRESCRIPTION SLIPS (OCR MULTI-MODAL)', margin, y + 4);
    y += 6;

    structuredDocs.forEach((d) => {
      const s = d.structuredSummary!;
      checkPageBreak(25);
      doc.setFillColor(254, 252, 232); // amber-50
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(120, 53, 15);
      doc.text(`Slip: ${d.name} (${s.consultation_date || 'Date not specified'})`, margin + 3, y + 4.5);
      doc.text(`Doctor: ${s.doctor_name || 'Not specified'}`, margin + 95, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 45, 10);
      doc.text(`Diagnosis: ${s.diagnosis || 'General Consultation'}`, margin + 3, y + 9.5);
      doc.text(`Prescribed Drugs: ${s.medications?.length || 0} item(s)`, margin + 95, y + 9.5);

      y += 17;
    });
    y += 2;
  }

  // Allergies and Labs
  checkPageBreak(20);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DOCUMENTED DRUG ALLERGIES', margin + 3, y + 4.5);

  const allergiesText =
    patientProfile?.known_allergies && patientProfile.known_allergies.length > 0
      ? patientProfile.known_allergies.join(', ')
      : 'No Known Drug Allergies (NKDA)';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(allergiesText, margin + 3, y + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ATTACHED DOCUMENTS', margin + 110, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`${uploadedDocuments.length} Scanned Slip(s) / Records`, margin + 110, y + 9.5);

  y += 18;

  // Doctor OPD Desk Sign-off Box
  checkPageBreak(26);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 1, 1, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PHYSICIAN CONSULTATION NOTES & PRESCRIPTION STAMP', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Doctor Signature / Stamp: ___________________________', margin + 3, y + 17);
  doc.text('Consultation Outcome: [  ] Admitted   [  ] Follow-up   [  ] Discharged', margin + 95, y + 17);

  y += 24;

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ABDM Care Context Token #${assignedToken} • Generated by MediKiosk AI • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export interface GeneratePrescriptionPdfOptions {
  tokenNumber: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientAbha: string;
  department: DepartmentType;
  prescription: DoctorPrescriptionOrder;
  currentDate?: string;
  currentTime?: string;
}

export function generateDoctorPrescriptionPdf(options: GeneratePrescriptionPdfOptions): jsPDF {
  const {
    tokenNumber,
    patientName,
    patientAge,
    patientGender,
    patientAbha,
    department,
    prescription,
    currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = margin;
    }
  };

  // 1. Hospital & Department Header
  doc.setFillColor(30, 58, 138); // Deep hospital blue
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('DISTRICT GENERAL HOSPITAL & ABDM MEDICAL CENTER', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255);
  doc.text(`Department of ${department} Medicine • OPD Consultation & Prescription`, margin + 6, y + 14);
  doc.text('Ayushman Bharat Digital Mission (ABDM) • FHIR R4 Standard Care Context', margin + 6, y + 19);

  // Token Box on Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 35, y + 3, 30, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TOKEN NO', pageWidth - margin - 20, y + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text(tokenNumber, pageWidth - margin - 20, y + 16, { align: 'center' });

  y += 28;

  // 2. Patient Demographics & Doctor Info Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 1, 1, 'FD');

  // Left: Patient Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PATIENT DETAILS', margin + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(patientName, margin + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Age/Gender: ${patientAge} Yrs / ${patientGender}   •   ABHA: ${patientAbha}`, margin + 4, y + 16.5);

  // Right: Doctor Info & Timestamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CONSULTING PHYSICIAN', margin + 110, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text(prescription.doctorName, margin + 110, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${prescription.doctorSpecialty} • Reg: ${prescription.doctorRegNo}`, margin + 110, y + 14.5);
  doc.text(`Date & Time: ${currentDate}, ${currentTime}`, margin + 110, y + 18.5);

  y += 26;

  // 3. Clinical Impression & Primary Diagnosis
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, contentWidth, 18, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175);
  doc.text('PROVISIONAL / FINAL DIAGNOSIS', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.finalDiagnosis || 'Acute OPD Evaluation', margin + 4, y + 12);

  if (prescription.clinicalNotes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Clinical Findings: ${prescription.clinicalNotes.slice(0, 110)}`, margin + 4, y + 16);
  }

  y += 22;

  // 4. Rx - Prescribed Medications Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Rx', margin, y + 5);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PRESCRIBED MEDICATIONS & REGIMEN', margin + 10, y + 4.5);

  y += 8;

  // Rx Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('#', margin + 2, y + 4.5);
  doc.text('Medicine / Drug Name', margin + 8, y + 4.5);
  doc.text('Dosage', margin + 70, y + 4.5);
  doc.text('Frequency', margin + 95, y + 4.5);
  doc.text('Duration', margin + 125, y + 4.5);
  doc.text('Instructions', margin + 148, y + 4.5);

  y += 6.5;

  const meds = prescription.prescribedMeds || [];
  if (meds.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No active pharmacological therapy prescribed.', margin + 8, y + 5.5);
    y += 10;
  } else {
    meds.forEach((m, idx) => {
      checkPageBreak(8);
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 250, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7.5, margin + contentWidth, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`${idx + 1}.`, margin + 2, y + 5);
      doc.text(m.drugName, margin + 8, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(m.dosage || 'Standard', margin + 70, y + 5);
      doc.text(m.frequency || 'OD', margin + 95, y + 5);
      doc.text(m.duration || '5 days', margin + 125, y + 5);
      doc.text(m.instructions || 'After meals', margin + 148, y + 5);

      y += 7.5;
    });
  }

  y += 4;

  // 5. Investigations (Ix) Ordered
  if (prescription.orderedLabs && prescription.orderedLabs.length > 0) {
    checkPageBreak(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('Ix - INVESTIGATIONS ORDERED', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(prescription.orderedLabs.join('   •   '), margin + 4, y + 10);

    y += 18;
  }

  // 6. Advice & Lifestyle Instructions
  if (prescription.dietLifestyleAdvice) {
    checkPageBreak(18);
    doc.setFillColor(255, 251, 235); // Amber-50
    doc.setDrawColor(254, 243, 199);
    doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('SPECIAL CLINICAL ADVICE & PRECAUTIONS', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(69, 26, 3);
    doc.text(prescription.dietLifestyleAdvice, margin + 4, y + 10);

    y += 18;
  }

  // 7. Disposition & Follow-Up Bar
  checkPageBreak(14);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Consultation Disposition: ${prescription.disposition}`, margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Next Follow-Up: ${prescription.followUpDate || 'As advised / SOS in emergency'}`, margin + 4, y + 9.5);

  y += 18;

  // 8. Doctor Signature Seal Block
  checkPageBreak(25);
  const sigBoxY = Math.max(y, pageHeight - 38);
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - margin - 70, sigBoxY + 12, pageWidth - margin, sigBoxY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text(prescription.doctorName, pageWidth - margin - 35, sigBoxY + 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reg: ${prescription.doctorRegNo} • Verified Medical Practitioner`, pageWidth - margin - 35, sigBoxY + 21, { align: 'center' });

  // ABDM Official Stamp Badge on Left
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, sigBoxY + 2, 75, 20, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175);
  doc.text('NATIONAL HEALTH AUTHORITY • ABDM VERIFIED', margin + 3, sigBoxY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Digitally signed and queued for health locker synchronization.', margin + 3, sigBoxY + 12);
  doc.text(`Care Context ID: ABDM-OPD-${tokenNumber}`, margin + 3, sigBoxY + 16.5);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ABDM Hospital Outpatient Record • Token #${tokenNumber} • Patient: ${patientName} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  return doc;
}

