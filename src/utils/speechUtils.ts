// Speech synthesis (Sarvam AI Bulbul v3 TTS with Web Speech fallback) and speech recognition (Sarvam Saaras v3 ASR)

let activeAudio: HTMLAudioElement | null = null;

export async function speakPrompt(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  lang: string = 'hi-IN',
  sarvamKey?: string
): Promise<void> {
  stopSpeaking();
  if (!text?.trim()) return;

  // Attempt server-side Sarvam Bulbul v3 TTS
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (sarvamKey) {
      headers['x-sarvam-api-key'] = sarvamKey;
    }

    const res = await fetch('/api/audio/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        language_code: lang,
        speaker: 'meera',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.audio_base64) {
        if (onStart) onStart();
        const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
        activeAudio = audio;
        audio.onended = () => {
          activeAudio = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          activeAudio = null;
          speakBrowserFallback(text, onStart, onEnd, lang);
        };
        try {
          await audio.play();
        } catch (playErr) {
          console.warn('Audio play rejected, falling back to browser speech:', playErr);
          activeAudio = null;
          speakBrowserFallback(text, onStart, onEnd, lang);
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Sarvam TTS unavailable, using browser speech synthesis fallback:', err);
  }

  // Fallback to browser SpeechSynthesis
  speakBrowserFallback(text, onStart, onEnd, lang);
}

function speakBrowserFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  lang: string = 'hi-IN'
): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (_e) {
    if (onEnd) onEnd();
  }
}

export function stopSpeaking(): void {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (err) {
    console.warn('Stop speech error:', err);
  }
}

export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError?: (err: any) => void,
  onEnd?: () => void,
  lang: string = 'hi-IN'
): any | null {
  try {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      try {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        onResult(transcript);
      } catch (e) {
        console.warn('Recognition parse error:', e);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error event:', event);
      if (onError) onError(event);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  } catch (err) {
    console.warn('SpeechRecognizer initialization failed:', err);
    return null;
  }
}
