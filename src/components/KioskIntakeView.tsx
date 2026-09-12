import { useState, useEffect, useRef } from 'react';
import { MediKioskPayload, DepartmentType, AbhaProfile, LanguageOption, DialogueMessage } from '../types';
import { speakPrompt, stopSpeaking, createSpeechRecognizer } from '../utils/speechUtils';
import { processConversationTurn } from '../utils/conversationTree';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Languages,
  User,
  Camera,
  Upload,
  Sparkles,
  ArrowRight,
  Bot,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface KioskIntakeViewProps {
  payload: MediKioskPayload;
  onSendInput: (input: string) => Promise<void>;
  isLoading: boolean;
  department: DepartmentType;
  onCompleteIntake: () => void;
  onOpenOcr: () => void;
  patientProfile?: AbhaProfile | null;
  selectedLanguage: LanguageOption;
  onChangeLanguage?: () => void;
  sarvamKey?: string;
  conversationHistory?: DialogueMessage[];
  onUpdateHistory?: (newHistory: DialogueMessage[]) => void;
  onUpdatePayload?: (updatedPayload: MediKioskPayload) => void;
}

export default function KioskIntakeView({
  payload,
  onSendInput,
  isLoading: parentLoading,
  department,
  onCompleteIntake,
  onOpenOcr,
  patientProfile,
  selectedLanguage,
  onChangeLanguage,
  sarvamKey,
  conversationHistory = [],
  onUpdateHistory,
  onUpdatePayload,
}: KioskIntakeViewProps) {
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [audioAutoPlay, setAudioAutoPlay] = useState(true);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isAyush = department === 'AYUSH';

  // Initial welcome message if conversation is empty
  const [messages, setMessages] = useState<DialogueMessage[]>(() => {
    if (conversationHistory.length > 0) return conversationHistory;
    const greetingText =
      selectedLanguage.code.startsWith('hi')
        ? 'नमस्ते! आप अस्पताल ओपीडी कियोस्क में हैं। आज आपको क्या स्वास्थ्य समस्या या तकलीफ है? कृपया बोलकर या लिखकर बताएं।'
        : 'Hello and welcome to the Hospital OPD Kiosk! What primary symptoms or health concerns bring you in today? Please speak or type your symptoms.';

    const initialTouch = isAyush
      ? selectedLanguage.code.startsWith('hi')
        ? ['जोड़ों में दर्द व अकड़न', 'पाचन में गड़बड़ी व गैस', 'कमजोरी व थकान', 'सिर में तेज दर्द']
        : ['Joint Pain & Stiffness', 'Digestive Impairment & Gas', 'Chronic Fatigue', 'Severe Headache']
      : selectedLanguage.code.startsWith('hi')
        ? ['मुझे 3 दिन से तेज बुखार है', 'खांसी और गले में खराश है', 'पेट में तेज दर्द और गैस है', 'सीने में भारीपन व दर्द है']
        : ['I have a fever for 3 days', 'Persistent cough & cold', 'Severe stomach pain & acidity', 'Chest tightness & pain'];

    return [
      {
        id: 'msg_welcome',
        sender: 'kiosk',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        touchOptions: initialTouch,
      },
    ];
  });

  // Keep parent in sync
  useEffect(() => {
    if (onUpdateHistory && messages.length > 0) {
      onUpdateHistory(messages);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLocalProcessing]);

  // Autoplay TTS for the latest kiosk prompt if auto-play is enabled
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'kiosk' && audioAutoPlay) {
      playAudio(lastMsg.text, lastMsg.id);
    }
    return () => {
      stopSpeaking();
    };
  }, [messages.length, audioAutoPlay]);

  const playAudio = (text: string, msgId?: string) => {
    try {
      stopSpeaking();
      setIsSpeaking(true);
      if (msgId) setSpeakingMessageId(msgId);
      speakPrompt(
        text,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        selectedLanguage.code,
        sarvamKey
      ).catch(() => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      });
    } catch {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const toggleSpeech = (text: string, msgId: string) => {
    if (isSpeaking && speakingMessageId === msgId) {
      stopSpeaking();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    } else {
      playAudio(text, msgId);
    }
  };

  // Speech Recognition (Voice Input)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (transcript: string) => {
        if (transcript.trim()) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      },
      (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      selectedLanguage.code
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start failed:', e);
        setIsListening(false);
      }
    } else {
      // Fallback text if browser speech API is unavailable
      setInputText(
        selectedLanguage.code.startsWith('hi')
          ? 'मुझे 3 दिन से तेज बुखार और कंपकंपी है'
          : 'I have a high fever with chills since 3 days'
      );
    }
  };

  // Two-Way Dynamic Multi-Turn Intake Handler
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLocalProcessing) return;

    // 1. Append Patient Message
    const userMsg: DialogueMessage = {
      id: `patient_${Date.now()}`,
      sender: 'patient',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLocalProcessing(true);

    // Also notify parent if necessary
    onSendInput(trimmed).catch(() => {});

    // 2. Process dynamically through local conversational tree engine
    setTimeout(() => {
      const turnResult = processConversationTurn(
        trimmed,
        newHistory,
        payload,
        department,
        selectedLanguage.code
      );

      // 3. Append Assistant Message with Dynamic Follow-up Prompt & Quick Chips
      const kioskMsg: DialogueMessage = {
        id: `kiosk_${Date.now()}`,
        sender: 'kiosk',
        text: turnResult.spokenPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        touchOptions: turnResult.touchOptions,
        redFlag: turnResult.redFlagDetected,
      };

      setMessages([...newHistory, kioskMsg]);
      setIsLocalProcessing(false);

      // Update payload state in parent
      if (onUpdatePayload) {
        onUpdatePayload(turnResult.updatedPayload);
      }
    }, 450);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleResetChat = () => {
    const greetingText = selectedLanguage.code.startsWith('hi')
      ? 'नमस्ते! आप अस्पताल ओपीडी कियोस्क में हैं। आज आपको क्या स्वास्थ्य समस्या या तकलीफ है? कृपया बोलकर या लिखकर बताएं।'
      : 'Hello and welcome to the Hospital OPD Kiosk! What primary symptoms or health concerns bring you in today? Please speak or type your symptoms.';

    const initialTouch = selectedLanguage.code.startsWith('hi')
      ? ['मुझे 3 दिन से तेज बुखार है', 'खांसी और गले में खराश है', 'पेट में तेज दर्द और गैस है', 'सीने में भारीपन व दर्द है']
      : ['I have a fever for 3 days', 'Persistent cough & cold', 'Severe stomach pain & acidity', 'Chest tightness & pain'];

    setMessages([
      {
        id: `msg_${Date.now()}`,
        sender: 'kiosk',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        touchOptions: initialTouch,
      },
    ]);
  };

  // Get touch options from the very latest kiosk message
  const lastKioskMessage = [...messages].reverse().find((m) => m.sender === 'kiosk');
  const activeTouchOptions = lastKioskMessage?.touchOptions || [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Patient Profile & Language Status Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Patient Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
            {patientProfile?.name ? patientProfile.name.charAt(0) : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {patientProfile?.name || 'Walk-in Patient'}
              </span>
              {patientProfile?.is_verified ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ABHA Verified
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                  Walk-in OPD
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {patientProfile?.abha_id || 'ID: GUEST-OPD'} • {patientProfile?.age || 35} yrs • {department} OPD
            </div>
          </div>
        </div>

        {/* Right: Audio Controls, Reset, Language */}
        <div className="flex items-center gap-2 flex-wrap">
          {onChangeLanguage && (
            <button
              type="button"
              onClick={onChangeLanguage}
              className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedLanguage.nativeName}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <label className="text-[11px] text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={audioAutoPlay}
                onChange={(e) => setAudioAutoPlay(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 scale-90 cursor-pointer"
              />
              <span>Voice Audio</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            title="Restart Intake Conversation"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Way Chat Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[560px]">
        {/* Chat Stream Header */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Two-Way Clinical Intake Dialogue
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Multi-turn symptom history &amp; triage
          </span>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isKiosk = msg.sender === 'kiosk';
            const isCurrentlySpeaking = isSpeaking && speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isKiosk ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                    isKiosk
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isKiosk ? <Bot className="w-5 h-5" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1.5 max-w-full">
                  <div
                    className={`rounded-2xl p-4 text-sm sm:text-base leading-relaxed shadow-xs ${
                      isKiosk
                        ? msg.redFlag
                          ? 'bg-rose-50 text-rose-950 border border-rose-300 font-medium'
                          : 'bg-slate-50 text-slate-900 border border-slate-200'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Audio Play Button for Kiosk Bubbles */}
                    {isKiosk && (
                      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => toggleSpeech(msg.text, msg.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                            isCurrentlySpeaking
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isCurrentlySpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                      </div>
                    )}
                  </div>

                  {!isKiosk && (
                    <div className="text-[10px] text-slate-400 text-right font-mono pr-1">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLocalProcessing && (
            <div className="flex gap-3 items-center mr-auto">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-medium">Assistant is formulating clinical follow-up...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Dynamic Follow-up Quick Chips */}
        {activeTouchOptions.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Quick Touch Responses (Tap to reply):</span>
              <span className="text-[10px] text-slate-400">Tap or speak</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTouchOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  disabled={isLocalProcessing}
                  className="bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <span>{opt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice & Text Input Form */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 space-y-2">
          {isListening && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700 font-bold animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>Microphone active... Speak your symptoms in {selectedLanguage.englishName}</span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="bg-red-600 text-white px-2 py-0.5 rounded text-[11px] cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-red-600 text-white border-red-600 shadow-md animate-bounce'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title={isListening ? 'Stop Voice Recording' : 'Speak using Microphone'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input text */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : `Type your symptoms (e.g. "I have a fever", "Pet me tez dard hai")`
              }
              disabled={isLocalProcessing}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-xs"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLocalProcessing || !inputText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Auxiliary Workflow Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Real-time Triage &amp; Clinical Extraction Active</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenOcr}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Prescriptions (PDF / JPG)</span>
          </button>

          <button
            type="button"
            onClick={onCompleteIntake}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Patient Summary Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
