import sys
import os
try:
    from PIL import Image
except ImportError:
    print("Pillow not installed")
    sys.exit(1)

source = r"d:\Manav\premium extension\flowboard_5\public\logo_2.png"
dest_dir = r"d:\Manav\premium extension\flowboard_5\public"

if not os.path.exists(source):
    print("Source not found")
    sys.exit(1)

try:
    img = Image.open(source)
    
    def make_square(im, min_size=256, fill_color=(0, 0, 0, 0)):
        x, y = im.size
        size = max(min_size, x, y)
        new_im = Image.new('RGBA', (size, size), fill_color)
        new_im.paste(im, (int((size - x) / 2), int((size - y) / 2)))
        return new_im

    square_img = make_square(img)
    
    sizes = [16, 48, 128]
    for size in sizes:
        new_img = square_img.resize((size, size), Image.Resampling.LANCZOS)
        new_img.save(os.path.join(dest_dir, f"icon{size}.png"))
    print("Success")
except Exception as e:
    print(f"Error: {e}")
