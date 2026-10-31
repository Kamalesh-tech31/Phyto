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

## Camera and Blur Detection Strings (Added for abinav2 Camera Integration)
The following keys were added to all 5 locale dictionaries (`en.json`, `ml.json`, `ta.json`, `hi.json`, `te.json`):
- `enable_camera`: Prompt to enable camera on prompt state
- `start_camera`: Prompt to activate live camera viewfinder
- `starting_camera`: Loading state while camera stream initializes
- `camera_denied_title` & `camera_denied_desc`: Permission denied notification and guidance
- `camera_not_found_title` & `camera_not_found_desc`: Device lacks camera hardware
- `camera_busy_title` & `camera_busy_desc`: Camera locked by another application
- `camera_insecure_title` & `camera_insecure_desc`: Camera requires HTTPS / localhost
- `camera_retry_btn`: Action to retry camera permission / initialization
- `camera_gallery_fallback`: Action to upload from device photo gallery
- `camera_switch`: Action to toggle front / rear camera
- `camera_only_one`: Tooltip/label when only a single camera is detected
- `hint_hold_steady`: Live preview hint when motion or blur is detected
- `hint_too_dark`: Live preview hint when ambient light is insufficient
- `hint_too_bright`: Live preview hint when glare or direct light is detected
- `hint_motion_blur`: Directional motion blur detection notification
- `hint_check_light`: General lighting advisory
- `btn_scan_anyway`: Secondary action when photo is blurry or low confidence
- `camera_access_title` & `camera_access_desc`: Full-screen camera permission modal title and non-cloud privacy notice
- `btn_allow_camera`: Primary action button to request camera stream permission
- `btn_upload_gallery_instead`: Secondary option to open device photo gallery
- `offline_on_device`: Status chip confirming 100% on-device operation
- `capturing_photo`: Intermediate indicator during frame capture
- `btn_close_camera`: Accessibility label for modal close (X) button
- `btn_switch_camera`: Accessibility label for front/back flip button
- `btn_gallery`: Shutter bar gallery action button label
- `camera_error_title`: Generic error header for camera failures
- `btn_try_again`: Retry button on error screen
- `tip_good_light` & `tip_hold_steady`: Static viewfinder guidance chips on idle scan card

## Government Schemes and Prevention Strings (Added for abinav3 Integration)
The following keys were added to all 5 locale dictionaries (`en.json`, `ml.json`, `ta.json`, `hi.json`, `te.json`):
- `schemes_section_title`: Section title for Government Schemes
- `schemes_crop_support_group`: Subsidies and inputs group header ("Support for this crop")
- `schemes_loss_group`: Calamity and insurance group header ("If you suffer crop loss")
- `schemes_state_label`: Label for farmer state selection
- `schemes_select_state_prompt`: Prompt guiding farmer to select state for state-specific schemes
- `state_tn`, `state_kl`, `state_up`, `state_ap`, `state_other`: Localized state names (Tamil Nadu, Kerala, Uttar Pradesh, Andhra Pradesh, Other state)
- `schemes_field_damage_label`: Label asking farmer about extent of field damage
- `damage_under_25`, `damage_25_to_50`, `damage_over_50`, `damage_over_70`: Field damage threshold selection chips
- `relevant_now`: Status badge for schemes relevant under current loss/severity conditions
- `requires_severe_loss`: Notice indicating scheme requires qualifying severe crop loss (>50%)
- `no_state_schemes_note`: Advisory when selected state has no state-specific schemes in KB
- `no_schemes_available`: Fallback when no schemes match current filters
- `official_site`: Link label to open official government portal
- `scheme_conditions`: Collapsible section header for eligibility hard gates
- `scheme_offline_notice`: Inline notification when farmer taps external link while offline
- `scheme_disclaimer`: Conservative verification advisory
- `shown_in_english`: Notice badge indicating scientific prevention content is displayed in English
- `no_guidance_available`: Fallback when prevention data is not available for a class
- `prevention_title`: Section title for prevention guidance
- `local_tip_label`: Label for localized agronomic tip box
- `sources_label`: Header for official citations/sources

**Review Status**: English (`en`) is canonical; Malayalam (`ml`), Tamil (`ta`), Hindi (`hi`), and Telugu (`te`) are machine-translated and marked for native speaker review.
