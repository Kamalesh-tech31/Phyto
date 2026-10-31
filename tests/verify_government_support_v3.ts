import { restricted22Service, STATE_OPTIONS } from '../src/services/restricted22Service';

console.log('====================================================');
console.log('RUNNING VERIFICATION FOR GOVERNMENT SUPPORT MODULE V3');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failCount++;
  }
}

// ----------------------------------------------------
// Test 1: State: Tamil Nadu, Crop: Rice, Severity: severe -> TN PMFBY candidate
// ----------------------------------------------------
const t1 = restricted22Service.evaluateSevereSchemes('rice', 'severe', 'Tamil Nadu');
assert(
  t1.length >= 1 && t1.some((s) => s.scheme_id === 'TN-PMFBY'),
  'Test 1: Tamil Nadu + Rice + severe returns TN-PMFBY candidate'
);

// ----------------------------------------------------
// Test 2: State: Kerala, Crop: Rice, Severity: critical -> Kerala State Crop Insurance candidate
// ----------------------------------------------------
const t2 = restricted22Service.evaluateSevereSchemes('rice', 'critical', 'Kerala');
assert(
  t2.length >= 1 && t2.some((s) => s.scheme_id === 'KL-STATE-CROP-INSURANCE'),
  'Test 2: Kerala + Rice + critical returns KL-STATE-CROP-INSURANCE candidate'
);

// ----------------------------------------------------
// Test 3: State: Uttar Pradesh, Crop: Potato, Severity: severe -> UP PMFBY candidate
// ----------------------------------------------------
const t3 = restricted22Service.evaluateSevereSchemes('potato', 'severe', 'Uttar Pradesh');
assert(
  t3.length >= 1 && t3.some((s) => s.scheme_id === 'UP-PMFBY'),
  'Test 3: Uttar Pradesh + Potato + severe returns UP-PMFBY candidate'
);

// ----------------------------------------------------
// Test 4: State: Uttar Pradesh, Crop: Corn, Severity: severe -> UP PMFBY candidate
// ----------------------------------------------------
const t4 = restricted22Service.evaluateSevereSchemes('corn', 'severe', 'Uttar Pradesh');
assert(
  t4.length >= 1 && t4.some((s) => s.scheme_id === 'UP-PMFBY'),
  'Test 4: Uttar Pradesh + Corn + severe returns UP-PMFBY candidate'
);

// ----------------------------------------------------
// Test 5: State: Uttar Pradesh, Crop: Tomato, Severity: severe -> Do NOT automatically return UP PMFBY
// ----------------------------------------------------
const t5 = restricted22Service.evaluateSevereSchemes('tomato', 'severe', 'Uttar Pradesh');
const t5HasPmfby = t5.some((s) => s.scheme_id === 'UP-PMFBY');
assert(
  !t5HasPmfby,
  'Test 5: Uttar Pradesh + Tomato + severe does NOT return UP-PMFBY (weather-based only if notified)'
);

// ----------------------------------------------------
// Test 6: State: Andhra Pradesh, Crop: Rice, Severity: severe -> AP Dr. YSR Free Crop Insurance candidate
// ----------------------------------------------------
const t6 = restricted22Service.evaluateSevereSchemes('rice', 'severe', 'Andhra Pradesh');
assert(
  t6.length >= 1 && t6.some((s) => s.scheme_id === 'AP-DR-YSR-FCI-PMFBY'),
  'Test 6: Andhra Pradesh + Rice + severe returns AP-DR-YSR-FCI-PMFBY candidate'
);

// ----------------------------------------------------
// Test 7: State: Andhra Pradesh, Crop: Corn, Severity: severe -> AP insurance candidate
// ----------------------------------------------------
const t7 = restricted22Service.evaluateSevereSchemes('corn', 'severe', 'Andhra Pradesh');
assert(
  t7.length >= 1 && t7.some((s) => s.scheme_id === 'AP-DR-YSR-FCI-PMFBY'),
  'Test 7: Andhra Pradesh + Corn + severe returns AP insurance candidate (AP-DR-YSR-FCI-PMFBY)'
);

// ----------------------------------------------------
// Test 8: State: Andhra Pradesh, Crop: Tomato, Severity: severe -> Do NOT automatically claim insurance eligibility
// ----------------------------------------------------
const t8 = restricted22Service.evaluateSevereSchemes('tomato', 'severe', 'Andhra Pradesh');
const t8HasInsurance = t8.some((s) => s.scheme_id === 'AP-DR-YSR-FCI-PMFBY');
assert(
  !t8HasInsurance,
  'Test 8: Andhra Pradesh + Tomato + severe does NOT return AP-DR-YSR-FCI-PMFBY insurance'
);

