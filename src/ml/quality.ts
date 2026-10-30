/**
 * Image quality analysis (blur, sharpness, brightness, contrast, noise, glare, leaf coverage, motion blur).
 * Conforms strictly to AGENTS.md Section 6.
 */

import { QualityReport, QualityConfig, QualityVerdict } from './types';
import defaultQualityConfig from './quality.config.json';

const ANALYSIS_SIZE = 256; // Standard 256px resolution-independent analysis size per AGENTS.md Section 6

/**
 * Converts RGBA pixel data to grayscale luminance buffer (Float32Array [0, 255]).
 * Uses standard ITU-R BT.601 coefficients: Y = 0.299R + 0.587G + 0.114B.
 */
export function computeGrayscale(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): Float32Array {
  const count = width * height;
  const gray = new Float32Array(count);
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    gray[i] = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
  }
  return gray;
}

/**
 * Computes Variance of Laplacian on grayscale image.
 * Uses 3x3 discrete Laplacian operator:
 * [ 0,  1,  0 ]
 * [ 1, -4,  1 ]
 * [ 0,  1,  0 ]
 */
export function computeLaplacianVariance(
  gray: Float32Array,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const upOffset = (y - 1) * width;
    const downOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const center = gray[rowOffset + x];
      const val =
        gray[upOffset + x] +
        gray[downOffset + x] +
        gray[rowOffset + x - 1] +
        gray[rowOffset + x + 1] -
        4 * center;

      sum += val;
      sumSq += val * val;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}

/**
 * Computes Tenengrad gradient energy and horizontal/vertical imbalance.
 * Sobel horizontal: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
 * Sobel vertical:   [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
 */
export function computeTenengradAndMotion(
  gray: Float32Array,
  width: number,
  height: number,
  motionRatioThreshold: number = 2.2
): { tenengrad: number; hEnergy: number; vEnergy: number; motionLikely: boolean } {
  if (width < 3 || height < 3) {
    return { tenengrad: 0, hEnergy: 0, vEnergy: 0, motionLikely: false };
  }

  let hEnergy = 0;
  let vEnergy = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const r0 = (y - 1) * width;
    const r1 = y * width;
    const r2 = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      // Sobel horizontal gradient
      const gx =
        -gray[r0 + x - 1] +
        gray[r0 + x + 1] -
        2 * gray[r1 + x - 1] +
        2 * gray[r1 + x + 1] -
        gray[r2 + x - 1] +
        gray[r2 + x + 1];

      // Sobel vertical gradient
      const gy =
        -gray[r0 + x - 1] -
        2 * gray[r0 + x] -
        gray[r0 + x + 1] +
        gray[r2 + x - 1] +
        2 * gray[r2 + x] +
        gray[r2 + x + 1];

      hEnergy += gx * gx;
      vEnergy += gy * gy;
      count++;
    }
  }

  if (count === 0) {
    return { tenengrad: 0, hEnergy: 0, vEnergy: 0, motionLikely: false };
  }

  const tenengrad = (hEnergy + vEnergy) / count;

  // Imbalance between horizontal and vertical gradient energy indicates directional motion blur
  const maxE = Math.max(hEnergy, vEnergy);
  const minE = Math.min(hEnergy, vEnergy);
  const ratio = (maxE + 1.0) / (minE + 1.0);
  const motionLikely = ratio > motionRatioThreshold && tenengrad > 15;

  return { tenengrad, hEnergy, vEnergy, motionLikely };
}

/**
 * Computes mean luminance, contrast (std dev), dark fraction (< 30) and bright fraction (> 230).
 */
export function computePhotometrics(
  gray: Float32Array,
  width: number,
  height: number
): {
  brightness: number;
  contrast: number;
  darkFraction: number;
  brightFraction: number;
} {
  const count = width * height;
  if (count === 0) {
    return { brightness: 0, contrast: 0, darkFraction: 0, brightFraction: 0 };
  }

  let sum = 0;
  let sumSq = 0;
  let darkCount = 0;
  let brightCount = 0;

  for (let i = 0; i < count; i++) {
    const val = gray[i];
    sum += val;
    sumSq += val * val;
    if (val < 30) darkCount++;
    if (val > 230) brightCount++;
  }

  const brightness = sum / count;
  const variance = Math.max(0, sumSq / count - brightness * brightness);
  const contrast = Math.sqrt(variance);

  return {
    brightness,
    contrast,
    darkFraction: darkCount / count,
    brightFraction: brightCount / count,
  };
}

