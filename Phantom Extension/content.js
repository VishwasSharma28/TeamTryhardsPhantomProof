let sidebarIframe = null;
let isSidebarOpen = false;
let isCropping = false;
let cropOverlay, cropBox, hintBox;
let startX, startY;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggle_sidebar") {
        toggleSidebar();
    }
});

window.addEventListener("message", (event) => {
    if (event.data && event.data.action) {
        if (event.data.action === "start_crop") {
            startCropping();
        } else if (event.data.action === "close_sidebar") {
            closeSidebar();
        }
    }
});

function toggleSidebar() {
    if (isSidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    isSidebarOpen = true;

    // Shrink host page
    document.documentElement.style.transition = "width 0.35s cubic-bezier(0.25, 1, 0.5, 1)";
    document.documentElement.style.width = "60%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100vh";

    // Create iframe
    sidebarIframe = document.createElement("iframe");
    sidebarIframe.id = "phantomproof-sidebar";
    sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
    
    // Style the iframe
    Object.assign(sidebarIframe.style, {
        position: "fixed", right: "0", top: "0", width: "40%", height: "100vh",
        zIndex: "2147483647", border: "none", background: "transparent",
        boxShadow: "-10px 0 25px rgba(0, 0, 0, 0.5)",
        transform: "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
        colorScheme: "light"
    });

    document.body.appendChild(sidebarIframe);

    requestAnimationFrame(() => {
        sidebarIframe.style.transform = "translateX(0)";
    });
}

function closeSidebar() {
    if (!isSidebarOpen) return;
    isSidebarOpen = false;

    if (isCropping) cancelCropping();

    document.documentElement.style.width = "100%";
    document.documentElement.style.overflow = "";
    document.documentElement.style.height = "";

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

function startCropping() {
    if (isCropping) return;
    isCropping = true;

    cropOverlay = document.createElement('div');
    Object.assign(cropOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '60vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.4)', zIndex: '2147483646', cursor: 'crosshair',
        backdropFilter: 'blur(2px)' // subtle blur
    });
    
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

    cropBox = document.createElement('div');
    Object.assign(cropBox.style, {
        position: 'absolute', border: '2px dashed #60a5fa', background: 'rgba(59, 130, 246, 0.1)',
        display: 'none', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
    });
    cropOverlay.style.background = 'transparent'; // Let the cropBox shadow handle the dimming effect
    cropOverlay.appendChild(cropBox);

    document.body.appendChild(cropOverlay);

    cropOverlay.addEventListener('mousedown', onMouseDown);
}

function cancelCropping() {
    if (!isCropping) return;
    cropOverlay.remove();
    isCropping = false;
    
    if (sidebarIframe && sidebarIframe.contentWindow) {
        sidebarIframe.contentWindow.postMessage({ action: "crop_cancelled" }, "*");
    }
}

function onMouseDown(e) {
    if (e.target.textContent === "Cancel") return;
    startX = e.clientX;
    startY = e.clientY;
    
    // Hide hint while dragging
    if (hintBox) hintBox.style.opacity = '0';

    cropBox.style.left = startX + 'px';
    cropBox.style.top = startY + 'px';
    cropBox.style.width = '0px';
    cropBox.style.height = '0px';
    cropBox.style.display = 'block';
    
    cropOverlay.addEventListener('mousemove', onMouseMove);
    cropOverlay.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
    const currentX = Math.min(Math.max(0, e.clientX), window.innerWidth * 0.6); // clamp to 60vw boundary
    const currentY = Math.min(Math.max(0, e.clientY), window.innerHeight);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    cropBox.style.width = width + 'px';
    cropBox.style.height = height + 'px';
    cropBox.style.left = Math.min(currentX, startX) + 'px';
    cropBox.style.top = Math.min(currentY, startY) + 'px';
}

function onMouseUp(e) {
    cropOverlay.removeEventListener('mousemove', onMouseMove);
    cropOverlay.removeEventListener('mouseup', onMouseUp);
    
    const rect = cropBox.getBoundingClientRect();
    
    if (rect.width < 20 || rect.height < 20) {
        cancelCropping();
        return;
    }

    // Hide everything before capture
    cropOverlay.style.display = 'none';
    
    // Wait for display:none to render
    setTimeout(() => {
        captureAndCrop(rect);
    }, 100);
}

function captureAndCrop(rect) {
    chrome.runtime.sendMessage({ action: "capture_screenshot" }, (response) => {
        cropOverlay.remove();
        isCropping = false;
        
        if (response && response.dataUrl) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Calculate correct scale ratio matching the original image dimensions vs screen viewport
                const scaleX = img.width / window.innerWidth;
                const scaleY = img.height / window.innerHeight;
                
                canvas.width = rect.width * scaleX;
                canvas.height = rect.height * scaleY;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 
                    rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY,
                    0, 0, canvas.width, canvas.height);
                    
                const croppedDataUrl = canvas.toDataURL('image/png');
                
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
