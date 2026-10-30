import test from 'node:test';
import assert from 'node:assert';
import {
  normalizePixelsToNCHW,
  DEFAULT_IMAGENET_MEAN,
  DEFAULT_IMAGENET_STD,
} from '../preprocess';
import {
  computeSoftmax,
  computeNormalizedEntropy,
  decideResult,
  DEFAULT_MODEL_CONFIG,
} from '../decide';
import { QualityReport } from '../types';

const mockPassQuality: QualityReport = {
  blur: 150.0,
  tenengrad: 25.0,
  brightness: 120.0,
  darkFraction: 0.02,
  brightFraction: 0.01,
  contrast: 55.0,
  noise: 3.5,
  glare: 0.01,
  coverage: 0.75,
  motionLikely: false,
  verdict: 'pass',
  hints: [],
};

const mockRetakeQuality: QualityReport = {
  ...mockPassQuality,
  blur: 25.0,
  verdict: 'retake',
  hints: ['Photo is too blurry. Hold steady.'],
};

const testLabels = ['early_blight', 'late_blight', 'healthy', 'unknown'];

test('Preprocess - normalizePixelsToNCHW produces exact planar NCHW shape and ImageNet values', () => {
  const width = 2;
  const height = 2;
  const planeSize = width * height;

  // 4 pixels:
  // p0: R=255, G=0,   B=0,   A=255
  // p1: R=0,   G=255, B=0,   A=255
  // p2: R=0,   G=0,   B=255, A=255
  // p3: R=128, G=128, B=128, A=255
  const rgba = new Uint8ClampedArray([
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
    128, 128, 128, 255,
  ]);

  const tensor = normalizePixelsToNCHW(rgba, width, height);

  assert.strictEqual(tensor.length, 3 * planeSize);

  // Check pixel 0 Red channel: value = 255/255 = 1.0 -> (1.0 - 0.485) / 0.229 = 2.2489...
  const expectedP0Red = (1.0 - DEFAULT_IMAGENET_MEAN[0]) / DEFAULT_IMAGENET_STD[0];
  assert.ok(Math.abs(tensor[0] - expectedP0Red) < 1e-4);

  // Check pixel 1 Green channel (index planeSize + 1): value = 255/255 = 1.0
  const expectedP1Green = (1.0 - DEFAULT_IMAGENET_MEAN[1]) / DEFAULT_IMAGENET_STD[1];
  assert.ok(Math.abs(tensor[planeSize + 1] - expectedP1Green) < 1e-4);

  // Check pixel 2 Blue channel (index 2*planeSize + 2): value = 255/255 = 1.0
  const expectedP2Blue = (1.0 - DEFAULT_IMAGENET_MEAN[2]) / DEFAULT_IMAGENET_STD[2];
  assert.ok(Math.abs(tensor[2 * planeSize + 2] - expectedP2Blue) < 1e-4);
});

test('Decide - computeSoftmax normalizes distribution and temperature affects sharpness', () => {
  const logits = [3.0, 1.0, 0.5, -1.0];

  const sharpProbs = computeSoftmax(logits, 0.5);
  const baseProbs = computeSoftmax(logits, 1.0);
  const flatProbs = computeSoftmax(logits, 2.0);

  // All must sum to 1.0
  const sumBase = baseProbs.reduce((acc, p) => acc + p, 0);
  assert.ok(Math.abs(sumBase - 1.0) < 1e-5);

  // Sharp (low T) must give higher probability to top class than flat (high T)
  assert.ok(sharpProbs[0] > baseProbs[0]);
  assert.ok(baseProbs[0] > flatProbs[0]);
});

test('Decide - computeNormalizedEntropy scales strictly between 0 and 1', () => {
  // Deterministic 100% confidence
  const deterministic = [1.0, 0.0, 0.0, 0.0];
  const zeroEntropy = computeNormalizedEntropy(deterministic);
  assert.ok(Math.abs(zeroEntropy - 0.0) < 1e-5);

  // Completely uniform distribution (maximum uncertainty)
  const uniform = [0.25, 0.25, 0.25, 0.25];
  const maxEntropy = computeNormalizedEntropy(uniform);
  assert.ok(Math.abs(maxEntropy - 1.0) < 1e-5);
});

test('Decide - Poor Quality Gate returns poor_quality and skips inference on retake', () => {
  const result = decideResult({
    logits: [5.0, 1.0, 0.0, -1.0],
    labels: testLabels,
    quality: mockRetakeQuality,
    scanAnyway: false,
  });

  assert.strictEqual(result.status, 'poor_quality');
  assert.strictEqual(result.top3.length, 0);
});

test('Decide - scanAnyway overrides poor_quality gate', () => {
  const result = decideResult({
    logits: [5.0, 1.0, 0.0, -1.0],
    labels: testLabels,
    quality: mockRetakeQuality,
    scanAnyway: true,
  });

  assert.strictEqual(result.status, 'confident');
  assert.strictEqual(result.top3[0].label, 'early_blight');
});

test('Decide - Unknown class top prediction triggers status unknown', () => {
  // unknown class is index 3
  const logits = [0.0, 0.0, 0.0, 5.0];
  const result = decideResult({
    logits,
    labels: testLabels,
    quality: mockPassQuality,
  });

  assert.strictEqual(result.status, 'unknown');
  assert.strictEqual(result.top3[0].label, 'unknown');
});

test('Decide - Low confidence triggers status uncertain', () => {
  // Logits producing top prob < minConf (0.55)
  const logits = [0.8, 0.7, 0.5, 0.2];
  const result = decideResult({
    logits,
    labels: testLabels,
    quality: mockPassQuality,
  });

  assert.strictEqual(result.status, 'uncertain');
  assert.strictEqual(result.needsSecondPhoto, true);
});

test('Decide - Small margin triggers status uncertain', () => {
  // Logits with p1 ~ 0.52 and p2 ~ 0.45 (margin < 0.15)
  const logits = [1.2, 1.1, 0.0, 0.0];
  const result = decideResult({
    logits,
    labels: testLabels,
    quality: mockPassQuality,
  });

  assert.strictEqual(result.status, 'uncertain');
  assert.strictEqual(result.needsSecondPhoto, true);
});

test('Decide - Confident diagnosis when all thresholds pass', () => {
  // High confidence top class
  const logits = [4.5, 0.5, 0.2, -0.5];
  const result = decideResult({
    logits,
    labels: testLabels,
    quality: mockPassQuality,
  });

  assert.strictEqual(result.status, 'confident');
  assert.strictEqual(result.top3[0].label, 'early_blight');
  assert.ok(result.top3[0].prob > 0.85);
  assert.strictEqual(result.needsSecondPhoto, false);
  assert.ok(result.severity !== undefined);
});