/**
 * Immerkaer fast noise standard deviation estimator.
 * Kernel:
 * [  1, -2,  1 ]
 * [ -2,  4, -2 ]
 * [  1, -2,  1 ]
 */
export function computeImmerkaerNoise(
  gray: Float32Array,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) return 0;

  let sumAbs = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const r0 = (y - 1) * width;
    const r1 = y * width;
    const r2 = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const val =
        gray[r0 + x - 1] -
        2 * gray[r0 + x] +
        gray[r0 + x + 1] -
        2 * gray[r1 + x - 1] +
        4 * gray[r1 + x] -
        2 * gray[r1 + x + 1] +
        gray[r2 + x - 1] -
        2 * gray[r2 + x] +
        gray[r2 + x + 1];

      sumAbs += Math.abs(val);
      count++;
    }
  }

  if (count === 0) return 0;
  // Standard factor: sqrt(pi / 2) / (6 * (W - 2) * (H - 2))
  const factor = Math.sqrt(Math.PI / 2) / 6.0;
  return (factor * sumAbs) / count;
}

/**
 * Detects glare: near-white specular highlights with low saturation (Y > 235, Saturation < 0.2).
 */
export function computeGlareFraction(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): number {
  const count = width * height;
  if (count === 0) return 0;

  let glareCount = 0;

  for (let i = 0, j = 0; i < count; i++, j += 4) {
    const r = rgba[j];
    const g = rgba[j + 1];
    const b = rgba[j + 2];

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > 235) {
      const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;
      if (saturation < 0.2) {
        glareCount++;
      }
    }
  }

  return glareCount / count;
}

/**
 * Estimates share of leaf vegetation in the central 50% region of the frame.
 */
export function computeLeafCoverage(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): number {
  if (width <= 0 || height <= 0) return 0;

  const startX = Math.floor(width * 0.25);
  const endX = Math.floor(width * 0.75);
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.75);

  let leafPixels = 0;
  let totalCenterPixels = 0;

  for (let y = startY; y < endY; y++) {
    const rowOffset = y * width * 4;
    for (let x = startX; x < endX; x++) {
      const idx = rowOffset + x * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];

      // Green vegetation color dominance check
      const isGreenDominant = g > r * 1.04 && g > b * 1.04 && g > 35;

      // Leaf lesion/foliage yellowish-green in HSV
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const delta = maxC - minC;
      let hue = 0;
      if (delta > 0) {
        if (maxC === r) hue = ((g - b) / delta) % 6;
        else if (maxC === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
      }

      const isFoliageHue = hue >= 40 && hue <= 175 && g > 30;

      if (isGreenDominant || isFoliageHue) {
        leafPixels++;
      }
      totalCenterPixels++;
    }
  }

  return totalCenterPixels > 0 ? leafPixels / totalCenterPixels : 0;
}

/**
 * Evaluates full QualityReport and generates actionable plain-language farmer hints.
 */
export function evaluateQualityVerdict(
  report: Omit<QualityReport, 'verdict' | 'hints'>,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): { verdict: QualityVerdict; hints: string[] } {
  const hints: string[] = [];
  let isRetake = false;
  let isEnhance = false;

  // 1. Blur Check
  if (report.blur < config.blur.retakeThreshold || report.tenengrad < config.tenengrad.retakeThreshold) {
    isRetake = true;
    if (report.motionLikely) {
      hints.push('Hold steady — leaf photo has motion blur.');
    } else {
      hints.push('Photo is blurry — tap screen to focus on the leaf.');
    }
  } else if (
    report.blur < config.blur.enhanceThreshold ||
    report.tenengrad < config.tenengrad.enhanceThreshold
  ) {
    isEnhance = true;
    hints.push('Mild blur detected — detail enhancement recommended.');
  }

  // 2. Brightness & Dark Check
  if (
    report.brightness < config.brightness.minLuminance ||
    report.darkFraction > config.brightness.maxDarkFraction
  ) {
    isRetake = true;
    hints.push('Too dark — move into brighter daylight or remove heavy shadows.');
  } else if (
    report.brightness < (config.brightness.enhanceMinLuminance ?? 75) ||
    report.contrast < (config.contrast.enhanceMinStdDev ?? 32)
  ) {
    isEnhance = true;
    hints.push('Slightly dim lighting — brightness auto-levels recommended.');
  }

  // 3. Glare Check
  if (
    report.brightness > config.brightness.maxLuminance ||
    report.glare > config.glare.maxGlareFraction
  ) {
    isRetake = true;
    hints.push('Excessive glare on leaf — angle phone away from direct reflection.');
  }

  // 4. Leaf Coverage Check
  if (report.coverage < config.coverage.minCoverage) {
    isRetake = true;
    hints.push('Leaf is not centered — bring the camera closer to fill the box.');
  }

  // 5. Noise Check
  if (report.noise > config.noise.maxNoise) {
    hints.push('High camera sensor noise — ensure even lighting.');
  }

  let verdict: QualityVerdict = 'pass';
  if (isRetake) {
    verdict = 'retake';
  } else if (isEnhance) {
    verdict = 'enhance';
  } else {
    verdict = 'pass';
    hints.push('Good quality photo — ready for analysis.');
  }

  return { verdict, hints };
}

