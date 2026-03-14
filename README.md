# PHANTOMPROOF.ai — The Reality Firewall
<p> Demo Link: https://youtube.com/watch?v=_kpUFVTkmDs&feature=shared</p>
<p align="center">
  <img src="docs/assets/phantomproof-banner.png" alt="PhantomProof Banner" width="100%" />
</p>

<p align="center">
  <b>Trust Nothing. Verify Everything.</b><br/>
  AI-powered forensic verification for manipulated media, fake news, and fraudulent digital proofs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Forensics-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge" />
  <img src="https://img.shields.io/badge/OSINT-Enabled-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Explainable-AI-success?style=for-the-badge" />
</p>

---

## 🚀 Overview

**PHANTOMPROOF.ai** is an AI-powered verification platform built to detect and explain digital deception.

It helps users investigate:
- **AI-generated and manipulated images**
- **Fake news screenshots and misleading visual claims**
- **Forged payment receipts and transaction proofs**
- **Historical misinformation patterns and reuse timelines**

Instead of returning a simple “fake” or “real” label, PHANTOMPROOF produces an **investigative forensic report** using:
- Digital forensics
- OCR text extraction
- CLIP-based semantic understanding
- OSINT verification
- Timeline reconstruction
- Explainable AI evidence generation

---

## 🧠 Problem Statement

The rapid rise of AI-generated media, edited screenshots, recycled images, and forged digital documents has made it increasingly difficult to trust online content. Existing detection tools often give binary outputs without explaining the evidence, making it hard for users, journalists, investigators, and institutions to verify authenticity with confidence.

**PHANTOMPROOF.ai** solves this by combining forensic analysis, semantic AI, OCR, OSINT, and explainable reporting into a single verification workflow that helps users understand **what is suspicious, why it is suspicious, and how the claim evolved over time**.

---

## 🎯 What Makes It Different

### PHANTOMPROOF is not just a detector — it is an **investigative verification engine**.

✅ Detects AI-generated / manipulated media  
✅ Extracts embedded claims using OCR  
✅ Verifies text against open-source intelligence  
✅ Explains the reasoning behind every result  
✅ Reconstructs misinformation history using known cases  
✅ Generates downloadable forensic reports  
✅ Designed for real-world use in journalism, cyber safety, public trust, and fraud prevention  

---

## 🏆 Core Features

### 1. AI Image & Manipulation Detection
Analyzes uploaded images for digital tampering and synthetic generation signals.

**Signals used:**
- Error Level Analysis (ELA)
- Metadata integrity
- Sharpness and symmetry analysis
- HuggingFace AI-image classifier
- Visual artifact inspection

---

### 2. Fake News Verification
Detects whether screenshots, headlines, and visual claims are misleading, unsupported, or manipulated.

**Pipeline includes:**
- OCR claim extraction
- Semantic classification
- OSINT cross-checking
- Historical misinformation matching
- Timeline-based reasoning

---

### 3. Fake Receipt Verification
Flags suspicious payment proofs and receipt screenshots.

**Checks include:**
- Layout consistency
- OCR field extraction
- Suspicious visual edits
- Receipt anomaly detection
- Future backend-ready fraud model integration

---

### 4. Explainable AI Evidence Engine
Generates structured evidence across four sections:
- Digital Forensics
- Contextual Analysis
- Logical Consistency
- Final Conclusion

This makes the verdict understandable, auditable, and demo-ready.

---

### 5. Misinformation Timeline Reconstruction
Rebuilds the historical spread of a suspicious claim by matching OCR text against known misinformation cases.

**Output includes:**
- Chronological case events
- Narrative explanation
- Fact-check references
- Prior publication context

---

### 6. Downloadable Forensic Report
Generates a polished forensic report containing:
- Executive Summary
- Score breakdown
- Visual evidence
- Evidence explanation
- Timeline analysis
- Final conclusion

---

## 👥 Target Users

- Journalists and fact-checkers
- Cybersecurity and fraud analysts
- Law enforcement / investigators
- Educational institutions
- Financial verification teams
- Social media trust & safety teams
- General users verifying viral claims

---




## 🏗️ High-Level Architecture

```mermaid
flowchart TD
    A[User Uploads Image / Screenshot / Receipt] --> B[Frontend Interface]
    B --> C[FastAPI Backend]

    C --> D[Forensics Engine]
    C --> E[OCR Engine]
    C --> F[CLIP Semantic Engine]
    C --> G[OSINT Verification]
    C --> H[Timeline Engine]
    C --> I[Explanation Engine]

    D --> J[ELA + Metadata + Image Signals]
    E --> K[Extracted Text / Claim]
    F --> L[Semantic Label + Confidence]
    G --> M[Source Matches / Verification Result]
    H --> N[Historical Case Match + Timeline]
    I --> O[Structured Evidence Narrative]

    J --> P[Decision Fusion Layer]
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    P --> Q[Final Verdict + Confidence + Report]
    Q --> R[Frontend Dashboard]
    Q --> S[PDF Forensic Report]
