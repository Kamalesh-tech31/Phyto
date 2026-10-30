/**
 * Mild, strictly color-safe enhancement for borderline photos.
 *
 * Per AGENTS.md Section 6:
 * - "Enhancement is allowed ONLY for borderline photos and must be mild and colour-safe,
 *    because lesion colour is diagnostic:
 *    - Mild blur: unsharp mask (radius about 1 px, amount 0.5 to 1.0).
 *    - Dark or low contrast: gamma correction plus percentile (auto-levels) stretch
 *      applied to luminance only.
 *    - Do NOT boost saturation, shift hue or apply heavy denoising.
 *    - Severe problems mean 'retake', never silent fixing.
 *    - Mark the result enhanced: true. Keep the original ImageBitmap too.
 *    - Hand-written canvas/typed-array code with zero OpenCV.js."
 */

import { EnhanceResult, QualityReport, QualityConfig } from './types';
import defaultQualityConfig from './quality.config.json';

/**
 * Applies unsharp mask detail enhancement strictly on the luminance channel.
 * High-frequency luminance details are amplified and RGB channels are scaled proportionately,
 * maintaining an exact 0% hue and saturation shift.
 */
export function applyUnsharpMaskLuminance(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number = 0.7
): Uint8ClampedArray {
  const count = width * height;
  const out = new Uint8ClampedArray(rgba.length);

  // 1. Compute original luminance Y for each pixel
  const gray = new Float32Array(count);
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    gray[i] = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
  }

  // 2. 3x3 Gaussian-weighted smoothing kernel [1 2 1; 2 4 2; 1 2 1] / 16 (radius ~ 1px)
  for (let y = 0; y < height; y++) {
    const r0 = Math.max(0, y - 1) * width;
    const r1 = y * width;
    const r2 = Math.min(height - 1, y + 1) * width;

    for (let x = 0; x < width; x++) {
      const c0 = Math.max(0, x - 1);
      const c1 = x;
      const c2 = Math.min(width - 1, x + 1);

      const smoothY =
        (gray[r0 + c0] + 2 * gray[r0 + c1] + gray[r0 + c2] +
         2 * gray[r1 + c0] + 4 * gray[r1 + c1] + 2 * gray[r1 + c2] +
         gray[r2 + c0] + 2 * gray[r2 + c1] + gray[r2 + c2]) / 16.0;

      const origY = gray[r1 + c1];
      const detail = origY - smoothY;

      // Enhance luminance
      const newY = Math.min(255, Math.max(0, origY + amount * detail));

      const idx = (r1 + c1) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];

      if (origY > 0.5) {
        // Scale RGB channels proportionately by luminance delta to preserve chromaticity
        const s = newY / origY;
        out[idx] = Math.min(255, Math.max(0, Math.round(r * s)));
        out[idx + 1] = Math.min(255, Math.max(0, Math.round(g * s)));
        out[idx + 2] = Math.min(255, Math.max(0, Math.round(b * s)));
      } else {
        out[idx] = r;
        out[idx + 1] = g;
        out[idx + 2] = b;
      }
      out[idx + 3] = rgba[idx + 3]; // Preserve alpha
    }
  }

  return out;
}

/**
 * Applies luminance-only percentile stretch (auto-levels) and mild gamma correction.
 * Operates purely on luminance so leaf lesion colors are never shifted.
 */
