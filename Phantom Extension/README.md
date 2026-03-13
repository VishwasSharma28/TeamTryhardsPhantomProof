# PhantomProof AI Chrome Extension

This extension integrates PhantomProof AI's powerful payment fraud detection directly into any webpage via a split-screen sidebar. 

It automatically captures screenshots of the active page and allows you to scan them against the PhantomProof `/scan/payment` endpoint.

## How to Install

1. Open Chrome and go to: `chrome://extensions`
2. Enable "Developer Mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `Phantom Extension` folder
5. The PhantomProof icon will appear in your Chrome toolbar
6. Make sure your PhantomProof AI backend is running (default: `http://localhost:8000`)
7. Navigate to any page containing a payment screenshot
8. Click the PhantomProof icon → the sidebar will slide open
9. The page snapshot is captured automatically
10. Click "RUN FRAUD ANALYSIS" to send to your backend and evaluate for fraud.

## Configuration

To change the backend URL:
- Open the sidebar
- Edit the "BACKEND ENDPOINT" field at the top
- Click Save (persists automatically in Chrome local storage)
