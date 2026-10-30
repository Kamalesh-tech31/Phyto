/**
 * Core image processing and ML pipeline types for AgriScan.
 * Conforms to AGENTS.md contract.
 */

export type QualityVerdict = 'pass' | 'enhance' | 'retake';

export interface QualityReport {
  blur: number; // Variance of Laplacian
  tenengrad: number; // Tenengrad / Sobel gradient energy
  brightness: number; // Mean luminance [0, 255]
  darkFraction: number; // Fraction of near-black pixels
  brightFraction: number; // Fraction of near-white pixels
  contrast: number; // Luminance standard deviation
  noise: number; // Noise estimate (Immerkaer)
  glare: number; // Glare fraction (near-white, low-saturation blobs)
  coverage: number; // Share of vegetation-colored pixels in center area [0, 1]
  motionLikely: boolean; // True if horizontal/vertical gradient energy shows strong imbalance
  verdict: QualityVerdict; // 'pass' | 'enhance' | 'retake'
  hints: string[]; // Plain-language user hints
}

export type AnalyzeStatus = 'confident' | 'uncertain' | 'unknown' | 'poor_quality';

export interface TopPrediction {
  label: string;
  prob: number;
}

export interface AnalyzeResult {
  status: AnalyzeStatus;
  top3: TopPrediction[];
  quality: QualityReport;
  enhanced: boolean;
  severity?: {
    pct: number;
    level: string;
  };
  needsSecondPhoto?: boolean;
  explainMap?: number[];
  latencyMs: number;
}

export interface QualityConfig {
  blur: {
    retakeThreshold: number;
    enhanceThreshold: number;
  };
  tenengrad: {
    retakeThreshold: number;
    enhanceThreshold: number;
  };
  brightness: {
    minLuminance: number;
    maxLuminance: number;
    maxDarkFraction: number;
    maxBrightFraction: number;
  };
  contrast: {
    minStdDev: number;
  };
  noise: {
    maxNoise: number;
  };
  glare: {
    maxGlareFraction: number;
  };
  coverage: {
    minCoverage: number;
  };
  motionRatioThreshold: number;
  enhancement: {
    enabled: boolean;
    unsharpRadius: number;
    unsharpAmount: number;
    targetLuminance: number;
    gamma: number;
  };
}

export interface ModelConfig {
  temperature: number;
  minConf: number;
  minMargin: number;
  maxEntropy: number;
  unknownClass: string;
  inputSize: number;
  mean: [number, number, number];
  std: [number, number, number];
}

export interface EnhanceResult {
  bitmap: ImageBitmap;
  applied: string[];
}
