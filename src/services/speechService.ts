import { Language } from '../types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingCallback: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public speak(
    text: string,
    language: Language,
    onStateChange?: (isSpeaking: boolean) => void
  ) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported on this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    if (!text || text.trim() === '') return;

    this.isSpeakingCallback = onStateChange || null;
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Pick best voice for language
    const voices = this.synth.getVoices();
    const langCode = language === 'ml' ? 'ml-IN' : 'en-IN';
    
    // Find matching language voice or fallback
    const matchedVoice = voices.find(
      (v) => v.lang.toLowerCase() === langCode.toLowerCase() || v.lang.startsWith(language)
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.lang = langCode;
    utterance.rate = 0.92; // slightly slower for clear farmer comprehension
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (this.isSpeakingCallback) this.isSpeakingCallback(true);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (this.isSpeakingCallback) this.isSpeakingCallback(false);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.currentUtterance = null;
      if (this.isSpeakingCallback) this.isSpeakingCallback(false);
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      if (this.isSpeakingCallback) {
        this.isSpeakingCallback(false);
      }
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechService();
