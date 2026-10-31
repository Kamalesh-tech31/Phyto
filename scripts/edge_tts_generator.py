"""
scripts/edge_tts_generator.py
Generates high-quality offline audio clips using Edge Neural TTS.
Supported voices:
- en: en-IN-NeerjaNeural
- ta: ta-IN-PallaviNeural
- ml: ml-IN-SobhanaNeural
- hi: hi-IN-SwaraNeural
"""

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
    'ml': 'ml-IN-SobhanaNeural',
    'hi': 'hi-IN-SwaraNeural',
}

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
        # Sync word 0xFF 0xE0+ or ID3
        if head[:3] == b'ID3':
            return True
        if head[0] == 0xFF and (head[1] & 0xE0) == 0xE0:
            return True
    return False

async def synthesize_clip(text: str, voice: str, out_path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)

async def main():
    print("=== Phyto Edge-TTS Speech Generator ===")
    
    # Load manifest
    manifest = {'version': 1, 'clips': {}}
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except Exception:
            manifest = {'version': 1, 'clips': {}}

    generated = []
    skipped = []
    failed = []

    force = '--force' in sys.argv
    target_languages = ['en', 'ta', 'ml', 'hi']
    if any(arg in ['ta', 'ml', 'hi', 'en'] for arg in sys.argv):
        target_languages = [arg for arg in sys.argv if arg in ['ta', 'ml', 'hi', 'en']]

    for lang in target_languages:
        voice = VOICE_MAP.get(lang)
        if not voice:
            continue

        out_lang_dir = os.path.join(AUDIO_DIR, lang)
        os.makedirs(out_lang_dir, exist_ok=True)

        ui_file = os.path.join(ROOT_DIR, 'src', 'data', 'lang', f'ui_{lang}.json')
        kb_file = os.path.join(ROOT_DIR, 'src', 'data', 'kb', f'{lang}.json')

        if not os.path.exists(ui_file) or not os.path.exists(kb_file):
            print(f"Skipping {lang}: locale files missing")
            continue

        with open(ui_file, 'r', encoding='utf-8') as f:
            ui_data = json.load(f)
        with open(kb_file, 'r', encoding='utf-8') as f:
            kb_data = json.load(f)

        items = [
            {'clipId': 'page_scan_home', 'text': ui_data.get('voice_guide_scan_home'), 'type': 'ui_guide'},
            {'clipId': 'page_photo_check', 'text': ui_data.get('voice_guide_photo_check'), 'type': 'ui_guide'},
            {'clipId': 'page_analyzing', 'text': ui_data.get('voice_guide_analyzing'), 'type': 'ui_guide'},
            {'clipId': 'page_result_uncertain', 'text': ui_data.get('voice_guide_result_uncertain'), 'type': 'ui_guide'},
            {'clipId': 'page_history', 'text': ui_data.get('voice_guide_history'), 'type': 'ui_guide'},
            {'clipId': 'page_schemes', 'text': ui_data.get('voice_guide_schemes'), 'type': 'ui_guide'},
            {'clipId': 'page_settings', 'text': ui_data.get('voice_guide_settings'), 'type': 'ui_guide'},
            {'clipId': 'voice_not_leaf', 'text': ui_data.get('voice_not_leaf'), 'type': 'ui_guide'},
        ]

        for class_id, disease in kb_data.items():
            if disease.get('voice_text'):
                items.append({'clipId': f'{class_id}_overview', 'text': disease['voice_text'], 'type': 'kb_overview'})
            if disease.get('voice_treatment'):
                items.append({'clipId': f'{class_id}_treatment', 'text': disease['voice_treatment'], 'type': 'kb_treatment'})
            if disease.get('voice_prevention'):
                items.append({'clipId': f'{class_id}_prevention', 'text': disease['voice_prevention'], 'type': 'kb_prevention'})

        print(f"\nProcessing language: {lang} (Voice: {voice}, total clips: {len(items)})")

        for item in items:
            text = item.get('text')
            if not text:
                continue

            clip_id = item['clipId']
            clip_key = f"{lang}/{clip_id}.mp3"
            clip_path = os.path.join(out_lang_dir, f"{clip_id}.mp3")
            text_hash = hash_text(text)

            existing_entry = manifest.get('clips', {}).get(clip_key, {})
            # If already valid file with same hash and not forcing, we can keep it
            if not force and is_valid_mp3(clip_path) and existing_entry.get('hash') == text_hash and not existing_entry.get('isPlaceholder', True):
                skipped.append(clip_key)
                manifest['clips'][clip_key] = {
                    'hash': text_hash,
                    'text': text,
                    'type': item['type'],
                    'available': True,
                    'isPlaceholder': False
                }
                continue

            # Synthesize with Edge TTS
            try:
                print(f"  + Synthesizing: {clip_key} ...", end="", flush=True)
                await synthesize_clip(text, voice, clip_path)
                if is_valid_mp3(clip_path):
                    size = os.path.getsize(clip_path)
                    print(f" OK ({size} bytes)")
                    generated.append(clip_key)
                    manifest['clips'][clip_key] = {
                        'hash': text_hash,
                        'text': text,
                        'type': item['type'],
                        'available': True,
                        'isPlaceholder': False
                    }
                else:
                    print(" FAILED (file too small or invalid)")
                    failed.append(clip_key)
            except Exception as e:
                print(f" ERROR ({e})")
                failed.append(clip_key)

    # Save manifest
    manifest['version'] = 1
    manifest['generated_at'] = "2026-10-31T12:00:00Z"
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("\n--------------------------------------------------")
    print(f"Edge-TTS Generation Summary:")
    print(f"- Newly generated: {len(generated)}")
    print(f"- Skipped (valid): {len(skipped)}")
    print(f"- Failed:          {len(failed)}")
    print("--------------------------------------------------")

if __name__ == '__main__':
    asyncio.run(main())
