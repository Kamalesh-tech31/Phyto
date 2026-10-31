import { Language, VoiceState, SpeechDiagnostics, VoiceSequenceItem } from '../types';
import { i18n } from './i18n';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
  te: 'te-IN',
};

interface AudioManifest {
  version: number;
  clips: Record<string, { hash?: string; text?: string; type?: string; available?: boolean; isPlaceholder?: boolean }>;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private onStateChangeCallback: ((state: VoiceState) => void) | null = null;
  private cachedManifest: AudioManifest | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private activeRequestId: number = 0;

  // Diagnostics tracking
  private activeTier: 'bundled' | 'remote' | 'webspeech' | 'none' = 'none';
  private lastStatus: string | null = 'Initialized';
  private lastError: string | null = null;
  private lastSelectedVoice: string | null = null;
  private lastClipPath: string | null = null;
  private lastHttpStatus: string | number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }

    // Pre-cache manifest
    this.prefetchManifest();

    // Auto-stop speech whenever language changes in i18n
    i18n.subscribe(() => {
      this.stop();
    });
  }

  /**
   * Immediately caches browser voices and registers voiceschanged listener
   */
  private initVoices() {
    if (!this.synth) return;

    const populate = () => {
      try {
        const voices = this.synth?.getVoices() || [];
        if (voices.length > 0) {
          this.cachedVoices = voices;
          this.lastStatus = `Loaded ${voices.length} system voices`;
        }
      } catch (err) {
        console.warn('[Phyto Speech] Error populating voices:', err);
      }
    };

    populate();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = populate;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', populate);
    }
  }

  /**
   * Pre-fetches audio manifest
   */
  private async prefetchManifest(): Promise<void> {
    try {
      const res = await fetch('/assets/audio/manifest.json');
      if (res.ok) {
        this.cachedManifest = (await res.json()) as AudioManifest;
      }
    } catch {
      this.cachedManifest = { version: 1, clips: {} };
    }
  }

  public isSupported(): boolean {
    return this.synth !== null || typeof Audio !== 'undefined';
  }

  /**
   * Returns live speech engine diagnostics for Settings (?debug=1 or dev)
   */
  public getDiagnostics(language: Language = i18n.getLanguage()): SpeechDiagnostics {
    const matching = this.getMatchingVoices(language);
    return {
      isSupported: this.synth !== null || typeof Audio !== 'undefined',
      totalVoices: this.cachedVoices.length,
      voicesForLanguage: matching.map((v) => `${v.name} (${v.lang})`),
      selectedVoiceName: this.lastSelectedVoice,
      activeTier: this.activeTier,
      lastStatus: this.lastStatus,
      lastError: this.lastError,
      lastClipPath: this.lastClipPath,
      lastHttpStatus: this.lastHttpStatus,
    };
  }

  /**
   * Matches voices by checking locale code and language prefixes
   */
  public getMatchingVoices(language: Language): SpeechSynthesisVoice[] {
    const targetCode = LOCALE_MAP[language] || 'en-IN';
    const targetNormalized = targetCode.toLowerCase().replace('_', '-');
    const langPrefix = language.toLowerCase();

    return this.cachedVoices.filter((v) => {
      const vNorm = v.lang.toLowerCase().replace('_', '-');
      return (
        vNorm === targetNormalized ||
        vNorm.startsWith(`${langPrefix}-`) ||
        vNorm.startsWith(`${langPrefix}_`) ||
        v.lang.toLowerCase().startsWith(langPrefix)
      );
    });
  }

  public findBestVoice(language: Language): SpeechSynthesisVoice | undefined {
    const matching = this.getMatchingVoices(language);
    if (matching.length === 0) return undefined;

    if (language === 'en') {
      const preferred = matching.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('heera') ||
          n.includes('ravi') ||
          n.includes('neerja') ||
          n.includes('india') ||
          n.includes('en-in')
        );
      });
      if (preferred) return preferred;
    }

    return matching[0];
  }

  public registerStateListener(cb: (state: VoiceState) => void) {
    this.onStateChangeCallback = cb;
  }

  public unregisterStateListener() {
    this.onStateChangeCallback = null;
  }

  /**
   * Speaks a single item or clip
   */
  public speak(params: {
    text: string;
    clipId?: string;
    language?: Language;
    onStateChange?: (state: VoiceState) => void;
    onVoiceMissing?: (message: string) => void;
  }): void {
    const lang = params.language || i18n.getLanguage();
    this.speakSequence([{ clipId: params.clipId, text: params.text }], lang, {
      onStateChange: params.onStateChange,
      onVoiceMissing: params.onVoiceMissing,
    });
  }

  /**
   * Builds the voice experience by playing short clips sequentially (Directive 3)
   */
  public speakSequence(
    items: VoiceSequenceItem[],
    language: Language = i18n.getLanguage(),
    options?: {
      onStateChange?: (state: VoiceState) => void;
      onVoiceMissing?: (message: string) => void;
    }
  ): void {
    if (!items || items.length === 0) return;

    this.stop();
    const requestId = ++this.activeRequestId;

    if (options?.onStateChange) {
      this.onStateChangeCallback = options.onStateChange;
    }

    this.updateState('loading');
    this.lastError = null;
    this.lastStatus = `Starting sequence (${items.length} clips)`;

    this.playSequenceIndex(items, 0, language, requestId, options?.onVoiceMissing);
  }

  private playSequenceIndex(
    items: VoiceSequenceItem[],
    index: number,
    language: Language,
    requestId: number,
    onVoiceMissing?: (msg: string) => void
  ): void {
    if (requestId !== this.activeRequestId) return;

    if (index >= items.length) {
      this.updateState('idle');
      this.lastStatus = 'Sequence completed';
      this.activeTier = 'none';
      return;
    }

    const item = items[index];
    const clipId = item.clipId;
    const text = item.text;

    // 1. Try bundled MP3 audio clip first if clipId is present
    if (clipId) {
      const clipPath = `/assets/audio/${language}/${clipId}.mp3`;
      this.lastClipPath = clipPath;

      const audio = new Audio();
      this.currentAudio = audio;

      let hasHandledCompletion = false;
      const advance = () => {
        if (!hasHandledCompletion && requestId === this.activeRequestId) {
          hasHandledCompletion = true;
          this.currentAudio = null;
          this.playSequenceIndex(items, index + 1, language, requestId, onVoiceMissing);
        }
      };

      audio.onplay = () => {
        if (requestId === this.activeRequestId) {
          this.activeTier = 'bundled';
          this.lastHttpStatus = 200;
          this.lastStatus = `Playing bundled clip: ${clipId}`;
          this.updateState('speaking');
        }
      };

      audio.onended = () => {
        advance();
      };

      audio.onerror = () => {
        if (requestId === this.activeRequestId && !hasHandledCompletion) {
          hasHandledCompletion = true;
          this.currentAudio = null;
          this.lastHttpStatus = 404;
          this.lastStatus = `Audio file not found: ${clipPath}, falling back to Web Speech`;
          // Fall back to Web Speech for this segment
          this.speakTextSegment(text, language, requestId, () => {
            this.playSequenceIndex(items, index + 1, language, requestId, onVoiceMissing);
          }, onVoiceMissing);
        }
      };

      try {
        audio.src = clipPath;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser blocked or file not found
            if (requestId === this.activeRequestId && !hasHandledCompletion) {
              hasHandledCompletion = true;
              this.currentAudio = null;
              this.speakTextSegment(text, language, requestId, () => {
                this.playSequenceIndex(items, index + 1, language, requestId, onVoiceMissing);
              }, onVoiceMissing);
            }
          });
        }
        return;
      } catch (err) {
        console.warn('[Phyto Speech] Audio playback error:', err);
      }
    }

    // 2. Fall back to Web Speech if no clipId or audio element creation failed
    this.speakTextSegment(text, language, requestId, () => {
      this.playSequenceIndex(items, index + 1, language, requestId, onVoiceMissing);
    }, onVoiceMissing);
  }

  private speakTextSegment(
    text: string,
    language: Language,
    requestId: number,
    onComplete: () => void,
    onVoiceMissing?: (msg: string) => void
  ): void {
    if (!this.synth || requestId !== this.activeRequestId) {
      onComplete();
      return;
    }

    const matchedVoice = this.findBestVoice(language);
    this.lastSelectedVoice = matchedVoice ? `${matchedVoice.name} (${matchedVoice.lang})` : 'System Default';
    this.activeTier = 'webspeech';

    const chunks = this.splitIntoChunks(text, 140);
    this.speakChunksSequentially(chunks, language, matchedVoice, requestId, 0, onComplete);
  }

  private splitIntoChunks(text: string, maxChunkLength = 140): string[] {
    const rawSentences = text.split(/(?<=[.?!,\n—–])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const piece of rawSentences) {
      if ((current + ' ' + piece).trim().length <= maxChunkLength) {
        current = (current + ' ' + piece).trim();
      } else {
        if (current) chunks.push(current);
        if (piece.length <= maxChunkLength) {
          current = piece;
        } else {
          const words = piece.split(/\s+/);
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).trim().length <= maxChunkLength) {
              sub = (sub + ' ' + w).trim();
            } else {
              if (sub) chunks.push(sub);
              sub = w;
            }
          }
          current = sub;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [text];
  }

  private speakChunksSequentially(
    chunks: string[],
    language: Language,
    voice: SpeechSynthesisVoice | undefined,
    requestId: number,
    index: number,
    onComplete: () => void
  ): void {
    if (requestId !== this.activeRequestId || index >= chunks.length || !this.synth) {
      if (index >= chunks.length && requestId === this.activeRequestId) {
        onComplete();
      }
      return;
    }

    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    this.currentUtterance = utterance;

    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = LOCALE_MAP[language] || 'en-IN';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (requestId === this.activeRequestId) {
        this.updateState('speaking');
      }
    };

    utterance.onend = () => {
      if (requestId === this.activeRequestId) {
        this.speakChunksSequentially(chunks, language, voice, requestId, index + 1, onComplete);
      }
    };

    utterance.onerror = (e) => {
      console.warn('[Phyto Speech] Utterance error on chunk', index, e);
      if (requestId === this.activeRequestId) {
        this.currentUtterance = null;
        this.lastError = `Utterance error: ${e.error}`;
        onComplete();
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err: any) {
      console.error('[Phyto Speech] synth.speak error:', err);
      this.lastError = err?.message || 'synth.speak error';
      onComplete();
    }
  }

  private updateState(state: VoiceState) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  public stop(): void {
    this.activeRequestId++;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
        this.synth.resume();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }

    this.updateState('idle');
    this.activeTier = 'none';
  }

  public isSpeaking(): boolean {
    return (this.synth ? this.synth.speaking : false) || this.currentAudio !== null;
  }
}

export const speechService = new SpeechService();