export function applyLuminanceStretch(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  gamma: number = 0.9,
  strength: number = 0.8
): Uint8ClampedArray {
  const count = width * height;
  const out = new Uint8ClampedArray(rgba.length);

  // 1. Build luminance histogram
  const hist = new Int32Array(256);
  const gray = new Float32Array(count);
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    const y = 0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2];
    gray[i] = y;
    hist[Math.min(255, Math.max(0, Math.round(y)))]++;
  }

  // 2. Find 1st and 99th percentiles
  const p1Count = Math.floor(count * 0.01);
  const p99Count = Math.floor(count * 0.99);
  let cumulative = 0;
  let pLow = 0;
  let pHigh = 255;

  for (let b = 0; b < 256; b++) {
    cumulative += hist[b];
    if (pLow === 0 && cumulative >= p1Count) {
      pLow = b;
    }
    if (cumulative >= p99Count) {
      pHigh = b;
      break;
    }
  }

  const range = pHigh - pLow;
  if (range < 10) {
    // Insufficient contrast range to stretch safely
    out.set(rgba);
    return out;
  }

  // 3. Precompute lookup table for performance
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const normalized = Math.min(1.0, Math.max(0.0, (i - pLow) / range));
    const corrected = Math.pow(normalized, gamma);
    const target = corrected * 255.0;
    // Blend with original value based on strength
    lut[i] = (1.0 - strength) * i + strength * target;
  }

  // 4. Apply stretch to RGB preserving exact chromaticity
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    const origY = gray[i];
    const newY = lut[Math.min(255, Math.max(0, Math.round(origY)))];

    const r = rgba[j];
    const g = rgba[j + 1];
    const b = rgba[j + 2];

    if (origY > 0.5) {
      const s = newY / origY;
      out[j] = Math.min(255, Math.max(0, Math.round(r * s)));
      out[j + 1] = Math.min(255, Math.max(0, Math.round(g * s)));
      out[j + 2] = Math.min(255, Math.max(0, Math.round(b * s)));
    } else {
      out[j] = r;
      out[j + 1] = g;
      out[j + 2] = b;
    }
    out[j + 3] = rgba[j + 3];
  }

  return out;
}

/**
 * Mild, strictly color-safe enhancement for borderline photos.
 * Conforms to AGENTS.md Section 6.
 *
 * Rules:
 * - Only runs when report.verdict === 'enhance'.
 * - Severe problems (verdict === 'retake') are NEVER silently altered.
 * - Leaves original ImageBitmap intact and returns the enhanced copy.
 */
export async function enhance(
  bitmap: ImageBitmap,
  report: QualityReport,
  config: QualityConfig = defaultQualityConfig as QualityConfig
): Promise<EnhanceResult> {
  const applied: string[] = [];

  // Severe defects are never silently altered per AGENTS.md Section 6
  if (report.verdict !== 'enhance') {
    return { bitmap, applied };
  }

  // Check config flag
  if (!config.enhancement.enabled) {
    return { bitmap, applied };
  }

  // In non-DOM test environments where canvas is unavailable
  if (typeof document === 'undefined') {
    return { bitmap, applied };
  }

  const { width, height } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2d canvas context for enhancement');
  }

  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  let pixelData: Uint8ClampedArray<ArrayBufferLike> = imageData.data;

  // 1. Mild blur: apply unsharp mask
  const isMildBlur =
    report.blur < config.blur.enhanceThreshold &&
    report.blur >= config.blur.retakeThreshold &&
    !report.motionLikely;

  if (isMildBlur) {
    const amount = config.enhancement.unsharpAmount ?? 0.7;
    pixelData = applyUnsharpMaskLuminance(pixelData, width, height, amount);
    applied.push('unsharp_mask');
  }

  // 2. Dark or low contrast: apply luminance stretch & gamma
  const isBorderlineLighting =
    report.brightness < (config.brightness.enhanceMinLuminance ?? 75) ||
    report.contrast < (config.contrast.enhanceMinStdDev ?? 32);

  if (isBorderlineLighting) {
    const gamma = config.enhancement.gamma ?? 0.9;
    const strength = config.enhancement.strength ?? 0.8;
    pixelData = applyLuminanceStretch(pixelData, width, height, gamma, strength);
    applied.push('luminance_stretch');
  }

  if (applied.length === 0) {
    return { bitmap, applied };
  }

  // Render enhanced pixel data to new canvas and export bitmap
  const enhancedImageData = ctx.createImageData(width, height);
  enhancedImageData.data.set(pixelData);
  ctx.putImageData(enhancedImageData, 0, 0);
  const enhancedBitmap = await createImageBitmap(canvas);

  return {
    bitmap: enhancedBitmap,
    applied,
  };
}
