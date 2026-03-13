let currentMode = "payment"; 
let currentSnapshotDataUrl = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlInput = document.getElementById("backend-url");
    const btnSaveUrl = document.getElementById("btn-save-url");
    const btnClose = document.getElementById("btn-close");
    const btnStartCrop = document.getElementById("btn-start-crop");
    const btnRetake = document.getElementById("btn-retake");
    const btnAnalyze = document.getElementById("btn-analyze");

    const placeholderBox = document.getElementById("capture-placeholder");
    const snapshotBox = document.getElementById("snapshot-box");
    const imgSnapshot = document.getElementById("snapshot-img");

    const errorBox = document.getElementById("error-box");
    const resultContainer = document.getElementById("dynamic-result-container");

    const tabs = document.querySelectorAll(".tab-btn");

    // TABS
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMode = btn.dataset.mode;
            
            // Just clear the results, keep image if any
            resultContainer.innerHTML = "";
            errorBox.style.display = "none";
        });
    });

    // STORAGE
    chrome.storage.local.get(["phantomproof_base_url"], (res) => {
        if (res.phantomproof_base_url) urlInput.value = res.phantomproof_base_url;
    });

    btnSaveUrl.addEventListener("click", () => {
        const val = urlInput.value.trim() || "http://localhost:8000";
        chrome.storage.local.set({ "phantomproof_base_url": val }, () => {
            btnSaveUrl.textContent = "SAVED!";
            setTimeout(() => { btnSaveUrl.textContent = "SAVE"; }, 1500);
        });
    });

    // CLOSING & CROPPING
    btnClose.addEventListener("click", () => {
        window.parent.postMessage({ action: "close_sidebar" }, "*");
    });

    btnStartCrop.addEventListener("click", () => {
        btnStartCrop.textContent = "Select area on left...";
        window.parent.postMessage({ action: "start_crop" }, "*");
    });

    btnRetake.addEventListener("click", resetImageState);

    window.addEventListener("message", (event) => {
        if (!event.data) return;
        if (event.data.action === "crop_cancelled") {
            btnStartCrop.textContent = "Select Scan Area";
        }
        else if (event.data.action === "snapshot_ready") {
            currentSnapshotDataUrl = event.data.dataUrl;
            imgSnapshot.src = currentSnapshotDataUrl;
            imgSnapshot.onload = () => {
                placeholderBox.style.display = "none";
                snapshotBox.style.display = "flex";
                btnStartCrop.textContent = "Select Scan Area";
                btnAnalyze.disabled = false;
            };
        }
    });

    function resetImageState() {
        currentSnapshotDataUrl = null;
        imgSnapshot.src = "";
        snapshotBox.style.display = "none";
        placeholderBox.style.display = "flex";
        btnAnalyze.disabled = true;
        
        resultContainer.innerHTML = "";
        errorBox.style.display = "none";
    }

    btnAnalyze.addEventListener("click", async () => {
        if (!currentSnapshotDataUrl) return;

        btnAnalyze.disabled = true;
        document.getElementById("analyze-spinner").style.display = "block";
        document.getElementById("analyze-text").textContent = "ANALYZING...";
        errorBox.style.display = "none";
        resultContainer.innerHTML = "";

        try {
            const blob = await (await fetch(currentSnapshotDataUrl)).blob();
            const file = new File([blob], "crop_scan.png", { type: "image/png" });
            const formData = new FormData();
            formData.append("file", file);

            const baseUrl = urlInput.value.trim() || "http://localhost:8000";
            
            if (currentMode === "fakenews") {
                // Fake News Mode: Upload -> Analyze
                let upRes = await fetch(baseUrl + "/upload/", { method: "POST", body: formData });
                if (!upRes.ok) throw new Error(await getError(upRes));
                let upData = await upRes.json();
                
                let anRes = await fetch(baseUrl + "/analyze/", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ file_id: upData.file_id || upData.filename })
                });
                if (!anRes.ok) throw new Error(await getError(anRes));
                renderFakeNewsResult(await anRes.json());
                
            } else {
                // Payment or Deepfake Mode
                const endpoint = currentMode === "payment" ? "/scan/payment" : "/scan/image";
                let res = await fetch(baseUrl + endpoint, { method: "POST", body: formData });
                if (!res.ok) throw new Error(await getError(res));
                let data = await res.json();
                
                if (currentMode === "payment") renderPaymentResult(data);
                else renderDeepfakeResult(data);
            }

        } catch (err) {
            console.error(err);
            errorBox.textContent = `Analysis failed: ${err.message}`;
            errorBox.style.display = "block";
        } finally {
            btnAnalyze.disabled = false;
            document.getElementById("analyze-spinner").style.display = "none";
            document.getElementById("analyze-text").textContent = "RUN FRAUD ANALYSIS";
        }
    });

    async function getError(res) {
        let text = await res.text();
        try {
            let j = JSON.parse(text);
            return j.detail || j.error || text;
        } catch { return text; }
    }

    // ========= RENDERERS =========

    function getVerdictUI(score, isFraudNews = false) {
        if (isFraudNews) {
            let s = String(score).toUpperCase();
            if (s === "TRUE" || s === "VERIFIED") return { class: "genuine", text: "✅ VERIFIED TRUE", color: "var(--green)" };
            if (s === "FALSE" || s === "SCAM") return { class: "fraud", text: "🚨 FALSE / SCAM", color: "var(--red)" };
            return { class: "suspicious", text: "⚠️ UNVERIFIED", color: "var(--yellow)" };
        }
        
        // Deepfake / Payment numbers
        if (score <= 30) return { class: "genuine", text: "✅ LIKELY GENUINE", color: "var(--green)" };
        if (score <= 60) return { class: "suspicious", text: "⚠️ SUSPICIOUS", color: "var(--yellow)" };
        return { class: "fraud", text: "🚨 LIKELY FRAUD", color: "var(--red)" };
    }

    function renderPaymentResult(data) {
        const analysis = data.payment_analysis || data;
        const fraudScore = analysis.fraud_score || 0;
        const v = getVerdictUI(fraudScore);

        resultContainer.innerHTML = `
            <div class="result-card">
                <div class="verdict-banner ${v.class}">${v.text}</div>
                <div class="score-section">
                    <div class="score-header"><div class="section-label" style="margin:0">FRAUD SCORE</div><div class="score-val mono">${fraudScore} / 100</div></div>
                    <div class="progress-bg"><div class="progress-bar" style="width:${fraudScore}%; background-color:${v.color}"></div></div>
                </div>
                <div class="data-grid">
                    <div class="data-cell"><div class="data-label">Amount Detected</div><div class="data-value">${analysis.amount_detected || 'N/A'}</div></div>
                    <div class="data-cell"><div class="data-label">Bank Detected</div><div class="data-value">${analysis.bank_detected || 'N/A'}</div></div>
                    <div class="data-cell"><div class="data-label">UTR Number</div><div class="data-value mono">${analysis.utr || 'N/A'}</div></div>
                    <div class="data-cell"><div class="data-label">UTR Valid</div><div class="data-value ${analysis.utr_valid ? 'color-green' : 'color-red'}">${analysis.utr_valid ? '✓ Valid' : '✗ Invalid'}</div></div>
                </div>
                <div class="dynamic-list">
                    <div class="section-label">SECURITY CHECKS</div>
                    <div class="list-item"><span>Tampering Detected</span> <span class="list-val ${analysis.tampering_detected ? 'color-red' : 'color-green'}">${analysis.tampering_detected ? 'Yes' : 'No'}</span></div>
                    <div class="list-item"><span>Layout Anomaly</span> <span class="list-val ${analysis.layout_anomaly ? 'color-red' : 'color-green'}">${analysis.layout_anomaly ? 'Yes' : 'No'}</span></div>
                </div>
            </div>
        `;
    }

    function renderDeepfakeResult(data) {
        const auth = data.confidence || data.authenticity_score || 0;
        // deepfake relies on high authenticity = good. fraud score inverted.
        const fakeScore = 100 - auth; 
        const v = getVerdictUI(fakeScore);

        const aiConf = data.ai_ensemble?.ai_confidence !== undefined ? data.ai_ensemble.ai_confidence : "N/A";
        const ela = data.signals?.ela || data.ela_score || 0;

        resultContainer.innerHTML = `
            <div class="result-card">
                <div class="verdict-banner ${v.class}">${v.text}</div>
                <div class="score-section">
                    <div class="score-header"><div class="section-label" style="margin:0">MANIPULATION RISK</div><div class="score-val mono">${Math.round(fakeScore)}%</div></div>
                    <div class="progress-bg"><div class="progress-bar" style="width:${fakeScore}%; background-color:${v.color}"></div></div>
                </div>
                <div class="data-grid">
                    <div class="data-cell"><div class="data-label">AI Generation</div><div class="data-value mono">${aiConf}%</div></div>
                    <div class="data-cell"><div class="data-label">ELA Score</div><div class="data-value mono">${ela}%</div></div>
                </div>
                <div class="dynamic-list">
                    <div class="section-label">AI ENSEMBLE</div>
                    <div class="list-item"><span>Detector Model</span> <span class="list-val mono">umm-maybe/AI</span></div>
                    ${data.explanation && data.explanation.main_reason ? 
                        `<div style="font-size:0.8rem; color:var(--text-3); margin-top:10px;">${data.explanation.main_reason}</div>` : ''}
                </div>
            </div>
        `;
    }

    function renderFakeNewsResult(data) {
        const verdict = data.verdict || "UNVERIFIED";
        const v = getVerdictUI(verdict, true);
        const sourcesHtml = (data.matched_sources || []).map(s => `<span class="pill">${s}</span>`).join(" ") || "<span style='color:var(--text-3)'>None</span>";

        resultContainer.innerHTML = `
            <div class="result-card">
                <div class="verdict-banner ${v.class}">${v.text}</div>
                
                <div class="data-grid single">
                    <div class="data-cell">
                        <div class="data-label">Extracted Text (OCR)</div>
                        <div class="data-value mono" style="font-size:0.75rem; white-space:pre-wrap; max-height:80px; overflow-y:auto;">${data.extracted_text || 'No text detected'}</div>
                    </div>
                </div>
                <div class="dynamic-list">
                    <div class="section-label">MATCHED SOURCES</div>
                    <div style="margin-bottom:10px;">${sourcesHtml}</div>
                    
                    ${data.fingerprint_match ? `<div class="list-item"><span>Known Pattern</span> <span class="list-val color-red">${data.fingerprint_match}</span></div>` : ''}
                    
                    <div class="section-label" style="margin-top:15px">EXPLANATION</div>
                    <div style="font-size:0.8rem; line-height:1.4; color:var(--text-2); overflow-y:auto; max-height: 100px;">
                        ${data.explanation || 'No detailed explanation provided by OSINT database.'}
                    </div>
                </div>
            </div>
        `;
    }

});
