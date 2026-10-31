import { restricted22Service } from '../src/services/restricted22Service';
import { FROZEN_22_CLASSES } from '../src/services/classMappingAdapter';

console.log('====================================================');
console.log('TEST 1: LOOKUP ALL 22 FROZEN CLASSES');
console.log('====================================================');

let all22Pass = true;
let passCount = 0;
let failCount = 0;

for (const item of FROZEN_22_CLASSES) {
  const result = restricted22Service.lookupPrevention(item.crop, item.className);
  if (!result.entry) {
    console.error(`[FAIL] Missing prevention entry for ${item.crop} - ${item.className}`);
    all22Pass = false;
    failCount++;
  } else {
    const isPestExpected = item.type === 'pest';
    if (result.isPest !== isPestExpected) {
      console.error(
        `[FAIL] isPest mismatch for ${item.crop} - ${item.className}: got ${result.isPest}, expected ${isPestExpected}`
      );
      all22Pass = false;
      failCount++;
    } else {
      passCount++;
    }
  }
}

if (all22Pass) {
  console.log(`[PASS] All ${FROZEN_22_CLASSES.length} frozen classes successfully resolved in Prevention KB.`);
}

console.log('\n====================================================');
console.log('TEST 2: OUT OF SCOPE CROPS AND CLASSES');
console.log('====================================================');

const appleRes = restricted22Service.lookupPrevention('apple', 'Scab');
if (appleRes.entry === null) {
  console.log('[PASS] Out of scope crop (apple) returns null.');
  passCount++;
} else {
  console.error('[FAIL] Out of scope crop returned data.');
  failCount++;
}

const fakeDiseaseRes = restricted22Service.lookupPrevention('tomato', 'Anthracnose');
if (fakeDiseaseRes.entry === null) {
  console.log('[PASS] Non-frozen disease for tomato returns null.');
  passCount++;
} else {
  console.error('[FAIL] Non-frozen disease returned data.');
  failCount++;
}

console.log('\n====================================================');
console.log('TEST 3: SCHEME EVALUATION & HEALTHY GATE');
console.log('====================================================');

// Healthy Gate: tomato healthy must return 0 schemes
const healthyRes = restricted22Service.evaluateSchemes({
  crop: 'tomato',
  diseaseIdOrName: 'Healthy',
  selectedState: 'TN',
});
if (healthyRes.totalCount === 0 && healthyRes.cropSupportSchemes.length === 0 && healthyRes.cropLossSchemes.length === 0) {
  console.log('[PASS] Healthy class returns 0 schemes (Healthy gate active).');
  passCount++;
} else {
  console.error('[FAIL] Healthy class returned schemes!');
  failCount++;
}

console.log('\n====================================================');
console.log('TEST 4: CENTRAL SCHEMES ALWAYS INCLUDED');
console.log('====================================================');

// When state is selected, Central schemes must still be present
const tnRes = restricted22Service.evaluateSchemes({
  crop: 'tomato',
  diseaseIdOrName: 'Early blight',
  selectedState: 'TN',
});
const hasCentralPmfby = tnRes.cropLossSchemes.some((s) => s.scheme_id === 'CENTRAL-PMFBY');
const hasCentralMidh = tnRes.cropSupportSchemes.some((s) => s.scheme_id === 'IN-MIDH');
if (hasCentralPmfby && hasCentralMidh) {
  console.log('[PASS] Central schemes (IN-MIDH, CENTRAL-PMFBY) are preserved when TN is selected.');
  passCount++;
} else {
  console.error('[FAIL] Central schemes were missing when TN was selected.');
  failCount++;
}

console.log('\n====================================================');
console.log('TEST 5: FIELD DAMAGE TRIGGERING RELEVANT NOW');
console.log('====================================================');

// Mild severity without damage: loss schemes not relevant now
const mildWithoutDmg = restricted22Service.evaluateSchemes({
  crop: 'rice',
  diseaseIdOrName: 'Bacterial leaf blight',
  modelSeverity: 'mild',
  selectedState: 'KL',
  fieldDamageRange: '<25%',
});
const mildLossRelevant = mildWithoutDmg.cropLossSchemes.some((s) => s.isRelevantNow);
if (!mildLossRelevant) {
  console.log('[PASS] Mild severity with <25% damage does NOT mark crop loss schemes as Relevant Now.');
  passCount++;
} else {
  console.error('[FAIL] Crop loss schemes marked as Relevant Now for mild/<25%!');
  failCount++;
}

// Mild model severity BUT >50% field damage: marks loss schemes relevant now!
const mildWithHighDmg = restricted22Service.evaluateSchemes({
  crop: 'rice',
  diseaseIdOrName: 'Bacterial leaf blight',
  modelSeverity: 'mild',
  selectedState: 'KL',
  fieldDamageRange: '>50%',
});
const highDmgLossRelevant = mildWithHighDmg.cropLossSchemes.every((s) => s.isRelevantNow);
if (highDmgLossRelevant) {
  console.log('[PASS] >50% field damage elevates effective severity to severe and marks crop loss schemes Relevant Now.');
  passCount++;
} else {
  console.error('[FAIL] >50% field damage failed to mark crop loss schemes as Relevant Now.');
  failCount++;
}

console.log(`\n====================================================`);
console.log(`VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`====================================================`);

if (failCount > 0) {
  process.exit(1);
}
