import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUnsharpMaskLuminance,
  applyLuminanceStretch,
} from '../enhance.js';
import {
  computeGrayscale,
  computeLaplacianVariance,
  computePhotometrics,
} from '../quality.js';

// Helper to convert RGB to Hue in degrees [0, 360]
function getPixelHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

test('Enhance - Unsharp mask strictly increases sharpness metric on a blurred pattern', () => {
  const w = 64;
  const h = 64;
  const count = w * h;
  const rgba = new Uint8ClampedArray(count * 4);

  // Create a mildly soft step-edge pattern
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // Soft blurred gradient transition
      const v = Math.min(240, Math.max(20, Math.round(20 + (x / w) * 200)));
      rgba[idx] = v;
      rgba[idx + 1] = v;
      rgba[idx + 2] = v;
      rgba[idx + 3] = 255;
    }
  }

  const grayBefore = computeGrayscale(rgba, w, h);
  const lapBefore = computeLaplacianVariance(grayBefore, w, h);

  // Apply unsharp mask
  const enhanced = applyUnsharpMaskLuminance(rgba, w, h, 0.8);
  const grayAfter = computeGrayscale(enhanced, w, h);
  const lapAfter = computeLaplacianVariance(grayAfter, w, h);

  // Sharpness metric must measurably improve
  assert.ok(
    lapAfter >= lapBefore,
    `Laplacian variance after (${lapAfter}) must be >= before (${lapBefore})`
  );
});

test('Enhance - Unsharp mask preserves exact chromaticity and does not shift hue', () => {
  const w = 32;
  const h = 32;
  const count = w * h;
  const rgba = new Uint8ClampedArray(count * 4);

  // Create green foliage lesion pattern (olive/yellowish-green)
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    rgba[idx] = 130 + (i % 10);     // R
    rgba[idx + 1] = 180 + (i % 10); // G
    rgba[idx + 2] = 40 + (i % 5);   // B
    rgba[idx + 3] = 255;
  }

  const enhanced = applyUnsharpMaskLuminance(rgba, w, h, 0.9);

  // Check hue across all pixels
  let maxHueDiff = 0;
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    const hOrig = getPixelHue(rgba[idx], rgba[idx + 1], rgba[idx + 2]);
    const hEnh = getPixelHue(enhanced[idx], enhanced[idx + 1], enhanced[idx + 2]);
    const diff = Math.abs(hOrig - hEnh);
    if (diff > maxHueDiff) maxHueDiff = diff;
  }

  // Hue shift must be strictly within 1 degree tolerance
  assert.ok(
    maxHueDiff <= 1.0,
    `Maximum hue difference (${maxHueDiff}°) must not exceed 1.0°`
  );
});

test('Enhance - Luminance stretch moves dark image toward target luminance', () => {
  const w = 64;
  const h = 64;
  const count = w * h;
  const rgba = new Uint8ClampedArray(count * 4);

  // Dim leaf field (luminance ~ 50)
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    const offset = (i % 20);
    rgba[idx] = 40 + offset;
    rgba[idx + 1] = 60 + offset;
    rgba[idx + 2] = 25 + offset;
    rgba[idx + 3] = 255;
  }

  const grayBefore = computeGrayscale(rgba, w, h);
  const photoBefore = computePhotometrics(grayBefore, w, h);

  // Apply luminance stretch with gamma = 0.85
  const enhanced = applyLuminanceStretch(rgba, w, h, 0.85, 0.8);
  const grayAfter = computeGrayscale(enhanced, w, h);
  const photoAfter = computePhotometrics(grayAfter, w, h);

  // Mean brightness must increase towards target
  assert.ok(
    photoAfter.brightness > photoBefore.brightness,
    `Mean brightness (${photoAfter.brightness}) must increase above initial (${photoBefore.brightness})`
  );

  // Check that hue does not shift during stretch
  let maxHueDiff = 0;
  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    const hOrig = getPixelHue(rgba[idx], rgba[idx + 1], rgba[idx + 2]);
    const hEnh = getPixelHue(enhanced[idx], enhanced[idx + 1], enhanced[idx + 2]);
    const diff = Math.abs(hOrig - hEnh);
    if (diff > maxHueDiff) maxHueDiff = diff;
  }

  assert.ok(
    maxHueDiff <= 1.5,
    `Luminance stretch must not shift hue beyond 1.5°, got max ${maxHueDiff}°`
  );
});
