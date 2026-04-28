// ==UserScript==
// @name         Improvements for Slidysim stats page
// @namespace    dphdmn
// @author       dphdmn
// @version      1.13.1
// @description  Click on solves in stats to view replays / Average calculations with graphs
// @match        https://play.slidysim.com/*
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Cpath fill='%23FFCC4D' d='M18 34c-6 0-11-5-11-13S12 2 18 2s11 10 11 19-5 13-11 13z'/%3E%3C/svg%3E
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/574795/Improvements%20for%20Slidysim%20stats%20page.user.js
// @updateURL https://update.greasyfork.org/scripts/574795/Improvements%20for%20Slidysim%20stats%20page.meta.js
// ==/UserScript==

(function () {
    'use strict';

    let overlay = null;
    let iframe = null;
    let isDragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isLoadingReplay = false;
    let currentMainRowMetadata = null; // Store metadata from main table click
    let isIframeReady = false; // Track if iframe is loaded and ready
    let useDetailsForStats = false;
    let extractedSolvesMain = [];
    let extractedSolvesDetails = [];

    function parseDetailTime(timeStr) {
        const parts = timeStr.split(':').map(part => parseFloat(part));
        let seconds = 0;

        for (let i = 0; i < parts.length - 1; i++) {
            seconds = (seconds + parts[i]) * 60;
        }
        seconds += parts[parts.length - 1];

        return seconds;
    }

    GM_addStyle(`

        .replay-overlay {
            position: fixed;
            z-index: 10000;
            background: #1e1e1e;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            overflow: hidden;
            min-width: 400px;
            min-height: 500px;
            display: none;
        }

        .replay-header {
            background: rgba(60,60,60,0.8);
            color: white;
            padding: 10px;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }

        .replay-title {
            font-size: 14px;
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
        }

        .replay-controls {
            display: flex;
            gap: 8px;
        }

        .replay-controls button {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px 8px;
            font-size: 12px;
            transition: background 0.2s;
        }

        .replay-controls button:hover {
            background: rgba(255,255,255,0.4);
        }

        .replay-controls button.close-btn:hover {
            background: #f44336;
        }

        .replay-iframe-container {
            width: 100%;
            height: calc(100% - 50px);
            background: white;
            position: relative;
        }

        .replay-iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .loading-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #667eea;
            font-size: 14px;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10001;
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
            vertical-align: middle;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .solve-row-clickable {
            cursor: pointer;
            transition: background 0.2s;
        }

        .solve-row-clickable:hover {
            background: rgba(102, 126, 234, 0.1);
        }

        .detail-row-clickable {
            cursor: pointer;
            transition: background 0.2s;
        }

        .detail-row-clickable:hover {
            background: rgba(102, 126, 234, 0.15);
        }

        .avgs-graphs-container {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: 16px;
            width: 100%;
        }

        .avgs-graph-card {
            flex: 1 1 calc(50% - 8px);
            min-width: 400px;
            max-width: calc(50% - 8px);
            background: #222;
            border: 1px solid #555;
            padding: 12px;
            box-sizing: border-box;
            transition: all 0.3s ease;
        }

        .avgs-graph-card.full-width {
            flex: 1 1 100%;
            max-width: 100%;
        }

        @media screen and (max-width: 900px) {
            .avgs-graph-card {
                flex: 1 1 100%;
                max-width: 100%;
                min-width: 300px;
            }
        }

        .avgs-graph-title {
            color: #ccc;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
        }

        .avgs-graph-canvas-container {
            position: relative;
            width: 100%;
            height: 220px;
        }

        .avgs-graph-canvas {
            width: 100% !important;
            height: 100% !important;
        }

        .avgs-no-data-message {
            color: #888;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            font-style: italic;
        }
    `);


    function createOverlay() {
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.className = 'replay-overlay';
        overlay.style.top = '250px';
        overlay.style.right = '20px';
        overlay.style.left = 'auto';
        overlay.style.width = '450px';
        overlay.style.height = '684px';

        overlay.innerHTML = `
        <div class="replay-header">
            <div class="replay-title">Sliding Puzzle Replay</div>
            <div class="replay-controls">
                <button id="maximizeReplayBtn" title="Maximize">□</button>
                <button id="closeReplayBtn" class="close-btn" title="Close">✖</button>
            </div>
        </div>
        <div class="replay-iframe-container" id="iframeContainer">
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
                Loading replay player...
            </div>
        </div>
    `;

        document.body.appendChild(overlay);

        // ====================== DRAG ======================
        const header = overlay.querySelector('.replay-header');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        let dragMousemoveHandler = null;
        let dragMouseupHandler = null;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;

            isDragging = true;
            const rect = overlay.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            overlay.style.cursor = 'grabbing';

            dragMousemoveHandler = (ev) => {
                if (!isDragging) return;
                let newLeft = ev.clientX - dragOffsetX;
                let newTop = ev.clientY - dragOffsetY;

                const currentRect = overlay.getBoundingClientRect();
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - currentRect.width));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - currentRect.height));

                overlay.style.left = `${newLeft}px`;
                overlay.style.top = `${newTop}px`;
                overlay.style.right = 'auto';
            };

            dragMouseupHandler = () => {
                isDragging = false;
                overlay.style.cursor = '';
                if (dragMousemoveHandler) {
                    document.removeEventListener('mousemove', dragMousemoveHandler);
                    dragMousemoveHandler = null;
                }
                if (dragMouseupHandler) {
                    document.removeEventListener('mouseup', dragMouseupHandler);
                    dragMouseupHandler = null;
                }
            };

            document.addEventListener('mousemove', dragMousemoveHandler);
            document.addEventListener('mouseup', dragMouseupHandler);
            e.preventDefault();
        });

        // ====================== MAXIMIZE ======================
        const maximizeBtn = overlay.querySelector('#maximizeReplayBtn');
        let isMaximized = false;
        let previousState = { left: '', top: '', width: '', height: '' };

        maximizeBtn.addEventListener('click', () => {
            if (!isMaximized) {
                // Save current state
                const rect = overlay.getBoundingClientRect();
                previousState = {
                    left: overlay.style.left,
                    top: overlay.style.top,
                    width: overlay.style.width,
                    height: overlay.style.height
                };

                // Maximize
                overlay.style.left = '0px';
                overlay.style.top = '0px';
                overlay.style.right = 'auto';
                overlay.style.width = `${window.innerWidth}px`;
                overlay.style.height = `${window.innerHeight}px`;
                maximizeBtn.textContent = '❐';
                maximizeBtn.title = 'Restore';
                isMaximized = true;
            } else {
                // Restore previous state
                overlay.style.top = '250px';
                overlay.style.right = '20px';
                overlay.style.left = 'auto';
                overlay.style.width = '450px';
                overlay.style.height = '684px';
                maximizeBtn.textContent = '□';
                maximizeBtn.title = 'Maximize';
                isMaximized = false;
            }
        });

        // Update maximize state when window is resized
        window.addEventListener('resize', () => {
            if (isMaximized) {
                overlay.style.width = `${window.innerWidth}px`;
                overlay.style.height = `${window.innerHeight}px`;
            }
        });

        // ====================== CLOSE ======================
        const closeBtn = overlay.querySelector('#closeReplayBtn');
        closeBtn.addEventListener('click', () => {
           // console.log("trying to close");
            if (iframe) {
                iframe.src = 'about:blank';
                iframe = null;
            }
            if (overlay) {
                overlay.style.display = 'none';
                const container = overlay.querySelector('#iframeContainer');
                if (container) {
                    container.innerHTML = `
                    <div class="loading-indicator">
                        <div class="loading-spinner"></div>
                        Loading replay player...
                    </div>
                `;
                }
            }
            isLoadingReplay = false;
            isIframeReady = false;
            isMaximized = false;
                            // Restore previous state
                overlay.style.top = '250px';
                overlay.style.right = '20px';
                overlay.style.left = 'auto';
                overlay.style.width = '450px';
                overlay.style.height = '684px';
                maximizeBtn.textContent = '□';
                maximizeBtn.title = 'Maximize';
                isMaximized = false;
            maximizeBtn.textContent = '□';
            maximizeBtn.title = 'Maximize';
        });

        return overlay;
    }

    function initializeIframe() {
        return new Promise((resolve, reject) => {
            if (iframe && isIframeReady) {
                resolve();
                return;
            }

            const container = overlay.querySelector('#iframeContainer');
            container.innerHTML = '';

            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.innerHTML = '<div class="loading-spinner"></div>Loading replay player...';
            container.appendChild(loadingDiv);

            iframe = document.createElement('iframe');
            iframe.src = 'https://dphdmn.github.io/openslidy/replay';
            iframe.allow = 'clipboard-read; clipboard-write';
            iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-modals';

            container.appendChild(iframe);
            overlay.style.display = 'block';

            iframe.onload = () => {
               // console.log('Iframe loaded and ready');
                iframe.focus();
                loadingDiv.remove();
                isIframeReady = true;
                resolve();
            };

            iframe.onerror = () => {
                loadingDiv.innerHTML = '<div class="loading-spinner"></div>Failed to load, click row again';
                setTimeout(() => {
                    if (loadingDiv.parentNode) loadingDiv.remove();
                }, 3000);
                isIframeReady = false;
                reject(new Error('Iframe failed to load'));
            };
        });
    }

    function sendReplayToIframe(solveData) {
        if (!iframe || !iframe.contentWindow || !isIframeReady) {
            console.error('Iframe not ready');
            return;
        }

        // Update overlay title
        const headerTitle = overlay.querySelector('.replay-title');
        headerTitle.textContent = solveData.overlayTitle;

        const tpsInMs = solveData.tps * 1000;

        iframe.focus();
       // console.log(`Sending replay: ${solveData.overlayTitle}`);

        iframe.contentWindow.postMessage({
            type: 'runReplay',
            solution: solveData.solution,
            event: -1,
            tps: tpsInMs,
            width: -1,
            height: -1,
            scoreTitle: "Custom",
            customScramble: solveData.customScramble,
            customMoveTimes: -1,
            cummulitive_data: -1,
            nodelay: false
        }, '*');

       // console.log('✅ Replay sent');
    }

    async function loadAndSendReplay(solveData) {
        if (isLoadingReplay) {
           // console.log('Replay already loading, please wait...');
            return;
        }

        isLoadingReplay = true;

        try {
            if (!overlay) createOverlay();

            // If iframe doesn't exist or isn't ready, initialize it
            if (!iframe || !isIframeReady) {
                await initializeIframe();
            }

            // Send the replay data
            sendReplayToIframe(solveData);

        } catch (error) {
            console.error('Error loading replay:', error);
        } finally {
            isLoadingReplay = false;
        }
    }

    function onSolveClick(rowElement) {
        useDetailsForStats = false;
        if (isLoadingReplay) {
           // console.log('Loading, please wait...');
            return;
        }

        const cells = rowElement.querySelectorAll('td');
        if (cells.length < 5) return;

        const solveNumber = cells[0]?.textContent.trim();
        const timeStr = cells[1]?.textContent.trim();

        if (timeStr.includes('DNF')) {
           // console.log('DNF solve, skipping');
            return;
        }

        // Store only solve number from main table for later use
        currentMainRowMetadata = {
            solveNumber: solveNumber
        };

        // Visual feedback
        const originalBg = rowElement.style.backgroundColor;
        rowElement.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';

        setTimeout(() => {
            rowElement.style.backgroundColor = originalBg;

            const tables = document.querySelectorAll('.session-statistics-table-container');
            if (tables.length >= 2) {
                const detailsTable = tables[1].querySelector('.session-statistics-table');
                if (detailsTable) {
                    const tbody = detailsTable.querySelector('tbody');
                    if (tbody && tbody.children.length > 0) {
                        // Make all rows in details table clickable
                        const detailRows = tbody.querySelectorAll('tr');
                        // First, load the first row by default (current behavior)
                        if (detailRows.length > 0) {
                            if (detailRows.length > 1) {
                                useDetailsForStats = true;
                                extractedSolvesDetails.length = 0;
                                calculateAvgs();
                            }
                            if (detailRows.length === 1) {
                                const firstRow = detailRows[0];
                                const detailCells = firstRow.querySelectorAll('td');
                                if (detailCells.length >= 6) {
                                    const singleId = detailCells[0]?.textContent.trim();
                                    const detailTime = detailCells[1]?.textContent.trim();
                                    const detailMoves = parseFloat(detailCells[2]?.textContent.trim());
                                    const detailTps = parseFloat(detailCells[3]?.textContent.trim());
                                    const solution = detailCells[5]?.textContent.trim();
                                    const scramble = detailCells[4]?.textContent.trim();

                                    if (solution && scramble) {
                                       // console.log(`Loading default first row (Single ID: ${singleId})`);

                                        if (!overlay) createOverlay();

                                        const overlayTitle = `Solve #${solveNumber} [Single ${singleId}] | ${detailTime} (${detailMoves} / ${detailTps})`;

                                        loadAndSendReplay({
                                            solution: solution,
                                            tps: (detailMoves / parseDetailTime(detailTime)),
                                            customScramble: scramble,
                                            overlayTitle: overlayTitle
                                        });
                                    }
                                }
                            }
                        }

                        // Add click listeners to all detail rows
                        detailRows.forEach(detailRow => {
                            if (!detailRow.hasAttribute('data-detail-listener')) {
                                detailRow.setAttribute('data-detail-listener', 'true');
                                detailRow.classList.add('detail-row-clickable');
                                detailRow.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    onDetailRowClick(detailRow);
                                });
                            }
                        });
                    }
                }
            }
        }, 200);
    }

    function onDetailRowClick(detailRow) {
        if (isLoadingReplay) {
           // console.log('Loading, please wait...');
            return;
        }

        if (!currentMainRowMetadata) {
            //console.log('No main row metadata available');
            return;
        }

        const detailCells = detailRow.querySelectorAll('td');
        if (detailCells.length < 6) return;

        const singleId = detailCells[0]?.textContent.trim();
        const detailTime = detailCells[1]?.textContent.trim();
        const detailMoves = parseFloat(detailCells[2]?.textContent.trim());
        const detailTps = parseFloat(detailCells[3]?.textContent.trim());
        const solution = detailCells[5]?.textContent.trim();
        const scramble = detailCells[4]?.textContent.trim();

        if (!solution || !scramble) {
           // console.log('Missing solution or scramble data');
            return;
        }

        // Visual feedback for detail row click
        const originalBg = detailRow.style.backgroundColor;
        detailRow.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';

        setTimeout(() => {
            detailRow.style.backgroundColor = originalBg;
        }, 200);

       // console.log(`Loading detail row (Single ID: ${singleId}, Time: ${detailTime}, Moves: ${detailMoves}, TPS: ${detailTps})`);

        if (!overlay) createOverlay();

        // Create overlay title with main row solve number AND all detail row metadata
        const overlayTitle = `Solve #${currentMainRowMetadata.solveNumber} [Single ${singleId}] | ${detailTime} (${detailMoves} / ${detailTps})`;

        loadAndSendReplay({
            solution: solution,
            tps: (detailMoves / parseDetailTime(detailTime)),
            customScramble: scramble,
            overlayTitle: overlayTitle
        });
    }

    function addSolveRowListeners() {
        const tables = document.querySelectorAll('.session-statistics-table');
        const closeObserver = new MutationObserver(() => {
            //console.log("running close ass observer");
            const tablesContainer = document.querySelector('.session-statistics-page-tables-container');
            if (!tablesContainer) {
                document.querySelector('#closeReplayBtn')?.click();
                closeObserver.disconnect();
            }
        });

        closeObserver.observe(document.body, { childList: true, subtree: true });

        // Check if we should initialize the calculator
        const innerContainer = document.querySelector('.session-statistics-page-inner-container');
        const tablesContainer = document.querySelector('.session-statistics-page-tables-container');

        if (innerContainer && tablesContainer && !calculatorContainer) {
            calculatorContainer = createCalculator();
            innerContainer.insertBefore(calculatorContainer, tablesContainer);
            setupEventListeners(calculatorContainer);
            setTimeout(handleCalculateOrClick, 100);

            // Set up table-specific observer for updates
            let tableUpdateTimeout = null;
            const tableContainer = document.querySelector('.session-statistics-table-container');
            if (tableContainer && !tableContainer.hasAttribute('data-stats-observer')) {
                tableContainer.setAttribute('data-stats-observer', 'true');
                const statsObserver = new MutationObserver(() => {
                    if (outputArea && !outputArea.value.includes('Calculating...')) {
                        if (tableUpdateTimeout) clearTimeout(tableUpdateTimeout);
                        extractedSolvesMain.length = 0;
                        extractedSolvesDetails.length = 0;
                        useDetailsForStats = false;
                        tableUpdateTimeout = setTimeout(handleCalculateOrClick, 50);
                    }
                });
                statsObserver.observe(tableContainer, { childList: true, subtree: true, characterData: true });
            }
        }

        // Add click listeners to table rows
        tables.forEach((table, index) => {
            const container = table.closest('.session-statistics-table-container');
            if (container && container.style.display !== 'none') {
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    rows.forEach(row => {
                        if (index === 0) { // Main table
                            if (!row.hasAttribute('data-replay-listener')) {
                                row.setAttribute('data-replay-listener', 'true');
                                row.classList.add('solve-row-clickable');
                                row.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    onSolveClick(row);
                                });
                            }
                        }
                        // Note: Detail table listeners are added dynamically in onSolveClick
                    });
                }
            }
        });
    }

    function observeTables() {

        // Only observe existing .session-statistics-table elements
        const tables = document.querySelectorAll('.session-statistics-table');


        tables.forEach((table) => {
            if (table.hasAttribute('data-observer-initialized')) return;
            table.setAttribute('data-observer-initialized', 'true');

            const observer = new MutationObserver(() => {
                addSolveRowListeners();
            });

            observer.observe(table, { childList: true, subtree: true });
        });

        addSolveRowListeners();
    }

    window.addEventListener('load', () => {
       // console.log('Sliding Puzzle Replay Integration loaded');

        document.addEventListener('keydown', (e) => {
            if (e.key === 'q' || e.key === 'Q') {
                setTimeout(observeTables, 10);
            }
        });

        observeTables();
    });


    //AVGS CALCULATION SECTION
    const DNF_TIME = 999999.999;
    const DNF_MOVES = 999999;
    const DNF_TPS_BAD = -1e9;

    // Dark mode styles with fancy radio buttons
    const styles = `
        .avgs-calculator-container {
            background: #333;
            padding: 8px;
            backdrop-filter: blur(8px);
            border: 1px solid #555;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-y: auto;
            min-height: 640px;
        }

        .avgs-calculator-container.collapsed {
            min-height: 0;
            overflow-y: hidden;
        }
        .avgs-calculator-container.collapsed .avgs-content {
            display: none;
        }

        .avgs-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            cursor: pointer;
            user-select: none;
        }

        .avgs-title {
            color: #e0e0e0;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .avgs-toggle-btn {
            background: rgba(100, 100, 100, 0.6);
            border: 1px solid #555;
            color: #fff;
            padding: 4px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.1s;
        }

        .avgs-toggle-btn:hover {
            background: rgba(120, 120, 120, 0.8);
        }

        /* Fancy Radio Buttons */
        .avgs-radio-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .avgs-radio-group input[type="radio"] {
            display: none;
        }

        .avgs-radio-label {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            background: rgba(70, 70, 70, 0.6);
            border: 1px solid #555;
            color: #bbb;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
        }

        .avgs-radio-label:hover {
            background: rgba(90, 90, 90, 0.8);
            border-color: #999;
            color: #fff;
        }

        .avgs-radio-label:has(input[type="radio"]:checked) {
            background: rgba(40,40,40,0.6);
            border-color: cyan;
            color: cyan;
            font-weight: 500;
        }

        .avgs-control-label {
            color: cyan;
            font-size: 13px;
            font-weight: bold;
            margin-right: 8px;
            min-width: 60px;
        }

        .avgs-layout-main {
            display: flex;
            gap: 20px;
            min-height: 300px;
            flex-wrap: wrap;
        }

        .avgs-left-section {
            flex: 1 1 350px;
            min-width: 300px;
        }

        .avgs-middle-section {
            flex: 1 1 350px;
            min-width: 300px;
            display: flex;
            flex-direction: column;
        }

        .avgs-right-section {
            flex: 1 1 350px;
            min-width: 300px;
            display: flex;
            flex-direction: column;
        }
                @media screen and (max-width: 1100px) {
            .avgs-layout-main {

            }

            .avgs-left-section,
            .avgs-middle-section,
            .avgs-right-section {
                width: 100%;
                max-width: 100%;
            }
        }
        .avgs-filters-container {
            background: #222;
            padding: 12px;
            border: 1px solid #555;
            min-height: 284px;
        }

        .avgs-filter-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .avgs-filter-row:last-child {
            margin-bottom: 0;
        }

        .avgs-filter-input {
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid #555;
            color: #fff;
            padding: 4px 8px;
            width: 80px;
            font-size: 13px;
        }

        .avgs-filter-input:focus {
            outline: none;
            border-color: #999;
        }

        .avgs-date-input {
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid #555;
            color: #fff;
            padding: 4px 8px;
            font-size: 12px;
            width: 130px;
        }

        .avgs-date-input:focus {
            outline: none;
            border-color: #999;
        }

        .avgs-date-input::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }

        .avgs-checkbox-label {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #ccc;
            font-size: 12px;
            cursor: pointer;
        }

        .avgs-checkbox-label input[type="checkbox"] {
            accent-color: #888;
        }

        .avgs-range-separator {
            color: #999;
            margin: 0 4px;
        }

        .avgs-date-range {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .avgs-quick-dates {
            display: flex;
            gap: 4px;
        }

        .avgs-quick-date-btn {
            background: rgba(80, 80, 80, 0.6);
            border: 1px solid #555;
            color: #ccc;
            padding: 8px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.1s;
            border-radius: 0 !important;
        }

        .avgs-quick-date-btn:hover {
            background: rgba(100, 100, 100, 0.8);
            color: #fff;
        }

        .avgs-end-date-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .avgs-action-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 8px;
            border-top: 1px solid #555;
        }

        .avgs-progress-section {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }

        .avgs-progress-bar {
            width: 100%;
            height: 20px;
            accent-color: #888;
        }

        .avgs-progress-text {
            color: #bbb;
            font-size: 12px;
            min-width: 45px;
        }

        .avgs-calc-btn {
            background: rgba(100, 100, 100, 0.9);
            border: none;
            border-bottom: 1px solid #555;
            color: #fff;
            padding: 6px 16px;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.1s;
            display:none;
        }

        .avgs-calc-btn:hover {
            background: rgba(120, 120, 120, 0.9);
            transform: translateY(-1px);
            border-bottom-width: 4px;
        }

        .avgs-calc-btn:active {
            transform: translateY(2px);
            border-bottom-width: 1px;
        }
        .avgs-reset-btn {
            background: rgba(140, 60, 60, 0.9);
            border: none;
            border-bottom: 3px solid #744;
            color: #fff;
            padding: 6px 12px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.1s;
        }

        .avgs-reset-btn:hover {
            background: rgba(160, 70, 70, 0.9);
            transform: translateY(-1px);
            border-bottom-width: 4px;
        }

        .avgs-kill-btn {
            background: rgba(140, 60, 60, 0.9);
            border: none;
            border-bottom: 3px solid #744;
            color: #fff;
            padding: 6px 12px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.1s;
        }

        .avgs-kill-btn:hover {
            background: rgba(160, 70, 70, 0.9);
            transform: translateY(-1px);
            border-bottom-width: 4px;
        }

        .avgs-output-area {
            width: 100%;
            flex: 1;
            min-height: 200px;
            max-height: 500px;
            background: #222;
            border: 1px solid #555;
            color: #e0e0e0;
            padding: 12px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 12px;
            line-height: 1.5;
            resize: vertical;
            box-sizing: border-box;
        }

        .avgs-output-area:focus {
            outline: none;
            border-color: #999;
        }

        .avgs-hint {
            color: #999;
            font-size: 11px;
            margin-left: 4px;
        }

        .avgs-session-stats {
            padding: 12px;
            background: #222;
            border: 1px solid #555;
        }

        .avgs-session-stats-title {
            color: cyan;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .avgs-session-stats-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 6px;
        }

        .avgs-stat-item {
            display: flex;
            align-items: baseline;
            font-size: 12px;
        }

        .avgs-stat-label {
            color: #aaa;
            min-width: 180px;
        }

        .avgs-stat-value {
            color: #e0e0e0;
            font-weight: 500;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        .avgs-best-solves {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #555;
            text-align: center;
        }

        .avgs-best-solves-title {
            color: #ccc;
            font-size: 12px;
            margin-bottom: 6px;
        }

        .avgs-best-solve-item {
            color: rgba(160, 240, 240, 1);
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            margin-bottom: 4px;
        }

.avgs-filter-summary {
    background: #222;
    border: 1px solid #555;
    border-bottom: none;
    padding: 8px 12px;
    color: cyan;
    font-size: 13px;
    font-weight: bold;
}

        .avgs-custom-input {
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid #555;
            color: #fff;
            padding: 4px 8px;
            width: 70px;
            font-size: 13px;
        }

        .avgs-custom-input:focus {
            outline: none;
            border-color: #999;
        }
    `;

    // Web Worker for calculations - OPTIMIZED VERSION
    const workerCode = `
        const DNF_TIME = 999999.999;
        const DNF_MOVES = 999999;
        const DNF_TPS_BAD = -1e9;

        function getTrimCount(ruleStr, N, customVal) {
            if (N < 3) return 0;
            if (N < 13) return 1;
            let trim = 1;
            if (ruleStr === '1') trim = 1;
            else if (ruleStr === '5%') trim = Math.ceil(0.05 * N);
            else if (ruleStr === '10%') trim = Math.ceil(0.10 * N);
            else if (ruleStr === 'custom') {
                const raw = customVal.trim();
                if (raw.includes('%')) {
                    const pct = parseFloat(raw) / 100;
                    if (!isNaN(pct)) trim = Math.ceil(pct * N);
                } else {
                    const num = parseInt(raw, 10);
                    if (!isNaN(num) && num >= 0) trim = num;
                }
            }
            if (trim * 2 >= N) trim = Math.floor((N-1)/2);
            return Math.max(0, trim);
        }

function trimmedMeanWithDNF(arr, trimEach, dnfValue) {
    const sorted = [...arr].sort((a,b) => a - b);
    const kept = sorted.slice(trimEach, sorted.length - trimEach);
    if (kept.length === 0) return { value: NaN, hasDNF: false };
    const hasDNF = kept.some(v => Math.abs(v - dnfValue) < 0.001 || (dnfValue < -1e8 && v < -1e8));
    if (hasDNF) return { value: NaN, hasDNF: true };
    const sum = kept.reduce((s,v) => s + Math.round(v * 1000), 0);
    return { value: Math.floor(sum / kept.length) / 1000, hasDNF: false };
}

        self.onmessage = function(e) {
            const { solves, category, trimRule, customTrim, avgSizes } = e.data;
            const n = solves.length;

            // Pre-extract arrays for faster access
            const times = solves.map(s => s.time);
            const moves = solves.map(s => s.moves);
            const tpses = solves.map(s => s.tps);
            const ids = solves.map(s => s.solveId);
            const timestamps = solves.map(s => s.timestamp);

            const results = [];
            const higherBetter = (category === 'tps');
            const dnfMain = category === 'time' ? DNF_TIME : (category === 'moves' ? DNF_MOVES : DNF_TPS_BAD);

            // Get the correct array based on category
            let mainArray;
            if (category === 'time') mainArray = times;
            else if (category === 'moves') mainArray = moves;
            else mainArray = tpses;

            // Process each average size
            for (let sizeIdx = 0; sizeIdx < avgSizes.length; sizeIdx++) {
                const size = avgSizes[sizeIdx];
                if (size > n || size < 3) continue;
                const trimEach = getTrimCount(trimRule, size, customTrim);
                if (trimEach * 2 >= size) continue;

                let bestMain = higherBetter ? -Infinity : Infinity;
                let bestWindow = null;

                for (let i = 0; i <= n - size; i++) {
                    const windowTimes = times.slice(i, i+size);
                    const windowMoves = moves.slice(i, i+size);
                    const windowTps = tpses.slice(i, i+size);
                    const windowMain = mainArray.slice(i, i+size);

                    const mainRes = trimmedMeanWithDNF(windowMain, trimEach, dnfMain);

                    if (mainRes.hasDNF) continue;
                    const mainAvg = mainRes.value;
                    const isBetter = higherBetter ? (mainAvg > bestMain) : (mainAvg < bestMain);

                    if (isBetter) {
                        bestMain = mainAvg;
                        const timeRes = trimmedMeanWithDNF(windowTimes, trimEach, DNF_TIME);
                        const movesRes = trimmedMeanWithDNF(windowMoves, trimEach, DNF_MOVES);
                        const tpsRes = trimmedMeanWithDNF(windowTps, trimEach, DNF_TPS_BAD);
                        bestWindow = {
                            startIdx: i, endIdx: i+size-1,
                            startId: ids[i],
                            endId: ids[i+size-1],
                            mainAvg,
                            timeAvg: timeRes.hasDNF ? null : timeRes.value,
                            movesAvg: movesRes.hasDNF ? null : movesRes.value,
                            tpsAvg: tpsRes.hasDNF ? null : tpsRes.value,
                            timestamp: timestamps[i+size-1],
                            trimEach
                        };
                    }
                }
                if (bestWindow) {
                    results.push({ size, ...bestWindow });
                }

                // Send progress update
                const progress = Math.floor(((sizeIdx + 1) / avgSizes.length) * 100);
                self.postMessage({ type: 'progress', progress });
            }
            self.postMessage({ type: 'result', results });
        };
    `;

    // Web Worker for Marathon calculations
    const workerCodeMarathon = `
        const DNF_TIME = 999999.999;
        const DNF_MOVES = 999999;

        self.onmessage = function(e) {
            const { solves, category } = e.data;
            const n = solves.length;
            const results = [];

            if (category === 'tps') {
                self.postMessage({ type: 'result', results, error: 'tps' });
                return;
            }

            const times = solves.map(s => s.time);
            const moves = solves.map(s => s.moves);
            const ids = solves.map(s => s.solveId);
            const isTime = category === 'time';
            const mainArray = isTime ? times : moves;
            const compArray = isTime ? moves : times;

            // Generate split sizes up to n
            const splitSizes = [];
            for (let i = 2; i <= Math.min(50, n); i++) splitSizes.push(i);
            for (let i = 60; i <= Math.min(100, n); i += 10) splitSizes.push(i);
            for (let i = 200; i <= Math.min(1000, n); i += 100) splitSizes.push(i);
            for (let i = 2000; i <= n; i += 1000) splitSizes.push(i);
            if (!splitSizes.includes(n) && n >= 2) splitSizes.push(n);
            splitSizes.sort((a,b) => a - b);

            for (const size of splitSizes) {
                if (size > n) continue;

                let bestMain = Infinity;
                let bestComp = 0;
                let bestStart = 0;
                let hasDNF = false;

                for (let i = 0; i <= n - size; i++) {
                    let sumMain = 0;
                    let sumComp = 0;
                    let windowHasDNF = false;

                    for (let j = 0; j < size; j++) {
                        const mainVal = mainArray[i + j];
                        if (Math.abs(mainVal - (isTime ? DNF_TIME : DNF_MOVES)) < 0.001) {
                            windowHasDNF = true;
                            break;
                        }
                        sumMain += Math.round(mainVal * 1000);
                        sumComp += Math.round(compArray[i + j] * 1000);
                    }

                    if (windowHasDNF) continue;

                    if (sumMain < bestMain) {
                        bestMain = sumMain;
                        bestComp = sumComp;
                        bestStart = i;
                        hasDNF = false;
                    }
                }

                if (bestMain < Infinity) {
                    results.push({
                        size,
                        mainSum: bestMain,
                        compSum: bestComp,
                        tps: Math.round((isTime ? bestComp / bestMain : bestMain / bestComp) * 1000) / 1000,
                        startId: ids[bestStart],
                        endId: ids[bestStart + size - 1]
                    });
                }

                const progress = Math.floor((splitSizes.indexOf(size) + 1) / splitSizes.length * 100);
                self.postMessage({ type: 'progress', progress });
            }

            self.postMessage({ type: 'result', results });
        };
    `;

    // Web Worker for Relay/EUT calculations
    const workerCodeRelay = `
        self.onmessage = function(e) {
            const { solves, type, category } = e.data;
            const results = [];

            const isTime = category === 'time';
            const isMoves = category === 'moves';

            if (category === 'tps') {
                self.postMessage({ type: 'result', results, error: 'tps' });
                return;
            }

            // Group solves by puzzle type for relay processing
            function findSubRelays(solves, sizePattern) {
                const subResults = [];

                if (type === 'relay' || type === 'width relay' || type === 'height relay') {
                    // Get unique sizes in descending order
                    const sizes = [...new Set(solves.map(s => s.size))].sort((a,b) => {
                        const aW = parseInt(a.split('x')[0]);
                        const bW = parseInt(b.split('x')[0]);
                        return bW - aW;
                    });

                    for (const size of sizes) {
                        const [w, h] = size.split('x').map(Number);
                        let subset;

                        if (type === 'width relay') {
                            subset = solves.filter(s => s.width <= w && s.height === h);
                        } else if (type === 'height relay') {
                            subset = solves.filter(s => s.height <= h && s.width === w);
                        } else {
                            subset = solves.filter(s => s.width <= w && s.height <= h && s.width === s.height);
                        }

                        if (subset.length > 0) {
    const sumMain = subset.reduce((sum, s) => sum + Math.round((isTime ? s.time : s.moves) * 1000), 0);
    const sumComp = subset.reduce((sum, s) => sum + Math.round((isTime ? s.moves : s.time) * 1000), 0);
    subResults.push({
        label: size,
        mainSum: sumMain / 1000,
        compSum: sumComp / 1000
    });
}
                    }
                } else if (type === 'eut') {
                    // For EUT: find NxN relays, width relays, height relays, and EUT subsets
                    const maxDim = Math.max(...solves.map(s => s.width));

                    for (let n = maxDim; n >= 2; n--) {
                        // NxN relay
                        const relaySolves = solves.filter(s => s.width <= n && s.height <= n && s.width === s.height);
                        if (relaySolves.length > 0) {
                            const sumMain = relaySolves.reduce((sum, s) => sum + Math.round((isTime ? s.time : s.moves) * 1000), 0);
                            const sumComp = relaySolves.reduce((sum, s) => sum + Math.round((isTime ? s.moves : s.time) * 1000), 0);
                            subResults.push({
                                label: n + 'x' + n + ' relay',
                                mainSum: sumMain / 1000,
                                compSum: sumComp / 1000
                            });
                        }

                        // NxN width relay
                        const widthSolves = solves.filter(s => s.width <= n && s.height === n);
                        if (widthSolves.length > 0) {
                            const sumMain = widthSolves.reduce((sum, s) => sum + Math.round((isTime ? s.time : s.moves) * 1000), 0);
                            const sumComp = widthSolves.reduce((sum, s) => sum + Math.round((isTime ? s.moves : s.time) * 1000), 0);
                            subResults.push({
                                label: n + 'x' + n + ' width',
                                mainSum: sumMain / 1000,
                                compSum: sumComp / 1000
                            });
                        }

                        // NxN height relay
                        const heightSolves = solves.filter(s => s.height <= n && s.width === n);
                        if (heightSolves.length > 0) {
                            const sumMain = heightSolves.reduce((sum, s) => sum + Math.round((isTime ? s.time : s.moves) * 1000), 0);
                            const sumComp = heightSolves.reduce((sum, s) => sum + Math.round((isTime ? s.moves : s.time) * 1000), 0);
                            subResults.push({
                                label: n + 'x' + n + ' height',
                                mainSum: sumMain / 1000,
                                compSum: sumComp / 1000
                            });
                        }

                        // NxN EUT
                        const eutSolves = solves.filter(s => s.width <= n && s.height <= n);
                        if (eutSolves.length > 0) {
                            const sumMain = eutSolves.reduce((sum, s) => sum + Math.round((isTime ? s.time : s.moves) * 1000), 0);
                            const sumComp = eutSolves.reduce((sum, s) => sum + Math.round((isTime ? s.moves : s.time) * 1000), 0);
                            subResults.push({
                                label: n + 'x' + n + ' eut',
                                mainSum: sumMain / 1000,
                                compSum: sumComp / 1000
                            });
                        }
                    }
                }

                return subResults;
            }

            const relayResults = findSubRelays(solves);

for (const res of relayResults) {
    results.push({
        ...res,
        tps: Math.round((isTime ? res.compSum / res.mainSum : res.mainSum / res.compSum) * 1000) / 1000
    });
}

            self.postMessage({ type: 'result', results });
        };
    `;

    let worker = null;

    function createWorker() {
        if (worker) {
            worker.terminate();
        }
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        return worker;
    }

    function createMarathonWorker() {
        if (worker) {
            worker.terminate();
        }
        const blob = new Blob([workerCodeMarathon], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        return worker;
    }

    function createRelayWorker() {
        if (worker) {
            worker.terminate();
        }
        const blob = new Blob([workerCodeRelay], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        return worker;
    }

    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    let calculatorContainer = null;
    let outputArea = null;
    let progressBar = null;
    let progressText = null;
    let currentWorker = null;
    let sessionStatsDiv = null;
    let filterSummaryDiv = null;

    function parseTimeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(part => parseFloat(part));
        let seconds = 0;

        for (let i = 0; i < parts.length - 1; i++) {
            seconds = (seconds + parts[i]) * 60;
        }
        seconds += parts[parts.length - 1];
        return seconds;
    }

    function formatTimeFromSeconds(seconds) {
        if (seconds === null || isNaN(seconds)) return 'DNF';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    function formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    function formatTimestamp(s) {
        try {
            const m = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\s*(AM|PM))?/i);
            if (!m) return s;

            let [, y, mo, d, h, mi, se, p] = m;
            h = (+h % 12 + (p?.toUpperCase() === "PM" ? 12 : 0))
                .toString().padStart(2, "0");

            return `${y}.${mo}.${d} ${h}:${mi}:${se}`;
        } catch {
            return s;
        }
    }

    function parseDateFromTable(timestampStr) {
        try {
            const match = timestampStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
            if (match) {
                const [_, year, month, day, hour, minute, second] = match;
                const isPM = timestampStr.includes('PM');
                let hours = parseInt(hour);
                if (isPM && hours < 12) hours += 12;
                if (!isPM && hours === 12) hours = 0;
                return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), hours, parseInt(minute), parseInt(second)));
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function extractSolvesFromTable() {
        const tables = document.querySelectorAll('.session-statistics-table');
        const targetTable = useDetailsForStats ? tables[1] : tables[0];
        const cache = useDetailsForStats ? extractedSolvesDetails : extractedSolvesMain;
        if (cache.length) return cache;
        if (!targetTable) return [];

        const headers = Array.from(targetTable.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const isFMC = headers.includes('Optimals') || headers.includes('Attempts');

        const rows = targetTable.querySelector('tbody')?.querySelectorAll('tr') || [];
        const solves = [];

        rows.forEach(row => {
            const c = (i) => row.querySelectorAll('td')[i]?.textContent.trim() || '';

            // Map column indices for each type
            const isDetailsFMC = useDetailsForStats && isFMC;
            const timeIdx = isDetailsFMC ? 2 : 1;
            const movesIdx = isDetailsFMC ? 3 : 2;
            const tpsIdx = (useDetailsForStats && isFMC) ? null : 3;
            const tsIdx = isDetailsFMC ? 4 : 4;

            const solveId = parseInt(c(0)) || 0;
            const timeText = c(timeIdx);
            const movesText = c(movesIdx);
            const tpsText = tpsIdx !== null ? c(tpsIdx) : '';
            const timestamp = c(tsIdx);

            const timeVal = timeText === 'DNF' ? DNF_TIME :
                (timeText.includes(':') ? parseTimeToSeconds(timeText) :
                (isNaN(parseFloat(timeText)) ? DNF_TIME : parseFloat(timeText)));
            const movesVal = (movesText === 'DNF' || isNaN(parseFloat(movesText))) ? DNF_MOVES : parseFloat(movesText);

            let tpsVal;
            if (isFMC) {
                tpsVal = (movesVal !== DNF_MOVES && timeVal !== DNF_TIME && timeVal > 0) ? Math.round((movesVal / timeVal) * 1000) / 1000 : DNF_TPS_BAD;
            } else {
                tpsVal = parseFloat(tpsText);
                if (isNaN(tpsVal) || tpsText === 'DNF') tpsVal = DNF_TPS_BAD;
            }
            const formatNumeric = (value) => {
                        if (value === null) return 'DNF';
                        return (Math.floor(value * 1000) / 1000).toFixed(3);
                    };
            solves.push({
                solveId, time: timeVal, timeStr: timeText,
                moves: movesVal, movesStr: movesText,
                tps: tpsVal, tpsStr: isFMC ? formatNumeric(tpsVal) : tpsText,
                timestamp, date: parseDateFromTable(timestamp),
                isDNF: timeText === 'DNF'
            });
        });

        if (useDetailsForStats) extractedSolvesDetails = solves;
        else extractedSolvesMain = solves;
        return solves;
    }

    function filterSolves(solves) {
        const startId = parseInt(document.querySelector('#avgs-start-id')?.value) || null;
        const endId = parseInt(document.querySelector('#avgs-end-id')?.value) || null;

        let filtered = solves;

        if (startId !== null || endId !== null) {
            filtered = filtered.filter(solve => {
                if (startId !== null && solve.solveId < startId) return false;
                if (endId !== null && solve.solveId > endId) return false;
                return true;
            });
        }

        const useDateRange = document.querySelector('#avgs-use-date-range')?.checked || false;

        if (useDateRange) {
            const startDateStr = document.querySelector('#avgs-start-date')?.value;
            const endDateStr = document.querySelector('#avgs-end-date')?.value;
            const noEndDate = document.querySelector('#avgs-no-end-date')?.checked || false;

            let startDate = null;
            let endDate = null;

            if (startDateStr) {
                const [y, m, d] = startDateStr.split('-').map(Number);
                startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
            }

            if (!noEndDate && endDateStr) {
                const [y, m, d] = endDateStr.split('-').map(Number);
                endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
            }

            filtered = filtered.filter(solve => {
                if (!solve.date) return false;
                if (startDate && solve.date < startDate) return false;
                if (endDate && solve.date > endDate) return false;
                return true;
            });
        }

        return filtered;
    }

    function getSelectedAvgSizes() {
        const selected = document.querySelector('input[name="avgSet"]:checked')?.value || 'major100';
        if (selected === 'all') {
            return [
                4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
                61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
                81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
                200, 250, 500, 1000, 2000, 2500, 5000, 10000
            ];
        } else if (selected === 'major') {
            return [5, 12, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
        } else {
            return [5, 12, 25, 50, 100];
        }
    }

    function resetToMainStats() {
        useDetailsForStats = false;
        calculateAvgs();
        const resetBtn = document.querySelector('.avgs-reset-btn');
        resetBtn.style.display = 'none';
    }

    function killWorker() {
        if (currentWorker) {
            currentWorker.terminate();
            currentWorker = null;
        }
        progressBar.value = 0;
        progressText.textContent = 'killed';
        outputArea.value = 'Calculation cancelled.';
        const killBtn = document.querySelector('.avgs-kill-btn');
        killBtn.style.display = 'none';
    }

    function updateFilterSummary() {
        const trimRule = document.querySelector('input[name="trimRule"]:checked');
        const trimText = trimRule ? trimRule.value : '5%';

        const category = document.querySelector('input[name="category"]:checked');
        const categoryText = category ? category.value : 'time';

        const startId = document.querySelector('#avgs-start-id')?.value;
        const endId = document.querySelector('#avgs-end-id')?.value;

        const useDateRange = document.querySelector('#avgs-use-date-range')?.checked || false;

        let filterText = `Best averages in session, using ${trimText} outliers, best ${categoryText} values`;

        if (startId || endId) {
            filterText += `, solves`;
            if (startId && endId) {
                filterText += ` from ${startId} to ${endId}`;
            } else if (startId) {
                filterText += ` from ${startId}`;
            } else if (endId) {
                filterText += ` up to ${endId}`;
            }
        }

        if (useDateRange) {
            const startDate = document.querySelector('#avgs-start-date')?.value;
            const noEndDate = document.querySelector('#avgs-no-end-date')?.checked || false;
            const endDate = document.querySelector('#avgs-end-date')?.value;

            if (startDate) {
                filterText += `, date from ${startDate}`;
                if (!noEndDate && endDate) {
                    filterText += ` to ${endDate}`;
                }
            }
        }

        if (filterSummaryDiv) {
            if (!useDetailsForStats) {
                filterSummaryDiv.textContent = filterText;
            } else {
                filterSummaryDiv.textContent = "Best splits of selected solve (will be lower, because of website bug)";
            }
        }
    }

    function updateSessionStats() {
        const allSolves = extractSolvesFromTable();
        const filteredSolves = filterSolves(allSolves);

        if (filteredSolves.length === 0) {
            if (sessionStatsDiv) {
                sessionStatsDiv.innerHTML = '<div class="avgs-session-stats-title">📈 Session Statistics</div><div class="avgs-stat-value">No solves match filters</div>';
            }
            return;
        }

        // Calculate stats - note: solves are in chronological order (oldest first in table)
        const firstSolve = filteredSolves[0];
        const lastSolve = filteredSolves[filteredSolves.length - 1];

        const parseAndAdjustTimestamp = (s, timeToSubtract) => {
            if (timeToSubtract == DNF_TIME) { return s; }
            const m = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\s*(AM|PM))?/i);
            if (!m) return s;

            let [, y, mo, d, h, mi, se, p] = m;
            const ampm = p || '';

            // Convert to 24-hour for math
            let hour24 = (+h % 12 + (ampm.toUpperCase() === "PM" ? 12 : 0));

            // Create date and subtract time
            const date = new Date(+y, +mo - 1, +d, hour24, +mi, +se);
            const adjustedDate = new Date(date.getTime() - timeToSubtract * 1000);

            // Convert back to original format
            let adjustedHour = adjustedDate.getHours();
            const adjustedAmpm = adjustedHour >= 12 ? 'PM' : 'AM';
            adjustedHour = adjustedHour % 12 || 12;

            const year = adjustedDate.getFullYear();
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const hour = String(adjustedHour).padStart(2, '0');
            const minute = String(adjustedDate.getMinutes()).padStart(2, '0');
            const second = String(adjustedDate.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hour}:${minute}:${second} ${adjustedAmpm}`;
        };

        const sessionStartTime = parseAndAdjustTimestamp(firstSolve.timestamp, firstSolve.time);
        const sessionEndTime = lastSolve.timestamp;

        let sessionDurationSeconds = 0;
        if (firstSolve.date && lastSolve.date) {
            if (firstSolve.time === DNF_TIME) {
                sessionDurationSeconds = (lastSolve.date - firstSolve.date) / 1000
            } else {
                sessionDurationSeconds = (lastSolve.date - firstSolve.date) / 1000 + firstSolve.time;
            }
        }

        let totalSolvingSeconds = 0;
        let totalMoves = 0;
        let totalSolves = filteredSolves.length;
        let completedSolves = 0;

        let bestTimeSolve = null;
        let bestMovesSolve = null;
        let bestTpsSolve = null;

        let currentStreak = 0;

        filteredSolves.forEach(solve => {
            if (!solve.isDNF) {
                totalSolvingSeconds += solve.time;
                totalMoves += solve.moves;
                completedSolves++;

                if (!bestTimeSolve || solve.time < bestTimeSolve.time) {
                    bestTimeSolve = solve;
                }
                if (!bestMovesSolve || solve.moves < bestMovesSolve.moves) {
                    bestMovesSolve = solve;
                }
                if (!bestTpsSolve || solve.tps > bestTpsSolve.tps) {
                    bestTpsSolve = solve;
                }
            }
        });

        for (let i = filteredSolves.length - 1; i >= 0; i--) {
            if (!filteredSolves[i].isDNF) {
                currentStreak++;
            } else {
                break;
            }
        }

        const formatBestSolve = (solve, type) => {
            if (!solve) return 'N/A';

            let mainValue, comp1, comp2;
            if (type === 'time') {
                mainValue = solve.timeStr;
                comp1 = solve.movesStr;
                comp2 = solve.tpsStr;
            } else if (type === 'moves') {
                mainValue = solve.movesStr;
                comp1 = solve.timeStr;
                comp2 = solve.tpsStr;
            } else {
                mainValue = solve.tpsStr;
                comp1 = solve.timeStr;
                comp2 = solve.movesStr;
            }

            return `${mainValue} (${comp1} / ${comp2})`;
        };

        const statsHtml = `
            <div class="avgs-session-stats">
                <div class="avgs-session-stats-title">📈 Session Statistics (filtered)</div>
                <div class="avgs-session-stats-grid">
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Session started:</span>
                        <span class="avgs-stat-value">${formatTimestamp(sessionStartTime)}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Session ended:</span>
                        <span class="avgs-stat-value">${formatTimestamp(sessionEndTime)}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Session duration:</span>
                        <span class="avgs-stat-value">${formatDuration(sessionDurationSeconds)}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Total solving time:</span>
                        <span class="avgs-stat-value">${formatTimeFromSeconds(totalSolvingSeconds)}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Total moves done:</span>
                        <span class="avgs-stat-value">${totalMoves}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Total attempts done:</span>
                        <span class="avgs-stat-value">${totalSolves}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Total solves done:</span>
                        <span class="avgs-stat-value">${completedSolves}</span>
                    </div>
                    <div class="avgs-stat-item">
                        <span class="avgs-stat-label">Current no-reset streak:</span>
                        <span class="avgs-stat-value">${currentStreak}</span>
                    </div>
                </div>
                <div class="avgs-best-solves">
                    <div class="avgs-best-solve-item">Best Time: ${formatBestSolve(bestTimeSolve, 'time')}</div>
                    <div class="avgs-best-solve-item">Best Moves: ${formatBestSolve(bestMovesSolve, 'moves')}</div>
                    <div class="avgs-best-solve-item">Best TPS: ${formatBestSolve(bestTpsSolve, 'tps')}</div>
                </div>
            </div>
        `;

        if (sessionStatsDiv) {
            sessionStatsDiv.outerHTML = statsHtml;
            sessionStatsDiv = document.querySelector('.avgs-session-stats');
        }
    }

    function getReplayType(solves) {
        const sizes = solves.map(s => s.size);
        const widths = solves.map(s => s.width);
        const heights = solves.map(s => s.height);

        if (new Set(sizes).size === 1) return 'marathon';
        if (new Set(heights).size === 1) return 'width relay';
        if (new Set(widths).size === 1) return 'height relay';
        if (solves.every(s => s.width === s.height)) return 'relay';
        return 'eut';
    }

    function fixDetailsSolvesData(solves) {
        return solves.map(({ timestamp, ...solve }) => {
            const groups = timestamp.split('/');
            return {
                ...solve,
                timestamp: "N/A",
                scramble: timestamp,
                width: groups[0].trim().split(/\s+/).length,
                height: groups.length,
                size: `${groups[0].trim().split(/\s+/).length}x${groups.length}`
            };
        });
    }

    function calculateAvgs() {
        const allSolves = extractSolvesFromTable();
        let solves;
        let type = 'single';
        const killBtn = document.querySelector('.avgs-kill-btn');
        killBtn.style.display = 'block';
        if (currentWorker) {
            currentWorker.terminate();
            currentWorker = null;
        }

        updateFilterSummary();
        if (!useDetailsForStats) {
            updateSessionStats();
            solves = filterSolves(allSolves);
        } else {
            const resetBtn = document.querySelector('.avgs-reset-btn');
            resetBtn.style.display = 'block';
            solves = fixDetailsSolvesData(allSolves);
            type = getReplayType(solves);
        }
        updateGraphs(type);

        if (solves.length === 0) {
            outputArea.value = 'No solves found matching the filters.';
            return;
        }

        const category = document.querySelector('input[name="category"]:checked')?.value || 'time';
        const categoryVal = category;

        if (!useDetailsForStats) {
            // Regular average calculation
            const trimRule = document.querySelector('input[name="trimRule"]:checked')?.value || '5%';
            const customTrim = document.querySelector('#customTrimInput')?.value || '2';
            const avgSizes = getSelectedAvgSizes();

            progressBar.value = 0;
            progressText.textContent = '0%';
            outputArea.value = `Calculating... (${solves.length} solves selected)`;

            currentWorker = createWorker();

            currentWorker.onmessage = (e) => {
                const { type, progress, results } = e.data;
                if (type === 'progress') {
                    progressBar.value = progress;
                    progressText.textContent = `${progress}%`;
                } else if (type === 'result') {
                    progressBar.value = 100;
                    progressText.textContent = 'done';
                    killBtn.style.display = 'none';

                    const categoryVal = document.querySelector('input[name="category"]:checked')?.value || 'time';
                    const lines = [];

                    const formatTimeValue = (seconds) => {
                        if (seconds === null) return 'DNF';
                        const floored = Math.floor(seconds * 1000) / 1000;
                        const minutes = Math.floor(floored / 60);
                        const secs = floored % 60;

                        if (minutes > 0) {
                            return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
                        } else {
                            return `${secs.toFixed(3)}`;
                        }
                    };

                    const formatNumeric = (value) => {
                        if (value === null) return 'DNF';
                        return (Math.floor(value * 1000) / 1000).toFixed(3);
                    };

                    for (let r of results) {
                        let comp1, comp2;
                        let mainFormatted;

                        if (categoryVal === 'time') {
                            comp1 = formatNumeric(r.movesAvg);
                            comp2 = formatNumeric(r.tpsAvg);
                            mainFormatted = formatTimeValue(r.mainAvg);
                        } else if (categoryVal === 'moves') {
                            comp1 = formatTimeValue(r.timeAvg);
                            comp2 = formatNumeric(r.tpsAvg);
                            mainFormatted = formatNumeric(r.mainAvg);
                        } else {
                            comp1 = formatTimeValue(r.timeAvg);
                            comp2 = formatNumeric(r.movesAvg);
                            mainFormatted = formatNumeric(r.mainAvg);
                        }

                        const ts = formatTimestamp(r.timestamp);
                        const outText = r.trimEach === 1 ? '1 out' : `${r.trimEach} out`;
                        const range = `${r.startId}-${r.endId}`;
                        lines.push(`ao${r.size}: ${mainFormatted} (${comp1}/${comp2}) | ${ts} (${outText}) (${range})`);
                    }

                    outputArea.value = lines.length ? lines.join('\n') : 'No valid averages (or DNF everywhere).';
                    currentWorker = null;
                }
            };

            currentWorker.postMessage({
                solves: solves,
                category, trimRule, customTrim, avgSizes
            });
        } else {
            // Details for stats mode - use appropriate worker
            const formatTimeValue = (seconds) => {
                if (seconds === null || isNaN(seconds)) return 'DNF';
                const floored = Math.floor(seconds * 1000) / 1000;
                const minutes = Math.floor(floored / 60);
                const secs = floored % 60;

                if (minutes > 0) {
                    return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
                } else {
                    return `${secs.toFixed(3)}`;
                }
            };

            const formatNumeric = (value) => {
                if (value < 0) return "inf";
                if (value === null || isNaN(value)) return 'DNF';
                return (Math.floor(value * 1000) / 1000).toFixed(3);
            };
            const formatInteger = (value) => {
                if (value === null || isNaN(value)) return 'DNF';
                return Math.floor(value).toString();
            };

            progressBar.value = 0;
            progressText.textContent = '0%';

            if (type === 'marathon') {
                if (categoryVal === 'tps') {
                    outputArea.value = "You can't find TPS splits of marathon, sorry";
                    killBtn.style.display = 'none';
                    progressBar.value = 100;
                    progressText.textContent = 'done';
                    return;
                }

                outputArea.value = `Calculating marathon splits... (${solves.length} solves)`;
                currentWorker = createMarathonWorker();

                currentWorker.onmessage = (e) => {
                    const { type: msgType, progress, results, error } = e.data;
                    if (msgType === 'progress') {
                        progressBar.value = progress;
                        progressText.textContent = `${progress}%`;
                    } else if (msgType === 'result') {
                        progressBar.value = 100;
                        progressText.textContent = 'done';
                        killBtn.style.display = 'none';

                        if (error === 'tps') {
                            outputArea.value = "You can't find TPS splits of marathon, sorry";
                            return;
                        }

                        const lines = [];
                        lines.push(`Best splits from selected x${solves.length} marathon:`);

                        const isTime = categoryVal === 'time';

                        for (const r of results) {
                            const mainFormatted = isTime ? formatTimeValue(r.mainSum) : formatInteger(r.mainSum);
                            const compFormatted = isTime ? formatInteger(r.compSum) : formatTimeValue(r.compSum);
                            const tpsFormatted = formatNumeric(r.tps);
                            const range = `${r.startId}-${r.endId}`;
                            lines.push(`x${r.size}: ${mainFormatted} (${compFormatted}/${tpsFormatted}) (${range})`);
                        }

                       // Add individual solves section
                        lines.push('');
                        lines.push('Single solves | Cumulative');

                        let runningMainSum = 0;
                        let runningCompSum = 0;

                        for (let i = 0; i < solves.length; i++) {
                            const solve = solves[i];
                            const solveMain = isTime ? solve.time : solve.moves;
                            const solveComp = isTime ? solve.moves : solve.time;

                            runningMainSum += Math.round(solveMain * 1000);
                            runningCompSum += Math.round(solveComp * 1000);

                            const runningMainDisplay = runningMainSum / 1000;
                            const runningCompDisplay = runningCompSum / 1000;
                            const runningTps = Math.round((isTime ? runningCompSum / runningMainSum : runningMainSum / runningCompSum) * 1000) / 1000;

                            const mainFormatted = isTime ? formatTimeValue(solveMain) : formatInteger(solveMain);
                            const compFormatted = isTime ? formatInteger(solveComp) : formatTimeValue(solveComp);
                            const tpsFormatted = formatNumeric(solve.tps);

                            const runningMainFormatted = isTime ? formatTimeValue(runningMainDisplay) : formatInteger(runningMainDisplay);
                            const runningCompFormatted = isTime ? formatInteger(runningCompDisplay) : formatTimeValue(runningCompDisplay);
                            const runningTpsFormatted = formatNumeric(runningTps);

                            lines.push(`x${i + 1}: ${mainFormatted} (${compFormatted}/${tpsFormatted}) | ${runningMainFormatted} (${runningCompFormatted}/${runningTpsFormatted})`);
                        }

                        outputArea.value = lines.join('\n');
                        currentWorker = null;
                    }
                };

                currentWorker.postMessage({ solves, category: categoryVal });
            } else {
                // Relay or EUT
                if (categoryVal === 'tps') {
                    outputArea.value = "You can't find TPS splits of relays, sorry";
                    killBtn.style.display = 'none';
                    progressBar.value = 100;
                    progressText.textContent = 'done';
                    return;
                }

                outputArea.value = `Calculating ${type} splits...`;
                currentWorker = createRelayWorker();

                currentWorker.onmessage = (e) => {
                    const { type: msgType, results, error } = e.data;
                    if (msgType === 'result') {
                        progressBar.value = 100;
                        progressText.textContent = 'done';
                        killBtn.style.display = 'none';

                        if (error === 'tps') {
                            outputArea.value = "You can't find TPS splits of relays, sorry";
                            return;
                        }

                        const lines = [];
                        const maxSize = Math.max(...solves.map(s => s.width));
                        const typeLabel = type === 'eut' ? `${maxSize}x${maxSize} eut` : `${maxSize}x${maxSize} ${type}`;
                        lines.push(`Relay splits from selected ${typeLabel}:`);

                        const isTime = categoryVal === 'time';
                        for (const r of results) {
                            if (r.label && r.label.includes('2x2')) continue;
                            const mainFormatted = isTime ? formatTimeValue(r.mainSum) : formatInteger(r.mainSum);
                            const compFormatted = isTime ? formatInteger(r.compSum) : formatTimeValue(r.compSum);
                            const tpsFormatted = formatNumeric(r.tps);
                            lines.push(`${r.label}: ${mainFormatted} (${compFormatted}/${tpsFormatted})`);
                        }

                        // Add individual solves section
                        lines.push('');
                        lines.push('Single solves | Cumulative');

                        let runningMainSum = 0;
                        let runningCompSum = 0;

                        for (let i = 0; i < solves.length; i++) {
                            const solve = solves[i];
                            const solveMain = isTime ? solve.time : solve.moves;
                            const solveComp = isTime ? solve.moves : solve.time;

                            runningMainSum += Math.round(solveMain * 1000);
                            runningCompSum += Math.round(solveComp * 1000);

                            const runningMainDisplay = runningMainSum / 1000;
                            const runningCompDisplay = runningCompSum / 1000;
                            const runningTps = Math.round((isTime ? runningCompSum / runningMainSum : runningMainSum / runningCompSum) * 1000) / 1000;

                            const mainFormatted = isTime ? formatTimeValue(solveMain) : formatInteger(solveMain);
                            const compFormatted = isTime ? formatInteger(solveComp) : formatTimeValue(solveComp);
                            const tpsFormatted = formatNumeric(solve.tps);

                            const runningMainFormatted = isTime ? formatTimeValue(runningMainDisplay) : formatInteger(runningMainDisplay);
                            const runningCompFormatted = isTime ? formatInteger(runningCompDisplay) : formatTimeValue(runningCompDisplay);
                            const runningTpsFormatted = formatNumeric(runningTps);

                            lines.push(`${i + 1}. ${solve.size}: ${mainFormatted} (${compFormatted}/${tpsFormatted}) | ${runningMainFormatted} (${runningCompFormatted}/${runningTpsFormatted})`);
                        }
                        outputArea.value = lines.join('\n');
                        currentWorker = null;
                    }
                };

                currentWorker.postMessage({ solves, type, category: categoryVal });
            }
        }
    }

    function createCalculator() {
        const container = document.createElement('div');
        container.className = 'avgs-calculator-container';

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="avgs-header">
                <span class="avgs-title">Session stats</span>
                <button class="avgs-toggle-btn">▼ Collapse</button>
            </div>

            <div class="avgs-content">
                <div class="avgs-layout-main">
                    <div class="avgs-left-section">
                        <div class="avgs-filters-container">
                            <div class="avgs-filter-row">
                                <span class="avgs-control-label">Outliers:</span>
                                <div class="avgs-radio-group">
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="trimRule" value="1"> 1 (exe)
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="trimRule" value="5%" checked> 5% (web)
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="trimRule" value="10%"> 10% (LM)
                                    </label>
                                    <label style="display:none;">
                                        <input type="radio" name="trimRule" value="custom"> Custom
                                    </label>
                                    <input type="text" id="customTrimInput" class="avgs-custom-input" placeholder="2 or 7%" value="2" style="display:none;">
                                </div>
                            </div>

                            <div class="avgs-filter-row">
                                <span class="avgs-control-label">PB type:</span>
                                <div class="avgs-radio-group">
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="category" value="time" checked> Time
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="category" value="moves"> Moves
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="category" value="tps"> TPS
                                    </label>
                                </div>
                            </div>

                            <div class="avgs-filter-row">
                                <span class="avgs-control-label">Avgs:</span>
                                <div class="avgs-radio-group">
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="avgSet" value="all"> All
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="avgSet" value="major"> Major
                                    </label>
                                    <label class="avgs-radio-label">
                                        <input type="radio" name="avgSet" value="major100" checked> Major up to 100
                                    </label>
                                </div>
                            </div>

                            <div class="avgs-filter-row">
                                <span class="avgs-control-label">ID range:</span>
                                <input type="number" id="avgs-start-id" class="avgs-filter-input" placeholder="Start ID" min="1">
                                <span class="avgs-range-separator">-</span>
                                <input type="number" id="avgs-end-id" class="avgs-filter-input" placeholder="End ID" min="1">
                            </div>

                            <div class="avgs-filter-row">
                                <label class="avgs-checkbox-label">
                                    <input type="checkbox" id="avgs-use-date-range">
                                    <span class="avgs-control-label">Date filter:</span>
                                </label>
                                <div class="avgs-date-range" id="avgs-date-range-inputs" style="display:none;">
                                    <input type="date" id="avgs-start-date" class="avgs-date-input" value="${todayStr}">
                                    <span class="avgs-range-separator">to</span>
                                    <div class="avgs-end-date-row">
                                        <input type="date" id="avgs-end-date" class="avgs-date-input" value="${todayStr}" style="display:none;">
                                        <label class="avgs-checkbox-label">
                                            <input type="checkbox" id="avgs-no-end-date" checked>
                                            <span>No end date</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="avgs-filter-row">
                                <div class="avgs-quick-dates">
                                    <button class="avgs-quick-date-btn" data-preset="today">Today</button>
                                    <button class="avgs-quick-date-btn" data-preset="yesterday">Yesterday</button>
                                    <button class="avgs-quick-date-btn" data-preset="last7">Last 7 days</button>
                                    <button class="avgs-quick-date-btn" data-preset="last30">Last 30 days</button>
                                </div>
                            </div>

                            <div class="avgs-action-row">
                                <div class="avgs-progress-section">
                                    <progress class="avgs-progress-bar" value="0" max="100"></progress>
                                    <span class="avgs-progress-text">ready</span>
                                </div>
                                <button class="avgs-calc-btn">CALC</button>
                                <button class="avgs-kill-btn" title="Stop calculation">✕</button>
                                <button class="avgs-reset-btn" title="Main stats data" style="display:none">Splits are loaded | Load averages instead</button>
                            </div>
                        </div>
                    </div>

                    <div class="avgs-middle-section">
                        <div id="avgs-session-stats-container"></div>
                    </div>

                    <div class="avgs-right-section">
                        <div class="avgs-filter-summary" id="avgs-filter-summary"></div>
                        <textarea class="avgs-output-area" readonly placeholder="Results will appear here..."></textarea>
                    </div>
                </div>

                <!-- New Graphs Section -->
                <div id="avgs-graphs-container" class="avgs-graphs-container">
                    <div class="avgs-graph-card">
                        <div class="avgs-graph-title" id="graph1-title">📈 Chronological Progress</div>
                        <div class="avgs-graph-canvas-container">
                            <canvas id="progressChart" class="avgs-graph-canvas"></canvas>
                        </div>
                    </div>
                    <div class="avgs-graph-card">
                        <div class="avgs-graph-title" id="graph2-title">📊 Distribution Histogram</div>
                        <div class="avgs-graph-canvas-container">
                            <canvas id="histogramChart" class="avgs-graph-canvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return container;
    }

    function setupEventListeners(container) {
        const trimRadios = container.querySelectorAll('input[name="trimRule"]');
        const avgSetRadios = container.querySelectorAll('input[name="avgSet"]');
        const categoryRadios = container.querySelectorAll('input[name="category"]');
        const customInput = container.querySelector('#customTrimInput');
        const calcBtn = container.querySelector('.avgs-calc-btn');
        const killBtn = container.querySelector('.avgs-kill-btn');
        const resetBtn = container.querySelector('.avgs-reset-btn');
        const filterInputs = container.querySelectorAll('#avgs-start-id, #avgs-end-id');
        const useDateRangeCheck = container.querySelector('#avgs-use-date-range');
        const dateRangeDiv = container.querySelector('#avgs-date-range-inputs');
        const noEndDateCheck = container.querySelector('#avgs-no-end-date');
        const startDateInput = container.querySelector('#avgs-start-date');
        const endDateInput = container.querySelector('#avgs-end-date');
        const toggleBtn = container.querySelector('.avgs-toggle-btn');
        const quickDateBtns = container.querySelectorAll('.avgs-quick-date-btn');
        const header = container.querySelector('.avgs-header');
        const statsContainer = container.querySelector('#avgs-session-stats-container');

        filterSummaryDiv = container.querySelector('#avgs-filter-summary');
        sessionStatsDiv = document.createElement('div');
        statsContainer.appendChild(sessionStatsDiv);

        trimRadios.forEach(r => r.addEventListener('change', () => {
            customInput.style.display = container.querySelector('input[name="trimRule"]:checked')?.value === 'custom' ? 'inline-block' : 'none';
            calculateAvgs();
        }));

        avgSetRadios.forEach(r => r.addEventListener('change', calculateAvgs));
        categoryRadios.forEach(r => r.addEventListener('change', calculateAvgs));

        calcBtn.addEventListener('click', calculateAvgs);
        killBtn.addEventListener('click', killWorker);
        resetBtn.addEventListener('click', resetToMainStats);

        filterInputs.forEach(input => {
            input.addEventListener('change', calculateAvgs);
            input.addEventListener('input', calculateAvgs);
        });

        useDateRangeCheck.addEventListener('change', () => {
            dateRangeDiv.style.display = useDateRangeCheck.checked ? 'flex' : 'none';
            calculateAvgs();
        });

        noEndDateCheck.addEventListener('change', () => {
            endDateInput.style.display = noEndDateCheck.checked ? 'none' : 'inline-block';
            calculateAvgs();
        });

        startDateInput.addEventListener('change', calculateAvgs);
        endDateInput.addEventListener('change', calculateAvgs);

        quickDateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                if (preset === 'yesterday') {
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    startDateInput.value = yesterdayStr;
                    endDateInput.value = yesterdayStr;
                } else if (preset === 'today') {
                    startDateInput.value = todayStr;
                    endDateInput.value = todayStr;
                } else if (preset === 'last7') {
                    const startDate = new Date(today);
                    startDate.setDate(today.getDate() - 6);
                    startDateInput.value = startDate.toISOString().split('T')[0];
                    endDateInput.value = todayStr;
                } else if (preset === 'last30') {
                    const startDate = new Date(today);
                    startDate.setDate(today.getDate() - 29);
                    startDateInput.value = startDate.toISOString().split('T')[0];
                    endDateInput.value = todayStr;
                }

                useDateRangeCheck.checked = true;
                dateRangeDiv.style.display = 'flex';
                calculateAvgs();
            });
        });

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('collapsed');
            toggleBtn.textContent = container.classList.contains('collapsed') ? '▶ Expand' : '▼ Collapse';
            // Refresh charts after expand (they may have been hidden)
            if (!container.classList.contains('collapsed')) {
                setTimeout(updateGraphs, 100);
            }
        });

        header.addEventListener('click', () => {
            container.classList.toggle('collapsed');
            toggleBtn.textContent = container.classList.contains('collapsed') ? '▶ Expand' : '▼ Collapse';
        });

        outputArea = container.querySelector('.avgs-output-area');
        progressBar = container.querySelector('.avgs-progress-bar');
        progressText = container.querySelector('.avgs-progress-text');

        endDateInput.style.display = noEndDateCheck.checked ? 'none' : 'inline-block';
    }

    function handleCalculateOrClick() {
        document.querySelector('#closeReplayBtn')?.click();
        const firstTable = document.querySelector('.session-statistics-table');

        calculateAvgs();

        if (firstTable) {
            const rows = firstTable.querySelectorAll('tbody tr');
            if (rows.length === 1) {
                rows[0].click();
            }
        }
    }

    // ==================== GRAPH FUNCTIONS ====================

    let chart1 = null;
    let chart2 = null;

    function destroyCharts() {
        if (chart1) {
            chart1.destroy();
            chart1 = null;
        }
        if (chart2) {
            chart2.destroy();
            chart2 = null;
        }
    }

    function calculateBinSize(sessionAvg, category) {
        if (category === 'time') {
            if (sessionAvg < 2) return 0.05;
            if (sessionAvg < 5) return 0.1;
            if (sessionAvg < 30) return 0.5;
            if (sessionAvg < 60) return 1;
            if (sessionAvg < 120) return 2;
            if (sessionAvg < 300) return 5;
            if (sessionAvg < 600) return 10;

            // For larger values, calculate based on data
            const magnitude = Math.floor(Math.log10(sessionAvg));
            const baseSize = Math.pow(10, magnitude - 1);
            const rounded = Math.round(sessionAvg / baseSize) * baseSize;
            if (rounded < 100) return 60;
            if (rounded < 300) return 120;
            if (rounded < 1000) return 300;
            return Math.ceil(sessionAvg / 20);
        } else if (category === 'moves') {
            if (sessionAvg < 20) return 1;
            if (sessionAvg < 50) return 2;
            if (sessionAvg < 100) return 5;
            if (sessionAvg < 200) return 10;
            if (sessionAvg < 500) return 25;
            return 50;
        } else { // tps
            if (sessionAvg < 1.0) return 0.05;
            if (sessionAvg < 2.0) return 0.1;
            if (sessionAvg < 5.0) return 0.25;
            if (sessionAvg < 10.0) return 0.5;
            return 1.0;
        }
    }

    function calculateBins(values, binSize, category) {
        if (values.length === 0) return { bins: [], counts: [], outliers: { low: 0, high: 0 } };

        const sorted = [...values].sort((a, b) => a - b);
        const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sorted.length;
        const stdDev = Math.sqrt(variance);

        // Calculate raw bounds
        const rawLowerBound = Math.max(0, mean - 2 * stdDev);
        const rawUpperBound = mean + 2 * stdDev;

        // Round bounds to align with bin boundaries
        let niceBinSize = binSize;
        if (category === 'time') {
            if (binSize < 1) niceBinSize = binSize;
            else if (binSize < 10) niceBinSize = Math.ceil(binSize);
            else niceBinSize = Math.ceil(binSize / 10) * 10;
        }

        // Round lower bound DOWN to nearest bin boundary, upper bound UP
        const lowerBound = Math.floor(rawLowerBound / niceBinSize) * niceBinSize;
        const upperBound = Math.ceil(rawUpperBound / niceBinSize) * niceBinSize;

        // Values within rounded bounds
        const inRange = sorted.filter(v => v >= lowerBound && v <= upperBound);

        // Count outliers using the rounded bounds
        let outliersLow = sorted.filter(v => v < lowerBound).length;
        let outliersHigh = sorted.filter(v => v > upperBound).length;

        if (inRange.length === 0) {
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const range = maxVal - minVal;
            const dynamicBinSize = range / 20;

            const bins = [];
            const counts = [];
            let currentBin = minVal;

            while (currentBin < maxVal) {
                bins.push(currentBin);
                const binMax = currentBin + dynamicBinSize;
                const count = values.filter(v => v >= currentBin && v < binMax).length;
                counts.push(count);
                currentBin = binMax;
            }

            return { bins, counts, outliers: { low: 0, high: 0 } };
        }

        const minVal = Math.min(...inRange);
        const maxVal = Math.max(...inRange);

        const bins = [];
        const counts = [];

        // Start from the bin that contains minVal (already aligned with lowerBound)
        let currentBin = lowerBound;

        while (currentBin <= maxVal) {
            bins.push(currentBin);
            const binMax = currentBin + niceBinSize;
            // Count values in this bin (only from inRange values)
            const count = inRange.filter(v => v >= currentBin && v < binMax).length;
            counts.push(count);
            currentBin = binMax;
        }

        return { bins, counts, outliers: { low: outliersLow, high: outliersHigh } };
    }

    function formatShortDate(timestampStr) {
        try {
            const match = timestampStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return `${match[2]}/${match[3]}`; // MM/DD format
            }
        } catch (e) { }
        return '';
    }

   function updateGraphs(dataType) {
        // Register datalabels plugin
        if (typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }

        const allSolves = extractSolvesFromTable();
        const filteredSolves = filterSolves(allSolves);

        const category = document.querySelector('input[name="category"]:checked')?.value || 'time';

        // Get the graph container
        const graphsContainer = document.querySelector('#avgs-graphs-container');
        if (!graphsContainer) return;

        if (filteredSolves.length === 0) {
            graphsContainer.innerHTML = `
                <div class="avgs-graph-card full-width">
                    <div class="avgs-graph-title">📊 Distribution Histogram</div>
                    <div class="avgs-no-data-message">No data available with current filters</div>
                </div>
            `;
            destroyCharts();
            return;
        }

        // Filter out DNFs for graph data
        const validSolves = filteredSolves.filter(s => !s.isDNF);
        const tooManySolves = validSolves.length > 500;

        // Determine if we should show histogram
        const shouldShowHistogram = dataType === "single" || dataType === "marathon";

        // Prepare data for histogram
        let values;
        if (category === 'time') {
            values = validSolves.map(s => s.time);
        } else if (category === 'moves') {
            values = validSolves.map(s => s.moves);
        } else {
            values = validSolves.map(s => s.tps);
        }

        // Update the container HTML based on data type and number of solves
        if (!shouldShowHistogram) {
            // Only show chronological graph if histogram shouldn't be shown
            graphsContainer.innerHTML = `
                <div class="avgs-graph-card full-width">
                    <div class="avgs-graph-title" id="graph1-title">📈 Chronological Progress</div>
                    <div class="avgs-graph-canvas-container">
                        <canvas id="progressChart" class="avgs-graph-canvas"></canvas>
                    </div>
                </div>
            `;
        } else if (tooManySolves) {
            // Only show histogram, full width
            graphsContainer.innerHTML = `
                <div class="avgs-graph-card full-width">
                    <div class="avgs-graph-title" id="graph2-title">📊 Distribution Histogram</div>
                    <div class="avgs-graph-canvas-container">
                        <canvas id="histogramChart" class="avgs-graph-canvas"></canvas>
                    </div>
                </div>
            `;
        } else {
            // Show both graphs
            graphsContainer.innerHTML = `
                <div class="avgs-graph-card">
                    <div class="avgs-graph-title" id="graph1-title">📈 Chronological Progress</div>
                    <div class="avgs-graph-canvas-container">
                        <canvas id="progressChart" class="avgs-graph-canvas"></canvas>
                    </div>
                </div>
                <div class="avgs-graph-card">
                    <div class="avgs-graph-title" id="graph2-title">📊 Distribution Histogram</div>
                    <div class="avgs-graph-canvas-container">
                        <canvas id="histogramChart" class="avgs-graph-canvas"></canvas>
                    </div>
                </div>
            `;
        }

        // Update titles
        const categoryDisplay = category === 'time' ? 'Time' : category === 'moves' ? 'Moves' : 'TPS';
        const histogramTitle = document.querySelector('#graph2-title');
        if (histogramTitle) {
            histogramTitle.textContent = `📊 Distribution Histogram (${categoryDisplay})`;
        }

        if (shouldShowHistogram ? !tooManySolves : true) {
            const progressTitle = document.querySelector('#graph1-title');
            if (progressTitle) {
                progressTitle.textContent = `📈 Chronological Progress (${categoryDisplay})`;
            }
        }

        if (validSolves.length === 0) {
            destroyCharts();
            // Create empty histogram with message only if we should show histogram
            if (shouldShowHistogram) {
                const ctx2 = document.getElementById('histogramChart')?.getContext('2d');
                if (ctx2) {
                    chart2 = new Chart(ctx2, {
                        type: 'bar',
                        data: { labels: [], datasets: [] },
                        options: {
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'No valid solves (all DNF)',
                                    color: '#888'
                                }
                            }
                        }
                    });
                }
            }
            return;
        }

        // Destroy existing charts
        destroyCharts();

        // Create chronological chart - always create if we have the container
        const shouldCreateChronological = !shouldShowHistogram || !tooManySolves;
        if (shouldCreateChronological) {
            // Prepare data for chronological chart
            const chronologicalData = [];

            // Build data points with solve IDs and dates
            validSolves.forEach((solve) => {
                let value;
                if (category === 'time') {
                    value = solve.time;
                } else if (category === 'moves') {
                    value = solve.moves;
                } else {
                    value = solve.tps;
                }

                chronologicalData.push({
                    x: solve.solveId,
                    y: value,
                    solveId: solve.solveId,
                    date: solve.timestamp
                });
            });

            // Sort by solve ID to ensure correct chronological order
            chronologicalData.sort((a, b) => a.solveId - b.solveId);

            // Create labels with solve ID
            const chartLabels = chronologicalData.map(d => `${d.solveId}`);
            const chartValues = chronologicalData.map(d => d.y);

            // Create Chart 1: Chronological Progress
            // Create Chart 1: Chronological Progress
            const ctx1 = document.getElementById('progressChart')?.getContext('2d');
            if (ctx1) {
                chart1 = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: `${categoryDisplay}`,
                            data: chartValues,
                            borderColor: '#00ffff',
                            backgroundColor: 'rgba(0, 255, 255, 0.1)',
                            borderWidth: 2,
                            pointRadius: chartValues.length > 200 ? 2 : 3,
                            pointBackgroundColor: '#00ffff',
                            pointBorderColor: '#008888',
                            tension: 0.1,
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        devicePixelRatio: 2,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                                titleColor: '#fff',
                                bodyColor: '#ccc',
                                borderColor: '#555',
                                borderWidth: 1,
                                callbacks: {
                                    title: function (context) {
                                        const index = context[0].dataIndex;
                                        const dataPoint = chronologicalData[index];
                                        const fullDate = formatTimestamp(dataPoint.date);
                                        return `Solve #${dataPoint.solveId} - ${fullDate}`;
                                    },
                                    label: function (context) {
                                        let value = context.raw;
                                        if (category === 'time') {
                                            if (value >= 60) {
                                                const mins = Math.floor(value / 60);
                                                const secs = (value % 60).toFixed(3);
                                                return `${categoryDisplay}: ${mins}:${secs.padStart(6, '0')}`;
                                            }
                                            return `${categoryDisplay}: ${value.toFixed(3)}`;
                                        } else {
                                            return `${categoryDisplay}: ${value.toFixed(3)}`;
                                        }
                                    }
                                }
                            },
                            datalabels: {
                                align: 'top',
                                offset: 4,
                                color: '#00ffff',
                                backgroundColor: function (context) {
                                    const total = context.chart.data.datasets[0].data.length;
                                    return total <= 25 ? 'rgba(0, 0, 0, 0.7)' : 'transparent';
                                },
                                font: {
                                    size: 12,
                                    weight: 'normal'
                                },
                                padding: {
                                    top: 2,
                                    bottom: 2,
                                    left: 4,
                                    right: 4
                                },
                                borderRadius: 3,
                                formatter: function (value, context) {
                                    // Only show labels for some points to avoid clutter
                                    const total = context.chart.data.datasets[0].data.length;

                                    // Show label if it's first, last, or every Nth point
                                    if (total <= 25) {
                                        // Show all for small datasets
                                        if (category === 'time') {
                                            if (value >= 60) {
                                                const hours = Math.floor(value / 3600);
                                                const mins = Math.floor((value % 3600) / 60);
                                                const secs = Math.floor(value % 60);

                                                if (hours > 0) {
                                                    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                                                } else {
                                                    return `${mins}:${String(secs).padStart(2, '0')}`;
                                                }
                                            }
                                            return (Math.floor(value * 1000) / 1000).toFixed(3);
                                        } else if (category === 'moves') {
                                            return Math.round(value).toString();
                                        } else {
                                            return (Math.floor(value * 1000) / 1000).toFixed(3);
                                        }
                                    } else {
                                        return ''; // Hide label
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(80, 80, 80, 0.3)',
                                },
                                ticks: {
                                    color: '#aaa',
                                    font: {
                                        size: 9,
                                        family: 'monospace'
                                    },
                                    maxRotation: 0,
                                    autoSkip: true,
                                    autoSkipPadding: 20,
                                    callback: function (value, index) {
                                        const label = this.getLabelForValue(value);
                                        if (index === 0 || index === chartLabels.length - 1) {
                                            return label;
                                        }
                                        return label;
                                    }
                                },
                                title: {
                                    display: false,
                                    text: 'Solve #',
                                    color: '#ccc',
                                    font: { size: 10 }
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(80, 80, 80, 0.3)',
                                },
                                ticks: {
                                    color: '#aaa',
                                    font: {
                                        size: 10,
                                        family: 'monospace'
                                    },
                                    callback: function (value) {
                                        if (category === 'time' && value >= 60) {
                                            const mins = Math.floor(value / 60);
                                            const secs = Math.floor(value % 60);
                                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                                        }
                                        if (category === 'time') {
                                            return value.toFixed(2);
                                        }
                                        return value.toFixed(category === 'moves' ? 0 : 2);
                                    }
                                },
                                title: {
                                    display: false,
                                    text: categoryDisplay,
                                    color: '#ccc',
                                    font: { size: 10 }
                                },
                                grace: '5%'
                            }
                        },
                        layout: {
                            padding: {
                                top: 20
                            }
                        }
                    }
                });
            }
        }

        // Create Chart 2: Histogram - only if we should show histogram
        if (shouldShowHistogram) {
            // Calculate session average for bin size
            const sessionAvg = values.reduce((a, b) => a + b, 0) / values.length;
            const binSize = calculateBinSize(sessionAvg, category);

            // Calculate bins
            const { bins, counts, outliers } = calculateBins(values, binSize, category);

            // Format bin labels
            const binLabels = bins.map(b => {
                if (category === 'time') {
                    if (binSize < 0.1) return b.toFixed(2);
                    if (binSize < 1) return b.toFixed(1);
                    return Math.round(b).toString();
                } else if (category === 'moves') {
                    return Math.round(b).toString();
                } else { // tps
                    if (binSize < 0.1) return b.toFixed(2);
                    if (binSize < 0.5) return b.toFixed(1);
                    return Math.round(b).toString();
                }
            });


            // Format outlier threshold values for display
            const formatThreshold = (val) => {
                if (category === 'time') {
                    if (binSize < 1) return val.toFixed(2);
                    if (binSize < 10) return val.toFixed(1);
                    return Math.round(val).toString();
                } else if (category === 'moves') {
                    return Math.round(val).toString();
                } else {
                    return val.toFixed(2);
                }
            };

            // Add outlier bins if needed
            if (outliers.low > 0) {
                // The threshold is the first bin's start value
                const threshold = bins[0];
                binLabels.unshift(`< ${formatThreshold(threshold)}`);
                counts.unshift(outliers.low);
            }
            if (outliers.high > 0) {
                // The threshold is the last bin's end value (last bin start + binSize)
                const threshold = bins[bins.length - 1] + binSize;
                binLabels.push(`> ${formatThreshold(threshold)}`);
                counts.push(outliers.high);
            }

            // Create histogram
            const ctx2 = document.getElementById('histogramChart')?.getContext('2d');
            if (ctx2) {
                chart2 = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: binLabels,
                        datasets: [{
                            label: `Count (${counts.reduce((a, b) => a + b, 0)} solves${tooManySolves ? ` of ${validSolves.length}` : ''})`,
                            data: counts,
                            backgroundColor: 'rgba(0, 255, 255, 0.6)',
                            borderColor: '#00ffff',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        devicePixelRatio: 2,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                                titleColor: '#fff',
                                bodyColor: '#ccc',
                                borderColor: '#555',
                                borderWidth: 1,
                                callbacks: {
                                    title: function (context) {
                                        const label = context[0].label;
                                        if (label.startsWith('<')) {
                                            return `Outliers below ${label.substring(2)}`;
                                        }
                                        if (label.startsWith('>')) {
                                            return `Outliers above ${label.substring(2)}`;
                                        }
                                        const value = parseFloat(label);
                                        const nextValue = value + binSize;
                                        if (category === 'time') {
                                            return `${value.toFixed(binSize < 1 ? 2 : 1)} - ${nextValue.toFixed(binSize < 1 ? 2 : 1)} seconds`;
                                        } else if (category === 'moves') {
                                            return `${Math.round(value)} - ${Math.round(nextValue)} moves`;
                                        } else {
                                            return `${value.toFixed(2)} - ${nextValue.toFixed(2)} TPS`;
                                        }
                                    },
                                    label: function (context) {
                                        return `Count: ${context.raw} solve${context.raw !== 1 ? 's' : ''}`;
                                    }
                                }
                            },
                            datalabels: {
                                anchor: 'end',
                                align: 'top',
                                offset: 2,
                                color: '#00ffff',
                                font: {
                                    size: 9,
                                    weight: 'bold'
                                },
                                formatter: function (value) {
                                    return value > 0 ? value : '';
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(80, 80, 80, 0.3)',
                                },
                                ticks: {
                                    color: '#aaa',
                                    maxRotation: 45,
                                    font: { size: 9 }
                                },
                                title: {
                                    display: false,
                                    text: categoryDisplay + ' Range',
                                    color: '#ccc',
                                    font: { size: 10 }
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(80, 80, 80, 0.3)',
                                },
                                ticks: {
                                    color: '#aaa',
                                    font: { size: 10 },
                                    stepSize: 1,
                                    callback: function (value) {
                                        if (Math.floor(value) === value) return value;
                                        return '';
                                    }
                                },
                                title: {
                                    display: false,
                                    text: 'Count',
                                    color: '#ccc',
                                    font: { size: 10 }
                                },
                                beginAtZero: true,
                                grace: '5%'
                            }
                        }
                    }
                });
            }
        }
    }

})();