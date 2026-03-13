import cv2
import numpy as np
import os
from PIL import Image, ImageChops, ImageEnhance
import piexif

def analyze_ela(image_path: str) -> dict:
    temp_filename = image_path + ".ela.jpg"
    try:
        original = Image.open(image_path).convert('RGB')
        original.save(temp_filename, 'JPEG', quality=75)
        recompressed = Image.open(temp_filename)
        
        ela_image = ImageChops.difference(original, recompressed)
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        scale = 255.0 / max_diff if max_diff != 0 else 1
        ela_image = ImageEnhance.Brightness(ela_image).enhance(scale * 10)
        
        ela_array = np.array(ela_image)
        TAMPER_THRESHOLD = 0.03
        
        high_diff_ratio = np.sum(ela_array > 200) / ela_array.size
        
        forensics_score = min(100.0, (high_diff_ratio / TAMPER_THRESHOLD) * 50)
        tampering_detected = high_diff_ratio > TAMPER_THRESHOLD
        
        return {
            "forensics_score": forensics_score,
            "tampering_detected": tampering_detected
        }
    except Exception as e:
        print(f"ELA Analysis Error: {e}")
        return {
            "forensics_score": 0,
            "tampering_detected": False
        }
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

def extract_exif_metadata(image_path: str) -> dict:
    try:
        im = Image.open(image_path)
        if "exif" not in im.info:
            return {"has_exif": False, "software_signature": None}
            
        exif_dict = piexif.load(im.info["exif"])
        software = ""
        
        # Check standard EXIF software tag (0x0131)
        if piexif.ImageIFD.Software in exif_dict["0th"]:
            software = exif_dict["0th"][piexif.ImageIFD.Software].decode('utf-8', errors='ignore').lower()
            
        suspicious_software = ["photoshop", "canva", "gimp", "snapseed", "picsart", "lightroom"]
        is_suspicious = any(s in software for s in suspicious_software) if software else False
            
        return {
            "has_exif": True,
            "software_signature": software if software else None,
            "is_suspicious_software": is_suspicious
        }
    except Exception as e:
        print(f"EXIF Analysis Error: {e}")
        return {"has_exif": False, "software_signature": None, "is_suspicious_software": False}

def detect_profile_faces(image_path: str) -> bool:
    try:
        # Load a pre-trained Haarcascade for face detection
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        img = cv2.imread(image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        return len(faces) > 0
    except Exception as e:
        print(f"Face Detection Error: {e}")
        return False
        
def check_copy_move_forgery(image_path: str) -> bool:
    try:
        # Basic placeholder for copy-move: analyzing SURF/SIFT keypoints
        # For a basic approach without heavy ML, we extract ORB keypoints and look for dense clusters of matches to itself
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        orb = cv2.ORB_create()
        keypoints, descriptors = orb.detectAndCompute(img, None)
        
        if descriptors is None or len(keypoints) < 50:
            return False
            
        # Brute-force matcher
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        # Match against itself
        matches = bf.knnMatch(descriptors, descriptors, k=2)
        
        # We only care about the second-best match (the first is the keypoint matching itself)
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                # Calculate physical distance between the matched points
                pt1 = np.array(keypoints[m.queryIdx].pt)
                pt2 = np.array(keypoints[m.trainIdx].pt)
                dist = np.linalg.norm(pt1 - pt2)
                # If the matched patterns are far apart physically, it might be cloned
                if dist > 50:
                    good_matches.append(m)
                    
        # If there are many identical patches far apart, it's highly suspicious
        return len(good_matches) > 15
    except Exception as e:
        print(f"Copy-Move Error: {e}")
        return False
