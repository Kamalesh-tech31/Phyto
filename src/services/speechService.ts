import { Language } from '../types';
import { i18n } from './i18nService';
import { remoteVoiceProvider } from './voiceProvider';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
  te: 'te-IN',
};

interface AudioManifest {
  version: number;
  clips: Record<string, { hash: string; text?: string; type?: string; available?: boolean; isPlaceholder?: boolean }>;
}

export type VoiceState = 'idle' | 'loading' | 'speaking' | 'error';

export interface SpeechDiagnostics {
  isSupported: boolean;
  totalVoices: number;
  voicesForLanguage: string[];
  selectedVoiceName: string | null;
  activeTier: 'bundled' | 'remote' | 'webspeech' | 'none';
  lastStatus: string | null;
  lastError: string | null;
  lastClipPath: string | null;
  lastHttpStatus: string | number | null;
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

    // Auto-stop speech whenever language changes
    i18n.subscribe(() => {
      this.stop();
    });
  }

  /**
   * Immediately caches browser voices and registers the voiceschanged listener
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
    // Also attach standard event listener
    window.speechSynthesis?.addEventListener('voiceschanged', populate);
  }

  /**
   * Pre-fetches audio manifest so manifest check is synchronous inside user gesture
   */
  private async prefetchManifest(): Promise<void> {
    try {
      const res = await fetch('/assets/audio/manifest.json');
      if (res.ok) {
        this.cachedManifest = (await res.json()) as AudioManifest;
      }
    } catch {
      // Manifest not yet available or offline; treated as empty
      this.cachedManifest = { version: 1, clips: {} };
    }
  }

  public isSupported(): boolean {
    return this.synth !== null || typeof Audio !== 'undefined';
  }

  /**
   * Returns live speech engine diagnostics for the Settings screen
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
   * Matches voices by checking:
   * 1. Exact locale tags with '-' or '_' (e.g. "ta-IN" and "ta_IN")
   * 2. Language prefix (e.g. "ta-", "ta_", or "ta")
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

  /**
   * Chooses the best voice for the language:
   * For English, prefers local offline Indian English voices (Microsoft Heera, Ravi) or US voices.
   */
  public findBestVoice(language: Language): SpeechSynthesisVoice | undefined {
    const matching = this.getMatchingVoices(language);
    if (matching.length === 0) return undefined;

    if (language === 'en') {
      // Prioritize en-IN local voices
      const preferredNames = ['heera', 'ravi', 'india', 'david', 'zira', 'mark', 'google'];
      for (const pref of preferredNames) {
        const found = matching.find((v) => v.name.toLowerCase().includes(pref) && !v.name.toLowerCase().includes('online'));
        if (found) return found;
      }
      // Prefer any local (non-network) voice
      const local = matching.find((v) => v.localService === true);
      if (local) return local;
    }

    return matching[0];
  }

  public hasVoiceForLanguage(language: Language): boolean {
    return this.getMatchingVoices(language).length > 0;
  }

  /**
   * PRIMARY ENTRY POINT FOR VOICE:
   * Must be called directly inside the user click gesture!
   * 1. Cancels and resumes speechSynthesis immediately (unlocks Chrome speech queue).
   * 2. Tiers:
   *    - Tier 1: Real Bundled Audio Clip (if file exists and is real audio > 1KB)
   *    - Tier 2: Remote TTS Proxy (if configured & online)
   *    - Tier 3: Web Speech API (with chunking < 150 chars, slow speech support)
   *    - Tier 4: Translated warning if voice unavailable
   */
  public speak(options: {
    text: string;
    clipId?: string;
    language?: Language;
    onStateChange?: (state: VoiceState) => void;
    onVoiceMissing?: (message: string) => void;
  }): void {
    // 1. Immediately unlock and reset speech queue inside the user gesture
    this.stop();
    const requestId = ++this.activeRequestId;

    const {
      text,
      clipId,
      language = i18n.getLanguage(),
      onStateChange,
      onVoiceMissing,
    } = options;

    this.onStateChangeCallback = onStateChange || null;
    this.lastError = null;

    if (!text || text.trim() === '') {
      this.updateState('idle');
      return;
    }

    console.log(`[Phyto Speech] speak() called for language "${language}", clipId: "${clipId || 'none'}"`);
    this.updateState('loading');

    // 2. Check if bundled MP3 exists and play it
    if (clipId) {
      const clipKey = `${language}/${clipId}.mp3`;
      const clipUrl = `/assets/audio/${clipKey}`;
      this.lastClipPath = clipUrl;

      const clipEntry = this.cachedManifest?.clips ? this.cachedManifest.clips[clipKey] : null;
      if (!clipEntry || (!clipEntry.isPlaceholder && clipEntry.available !== false)) {
        console.log(`[Phyto Speech] Tier 1: Attempting bundled audio clip ${clipUrl}`);
        this.activeTier = 'bundled';
        this.lastStatus = `Playing bundled clip: ${clipKey}`;
        this.lastHttpStatus = 200;

        this.tryPlayBundledClip(clipUrl, requestId)
          .then((success) => {
            if (success) {
              return;
            }
            // Bundled clip failed, too short, or missing (404); smoothly fall through to Web Speech
            if (requestId === this.activeRequestId) {
              console.log('[Phyto Speech] Bundled clip unavailable, falling back to Web Speech API');
              this.fallbackToWebSpeech(text, language, requestId, onVoiceMissing);
            }
          })
          .catch(() => {
            if (requestId === this.activeRequestId) {
              this.fallbackToWebSpeech(text, language, requestId, onVoiceMissing);
            }
          });
        return;
      } else {
        console.log(`[Phyto Speech] Tier 1: Manifest reports placeholder for "${clipKey}".`);
        this.lastHttpStatus = '404 (Placeholder)';
      }
    } else {
      this.lastClipPath = 'None (no clipId provided)';
      this.lastHttpStatus = 'N/A';
    }

    // 3. Fallback directly to Web Speech API
    this.fallbackToWebSpeech(text, language, requestId, onVoiceMissing);
  }

  /**
   * Attempts to play a bundled clip. Returns false on 404, too short (<0.5s),
   * or play rejection without blocking or breaking Web Speech fallback.
   */
  private tryPlayBundledClip(url: string, requestId: number): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      let started = false;

      audio.onloadedmetadata = () => {
        // If duration is too short (< 0.5s), it is an empty placeholder, not real spoken text
        if (audio.duration && audio.duration < 0.5) {
          console.log(`[Phyto Speech] Audio duration (${audio.duration}s) too short, falling back to Web Speech`);
          audio.pause();
          resolve(false);
        }
      };

      audio.onplay = () => {
        if (requestId !== this.activeRequestId) {
          audio.pause();
          resolve(false);
          return;
        }
        started = true;
        this.currentAudio = audio;
        this.activeTier = 'bundled';
        this.lastHttpStatus = 200;
        this.lastStatus = 'Playing bundled clip';
        this.updateState('speaking');
      };

      audio.onended = () => {
        if (audio.duration && audio.duration < 0.5) {
          this.currentAudio = null;
          resolve(false);
          return;
        }
        if (requestId === this.activeRequestId) {
          this.currentAudio = null;
          this.updateState('idle');
          this.lastStatus = 'Playback finished';
        }
        resolve(true);
      };

      audio.onerror = () => {
        console.log(`[Phyto Speech] Audio file error at ${url}; falling back smoothly to Web Speech API`);
        this.lastHttpStatus = '404 / decode error';
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve(false);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log(`[Phyto Speech] Audio play notice for ${url}:`, err.message);
          this.lastHttpStatus = `Play error: ${err.name || 'blocked'}`;
          resolve(false);
        });
      }
    });
  }

  /**
   * Executes Web Speech API with chunking, slow rate option, and safety checks
   */
  private fallbackToWebSpeech(
    text: string,
    language: Language,
    requestId: number,
    onVoiceMissing?: (message: string) => void
  ): void {
    if (!this.synth) {
      this.activeTier = 'none';
      this.lastError = 'SpeechSynthesis not supported in this browser';
      this.updateState('error');
      if (onVoiceMissing) onVoiceMissing(i18n.t('voice_unavailable_warning'));
      return;
    }

    this.activeTier = 'webspeech';

    // If voices are not yet populated, grab current voices synchronously
    if (this.cachedVoices.length === 0) {
      this.cachedVoices = this.synth.getVoices();
    }

    const matchedVoice = this.findBestVoice(language);
    this.lastSelectedVoice = matchedVoice ? `${matchedVoice.name} (${matchedVoice.lang})` : null;

    // Safety rule: if language is not English and device has no matching voice,
    // do NOT fall back to an English voice.
    if (language !== 'en' && !matchedVoice) {
      this.lastError = `No voice found for language ${language}`;
      this.lastStatus = `Voice missing for ${language}`;
      console.warn(`[Phyto Speech] No system voice found for ${language}. Aborting synthesis to prevent English accent.`);
      this.updateState('error');
      if (onVoiceMissing) onVoiceMissing(i18n.t('voice_unavailable_warning'));
      return;
    }

    // Split text into chunks < 150 characters on sentence boundaries to avoid Chrome timeout bug
    const chunks = this.splitIntoChunks(text, 140);
    console.log(`[Phyto Speech] Speaking text in ${chunks.length} chunk(s) using voice:`, this.lastSelectedVoice || 'default');

    this.lastStatus = `Speaking via Web Speech (${chunks.length} chunks)`;
    this.speakChunksSequentially(chunks, language, matchedVoice, requestId, 0);
  }

  /**
   * Splits long text into natural sentence/clause chunks under maxChunkLength
   */
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
          // Force split long words/clauses
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

  /**
   * Speaks chunks sequentially using onend
   */
  private speakChunksSequentially(
    chunks: string[],
    language: Language,
    voice: SpeechSynthesisVoice | undefined,
    requestId: number,
    index: number
  ): void {
    if (requestId !== this.activeRequestId || index >= chunks.length || !this.synth) {
      if (index >= chunks.length && requestId === this.activeRequestId) {
        this.updateState('idle');
        this.lastStatus = 'Completed speaking';
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
    utterance.rate = i18n.getSpeakSlowly() ? 0.72 : 0.88;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (requestId === this.activeRequestId) {
        this.updateState('speaking');
      }
    };

    utterance.onend = () => {
      if (requestId === this.activeRequestId) {
        // Proceed to next chunk
        this.speakChunksSequentially(chunks, language, voice, requestId, index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.warn('[Phyto Speech] Utterance error on chunk', index, e);
      if (requestId === this.activeRequestId) {
        this.currentUtterance = null;
        this.lastError = `Utterance error: ${e.error}`;
        this.updateState('error');
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err: any) {
      console.error('[Phyto Speech] synth.speak threw an error:', err);
      this.lastError = err?.message || 'synth.speak error';
      this.updateState('error');
    }
  }

  private updateState(state: VoiceState) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  public stop() {
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
        // Immediately resume in case Chrome queue is in paused state
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

  /**
   * Backward-compatible helper methods
   */
  public speakDiseaseAudio(
    classId: string,
    voiceText: string,
    language: Language,
    onStateChange?: (isSpeaking: boolean) => void,
    onVoiceMissing?: (message: string) => void
  ) {
    this.speak({
      text: voiceText,
      clipId: `${classId}_overview`,
      language,
      onStateChange: (state) => {
        if (onStateChange) onStateChange(state === 'speaking');
      },
      onVoiceMissing,
    });
  }

  public speakText(
    text: string,
    language: Language,
    onStateChange?: (isSpeaking: boolean) => void,
    onVoiceMissing?: (message: string) => void
  ) {
    this.speak({
      text,
      language,
      onStateChange: (state) => {
        if (onStateChange) onStateChange(state === 'speaking');
      },
      onVoiceMissing,
    });
  }
}

export const speechService = new SpeechService();
