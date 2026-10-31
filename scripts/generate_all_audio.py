import os
import sys
import json
import hashlib
import asyncio
import edge_tts

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
AUDIO_DIR = os.path.join(ROOT_DIR, 'public', 'assets', 'audio')
MANIFEST_PATH = os.path.join(AUDIO_DIR, 'manifest.json')

VOICE_MAP = {
    'en': 'en-IN-NeerjaNeural',
    'ta': 'ta-IN-PallaviNeural',
    'hi': 'hi-IN-SwaraNeural',
    'ml': 'ml-IN-SobhanaNeural',
    'te': 'te-IN-ShrutiNeural',
}

CLIP_KEYS = [
    # 1. Pages
    ('page_scan_home', 'voice_guide_scan_home'),
    ('page_photo_check', 'voice_guide_photo_check'),
    ('page_analyzing', 'voice_guide_analyzing'),
    ('page_result_uncertain', 'voice_result_uncertain'),
    ('page_history', 'voice_guide_history'),
    ('page_schemes', 'voice_guide_schemes'),
    ('page_settings', 'voice_guide_settings'),

    # 2. Notices & Sequence bands
    ('voice_not_leaf', 'voice_not_leaf'),
    ('photo_check_notice_not_leaf', 'photo_check_notice_not_leaf'),
    ('voice_not_plant', 'voice_not_plant'),
    ('certainty_band_high', 'certainty_band_high'),
    ('certainty_band_medium', 'certainty_band_medium'),
    ('certainty_band_low', 'certainty_band_low'),
    ('also_possible_intro', 'also_possible_intro'),
    ('grape_notice_voice', 'grape_notice_voice'),
    ('pest_notice_voice', 'pest_notice_voice'),

    # 3. 22 Classes Overviews
    ('corn_common_rust_overview', 'corn_common_rust_overview'),
    ('corn_gray_leaf_spot_overview', 'corn_gray_leaf_spot_overview'),
    ('corn_healthy_overview', 'corn_healthy_overview'),
    ('corn_northern_leaf_blight_overview', 'corn_northern_leaf_blight_overview'),
    ('grape_black_rot_overview', 'grape_black_rot_overview'),
    ('grape_esca_overview', 'grape_esca_overview'),
    ('grape_leaf_blight_overview', 'grape_leaf_blight_overview'),
    ('pest_armyworm_overview', 'pest_armyworm_overview'),
    ('pest_asiatic_rice_borer_overview', 'pest_asiatic_rice_borer_overview'),
    ('pest_brown_planthopper_overview', 'pest_brown_planthopper_overview'),
    ('pest_corn_borer_overview', 'pest_corn_borer_overview'),
    ('pest_rice_leaf_roller_overview', 'pest_rice_leaf_roller_overview'),
    ('potato_early_blight_overview', 'potato_early_blight_overview'),
    ('potato_healthy_overview', 'potato_healthy_overview'),
    ('potato_late_blight_overview', 'potato_late_blight_overview'),
    ('tomato_bacterial_spot_overview', 'tomato_bacterial_spot_overview'),
    ('tomato_early_blight_overview', 'tomato_early_blight_overview'),
    ('tomato_healthy_overview', 'tomato_healthy_overview'),
    ('tomato_late_blight_overview', 'tomato_late_blight_overview'),
    ('tomato_leaf_mold_overview', 'tomato_leaf_mold_overview'),
    ('tomato_septoria_leaf_spot_overview', 'tomato_septoria_leaf_spot_overview'),
    ('tomato_yellow_leaf_curl_overview', 'tomato_yellow_leaf_curl_overview'),

    # 4. Tomato Treatments & Preventions
    ('tomato_early_blight_treatment', 'tomato_early_blight_treatment'),
    ('tomato_early_blight_prevention', 'tomato_early_blight_prevention'),
    ('tomato_late_blight_treatment', 'tomato_late_blight_treatment'),
    ('tomato_late_blight_prevention', 'tomato_late_blight_prevention'),
    ('tomato_healthy_treatment', 'tomato_healthy_treatment'),
    ('tomato_healthy_prevention', 'tomato_healthy_prevention'),
]

