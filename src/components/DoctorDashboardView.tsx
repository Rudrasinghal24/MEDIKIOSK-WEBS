import { useState, useEffect } from 'react';
import {
  DoctorQueuePatient,
  DepartmentType,
  AbhaSyncReceipt,
  Medication,
  ScannedDocument,
  PrescribedRxItem,
  DoctorPrescriptionOrder,
} from '../types';
import { identifyMedicationPurpose } from '../utils/medicationKnowledge';
import { generateDoctorPrescriptionPdf } from '../utils/pdfGenerator';
import {
  Stethoscope,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Pill,
  Search,
  Eye,
  Printer,
  ShieldCheck,
  Activity,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  FileType,
  RefreshCw,
  Trash2,
  X,
  Phone,
  Hospital,
  Layers,
  Microscope,
  Plus,
  Volume2,
  UserPlus,
  Download,
  Calendar,
  ClipboardList,
  Save,
  Share2,
} from 'lucide-react';

interface DoctorDashboardViewProps {
  onBackToKiosk: () => void;
  activeDepartment: DepartmentType;
  onDepartmentChange: (dept: DepartmentType) => void;
}

const COMMON_DRUGS = [
  { name: 'Paracetamol 650mg', dose: '650mg', freq: 'TDS (3 times/day)', dur: '3 days', inst: 'After food' },
  { name: 'Amoxicillin-Clav 625mg', dose: '625mg', freq: 'BD (Twice daily)', dur: '5 days', inst: 'After meals' },
  { name: 'Pantoprazole 40mg', dose: '40mg', freq: 'OD (Once daily)', dur: '7 days', inst: 'Before breakfast' },
  { name: 'Cetirizine 10mg', dose: '10mg', freq: 'OD (Night)', dur: '5 days', inst: 'At bedtime' },
  { name: 'Azithromycin 500mg', dose: '500mg', freq: 'OD (Once daily)', dur: '3 days', inst: '1 hour before food' },
  { name: 'Metformin 500mg', dose: '500mg', freq: 'BD (Twice daily)', dur: '1 month', inst: 'With food' },
  { name: 'ORS Sachet', dose: '1 Sachet in 1L water', freq: 'SOS', dur: '2 days', inst: 'Drink throughout day' },
  { name: 'Budesonide Inhaler 200mcg', dose: '2 puffs', freq: 'BD (Twice daily)', dur: '1 month', inst: 'Rinse mouth after inhalation' },
];

const COMMON_LABS = [
  'Complete Blood Count (CBC)',
  'Serum Creatinine & Urea',
  'Liver Function Tests (LFT)',
  'Fasting Blood Glucose',
  'HbA1c Glycated Hemoglobin',
  '12-Lead ECG',
  'Chest X-Ray (PA View)',
  'Urine Routine & Micro',
  'Serum Electrolytes (Na+, K+)',
  'Ultrasound Abdomen',
];

