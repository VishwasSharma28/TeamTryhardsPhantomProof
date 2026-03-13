import sys
from PIL import Image

def process_logo(src_path, dst_dir):
    try:
        img = Image.open(src_path)
        
        # Ensure it has an alpha channel for transparency
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        # Create sizes required for Chrome Extension
        sizes = [16, 48, 128]
        
        for size in sizes:
            # High-quality resize
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            resized_img.save(f'{dst_dir}/icon{size}.png', 'PNG')
            
        print("Successfully generated true logo icons.")
        
    except Exception as e:
        print(f"Error processing logo: {e}")

if __name__ == '__main__':
    src = r"d:\Bdget Buddy\TeamTryhardsPhantomProof\frontend\asset\logo.png"
    dst = r"d:\Bdget Buddy\TeamTryhardsPhantomProof\Phantom Extension\icons"
    process_logo(src, dst)
