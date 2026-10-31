import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Testing offline bundle and asset availability...');

const requiredFiles = [
  'public/assets/labels.json',
  'public/assets/lang/ui_en.json',
  'public/assets/lang/ui_ta.json',
  'public/assets/lang/ui_hi.json',
  'public/assets/lang/ui_ml.json',
  'public/assets/lang/ui_te.json',
  'public/assets/kb/en.json',
  'public/assets/kb/ta.json',
  'public/assets/kb/hi.json',
  'public/assets/kb/ml.json',
  'public/assets/kb/te.json',
  'public/assets/fonts/noto-sans-tamil.woff2',
  'public/assets/fonts/noto-sans-devanagari.woff2',
  'public/assets/fonts/noto-sans-malayalam.woff2',
  'public/assets/fonts/noto-sans-telugu.woff2',
  'public/assets/fonts/plus-jakarta-sans.woff2',
  'public/assets/fonts/newsreader.woff2',
  'public/sw.js',
  'dist/index.html',
];

let allExist = true;
for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[FAIL] Missing file: ${relPath}`);
    allExist = false;
  } else {
    const stat = fs.statSync(fullPath);
    console.log(`[PASS] ${relPath} (${stat.size} bytes)`);
  }
}

if (!allExist) {
  process.exit(1);
}

// Test service worker precache list
const swContent = fs.readFileSync(path.join(rootDir, 'public/sw.js'), 'utf-8');
const expectedInSw = [
  '/assets/lang/ui_en.json',
  '/assets/lang/ui_ta.json',
  '/assets/lang/ui_hi.json',
  '/assets/lang/ui_ml.json',
  '/assets/lang/ui_te.json',
  '/assets/kb/en.json',
  '/assets/kb/ta.json',
  '/assets/kb/hi.json',
  '/assets/kb/ml.json',
  '/assets/kb/te.json',
  '/assets/fonts/noto-sans-tamil.woff2',
  '/assets/fonts/noto-sans-devanagari.woff2',
  '/assets/fonts/noto-sans-malayalam.woff2',
  '/assets/fonts/noto-sans-telugu.woff2',
];

for (const entry of expectedInSw) {
  if (!swContent.includes(entry)) {
    console.error(`[FAIL] Service Worker missing precache entry: ${entry}`);
    process.exit(1);
  }
}

// Test Online Translation Validator
console.log('\nTesting Online Translation Validator rules...');
function validateTranslation(sourceText, translatedText) {
  const CRITICAL_TERMS = ['Bordeaux', 'Metalaxyl', 'Mancozeb', 'Alternaria', 'Phytophthora'];
  const sourcePlaceholders = (sourceText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
  const transPlaceholders = (translatedText.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
  if (sourcePlaceholders.join(',') !== transPlaceholders.join(',')) return false;

  const extractNumbers = (str) => (str.match(/\d+(?:[–\-]\d+)?%?/g) || []).sort();
  if (extractNumbers(sourceText).join(',') !== extractNumbers(translatedText).join(',')) return false;

  for (const term of CRITICAL_TERMS) {
    const sourceHas = new RegExp(`\\b${term}\\b`, 'i').test(sourceText);
    const transHas = new RegExp(`\\b${term}\\b`, 'i').test(translatedText);
    if (sourceHas && !transHas) return false;
  }
  return true;
}

// Case 1: Mismatched numbers (e.g., "7 days" translated as "14 days")
if (validateTranslation('Wait 7 days before harvest', 'அறுவடைக்கு முன் 14 நாட்கள் காத்திருங்கள்')) {
  console.error('[FAIL] Failed to reject mismatched numbers');
  process.exit(1);
} else {
  console.log('[PASS] Correctly rejected translation with mismatched numbers');
}

// Case 2: Missing chemical name (e.g., "Metalaxyl + Mancozeb")
if (validateTranslation('Spray 1% Bordeaux mixture', '1% தெளிக்கவும்')) {
  console.error('[FAIL] Failed to reject missing chemical name');
  process.exit(1);
} else {
  console.log('[PASS] Correctly rejected translation missing critical chemical name');
}

// Case 3: Altered placeholders (e.g., "{pct}%" replaced with "{percentage}%")
if (validateTranslation('About {pct}% of the leaf is affected', '{percentage}% இலை பாதிக்கப்பட்டுள்ளது')) {
  console.error('[FAIL] Failed to reject altered placeholder');
  process.exit(1);
} else {
  console.log('[PASS] Correctly rejected translation with altered placeholder');
}

// Case 4: Valid translation with numbers, placeholders, and chemicals preserved
if (!validateTranslation('About {pct}% affected. Use 1% Bordeaux mixture.', '{pct}% பாதிக்கப்பட்டது. 1% Bordeaux கலவையைப் பயன்படுத்தவும்.')) {
  console.error('[FAIL] Failed to accept valid translation');
  process.exit(1);
} else {
  console.log('[PASS] Correctly accepted translation preserving all numbers, placeholders, and chemicals');
}

console.log('\n[PASS] All offline assets, service worker precache entries, and translation validation verified!');
