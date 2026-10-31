import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'src', 'data', 'lang');
const kbDir = path.join(rootDir, 'src', 'data', 'kb');

const languages = ['en', 'ta', 'hi', 'ml', 'te'];
let hasErrors = false;

console.log('=== Checking i18n Localization Integrity ===\n');

// 1. Verify UI Language Files
console.log('--- 1. Checking UI Language Files (ui_*.json) ---');
const enUiPath = path.join(uiDir, 'ui_en.json');
const enUi = JSON.parse(fs.readFileSync(enUiPath, 'utf-8'));
const enKeys = Object.keys(enUi).sort();

// Required Voice Guide UI Keys
const requiredVoiceKeys = [
  'voice_guide_btn',
  'voice_guide_loading',
  'voice_guide_speaking',
  'voice_guide_stop',
  'voice_guide_error',
  'voice_guide_scan_home',
  'voice_guide_photo_check',
  'voice_guide_analyzing',
  'voice_result_template',
  'voice_guide_result_uncertain',
  'voice_guide_history',
  'voice_guide_schemes',
  'voice_guide_settings',
  'auto_translation_disclaimer',
  'download_offline_btn',
  'speak_slowly_label',
  'voice_not_leaf',
  'photo_check_notice_not_leaf'
];

for (const lang of languages) {
  const filePath = path.join(uiDir, `ui_${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File missing: ui_${lang}.json`);
    hasErrors = true;
    continue;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const currentKeys = Object.keys(content).sort();

  // Check missing keys
  const missing = enKeys.filter((k) => !(k in content));
  if (missing.length > 0) {
    console.error(`[ERROR] [ui_${lang}.json] Missing keys (${missing.length}):`, missing);
    hasErrors = true;
  }

  // Check extra keys
  const extra = currentKeys.filter((k) => !(k in enUi));
  if (extra.length > 0) {
    console.error(`[ERROR] [ui_${lang}.json] Extra keys (${extra.length}):`, extra);
    hasErrors = true;
  }

  // Check required voice keys
  for (const vKey of requiredVoiceKeys) {
    if (!content[vKey]) {
      console.error(`[ERROR] [ui_${lang}.json] Missing required voice key "${vKey}"`);
      hasErrors = true;
    }
  }

  // Check empty values and placeholders
  for (const key of enKeys) {
    const val = content[key];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      console.error(`[ERROR] [ui_${lang}.json] Empty value for key "${key}"`);
      hasErrors = true;
    }

    // Check placeholders like {pct}, {level}, {disease_name}, etc.
    const enVal = enUi[key];
    if (typeof enVal === 'string' && typeof val === 'string') {
      const enPlaceholders = (enVal.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const valPlaceholders = (val.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      if (enPlaceholders.join(',') !== valPlaceholders.join(',')) {
        console.error(
          `[ERROR] [ui_${lang}.json] Placeholder mismatch in key "${key}": expected [${enPlaceholders}], found [${valPlaceholders}]`
        );
        hasErrors = true;
      }
    }
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`[OK] ui_${lang}.json matches ui_en.json (${enKeys.length} keys, placeholders valid, no empty values)`);
  }
}

// 2. Verify Knowledge Base (KB) Files
console.log('\n--- 2. Checking Disease Knowledge Base Files (*.json) ---');
const enKbPath = path.join(kbDir, 'en.json');
const enKb = JSON.parse(fs.readFileSync(enKbPath, 'utf-8'));

// Critical chemical names and waiting periods / numbers that must remain intact across all translations
const criticalChemicals = [
  'Bordeaux mixture',
  'Metalaxyl',
  'Mancozeb',
  'Alternaria solani',
  'Phytophthora infestans',
  '1%',
  '7 days',
  '45–60 cm',
];

function getAllObjectKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllObjectKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enStructureKeys = getAllObjectKeys(enKb).sort();

for (const lang of languages) {
  const filePath = path.join(kbDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File missing: ${lang}.json`);
    hasErrors = true;
    continue;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const currentStructureKeys = getAllObjectKeys(content).sort();

  const missing = enStructureKeys.filter((k) => !currentStructureKeys.includes(k));
  if (missing.length > 0) {
    console.error(`[ERROR] [${lang}.json] Missing structure keys (${missing.length}):`, missing);
    hasErrors = true;
  }

  const extra = currentStructureKeys.filter((k) => !enStructureKeys.includes(k));
  if (extra.length > 0) {
    console.error(`[ERROR] [${lang}.json] Extra structure keys (${extra.length}):`, extra);
    hasErrors = true;
  }

  // Check required voice fields in KB
  for (const cId of Object.keys(enKb)) {
    if (!content[cId]?.voice_treatment) {
      console.error(`[ERROR] [${lang}.json] Missing voice_treatment in "${cId}"`);
      hasErrors = true;
    }
    if (!content[cId]?.voice_prevention) {
      console.error(`[ERROR] [${lang}.json] Missing voice_prevention in "${cId}"`);
      hasErrors = true;
    }
  }

  // Check non-empty values
  function checkLeaves(obj, pathName = '') {
    for (const k in obj) {
      const curPath = pathName ? `${pathName}.${k}` : k;
      const v = obj[k];
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
        console.error(`[ERROR] [${lang}.json] Empty leaf at "${curPath}"`);
        hasErrors = true;
      } else if (Array.isArray(v)) {
        v.forEach((item, idx) => checkLeaves(item, `${curPath}[${idx}]`));
      } else if (typeof v === 'object') {
        checkLeaves(v, curPath);
      }
    }
  }
  checkLeaves(content);

  // Check critical agricultural terms
  const fullRawText = JSON.stringify(content);
  for (const term of criticalChemicals) {
    if (JSON.stringify(enKb).includes(term) && !fullRawText.includes(term)) {
      console.error(`[ERROR] [${lang}.json] Missing required chemical / dose / interval term: "${term}"`);
      hasErrors = true;
    }
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`[OK] ${lang}.json matches en.json structure, preserved critical chemicals & intervals`);
  }
}

console.log('\n=============================================');
if (hasErrors) {
  console.error('Localization check FAILED with errors.');
  process.exit(1);
} else {
  console.log('All localization keys, voice keys, placeholders, and chemical names passed verification!');
  process.exit(0);
}
