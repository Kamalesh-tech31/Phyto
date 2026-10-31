export interface OnlineTranslator {
  translate(text: string, from: string, to: string): Promise<string | null>;
}

// Critical agricultural chemicals and interval terms that must not be altered
const CRITICAL_TERMS = [
  'Bordeaux',
  'Metalaxyl',
  'Mancozeb',
  'Alternaria',
  'Phytophthora',
];

export class TranslationService implements OnlineTranslator {
  private proxyUrl: string;

  constructor() {
    this.proxyUrl = (import.meta.env.VITE_TRANSLATION_PROXY_URL as string) || '';
  }

  /**
   * Translates text via backend proxy.
   * Silently returns null if no proxy URL is configured or network fails.
   */
  public async translate(text: string, from: string, to: string): Promise<string | null> {
    if (!this.proxyUrl || !text || text.trim() === '' || from === to) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from, to }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const translatedText = data?.translatedText || data?.text;

      if (!translatedText || typeof translatedText !== 'string' || translatedText.trim() === '') {
        return null;
      }

      // Strict Validation: numbers, placeholders, chemical names must be identical
      if (!this.validateTranslation(text, translatedText)) {
        console.warn('Online translation rejected due to mismatch in numbers, placeholders, or chemical names:', text);
        return null;
      }

      return translatedText;
    } catch {
      // Silently fail on network/proxy errors
      return null;
    }
  }

  /**
   * Rejects any online translation whose numbers, {placeholders} or chemical names
   * differ from the English source.
   */
  public validateTranslation(sourceText: string, translatedText: string): boolean {
    // 1. Verify placeholders {placeholder}
    const sourcePlaceholders = (sourceText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
    const transPlaceholders = (translatedText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
    if (sourcePlaceholders.join(',') !== transPlaceholders.join(',')) {
      return false;
    }

    // 2. Verify numbers and percentages (e.g., 1%, 7, 45, 60, 120, etc.)
    const extractNumbers = (str: string) => {
      return (str.match(/\d+(?:[–\-]\d+)?%?/g) || []).sort();
    };
    const sourceNums = extractNumbers(sourceText);
    const transNums = extractNumbers(translatedText);
    if (sourceNums.join(',') !== transNums.join(',')) {
      return false;
    }

    // 3. Verify chemical names
    for (const term of CRITICAL_TERMS) {
      const sourceHasTerm = new RegExp(`\\b${term}\\b`, 'i').test(sourceText);
      const transHasTerm = new RegExp(`\\b${term}\\b`, 'i').test(translatedText);
      if (sourceHasTerm && !transHasTerm) {
        return false;
      }
    }

    return true;
  }
}

export const translationService = new TranslationService();
