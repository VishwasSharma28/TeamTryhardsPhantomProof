chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "capture_screenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            sendResponse({ dataUrl: dataUrl });
        });
        return true; 
    }
});
