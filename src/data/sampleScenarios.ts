export interface SampleScenario {
  id: string;
  title: string;
  subtitle: string;
  department: 'Allopathic' | 'AYUSH';
  initialInput: string;
  expectedOutcome: 'Emergency' | 'Routine' | 'OCR' | 'AYUSH';
  tags: string[];
  documentSample?: {
    name: string;
    type: string;
    base64Data: string;
    description: string;
  };
}

function safeBase64Encode(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (err) {
    console.warn('Base64 encode fallback:', err);
    return '';
  }
}

// Generate realistic SVG image representations of handwritten Indian doctor OPD slips and Lab reports
function createPrescriptionSvg(doctorName: string, regNo: string, patientName: string, details: string[]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" style="background:#fefbf3; font-family: sans-serif;">
    <!-- Hospital Header -->
    <rect width="600" height="90" fill="#1e3a8a"/>
    <text x="300" y="35" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">AIIMS NEW DELHI - OPD CLINICAL SERVICES</text>
    <text x="300" y="58" text-anchor="middle" fill="#93c5fd" font-size="12">Department of General Medicine • National Health Mission</text>
    <text x="300" y="76" text-anchor="middle" fill="#cbd5e1" font-size="10">Ayushman Bharat ABDM Hospital ID: DL-AIIMS-001</text>
    
    <!-- Doctor & Patient Details -->
    <rect x="20" y="105" width="560" height="75" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4"/>
    <text x="35" y="125" font-size="12" font-weight="bold" fill="#0f172a">Dr. ${doctorName}, MD (Med)</text>
    <text x="35" y="142" font-size="11" fill="#475569">MCI Reg: ${regNo} • Unit III</text>
    <text x="350" y="125" font-size="11" fill="#475569">Date: 11/09/2026</text>
    <text x="35" y="165" font-size="12" font-weight="bold" fill="#0f172a">Pt: ${patientName}</text>
    <text x="250" y="165" font-size="11" fill="#475569">Age: 52y / M</text>
    <text x="350" y="165" font-size="11" fill="#475569">Aadhaar: 4589 7712 9034 [Test ID]</text>

    <!-- Rx Symbol -->
    <text x="35" y="215" font-size="28" font-weight="bold" fill="#1e3a8a" font-family="serif">Rx</text>
    
    <!-- Handwritten appearance lines -->
    <g transform="translate(45, 235)" style="font-family: 'Comic Sans MS', 'Segoe Print', cursive; fill:#1e293b; font-size: 15px;">
      ${details.map((line, idx) => `<text x="10" y="${idx * 42}">${line}</text>`).join('')}
    </g>

    <!-- Stamp & Signature -->
    <circle cx="480" cy="620" r="45" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="480" y="615" text-anchor="middle" font-size="9" font-weight="bold" fill="#2563eb">AIIMS MEDICINE</text>
    <text x="480" y="630" text-anchor="middle" font-size="8" fill="#2563eb">OPD COUNTER #4</text>
    <path d="M430,680 Q460,650 490,670 T530,660" fill="none" stroke="#1d4ed8" stroke-width="2"/>
    <text x="480" y="705" text-anchor="middle" font-size="10" fill="#64748b">Authorized Medical Officer</text>
  </svg>`;
  return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
}

function createLabReportSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" style="background:#ffffff; font-family: sans-serif;">
    <rect width="600" height="80" fill="#047857"/>
    <text x="300" y="35" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="bold">DR. LAL &amp; GOVT PATH LABS DIAGNOSTICS</text>
    <text x="300" y="58" text-anchor="middle" fill="#a7f3d0" font-size="12">Central Biochemistry &amp; Hematology Division • NABL Accredited</text>
    
    <rect x="20" y="95" width="560" height="60" fill="#f0fdf4" stroke="#86efac" stroke-width="1" rx="4"/>
    <text x="35" y="118" font-size="12" font-weight="bold" fill="#065f46">Patient: Ramesh Sharma, 48Y / M</text>
    <text x="350" y="118" font-size="11" fill="#475569">Sample Date: 10/09/2026</text>
    <text x="35" y="138" font-size="11" fill="#475569">Ref by: OPD Unit 2 • ABHA: 91-4456-7890-1234</text>

    <!-- Table Header -->
    <rect x="20" y="175" width="560" height="30" fill="#e2e8f0"/>
    <text x="35" y="195" font-size="12" font-weight="bold" fill="#1e293b">Investigation</text>
    <text x="240" y="195" font-size="12" font-weight="bold" fill="#1e293b">Observed Value</text>
    <text x="370" y="195" font-size="12" font-weight="bold" fill="#1e293b">Reference Range</text>
    <text x="500" y="195" font-size="12" font-weight="bold" fill="#1e293b">Flag</text>

    <!-- Lab Rows -->
    <text x="35" y="235" font-size="12" fill="#0f172a">Fasting Blood Sugar (FBS)</text>
    <text x="240" y="235" font-size="13" font-weight="bold" fill="#dc2626">186 mg/dL</text>
    <text x="370" y="235" font-size="12" fill="#64748b">70 - 100 mg/dL</text>
    <rect x="495" y="220" width="50" height="20" fill="#fee2e2" rx="3"/>
    <text x="520" y="234" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">HIGH</text>

    <text x="35" y="275" font-size="12" fill="#0f172a">HbA1c (Glycated Hb)</text>
    <text x="240" y="275" font-size="13" font-weight="bold" fill="#dc2626">8.6 %</text>
    <text x="370" y="275" font-size="12" fill="#64748b">&lt; 5.7 %</text>
    <rect x="495" y="260" width="50" height="20" fill="#fee2e2" rx="3"/>
    <text x="520" y="274" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">HIGH</text>

    <text x="35" y="315" font-size="12" fill="#0f172a">Total Bilirubin</text>
    <text x="240" y="315" font-size="13" font-weight="bold" fill="#dc2626">3.1 mg/dL</text>
    <text x="370" y="315" font-size="12" fill="#64748b">0.2 - 1.2 mg/dL</text>
    <rect x="495" y="300" width="50" height="20" fill="#fee2e2" rx="3"/>
    <text x="520" y="314" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">HIGH</text>

    <text x="35" y="355" font-size="12" fill="#0f172a">Serum Creatinine</text>
    <text x="240" y="355" font-size="12" fill="#0f172a">1.05 mg/dL</text>
    <text x="370" y="355" font-size="12" fill="#64748b">0.7 - 1.3 mg/dL</text>
    <text x="505" y="355" font-size="11" fill="#16a34a">NORMAL</text>

    <text x="35" y="395" font-size="12" fill="#0f172a">Hemoglobin (Hb)</text>
    <text x="240" y="395" font-size="13" font-weight="bold" fill="#ea580c">10.6 g/dL</text>
    <text x="370" y="395" font-size="12" fill="#64748b">13.0 - 17.0 g/dL</text>
    <rect x="495" y="380" width="50" height="20" fill="#ffedd5" rx="3"/>
    <text x="520" y="394" font-size="11" font-weight="bold" fill="#ea580c" text-anchor="middle">LOW</text>

    <!-- Pathology note -->
    <rect x="20" y="440" width="560" height="80" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
    <text x="35" y="465" font-size="11" font-weight="bold" fill="#334155">Pathologist Impression:</text>
    <text x="35" y="485" font-size="11" fill="#475569">- Uncontrolled Glycemic state with HbA1c 8.6% (indicates poor 3-month control)</text>
    <text x="35" y="502" font-size="11" fill="#475569">- Conjugated Hyperbilirubinemia with mild normocytic anemia</text>

    <text x="480" y="660" text-anchor="middle" font-size="10" fill="#64748b">Senior Biochemist Sign</text>
  </svg>`;
  return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'chest_pain_emergency',
    title: '🚨 Emergency Triage: Acute Chest Pain & Arm Radiation',
    subtitle: 'Low-literacy patient in Hinglish with suspected Acute Coronary Syndrome and Aadhaar leak test.',
    department: 'Allopathic',
    initialInput:
      'Doctor sahab, mujhe 1 ghante se chaati me bhari pathar jaisa dard lag raha hai, left arm (baye haath) me dard ja raha hai aur paseena aa raha hai. Mera Aadhaar 5489 1234 9876 hai.',
    expectedOutcome: 'Emergency',
    tags: ['Red-Flag Detection', 'Hinglish ASR', 'DPDP Aadhaar Redaction', 'Emergency Bypass'],
  },
  {
    id: 'diabetic_slip_ocr',
    title: '📄 Chronic Diabetes & HTN with Handwritten OPD Slip OCR',
    subtitle: 'Patient presenting with glycemic imbalance; includes multimodal handwritten Indian prescription slip.',
    department: 'Allopathic',
    initialInput:
      'Mujhe pichhle 5 din se pairon me jalan aur thakaan ho rahi hai. Purani dawai ki parchi sath laya hu.',
    expectedOutcome: 'OCR',
    tags: ['Multimodal OCR', 'SOCRATES', 'Medication Extraction', 'Indian Prescription'],
    documentSample: {
      name: 'AIIMS_Handwritten_OPD_Slip.jpg',
      type: 'image/svg+xml',
      base64Data: createPrescriptionSvg(
        'V. K. Mehta',
        'DMC-44821',
        'Ramesh Sharma',
        [
          'Dx: T2DM / Essential HTN / Dyspepsia',
          '1. Tab Glycomet-GP 1 (Metformin+Glimepiride) 1 tab BD pc',
          '2. Tab Telma 40 (Telmisartan 40mg) 1 tab OD morning',
          '3. Tab Pantocid 40 (Pantoprazole) 1 tab OD ac (empty stomach)',
          '4. Syp Sucralfate 2 tsp TDS x 7 days',
          'Advice: Check FBS, PPBS, S. Creatinine & HbA1c in 1 wk',
        ]
      ),
      description: 'Realistic handwritten Indian doctor OPD slip with abbreviation markers (BD, OD, pc, ac).',
    },
  },
  {
    id: 'ayush_dashavidha',
    title: '🌿 AYUSH OPD: Dashavidha Pariksha (Digestive & Agni Mandya)',
    subtitle: 'Ayurvedic OPD intake capturing Agni (digestive fire), Koshtha, and Prakriti.',
    department: 'AYUSH',
    initialInput:
      'Namaste Vaidya ji, mujhe pet me bahut bhari-pan lagta hai, khana theek se pachta nahi hai aur kabz (constipation) rehti hai.',
    expectedOutcome: 'AYUSH',
    tags: ['Dashavidha Pariksha', 'Agni Pariksha', 'Koshtha', 'Ahara-Vihara'],
  },
  {
    id: 'lab_report_ocr',
    title: '🧪 NABL Lab Report: High Sugar & Elevated Bilirubin',
    subtitle: 'Multimodal extraction of abnormal lab values (FBS 186, HbA1c 8.6%, Bilirubin 3.1) with critical flags.',
    department: 'Allopathic',
    initialInput:
      'Maine kal subah blood test karwaya tha, report me sugar aur bilirubin high aaya hai.',
    expectedOutcome: 'OCR',
    tags: ['Lab OCR', 'Abnormal Values', 'High/Critical Flags', 'FHIR Observation'],
    documentSample: {
      name: 'Biochemistry_Lab_Report.png',
      type: 'image/svg+xml',
      base64Data: createLabReportSvg(),
      description: 'NABL diagnostic laboratory report with structured investigation values.',
    },
  },
];
