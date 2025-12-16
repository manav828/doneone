import sys
import os
try:
    from PIL import Image, ImageChops
except ImportError:
    print("Pillow not installed")
    sys.exit(1)

work_dir = r"d:\Manav\premium extension\flowboard_5\public"

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def process_file(filename):
    path = os.path.join(work_dir, filename)
    if not os.path.exists(path):
        print(f"File not found: {filename}")
        return False
    
    try:
        img = Image.open(path)
        img = img.convert("RGBA")
        cropped = trim(img)
        cropped.save(path)
        print(f"Cropped {filename}")
        return True
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return False

def generate_icons(source_filename):
    source_path = os.path.join(work_dir, source_filename)
    if not os.path.exists(source_path):
        return

    try:
        img = Image.open(source_path)
        
        # Make square
        x, y = img.size
        size = max(x, y)
        new_im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        new_im.paste(img, (int((size - x) / 2), int((size - y) / 2)))
        
        sizes = [16, 48, 128]
        for s in sizes:
            resized = new_im.resize((s, s), Image.Resampling.LANCZOS)
            resized.save(os.path.join(work_dir, f"icon{s}.png"))
        print("Icons generated")
    except Exception as e:
        print(f"Error generating icons: {e}")

if __name__ == "__main__":
    p1 = process_file("logo_1.png")
    p2 = process_file("logo_2.png")
    
    # Generate icons from logo_2 (Circle) as per previous flow
    if p2:
        generate_icons("logo_2.png")
