import { InferredCondition, Medication, ClinicalData, DepartmentType } from '../types';

interface InferenceInput {
  clinicalData: ClinicalData;
  conversationText: string;
  medications: Medication[];
  department?: DepartmentType;
}

export function inferClinicalConditions({
  clinicalData,
  conversationText,
  medications,
  department = 'Allopathic',
}: InferenceInput): InferredCondition[] {
  const conditions: InferredCondition[] = [];
  const text = `${clinicalData.chief_complaint} ${clinicalData.history_of_present_illness} ${conversationText}`.toLowerCase();
  const medNames = (medications || []).map((m) => m.drug_name.toLowerCase()).join(' ');

  // Helper to check keywords
  const has = (...keywords: string[]) => keywords.some((kw) => text.includes(kw.toLowerCase()));
  const hasMed = (...names: string[]) => names.some((n) => medNames.includes(n.toLowerCase()));

  // 1. Cardiovascular / Acute Coronary Syndrome (RED FLAG)
  if (
    (has('chest pain', 'chaati me dard', 'seene me dard', 'pressure in chest', 'tightness in chest') &&
      (has('left arm', 'jaw', 'sweat', 'breath', 'shortness', 'ghabrahat', 'chakkar'))) ||
    has('heart attack', 'angina', 'myocardial')
  ) {
    conditions.push({
      id: 'inf_acs',
      condition: 'Acute Coronary Syndrome (ACS) / Angina Pectoris Rule-Out',
      category: 'Cardiovascular',
      confidence: 'High',
      evidence: [
        'Reported retrosternal/chest discomfort radiating or with autonomic symptoms (sweating/dyspnea)',
        'Immediate emergency evaluation indicated',
      ],
      suggestedAction: 'Immediate 12-lead ECG, Troponin I/T stat, establish IV access, Vital Signs monitor',
      isRedFlag: true,
    });
  }

  // 2. Acute Febrile Illness / Possible Viral / Dengue / Malaria
  if (has('fever', 'bukhar', 'tap', 'chills', 'shivering', 'kapkapi')) {
    const isProlonged = has('4 days', '5 days', 'week', 'hafta', 'char din', 'paanch din');
    const hasRashOrBleeding = has('rash', 'bleed', 'red spots', 'daane');

    conditions.push({
      id: 'inf_fever',
      condition: isProlonged
        ? 'Prolonged Acute Febrile Illness (Suspected Dengue / Typhoid / Malaria)'
        : 'Acute Febrile Illness (Suspected Viral Pyrexia)',
      category: 'Infectious Disease',
      confidence: 'High',
      evidence: [
        `Patient reports febrile episode ${isProlonged ? 'persisting >3-4 days' : 'with acute onset'}`,
        has('chills', 'shivering') ? 'Accompanied by chills and shivering' : 'Associated body aches and weakness',
        hasRashOrBleeding ? 'Skin rash/petechiae reported (Platelet watch)' : '',
      ].filter(Boolean),
      suggestedAction: 'Order Complete Blood Count (CBC with Platelets), Peripheral Smear for MP, Dengue NS1/IgM, Widal/TyphiDot',
      isRedFlag: hasRashOrBleeding,
    });
  }

  // 3. Acute Respiratory Infection (URTI / Bronchitis / Pneumonia)
  if (has('cough', 'khasi', 'cold', 'sardi', 'gale me dard', 'sore throat', 'phlegm', 'balgam')) {
    const hasDyspnea = has('breathless', 'saans lene me dikkat', 'wheez', 'shortness of breath', 'chest congestion');

    conditions.push({
      id: 'inf_urti',
      condition: hasDyspnea
        ? 'Lower Respiratory Tract Infection (LRTI) / Acute Bronchitis'
        : 'Acute Upper Respiratory Tract Infection (URTI / Rhinopharyngitis)',
      category: 'Pulmonology',
      confidence: 'High',
      evidence: [
        'History of cough and rhinorrhea / throat irritation',
        hasDyspnea ? 'Patient notes shortness of breath or audible wheeze' : 'Mild-to-moderate upper airway involvement',
      ],
      suggestedAction: hasDyspnea
        ? 'Chest X-Ray PA view, SpO2 pulse oximetry, peak flow measurement'
        : 'Symptomatic decongestant, steam inhalation, warm saline gargles',
      isRedFlag: hasDyspnea,
    });
  }

  // 4. Acid Peptic Disease (GERD / Gastritis / Dyspepsia)
  if (
    has('stomach pain', 'pet dard', 'pet me dard', 'gas', 'acidity', 'jalan', 'heartburn', 'ulcer', 'bloating', 'khatti dakar') ||
    hasMed('pantoprazole', 'pan-d', 'omeprazole', 'rabeprazole', 'gelusil', 'antacid')
  ) {
    conditions.push({
      id: 'inf_gerd',
      condition: 'Gastroesophageal Reflux Disease (GERD) / Acute Gastritis',
      category: 'Gastroenterology',
      confidence: hasMed('pantoprazole', 'pan-d', 'omeprazole') ? 'High' : 'Moderate',
      evidence: [
        'Epigastric discomfort, acid regurgitation, or post-prandial abdominal fullness',
        hasMed('pantoprazole', 'omeprazole', 'rabeprazole')
          ? 'Currently on Proton Pump Inhibitor (PPI) therapy'
          : 'Symptom cluster consistent with acid-peptic disease',
      ],
      suggestedAction: 'Dietary counseling, avoidance of spicy/fried foods, continue PPI 30 mins before breakfast, test for H. pylori if chronic',
    });
  }

  // 5. Acute Gastroenteritis / Diarrhea
  if (has('loose motion', 'dast', 'diarrhea', 'vomit', 'ulti', 'cramps', 'marod')) {
    conditions.push({
      id: 'inf_ge',
      condition: 'Acute Gastroenteritis / Infectious Enteritis',
      category: 'Gastroenterology',
      confidence: 'High',
      evidence: [
        'Episodes of loose watery stools and/or nausea and vomiting',
        'Risk of fluid and electrolyte depletion',
      ],
      suggestedAction: 'Oral Rehydration Solution (ORS) aggressively, zinc supplementation, check hydration status, stool routine if persisting',
    });
  }

  // 6. Type 2 Diabetes Mellitus (from medications or symptoms)
  if (
    hasMed('metformin', 'glycomet', 'glimepiride', 'amaryl', 'sitagliptin', 'januvia', 'dapagliflozin', 'insulin') ||
    has('sugar', 'diabetes', 'madhumeh', 'polyuria', 'frequent urination', 'bar bar peshab')
  ) {
    conditions.push({
      id: 'inf_t2d',
      condition: 'Type 2 Diabetes Mellitus (Under Pharmacotherapy)',
      category: 'Endocrinology & Metabolic',
      confidence: 'High',
      evidence: [
        hasMed('metformin', 'glimepiride', 'sitagliptin', 'insulin')
          ? 'Active anti-diabetic pharmacotherapy identified from prescription'
          : 'Patient reported history of elevated blood glucose / diabetic symptoms',
      ],
      suggestedAction: 'Order Fasting & Post-Prandial Blood Sugar (FBS/PPBS), HbA1c, Serum Creatinine, Urine microalbumin',
    });
  }

  // 7. Systemic Arterial Hypertension
  if (
    hasMed('telmisartan', 'telma', 'amlodipine', 'stamlo', 'atenolol', 'losartan', 'enalapril') ||
    has('bp', 'blood pressure', 'high bp', 'hypertension', 'uchh raktchap')
  ) {
    conditions.push({
      id: 'inf_htn',
      condition: 'Essential Systemic Hypertension',
      category: 'Cardiovascular',
      confidence: 'High',
      evidence: [
        hasMed('telmisartan', 'amlodipine', 'losartan')
          ? 'Active anti-hypertensive medication regimen in uploaded record'
          : 'History of elevated systolic/diastolic blood pressure',
      ],
      suggestedAction: 'Record bilateral seated BP, Fundoscopy review, Lipid profile, Renal Function Test (RFT)',
    });
  }

  // 8. Osteoarthritis / Musculoskeletal Arthropathy / AYUSH Sandhivata
  if (
    has('joint pain', 'ghutno me dard', 'karan', 'knee pain', 'back pain', 'kamar dard', 'gathiya', 'swelling', 'stiffness', 'sujan') ||
    hasMed('yograj', 'shallaki', 'guggulu', 'rumalaya', 'diclofenac', 'aceclofenac')
  ) {
    const isAyushDept = department === 'AYUSH';
    conditions.push({
      id: 'inf_oa',
      condition: isAyushDept
        ? 'Sandhivata (Osteoarthritis) / Vata Prakopa'
        : 'Osteoarthritis (Bilateral/Peripheral Joints) / Chronic Arthralgia',
      category: isAyushDept ? 'AYUSH (Ayurveda)' : 'Rheumatology & Orthopedics',
      confidence: 'High',
      evidence: [
        'Weight-bearing joint pain exacerbated by activity or stiffness',
        isAyushDept ? 'Clinical presentation aligns with Vata accumulation in Asthi-Majja Dhatu' : 'Consistent with degenerative joint wear',
      ],
      suggestedAction: isAyushDept
        ? 'Advise Snehana (Janu Basti / Mahanarayan taila), Janu Dhara, Yograj Guggulu'
        : 'Weight-bearing X-ray of affected joints, Serum Uric Acid, Calcium & Vitamin D3 levels',
    });
  }

  // 9. Hypothyroidism
  if (
    hasMed('thyroxine', 'eltroxin', 'thyronorm', 'levothyroxine') ||
    has('thyroid', 'hypothyroid', 'weight gain', 'cold intolerance')
  ) {
    conditions.push({
      id: 'inf_thyroid',
      condition: 'Primary Hypothyroidism (On Hormone Replacement)',
      category: 'Endocrinology & Metabolic',
      confidence: 'High',
      evidence: ['Thyroxine sodium hormone replacement identified on prescription record'],
      suggestedAction: 'Order fasting Serum TSH, Free T3, Free T4 to assess dosage titration',
    });
  }

  // 10. Bronchial Asthma / Allergic Rhinitis
  if (
    hasMed('montelukast', 'montair', 'levocetirizine', 'budecort', 'foracort', 'asthalin', 'salbutamol') ||
    has('asthma', 'dama', 'allergy', 'sneezing', 'chheenke', 'wheeze')
  ) {
    conditions.push({
      id: 'inf_asthma',
      condition: 'Bronchial Asthma / Chronic Allergic Airway Disease',
      category: 'Pulmonology',
      confidence: 'High',
      evidence: [
        hasMed('budecort', 'foracort', 'asthalin')
          ? 'Inhaled corticosteroid / bronchodilator therapy present in patient slip'
          : 'Patient notes reactive airway symptoms and allergic triggers',
      ],
      suggestedAction: 'Spirometry (PFT), instruct on MDI spacer technique, identify seasonal/dust triggers',
    });
  }

  // 11. Migraine / Tension Headache
  if (has('headache', 'sar dard', 'sir dard', 'aadhe sar me dard', 'migraine', 'throbbing')) {
    conditions.push({
      id: 'inf_headache',
      condition: has('aadhe sar', 'vomit', 'light', 'sound') ? 'Migraine without/with Aura' : 'Tension-Type Cephalea',
      category: 'Neurology',
      confidence: 'Moderate',
      evidence: ['Recurrent or acute throbbing cranial ache with photophobia or cranial tenderness'],
      suggestedAction: 'Screen for red-flag triggers, monitor BP, prescribe acute abortive therapy (NSAID/Triptan)',
    });
  }

  // 12. AYUSH Digestive Disorder (Agnimandya / Amlapitta)
  if (department === 'AYUSH' && has('gas', 'jalan', 'pet', 'digestion', 'bhukh', 'appetite', 'constipation', 'kabz')) {
    conditions.push({
      id: 'inf_ayush_agni',
      condition: 'Agnimandya (Weak Digestive Fire) / Amlapitta (Hyperacidity)',
      category: 'AYUSH (Ayurveda)',
      confidence: 'High',
      evidence: [
        'Impaired Jatharagni causing Ama accumulation and acid reflux',
        'Reported dietary irregularities (Ahara-Vihara Dushti)',
      ],
      suggestedAction: 'Deepana-Pachana therapy (Trikatu/Pachanamrita), Avipattikar Churna, warm water regimen',
    });
  }

  // If no specific match, create a general OPD clinical impression
  if (conditions.length === 0 && clinicalData.chief_complaint) {
    conditions.push({
      id: 'inf_general',
      condition: `Clinical Evaluation: ${clinicalData.chief_complaint}`,
      category: 'General Medicine',
      confidence: 'Moderate',
      evidence: [`Patient presenting with: ${clinicalData.chief_complaint}`],
      suggestedAction: 'Comprehensive physical examination, baseline vital signs recording, CBC and metabolic panel',
    });
  }

  return conditions;
}
