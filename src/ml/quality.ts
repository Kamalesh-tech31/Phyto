/**
 * Image quality analysis (blur, sharpness, brightness, contrast, noise, glare, coverage, motion blur).
 * Conforms to AGENTS.md Section 6.
 */

import { QualityReport, QualityConfig } from './types';
import defaultQualityConfig from './quality.config.json';

/**
 * Full quality analysis on a 256px grayscale version of center and full frame.
 */
export async function analyzeQuality(
  image: ImageBitmap | ImageData,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): Promise<QualityReport> {
  // TODO: Implement quality metrics and verdict logic per AGENTS.md Section 6 (P4)
  return {
    blur: 0,
    tenengrad: 0,
    brightness: 128,
    darkFraction: 0,
    brightFraction: 0,
    contrast: 50,
    noise: 0,
    glare: 0,
    coverage: 0.8,
    motionLikely: false,
    verdict: 'pass',
    hints: [],
  };
}

/**
 * Cheap quality check variant for 160x160 live camera preview (~5 fps).
 */
export function analyzePreviewQuality(
  imageData: ImageData,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): { sharp: boolean; bright: boolean; hints: string[] } {
  // TODO: Implement lightweight live preview quality check (P4)
  return { sharp: true, bright: true, hints: [] };
}
