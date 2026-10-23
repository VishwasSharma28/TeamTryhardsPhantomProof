// ==============================================================================
// content.js - PHANTOMPROOF Chrome Extension Content Script
// ==============================================================================
// This script is injected directly into web pages you visit.
// It handles two main jobs:
// 1. Sliding open/closed the sidebar iframe on the right 40% of the screen.
// 2. Letting the user drag-to-select (crop) any area on the web page to scan for fraud.
// ==============================================================================

// Holds the reference to the sidebar iframe element
let sidebarIframe = null;

// Tracks whether the sidebar is currently visible
let isSidebarOpen = false;

// Tracks whether the user is actively selecting an area to crop
let isCropping = false;

// DOM elements used during the cropping process
let cropOverlay, cropBox, hintBox;

// Coordinates where the user started clicking to draw the crop box
let startX, startY;

// ------------------------------------------------------------------------------
// Message Listener 1: Messages from the background service worker (background.js)
// ------------------------------------------------------------------------------
// When the user clicks the extension icon in Chrome's toolbar, background.js
// sends a "toggle_sidebar" action. We catch it here and toggle the sidebar.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggle_sidebar") {
        toggleSidebar();
    }
});

// ------------------------------------------------------------------------------
// Message Listener 2: Messages from inside the sidebar iframe (sidebar.js)
// ------------------------------------------------------------------------------
// The sidebar iframe runs in an isolated frame. When the user clicks buttons inside
// the sidebar (like "Select Scan Area" or the Close "X" button), sidebar.js sends
// window.postMessage. We receive those messages here.
window.addEventListener("message", (event) => {
    if (event.data && event.data.action) {
        if (event.data.action === "start_crop") {
            // User clicked "Select Scan Area" inside the sidebar
            startCropping();
        } else if (event.data.action === "close_sidebar") {
            // User clicked the close button inside the sidebar
            closeSidebar();
        }
    }
});

// Helper function: opens sidebar if closed, closes sidebar if open
function toggleSidebar() {
    if (isSidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ------------------------------------------------------------------------------
// openSidebar: Injects the sidebar and shrinks the host webpage to fit
// ------------------------------------------------------------------------------
function openSidebar() {
    isSidebarOpen = true;

    // Shrink the current webpage to 60% width so the sidebar (40%) doesn't cover content
    document.documentElement.style.transition = "width 0.35s cubic-bezier(0.25, 1, 0.5, 1)";
    document.documentElement.style.width = "60%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100vh";

    // Create an iframe that loads sidebar.html from extension assets
    sidebarIframe = document.createElement("iframe");
    sidebarIframe.id = "phantomproof-sidebar";
    sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
    
    // Style the iframe: fixed to the right 40% of the browser window
    Object.assign(sidebarIframe.style, {
        position: "fixed", right: "0", top: "0", width: "40%", height: "100vh",
        zIndex: "2147483647", border: "none", background: "transparent",
        boxShadow: "-10px 0 25px rgba(0, 0, 0, 0.5)",
        transform: "translateX(100%)", // start off-screen to the right
        transition: "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
        colorScheme: "light"
    });

    // Add iframe to the webpage DOM
    document.body.appendChild(sidebarIframe);

    // Smoothly slide the iframe in from the right edge
    requestAnimationFrame(() => {
        sidebarIframe.style.transform = "translateX(0)";
    });
}

// ------------------------------------------------------------------------------
// closeSidebar: Slides out the sidebar and restores webpage to full width
// ------------------------------------------------------------------------------
function closeSidebar() {
    if (!isSidebarOpen) return;
    isSidebarOpen = false;

    // If the user was in the middle of dragging a crop box, cancel it
    if (isCropping) cancelCropping();

    // Restore host webpage back to normal full width
    document.documentElement.style.width = "100%";
    document.documentElement.style.overflow = "";
    document.documentElement.style.height = "";

    // Animate the sidebar sliding out to the right before deleting it from DOM
    if (sidebarIframe) {
        sidebarIframe.style.transform = "translateX(100%)";
        setTimeout(() => {
            if (sidebarIframe && sidebarIframe.parentNode) {
                sidebarIframe.parentNode.removeChild(sidebarIframe);
            }
            sidebarIframe = null;
        }, 350);
    }
}

// ------------------------------------------------------------------------------
// startCropping: Creates an interactive overlay so the user can drag a selection box
// ------------------------------------------------------------------------------
function startCropping() {
    if (isCropping) return;
    isCropping = true;

    // 1. Create dark backdrop overlay over the left 60% of the screen
    cropOverlay = document.createElement('div');
    Object.assign(cropOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '60vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: '2147483646', cursor: 'crosshair',
        backdropFilter: 'blur(2px)' // subtle blur
    });
    
    // 2. Instruction pill shown at the top of the screen
    hintBox = document.createElement('div');
    hintBox.textContent = "Drag to select area to scan";
    Object.assign(hintBox.style, {
        position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
        color: '#fff', background: 'rgba(59, 130, 246, 0.9)', padding: '12px 24px', 
        borderRadius: '30px', fontFamily: 'sans-serif', fontSize: '15px', 
        fontWeight: 'bold', pointerEvents: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        zIndex: '2147483647'
    });
    cropOverlay.appendChild(hintBox);

    // 3. Cancel button in the top right of the overlay
    const cancelBtn = document.createElement('div');
    cancelBtn.textContent = "Cancel";
    Object.assign(cancelBtn.style, {
        position: 'absolute', top: '40px', right: '40px',
        color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', 
        borderRadius: '8px', fontFamily: 'sans-serif', fontSize: '14px', 
        cursor: 'pointer', zIndex: '2147483647', border: '1px solid rgba(255,255,255,0.2)'
    });
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        cancelCropping();
    };
    cropOverlay.appendChild(cancelBtn);

    // 4. The dashed selection rectangle that resizes as the mouse moves
    cropBox = document.createElement('div');
    Object.assign(cropBox.style, {
        position: 'absolute', border: '2px dashed #60a5fa', background: 'rgba(59, 130, 246, 0.1)',
        display: 'none', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
    });
    cropOverlay.style.background = 'transparent'; // Let the cropBox shadow handle the dimming effect
    cropOverlay.appendChild(cropBox);

    // Add overlay to page
    document.body.appendChild(cropOverlay);

    // Start listening for mouse clicks to begin selection
    cropOverlay.addEventListener('mousedown', onMouseDown);
}

