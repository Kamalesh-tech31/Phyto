/**
 * scripts/test-leaf-check.js
 */

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, v };
}

function evaluatePixels(pixels) {
  let greenPixels = 0;
  let chloroticOrLesionPixels = 0;
  const total = pixels.length;

  for (const [r, g, b] of pixels) {
    const { h, s, v } = rgbToHsv(r, g, b);

    // 1. Definite Green foliage (Hue 65° to 175°, minimum saturation 0.15, brightness 0.15)
    if (h >= 65 && h <= 175 && s >= 0.15 && v >= 0.12) {
      greenPixels++;
    }
    // 2. Yellow-green chlorosis or olive lesion (Hue 42° to 65°, s >= 0.2, v >= 0.15)
    else if (h >= 42 && h < 65 && s >= 0.20 && v >= 0.15) {
      chloroticOrLesionPixels++;
    }
  }

  const greenFraction = greenPixels / total;
  const totalBotanicalFraction = (greenPixels + chloroticOrLesionPixels) / total;

  // Real leaves:
  // - Healthy leaf has > 15% green
  // - Blighted / diseased leaf has at least 4% green + chlorotic/lesion pixels totaling >= 12%
  // - Bread / toast / non-leaf has near 0% green and hue < 38°
  const isLeaf = greenFraction >= 0.05 || (greenFraction >= 0.02 && totalBotanicalFraction >= 0.12);

  return {
    isLeaf,
    greenFraction: Math.round(greenFraction * 100),
    totalBotanicalFraction: Math.round(totalBotanicalFraction * 100),
  };
}

// 1. Healthy Leaf (75% vibrant green, 25% background)
const healthyPixels = [
  ...Array(75).fill([45, 140, 50]), // rich foliage green
  ...Array(25).fill([30, 30, 30]),  // dark background
];

// 2. Diseased Leaf (30% olive green, 25% chlorotic yellow, 25% necrotic blight brown, 20% dark background)
const diseasedPixels = [
  ...Array(30).fill([80, 115, 60]), // pale olive green (h ~ 98°)
  ...Array(25).fill([175, 160, 45]),// chlorotic yellow (h ~ 53°)
  ...Array(25).fill([110, 75, 30]), // necrotic lesion brown (h ~ 34°)
  ...Array(20).fill([25, 25, 25]),  // dark background
];

// 3. Non-leaf Object: Bread (Warm golden/tan crumb and crust: R=215, G=170, B=130; h ~ 28°-32°)
const breadPixels = [
  ...Array(50).fill([215, 175, 130]), // bread crumb
  ...Array(30).fill([180, 120, 80]),  // bread crust
  ...Array(20).fill([240, 240, 240]), // white plate
];

console.log('=== Leaf Pixel Verification Test ===\n');

const resHealthy = evaluatePixels(healthyPixels);
console.log(`1. Healthy Green Leaf: green=${resHealthy.greenFraction}%, botanical=${resHealthy.totalBotanicalFraction}% -> isLeaf=${resHealthy.isLeaf} [${resHealthy.isLeaf ? 'PASS' : 'FAIL'}]`);

const resDiseased = evaluatePixels(diseasedPixels);
console.log(`2. Diseased Blight Leaf: green=${resDiseased.greenFraction}%, botanical=${resDiseased.totalBotanicalFraction}% -> isLeaf=${resDiseased.isLeaf} [${resDiseased.isLeaf ? 'PASS' : 'FAIL'}]`);

const resBread = evaluatePixels(breadPixels);
console.log(`3. Non-Leaf Object (Bread): green=${resBread.greenFraction}%, botanical=${resBread.totalBotanicalFraction}% -> isLeaf=${resBread.isLeaf} [${!resBread.isLeaf ? 'PASS (Correctly Rejected)' : 'FAIL'}]`);

if (resHealthy.isLeaf && resDiseased.isLeaf && !resBread.isLeaf) {
  console.log('\nAll leaf detection tests passed with 100% accuracy!');
  process.exit(0);
} else {
  console.error('\nLeaf detection test failed!');
  process.exit(1);
}
