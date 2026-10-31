# Phyto

**Offline crop disease and pest detection for farmers, in their own language, with voice guidance.**

Phyto is a mobile-first progressive web app (PWA). A farmer photographs a leaf, and the app identifies the likely disease or pest on the phone itself, then shows treatment, prevention and government scheme information in the language chosen in Settings. A single Voice guide button reads each page aloud, so farmers who cannot read can still follow the advice.

> **Detect locally. Diagnose intelligently. Guide farmers. Work completely offline.**

Phyto supports farmers and agricultural experts. It does not replace them.

---

## Table of contents

1. [Features](#features)
2. [Supported languages](#supported-languages)
3. [Supported crops and classes](#supported-crops-and-classes)
4. [How it works](#how-it-works)
5. [Tech stack](#tech-stack)
6. [Project structure](#project-structure)
7. [Getting started](#getting-started)
8. [Scripts](#scripts)
9. [Languages and voice](#languages-and-voice)
10. [Adding new content](#adding-new-content)
11. [Offline behaviour](#offline-behaviour)
12. [Testing](#testing)
13. [Known limitations](#known-limitations)
14. [Team and licence](#team-and-licence)

---

## Features

- **On-device diagnosis.** A TensorFlow.js model runs in the browser. No image is sent to a server.
- **Photo quality check.** Sharpness, exposure and distance are checked before diagnosis, and non-plant images are rejected.
- **Certainty-aware results.**
  - High certainty (85% and above): the diagnosis is shown.
  - Medium certainty (60% to 85%): the diagnosis is shown with a caution.
  - Below 60%: the app asks for another photo instead of guessing.
  - When the top two candidates are close (within 15%), the second possibility is shown as "also possible".
- **Treatment and prevention.** Organic steps, chemical caution and cultural practices from a restricted, class-specific knowledge base.
- **Government schemes.** Central and state schemes (Tamil Nadu, Kerala, Uttar Pradesh, Andhra Pradesh) filtered by crop and by type of support.
- **Scan history.** Previous diagnoses are stored on the device in IndexedDB.
- **Farmer FAQ.** Offline questions and answers.
- **Five languages.** All screens, results and voice follow the language chosen in Settings, without a reload.
- **Voice guide.** One button in the header explains the current page, tab and result aloud, from audio files bundled with the app.
- **Settings.** Text size, theme, language and cache clearing.
- **Installable and offline.** A service worker caches the app shell, the model and the audio.

## Supported languages

| Code | Language |
|------|----------|
| `en` | English |
| `ta` | Tamil |
| `hi` | Hindi |
| `ml` | Malayalam |
| `te` | Telugu |

The language is chosen in **Settings**. There is one language selector and one Voice guide button in the app.

## Supported crops and classes

The model recognises 22 classes across corn, grape, rice, potato and tomato, plus a **not-a-plant** rejection class. The classes are listed in `public/models/tfjs_model/labels.json` and mapped in `src/services/classMapping.ts`.

| Crop | Classes |
|------|---------|
| Corn | Common rust, gray leaf spot, northern leaf blight, healthy |
| Potato | Early blight, late blight, healthy |
| Tomato | Bacterial spot, early blight, late blight, leaf mold, Septoria leaf spot, yellow leaf curl, healthy |
| Grape | Black rot, esca, leaf blight (marked "coming soon" in the app) |
| Pests | Armyworm, corn borer, Asiatic rice borer, brown planthopper, rice leaf roller (a real insect photo is needed) |

## How it works

```
Camera or gallery photo
        |
Quality check (sharpness, exposure, distance, plant or not)
        |
TensorFlow.js model -> class index -> class_id (language-free)
        |
Certainty gate (high / medium / low) and ambiguity check
        |
Selected language from Settings
   |-- Text:  src/locales/<lang>.json and the knowledge-base files
   |-- Voice: public/assets/audio/<lang>/<clip>.mp3 (via the manifest)
        |
Result, Treatment, Prevention, Schemes -- spoken by the Voice guide
```

The model returns only a class index. The index maps to a language-free `class_id`, and all text and audio are looked up by that ID in the selected language. Nothing is translated while the app is running.

### Voice playback order

1. A bundled audio clip from `public/assets/audio/<lang>/`, checked against `manifest.json`.
2. The device's own speech voice, only if one exists for that language.
3. A translated notice if no voice is available.

A non-English language is never read with an English voice. The result voice is built from short clips played in sequence: the class overview, the certainty band, an "also possible" introduction and the second candidate, and any grape or pest notice.

## Tech stack

| Area | Technology |
|------|------------|
| App | React, TypeScript, Vite |
| On-device AI | TensorFlow.js (`public/models/tfjs_model`) |
| Image quality | Custom checks in `src/ml` |
| Storage | IndexedDB (scan history), Cache Storage (offline assets) |
| Offline | Service worker (`public/sw.js`), PWA install |
| Icons | lucide-react |
| Fonts | Bundled locally (Noto Sans for Tamil, Devanagari, Malayalam and Telugu) |
| Audio generation (development only) | Python `edge-tts` with Microsoft neural voices |

## Project structure

```
public/
  models/tfjs_model/        TensorFlow.js model, weights, labels.json, config.json
  assets/audio/             <lang>/*.mp3 clips and manifest.json
  fonts/                    Locally bundled fonts
  sw.js                     Service worker
src/
  App.tsx                   App shell and routing
  components/               Header (Voice guide button), BottomNav, camera and gallery
  features/
    scan/                   ScanHome, PhotoCheck, AnalyzingLeaf, results
    guidance/               TreatmentDetail
    schemes/                SchemesList
    history/                HistoryList
    assistant/              FarmerAssistant
    settings/               SettingsView, LanguageSelect, TextSizeControl, ThemeControl
  locales/                  en.json, ta.json, hi.json, ml.json, te.json
  data/                     Prevention KB, scheme KBs, class status
  services/                 i18n, speech, model, prediction, class mapping, settings
  ml/                       Camera, gallery, ingest and quality checks
  types/                    Shared types
scripts/
  checks.js                 Parity and offline verification suite
  generate-audio.js         Creates audio clips from voice scripts
  edge_tts_generator.py     Speech synthesis helper used by the generator
tests/                      Model, schemes, knowledge-base and offline tests
```

## Getting started

### Requirements

- Node.js (a current LTS release)
- npm
- Python 3 and `pip` (only to regenerate audio clips)

### Install and run

```bash
npm install
npm run dev
```

Open the address printed in the terminal in a normal Chrome tab. The service worker only runs fully in a production build, so test offline behaviour with:

```bash
npm run build
npm run preview
```

### First load and offline use

Open the app once while online so the service worker can cache the model, fonts and English audio. After you choose another language in Settings, wait a moment while its audio clips download in the background. After that, the app works with the network off.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates the production build |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Type-checks the project (`tsc --noEmit`) |
| `npm run checks` | Runs the parity and offline verification suite (`scripts/checks.js`) |
| `node scripts/generate-audio.js` | Generates audio clips for new or changed voice scripts |

Individual tests can be run with `npx tsx tests/<file>.ts`, for example `parity_test.ts`, `verify_model_offline.ts`, `verify_offline_flow.ts`, `verify_restricted_22.ts` and `verify_government_support_v3.ts`.

## Languages and voice

### One translation system

All user interface text lives in `src/locales/<lang>.json` and is read through `src/services/i18n.ts`. Every language file must contain the same keys. The language chosen in Settings is the single value used by the screens, the data lookups and the speech service, and a change takes effect immediately.

### Voice clips

- Clips are stored in `public/assets/audio/<lang>/`.
- `public/assets/audio/manifest.json` lists every clip with a SHA-256 hash of its source script.
- The service worker precaches the app shell, the model and the English clips. The clips of the selected language are cached in the background after it is chosen.
- Range requests are supported, so audio plays offline.

### Voice test (development only)

Open the app with `?debug=1` in the address, or run it in development, to see the Voice test panel in Settings. It shows the clip path tried, the HTTP status, the tier used and the last error. It is hidden in the release build.

## Adding new content

Follow these steps every time a class, page, result or text is added.

1. **Add the English text** (the source of truth) in the locale file or the knowledge-base file. Use only verified agricultural sources for treatment, doses and costs. Never invent advice.
2. **Add the same keys in `ta`, `hi`, `ml` and `te`.** Keep chemical names, doses, intervals, spacing, amounts and official scheme names exactly as in English. Mark new entries `"review_status": "draft_needs_native_and_expert_review"` until they are reviewed.
3. **Write the voice scripts** for the new page, tab or class: a short, simple script in every language.
4. **Generate the audio:**
   ```bash
   pip install edge-tts
   node scripts/generate-audio.js
   ```
   Only scripts whose text changed are regenerated. Play the new clips and confirm they sound right.
5. **For a new model class,** update `labels.json` in the exact order the model outputs, `classMapping.ts` and the knowledge-base entries.
6. **Run the checks:** `npm run lint`, `npm run build` and `npm run checks`.
7. **Test every language** with the sound on, once online and once with the network off.

If a class, page or tab has no clip, the Voice guide cannot speak it in Tamil, Hindi, Malayalam or Telugu on a device without that language's voice.

## Offline behaviour

| Part | Offline |
|------|---------|
| Diagnosis (model and quality check) | Yes |
| Text in all five languages | Yes, from bundled files |
| Voice guide | Yes, from bundled and cached audio clips |
| Scan history | Yes, stored on the device |
| Government scheme information | Yes, from bundled data (the official portal links need internet) |
| Audio generation (`edge-tts`) | No, development only, needs internet once |

Online translation and online voice are not required by the app.

## Testing

```bash
npm run lint
npm run build
npm run checks
npx tsx tests/parity_test.ts
npx tsx tests/verify_model_offline.ts
npx tsx tests/verify_offline_flow.ts
npx tsx tests/verify_restricted_22.ts
npx tsx tests/verify_government_support_v3.ts
```

Manual checklist before a release:

1. Clear the old cached version (browser developer tools, Application, Service Workers, Unregister, then Storage, Clear site data) and reload.
2. For each language, open every page, tab and result and press the Voice guide button.
3. Repeat with airplane mode on, after the language's clips have downloaded.
4. Try a blurry photo, a non-plant photo and a pest or grape sample.
5. Confirm there is exactly one Voice guide button and one language selector.
6. Test on a real, low-cost Android phone.

## Known limitations

- **Tamil, Hindi, Malayalam and Telugu text and voice scripts are AI drafts.** A native speaker and an agriculture expert must review them, especially treatment, dose, cost and scheme text, before the app is used with farmers. The voice repeats any wrong word clearly.
- **Treatment and cost advice is only as reliable as its source.** Keep it tied to verified agricultural references, and ask farmers to confirm with a local agriculture officer.
- **Grape classes are marked "coming soon", and pest detection needs a real insect photo.**
- **The audio is generated with `edge-tts`,** an unofficial tool that uses Microsoft's online voices. It is suitable for development and demonstrations. Check the terms, or switch to an official speech service, before a public release.
- **A fixed audio clip cannot say numbers that change per scan.** The screen shows the certainty percentage, and the voice says the certainty band.
- **Adding content requires regenerating audio.** New or edited voice text keeps playing the old clip until the generator is run again.

## Team and licence

- **Team:** [add team name and members]
- **Repository:** [add repository link]
- **Licence:** [add licence]

---

*Phyto gives guidance to support farmers. It is not a substitute for advice from a qualified agricultural expert.*
