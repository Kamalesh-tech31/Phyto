/**
 * Main-thread inference client managing Web Worker lifecycle, quality gates, and AnalyzeResult delivery.
 * Conforms to AGENTS.md Section 7.
 */

import { AnalyzeResult, QualityReport } from './types';

export interface AnalyzeOptions {
  mode?: 'single' | 'pest';
  scanAnyway?: boolean;
}

/**
 * Initialize model session and Web Worker.
 */
export async function initModel(): Promise<void> {
  // TODO: Initialize worker and load model artifacts (P6)
  return Promise.resolve();
}

/**
 * Run full end-to-end analysis on an ImageBitmap.
 */
export async function analyze(
  bitmap: ImageBitmap,
  options?: AnalyzeOptions
): Promise<AnalyzeResult> {
  // TODO: Coordinate ingest -> quality -> enhance -> worker -> decide per AGENTS.md Section 7 (P6)
  const dummyQuality: QualityReport = {
    blur: 150,
    tenengrad: 120,
    brightness: 120,
    darkFraction: 0.1,
    brightFraction: 0.05,
    contrast: 45,
    noise: 4,
    glare: 0.02,
    coverage: 0.85,
    motionLikely: false,
    verdict: 'pass',
    hints: [],
  };

  return {
    status: 'confident',
    top3: [{ label: 'healthy', prob: 0.95 }],
    quality: dummyQuality,
    enhanced: false,
    latencyMs: 10,
  };
}

/**
 * Average predictions across multiple photos for robust diagnosis.
 */
export async function analyzeMany(
  bitmaps: ImageBitmap[],
  options?: AnalyzeOptions
): Promise<AnalyzeResult> {
  // TODO: Implement multi-photo averaging (P6)
  if (bitmaps.length === 0) {
    throw new Error('At least one bitmap required for analyzeMany');
  }
  return analyze(bitmaps[0], options);
}