def hash_text(text: str) -> str:
    return hashlib.sha256(text.strip().encode('utf-8')).hexdigest()[:16]

def is_valid_mp3(file_path: str) -> bool:
    if not os.path.exists(file_path):
        return False
    size = os.path.getsize(file_path)
    if size < 1000:
        return False
    with open(file_path, 'rb') as f:
        head = f.read(4)
        if len(head) < 4:
            return False
        if head[:3] == b'ID3':
            return True
        if head[0] == 0xFF and (head[1] & 0xE0) == 0xE0:
            return True
    return False

async def synthesize_clip(text: str, voice: str, out_path: str):
    comm = edge_tts.Communicate(text, voice)
    await comm.save(out_path)

async def main():
    print("==================================================")
    print("      PHYTO MULTILINGUAL AUDIO GENERATOR         ")
    print("==================================================")

    # Load existing manifest
    manifest = {'version': 2, 'clips': {}}
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except Exception:
            manifest = {'version': 2, 'clips': {}}

    force = '--force' in sys.argv
    langs = ['en', 'ta', 'hi', 'ml', 'te']
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        langs = [arg for arg in sys.argv[1:] if arg in VOICE_MAP]

    total_generated = 0
    total_skipped = 0
    total_failed = 0

    for lang in langs:
        voice = VOICE_MAP[lang]
        lang_dir = os.path.join(AUDIO_DIR, lang)
        os.makedirs(lang_dir, exist_ok=True)

        locale_path = os.path.join(ROOT_DIR, 'src', 'locales', f'{lang}.json')
        with open(locale_path, 'r', encoding='utf-8') as f:
            locale_data = json.load(f)

        print(f"\n--- Language: {lang} | Voice: {voice} ({len(CLIP_KEYS)} clips) ---")

        for clip_id, dict_key in CLIP_KEYS:
            text = locale_data.get(dict_key)
            if not text:
                print(f"  [MISSING KEY] {dict_key} in {lang}.json")
                continue

            clip_path = os.path.join(lang_dir, f"{clip_id}.mp3")
            clip_rel = f"{lang}/{clip_id}.mp3"
            h = hash_text(text)

            existing_entry = manifest.get('clips', {}).get(clip_rel, {})
            if not force and is_valid_mp3(clip_path) and existing_entry.get('hash') == h:
                total_skipped += 1
                manifest['clips'][clip_rel] = {
                    'hash': h,
                    'text': text,
                    'available': True,
                    'voice': voice
                }
                continue

            # Synthesize
            print(f"  Generating: {clip_rel} ... ", end="", flush=True)
            success = False
            for attempt in range(3):
                try:
                    await synthesize_clip(text, voice, clip_path)
                    if is_valid_mp3(clip_path):
                        size = os.path.getsize(clip_path)
                        print(f"OK ({size} B)")
                        total_generated += 1
                        manifest['clips'][clip_rel] = {
                            'hash': h,
                            'text': text,
                            'available': True,
                            'voice': voice
                        }
                        success = True
                        break
                    else:
                        await asyncio.sleep(1)
                except Exception as err:
                    if attempt == 2:
                        print(f"FAILED: {err}")
                    else:
                        await asyncio.sleep(1.5)

            if not success:
                total_failed += 1

    # Save manifest
    manifest['version'] = 2
    manifest['generated_at'] = "2026-10-31T14:50:00Z"
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("\n==================================================")
    print(f"Audio Generation Complete:")
    print(f"- Generated: {total_generated}")
    print(f"- Skipped:   {total_skipped}")
    print(f"- Failed:    {total_failed}")
    print(f"- Manifest:  {MANIFEST_PATH}")
    print("==================================================")

if __name__ == '__main__':
    asyncio.run(main())