/**
 * Standardize any ImageBitmap or ImageData to a 256x256 ImageData buffer for analysis.
 */
export async function getAnalysisImageData(
  source: ImageBitmap | ImageData,
  targetSize: number = ANALYSIS_SIZE
): Promise<ImageData> {
  if (source instanceof ImageData && source.width === targetSize && source.height === targetSize) {
    return source;
  }

  // In Node test environments where document/canvas is mocked or not present
  if (typeof document === 'undefined') {
    if (source instanceof ImageData) return source;
    throw new Error('Canvas not available in non-DOM environment');
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context for quality analysis.');
  }

  if (source instanceof ImageData) {
    // Put and scale via intermediate canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = source.width;
    tempCanvas.height = source.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx?.putImageData(source, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, targetSize, targetSize);
  } else {
    // Center crop square and resize to targetSize
    const { width, height } = source;
    const cropSize = Math.min(width, height);
    const startX = Math.floor((width - cropSize) / 2);
    const startY = Math.floor((height - cropSize) / 2);

    ctx.drawImage(source, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);
  }

  return ctx.getImageData(0, 0, targetSize, targetSize);
}

/**
 * Full Quality Analysis on 256px resolution-independent buffer per AGENTS.md Section 6.
 */
export async function analyzeQuality(
  image: ImageBitmap | ImageData,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): Promise<QualityReport> {
  const analysisData = await getAnalysisImageData(image, ANALYSIS_SIZE);
  const { width, height, data } = analysisData;

  const gray = computeGrayscale(data, width, height);

  const blur = computeLaplacianVariance(gray, width, height);
  const { tenengrad, motionLikely } = computeTenengradAndMotion(
    gray,
    width,
    height,
    config.motionRatioThreshold
  );

  const photometrics = computePhotometrics(gray, width, height);
  const noise = computeImmerkaerNoise(gray, width, height);
  const glare = computeGlareFraction(data, width, height);
  const coverage = computeLeafCoverage(data, width, height);

  const partialReport = {
    blur,
    tenengrad,
    brightness: photometrics.brightness,
    contrast: photometrics.contrast,
    darkFraction: photometrics.darkFraction,
    brightFraction: photometrics.brightFraction,
    noise,
    glare,
    coverage,
    motionLikely,
  };

  const { verdict, hints } = evaluateQualityVerdict(partialReport, config);

  return {
    ...partialReport,
    verdict,
    hints,
  };
}

/**
 * Lightweight quality check for 160x160 live preview running ~5 fps.
 */
export function analyzePreviewQuality(
  imageData: ImageData,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): { sharp: boolean; bright: boolean; hints: string[] } {
  const { width, height, data } = imageData;
  const gray = computeGrayscale(data, width, height);

  const photometrics = computePhotometrics(gray, width, height);
  const blur = computeLaplacianVariance(gray, width, height);

  const sharp = blur >= config.blur.retakeThreshold * 0.7; // Relaxed for live motion
  const bright =
    photometrics.brightness >= config.brightness.minLuminance &&
    photometrics.brightness <= config.brightness.maxLuminance;

  const hints: string[] = [];
  if (!bright) {
    if (photometrics.brightness < config.brightness.minLuminance) {
      hints.push('Move into better light');
    } else {
      hints.push('Too bright / direct glare');
    }
  } else if (!sharp) {
    hints.push('Hold steady');
  }

  return { sharp, bright, hints };
}
