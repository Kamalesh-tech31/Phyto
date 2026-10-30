import { restricted22Service } from '../src/services/restricted22Service';

const FROZEN_22_CLASSES = [
  // Tomato (7)
  { crop: 'tomato', class_name: 'Early blight' },
  { crop: 'tomato', class_name: 'Late blight' },
  { crop: 'tomato', class_name: 'Leaf mold' },
  { crop: 'tomato', class_name: 'Septoria leaf spot' },
  { crop: 'tomato', class_name: 'Bacterial spot' },
  { crop: 'tomato', class_name: 'Yellow leaf curl virus' },
  { crop: 'tomato', class_name: 'Healthy' },

  // Potato (3)
  { crop: 'potato', class_name: 'Early blight' },
  { crop: 'potato', class_name: 'Late blight' },
  { crop: 'potato', class_name: 'Healthy' },

  // Corn (4)
  { crop: 'corn', class_name: 'Gray leaf spot' },
  { crop: 'corn', class_name: 'Common rust' },
  { crop: 'corn', class_name: 'Northern leaf blight' },
  { crop: 'corn', class_name: 'Healthy' },

  // Rice (3)
  { crop: 'rice', class_name: 'Bacterial leaf blight' },
  { crop: 'rice', class_name: 'Brown spot' },
  { crop: 'rice', class_name: 'Leaf smut' },

  // Pests (5)
  { crop: 'rice', class_name: 'Brown planthopper' },
  { crop: 'rice', class_name: 'Asiatic rice borer' },
  { crop: 'rice', class_name: 'Rice leaf roller' },
  { crop: 'corn', class_name: 'Corn borer' },
  { crop: 'corn', class_name: 'Armyworm' }
];

console.log('--- TEST 1: Lookup all 22 frozen classes ---');
let all22Pass = true;
for (const item of FROZEN_22_CLASSES) {
  const { entry, isPest } = restricted22Service.lookupPrevention(item.crop, item.class_name);
  if (!entry) {
    console.error(`FAIL: Missing prevention entry for ${item.crop} - ${item.class_name}`);
    all22Pass = false;
  } else {
    const isPestExpected = ['Brown planthopper', 'Asiatic rice borer', 'Rice leaf roller', 'Corn borer', 'Armyworm'].includes(item.class_name);
    if (isPest !== isPestExpected) {
      console.error(`FAIL: isPest mismatch for ${item.crop} - ${item.class_name}: got ${isPest}, expected ${isPestExpected}`);
      all22Pass = false;
    }
  }
}
if (all22Pass) {
  console.log(`PASS: All ${FROZEN_22_CLASSES.length} frozen classes successfully resolved.`);
}

console.log('\n--- TEST 2: Out of scope crops and classes ---');
const appleRes = restricted22Service.lookupPrevention('apple', 'Scab');
if (appleRes.entry === null) {
  console.log('PASS: Out of scope crop (apple) returns null.');
} else {
  console.error('FAIL: Out of scope crop returned data.');
}

const fakeDiseaseRes = restricted22Service.lookupPrevention('tomato', 'Anthracnose');
if (fakeDiseaseRes.entry === null) {
  console.log('PASS: Non-frozen disease for tomato returns null.');
} else {
  console.error('FAIL: Non-frozen disease returned data.');
}

console.log('\n--- TEST 3: Scheme severity gating ---');
const mildSchemes = restricted22Service.evaluateSevereSchemes('rice', 'mild', 'Kerala');
const modSchemes = restricted22Service.evaluateSevereSchemes('rice', 'moderate', 'Kerala');
const lowSchemes = restricted22Service.evaluateSevereSchemes('rice', 'low', 'Kerala');

if (mildSchemes.length === 0 && modSchemes.length === 0 && lowSchemes.length === 0) {
  console.log('PASS: Mild / Moderate / Low severities return 0 schemes.');
} else {
  console.error('FAIL: Mild / Moderate / Low severities returned schemes!');
}

console.log('\n--- TEST 4: Severe schemes logic ---');
// Rice severe in Kerala: should include KL-STATE-CROP-INSURANCE
const keralaRiceSevere = restricted22Service.evaluateSevereSchemes('rice', 'severe', 'Kerala');
console.log('Kerala Rice Severe schemes count:', keralaRiceSevere.length);
if (keralaRiceSevere.length >= 1 && keralaRiceSevere.length <= 2) {
  console.log('PASS: Kerala Rice Severe returns 1-2 schemes.');
  const hasStateInsurance = keralaRiceSevere.some(s => s.scheme_name.includes('State Crop Insurance'));
  if (hasStateInsurance) {
    console.log('PASS: Kerala Rice Severe includes State Crop Insurance for paddy pest/disease attack.');
  } else {
    console.error('FAIL: Kerala Rice Severe missing State Crop Insurance.');
  }
} else {
  console.error('FAIL: Kerala Rice Severe did not return 1-2 schemes.');
}

// Tomato severe in Kerala: must NOT include KL-STATE-CROP-INSURANCE (Paddy only)
const keralaTomatoSevere = restricted22Service.evaluateSevereSchemes('tomato', 'severe', 'Kerala');
console.log('Kerala Tomato Severe schemes count:', keralaTomatoSevere.length);
const tomatoHasStateInsurance = keralaTomatoSevere.some(s => s.scheme_name.includes('State Crop Insurance'));
if (!tomatoHasStateInsurance) {
  console.log('PASS: Kerala Tomato Severe correctly excludes KL-STATE-CROP-INSURANCE (Paddy only rule).');
} else {
  console.error('FAIL: Kerala Tomato Severe incorrectly included KL-STATE-CROP-INSURANCE!');
}

console.log('\n--- ALL VERIFICATIONS COMPLETED ---');
