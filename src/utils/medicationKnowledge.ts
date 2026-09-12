import { Medication } from '../types';

export interface MedicationTherapeuticProfile {
  drugName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  purpose: string;
  inferredCondition: string;
  category: string;
  isHighAlert?: boolean;
}

interface KnownMedicationEntry {
  patterns: string[];
  purpose: string;
  inferredCondition: string;
  category: string;
  isHighAlert?: boolean;
}

const KNOWN_MEDICATIONS: KnownMedicationEntry[] = [
  // Antacids / PPIs / Gastrointestinal
  {
    patterns: ['pan 40', 'pan-d', 'pan d', 'pantoprazole', 'pantocid', 'pantodac', 'pantosec'],
    purpose: 'Antacid / Acid Reducer (PPI)',
    inferredCondition: 'Gastroesophageal Reflux Disease (GERD) / Acid Peptic Disease',
    category: 'Gastroenterology',
  },
  {
    patterns: ['omeprazole', 'omez', 'omez-d', 'omecid'],
    purpose: 'Antacid / Gastric Acid Suppressant',
    inferredCondition: 'GERD / Gastritis / Peptic Ulcer',
    category: 'Gastroenterology',
  },
  {
    patterns: ['rabeprazole', 'razo', 'razo-d', 'rabium', 'cyra'],
    purpose: 'Antacid / PPI',
    inferredCondition: 'Acid Peptic Disease / Reflux Esophagitis',
    category: 'Gastroenterology',
  },
  {
    patterns: ['esomeprazole', 'nexpro', 'esomac'],
    purpose: 'Acid Reducer (PPI)',
    inferredCondition: 'Severe GERD / Erosive Esophagitis',
    category: 'Gastroenterology',
  },
  {
    patterns: ['ranitidine', 'rantac', 'zantac', 'famotidine'],
    purpose: 'H2-Receptor Blocker / Acid Reducer',
    inferredCondition: 'Hyperacidity / Dyspepsia',
    category: 'Gastroenterology',
  },
  {
    patterns: ['gelusil', 'digene', 'mucaine', 'sucralfate', 'sucrafil'],
    purpose: 'Mucosal Protectant / Liquid Antacid',
    inferredCondition: 'Acute Gastritis / Peptic Ulceration',
    category: 'Gastroenterology',
  },

  // Neuropsychiatric / Anxiety / Insomnia / Sedatives
  {
    patterns: ['etizolam', 'etilaam', 'etizola', 'ezolent', 'etova'],
    purpose: 'Anxiolytic & Sleep Inducer',
    inferredCondition: 'Generalized Anxiety Disorder / Acute Insomnia',
    category: 'Psychiatry & Sleep',
    isHighAlert: true,
  },
  {
    patterns: ['alprazolam', 'alprax', 'restyl', 'trika', 'zolax'],
    purpose: 'Fast-acting Anxiolytic (Benzodiazepine)',
    inferredCondition: 'Panic Attacks / Severe Anxiety Disorder',
    category: 'Psychiatry',
    isHighAlert: true,
  },
  {
    patterns: ['clonazepam', 'zapiz', 'clonotril', 'rivotril', 'epitril'],
    purpose: 'Anxiolytic / Anti-seizure / Sleep stabilizer',
    inferredCondition: 'Chronic Panic Disorder / Insomnia / Seizure Prophylaxis',
    category: 'Psychiatry & Neurology',
    isHighAlert: true,
  },
  {
    patterns: ['zolpidem', 'nitrest', 'zolfresh', 'ambien'],
    purpose: 'Hypnotic / Non-benzodiazepine Sleep Aid',
    inferredCondition: 'Short-term Insomnia Management',
    category: 'Sleep Medicine',
  },

  // Mood / Antidepressants / Sleep Support
  {
    patterns: ['logen', 'mirtaz', 'mirtazapine', 'mirnite'],
    purpose: 'Mood Stabilizer & Sedating Antidepressant',
    inferredCondition: 'Depressive Disorder with Insomnia / Weight Loss',
    category: 'Psychiatry',
  },
  {
    patterns: ['escitalopram', 'nexito', 'stalopam', 'cipralex', 'esdep'],
    purpose: 'SSRI Antidepressant & Anti-anxiety',
    inferredCondition: 'Major Depressive Disorder / Anxiety Neurosis',
    category: 'Psychiatry',
  },
  {
    patterns: ['sertraline', 'serlift', 'daxid', 'zoloft'],
    purpose: 'SSRI Antidepressant',
    inferredCondition: 'Depression / OCD / Panic Disorder',
    category: 'Psychiatry',
  },
  {
    patterns: ['fluoxetine', 'flunil', 'prozac'],
    purpose: 'SSRI Antidepressant',
    inferredCondition: 'Depression / Bulimia / Panic',
    category: 'Psychiatry',
  },
  {
    patterns: ['amitriptyline', 'tryptomer', 'sarotena'],
    purpose: 'Tricyclic Antidepressant / Migraine & Sleep Support',
    inferredCondition: 'Neuropathic Pain / Chronic Migraine / Sleep Disturbance',
    category: 'Neurology & Psychiatry',
  },
  {
    patterns: ['duloxetine', 'duzela', 'symbal', 'cymbalta'],
    purpose: 'SNRI / Nerve Pain & Mood Support',
    inferredCondition: 'Diabetic Neuropathy / Fibromyalgia / Depression',
    category: 'Neurology',
  },

  // Cardiovascular / Anti-hypertensive
  {
    patterns: ['telmisartan', 'telma', 'telsar', 'telpres', 'creser'],
    purpose: 'Blood Pressure Control (ARB)',
    inferredCondition: 'Essential Systemic Hypertension / Cardioprotection',
    category: 'Cardiovascular',
  },
  {
    patterns: ['amlodipine', 'stamlo', 'amlong', 'amlovas', 'norvasc'],
    purpose: 'Calcium Channel Blocker / BP Lowering',
    inferredCondition: 'Systemic Hypertension / Stable Angina',
    category: 'Cardiovascular',
  },
  {
    patterns: ['losartan', 'losar', 'repace', 'cozaar'],
    purpose: 'Angiotensin II Receptor Blocker (ARB)',
    inferredCondition: 'Hypertension / Diabetic Nephropathy Protection',
    category: 'Cardiovascular',
  },
  {
    patterns: ['metoprolol', 'betaloc', 'metolar', 'seloken'],
    purpose: 'Beta-Blocker / Heart Rate & BP Regulator',
    inferredCondition: 'Hypertension / Tachyarrhythmia / Angina',
    category: 'Cardiovascular',
  },
  {
    patterns: ['atenolol', 'betacard', 'tenormin'],
    purpose: 'Beta-Blocker / Anti-hypertensive',
    inferredCondition: 'Essential Hypertension',
    category: 'Cardiovascular',
  },
  {
    patterns: ['cilnidipine', 'cilacar', 'nexovas'],
    purpose: 'Dual L/N-type Calcium Channel Blocker',
    inferredCondition: 'Hypertension with Proteinuria / Tachycardia',
    category: 'Cardiovascular',
  },
  {
    patterns: ['ramipril', 'cardace', 'enalapril', 'vasotec'],
    purpose: 'ACE Inhibitor / BP Lowering & Renal Protection',
    inferredCondition: 'Hypertension / Heart Failure / Post-MI',
    category: 'Cardiovascular',
  },

  // Diabetes Mellitus / Glycemic Control
  {
    patterns: ['metformin', 'glycomet', 'glyciphage', 'obimet', 'riomet'],
    purpose: 'First-line Oral Hypoglycemic (Biguanide)',
    inferredCondition: 'Type 2 Diabetes Mellitus / Insulin Resistance',
    category: 'Endocrinology',
  },
  {
    patterns: ['glimepiride', 'amaryl', 'glypride', 'zoryl'],
    purpose: 'Insulin Secretagogue (Sulfonylurea)',
    inferredCondition: 'Type 2 Diabetes Mellitus',
    category: 'Endocrinology',
  },
  {
    patterns: ['teneligliptin', 'tenlimac', 'tendia', 'ziten'],
    purpose: 'DPP-4 Inhibitor / Glycemic Control',
    inferredCondition: 'Type 2 Diabetes Mellitus',
    category: 'Endocrinology',
  },
  {
    patterns: ['vildagliptin', 'galvus', 'jalra'],
    purpose: 'DPP-4 Inhibitor',
    inferredCondition: 'Type 2 Diabetes Mellitus',
    category: 'Endocrinology',
  },
  {
    patterns: ['sitagliptin', 'januvia', 'istavel'],
    purpose: 'DPP-4 Inhibitor / Postprandial Glucose Reducer',
    inferredCondition: 'Type 2 Diabetes Mellitus',
    category: 'Endocrinology',
  },
  {
    patterns: ['dapagliflozin', 'forxiga', 'oxra', 'dapa'],
    purpose: 'SGLT2 Inhibitor / Glucose Excretion & Renal Protection',
    inferredCondition: 'Type 2 Diabetes with Renal / Cardiac Risk',
    category: 'Endocrinology & Nephrology',
  },
  {
    patterns: ['empagliflozin', 'jardiance', 'gibo'],
    purpose: 'SGLT2 Inhibitor / Cardioprotective Hypoglycemic',
    inferredCondition: 'Type 2 Diabetes Mellitus / Heart Failure Risk',
    category: 'Endocrinology',
  },
  {
    patterns: ['insulin', 'mixtard', 'lantus', 'humalog', 'novorapid'],
    purpose: 'Injectable Hormone / Glycemic Replacement',
    inferredCondition: 'Insulin-Dependent Type 1 / Advanced Type 2 Diabetes',
    category: 'Endocrinology',
    isHighAlert: true,
  },

  // Lipid Lowering / Statins
  {
    patterns: ['atorvastatin', 'atorva', 'lipitor', 'storvas', 'tonact'],
    purpose: 'Cholesterol Lowering Statin (HMG-CoA Reductase Inhibitor)',
    inferredCondition: 'Hypercholesterolemia / Atherosclerotic CVD Prevention',
    category: 'Cardiovascular',
  },
  {
    patterns: ['rosuvastatin', 'rozavel', 'crestor', 'rosuvas'],
    purpose: 'Potent Lipid-Lowering Statin',
    inferredCondition: 'Mixed Dyslipidemia / Coronary Artery Disease Risk',
    category: 'Cardiovascular',
  },
  {
    patterns: ['fenofibrate', 'lipicard', 'tricor'],
    purpose: 'Triglyceride-Lowering Fibrate',
    inferredCondition: 'Hypertriglyceridemia',
    category: 'Cardiovascular',
  },

  // Thyroid
  {
    patterns: ['thyronorm', 'eltroxin', 'levothyroxine', 'thyrox'],
    purpose: 'Thyroid Hormone Replacement (T4)',
    inferredCondition: 'Primary Hypothyroidism / Hashimotos Thyroiditis',
    category: 'Endocrinology',
  },

  // Allergy / Asthma / Respiratory
  {
    patterns: ['montelukast', 'montair', 'telekast', 'monticope'],
    purpose: 'Leukotriene Receptor Antagonist (Anti-allergy / Asthma)',
    inferredCondition: 'Bronchial Asthma / Allergic Rhinitis Prevention',
    category: 'Pulmonology',
  },
  {
    patterns: ['levocetirizine', 'levocet', '1-al', 'vozet'],
    purpose: 'Non-sedating Antihistamine (Anti-allergic)',
    inferredCondition: 'Allergic Rhinitis / Chronic Urticaria / Sneezing',
    category: 'Allergy & Immunology',
  },
  {
    patterns: ['allegra', 'fexofenadine', 'fexova'],
    purpose: 'Second-generation Antihistamine',
    inferredCondition: 'Seasonal Allergic Rhinitis / Skin Pruritus',
    category: 'Allergy',
  },
  {
    patterns: ['budecort', 'budesonide', 'pulmicort'],
    purpose: 'Inhaled Corticosteroid / Airway Anti-inflammatory',
    inferredCondition: 'Persistent Bronchial Asthma / COPD Maintenance',
    category: 'Pulmonology',
  },
  {
    patterns: ['foracort', 'seroflo', 'aerocort'],
    purpose: 'Combination Inhaler (Steroid + LABA Bronchodilator)',
    inferredCondition: 'Moderate-to-Severe Asthma / Chronic Bronchitis',
    category: 'Pulmonology',
  },
  {
    patterns: ['asthalin', 'salbutamol', 'ventolin'],
    purpose: 'Fast-acting Rescue Bronchodilator (SABA)',
    inferredCondition: 'Acute Asthma Bronchospasm / Wheezing Attack',
    category: 'Pulmonology',
  },
  {
    patterns: ['deriphyllin', 'theophylline', 'etofylline'],
    purpose: 'Bronchodilator (Xanthine derivative)',
    inferredCondition: 'COPD / Asthmatic Bronchoconstriction',
    category: 'Pulmonology',
  },

  // Antibiotics / Anti-infectives
  {
    patterns: ['azithromycin', 'azee', 'azithral', 'zady'],
    purpose: 'Macrolide Antibiotic (Broad-Spectrum)',
    inferredCondition: 'Upper / Lower Respiratory Tract or Soft Tissue Infection',
    category: 'Infectious Disease',
  },
  {
    patterns: ['amoxicillin', 'mox', 'novamox', 'augmentin', 'clavam'],
    purpose: 'Penicillin Antibiotic with Clavulanate',
    inferredCondition: 'Bacterial ENT / Dental / Pulmonary Infection',
    category: 'Infectious Disease',
  },
  {
    patterns: ['cefixime', 'taxim-o', 'mahacef', 'ceftas'],
    purpose: 'Third-generation Cephalosporin Antibiotic',
    inferredCondition: 'Bacterial Typhoid / UTI / Respiratory Tract Infection',
    category: 'Infectious Disease',
  },
  {
    patterns: ['ciprofloxacin', 'ciplox', 'cifran', 'norfloxacin', 'norbactin'],
    purpose: 'Fluoroquinolone Antibiotic',
    inferredCondition: 'Urinary Tract Infection / Infectious Diarrhea',
    category: 'Infectious Disease',
  },
  {
    patterns: ['metronidazole', 'flagyl', 'metrogyl'],
    purpose: 'Antiprotozoal & Anaerobic Antibiotic',
    inferredCondition: 'Amoebiasis / Giardiasis / Dental Anaerobic Infection',
    category: 'Infectious Disease',
  },

  // Pain / Fever / Anti-inflammatory
  {
    patterns: ['dolo 650', 'dolo', 'paracetamol', 'crocin', 'calpol', 'pacimol', 'pcm'],
    purpose: 'Antipyretic & Analgesic (Fever & Mild Pain Relief)',
    inferredCondition: 'Acute Febrile Illness / Headache / Body Aches',
    category: 'General Medicine',
  },
  {
    patterns: ['combiflam', 'brufen', 'ibuprofen'],
    purpose: 'NSAID + Analgesic (Pain & Swelling Relief)',
    inferredCondition: 'Acute Musculoskeletal Pain / Dental Ache / Dysmenorrhea',
    category: 'Orthopedics & Rheumatology',
  },
  {
    patterns: ['aceclofenac', 'zerodol', 'hifenac'],
    purpose: 'NSAID / Joint & Muscle Anti-inflammatory',
    inferredCondition: 'Osteoarthritis / Spondylitis / Acute Arthralgia',
    category: 'Orthopedics',
  },
  {
    patterns: ['diclofenac', 'voveran', 'dynapar'],
    purpose: 'Potent NSAID / Acute Pain Alleviator',
    inferredCondition: 'Severe Arthritic Flare / Renal Colic / Soft Tissue Injury',
    category: 'Orthopedics',
  },
  {
    patterns: ['meftal', 'meftal-spas', 'mefenamic'],
    purpose: 'Antispasmodic & NSAID',
    inferredCondition: 'Abdominal Colic / Spasmodic Dysmenorrhea',
    category: 'Gastroenterology / Gynecology',
  },

  // Neuropathic Pain & Nerve Care
  {
    patterns: ['pregabalin', 'pregalin', 'lyrica', 'pregbil'],
    purpose: 'Neuropathic Analgesic & GABA Analogue',
    inferredCondition: 'Diabetic Peripheral Neuropathy / Sciatica / Post-Herpetic Neuralgia',
    category: 'Neurology',
  },
  {
    patterns: ['gabapentin', 'gabapin', 'neurontin'],
    purpose: 'Neuropathic Pain Agent / Anticonvulsant',
    inferredCondition: 'Radiculopathy / Nerve Compression / Trigeminal Neuralgia',
    category: 'Neurology',
  },
  {
    patterns: ['methylcobalamin', 'neurobion', 'mecobalamin', 'nurokind', 'b12'],
    purpose: 'Active Vitamin B12 / Nerve Regeneration',
    inferredCondition: 'Peripheral Neuropathy / Megaloblastic Anemia / Nutritional Deficit',
    category: 'Neurology & Nutrition',
  },

  // Antiemetics / Motility
  {
    patterns: ['ondansetron', 'emeset', 'vomikind', 'zofran'],
    purpose: '5-HT3 Antiemetic / Nausea Controller',
    inferredCondition: 'Acute Nausea & Emesis / Gastroenteritis Support',
    category: 'Gastroenterology',
  },
  {
    patterns: ['domperidone', 'vomistop'],
    purpose: 'Prokinetic & Antiemetic',
    inferredCondition: 'Nausea with Bloating / Gastro-esophageal Reflux',
    category: 'Gastroenterology',
  },

  // Antiplatelet / Anticoagulants
  {
    patterns: ['aspirin', 'ecosprin', 'disprin', 'asa'],
    purpose: 'Antiplatelet / Blood Thinner (Anti-thrombotic)',
    inferredCondition: 'Coronary Artery Disease / Ischemic Stroke Prophylaxis',
    category: 'Cardiovascular',
    isHighAlert: true,
  },
  {
    patterns: ['clopidogrel', 'clopilet', 'plavix'],
    purpose: 'Platelet Aggregation Inhibitor',
    inferredCondition: 'Post-Stent / Secondary Cardiovascular Prevention',
    category: 'Cardiovascular',
    isHighAlert: true,
  },

  // Ayurvedic / AYUSH Formulations
  {
    patterns: ['shallaki', 'shallaki forte', 'boswellia'],
    purpose: 'Ayurvedic Anti-inflammatory & Cartilage Support',
    inferredCondition: 'Sandhivata (Osteoarthritis) / Joint Degeneration',
    category: 'AYUSH (Ayurveda)',
  },
  {
    patterns: ['yograj guggulu', 'guggul', 'kaishore guggulu'],
    purpose: 'Classical Ayurvedic Vata-Pacifying Formulation',
    inferredCondition: 'Amavata (Rheumatoid Arthralgia) / Vata Vyadhi',
    category: 'AYUSH (Ayurveda)',
  },
  {
    patterns: ['ashwagandha', 'ashwagandharishta'],
    purpose: 'Rasayana / Adaptogen & Nervous System Tonic',
    inferredCondition: 'Dhatukshaya (General Debility) / Stress / Insomnia',
    category: 'AYUSH (Ayurveda)',
  },
  {
    patterns: ['triphala', 'triphala churna'],
    purpose: 'Digestive Regimen & Mild Laxative (Anulomana)',
    inferredCondition: 'Vibandha (Constipation) / Agnimandya',
    category: 'AYUSH (Ayurveda)',
  },
  {
    patterns: ['avipattikar', 'shankha vati'],
    purpose: 'Pitta-Pacifying Antacid Formulation',
    inferredCondition: 'Amlapitta (Hyperacidity & Sour Belching)',
    category: 'AYUSH (Ayurveda)',
  },
];