export default function DoctorDashboardView({
  onBackToKiosk,
  activeDepartment,
  onDepartmentChange,
}: DoctorDashboardViewProps) {
  const [queue, setQueue] = useState<DoctorQueuePatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Doctor Profile Information
  const [doctorName, setDoctorName] = useState('Dr. Sameer Verma, MD');
  const [doctorRegNo, setDoctorRegNo] = useState('MCI-58291');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General & Internal Medicine');

  // Consultation Form State for Selected Patient
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescribedMeds, setPrescribedMeds] = useState<PrescribedRxItem[]>([]);
  const [orderedLabs, setOrderedLabs] = useState<string[]>([]);
  const [dietLifestyleAdvice, setDietLifestyleAdvice] = useState('Adequate oral hydration, rest, avoid oily/spicy foods.');
  const [disposition, setDisposition] = useState<DoctorPrescriptionOrder['disposition']>('Discharged with Rx');
  const [followUpDays, setFollowUpDays] = useState('5 days');

  // Quick Drug Add Form State
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugDose, setNewDrugDose] = useState('500mg');
  const [newDrugFreq, setNewDrugFreq] = useState('BD (Twice daily)');
  const [newDrugDur, setNewDrugDur] = useState('5 days');
  const [newDrugInst, setNewDrugInst] = useState('After meals');
  const [customLabInput, setCustomLabInput] = useState('');

  // UI state
  const [isSyncingAbdm, setIsSyncingAbdm] = useState(false);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ScannedDocument | null>(null);
  const [lastSyncReceipt, setLastSyncReceipt] = useState<AbhaSyncReceipt | null>(null);
  const [showAddWalkinModal, setShowAddWalkinModal] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Walk-in modal fields
  const [walkinName, setWalkinName] = useState('');
  const [walkinAge, setWalkinAge] = useState('35');
  const [walkinGender, setWalkinGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [walkinComplaint, setWalkinComplaint] = useState('');
  const [walkinIsRedFlag, setWalkinIsRedFlag] = useState(false);

  // Load queue from localStorage
  const loadQueue = () => {
    try {
      const data = localStorage.getItem('medikiosk_doctor_queue');
      if (data) {
        const parsed: DoctorQueuePatient[] = JSON.parse(data);
        setQueue(parsed);
        if (parsed.length > 0) {
          const current = parsed.find((p) => p.id === selectedPatientId) || parsed[0];
          setSelectedPatientId(current.id);
          populatePrescriptionForm(current);
        }
      }
    } catch (e) {
      console.warn('Error reading doctor queue:', e);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  // Sync back to localStorage whenever queue updates
  const updateQueueState = (newQueue: DoctorQueuePatient[]) => {
    setQueue(newQueue);
    try {
      localStorage.setItem('medikiosk_doctor_queue', JSON.stringify(newQueue));
    } catch (e) {
      console.warn('Error saving doctor queue:', e);
    }
  };

  const selectedPatient = queue.find((p) => p.id === selectedPatientId) || queue[0] || null;

  // Populate doctor consultation state from patient record
  const populatePrescriptionForm = (patient: DoctorQueuePatient) => {
    if (patient.doctorPrescription) {
      setFinalDiagnosis(patient.doctorPrescription.finalDiagnosis || '');
      setClinicalNotes(patient.doctorPrescription.clinicalNotes || patient.doctorNotes || '');
      setPrescribedMeds(patient.doctorPrescription.prescribedMeds || []);
      setOrderedLabs(patient.doctorPrescription.orderedLabs || []);
      setDietLifestyleAdvice(patient.doctorPrescription.dietLifestyleAdvice || '');
      setDisposition(patient.doctorPrescription.disposition || 'Discharged with Rx');
    } else {
      // Auto-suggest diagnosis from highest confidence inferred condition
      const topCondition = patient.inferredConditions?.[0]?.condition || '';
      setFinalDiagnosis(topCondition);
      setClinicalNotes(patient.doctorNotes || '');
      setPrescribedMeds([]);
      setOrderedLabs([]);
      setDietLifestyleAdvice('Adequate oral hydration, rest, avoid oily/spicy foods.');
      setDisposition('Discharged with Rx');
    }
    setLastSyncReceipt(patient.syncedReceipt || null);
  };

  const handleSelectPatient = (patient: DoctorQueuePatient) => {
    setSelectedPatientId(patient.id);
    populatePrescriptionForm(patient);
    setSaveSuccessNotice(null);
  };

  // Filtered Queue
  const filteredQueue = queue.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.patientProfile.name.toLowerCase().includes(q) ||
      item.tokenNumber.toLowerCase().includes(q) ||
      item.patientProfile.abha_id.toLowerCase().includes(q) ||
      item.clinical_data.chief_complaint.toLowerCase().includes(q);

    const matchesDepartment = item.department === activeDepartment;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'emergency' && item.triage.red_flag_detected) ||
      (filterStatus === 'waiting' && item.status === 'Waiting') ||
      (filterStatus === 'consultation' && item.status === 'In Consultation') ||
      (filterStatus === 'completed' && item.status === 'Completed') ||
      (filterStatus === 'admitted' && (item.status === 'Admitted' || item.status === 'Referred'));

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Call Patient In
  const handleCallPatientIn = () => {
    if (!selectedPatient) return;
    const updated = queue.map((p) =>
      p.id === selectedPatient.id ? { ...p, status: 'In Consultation' as const } : p
    );
    updateQueueState(updated);
    
    // Play announcement chime if supported
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Token number ${selectedPatient.tokenNumber}, ${selectedPatient.patientProfile.name}, please proceed to OPD room.`
        );
        utterance.lang = 'en-IN';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // ignore
    }
  };

  // Add Medication to Rx Table
  const handleAddMedication = () => {
    if (!newDrugName.trim()) return;
    const newRx: PrescribedRxItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: newDrugName.trim(),
      dosage: newDrugDose.trim(),
      frequency: newDrugFreq.trim(),
      duration: newDrugDur.trim(),
      instructions: newDrugInst.trim(),
    };
    setPrescribedMeds([...prescribedMeds, newRx]);
    setNewDrugName('');
  };

  const handleSelectCommonDrug = (d: typeof COMMON_DRUGS[0]) => {
    const newRx: PrescribedRxItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: d.name,
      dosage: d.dose,
      frequency: d.freq,
      duration: d.dur,
      instructions: d.inst,
    };
    setPrescribedMeds([...prescribedMeds, newRx]);
  };

  // Copy past meds from patient's uploaded slips
  const handleCopyPastMeds = () => {
    if (!selectedPatient || !selectedPatient.medications) return;
    const copied: PrescribedRxItem[] = selectedPatient.medications.map((m) => ({
      id: `rx-past-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      drugName: m.drug_name,
      dosage: m.dosage || 'Standard',
      frequency: m.frequency || 'OD',
      duration: 'Ongoing',
      instructions: 'Continue past regimen',
    }));
    setPrescribedMeds([...prescribedMeds, ...copied]);
  };

  const handleRemoveMed = (id: string) => {
    setPrescribedMeds(prescribedMeds.filter((m) => m.id !== id));
  };

  // Lab Order Toggles
  const handleToggleLab = (lab: string) => {
    if (orderedLabs.includes(lab)) {
      setOrderedLabs(orderedLabs.filter((l) => l !== lab));
    } else {
      setOrderedLabs([...orderedLabs, lab]);
    }
  };

  const handleAddCustomLab = () => {
    if (!customLabInput.trim()) return;
    if (!orderedLabs.includes(customLabInput.trim())) {
      setOrderedLabs([...orderedLabs, customLabInput.trim()]);
    }
    setCustomLabInput('');
  };

  // Save Complete Consultation & Prescription
  const handleSaveConsultation = (newStatus?: DoctorQueuePatient['status']) => {
    if (!selectedPatient) return;
    setIsSavingPrescription(true);

    const prescriptionOrder: DoctorPrescriptionOrder = {
      doctorName,
      doctorRegNo,
      doctorSpecialty,
      finalDiagnosis: finalDiagnosis.trim() || 'General OPD Evaluation',
      clinicalNotes: clinicalNotes.trim(),
      prescribedMeds,
      orderedLabs,
      dietLifestyleAdvice: dietLifestyleAdvice.trim(),
      disposition,
      followUpDate: `${followUpDays} (from today)`,
      prescribedAt: new Date().toISOString(),
    };

    let resolvedStatus: DoctorQueuePatient['status'] = newStatus || selectedPatient.status;
    if (disposition === 'Admit to Ward') resolvedStatus = 'Admitted';
    if (disposition === 'Specialist Referral' || disposition === 'ER Transfer') resolvedStatus = 'Referred';
    if (newStatus === 'Completed' || disposition === 'Discharged with Rx') resolvedStatus = 'Completed';

    const updated = queue.map((p) =>
      p.id === selectedPatient.id
        ? {
            ...p,
            status: resolvedStatus,
            doctorNotes: clinicalNotes,
            doctorPrescription: prescriptionOrder,
          }
        : p
    );

    updateQueueState(updated);
    setIsSavingPrescription(false);
    setSaveSuccessNotice('Consultation & Prescription saved to hospital record.');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Print Official Prescription PDF
  const handlePrintPrescriptionSlip = () => {
    if (!selectedPatient) return;

    const prescriptionOrder: DoctorPrescriptionOrder = {
      doctorName,
      doctorRegNo,
      doctorSpecialty,
      finalDiagnosis: finalDiagnosis.trim() || 'General OPD Evaluation',
      clinicalNotes: clinicalNotes.trim(),
      prescribedMeds,
      orderedLabs,
      dietLifestyleAdvice: dietLifestyleAdvice.trim(),
      disposition,
      followUpDate: `${followUpDays} (from today)`,
      prescribedAt: new Date().toISOString(),
    };

    const pdf = generateDoctorPrescriptionPdf({
      tokenNumber: selectedPatient.tokenNumber,
      patientName: selectedPatient.patientProfile.name,
      patientAge: selectedPatient.patientProfile.age,
      patientGender: selectedPatient.patientProfile.gender,
      patientAbha: selectedPatient.patientProfile.abha_id,
      department: selectedPatient.department,
      prescription: prescriptionOrder,
    });

    pdf.save(`Prescription_${selectedPatient.patientProfile.name.replace(/\s+/g, '_')}_${selectedPatient.tokenNumber}.pdf`);
  };

  // Sync to ABDM Health Locker
  const handleSyncAbdm = () => {
    if (!selectedPatient || isSyncingAbdm) return;
    setIsSyncingAbdm(true);

    setTimeout(() => {
      const receipt: AbhaSyncReceipt = {
        sync_id: `SYNC-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        abha_id: selectedPatient.patientProfile.abha_id,
        patient_name: selectedPatient.patientProfile.name,
        status: 'SYNCED_TO_ABDM_LOCKER',
        fhir_bundle_id: `FHIR-ENC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        records_count: (prescribedMeds.length || 1) + (orderedLabs.length || 1),
        gateway_tx_hash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      };

      setLastSyncReceipt(receipt);
      setIsSyncingAbdm(false);

      const updated = queue.map((p) =>
        p.id === selectedPatient.id ? { ...p, syncedReceipt: receipt, status: 'Completed' as const } : p
      );
      updateQueueState(updated);
      setSaveSuccessNotice('FHIR Clinical Bundle synchronized with ABDM Gateway.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }, 800);
  };

  // Seed Demo OPD Patients for instantaneous testing
  const handleSeedDemoPatients = () => {
    const demo1: DoctorQueuePatient = {
      id: `pat-demo-101`,
      tokenNumber: 'OPD-101',
      patientProfile: {
        abha_id: '14-8921-4029-1102',
        abha_address: 'ramesh.kumar@abdm',
        name: 'Ramesh Kumar',
        gender: 'Male',
        age: 48,
        mobile: '+91 98765 43210',
        is_verified: true,
        chronic_conditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
        past_diagnoses: [],
        known_allergies: ['Penicillin'],
        past_medications: [],
      },
      department: 'Allopathic',
      intakeTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Waiting',
      triage: {
        urgency_level: 'Urgent',
        red_flag_detected: false,
        alert_reason: null,
      },
      clinical_data: {
        chief_complaint: 'Severe productive cough, shortness of breath on exertion for 4 days, low grade fever.',
        duration: '4 days',
        associated_symptoms: ['Wheezing', 'Chest tightness', 'Nocturnal cough'],
        reported_medications: ['Metformin 500mg BD', 'Telmisartan 40mg OD'],
        allergies: ['Penicillin'],
      },
      inferredConditions: [
        {
          id: 'inf-1',
          condition: 'Acute Exacerbation of Bronchial Asthma',
          category: 'Respiratory',
          confidence: 'High',
          evidence: ['Bilateral wheeze', 'Productive cough', 'Exertional dyspnea'],
          suggestedAction: 'Nebulization with Salbutamol + Ipratropium, Chest X-Ray',
        },
        {
          id: 'inf-2',
          condition: 'Community-Acquired Lower Respiratory Tract Infection',
          category: 'Infectious',
          confidence: 'Moderate',
          evidence: ['Low grade pyrexia', 'Discolored sputum'],
          suggestedAction: 'CBC, Sputum culture, Oral macrolide/cephalosporin',
        },
      ],
      medications: [
        { drug_name: 'Metformin', dosage: '500mg', frequency: 'BD', purpose: 'Type 2 Diabetes Glycemic Control' },
        { drug_name: 'Telmisartan', dosage: '40mg', frequency: 'OD', purpose: 'Hypertension Blood Pressure Regulation' },
      ],
      uploadedDocuments: [],
      conversationHistory: [
        { sender: 'assistant', text: 'Namaste Ramesh ji. Please tell me what health issues bring you to the hospital today.', timestamp: '10:02 AM' },
        { sender: 'patient', text: 'Doctor, I have severe cough with yellowish phlegm and breathlessness since 4 days.', timestamp: '10:03 AM' },
        { sender: 'assistant', text: 'Do you have any fever or chest pain when coughing?', timestamp: '10:03 AM' },
        { sender: 'patient', text: 'Yes, mild fever especially in evening and tight chest.', timestamp: '10:04 AM' },
      ],
      physician_summary_markdown: 'Patient presents with 4-day history of productive cough, wheezing and dyspnea. Known diabetic and hypertensive.',
    };

    const demo2: DoctorQueuePatient = {
      id: `pat-demo-102`,
      tokenNumber: 'OPD-102',
      patientProfile: {
        abha_id: '14-7291-8392-1092',
        abha_address: 'sunita.devi@abdm',
        name: 'Sunita Devi',
        gender: 'Female',
        age: 62,
        mobile: '+91 97234 56789',
        is_verified: true,
        chronic_conditions: ['Osteoarthritis'],
        past_diagnoses: [],
        known_allergies: [],
        past_medications: [],
      },
      department: 'Allopathic',
      intakeTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'In Consultation',
      triage: {
        urgency_level: 'Immediate',
        red_flag_detected: true,
        alert_reason: 'Acute retrosternal chest discomfort radiating to left arm with diaphoresis.',
      },
      clinical_data: {
        chief_complaint: 'Substernal pressure and heavy squeezing chest pain radiating to left shoulder and neck for 1 hour.',
        duration: '1 hour',
        associated_symptoms: ['Diaphoresis (Profuse sweating)', 'Nausea', 'Lightheadedness'],
        reported_medications: [],
        allergies: [],
      },
      inferredConditions: [
        {
          id: 'inf-red-1',
          condition: 'Acute Coronary Syndrome / Myocardial Infarction',
          category: 'Cardiovascular',
          confidence: 'High',
          isRedFlag: true,
          evidence: ['Radiating substernal pressure', 'Diaphoresis', 'Elderly presentation'],
          suggestedAction: 'STAT 12-Lead ECG, Troponin-I, Aspirin 300mg + Clopidogrel 300mg loading dose',
        },
      ],
      medications: [],
      uploadedDocuments: [],
      conversationHistory: [
        { sender: 'assistant', text: 'Welcome. What acute symptoms are you experiencing right now?', timestamp: '10:15 AM' },
        { sender: 'patient', text: 'My chest feels heavy like someone is sitting on it, and left arm is aching with cold sweats.', timestamp: '10:16 AM' },
      ],
      physician_summary_markdown: 'CRITICAL ALERT: Suspected Acute Coronary Syndrome. Immediate ECG and cardiac triage required.',
    };

    const demo3: DoctorQueuePatient = {
      id: `pat-demo-103`,
      tokenNumber: 'OPD-103',
      patientProfile: {
        abha_id: '14-3829-1920-4820',
        abha_address: 'priya.sharma@abdm',
        name: 'Priya Sharma',
        gender: 'Female',
        age: 34,
        mobile: '+91 98112 34567',
        is_verified: true,
        chronic_conditions: ['Allergic Rhinitis'],
        past_diagnoses: [],
        known_allergies: ['Sulfa drugs'],
        past_medications: [],
      },
      department: 'AYUSH',
      intakeTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Waiting',
      triage: {
        urgency_level: 'Routine',
        red_flag_detected: false,
        alert_reason: null,
      },
      clinical_data: {
        chief_complaint: 'Chronic hyperacidity, epigastric burning after spicy food, occasional nausea.',
        duration: '3 weeks',
        associated_symptoms: ['Heartburn', 'Sour burps', 'Bloating'],
        reported_medications: ['Antacid gel'],
        allergies: ['Sulfa drugs'],
      },
      inferredConditions: [
        {
          id: 'inf-ayush-1',
          condition: 'Amlapitta (Hyperacidity / Acid Peptic Disorder)',
          category: 'Gastrointestinal',
          confidence: 'High',
          evidence: ['Retrosternal burning', 'Sour eructations', 'Aggravated by pungent diet'],
          suggestedAction: 'Suta Shekhar Rasa, Avipattikar Churna, Kamadudha Rasa',
        },
      ],
      medications: [],
      uploadedDocuments: [],
      conversationHistory: [],
      physician_summary_markdown: 'AYUSH OPD consultation for persistent Amlapitta with dietary aggravation.',
    };

    const merged = [demo1, demo2, demo3, ...queue];
    updateQueueState(merged);
    setSelectedPatientId(demo1.id);
    populatePrescriptionForm(demo1);
  };

  // Add Direct Walk-in Patient to Queue
  const handleAddWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim()) return;

    const tokenNum = `OPD-${Math.floor(104 + queue.length)}`;
    const newPatient: DoctorQueuePatient = {
      id: `pat-${Date.now()}`,
      tokenNumber: tokenNum,
      patientProfile: {
        abha_id: `WALKIN-${Math.floor(100000 + Math.random() * 900000)}`,
        abha_address: `${walkinName.toLowerCase().replace(/\s+/g, '.')}@abdm.local`,
        name: walkinName.trim(),
        gender: walkinGender,
        age: parseInt(walkinAge, 10) || 35,
        is_verified: false,
        chronic_conditions: [],
        past_diagnoses: [],
        known_allergies: [],
        past_medications: [],
      },
      department: activeDepartment,
      intakeTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'In Consultation',
      triage: {
        urgency_level: walkinIsRedFlag ? 'Immediate' : 'Routine',
        red_flag_detected: walkinIsRedFlag,
        alert_reason: walkinIsRedFlag ? 'Emergency walk-in triaged directly by physician.' : null,
      },
      clinical_data: {
        chief_complaint: walkinComplaint.trim() || 'Direct OPD Doctor Evaluation',
        duration: 'Acute',
        associated_symptoms: [],
        reported_medications: [],
        allergies: [],
      },
      inferredConditions: [
        {
          id: `inf-${Date.now()}`,
          condition: walkinComplaint.trim() || 'Acute Consultation',
          category: 'Clinical',
          confidence: 'High',
          evidence: ['Physician bedside intake'],
        },
      ],
      medications: [],
      uploadedDocuments: [],
      conversationHistory: [],
      physician_summary_markdown: `Direct walk-in consultation: ${walkinComplaint}`,
    };

    const updated = [newPatient, ...queue];
    updateQueueState(updated);
    setSelectedPatientId(newPatient.id);
    populatePrescriptionForm(newPatient);
    setShowAddWalkinModal(false);
    setWalkinName('');
    setWalkinComplaint('');
  };

  const handleClearQueue = () => {
    if (confirm('Clear all processed patients from the OPD queue?')) {
      updateQueueState([]);
      setSelectedPatientId(null);
    }
  };

  const handleDeletePatient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = queue.filter((p) => p.id !== id);
    updateQueueState(updated);
    if (selectedPatientId === id) {
      setSelectedPatientId(updated[0]?.id || null);
      if (updated[0]) populatePrescriptionForm(updated[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToKiosk}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 mb-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Kiosk Intake
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                Physician OPD Consultation Desk
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-slate-700">{doctorName}</span>
                <span>•</span>
                <span>Reg: {doctorRegNo}</span>
                <span>•</span>
                <span className="text-blue-600 font-medium">{doctorSpecialty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onDepartmentChange('Allopathic')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDepartment === 'Allopathic'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Allopathic OPD
            </button>
            <button
              type="button"
              onClick={() => onDepartmentChange('AYUSH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeDepartment === 'AYUSH'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AYUSH OPD
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddWalkinModal(true)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Register Emergency Walk-in"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Walk-In</span>
          </button>

          {queue.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDemoPatients}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Load Demo Queue"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Demo Patients</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadQueue}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClearQueue}
            className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Clear Queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save / Sync Notification Banner */}
      {saveSuccessNotice && (
        <div className="bg-emerald-600 text-white p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessNotice(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Queue List (4 cols) + Selected Patient Consultation Suite (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: OPD Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {activeDepartment} OPD Queue ({filteredQueue.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                Live Feed
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, token, ABHA..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'emergency', label: '🚨 Emergency' },
                { id: 'waiting', label: 'Waiting' },
                { id: 'consultation', label: 'In Room' },
                { id: 'completed', label: 'Done' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    filterStatus === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Cards List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">No patients currently in this view.</p>
                <p className="text-[11px] text-slate-400">
                  Click "Load Demo Patients" above or register a walk-in to test all doctor consultation features.
                </p>
                <button
                  type="button"
                  onClick={handleSeedDemoPatients}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Demo Patients
                </button>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = selectedPatient?.id === item.id;
                const isEmergency = item.triage.red_flag_detected;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPatient(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-400/20'
                        : isEmergency
                          ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-50'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          {item.tokenNumber}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 truncate max-w-[160px]">
                          {item.patientProfile.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        {isEmergency && (
                          <span className="text-[9px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                            🚨 Red Flag
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeletePatient(item.id, e)}
                          className="text-slate-300 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 line-clamp-2">
                      <strong>Complaint:</strong> {item.clinical_data.chief_complaint || 'General Checkup'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>{item.patientProfile.age}y / {item.patientProfile.gender.charAt(0)}</span>
                      <span className="font-mono">{item.intakeTimestamp}</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'In Consultation'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Admitted'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Doctor Pre-Consultation & Prescription Suite */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              Select a patient from the waiting queue on the left to begin consultation.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              {/* Patient Top Header Glance Card */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    {selectedPatient.patientProfile.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {selectedPatient.patientProfile.name}
                      </h2>
                      <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        Token {selectedPatient.tokenNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{selectedPatient.patientProfile.age} Yrs</span>
                      <span>•</span>
                      <span>{selectedPatient.patientProfile.gender}</span>
                      <span>•</span>
                      <span>Blood Group: {selectedPatient.patientProfile.blood_group || 'O+'}</span>
                      {selectedPatient.patientProfile.mobile && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{selectedPatient.patientProfile.mobile}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      ABHA ID: <strong className="text-slate-700">{selectedPatient.patientProfile.abha_id}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Actions & Call Next */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCallPatientIn}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Announce & Mark In-Consultation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Call Patient In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveConsultation('Completed')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Consultation</span>
                  </button>
                </div>
              </div>

              {/* Triage / Red Flag Alert */}
              {selectedPatient.triage.red_flag_detected && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 flex items-start gap-3 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-sm text-rose-900 uppercase tracking-wide">
                      Critical Clinical Red Flag Detected
                    </div>
                    <p className="mt-0.5 text-rose-800">
                      {selectedPatient.triage.alert_reason || 'Cardiopulmonary presentation flags detected during triage dialogue.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Pre-Consultation 10-Second Briefing (Synthesized History + Correlation) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Pre-Consultation Clinical File (Synthesized by Kiosk AI)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    Kiosk Synthesized File
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Spoken Symptoms */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-600" /> Spoken Presentation
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Intake Dialogue</span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Chief Complaint:</strong>{' '}
                      {selectedPatient.completeMedicalHistory?.reportedSymptoms.chiefComplaint ||
                        selectedPatient.clinical_data.chief_complaint ||
                        'General medical consultation'}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Duration / Timeline:</strong>{' '}
                      {selectedPatient.completeMedicalHistory?.reportedSymptoms.timelineOnset || selectedPatient.clinical_data.duration || 'Acute presentation'}
                    </div>
                    {selectedPatient.clinical_data.allergies && selectedPatient.clinical_data.allergies.length > 0 && (
                      <div className="text-[11px] text-rose-700 font-semibold">
                        Allergies: {selectedPatient.clinical_data.allergies.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Extracted Past History & Slips */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" /> Extracted Records
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedPatient.uploadedDocuments?.length || 0} Slip(s) Attached
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700">
                      <strong>Chronic Conditions:</strong>{' '}
                      {selectedPatient.patientProfile.chronic_conditions?.length > 0
                        ? selectedPatient.patientProfile.chronic_conditions.join(', ')
                        : 'None declared'}
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <strong>Active Medications:</strong>{' '}
                      {selectedPatient.medications?.length > 0
                        ? selectedPatient.medications.map((m) => m.drug_name).join(', ')
                        : 'No active regimen'}
                    </div>

                    {selectedPatient.medications?.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyPastMeds}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        + Import past medications into current prescription
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Clinical Correlation Box */}
                {selectedPatient.completeMedicalHistory?.clinicalCorrelation && (
                  <div className="text-xs text-emerald-950 bg-emerald-50/90 p-3 rounded-xl border border-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Direct Clinical Correlation (Current Presentation + Past Slips):</span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      {selectedPatient.completeMedicalHistory.clinicalCorrelation.clinicalCorrelationSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Inferred Diagnostic Considerations */}
              {selectedPatient.inferredConditions && selectedPatient.inferredConditions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        AI Inferred Differential Diagnostic Support
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-400">Click to Adopt as Diagnosis</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedPatient.inferredConditions.map((cond) => (
                      <div
                        key={cond.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs">{cond.condition}</span>
                          <button
                            type="button"
                            onClick={() => setFinalDiagnosis(cond.condition)}
                            className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-0.5 rounded font-bold border border-blue-200 transition-colors cursor-pointer"
                          >
                            Use Diagnosis
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-600">
                          Evidence: {cond.evidence.join('; ')}
                        </div>
                        {cond.suggestedAction && (
                          <div className="text-[10px] text-blue-900 font-medium">
                            Suggested Ix: {cond.suggestedAction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Documents & Transcript Toggle */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-700">
                    Attached Files ({selectedPatient.uploadedDocuments?.length || 0}):
                  </span>
                  {selectedPatient.uploadedDocuments && selectedPatient.uploadedDocuments.length > 0 ? (
                    selectedPatient.uploadedDocuments.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setPreviewDoc(d)}
                        className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[11px]">No external slips</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer text-xs"
                >
                  {showTranscript ? 'Hide Dialogue Transcript' : 'View Kiosk Dialogue Transcript'}
                </button>
              </div>

              {/* Collapsible Transcript */}
              {showTranscript && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto space-y-2 text-xs">
                  {selectedPatient.conversationHistory && selectedPatient.conversationHistory.length > 0 ? (
                    selectedPatient.conversationHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-xs ${
                          m.sender === 'patient'
                            ? 'bg-blue-100 text-blue-950 font-medium ml-4'
                            : 'bg-white text-slate-700 mr-4 border border-slate-200'
                        }`}
                      >
                        <span className="font-bold text-[10px] uppercase block mb-0.5 opacity-70">
                          {m.sender === 'patient' ? 'Patient' : 'Kiosk Assistant'} ({m.timestamp}):
                        </span>
                        <span>{m.text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">No dialogue recorded for this session.</p>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: FULL CLINICAL CONSULTATION & PRESCRIPTION WRITING */}
              {/* ------------------------------------------------------------- */}
              <div className="pt-4 border-t-2 border-slate-200 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Physician Prescription &amp; Clinical Orders (Rx / Ix)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Care Context: Token #{selectedPatient.tokenNumber}
                  </span>
                </div>

                {/* Primary Diagnosis & Clinical Impression */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Provisional / Final Diagnosis *
                  </label>
                  <input
                    type="text"
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Bronchial Asthma, Acute Viral Pharyngitis, Type 2 DM"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Rx: Prescribed Medications Module */}
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span>Prescribed Medications (Rx)</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {prescribedMeds.length} items prescribed
                    </span>
                  </div>

                  {/* Active Prescribed Meds Table */}
                  {prescribedMeds.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-400">
                      No medications added to this prescription yet. Use the quick-add buttons below.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse bg-white">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Medicine</th>
                            <th className="py-2 px-3">Dosage</th>
                            <th className="py-2 px-3">Frequency</th>
                            <th className="py-2 px-3">Duration</th>
                            <th className="py-2 px-3">Instructions</th>
                            <th className="py-2 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {prescribedMeds.map((rx, idx) => (
                            <tr key={rx.id} className="hover:bg-slate-50/80">
                              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{rx.drugName}</td>
                              <td className="py-2 px-3 text-slate-700">{rx.dosage}</td>
                              <td className="py-2 px-3 font-semibold text-blue-700">{rx.frequency}</td>
                              <td className="py-2 px-3 text-slate-600">{rx.duration}</td>
                              <td className="py-2 px-3 text-slate-600 italic">{rx.instructions}</td>
                              <td className="py-2 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMed(rx.id)}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded cursor-pointer"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Quick-Pick Popular Drugs Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      Quick Add Popular Hospital Formulations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_DRUGS.map((d) => (
                        <button
                          key={d.name}
                          type="button"
                          onClick={() => handleSelectCommonDrug(d)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                          <span>{d.name.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-400">{d.dose}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Drug Add Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-200/80">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={newDrugName}
                        onChange={(e) => setNewDrugName(e.target.value)}
                        placeholder="Drug / Formulation Name"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newDrugDose}
                        onChange={(e) => setNewDrugDose(e.target.value)}
                        placeholder="Dose (e.g. 500mg)"
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={newDrugFreq}
                        onChange={(e) => setNewDrugFreq(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="OD (Once daily)">OD (Once daily)</option>
                        <option value="BD (Twice daily)">BD (Twice daily)</option>
                        <option value="TDS (3 times/day)">TDS (3 times/day)</option>
                        <option value="QID (4 times/day)">QID (4 times/day)</option>
                        <option value="SOS (As needed)">SOS (As needed)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newDrugDur}
                        onChange={(e) => setNewDrugDur(e.target.value)}
                        placeholder="Duration (e.g. 5 days)"
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        disabled={!newDrugName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Rx</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ix: Diagnostic & Laboratory Investigations */}
                <div className="space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Microscope className="w-4 h-4 text-teal-600" />
                      <span>Order Diagnostic Investigations (Ix)</span>
                    </span>
                    <span className="text-[11px] font-bold text-teal-700">
                      {orderedLabs.length} investigations selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_LABS.map((lab) => {
                      const isSelected = orderedLabs.includes(lab);
                      return (
                        <button
                          key={lab}
                          type="button"
                          onClick={() => handleToggleLab(lab)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50 hover:border-teal-300'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{lab}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={customLabInput}
                      onChange={(e) => setCustomLabInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomLab())}
                      placeholder="Type custom test (e.g. USG KUB, Serum Lipase) and press Add..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLab}
                      disabled={!customLabInput.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      + Add Test
                    </button>
                  </div>
                </div>

                {/* Clinical Notes & Examination Findings */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Clinical Examination Findings &amp; Doctor's Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Document pulse, BP, SpO2, chest auscultation, systemic findings, clinical rationale..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Diet & Lifestyle Advice */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Diet, Lifestyle &amp; Home Care Instructions
                  </label>
                  <input
                    type="text"
                    value={dietLifestyleAdvice}
                    onChange={(e) => setDietLifestyleAdvice(e.target.value)}
                    placeholder="e.g. Adequate hydration, low sodium diet, avoid cold drinks, steam inhalation"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Consultation Disposition & Follow-Up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Consultation Disposition Outcome *
                    </label>
                    <select
                      value={disposition}
                      onChange={(e) => setDisposition(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Discharged with Rx">Discharged with Rx (Prescription)</option>
                      <option value="Follow-up in 3 Days">Follow-up in 3 Days</option>
                      <option value="Follow-up in 1 Week">Follow-up in 1 Week</option>
                      <option value="Admit to Ward">Admit to Inpatient Medical Ward</option>
                      <option value="ER Transfer">Emergency Room (ER) Transfer</option>
                      <option value="Specialist Referral">Refer to Specialty / Tertiary Hospital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Next Follow-Up Timeline
                    </label>
                    <input
                      type="text"
                      value={followUpDays}
                      onChange={(e) => setFollowUpDays(e.target.value)}
                      placeholder="e.g. 5 days / SOS in emergency"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Final Action Bar: Save, Print Slip, Sync ABDM */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSaveConsultation()}
                      disabled={isSavingPrescription}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingPrescription ? 'Saving...' : 'Save Consultation Record'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintPrescriptionSlip}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Download / Print Prescription Slip</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncAbdm}
                      disabled={isSyncingAbdm}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSyncingAbdm ? 'Syncing...' : 'Sync to ABDM Health Locker'}</span>
                    </button>
                  </div>

                  {lastSyncReceipt && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-mono font-bold">
                      ABDM FHIR Bundle: {lastSyncReceipt.fhir_bundle_id}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency / Direct Walk-In Registration Modal */}
      {showAddWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Register Direct Walk-In / ER Patient
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWalkinModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWalkinSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={walkinAge}
                    onChange={(e) => setWalkinAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={walkinGender}
                    onChange={(e) => setWalkinGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chief Presenting Complaint</label>
                <input
                  type="text"
                  value={walkinComplaint}
                  onChange={(e) => setWalkinComplaint(e.target.value)}
                  placeholder="e.g. Severe headache with vomiting since morning"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="walkin-redflag"
                  checked={walkinIsRedFlag}
                  onChange={(e) => setWalkinIsRedFlag(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                />
                <label htmlFor="walkin-redflag" className="font-bold text-amber-950 cursor-pointer text-xs">
                  Mark as Emergency Red-Flag (Immediate Attending Required)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWalkinModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer shadow-sm"
                >
                  Add to Active Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm truncate">{previewDoc.name}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/5">
              {previewDoc.type.includes('pdf') ? (
                <iframe
                  src={previewDoc.base64Data}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-xl border border-slate-300"
                />
              ) : (
                <img
                  src={previewDoc.base64Data}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
