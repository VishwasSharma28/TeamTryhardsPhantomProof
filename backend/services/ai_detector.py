"""
=============================================================================
ai_detector.py — Production AI-Generated Image & Deepfake Detector
=============================================================================
ROLE IN THE ARCHITECTURE:
  This module determines whether an uploaded image was created by generative
  AI (e.g., Midjourney, DALL-E, Stable Diffusion) or taken with a real camera.
  It is called during the `/scan/image` pipeline by scan_routes.py.

HOW IT WORKS (HYBRID ENSEMBLE):
  1. Deep Learning Model (85% weight):
     Uses a Vision Transformer (ViT) fine-tuned for synthetic image detection
     ('umm-maybe/AI-image-detector' from HuggingFace).
  2. Computer Vision Heuristics (15% combined weight):
     - Sharpness variance via Laplacian operator (AI images often have unnatural high-frequency edges).
     - Horizontal facial/body symmetry (AI portraits frequently exhibit unnaturally mirrored poses).
     - HSV Color Histogram Entropy (AI generators often have distinct, smooth color distributions).
=============================================================================
"""

import cv2
import numpy as np
from PIL import Image
import torch
from transformers import pipeline
import os
import traceback

class RealAIDetector:
    """
    Detector class that encapsulates the HuggingFace Vision Transformer pipeline
    and secondary computer vision forensic metrics.
    """
    def __init__(self):
        """
        Initializes the model on CPU.
        Loads 'umm-maybe/AI-image-detector' via HuggingFace's transformers pipeline.
        Device is set to -1 for portable CPU execution across cloud and local setups.
        """
        print("[ai_detector] Loading PRODUCTION AI detector (umm-maybe/AI-image-detector)...")
        try:
            self.classifier = pipeline(
                "image-classification",
                model="umm-maybe/AI-image-detector",
                revision="main",
                device=-1,  # CPU execution (works on any server without GPU requirements)
                torch_dtype=torch.float32
            )
            print("[ai_detector] Production model loaded successfully")
        except Exception as e:
            print(f"[ai_detector] Model load failed: {e}")
            self.classifier = None
    
    def detect_real_ai(self, image_path):
        """
        Runs the full AI detection pipeline on a single image.

        Parameters:
            image_path (str): The local path to the image file to analyze.

        Returns:
            dict: Structured result containing:
                  - 'ai_confidence': Final ensemble score (0 to 100%).
                  - 'is_ai_generated': Boolean flag (True if score > 50%).
                  - 'primary_model': Raw label ('artificial'/'AI' vs 'human'/'real').
                  - 'breakdown': Scores for individual signals (HF Model, Sharpness, Symmetry, Color).
                  - 'explanations': Human-readable bullet points in English and Hindi.
        """
        try:
            # 1. Load and resize image to standard 512x512 expected by ViT
            img = Image.open(image_path).convert('RGB').resize((512, 512))
            
            # 2. Run the HuggingFace Vision Transformer classifier
            result = self.classifier(img)
            if isinstance(result, list):
                result = result[0]
            
            # Extract probability: if label is artificial/AI, take score directly; otherwise take (1 - score)
            ai_prob = result['score'] * 100 if result['label'] == 'artificial' or result['label'] == 'AI' else (1 - result['score']) * 100
            
            # 3. Computer Vision Backup Signals (Forensics)
            cv_img = cv2.imread(image_path)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            
            # Signal A: Sharpness Analysis (Laplacian Variance)
            # Unusually high variance often signals synthetic sharpness or digital hyper-realism
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharp_score = max(0, min((sharpness - 50) / 500, 1)) * 100
            
            # Signal B: Horizontal Symmetry Check
            # AI characters/objects often have unnatural left-to-right mirror symmetry
            cols = gray.shape[1]
            sym_score = np.mean(np.abs(gray[:, :cols//2] - np.fliplr(gray[:, (cols+1)//2:])))
            sym_score = min(sym_score / 0.03, 1) * 100
            
            # Signal C: Color Distribution Entropy
            # Measures how color is spread across Hue-Saturation-Value channels
            hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
            hist_entropy = 0
            for i in range(3):
                hist = cv2.calcHist([hsv], [i], None, [256], [0, 256])
                hist = hist / (np.sum(hist) + 1e-10)
                hist_entropy -= np.sum(hist * np.log(hist + 1e-10))
                
            color_score = max(0, min((10 - hist_entropy) / 3, 1)) * 100
            
            # 4. Score Fusion: Combine HF model prediction with CV heuristics
            # The pretrained transformer gets 85% of the vote, and CV signals get 5% each.
            final_score = ai_prob * 0.85 + sharp_score * 0.05 + sym_score * 0.05 + color_score * 0.05
            
            # Visual status indicator for quick dashboard parsing
            icon = "🟢" if final_score < 15 else "🔴" if final_score > 85 else "🟡"
            
            return {
                "ai_confidence": float(round(final_score, 1)),
                "icon_color": icon,
                "is_ai_generated": bool(final_score > 50),
                "primary_model": result['label'],
                "model_confidence": float(round(result['score'] * 100, 1)),
                "breakdown": {
                    "HF_Model": float(round(ai_prob, 1)),
                    "Sharpness": float(round(sharp_score, 1)),
                    "Symmetry": float(round(sym_score, 1)),
                    "Color": float(round(color_score, 1))
                },
                "explanations": {
                    "en": [
                        f"HF Classifier: {result['label']} ({result['score']:.0%})",
                        f"Sharpness variance: {sharpness:.0f}",
                        f"Horizontal symmetry: {sym_score:.3f}"
                    ],
                    "hi": [
                         f"HF Classifier: {result['label']} ({result['score']:.0%})",
                        f"Sharpness variance: {sharpness:.0f}",
                        f"Horizontal symmetry: {sym_score:.3f}"
                    ]
                },
                "technical_details": {
                    "hf_label": result['label'],
                    "hf_score": f"{result['score']:.1%}",
                    "sharpness_var": float(round(sharpness, 1)),
                    "symmetry": f"{sym_score:.1f}%"
                }
            }
        except Exception as e:
            print(f"DETECTION ERROR: {traceback.format_exc()}")
            return {
                "ai_confidence": 0,
                "icon_color": "🟢",
                "is_ai_generated": False,
                "error": str(e),
                "breakdown": {"HF_Model": 0, "Sharpness": 0, "Symmetry": 0, "Color": 0},
                "explanations": {
                    "en": ["Error", "Error", "Error"],
                    "hi": ["Error", "Error", "Error"]
                }
            }

# Global singleton instance loaded once at backend startup
detector = RealAIDetector()
