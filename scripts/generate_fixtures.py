"""
Generates synthetic image fixtures for AgriScan automated unit & regression testing.
Produces images in src/ml/__tests__/fixtures/:
1. sharp_leaf.png
2. blurry_leaf.png
3. dark_leaf.png
4. glare_leaf.png
5. rotated_exif.jpg
"""

import os
import numpy as np
from PIL import Image, ImageFilter

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    fixtures_dir = os.path.join(root, 'src', 'ml', '__tests__', 'fixtures')
    os.makedirs(fixtures_dir, exist_ok=True)

    size = 256
    # Base synthetic leaf: green background with distinct veins
    base = np.zeros((size, size, 3), dtype=np.uint8)
    base[:, :, 0] = 30  # Red
    base[:, :, 1] = 160 # Green
    base[:, :, 2] = 40  # Blue

    # Add sharp vein patterns (high-contrast edges)
    for i in range(10, size - 10, 20):
        base[i:i+3, :, 1] = 230
        base[:, i:i+3, 1] = 230
        base[i:i+2, :, 0] = 10
        base[:, i:i+2, 0] = 10

    sharp_img = Image.fromarray(base)
    sharp_path = os.path.join(fixtures_dir, 'sharp_leaf.png')
    sharp_img.save(sharp_path)
    print(f"Generated: {sharp_path}")

    # Blurry leaf: Gaussian blur radius 4
    blurry_img = sharp_img.filter(ImageFilter.GaussianBlur(radius=4))
    blurry_path = os.path.join(fixtures_dir, 'blurry_leaf.png')
    blurry_img.save(blurry_path)
    print(f"Generated: {blurry_path}")

    # Dark leaf: dimmed luminance
    dark_arr = (base.astype(np.float32) * 0.15).astype(np.uint8)
    dark_img = Image.fromarray(dark_arr)
    dark_path = os.path.join(fixtures_dir, 'dark_leaf.png')
    dark_img.save(dark_path)
    print(f"Generated: {dark_path}")

    # Glare leaf: bright specular white blob in center
    glare_arr = base.copy()
    c = size // 2
    glare_arr[c-35:c+35, c-35:c+35] = 255
    glare_img = Image.fromarray(glare_arr)
    glare_path = os.path.join(fixtures_dir, 'glare_leaf.png')
    glare_img.save(glare_path)
    print(f"Generated: {glare_path}")

    # Rotated EXIF image: save JPEG with EXIF orientation 6 (90 degrees CW)
    exif_img = sharp_img.copy()
    exif = exif_img.getexif()
    exif[0x0112] = 6  # 0x0112 is Orientation tag
    exif_path = os.path.join(fixtures_dir, 'rotated_exif.jpg')
    exif_img.save(exif_path, exif=exif)
    print(f"Generated: {exif_path}")

    print("All fixtures generated successfully!")

if __name__ == '__main__':
    main()