// ------------------------------------------------------------------------------
// cancelCropping: Aborts cropping and notifies sidebar iframe
// ------------------------------------------------------------------------------
function cancelCropping() {
    if (!isCropping) return;
    cropOverlay.remove();
    isCropping = false;
    
    // Notify sidebar so button text resets back to "Select Scan Area"
    if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage({ action: "crop_cancelled" }, "*");
    }
}

// ------------------------------------------------------------------------------
// onMouseDown: Records mouse start position when user clicks down to draw box
// ------------------------------------------------------------------------------
function onMouseDown(e) {
    if (e.target.textContent === "Cancel") return;
    startX = e.clientX;
    startY = e.clientY;
    
    // Hide instruction hint while dragging
    if (hintBox) hintBox.style.opacity = '0';

    // Position cropBox at click point with 0 width and height
    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
    cropBox.style.display = 'block';
    
    // Track mouse dragging and release
    cropOverlay.addEventListener('mousemove', onMouseMove);
    cropOverlay.addEventListener('mouseup', onMouseUp);
}

// ------------------------------------------------------------------------------
// onMouseMove: Dynamically updates the width and height of the dashed crop box
// ------------------------------------------------------------------------------
function onMouseMove(e) {
    // Keep X within the left 60% of the screen so user cannot crop the sidebar itself
    const currentX = Math.min(Math.max(0, e.clientX), window.innerWidth * 0.6);
    const currentY = Math.min(Math.max(0, e.clientY), window.innerHeight);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    // Update box dimensions and position
    cropBox.style.width = width + 'px';
    cropBox.style.height = height + 'px';
    cropBox.style.left = Math.min(currentX, startX) + 'px';
    cropBox.style.top = Math.min(currentY, startY) + 'px';
}

// ------------------------------------------------------------------------------
// onMouseUp: Finishes drawing the box and prepares to capture the selected area
// ------------------------------------------------------------------------------
function onMouseUp(e) {
    cropOverlay.removeEventListener('mousemove', onMouseMove);
    cropOverlay.removeEventListener('mouseup', onMouseUp);
    
    const rect = cropBox.getBoundingClientRect();
    
    // If the selection is smaller than 20x20 pixels, treat it as an accidental click and cancel
    if (rect.width < 20 || rect.height < 20) {
        cancelCropping();
        return;
    }

    // Hide overlay so the dark shadow and dashed borders don't appear in screenshot
    cropOverlay.style.display = 'none';
    
    // Give browser 100ms to repaint without overlay, then capture screenshot
    setTimeout(() => {
        captureAndCrop(rect);
    }, 100);
}

// ------------------------------------------------------------------------------
// captureAndCrop: Requests tab screenshot and crops to user's selected coordinates
// ------------------------------------------------------------------------------
function captureAndCrop(rect) {
    // Request background.js to capture visible tab using chrome.tabs.captureVisibleTab
    chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
        cropOverlay.remove();
        isCropping = false;
        
        if (response && response.dataUrl) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // Calculate scale ratio matching image resolution to browser viewport (for Retina/High-DPI screens)
                const scaleX = img.width / window.innerWidth;
                const scaleY = img.height / window.innerHeight;
                
                canvas.width = rect.width * scaleX;
                canvas.height = rect.height * scaleY;
                
                const ctx = canvas.getContext('2d');
                // Draw only the cropped slice from the screenshot onto the canvas
                ctx.drawImage(img, 
                    rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY,
                    0, 0, canvas.width, canvas.height);
                    
                // Convert cropped canvas into a base64 image PNG data URL
                const croppedDataUrl = canvas.toDataURL('image/png');
                
                // Send the cropped image to the sidebar iframe so it can preview and analyze it
                if (sidebarIframe && sidebarIframe.contentWindow) {
                    sidebarIframe.contentWindow.postMessage({
                        action: "snapshot_ready",
                        dataUrl: croppedDataUrl
                    }, "*");
                }
            };
            img.src = response.dataUrl;
        }
    });
}
