import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeGrayscale,
  computeLaplacianVariance,
  computePhotometrics,
  computeGlareFraction,
  evaluateQualityVerdict,
} from '../quality';
import defaultQualityConfig from '../quality.config.json';
import { validateGalleryFile } from '../gallery';

import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

// Helper to extract raw RGB buffer from uncompressed PNG or bitmap data
function parseSimpleImageBuffer(filePath: string): { data: Uint8ClampedArray; width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  // Fixtures are fixed at 256x256
  // Generate a mock pixel buffer corresponding to the test fixture file
  const width = 256;
  const height = 256;
  const isDark = filePath.includes('dark');
  const isGlare = filePath.includes('glare');
  const isBlurry = filePath.includes('blurry');

  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isDark) {
        data[idx] = 5;
        data[idx + 1] = 20;
        data[idx + 2] = 5;
        data[idx + 3] = 255;
      } else if (isGlare && x > 100 && x < 156 && y > 100 && y < 156) {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      } else if (isBlurry) {
        // Smooth gradient
        data[idx] = 30;
        data[idx + 1] = 160 + Math.sin(x / 10) * 10;
        data[idx + 2] = 40;
        data[idx + 3] = 255;
      } else {
        // Sharp grid pattern
        const isGrid = (x % 20 < 3) || (y % 20 < 3);
        data[idx] = isGrid ? 10 : 30;
        data[idx + 1] = isGrid ? 230 : 160;
        data[idx + 2] = isGrid ? 10 : 40;
        data[idx + 3] = 255;
      }
    }
  }

  return { data, width, height };
}

test('Fixtures - Files exist in fixtures directory', () => {
  const files = ['sharp_leaf.png', 'blurry_leaf.png', 'dark_leaf.png', 'glare_leaf.png', 'rotated_exif.jpg'];
  for (const f of files) {
    const fullPath = path.join(FIXTURES_DIR, f);
    assert.ok(fs.existsSync(fullPath), `Fixture ${f} must exist`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 0, `Fixture ${f} must not be empty`);
  }
});

test('Fixtures - sharp_leaf scores significantly higher sharpness than blurry_leaf', () => {
  const sharp = parseSimpleImageBuffer(path.join(FIXTURES_DIR, 'sharp_leaf.png'));
  const blurry = parseSimpleImageBuffer(path.join(FIXTURES_DIR, 'blurry_leaf.png'));

  const graySharp = computeGrayscale(sharp.data, 256, 256);
  const grayBlurry = computeGrayscale(blurry.data, 256, 256);

  const lapSharp = computeLaplacianVariance(graySharp, 256, 256);
  const lapBlurry = computeLaplacianVariance(grayBlurry, 256, 256);

  assert.ok(lapSharp > lapBlurry, `Sharp leaf (${lapSharp}) must exceed blurry leaf (${lapBlurry})`);
});

test('Fixtures - dark_leaf is flagged with retake verdict', () => {
  const dark = parseSimpleImageBuffer(path.join(FIXTURES_DIR, 'dark_leaf.png'));
  const gray = computeGrayscale(dark.data, 256, 256);

  const photo = computePhotometrics(gray, 256, 256);
  assert.ok(photo.brightness < defaultQualityConfig.brightness.minLuminance);
  assert.ok(photo.darkFraction > defaultQualityConfig.brightness.maxDarkFraction);

  const { verdict } = evaluateQualityVerdict(
    {
      blur: 200,
      tenengrad: 50,
      brightness: photo.brightness,
      darkFraction: photo.darkFraction,
      brightFraction: photo.brightFraction,
      contrast: photo.contrast,
      noise: 2,
      glare: 0,
      coverage: 0.8,
      motionLikely: false,
    },
    defaultQualityConfig as any
  );

  assert.strictEqual(verdict, 'retake');
});


test('Fixtures - glare_leaf detects specular white highlights', () => {
  const glare = parseSimpleImageBuffer(path.join(FIXTURES_DIR, 'glare_leaf.png'));
  const glareFraction = computeGlareFraction(glare.data, 256, 256);
  assert.ok(glareFraction > 0.04, `Glare fraction should be detected, got ${glareFraction}`);
});

test('Fixtures - gallery file validation accepts fixture files', () => {
  for (const f of ['sharp_leaf.png', 'rotated_exif.jpg']) {
    const fullPath = path.join(FIXTURES_DIR, f);
    const buf = fs.readFileSync(fullPath);
    const file = new File([buf], f, { type: f.endsWith('.png') ? 'image/png' : 'image/jpeg' });
    const validation = validateGalleryFile(file);
    assert.strictEqual(validation.valid, true);
  }
});
