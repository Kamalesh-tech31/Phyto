# Translations Review Status

This document notes the translation files generated for the Phyto PWA offline localization system.
English (`src/locales/en.json`) is the canonical source of truth.

## Review Status by Language

| File | Language | Native Name | Code | Review Status | Notes |
|------|----------|-------------|------|---------------|-------|
| `src/locales/en.json` | English | English | `en` | **Approved** | Canonical source of truth. |
| `src/locales/ml.json` | Malayalam | മലയാളം | `ml` | **Verified** | Core scan/schemes adapted from repository original translations; settings additions require native speaker pass. |
| `src/locales/ta.json` | Tamil | தமிழ் | `ta` | **Needs Review** | Machine-translated using agricultural terminology (e.g. உழவர், மானியம், கருகல் நோய்). Needs native-speaker validation. |
| `src/locales/hi.json` | Hindi | हिन्दी | `hi` | **Needs Review** | Machine-translated using standard agricultural Hindi (e.g. झुलसा, अनुदान, किसान). Needs native-speaker validation. |
| `src/locales/te.json` | Telugu | తెలుగు | `te` | **Needs Review** | Machine-translated using standard agricultural Telugu (e.g. తెగులు, రాయితీ, సస్యరక్షణ). Needs native-speaker validation. |

## Notes for Native Reviewers
1. Ensure agricultural terms (blight, pests, subsidy, quality checks) accurately reflect localized farming vocabulary.
2. Confirm UI button length in native script fits mobile touch targets at Largest text size (approx. 150% font scale) on 360px wide devices.
