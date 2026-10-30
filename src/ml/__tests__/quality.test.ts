import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGrayscale,
  computeLaplacianVariance,
  computeTenengradAndMotion,
  computePhotometrics,
  computeImmerkaerNoise,
  computeGlareFraction,
  computeLeafCoverage,
  evaluateQualityVerdict,
} from '../quality.js';
import { QualityConfig } from '../types.js';

// Helper: generate synthetic sharp checkerboard
function createCheckerboard(width: number, height: number, size: number = 8): Float32Array {
  const buf = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isWhite = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
      buf[y * width + x] = isWhite ? 255 : 0;
    }
  }
  return buf;
}

// Helper: box blur a grayscale buffer
function boxBlur(gray: Float32Array, width: number, height: number, radius: number): Float32Array {
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += gray[ny * width + nx];
            count++;
          }
        }
      }
      out[y * width + x] = sum / count;
    }
  }
  return out;
}

// Helper: create RGBA buffer with constant or pattern colors
function createRgbaBuffer(width: number, height: number, r: number, g: number, b: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  }
  return buf;
}

const testConfig: QualityConfig = {
  blur: { retakeThreshold: 80, enhanceThreshold: 180 },
  tenengrad: { retakeThreshold: 60, enhanceThreshold: 130 },
  brightness: { minLuminance: 45, maxLuminance: 215, enhanceMinLuminance: 75, maxDarkFraction: 0.4, maxBrightFraction: 0.35 },
  contrast: { minStdDev: 22, enhanceMinStdDev: 32 },
  noise: { maxNoise: 14 },
  glare: { maxGlareFraction: 0.15 },
  coverage: { minCoverage: 0.2 },
  motionRatioThreshold: 2.2,
  enhancement: { enabled: false, unsharpRadius: 1, unsharpAmount: 0.7, targetLuminance: 128, gamma: 0.9 },
};

test('Quality Analysis - Sharp checkerboard scores higher blur & tenengrad than blurred copies', () => {
  const w = 64;
  const h = 64;
  const sharp = createCheckerboard(w, h, 8);
  const blurR1 = boxBlur(sharp, w, h, 1);
  const blurR2 = boxBlur(sharp, w, h, 2);
  const blurR4 = boxBlur(sharp, w, h, 4);

  const sharpLap = computeLaplacianVariance(sharp, w, h);
  const blur1Lap = computeLaplacianVariance(blurR1, w, h);
  const blur2Lap = computeLaplacianVariance(blurR2, w, h);
  const blur4Lap = computeLaplacianVariance(blurR4, w, h);

  // Monotonic blur decrease check
  assert.ok(sharpLap > blur1Lap, `Sharp (${sharpLap}) must be greater than blur 1 (${blur1Lap})`);
  assert.ok(blur1Lap > blur2Lap, `Blur 1 (${blur1Lap}) must be greater than blur 2 (${blur2Lap})`);
  assert.ok(blur2Lap > blur4Lap, `Blur 2 (${blur2Lap}) must be greater than blur 4 (${blur4Lap})`);

  const sharpTen = computeTenengradAndMotion(sharp, w, h).tenengrad;
  const blurTen = computeTenengradAndMotion(blurR4, w, h).tenengrad;
  assert.ok(sharpTen > blurTen, `Tenengrad of sharp (${sharpTen}) must exceed blurred (${blurTen})`);
});

test('Quality Analysis - Motion blur detector catches directional gradient imbalance', () => {
  const w = 64;
  const h = 64;
  const hStreak = new Float32Array(w * h);

  // Horizontal bands of width 4: creates strong vertical edges with zero horizontal change
  for (let y = 0; y < h; y++) {
    const val = Math.floor(y / 4) % 2 === 0 ? 255 : 0;
    for (let x = 0; x < w; x++) {
      hStreak[y * w + x] = val;
    }
  }

  const { motionLikely } = computeTenengradAndMotion(hStreak, w, h, 2.2);
  assert.equal(motionLikely, true);
});

