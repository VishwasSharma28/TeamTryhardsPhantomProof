"""
=============================================================================
forensics_engine.py — Low-Level Digital Image Forensics Engine
=============================================================================
ROLE IN THE ARCHITECTURE:
  This module performs classical computer vision forensics on uploaded images.
  Unlike deep learning models that treat the image as high-level concepts, this
  file inspects the RAW PIXELS and FILE METADATA for tampering signatures:
    1. Error Level Analysis (ELA) for re-compression and spliced text/objects.
    2. EXIF metadata analysis for editing software signatures (Photoshop, Canva).
    3. Noise variance analysis to catch artificial smoothing.
    4. SIFT-based Copy-Move forgery detection to find cloned regions.

CALLED BY:
  - backend/routers/scan_routes.py -> `scan_image()` and `analyze()`
=============================================================================
"""

import os
import uuid
import numpy as np
import cv2
from PIL import Image, ImageChops, ImageEnhance

def calculate_ela(image_path, quality=90):
    """
    Error Level Analysis (ELA).

    HOW ELA WORKS:
      JPEG is a lossy compression format. Every time a JPEG is saved, each 8x8 pixel
      block loses a predictable amount of data. If someone pastes an alien object or
      fake text into an image and saves it, that newly modified area will compress
      at a DIFFERENT rate than the untouched background.

    STEPS:
      1. Re-save the original image at 90% JPEG quality to a temporary file.
      2. Compute the absolute pixel difference between original and re-compressed image.
      3. Scale up the differences so human eyes and algorithms can see anomalies.
      4. Compute standard deviation of error: high variance indicates localized editing.
      5. Convert the difference into a false-color JET heatmap (blue=untouched, red=edited).

    Returns:
      (score: float [0-100], heatmap: np.ndarray [OpenCV BGR image])
    """
    try:
        original_img = Image.open(image_path).convert('RGB')
        
        # Step 1: Save temporarily at known JPEG compression quality
        temp_path = f"temp_ela_{uuid.uuid4().hex}.jpg"
        original_img.save(temp_path, "JPEG", quality=quality)
        
        compressed_img = Image.open(temp_path)
        
        # Step 2: Compute absolute pixel difference (error)
        diff = ImageChops.difference(original_img, compressed_img)
        
        # Step 3: Normalize error to 0-255 scale so subtle compression artifacts pop out
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            scale = 1
        else:
            scale = 255.0 / max_diff
            
        ela_img = ImageEnhance.Brightness(diff).enhance(scale)
        
        ela_array = np.array(ela_img)
        std_dev = np.std(ela_array)
        
        # High standard deviation across the image suggests inconsistent compression (editing)
        # Score is inverted: higher score = more authentic; lower score = modified
        score = max(0, min(100, 100 - (std_dev * 2)))
        
        # Step 5: Generate color heatmap (Jet: blue is low error, red/yellow is high error)
        heatmap = cv2.applyColorMap(ela_array, cv2.COLORMAP_JET)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return score, heatmap
    except Exception as e:
        print(f"ELA Error: {e}")
        return 50.0, np.zeros((100, 100, 3), dtype=np.uint8)

def calculate_metadata(image_path):
    """
    EXIF Metadata Integrity Check.

    HOW IT WORKS:
      Camera photos carry rich EXIF tags (camera maker, exposure, GPS, date).
      When an image is edited in Photoshop, GIMP, or Canva, the software embeds
      its name into EXIF tag 305 ('Software').
      Conversely, social media screenshots strip EXIF entirely.

    Returns:
      (score: float, flags: list[str])
    """
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        score = 85.0
        flags = []
        if exif is None:
            # Missing EXIF is common in web downloads/screenshots, scored as neutral (50%)
            score = 50.0
            flags.append("missing_exif")
        else:
            # Tag 305 corresponds to 'Software'
            if 305 in exif:
                software = str(exif[305]).lower()
                # If editing tools are present, drop authenticity score significantly
                if any(x in software for x in ['photoshop', 'gimp', 'canva', 'edit']):
                    score = 20.0
                    flags.append("metadata_software_edit")
        return score, flags
    except Exception as e:
        print(f"Metadata Error: {e}")
        return 50.0, ["missing_exif"]

