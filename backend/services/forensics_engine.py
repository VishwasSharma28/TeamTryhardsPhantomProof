import os
import uuid
import numpy as np
import cv2
from PIL import Image, ImageChops, ImageEnhance

def calculate_ela(image_path, quality=90):
    try:
        original_img = Image.open(image_path).convert('RGB')
        
        # Save temporarily
        temp_path = f"temp_ela_{uuid.uuid4().hex}.jpg"
        original_img.save(temp_path, "JPEG", quality=quality)
        
        compressed_img = Image.open(temp_path)
        
        # Get difference
        diff = ImageChops.difference(original_img, compressed_img)
        
        # Extrema
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            scale = 1
        else:
            scale = 255.0 / max_diff
            
        ela_img = ImageEnhance.Brightness(diff).enhance(scale)
        
        ela_array = np.array(ela_img)
        std_dev = np.std(ela_array)
        
        # Score calculation 0-100
        score = max(0, min(100, 100 - (std_dev * 2)))
        
        # Generate heatmap
        heatmap = cv2.applyColorMap(ela_array, cv2.COLORMAP_JET)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return score, heatmap
    except Exception as e:
        print(f"ELA Error: {e}")
        return 50.0, np.zeros((100, 100, 3), dtype=np.uint8)

def calculate_metadata(image_path):
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        score = 85.0
        flags = []
        if exif is None:
            score = 50.0
            flags.append("missing_exif")
        else:
            if 305 in exif: # Software tag
                software = str(exif[305]).lower()
                if any(x in software for x in ['photoshop', 'gimp', 'canva', 'edit']):
                    score = 20.0
                    flags.append("metadata_software_edit")
        return score, flags
    except Exception as e:
        print(f"Metadata Error: {e}")
        return 50.0, ["missing_exif"]

def calculate_noise(image_path):
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        laplacian = cv2.Laplacian(img, cv2.CV_64F)
        variance = laplacian.var()
        
        score = min(100.0, (variance / 3000.0) * 100.0)
        return max(30.0, score)
    except Exception as e:
        print(f"Noise Error: {e}")
        return 50.0

def calculate_copymove(image_path):
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        sift = cv2.SIFT_create()
        keypoints, descriptors = sift.detectAndCompute(img, None)
        
        flags = []
        if descriptors is None or len(descriptors) < 10:
            return 90.0, flags
            
        bf = cv2.BFMatcher()
        matches = bf.knnMatch(descriptors, descriptors, k=2)
        
        good_matches = 0
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                pt1 = np.array(keypoints[m.queryIdx].pt)
                pt2 = np.array(keypoints[m.trainIdx].pt)
                dist = np.linalg.norm(pt1 - pt2)
                if dist > 50:
                    good_matches += 1
                    
        score = max(0.0, 100.0 - (good_matches * 10.0))
        if score < 70:
            flags.append("copy_move_detected")
        return score, flags
    except Exception as e:
        print(f"CopyMove Error: {e}")
        return 60.0, []

def analyze_image(file_id, base_dir=None):
    if base_dir is None:
        # Go up two levels from backend/services to reach root
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
        
    uploads_dir = os.path.join(base_dir, "uploads")
    outputs_dir = os.path.join(base_dir, "outputs")
    
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)
    
    image_path = os.path.join(uploads_dir, file_id)
    # Check with extensions if file_id has no extension
    if not os.path.exists(image_path):
        for ext in ['.jpg', '.png', '.jpeg']:
            if os.path.exists(image_path + ext):
                image_path = image_path + ext
                break
                
    if not os.path.exists(image_path):
        print(f"Creating a dummy image at {image_path}...")
        img = np.zeros((500, 500, 3), dtype=np.uint8)
        img[:] = (200, 200, 200)
        cv2.putText(img, "DUMMY IMAGE FOR TESTING", (20, 250), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        random_noise = np.random.randint(0, 50, (500, 500, 3), dtype=np.uint8)
        img = cv2.add(img, random_noise)
        
        # Ensure it has an extension for imwrite
        if not image_path.lower().endswith(('.jpg', '.png', '.jpeg')):
            image_path = image_path + ".jpg"
            
        cv2.imwrite(image_path, img)

    ela_score, heatmap_img = calculate_ela(image_path)
    meta_score, meta_flags = calculate_metadata(image_path)
    noise_score = calculate_noise(image_path)
    cm_score, cm_flags = calculate_copymove(image_path)
    
    # Save Heatmap
    # Generate clean heatmap filename based on the file_id without ext
    base_file_id = os.path.splitext(file_id)[0]
    heatmap_filename = f"{base_file_id}_heatmap.png"
    heatmap_path = os.path.join(outputs_dir, heatmap_filename)
    cv2.imwrite(heatmap_path, heatmap_img)
    
    w_ela = 0.35
    w_meta = 0.25
    w_noise = 0.20
    w_cm = 0.20
    
    final_score = (ela_score * w_ela) + (meta_score * w_meta) + (noise_score * w_noise) + (cm_score * w_cm)
    
    flags = list(set(meta_flags + cm_flags))
    
    return {
        "authenticity_score": round(final_score, 1),
        "signal_breakdown": {
            "ela": round(ela_score, 1),
            "metadata": round(meta_score, 1),
            "noise": round(noise_score, 1),
            "copy_move": round(cm_score, 1)
        },
        "heatmap_url": f"outputs/{heatmap_filename}",
        "flags": flags,
        "formula": "0.35×ELA + 0.25×Metadata + 0.20×Noise + 0.20×CopyMove"
    }

if __name__ == "__main__":
    test_id = "test_image"
    print(f"Running test for {test_id}...")
    result = analyze_image(test_id)
    print("RESULT:")
    import json
    print(json.dumps(result, indent=2))
