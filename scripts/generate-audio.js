/**
 * scripts/generate-audio.js
 * 
 * Generates audio clips and manifest for offline voice guides across 5 languages:
 * English (en), Tamil (ta), Hindi (hi), Malayalam (ml), Telugu (te).
 * 
 * Requirements:
 * - Credentials & endpoint read from environment variables (TTS_PROXY_URL, VITE_TTS_PROXY_URL, TTS_API_KEY).
 * - Saves mono MP3 at 32-48 kbps for every manifest entry when provider is configured.
 * - If no TTS provider is configured, skips dummy silent generation so Web Speech API is never intercepted by silence.
 * - Regenerates ONLY clips whose text hash has changed.
 * - Prints a clear report of generated, skipped (unchanged), unconfigured, and failed clips.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const LANGUAGES = ['en', 'ta', 'hi', 'ml', 'te'];
const audioBaseDir = path.join(rootDir, 'public', 'assets', 'audio');
const manifestPath = path.join(audioBaseDir, 'manifest.json');

// Ensure language directories exist
LANGUAGES.forEach((lang) => {
  const dir = path.join(audioBaseDir, lang);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function hashText(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex').substring(0, 16);
}

async function main() {
  console.log('=== Phyto Offline Audio Manifest & MP3 Generator ===\n');

  // Trigger Python Edge-TTS generator if available
  const pyScript = path.join(__dirname, 'edge_tts_generator.py');
  if (fs.existsSync(pyScript)) {
    console.log('Running Microsoft Edge Neural TTS generator...');
    const res = spawnSync('python', [pyScript, '--all'], { stdio: 'inherit' });
    if (res.status === 0) {
      console.log('\n[SUCCESS] Edge-TTS generation completed.');
      return;
    }
  }

  const proxyConfigured = Boolean(process.env.TTS_PROXY_URL || process.env.VITE_TTS_PROXY_URL);
  if (!proxyConfigured) {
    console.log('Notice: No TTS provider configured (TTS_PROXY_URL / VITE_TTS_PROXY_URL not set).');
    console.log('Clips will be indexed in manifest.json with "isPlaceholder: true".');
    console.log('The web app will use on-device Web Speech API directly without silent dummy interception.\n');
  }

  // Load existing manifest if present to compare hashes
  let existingManifest = { clips: {} };
  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      existingManifest = { clips: {} };
    }
  }

  const newManifest = {
    version: 1,
    generated_at: new Date().toISOString(),
    clips: {}
  };

  const report = {
    total: 0,
    generated: [],
    skipped: [],
    unconfigured: [],
    failed: []
  };

  for (const lang of LANGUAGES) {
    const kbFile = path.join(rootDir, 'src', 'data', 'kb', `${lang}.json`);
    const uiFile = path.join(rootDir, 'src', 'data', 'lang', `ui_${lang}.json`);

    if (!fs.existsSync(kbFile) || !fs.existsSync(uiFile)) {
      console.warn(`Files missing for language ${lang}, skipping`);
      continue;
    }

    const kbData = JSON.parse(fs.readFileSync(kbFile, 'utf8'));
    const uiData = JSON.parse(fs.readFileSync(uiFile, 'utf8'));

    // Base UI screen guides
    const items = [
      { clipId: 'page_scan_home', text: uiData['voice_guide_scan_home'], type: 'ui_guide' },
      { clipId: 'page_photo_check', text: uiData['voice_guide_photo_check'], type: 'ui_guide' },
      { clipId: 'page_analyzing', text: uiData['voice_guide_analyzing'], type: 'ui_guide' },
      { clipId: 'page_result_uncertain', text: uiData['voice_guide_result_uncertain'], type: 'ui_guide' },
      { clipId: 'page_history', text: uiData['voice_guide_history'], type: 'ui_guide' },
      { clipId: 'page_schemes', text: uiData['voice_guide_schemes'], type: 'ui_guide' },
      { clipId: 'page_settings', text: uiData['voice_guide_settings'], type: 'ui_guide' },
      { clipId: 'voice_not_leaf', text: uiData['voice_not_leaf'], type: 'ui_guide' },
    ];

    // Disease KB items
    for (const [classId, disease] of Object.entries(kbData)) {
      if (disease.voice_text) {
        items.push({ clipId: `${classId}_overview`, text: disease.voice_text, type: 'kb_overview' });
      }
      if (disease.voice_treatment) {
        items.push({ clipId: `${classId}_treatment`, text: disease.voice_treatment, type: 'kb_treatment' });
      }
      if (disease.voice_prevention) {
        items.push({ clipId: `${classId}_prevention`, text: disease.voice_prevention, type: 'kb_prevention' });
      }
    }

    for (const item of items) {
      if (!item.text) continue;
      report.total++;

      const clipRelKey = `${lang}/${item.clipId}.mp3`;
      const clipFilePath = path.join(audioBaseDir, lang, `${item.clipId}.mp3`);
      const newHash = hashText(item.text);

      const existingEntry = existingManifest.clips ? existingManifest.clips[clipRelKey] : null;
      const fileExists = fs.existsSync(clipFilePath);

      // If real audio file exists and hash matches, keep it
      if (fileExists && existingEntry && existingEntry.hash === newHash && !existingEntry.isPlaceholder) {
        newManifest.clips[clipRelKey] = {
          hash: newHash,
          text: item.text,
          type: item.type,
          available: true,
          isPlaceholder: false
        };
        report.skipped.push(clipRelKey);
        continue;
      }

      try {
        const audioBuffer = await synthesizeAudio(item.text, lang);
        if (audioBuffer) {
          fs.writeFileSync(clipFilePath, audioBuffer);
          newManifest.clips[clipRelKey] = {
            hash: newHash,
            text: item.text,
            type: item.type,
            available: true,
            isPlaceholder: false
          };
          report.generated.push(clipRelKey);
        } else {
          newManifest.clips[clipRelKey] = {
            hash: newHash,
            text: item.text,
            type: item.type,
            available: false,
            isPlaceholder: true
          };
          report.unconfigured.push(clipRelKey);
        }
      } catch (err) {
        newManifest.clips[clipRelKey] = {
          hash: newHash,
          text: item.text,
          type: item.type,
          available: false,
          isPlaceholder: true
        };
        report.failed.push({ clip: clipRelKey, error: err.message });
      }
    }
  }

  // Update manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2), 'utf8');

  // Print Detailed Report
  console.log('--------------------------------------------------');
  console.log(`Audio Generation Report:`);
  console.log(`- Total clips evaluated:   ${report.total}`);
  console.log(`- Newly generated:         ${report.generated.length}`);
  console.log(`- Skipped (already real):  ${report.skipped.length}`);
  console.log(`- Unconfigured (fallback): ${report.unconfigured.length}`);
  console.log(`- Failed:                  ${report.failed.length}`);
  console.log('--------------------------------------------------');

  if (report.generated.length > 0) {
    console.log(`Sample generated clips (first 10):`);
    report.generated.slice(0, 10).forEach((c) => console.log(`  + ${c}`));
  }

  if (report.unconfigured.length > 0) {
    console.log(`Fallback notice: ${report.unconfigured.length} clips cataloged in manifest.json as isPlaceholder: true.`);
    console.log(`All these voice prompts will speak cleanly through browser Web Speech API.`);
  }

  console.log(`\nUpdated manifest: ${path.relative(rootDir, manifestPath)}`);
}

main().catch((err) => {
  console.error('Audio generation script failed:', err);
  process.exit(1);
});
