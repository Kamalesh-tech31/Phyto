/**
 * Decision Gate & Classification Post-processing.
 *
 * Implements exact AGENTS.md Section 7 specification:
 * - Softmax with temperature T from config.json.
 * - Normalized Shannon entropy calculation.
 * - Honest decision status rule:
 *     - 'poor_quality' if quality verdict is retake and scanAnyway is false.
 *     - 'unknown' if top predicted class is unknownClass.
 *     - 'uncertain' if p1 < minConf OR (p1 - p2) < minMargin OR normalized entropy > maxEntropy.
 *     - 'confident' otherwise.
 */

import {
  AnalyzeResult,
  AnalyzeStatus,
  ModelConfig,
  QualityReport,
  TopPrediction,
} from './types';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 1.0,
  minConf: 0.55,
  minMargin: 0.15,
  maxEntropy: 0.80,
  unknownClass: 'unknown',
  inputSize: 224,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
};

/**
 * Computes numerically stable softmax scaled by temperature T:
 * z_i = logits[i] / T
 * p_i = exp(z_i - max(z)) / sum(exp(z_j - max(z)))
 */
export function computeSoftmax(
  logits: number[] | Float32Array,
  temperature: number = 1.0
): Float32Array {
  const n = logits.length;
  if (n === 0) return new Float32Array(0);

  const t = Math.max(0.001, temperature);
  const scaled = new Float32Array(n);
  let maxZ = -Infinity;

  for (let i = 0; i < n; i++) {
    scaled[i] = logits[i] / t;
    if (scaled[i] > maxZ) {
      maxZ = scaled[i];
    }
  }

  let sumExp = 0.0;
  const probs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    probs[i] = Math.exp(scaled[i] - maxZ);
    sumExp += probs[i];
  }

  for (let i = 0; i < n; i++) {
    probs[i] /= sumExp;
  }

  return probs;
}

/**
 * Computes normalized Shannon entropy H_norm in [0, 1]:
 * H = -sum(p_i * ln(p_i))
 * H_norm = H / ln(N)
 */
export function computeNormalizedEntropy(probs: ArrayLike<number>): number {
  const n = probs.length;
  if (n <= 1) return 0.0;

  let h = 0.0;
  for (let i = 0; i < n; i++) {
    const p = probs[i];
    if (p > 1e-12) {
      h -= p * Math.log(p);
    }
  }

  const maxH = Math.log(n);
  return Math.min(1.0, Math.max(0.0, h / maxH));
}

/**
 * Decides analysis status and extracts top-3 predictions from raw logits.
 */
export function decideResult({
  logits,
  labels,
  config = DEFAULT_MODEL_CONFIG,
  quality,
  scanAnyway = false,
  enhanced = false,
  latencyMs = 0,
}: {
  logits?: number[] | Float32Array;
  labels: string[];
  config?: ModelConfig;
  quality: QualityReport;
  scanAnyway?: boolean;
  enhanced?: boolean;
  latencyMs?: number;
}): AnalyzeResult {
  // 1. Poor quality gate: skip inference when photo quality fails retake threshold
  if (quality.verdict === 'retake' && !scanAnyway) {
    return {
      status: 'poor_quality',
      top3: [],
      quality,
      enhanced,
      latencyMs,
    };
  }

  if (!logits || logits.length === 0) {
    return {
      status: 'poor_quality',
      top3: [],
      quality,
      enhanced,
      latencyMs,
    };
  }

  // 2. Softmax temperature scaling
  const probs = computeSoftmax(logits, config.temperature);

  // 3. Map to label predictions and sort descending
  const predictions: TopPrediction[] = [];
  for (let i = 0; i < probs.length; i++) {
    predictions.push({
      label: labels[i] || `class_${i}`,
      prob: probs[i],
    });
  }
  predictions.sort((a, b) => b.prob - a.prob);

  const top3 = predictions.slice(0, 3);
  const p1 = top3[0]?.prob ?? 0;
  const p2 = top3[1]?.prob ?? 0;
  const topLabel = top3[0]?.label ?? '';

  // 4. Normalized Shannon entropy
  const normEntropy = computeNormalizedEntropy(probs);

  // 5. Honest Decision Gating
  let status: AnalyzeStatus = 'confident';

  if (topLabel === config.unknownClass) {
    status = 'unknown';
  } else if (
    p1 < config.minConf ||
    p1 - p2 < config.minMargin ||
    normEntropy > config.maxEntropy
  ) {
    status = 'uncertain';
  } else {
    status = 'confident';
  }

  // 6. Severity estimate
  let severity: { pct: number; level: string } | undefined;
  if (status === 'confident') {
    if (topLabel === 'healthy' || topLabel === config.unknownClass) {
      severity = { pct: 0, level: 'mild' };
    } else {
      // Calibrate estimated severity based on confidence
      const pct = Math.round(30 + p1 * 40);
      const level = pct > 65 ? 'severe' : pct > 35 ? 'moderate' : 'mild';
      severity = { pct, level };
    }
  }

  return {
    status,
    top3,
    quality,
    enhanced,
    severity,
    needsSecondPhoto: status === 'uncertain',
    latencyMs,
  };
}