test('Quality Analysis - Photometrics correctly detects dark, bright, and low-contrast images', () => {
  const w = 64;
  const h = 64;

  // Dark image
  const darkBuf = new Float32Array(w * h).fill(20);
  const darkPhoto = computePhotometrics(darkBuf, w, h);
  assert.equal(darkPhoto.brightness, 20);
  assert.equal(darkPhoto.darkFraction, 1.0);
  assert.equal(darkPhoto.contrast, 0);

  // Bright image
  const brightBuf = new Float32Array(w * h).fill(240);
  const brightPhoto = computePhotometrics(brightBuf, w, h);
  assert.equal(brightPhoto.brightness, 240);
  assert.equal(brightPhoto.brightFraction, 1.0);
});

test('Quality Analysis - Immerkaer noise estimator differentiates noisy vs clean surfaces', () => {
  const w = 64;
  const h = 64;

  const clean = new Float32Array(w * h).fill(128);
  const cleanNoise = computeImmerkaerNoise(clean, w, h);
  assert.ok(cleanNoise < 1.0, `Clean flat surface noise must be near 0, got ${cleanNoise}`);

  // 2D pseudo-random noise distribution
  const noisy = new Float32Array(w * h);
  let seed = 12345;
  for (let i = 0; i < noisy.length; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const rnd = (seed / 4294967296) * 50 - 25; // [-25, 25] noise
    noisy[i] = Math.min(255, Math.max(0, 128 + rnd));
  }
  const noisyEst = computeImmerkaerNoise(noisy, w, h);
  assert.ok(noisyEst > 10.0, `Noisy pattern noise must exceed 10, got ${noisyEst}`);
});

test('Quality Analysis - Glare detection flags high luminance low saturation regions', () => {
  const w = 32;
  const h = 32;

  // Pure white specular glare (lum = 255, saturation = 0)
  const glareRgba = createRgbaBuffer(w, h, 255, 255, 255);
  const glareFrac = computeGlareFraction(glareRgba, w, h);
  assert.equal(glareFrac, 1.0);

  // Saturated green leaf (lum ~ 150, saturation = 1.0)
  const greenRgba = createRgbaBuffer(w, h, 20, 180, 20);
  const greenGlare = computeGlareFraction(greenRgba, w, h);
  assert.equal(greenGlare, 0.0);
});

test('Quality Analysis - Leaf coverage estimates vegetation color in center region', () => {
  const w = 64;
  const h = 64;

  // Fully green foliage
  const leafRgba = createRgbaBuffer(w, h, 40, 160, 40);
  const coverage = computeLeafCoverage(leafRgba, w, h);
  assert.ok(coverage > 0.95, `Full green should give high coverage, got ${coverage}`);

  // Dark soil/wood brown (r: 100, g: 60, b: 30)
  const soilRgba = createRgbaBuffer(w, h, 100, 60, 30);
  const soilCoverage = computeLeafCoverage(soilRgba, w, h);
  assert.ok(soilCoverage < 0.1, `Soil brown should give near-zero leaf coverage, got ${soilCoverage}`);
});

test('Quality Analysis - Verdict logic flags retake on severe blur, darkness, or glare', () => {
  // Severe blur
  const blurryReport = {
    blur: 30,
    tenengrad: 25,
    brightness: 120,
    contrast: 40,
    darkFraction: 0.05,
    brightFraction: 0.05,
    noise: 3,
    glare: 0.01,
    coverage: 0.8,
    motionLikely: false,
  };
  const res1 = evaluateQualityVerdict(blurryReport, testConfig);
  assert.equal(res1.verdict, 'retake');
  assert.match(res1.hints[0], /blurry/i);

  // Severe darkness
  const darkReport = { ...blurryReport, blur: 250, tenengrad: 200, brightness: 25, darkFraction: 0.6 };
  const res2 = evaluateQualityVerdict(darkReport, testConfig);
  assert.equal(res2.verdict, 'retake');
  assert.match(res2.hints[0], /dark/i);

  // Borderline photo -> enhance
  const borderlineReport = { ...blurryReport, blur: 120, tenengrad: 90 };
  const res3 = evaluateQualityVerdict(borderlineReport, testConfig);
  assert.equal(res3.verdict, 'enhance');

  // Good photo -> pass
  const goodReport = { ...blurryReport, blur: 300, tenengrad: 250, brightness: 130, contrast: 50 };
  const res4 = evaluateQualityVerdict(goodReport, testConfig);
  assert.equal(res4.verdict, 'pass');
});
