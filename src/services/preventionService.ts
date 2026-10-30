import {
  PreventionDataset,
  PreventionEntry,
  PreventionLookupResult,
} from '../types/prevention';
import rawPreventionData from '../data/South_India_Prevention_Only.json';

const preventionDataset = rawPreventionData as PreventionDataset;

export class PreventionService {
  private dataset: PreventionDataset = preventionDataset;

  /**
   * Non-destructively normalizes crop string from ML or UI input
   */
  public normalizeCrop(rawCrop: string, rawDisease?: string): string {
    let clean = (rawCrop || '').toLowerCase().trim();

    // Remove common descriptive words like "leaf", "plant", "crop"
    clean = clean.replace(/\b(leaf|leaves|plant|crop|tree|cultivation|seedling)\b/g, '').trim();

    // Crop synonym mappings
    if (clean.includes('paddy') || clean === 'rice') return 'rice';
    if (clean.includes('tomato')) return 'tomato';
    if (clean.includes('chilli') || clean.includes('chili') || clean.includes('capsicum') || clean.includes('pepper')) return 'chilli';
    if (clean.includes('onion')) return 'onion';
    if (clean.includes('papaya')) return 'papaya';
    if (clean.includes('pineapple')) return 'pineapple';
    if (clean.includes('brinjal') || clean.includes('eggplant') || clean.includes('aubergine')) return 'brinjal';
    if (clean.includes('okra') || clean.includes('bhindi') || clean.includes('lady')) return 'okra';
    if (clean.includes('potato')) return 'potato';
    if (clean.includes('banana')) return 'banana';
    if (clean.includes('coconut')) return 'coconut';
    if (clean.includes('maize') || clean.includes('corn')) return 'maize';
    if (clean.includes('mango')) return 'mango';
    if (clean.includes('guava')) return 'guava';
    if (clean.includes('jackfruit') || clean.includes('jack fruit')) return 'jackfruit';

    // If crop wasn't clear, try extracting from disease name (e.g. "Tomato Early Blight")
    if (rawDisease) {
      const diseaseLower = rawDisease.toLowerCase();
      if (diseaseLower.includes('rice') || diseaseLower.includes('paddy')) return 'rice';
      if (diseaseLower.includes('tomato')) return 'tomato';
      if (diseaseLower.includes('chilli') || diseaseLower.includes('chili')) return 'chilli';
      if (diseaseLower.includes('onion')) return 'onion';
      if (diseaseLower.includes('papaya')) return 'papaya';
      if (diseaseLower.includes('pineapple')) return 'pineapple';
      if (diseaseLower.includes('brinjal') || diseaseLower.includes('eggplant')) return 'brinjal';
      if (diseaseLower.includes('okra') || diseaseLower.includes('bhindi')) return 'okra';
      if (diseaseLower.includes('potato')) return 'potato';
      if (diseaseLower.includes('banana')) return 'banana';
      if (diseaseLower.includes('coconut')) return 'coconut';
      if (diseaseLower.includes('maize') || diseaseLower.includes('corn')) return 'maize';
      if (diseaseLower.includes('mango')) return 'mango';
      if (diseaseLower.includes('guava')) return 'guava';
      if (diseaseLower.includes('jackfruit')) return 'jackfruit';
    }

    return clean;
  }

  /**
   * Non-destructively normalizes disease string from ML or UI input
   */
  public normalizeDisease(rawDisease: string, normalizedCrop?: string): string {
    let clean = (rawDisease || '').toLowerCase().trim();

    // Strip parenthetical text like Malayalam script or notes: (ഇലപ്പുള്ളി), (കരിമ്പൻ)
    clean = clean.replace(/\(.*?\)/g, '').trim();

    // Replace multiple spaces or slashes
    clean = clean.replace(/\s+/g, ' ');

    return clean;
  }

  /**
   * Looks up prevention info in South_India_Prevention_Only.json
   * considering BOTH crop and disease.
   */
  public lookup(rawCrop: string, rawDisease: string): PreventionLookupResult {
    const normalizedCrop = this.normalizeCrop(rawCrop, rawDisease);
    const normalizedDisease = this.normalizeDisease(rawDisease, normalizedCrop);

    if (!normalizedCrop || !normalizedDisease) {
      return {
        found: false,
        entry: null,
        normalizedCrop,
        normalizedDisease,
        fallbackMessage: 'Prevention guidance for this prediction is not available in the current knowledge base.',
        generalGuidance: this.dataset.general_prevention,
      };
    }

    // Filter by crop first
    const cropEntries = this.dataset.entries.filter(
      (e) => e.crop.toLowerCase() === normalizedCrop
    );

    if (cropEntries.length === 0) {
      return {
        found: false,
        entry: null,
        normalizedCrop,
        normalizedDisease,
        fallbackMessage: 'Prevention guidance for this prediction is not available in the current knowledge base.',
        generalGuidance: this.dataset.general_prevention,
      };
    }

    // 1. Exact match on disease name (case-insensitive)
    let match = cropEntries.find(
      (e) => e.disease.toLowerCase() === normalizedDisease
    );

    // 2. Try matching without crop prefix in disease name
    // e.g. "Tomato early blight" -> "early blight"
    if (!match) {
      const strippedDisease = normalizedDisease.replace(new RegExp(`^${normalizedCrop}\\s+`, 'i'), '').trim();
      match = cropEntries.find(
        (e) => e.disease.toLowerCase() === strippedDisease
      );
    }

    // 3. Try matching where one contains the other (e.g., "early blight" matches "Early blight")
    if (!match) {
      match = cropEntries.find((e) => {
        const entryDisease = e.disease.toLowerCase();
        return (
          entryDisease.includes(normalizedDisease) ||
          normalizedDisease.includes(entryDisease)
        );
      });
    }

    // 4. Special canonical alias mappings within crop
    if (!match) {
      if (normalizedCrop === 'rice' && normalizedDisease.includes('blast')) {
        match = cropEntries.find((e) => e.disease.toLowerCase() === 'rice blast');
      } else if (normalizedCrop === 'rice' && normalizedDisease.includes('tungro')) {
        match = cropEntries.find((e) => e.disease.toLowerCase() === 'rice tungro virus');
      } else if (normalizedCrop === 'tomato' && normalizedDisease.includes('curl')) {
        match = cropEntries.find((e) => e.disease.toLowerCase() === 'tomato leaf curl virus');
      } else if (normalizedCrop === 'okra' && normalizedDisease.includes('yellow vein')) {
        match = cropEntries.find((e) => e.disease.toLowerCase() === 'yellow vein mosaic');
      } else if (normalizedCrop === 'onion' && (normalizedDisease.includes('purple') || normalizedDisease.includes('blight'))) {
        match = cropEntries.find((e) => e.disease.toLowerCase().includes('purple blotch'));
      }
    }

    if (match) {
      return {
        found: true,
        entry: match,
        normalizedCrop,
        normalizedDisease,
        generalGuidance: this.dataset.general_prevention,
      };
    }

    return {
      found: false,
      entry: null,
      normalizedCrop,
      normalizedDisease,
      fallbackMessage: 'Prevention guidance for this prediction is not available in the current knowledge base.',
      generalGuidance: this.dataset.general_prevention,
    };
  }
}

export const preventionService = new PreventionService();