/**
 * Identify primary therapeutic use and inferred condition for any medication.
 */
export function identifyMedicationPurpose(drugName: string): {
  purpose: string;
  inferredCondition: string;
  category: string;
  isHighAlert: boolean;
} {
  const normalized = drugName.toLowerCase().trim();

  for (const entry of KNOWN_MEDICATIONS) {
    for (const pattern of entry.patterns) {
      if (normalized.includes(pattern)) {
        return {
          purpose: entry.purpose,
          inferredCondition: entry.inferredCondition,
          category: entry.category,
          isHighAlert: Boolean(entry.isHighAlert),
        };
      }
    }
  }

  // Generic heuristic fallbacks based on common drug suffix conventions
  if (normalized.endsWith('prazole') || normalized.includes('prazole')) {
    return {
      purpose: 'Antacid / Acid Suppressant (PPI)',
      inferredCondition: 'Acid Peptic Disease / GERD',
      category: 'Gastroenterology',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('sartan') || normalized.includes('sartan')) {
    return {
      purpose: 'Blood Pressure Control (ARB)',
      inferredCondition: 'Hypertension',
      category: 'Cardiovascular',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('statin') || normalized.includes('statin')) {
    return {
      purpose: 'Lipid-Lowering Agent (Statin)',
      inferredCondition: 'Hypercholesterolemia / Dyslipidemia',
      category: 'Cardiovascular',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('gliptin') || normalized.includes('gliptin')) {
    return {
      purpose: 'Oral Hypoglycemic (DPP-4 Inhibitor)',
      inferredCondition: 'Type 2 Diabetes Mellitus',
      category: 'Endocrinology',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('gliflozin') || normalized.includes('gliflozin')) {
    return {
      purpose: 'Oral Hypoglycemic (SGLT-2 Inhibitor)',
      inferredCondition: 'Type 2 Diabetes Mellitus',
      category: 'Endocrinology',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('olol') || normalized.includes('olol')) {
    return {
      purpose: 'Beta-Blocker (BP / Heart Rate Regulator)',
      inferredCondition: 'Hypertension / Arrhythmia',
      category: 'Cardiovascular',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('dipine') || normalized.includes('dipine')) {
    return {
      purpose: 'Calcium Channel Blocker (BP Control)',
      inferredCondition: 'Hypertension',
      category: 'Cardiovascular',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('pril') || normalized.includes('pril')) {
    return {
      purpose: 'ACE Inhibitor (BP & Renal Protector)',
      inferredCondition: 'Hypertension',
      category: 'Cardiovascular',
      isHighAlert: false,
    };
  }
  if (normalized.endsWith('zepam') || normalized.endsWith('zolam') || normalized.includes('zepam') || normalized.includes('zolam')) {
    return {
      purpose: 'Anxiolytic / Sedative (Benzodiazepine/Analogue)',
      inferredCondition: 'Anxiety / Insomnia / Muscle Spasm',
      category: 'Psychiatry & Neurology',
      isHighAlert: true,
    };
  }
  if (normalized.endsWith('cillin') || normalized.endsWith('mycin') || normalized.endsWith('cycline') || normalized.endsWith('xacin')) {
    return {
      purpose: 'Broad-Spectrum Antibacterial Agent',
      inferredCondition: 'Active Bacterial Infection',
      category: 'Infectious Disease',
      isHighAlert: false,
    };
  }
  if (normalized.includes('guggul') || normalized.includes('taila') || normalized.includes('churna') || normalized.includes('vati')) {
    return {
      purpose: 'Classical Ayurvedic Formulation',
      inferredCondition: 'Ayurvedic Dosha Imbalance',
      category: 'AYUSH (Ayurveda)',
      isHighAlert: false,
    };
  }

  // Safe universal fallback
  return {
    purpose: 'Prescribed Pharmacotherapy',
    inferredCondition: 'Underlying Chronic / Acute Care Indication',
    category: 'General Medicine',
    isHighAlert: false,
  };
}

/**
 * Enrich a list of medications with smart therapeutic purpose and inferred indications.
 */
export function enrichMedicationsWithPurpose(medications: Medication[]): MedicationTherapeuticProfile[] {
  return (medications || []).map((m) => {
    const analysis = identifyMedicationPurpose(m.drug_name);
    return {
      drugName: m.drug_name,
      dosage: m.dosage || 'Standard Dose',
      frequency: m.frequency || 'As Directed',
      duration: m.duration,
      purpose: m.purpose || analysis.purpose,
      inferredCondition: m.inferred_condition || analysis.inferredCondition,
      category: analysis.category,
      isHighAlert: analysis.isHighAlert,
    };
  });
}

/**
 * Synthesizes a direct correlation between the patient's current chief complaint
 * and their background medical context & active medications.
 */
export function generateClinicalCorrelation({
  chiefComplaint,
  timelineOnset,
  enrichedMeds,
  inferredPastConditions,
  abnormalLabsCount = 0,
}: {
  chiefComplaint: string;
  timelineOnset?: string;
  enrichedMeds: MedicationTherapeuticProfile[];
  inferredPastConditions: string[];
  abnormalLabsCount?: number;
}): {
  currentPresentation: string;
  underlyingContext: string;
  clinicalCorrelationSummary: string;
  keyActionItem: string;
} {
  const ccLower = chiefComplaint.toLowerCase();
  const medPurposes = enrichedMeds.map((m) => m.purpose.toLowerCase()).join(' ');
  const medNames = enrichedMeds.map((m) => m.drugName.toLowerCase()).join(' ');
  const conditions = inferredPastConditions.length > 0
    ? inferredPastConditions.join(', ')
    : enrichedMeds.map((m) => m.inferredCondition).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ');

  const currentPresentation = `${chiefComplaint}${timelineOnset ? ` (${timelineOnset})` : ''}`;

  let underlyingContext = conditions
    ? `Documented background of: ${conditions}.`
    : 'No prior chronic conditions recorded in attached papers.';

  if (enrichedMeds.length > 0) {
    const medSummary = enrichedMeds.slice(0, 3).map((m) => `${m.drugName} (${m.purpose.split('/')[0].trim()})`).join(', ');
    underlyingContext += ` Active pharmacotherapy: ${medSummary}.`;
  }

  // Correlation logic: [Current Complaint] + [Medication Context]
  let clinicalCorrelationSummary = '';
  let keyActionItem = '';

  if (ccLower.includes('fever') || ccLower.includes('bukhar') || ccLower.includes('chill')) {
    if (medNames.includes('metformin') || medPurposes.includes('diabet')) {
      clinicalCorrelationSummary = `Acute febrile episode in a patient with Type 2 Diabetes (on ${enrichedMeds.find((m) => m.drugName.toLowerCase().includes('metform'))?.drugName || 'Metformin'}). Acute infection may precipitate glycemic decompensation or mask secondary bacterial foci.`;
      keyActionItem = 'Check spot blood glucose (RBS), Complete Blood Count (CBC with Platelets), and screen for source (respiratory vs. urinary).';
    } else if (medNames.includes('telmisartan') || medPurposes.includes('hypertension')) {
      clinicalCorrelationSummary = `Acute fever with systemic symptoms in a patient receiving anti-hypertensive therapy. Monitor for dehydration-induced postural hypotension.`;
      keyActionItem = 'Assess hydration status, record sitting/standing BP, and order Dengue NS1/Malaria MP if persisting.';
    } else {
      clinicalCorrelationSummary = `Acute febrile illness presenting ${timelineOnset || 'recently'}. Evaluate for common endemic vectors (Dengue, Malaria, Typhoid, or viral URTI).`;
      keyActionItem = 'Vital signs monitoring, CBC with Platelet count, antipyretic titration with hydration.';
    }
  } else if (ccLower.includes('chest') || ccLower.includes('heart') || ccLower.includes('breathless') || ccLower.includes('chaati')) {
    if (medPurposes.includes('blood pressure') || medPurposes.includes('statin') || medPurposes.includes('cholesterol')) {
      clinicalCorrelationSummary = `Acute chest/cardiopulmonary symptoms in an individual with recognized vascular risk factors (treated Hypertension and/or Dyslipidemia). High clinical index of suspicion for Acute Coronary Syndrome (ACS).`;
      keyActionItem = 'Urgent 12-lead ECG stat, cardiac enzymes (Troponin I), blood pressure recording, and pulse oximetry.';
    } else {
      clinicalCorrelationSummary = `Thoracic discomfort/dyspnea requiring immediate rule-out of cardiac and pulmonary causes.`;
      keyActionItem = 'Immediate ECG stat, SpO2 monitoring, bilateral chest auscultation.';
    }
  } else if (ccLower.includes('stomach') || ccLower.includes('pet') || ccLower.includes('acid') || ccLower.includes('burn') || ccLower.includes('jalan')) {
    if (medPurposes.includes('antacid') || medNames.includes('pan') || medNames.includes('omep')) {
      clinicalCorrelationSummary = `Acute dyspeptic or epigastric flare in a patient with pre-existing acid-peptic disease managed with PPI therapy (${enrichedMeds.find((m) => m.drugName.toLowerCase().includes('pan'))?.drugName || 'Pantoprazole'}). Consider breakthrough reflux, H. pylori, or medication non-compliance.`;
      keyActionItem = 'Evaluate dietary triggers, verify fasting PPI timing, and assess for NSAID-induced gastric mucosal injury.';
    } else {
      clinicalCorrelationSummary = `Acute gastrointestinal distress; screen for food-borne gastritis, peptic ulceration, or biliary pathology.`;
      keyActionItem = 'Abdominal palpation for guarding/rebound, antacid trial, ultrasound abdomen if focal.';
    }
  } else if (ccLower.includes('anxiety') || ccLower.includes('sleep') || ccLower.includes('insomnia') || ccLower.includes('ghabrahat') || ccLower.includes('bechaini')) {
    if (medPurposes.includes('anxiolytic') || medPurposes.includes('sleep') || medPurposes.includes('antidepressant')) {
      clinicalCorrelationSummary = `Neuropsychiatric symptom escalation in a patient with established treatment history for anxiety/sleep disturbance (${enrichedMeds.map((m) => m.drugName).join(', ')}). Inquire about recent stressors, dose irregularity, or rebound insomnia.`;
      keyActionItem = 'Review medication adherence, sleep hygiene counseling, screen for suicidal ideation or drug dependency.';
    } else {
      clinicalCorrelationSummary = `Acute anxiety and sleep disturbance without previous recorded psychotropic medication. Exclude hyperthyroidism and autonomic instability.`;
      keyActionItem = 'Evaluate thyroid profile (TSH), rule out arrhythmia/palpitations, and provide supportive mental health guidance.';
    }
  } else if (ccLower.includes('joint') || ccLower.includes('knee') || ccLower.includes('pain') || ccLower.includes('ghutno') || ccLower.includes('kamar')) {
    if (medPurposes.includes('ayurvedic') || medPurposes.includes('nsaid') || medPurposes.includes('cartilage')) {
      clinicalCorrelationSummary = `Exacerbation of chronic musculoskeletal arthralgia (Osteoarthritis/Sandhivata) currently managed with conservative/Ayurvedic therapy (${enrichedMeds.map((m) => m.drugName).join(', ')}).`;
      keyActionItem = 'Range of motion assessment, bilateral weight-bearing joint X-ray, consider physical therapy or NSAID adjustment.';
    } else {
      clinicalCorrelationSummary = `Acute or subacute musculoskeletal pain presenting for orthopedic/rheumatologic workup.`;
      keyActionItem = 'Joint examination for effusion, warmth, and range of movement; check Serum Uric Acid & ESR.';
    }
  } else {
    // Universal synthesized correlation
    clinicalCorrelationSummary = `Patient presents with chief complaint of "${chiefComplaint}". ${
      enrichedMeds.length > 0
        ? `Patient maintains an active pharmacotherapy regimen encompassing ${enrichedMeds.length} medication(s) for underlying ${conditions || 'chronic indications'}.`
        : 'No concurrent chronic prescription drugs extracted from uploaded documents.'
    }`;
    keyActionItem = 'Complete physical examination, targeted organ system review, and verification of active drug therapy.';
  }

  if (abnormalLabsCount > 0) {
    underlyingContext += ` Alert: ${abnormalLabsCount} laboratory test(s) flagged outside reference range.`;
  }

  return {
    currentPresentation,
    underlyingContext,
    clinicalCorrelationSummary,
    keyActionItem,
  };
}