// ----------------------------------------------------
// Test 9: State: Others, Crop: Rice, Severity: severe -> ONLY Central Government schemes
// ----------------------------------------------------
const t9 = restricted22Service.evaluateSevereSchemes('rice', 'severe', 'Others');
const t9AllCentral = t9.every((s) => s.jurisdiction === 'Central Government' || s.scheme_id === 'CENTRAL-PMFBY');
const t9HasState = t9.some((s) => ['TN-PMFBY', 'KL-STATE-CROP-INSURANCE', 'UP-PMFBY', 'AP-DR-YSR-FCI-PMFBY'].includes(s.scheme_id));
assert(
  t9.length >= 1 && t9AllCentral && !t9HasState,
  'Test 9: Others + Rice + severe returns ONLY Central Government schemes (CENTRAL-PMFBY)'
);

// ----------------------------------------------------
// Test 10: State: Others, Crop: Rice, Severity: moderate -> 0 severe schemes
// ----------------------------------------------------
const t10 = restricted22Service.evaluateSevereSchemes('rice', 'moderate', 'Others');
assert(
  t10.length === 0,
  'Test 10: Others + Rice + moderate returns empty array for severe loss evaluation'
);

// ----------------------------------------------------
// Test 11: State: Kerala, Crop: Tomato, Severity: severe -> Do not incorrectly apply Kerala's rice pest/disease compensation rule
// ----------------------------------------------------
const t11 = restricted22Service.evaluateSevereSchemes('tomato', 'severe', 'Kerala');
const t11HasRiceStateInsurance = t11.some((s) => s.scheme_id === 'KL-STATE-CROP-INSURANCE');
assert(
  !t11HasRiceStateInsurance,
  'Test 11: Kerala + Tomato + severe does NOT apply KL-STATE-CROP-INSURANCE (paddy-only rule preserved)'
);

// ----------------------------------------------------
// Test 12: State: Tamil Nadu, Crop: Healthy, Severity: severe -> No schemes
// ----------------------------------------------------
const t12 = restricted22Service.evaluateSevereSchemes('rice', 'severe', 'Tamil Nadu', 'Healthy');
assert(
  t12.length === 0,
  'Test 12: Tamil Nadu + Healthy class + severe returns empty array (Crop is healthy rule)'
);

// ----------------------------------------------------
// Additional Verifications:
// ----------------------------------------------------

// Severity: low / mild / unknown -> empty
assert(
  restricted22Service.evaluateSevereSchemes('rice', 'low', 'TN').length === 0 &&
  restricted22Service.evaluateSevereSchemes('rice', 'mild', 'TN').length === 0 &&
  restricted22Service.evaluateSevereSchemes('rice', 'unknown', 'TN').length === 0 &&
  restricted22Service.evaluateSevereSchemes('rice', '', 'TN').length === 0,
  'Additional: Low, mild, unknown, or empty severity returns 0 schemes'
);

// Out of scope crop -> empty
assert(
  restricted22Service.evaluateSevereSchemes('wheat', 'severe', 'TN').length === 0 &&
  restricted22Service.evaluateSevereSchemes('sugarcane', 'severe', 'TN').length === 0,
  'Additional: Out of scope crops return 0 schemes'
);

// State options verification
assert(
  STATE_OPTIONS.length === 5 &&
  STATE_OPTIONS[0].id === 'TN' &&
  STATE_OPTIONS[1].id === 'KL' &&
  STATE_OPTIONS[2].id === 'UP' &&
  STATE_OPTIONS[3].id === 'AP' &&
  STATE_OPTIONS[4].id === 'OTHER',
  'Additional: Exactly 5 state options defined (TN, KL, UP, AP, OTHER)'
);

// Pest class crop mapping
const bphCrop = restricted22Service.normalizeCrop('', 'Brown planthopper');
assert(bphCrop === 'rice', 'Additional: Brown planthopper normalizes to rice');

const cornBorerCrop = restricted22Service.normalizeCrop('', 'Corn borer');
assert(cornBorerCrop === 'corn', 'Additional: Corn borer normalizes to corn');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`====================================================`);

if (failCount > 0) {
  process.exit(1);
}
