import { preventionService } from '../src/services/preventionService';
import { schemeRecommendationService } from '../src/services/schemeRecommendationService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log('==================================================');
console.log('RUNNING PHYTO END-TO-END PIPELINE VERIFICATION');
console.log('==================================================\n');

// 1. TEST: Successful prevention match
console.log('--- Test 1: Successful Prevention Match ---');
const match1 = preventionService.lookup('Tomato leaf', 'Early blight');
assert(match1.found === true, 'Tomato Early Blight matches prevention KB');
assert(match1.entry?.crop === 'tomato', 'Matches crop = tomato');
assert(match1.entry?.prevention.length! > 0, 'Returns non-empty prevention array');
assert(match1.entry?.local_prevention?.length! > 0, 'Returns local South India prevention');

const matchRice = preventionService.lookup('Rice', 'Rice blast');
assert(matchRice.found === true, 'Rice Blast matches prevention KB');
assert(matchRice.entry?.crop === 'rice', 'Matches crop = rice');

const matchChilli = preventionService.lookup('Chilli', 'Damping off');
assert(matchChilli.found === true, 'Chilli Damping Off matches prevention KB');

// 2. TEST: Non-destructive normalization (e.g., class name variation)
console.log('\n--- Test 2: Normalization / Mapping Layer ---');
const matchNorm = preventionService.lookup('Paddy', 'Blast');
assert(matchNorm.found === true, 'Paddy Blast normalizes to Rice Rice blast');

const matchTomatoAlt = preventionService.lookup('Tomato', 'Tomato Early Blight');
assert(matchTomatoAlt.found === true, 'Tomato Early Blight normalizes properly');

// 3. TEST: No prevention match
console.log('\n--- Test 3: No Prevention Match ---');
const noMatch = preventionService.lookup('Dragonfruit', 'Stem Canker');
assert(noMatch.found === false, 'Unknown disease returns found = false');
assert(
  noMatch.fallbackMessage ===
    'Prevention guidance for this prediction is not available in the current knowledge base.',
  'Fallback message matches exact dataset/requirement'
);

// 4. TEST: Low severity scheme prioritization
console.log('\n--- Test 4: Low Severity Scheme Case ---');
const lowRes = schemeRecommendationService.recommendSchemes('Tomato', 'Early blight', {
  state: 'Kerala',
  affectedAreaRange: '<25%',
  isSpreading: false,
  impact: 'manageable',
});
assert(lowRes.severity === 'low', 'Severity evaluates to low');
assert(
  !lowRes.recommended.some((r) => r.scheme.type === 'crop_loss_compensation'),
  'Low severity must NOT recommend crop loss compensation'
);
assert(
  lowRes.recommended.some((r) => r.scheme.type === 'horticulture_development' || r.scheme.type === 'crop_health_support' || r.scheme.type === 'soil_health'),
  'Low severity recommends development / input / health schemes'
);

// 5. TEST: Moderate severity scheme prioritization
console.log('\n--- Test 5: Moderate Severity Case ---');
const modRes = schemeRecommendationService.recommendSchemes('Tomato', 'Early blight', {
  state: 'Kerala',
  affectedAreaRange: '25-50%',
  isSpreading: true,
  impact: 'yield_affected',
});
assert(modRes.severity === 'moderate', 'Severity evaluates to moderate');
assert(
  modRes.recommended.some((r) => r.scheme.id === 'KL-CROP-HEALTH-MANAGEMENT' || r.scheme.id === 'IN-MIDH'),
  'Moderate severity prioritizes crop-health / horticulture support'
);

// 6. TEST: Severe loss - Kerala Paddy Case (Crucial Example in Part 7)
console.log('\n--- Test 6: Kerala Paddy Pest/Disease Severe Loss (>50%) ---');
const keralaRiceSevere = schemeRecommendationService.recommendSchemes('Rice', 'Rice blast', {
  state: 'Kerala',
  affectedAreaRange: '>50%',
  isSpreading: true,
  impact: 'major_loss',
});
assert(keralaRiceSevere.severity === 'severe', 'Severity evaluates to severe');
assert(
  keralaRiceSevere.recommended[0].scheme.id === 'KL-STATE-CROP-INSURANCE',
  'Kerala Paddy with >50% pest/disease loss prioritizes KL-STATE-CROP-INSURANCE as top scheme'
);
assert(
  keralaRiceSevere.recommended[0].status === 'Eligibility Requires Verification',
  'Status is Eligibility Requires Verification (never guaranteed)'
);

