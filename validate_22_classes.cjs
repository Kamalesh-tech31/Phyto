const fs = require('fs');

const rootKb = JSON.parse(fs.readFileSync('./Crop_Treatment_Pesticide_KB_22Class_Production_v2.json', 'utf8'));
const srcKb = JSON.parse(fs.readFileSync('./src/data/Crop_Treatment_Pesticide_KB_22Class_Production_v2.json', 'utf8'));

console.log('=== VALIDATION OF 22-CLASS PRODUCTION KNOWLEDGE BASE ===');
console.log('Root KB Records Count:', rootKb.records.length);
console.log('Src KB Records Count:', srcKb.records.length);

if (rootKb.records.length !== 22 || srcKb.records.length !== 22) {
  console.error('FAIL: Expected exactly 22 records');
  process.exit(1);
}

const validDisplayModes = [
  'full',
  'actives_only',
  'vector_control_only',
  'crop_prompt',
  'expert_only',
  'no_treatment_needed',
  'no_recommendation'
];

const validTiers = ['A', 'B', 'C', 'N'];
const bannedChemicals = ['streptocycline', 'streptomycin', 'trichlorphon', 'trichlorfon'];

let errorCount = 0;
let displayedCount = 0;
let hiddenSafetyCount = 0;

rootKb.records.forEach((r, idx) => {
  console.log(`\nChecking [${idx + 1}/22] class_id: "${r.class_id}" | crop: "${r.crop}" | name: "${r.class_name}"`);
  
  if (!validDisplayModes.includes(r.display_mode)) {
    console.error(`  ERROR: Invalid display_mode "${r.display_mode}"`);
    errorCount++;
  } else {
    console.log(`  ✓ display_mode: ${r.display_mode}`);
  }

  if (!validTiers.includes(r.tier)) {
    console.error(`  ERROR: Invalid tier "${r.tier}"`);
    errorCount++;
  } else {
    console.log(`  ✓ tier: ${r.tier}`);
  }

  // Check chemicals
  if (r.chemical && Array.isArray(r.chemical)) {
    r.chemical.forEach((c) => {
      // Check for banned
      const lowerActive = c.active.toLowerCase();
      for (const banned of bannedChemicals) {
        if (lowerActive.includes(banned)) {
          if (c.display !== false) {
            console.error(`  CRITICAL REGULATORY VIOLATION: Banned active "${c.active}" has display !== false!`);
            errorCount++;
          } else {
            console.log(`  🛡️ Safety Guard Verified: Banned active "${c.active}" is properly HIDDEN (regulatory flag: ${c.regulatory_flag})`);
            hiddenSafetyCount++;
          }
        }
      }

      if (c.display) {
        displayedCount++;
        console.log(`    -> Displayable Active: "${c.active}" | Dose: "${c.dose_text}" | Basis: "${c.dose_basis}"`);
      } else {
        console.log(`    -> Hidden Active: "${c.active}" (Reason: ${c.hidden_reason || 'N/A'})`);
      }
    });
  }

  // Check crop_prompt by_crop
  if (r.display_mode === 'crop_prompt' && r.by_crop) {
    for (const [subCrop, data] of Object.entries(r.by_crop)) {
      console.log(`  Crop branch: ${subCrop} -> mode: ${data.display_mode}`);
      (data.chemical || []).forEach(c => {
        const lowerActive = c.active.toLowerCase();
        for (const banned of bannedChemicals) {
          if (lowerActive.includes(banned)) {
            if (c.display !== false) {
              console.error(`  CRITICAL REGULATORY VIOLATION in subCrop ${subCrop}: Banned active "${c.active}" has display !== false!`);
              errorCount++;
            } else {
              console.log(`  🛡️ Safety Guard Verified in subCrop ${subCrop}: Banned active "${c.active}" is properly HIDDEN`);
              hiddenSafetyCount++;
            }
          }
        }
      });
    }
  }

  // Check sources
  if (!r.sources || r.sources.length === 0) {
    if (r.tier !== 'N') {
      console.warn(`  WARNING: No sources listed for non-healthy class "${r.class_id}"`);
    } else {
      console.log(`  ✓ Healthy class (no sources needed)`);
    }
  } else {
    console.log(`  ✓ Sources count: ${r.sources.length}`);
  }
});

console.log('\n==================================================');
console.log(`VALIDATION SUMMARY:`);
console.log(`Total Classes Checked: 22`);
console.log(`Total Displayable Chemicals: ${displayedCount}`);
console.log(`Total Hidden/Safety Banned Chemicals Checked: ${hiddenSafetyCount}`);
console.log(`Total Errors: ${errorCount}`);
console.log('==================================================');

if (errorCount > 0) {
  process.exit(1);
}
