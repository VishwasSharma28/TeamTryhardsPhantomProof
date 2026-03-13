# PhantomProof Chrome Extension

PhantomProof is a browser extension that helps detect digital tampering,
deepfakes, and suspicious media directly from any webpage. It visually
scans the page and provides quick verification insights to the user.

------------------------------------------------------------------------

## Installation Guide

Follow these steps to install the PhantomProof extension manually in
Chrome.

### 1. Open Chrome Extensions

Open Google Chrome and navigate to:

chrome://extensions

------------------------------------------------------------------------

### 2. Enable Developer Mode

In the top-right corner of the Extensions page:

-   Turn **Developer Mode** ON.

------------------------------------------------------------------------

### 3. Load the Extension

Click the **Load unpacked** button located at the top-left of the page.

------------------------------------------------------------------------

### 4. Select the Extension Folder

Browse and select the PhantomProof extension directory located at:

D:`\Bdget `{=tex}Buddy`\TeamTryhardsPhantomProof`{=tex}

After selecting the folder, Chrome will automatically install the
extension.

------------------------------------------------------------------------

### 5. Pin the Extension

Click the **Extensions icon** in Chrome's toolbar and **pin
PhantomProof** so it is easily accessible.

------------------------------------------------------------------------

### 6. Run a Scan

The extension is now active.

1.  Open any webpage (for example: Google Images or a suspicious post).
2.  Click the **PhantomProof extension icon**.
3.  The page will shift to the left.
4.  A verification sidebar will appear and begin scanning the content on
    your screen.

------------------------------------------------------------------------

## Features

-   Detects potential **deepfake images**
-   Identifies **digitally tampered media**
-   Uses **OSINT verification signals**
-   Real-time **visual scanning sidebar**

------------------------------------------------------------------------

## Project Structure

TeamTryhardsPhantomProof │ ├── manifest.json ├── background.js ├──
content.js ├── popup.html ├── popup.js └── assets/

------------------------------------------------------------------------

## Requirements

-   Google Chrome
-   Developer Mode enabled
-   Local extension folder
