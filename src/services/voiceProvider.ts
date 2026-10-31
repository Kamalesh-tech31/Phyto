export interface VoiceProvider {
  synthesize(text: string, language: string): Promise<string | null>;
}

export class RemoteVoiceProvider implements VoiceProvider {
  private proxyUrl: string;

  constructor() {
    this.proxyUrl = (import.meta.env.VITE_TTS_PROXY_URL as string) || '';
  }

  /**
   * Synthesizes audio using remote TTS proxy.
   * Silently returns null if not configured or unavailable.
   */
  public async synthesize(text: string, language: string): Promise<string | null> {
    if (!this.proxyUrl || !text || text.trim() === '') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) return null;

      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }
}

export const remoteVoiceProvider = new RemoteVoiceProvider();