// 7. TEST: Kerala Non-Paddy Pest/Disease Rule (Crucial Part 7 Gate)
console.log('\n--- Test 7: Kerala Non-Paddy Pest/Disease Rule (No false relationship) ---');
const keralaTomatoSevere = schemeRecommendationService.recommendSchemes('Tomato', 'Early blight', {
  state: 'Kerala',
  affectedAreaRange: '>50%',
  isSpreading: true,
  impact: 'major_loss',
});
assert(
  !keralaTomatoSevere.recommended.some((r) => r.scheme.id === 'KL-STATE-CROP-INSURANCE'),
  'KL-STATE-CROP-INSURANCE must NOT be recommended for tomato disease attack (paddy only rule)'
);
assert(
  keralaTomatoSevere.recommended.some((r) => r.scheme.id === 'KL-PMFBY-RWBCIS' || r.scheme.id === 'KL-CONTINGENCY-CROP-HEALTH'),
  'Tomato in Kerala severe loss matches notified PMFBY-RWBCIS or contingency programme'
);

// 8. TEST: Critical loss - Replanting / Devastation
console.log('\n--- Test 8: Critical Loss / Replanting Case ---');
const criticalRes = schemeRecommendationService.recommendSchemes('Rice', 'Rice blast', {
  state: 'Kerala',
  affectedAreaRange: '>70%',
  isSpreading: true,
  impact: 'crop_lost',
});
assert(criticalRes.severity === 'critical', 'Severity evaluates to critical');
assert(
  criticalRes.recommended.some((r) => r.scheme.id === 'KL-CONTINGENCY-CROP-HEALTH' || r.scheme.id === 'KL-STATE-CROP-INSURANCE'),
  'Critical loss recommends emergency/replanting/compensation support'
);

// 9. TEST: Tamil Nadu Case
console.log('\n--- Test 9: Tamil Nadu State Case ---');
const tnRes = schemeRecommendationService.recommendSchemes('Tomato', 'Early blight', {
  state: 'Tamil Nadu',
  affectedAreaRange: '25-50%',
  isSpreading: false,
  impact: 'yield_affected',
});
assert(
  !tnRes.recommended.some((r) => r.scheme.jurisdiction === 'Kerala'),
  'Tamil Nadu state query NEVER returns Kerala jurisdiction schemes'
);
assert(
  tnRes.recommended.some((r) => r.scheme.id === 'TN-MIDH' || r.scheme.id === 'TN-PER-DROP-MORE-CROP' || r.scheme.jurisdiction.includes('India')),
  'Tamil Nadu query returns valid TN or All-India schemes'
);

// 10. TEST: Central Scheme Case
console.log('\n--- Test 10: Central Scheme Case ---');
const centralRes = schemeRecommendationService.recommendSchemes('Wheat', 'Rust', {
  state: 'Other',
  affectedAreaRange: '<25%',
  isSpreading: false,
  impact: 'manageable',
});
assert(
  centralRes.recommended.every((r) => r.scheme.jurisdiction.includes('India')),
  'Other states receive only All-India / Central schemes'
);

// 11. TEST: Multiple Matching Schemes (Ranked Top 1-3)
console.log('\n--- Test 11: Top 1-3 Ranking Constraint ---');
assert(
  keralaRiceSevere.recommended.length >= 1 && keralaRiceSevere.recommended.length <= 3,
  'Returns at most top 1 to 3 schemes per Part 8'
);

// 12. TEST: No Matching Scheme
console.log('\n--- Test 12: No Matching Scheme Fallback ---');
const noSchemeRes = schemeRecommendationService.recommendSchemes('Dragonfruit', 'Stem Canker', {
  state: 'Other',
  affectedAreaRange: '>70%',
  isSpreading: true,
  impact: 'crop_lost',
});
assert(noSchemeRes.recommended.length === 0, 'No matching scheme returns 0 schemes');
assert(
  noSchemeRes.noMatchMessage ===
    'No specific government scheme could be confidently matched to the current crop, location and reported situation.',
  'Fallback message matches exact dataset/requirement'
);

console.log('\n==================================================');
console.log('ALL VERIFICATION SUITES EXECUTED SUCCESSFULLY!');
console.log('==================================================');
