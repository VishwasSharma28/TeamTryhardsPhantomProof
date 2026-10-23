// ==============================================================================
// background.js - PHANTOMPROOF Chrome Extension Background Service Worker
// ==============================================================================
// Runs in the background of Chrome. It handles:
// 1. Listening for extension icon clicks to tell the active tab to open/close the sidebar.
// 2. Capturing visible screenshots of the active browser tab when requested by content.js.
// ==============================================================================

// 1. When the user clicks the PhantomProof extension icon in the Chrome toolbar:
// Send a message to the active webpage's content script to toggle the sidebar.
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" });
});

// 2. Listen for internal messages from content.js or sidebar.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // When content.js finishes drawing a crop box, it asks for a screenshot:
    if (message.action === "capture_screenshot") {
        // Capture the currently visible browser tab as a PNG data URL
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            // Send captured image data back to the requester
            sendResponse({ dataUrl: dataUrl });
        });
        // Return true to tell Chrome that sendResponse will be called asynchronously
        return true; 
    }
});
