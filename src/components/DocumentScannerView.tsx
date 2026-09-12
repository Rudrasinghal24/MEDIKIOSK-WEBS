import { useState, useEffect, useRef } from 'react';
import { MediKioskPayload, DepartmentType, AbhaProfile, ScannedDocument } from '../types';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';
import { speakPrompt, stopSpeaking } from '../utils/speechUtils';
import { enhanceDocumentImage } from '../utils/imageEnhancement';
import {
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  Pill,
  Activity,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Cpu,
  Layers,
  KeyRound,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  AlignLeft,
  SwitchCamera,
  Plus,
  Trash2,
  FileType,
  Stethoscope,
} from 'lucide-react';

interface DocumentScannerViewProps {
  payload: MediKioskPayload;
  onScanDocument: (imageBase64: string, docType: string, mimeType: string) => Promise<void>;
  isLoading: boolean;
  department: DepartmentType;
  onBackToIntake: () => void;
  onOpenKeyModal?: () => void;
  sarvamKey?: string;
  ocrError?: string | null;
  onClearError?: () => void;
  patientProfile?: AbhaProfile | null;
  onRouteToDoctorSummary?: () => void;
}

export default function DocumentScannerView({
  payload,
  onScanDocument,
  isLoading,
  department,
  onBackToIntake,
  onOpenKeyModal,
  sarvamKey,
  ocrError,
  onClearError,
  patientProfile,
  onRouteToDoctorSummary,
}: DocumentScannerViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [docType, setDocType] = useState('Prescription');
  const [imageMime, setImageMime] = useState('image/png');
  const [fileName, setFileName] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Multi-document queue
  const [documentQueue, setDocumentQueue] = useState<ScannedDocument[]>([]);
  const [activeQueueIndex, setActiveQueueIndex] = useState<number>(0);

  const extractedData = payload.extracted_document_data;
  const medications =
    extractedData?.extracted_medications && extractedData.extracted_medications.length > 0
      ? extractedData.extracted_medications
      : payload.clinical_data.medications || [];
  const abnormalLabs = extractedData?.abnormal_labs || [];
  const auditReport = extractedData?.audit_report;

  // Clean up audio and camera when leaving view
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopCamera();
    };
  }, []);

  // Simulate phased progress during OCR loading
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingPhase(1);
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Start web camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Video play error:', playErr);
        });
      }
    } catch (err: any) {
      console.warn('Camera access denied or error:', err);
      setCameraError(
        'Camera permission was denied or camera is not available on this device. You can still use "Upload File".'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const name = `Camera_Slip_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(':', '')}.jpg`;
      
      setSelectedImage(dataUrl);
      setImageMime('image/jpeg');
      setFileName(name);

      const newDoc: ScannedDocument = {
        id: `doc_${Date.now()}`,
        name,
        type: 'image/jpeg',
        base64Data: dataUrl,
        documentCategory: docType as any,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDocumentQueue((prev) => [...prev, newDoc]);
      setActiveQueueIndex(documentQueue.length);
      stopCamera();
    }
  };

  // Client-side downscaling for images to prevent large payloads
  const optimizeImage = async (file: File): Promise<{ base64: string; mime: string }> => {
    if (file.type.includes('svg') || file.type.includes('pdf')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mime: file.type || 'application/pdf' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            enhanceDocumentImage(optimized, { mode: 'auto_contrast' })
              .then((enhanced) => resolve({ base64: enhanced.dataUrl, mime: 'image/jpeg' }))
              .catch(() => resolve({ base64: optimized, mime: 'image/jpeg' }));
            return;
          }
          resolve({ base64: rawDataUrl, mime: file.type || 'image/jpeg' });
        };
        img.onerror = () => resolve({ base64: rawDataUrl, mime: file.type || 'image/jpeg' });
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (onClearError) onClearError();
    setFileName(file.name);
    setIsOptimizing(true);
    try {
      const { base64, mime } = await optimizeImage(file);
      setSelectedImage(base64);
      setImageMime(mime);

      const newDoc: ScannedDocument = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: mime,
        base64Data: base64,
        documentCategory: docType as any,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDocumentQueue((prev) => [...prev, newDoc]);
      setActiveQueueIndex(documentQueue.length);
    } catch (e) {
      console.warn('File processing error:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((f) => processFile(f));
  };

  const triggerUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((f) => processFile(f));
    }
  };

  const handleSelectQueuedDoc = (index: number) => {
    const doc = documentQueue[index];
    if (doc) {
      setSelectedImage(doc.base64Data);
      setImageMime(doc.type);
      setFileName(doc.name);
      setActiveQueueIndex(index);
    }
  };

  const handleRemoveDoc = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documentQueue.filter((_, i) => i !== index);
    setDocumentQueue(updated);
    if (updated.length > 0) {
      const nextIdx = Math.max(0, index - 1);
      setSelectedImage(updated[nextIdx].base64Data);
      setImageMime(updated[nextIdx].type);
      setFileName(updated[nextIdx].name);
      setActiveQueueIndex(nextIdx);
    } else {
      setSelectedImage(null);
      setFileName('');
    }
  };

  const handleResetImage = () => {
    setSelectedImage(null);
    setFileName('');
    if (onClearError) onClearError();
  };

  const loadSampleDoc = (scenarioId: string) => {
    if (onClearError) onClearError();
    const scenario = SAMPLE_SCENARIOS.find(
      (s) => s.id === scenarioId || (scenarioId === 'handwritten_prescription_ocr' && s.id === 'diabetic_slip_ocr')
    );
    if (scenario?.documentSample) {
      setSelectedImage(scenario.documentSample.base64Data);
      setFileName(scenario.documentSample.name);
      setImageMime(scenario.documentSample.type);
      const cat = scenario.id === 'lab_report_ocr' ? 'Lab Report' : 'Prescription';
      setDocType(cat);

      const newDoc: ScannedDocument = {
        id: `sample_${scenario.id}`,
        name: scenario.documentSample.name,
        type: scenario.documentSample.type,
        base64Data: scenario.documentSample.base64Data,
        documentCategory: cat,
        timestamp: 'Preloaded Sample',
      };
      setDocumentQueue([newDoc]);
      setActiveQueueIndex(0);
    }
  };

  const handleRunOcr = () => {
    if (!selectedImage || isLoading) return;
    if (onClearError) onClearError();
    onScanDocument(selectedImage, docType, imageMime);
  };

  const handleSpeakMedications = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (medications.length === 0) return;

    const medListText = medications
      .map(
        (m, idx) =>
          `Dawai number ${idx + 1}: ${m.drug_name}, khuraak ${m.dosage}, lene ka tarika ${m.frequency}.`
      )
      .join(' ');

    const fullSpeech = `Aapke parchi se nikaali gayi dawaiyan: ${medListText}. Kripya doctor se mil kar confirms karein.`;

    setIsSpeaking(true);
    speakPrompt(
      fullSpeech,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      'hi-IN',
      sarvamKey
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToIntake}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 mb-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Symptom Intake
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Medical Document Capture &amp; Multimodal OCR
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live camera snapshot &amp; PDF/Image document processing. Character-by-character visual reading extracts cursive prescriptions and laboratory values.
          </p>
        </div>

        {/* Patient / Doctor Summary Fast Route */}
        <div className="flex items-center gap-2 flex-wrap">
          {onRouteToDoctorSummary && (
            <button
              type="button"
              onClick={onRouteToDoctorSummary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor's Dashboard</span>
            </button>
          )}

          {onOpenKeyModal && (
            <button
              type="button"
              onClick={onOpenKeyModal}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Stack Setup</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Upload & Camera (Left) + Extracted Findings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Two Distinct Action Buttons (Camera & Upload) + Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* Header: Document Category Selection */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Document Category:</span>
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                {['Prescription', 'Lab Report', 'Discharge Summary'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDocType(type)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      docType === type
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirement 4: TWO DISTINCT UI BUTTONS */}
            <div className="grid grid-cols-2 gap-3">
              {/* Button 1: Capture via Camera */}
              <button
                type="button"
                onClick={startCamera}
                className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span>Capture via Camera</span>
                <span className="text-[10px] font-normal text-blue-100">Live Viewfinder</span>
              </button>

              {/* Button 2: Upload File (Images + PDFs) */}
              <button
                type="button"
                onClick={triggerUploadClick}
                className="p-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-800 rounded-2xl font-bold text-xs sm:text-sm shadow-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Upload File</span>
                <span className="text-[10px] font-normal text-slate-400">Images &amp; PDFs</span>
              </button>

              {/* Hidden File Input for PDF and Image uploads */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Live Camera Viewfinder Modal / Inline View */}
            {isCameraActive && (
              <div className="bg-slate-950 rounded-2xl p-3 text-white space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-400 animate-pulse" />
                    Live Camera Feed (Align slip inside guide)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      title="Flip camera"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900 text-slate-200 rounded-lg text-xs cursor-pointer"
                      title="Close camera"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Framing Box */}
                  <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between text-[10px] font-mono text-white/70">
                      <span>┌ TOP LEFT</span>
                      <span>TOP RIGHT ┐</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-white/70">
                      <span>└ BOTTOM LEFT</span>
                      <span>BOTTOM RIGHT ┘</span>
                    </div>
                  </div>
                </div>

                {/* Shutter Button */}
                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-14 h-14 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 shadow-lg transition-transform flex items-center justify-center cursor-pointer"
                    title="Take Snapshot"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20" />
                  </button>
                </div>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerUploadClick}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-400/30'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="p-2 bg-white rounded-xl text-blue-600 border border-slate-200 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {isDragging ? 'Drop document here' : 'Click or drop PDF / Image slips'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts PDF files, JPEG, PNG, WEBP prescriptions
                </p>
              </div>
            </div>

            {/* Multi-Document Queue Display */}
            {documentQueue.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Queued Documents ({documentQueue.length}):</span>
                  <span className="text-[11px] text-slate-400">Click to select active slip</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {documentQueue.map((doc, idx) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectQueuedDoc(idx)}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                        activeQueueIndex === idx
                          ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {doc.type.includes('pdf') ? (
                        <FileType className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <div className="max-w-[120px] truncate">{doc.name}</div>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveDoc(idx, e)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Selected Document Preview */}
            {selectedImage && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2.5 space-y-2">
                <div className="flex items-center justify-between px-1 text-xs text-slate-600">
                  <span className="font-semibold flex items-center gap-1.5 truncate">
                    {imageMime.includes('pdf') ? (
                      <FileType className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    {fileName || 'Document Ready'}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="text-xs text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                {imageMime.includes('pdf') ? (
                  <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <FileType className="w-10 h-10 text-rose-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-800">PDF Clinical Report Loaded</div>
                    <div className="text-[11px] text-slate-400">
                      Gemini Multimodal Vision will natively extract all text and tables from this PDF.
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[220px] overflow-auto rounded-xl border border-slate-200 bg-white">
                    <img src={selectedImage} alt="Document Slip" className="w-full object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* OCR Error Notice */}
            {ocrError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{ocrError}</span>
                </div>
                {onClearError && (
                  <button type="button" onClick={onClearError} className="cursor-pointer text-rose-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* OCR Execution Button */}
            <button
              type="button"
              onClick={handleRunOcr}
              disabled={!selectedImage || isLoading || isOptimizing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Document OCR with Gemini Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Clinical Data via Multimodal Vision</span>
                </>
              )}
            </button>

            {/* Sample Indian Doctor Scenarios */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Or Load Pre-configured OPD Samples:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleDoc('diabetic_slip_ocr')}
                  className="text-left p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-slate-800">Cursive OPD Slip</div>
                  <div className="text-[10px] text-slate-400">Metformin, Telma 40</div>
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleDoc('lab_report_ocr')}
                  className="text-left p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition-colors cursor-pointer"
                >
                  <div className="font-bold text-slate-800">Diagnostic Report</div>
                  <div className="text-[10px] text-slate-400">FBS 186, HbA1c 8.6%</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Consolidated Clinical Findings & Doctor Summary Route */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Extracted Findings ({medications.length} Meds, {abnormalLabs.length} Labs)
                </h3>
              </div>
              {medications.length > 0 && (
                <button
                  type="button"
                  onClick={handleSpeakMedications}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Speak Meds'}</span>
                </button>
              )}
            </div>

            {/* Prescribed Medications Card */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Prescribed Medications:
              </span>
              {medications.length > 0 ? (
                <div className="space-y-2">
                  {medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{med.drug_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {med.dosage} • {med.frequency} {med.duration ? `• ${med.duration}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                        Extracted
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No prescription extracted yet. Capture or upload a slip to process.
                </div>
              )}
            </div>

            {/* Abnormal Labs Card */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Laboratory Findings:
              </span>
              {abnormalLabs.length > 0 ? (
                <div className="space-y-2">
                  {abnormalLabs.map((lab, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{lab.test}</div>
                          <div className="text-[11px] text-slate-500">
                            Value: <span className="font-bold text-slate-800">{lab.value}</span> (Ref: {lab.reference})
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          lab.status === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : lab.status === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lab.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No diagnostic laboratory values extracted yet.
                </div>
              )}
            </div>

            {/* Consolidated Routing to Doctor */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onRouteToDoctorSummary}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Consolidate &amp; Send to Doctor's Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
