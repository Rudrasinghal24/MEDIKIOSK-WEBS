import { MediKioskPayload, DepartmentType, DialogueMessage, UrgencyLevel } from '../types';

interface ConversationTurnResult {
  spokenPrompt: string;
  touchOptions: string[];
  updatedPayload: MediKioskPayload;
  redFlagDetected: boolean;
  alertReason: string | null;
  sessionComplete: boolean;
}

export function processConversationTurn(
  userInput: string,
  history: DialogueMessage[],
  currentPayload: MediKioskPayload,
  department: DepartmentType,
  languageCode: string
): ConversationTurnResult {
  const isHindi = languageCode.startsWith('hi');
  const isAyush = department === 'AYUSH';
  const cleanInput = userInput.trim().toLowerCase();

  // Make deep copy of payload to update
  const payload: MediKioskPayload = JSON.parse(JSON.stringify(currentPayload));
  let spokenPrompt = '';
  let touchOptions: string[] = [];
  let redFlagDetected = payload.triage?.red_flag_detected || false;
  let alertReason = payload.triage?.alert_reason || null;
  let sessionComplete = false;

  // Track conversation turns count for this topic
  const patientTurns = history.filter((m) => m.sender === 'patient').length;

  // 1. Check for Emergency Red Flags
  const isChestEmergency =
    cleanInput.includes('chest pain') ||
    cleanInput.includes('chaati me dard') ||
    cleanInput.includes('seene me dard') ||
    cleanInput.includes('heart attack') ||
    cleanInput.includes('left arm pain');

  const isSevereDyspnea =
    cleanInput.includes('saans nahi aa rahi') ||
    cleanInput.includes('cannot breathe') ||
    cleanInput.includes('severe breathless') ||
    cleanInput.includes('choking');

  if (isChestEmergency || isSevereDyspnea) {
    redFlagDetected = true;
    alertReason = isChestEmergency
      ? 'Suspected Acute Coronary Event / Critical Chest Pain'
      : 'Acute Respiratory Distress / Severe Hypoxia Risk';

    payload.triage = {
      red_flag_detected: true,
      urgency_level: 'Emergency' as UrgencyLevel,
      alert_reason: alertReason,
    };

    payload.clinical_data.chief_complaint = isChestEmergency
      ? 'Acute severe chest pain radiating with autonomic symptoms'
      : 'Acute severe dyspnea and respiratory distress';

    spokenPrompt = isHindi
      ? 'सावधानी! आपके लक्षणों में आपातकालीन संकेत हैं। कृपया शांत होकर बैठें, हमारी इमरजेंसी मेडिकल टीम को तुरंत सूचित किया जा रहा है।'
      : 'EMERGENCY ALERT: Your symptoms require urgent physician evaluation. Please stay seated; the emergency triage team has been alerted.';

    touchOptions = isHindi
      ? ['इमरजेंसी वार्ड दिखाएं', 'डॉक्टर से तुरंत मिलें', 'ऑक्सीजन सपोर्ट चाहिए', 'मैं ठीक महसूस कर रहा हूं']
      : ['View Emergency Pass', 'Immediate Doctor Review', 'Request Assistance', 'I am feeling stable now'];

    return {
      spokenPrompt,
      touchOptions,
      updatedPayload: payload,
      redFlagDetected: true,
      alertReason,
      sessionComplete: false,
    };
  }

  // 2. Identify clinical symptom cluster
  const isFever = cleanInput.includes('fever') || cleanInput.includes('bukhar') || cleanInput.includes('tap') || cleanInput.includes('temperature');
  const isCough = cleanInput.includes('cough') || cleanInput.includes('khasi') || cleanInput.includes('cold') || cleanInput.includes('sardi') || cleanInput.includes('gala');
  const isStomach = cleanInput.includes('stomach') || cleanInput.includes('pet') || cleanInput.includes('acidity') || cleanInput.includes('gas') || cleanInput.includes('pain') && cleanInput.includes('pet');
  const isJoint = cleanInput.includes('joint') || cleanInput.includes('ghutna') || cleanInput.includes('knee') || cleanInput.includes('kamar') || cleanInput.includes('back');
  const isHeadache = cleanInput.includes('headache') || cleanInput.includes('sar dard') || cleanInput.includes('sir dard') || cleanInput.includes('migraine');

  // If this is the first turn or setting chief complaint
  if (!payload.clinical_data.chief_complaint || patientTurns <= 1) {
    payload.clinical_data.chief_complaint = userInput;
    payload.clinical_data.history_of_present_illness = `Patient reported: "${userInput}".`;
  } else {
    payload.clinical_data.history_of_present_illness += ` Additional notes: ${userInput}.`;
  }

  // --- Dynamic Multi-Turn Follow-up Trees ---

  // FEVER TREE
  if (isFever || payload.clinical_data.chief_complaint.toLowerCase().includes('fever') || payload.clinical_data.chief_complaint.toLowerCase().includes('bukhar')) {
    if (patientTurns <= 1) {
      spokenPrompt = isHindi
        ? 'आपको बुखार कितने दिनों से है, और क्या आपने थर्मामीटर से तापमान नापा है?'
        : 'For how many days have you had the fever, and have you measured your temperature?';
      touchOptions = isHindi
        ? ['1-2 दिन से (हल्का बुखार)', '3-5 दिन से (तेज बुखार)', '1 हफ्ते से ज्यादा', 'तापमान 101°F से ज्यादा है']
        : ['1-2 days (Mild fever)', '3-5 days (High grade)', 'More than a week', 'Temperature over 101°F'];
    } else if (patientTurns === 2) {
      spokenPrompt = isHindi
        ? 'क्या बुखार के साथ कंपकंपी (ठंड लगना), सिर दर्द, शरीर में तेज दर्द या उल्टी की शिकायत है?'
        : 'Are you experiencing chills, shivering, severe headache, body aches, or vomiting with the fever?';
      touchOptions = isHindi
        ? ['हां, ठंड और कंपकंपी लगती है', 'तेज सिरदर्द और बदन दर्द है', 'उल्टी का मन हो रहा है', 'नहीं, केवल बुखार है']
        : ['Yes, chills and shivering', 'Severe body ache & headache', 'Nausea and vomiting', 'No other symptoms, just fever'];
    } else if (patientTurns === 3) {
      spokenPrompt = isHindi
        ? 'क्या आपने बुखार की कोई दवाई जैसे पैरासिटामोल (Dolo) ली है, और क्या उससे बुखार उतरा?'
        : 'Have you taken any medication like Paracetamol (Dolo), and did the temperature come down?';
      touchOptions = isHindi
        ? ['Dolo 650 ली, बुखार कुछ देर उतरा', 'कोई दवाई नहीं ली', 'दवाई लेने के बाद भी बुखार नहीं उतरा', 'डॉक्टर का पर्चा है']
        : ['Took Dolo 650, temporarily came down', 'No medication taken yet', 'Fever did not reduce with meds', 'I have an existing prescription'];
    } else {
      spokenPrompt = isHindi
        ? 'धन्यवाद। आपकी बीमारी की पूरी जानकारी दर्ज कर ली गई है। क्या आपके पास कोई पुराना पर्चा या रिपोर्ट है जिसे स्कैन करना चाहते हैं?'
        : 'Thank you. Your fever details have been noted. Would you like to upload past prescriptions or proceed to the summary?';
      touchOptions = isHindi
        ? ['पर्चा / रिपोर्ट अपलोड करें', 'सारांश रिपोर्ट देखें', 'डॉक्टर के पास भेजें', 'अन्य लक्षण बताएं']
        : ['Upload Prescriptions / Reports', 'View Summary Report', 'Send to Doctor', 'Add more symptoms'];
      sessionComplete = true;
    }
  }

  // COUGH & COLD TREE
  else if (isCough || payload.clinical_data.chief_complaint.toLowerCase().includes('cough') || payload.clinical_data.chief_complaint.toLowerCase().includes('khasi')) {
    if (patientTurns <= 1) {
      spokenPrompt = isHindi
        ? 'यह खांसी कितने दिनों से है? क्या यह सूखी खांसी है या बलगम (कफ) भी आ रहा है?'
        : 'How many days have you had this cough? Is it a dry cough or do you bring up phlegm/mucus?';
      touchOptions = isHindi
        ? ['2-3 दिन से सूखी खांसी', 'बलगम वाली खांसी (पीला/सफेद कफ)', '1 हफ्ते से ज्यादा से खांसी', 'गले में तेज खराश और दर्द']
        : ['Dry cough for 2-3 days', 'Wet cough with phlegm/mucus', 'Chronic cough >1 week', 'Severe sore throat & irritation'];
    } else if (patientTurns === 2) {
      spokenPrompt = isHindi
        ? 'क्या आपको सांस लेने में कोई तकलीफ, सीने में घरघराहट (wheezing) या भारीपन महसूस हो रहा है?'
        : 'Are you feeling any shortness of breath, wheezing sounds, or chest tightness when coughing?';
      touchOptions = isHindi
        ? ['हां, सांस लेने में जोर लगाना पड़ रहा है', 'सीने में भारीपन है', 'नहीं, सांस सामान्य है', 'रात में खांसी बढ़ जाती है']
        : ['Yes, mild difficulty breathing', 'Chest tightness / congestion', 'Breathing is normal', 'Cough worsens at night'];
    } else {
      spokenPrompt = isHindi
        ? 'खांसी के लक्षण नोट कर लिए गए हैं। क्या आप कोई कफ सिरप या एंटीबायोटिक ले रहे हैं?'
        : 'Respiratory symptoms recorded. Are you currently taking any cough syrup, inhalers, or antibiotics?';
      touchOptions = isHindi
        ? ['कफ सिरप ले रहा हूं', 'कोई दवा नहीं ली', 'पर्चा अपलोड करना है', 'समरी रिपोर्ट देखें']
        : ['Taking Cough Syrup', 'No medication yet', 'Upload Doctor Slip', 'View Summary Report'];
      sessionComplete = true;
    }
  }

  // STOMACH / ABDOMINAL PAIN / ACIDITY TREE
  else if (isStomach || payload.clinical_data.chief_complaint.toLowerCase().includes('pet') || payload.clinical_data.chief_complaint.toLowerCase().includes('stomach')) {
    if (patientTurns <= 1) {
      spokenPrompt = isHindi
        ? 'पेट में दर्द किस जगह है (नाभि के ऊपर, नीचे या एक तरफ)? और यह दर्द जलन जैसा है, मरोड़ वाला या भारीपन?'
        : 'Where in your stomach is the pain located (upper abdomen, lower, or to the side)? Is it burning, cramping, or dull?';
      touchOptions = isHindi
        ? ['सीने के नीचे पेट में जलन (Acidity)', 'नाभि के आसपास मरोड़ (Cramps)', 'पेट के निचले हिस्से में दर्द', 'खाना खाने के बाद भारीपन']
        : ['Upper stomach burning / Acidity', 'Cramping around navel', 'Lower abdominal pain', 'Fullness & gas after eating'];
    } else if (patientTurns === 2) {
      spokenPrompt = isHindi
        ? 'क्या आपको उल्टी, दस्त (loose motions), भूख न लगना या खट्टी डकारें आने की समस्या है?'
        : 'Have you had vomiting, loose stools, loss of appetite, or sour burps?';
      touchOptions = isHindi
        ? ['हां, खट्टी डकार और गैस है', 'दस्त (loose motion) भी है', 'उल्टी हुई थी', 'नहीं, सिर्फ पेट में दर्द है']
        : ['Sour burps and severe gas', 'Loose motions / diarrhea', 'Nausea / vomiting', 'No other issue, only pain'];
    } else {
      spokenPrompt = isHindi
        ? 'पेट की समस्या दर्ज हो गई है। क्या आप गैस की गोली जैसे Pantoprazole या कोई अन्य दवा लेते हैं?'
        : 'Abdominal findings noted. Do you take any antacids, Pantoprazole, or other medications regularly?';
      touchOptions = isHindi
        ? ['Pantocid / Pan-D लेता हूं', 'एंटासिड सिरप लिया', 'कोई दवा नहीं ली', 'रिपोर्ट्स अपलोड करें']
        : ['Taking Pantoprazole / Pan-D', 'Took antacid gel', 'No medicines', 'Upload Old Prescription'];
      sessionComplete = true;
    }
  }

  // JOINT PAIN / AYUSH SANDHIVATA
  else if (isJoint || (isAyush && cleanInput.includes('dard'))) {
    if (patientTurns <= 1) {
      spokenPrompt = isHindi
        ? 'किन जोड़ों में दर्द है (जैसे घुटनों, कमर, कंधों)? क्या सुबह उठने पर जोड़ों में अकड़न या सूजन रहती है?'
        : 'Which joints are affected (knees, lower back, fingers)? Is there swelling or morning stiffness?';
      touchOptions = isHindi
        ? ['दोनों घुटनों में दर्द (चलने पर बढ़ता है)', 'कमर और रीढ़ की हड्डी में दर्द', 'सुबह 30 मिनट जोड़ों में अकड़न', 'जोड़ों में सूजन और लाली']
        : ['Bilateral knee pain on walking', 'Lower back / spine ache', 'Morning joint stiffness >30 min', 'Visible swelling or warmth'];
    } else {
      spokenPrompt = isHindi
        ? isAyush
          ? 'आयुर्वेद अनुसार क्या आपको वात वृद्धि, गैस या पाचन में गड़बड़ी (अग्निमांद्य) की भी समस्या रहती है?'
          : 'क्या आप पहले से दर्द निवारक या कैल्शियम / विटामिन डी की गोलियां ले रहे हैं?'
        : isAyush
          ? 'Do you also experience digestive irregularities (Agnimandya) or bloating along with the joint pain?'
          : 'Are you currently taking any pain relievers, Calcium, or Vitamin D supplements?';
      touchOptions = isHindi
        ? ['हां, पाचन कमजोर है और गैस बनती है', 'पेन किलर लेता हूं', 'कोई दवा नहीं ली', 'समरी रिपोर्ट देखें']
        : ['Yes, impaired digestion & gas', 'Taking pain relievers', 'No prior treatment', 'View Summary Report'];
      sessionComplete = true;
    }
  }

  // GENERAL CLINICAL FALLBACK
  else {
    if (patientTurns <= 1) {
      spokenPrompt = isHindi
        ? 'यह समस्या कितने दिनों या हफ्तों से है? क्या किसी खास समय पर यह बढ़ जाती है?'
        : 'For how long have you been experiencing this? Does anything make it better or worse?';
      touchOptions = isHindi
        ? ['कुछ दिनों से है', '1-2 हफ्ते से', 'काफी समय से (क्रोनिक)', 'काम करने पर बढ़ जाता है']
        : ['Past few days', '1-2 weeks', 'Longstanding / Chronic', 'Worsens with physical exertion'];
    } else if (patientTurns === 2) {
      spokenPrompt = isHindi
        ? 'क्या आप शुगर (डायबिटीज), ब्लड प्रेशर, थायरॉइड या किसी अन्य बीमारी की नियमित दवाई लेते हैं?'
        : 'Do you regularly take medications for Diabetes, Blood Pressure, Thyroid, or any other condition?';
      touchOptions = isHindi
        ? ['शुगर और बीपी की दवा लेता हूं', 'थायरॉइड की दवा चलती है', 'कोई पुरानी बीमारी नहीं है', 'पर्चा अपलोड करना चाहता हूं']
        : ['Taking BP & Diabetes meds', 'On Thyroid medication', 'No chronic illness', 'I want to upload my prescription'];
    } else {
      spokenPrompt = isHindi
        ? 'बहुत अच्छा। आपकी प्राथमिक जानकारी पूरी हो गई है। आप अपनी रिपोर्ट अपलोड कर सकते हैं या समरी देख सकते हैं।'
        : 'Thank you. Your clinical history has been captured. You can now attach reports or view the physician summary.';
      touchOptions = isHindi
        ? ['पर्चा / रिपोर्ट अपलोड करें', 'सारांश रिपोर्ट देखें', 'डॉक्टर के पास भेजें']
        : ['Upload Prescriptions', 'View Patient Summary', 'Handoff to Doctor'];
      sessionComplete = true;
    }
  }

  payload.interaction_output = {
    spoken_prompt: spokenPrompt,
    touch_options: touchOptions,
  };

  payload.system_state.session_complete = sessionComplete;

  return {
    spokenPrompt,
    touchOptions,
    updatedPayload: payload,
    redFlagDetected,
    alertReason,
    sessionComplete,
  };
}