def calculate_noise(image_path):
    """
    Noise Pattern Consistency Check.

    HOW IT WORKS:
      Real camera sensors introduce natural optical noise (grain). AI generators
      and skin-smoothing filters often produce unnaturally smooth surfaces.
      Using the Laplacian operator, we compute the variance of the grayscale image.
      Extremely low variance indicates synthetic smoothing or AI generation.

    Returns:
      score: float (0 to 100%)
    """
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        laplacian = cv2.Laplacian(img, cv2.CV_64F)
        variance = laplacian.var()
        
        # Normalise variance to 0-100 scale; natural photos typically fall between 500-3000
        score = min(100.0, (variance / 3000.0) * 100.0)
        return max(30.0, score)
    except Exception as e:
        print(f"Noise Error: {e}")
        return 50.0

def calculate_copymove(image_path):
    """
    Copy-Move Forgery Detection using SIFT (Scale-Invariant Feature Transform).

    HOW IT WORKS:
      In copy-move forgery, a malicious editor clones part of an image (e.g. duplicating
      a crowd, covering a missile, or duplicating text).
      SIFT extracts invariant keypoint descriptors across the image, and a Fast
      Nearest Neighbor matcher compares every keypoint to every other keypoint in the
      same picture. If multiple distinct distant points have nearly identical descriptors,
      a cloned region is detected.

    Returns:
      (score: float, flags: list[str])
    """
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        sift = cv2.SIFT_create()
        keypoints, descriptors = sift.detectAndCompute(img, None)
        
        flags = []
        if descriptors is None or len(descriptors) < 10:
            return 90.0, flags
            
        # Match keypoints against themselves using k-Nearest Neighbors
        bf = cv2.BFMatcher()
        matches = bf.knnMatch(descriptors, descriptors, k=2)
        
        good_matches = 0
        for m, n in matches:
            # Lowe's ratio test: discard matches that are identical because they are the same point
            if m.distance < 0.75 * n.distance:
                pt1 = np.array(keypoints[m.queryIdx].pt)
                pt2 = np.array(keypoints[m.trainIdx].pt)
                dist = np.linalg.norm(pt1 - pt2)
                # Ignore self-matches (distance < 50 pixels)
                if dist > 50:
                    good_matches += 1
                    
        # Subtract points for duplicate distant matches
        score = max(0.0, 100.0 - (good_matches * 10.0))
        if score < 70:
            flags.append("copy_move_detected")
        return score, flags
    except Exception as e:
        print(f"CopyMove Error: {e}")
        return 60.0, []

def analyze_image(file_id, base_dir=None):
    """
    Orchestrates all 4 forensic checks and produces a composite authenticity score.

    Weighted Score Formula:
      Final Score = (35% * ELA) + (25% * Metadata) + (20% * Noise) + (20% * CopyMove)

    Parameters:
      file_id: Filename of the uploaded image inside the `uploads/` directory.

    Returns:
      dict: Composite authenticity score, signal breakdown, path to ELA heatmap, and flags.
    """
    if base_dir is None:
        # Resolve repository root dynamically
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
        # Fallback dummy image generator for headless unit testing
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

    # Run the 4 core forensic checks
    ela_score, heatmap_img = calculate_ela(image_path)
    meta_score, meta_flags = calculate_metadata(image_path)
    noise_score = calculate_noise(image_path)
    cm_score, cm_flags = calculate_copymove(image_path)
    
    # Save the ELA false-color heatmap into the outputs directory for UI presentation
    base_file_id = os.path.splitext(file_id)[0]
    heatmap_filename = f"{base_file_id}_heatmap.png"
    heatmap_path = os.path.join(outputs_dir, heatmap_filename)
    cv2.imwrite(heatmap_path, heatmap_img)
    
    # Weighted fusion weights
    w_ela = 0.35      # 35% weight: strongest indicator of digital edits & text splicing
    w_meta = 0.25     # 25% weight: file origin & camera history
    w_noise = 0.20    # 20% weight: surface texture and AI smoothness
    w_cm = 0.20       # 20% weight: region duplication / cloning
    
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
