// ==UserScript==
// @name         SlidySim UI Customization
// @namespace    dphdmn
// @version      3.55.3
// @description  Customize SlidySim with background images, piece borders, font customization, grids border, base9, sound effects, stats improvements, graphs, and more
// @author       dphdmn
// @match        https://play.slidysim.com/*
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Cpath fill='%23FFCC4D' d='M18 34c-6 0-11-5-11-13S12 2 18 2s11 10 11 19-5 13-11 13z'/%3E%3C/svg%3E
// @license      MIT
// @updateURL    https://update.greasyfork.org/scripts/575619/SlidySim%20UI%20Customization.user.js
// @downloadURL  https://update.greasyfork.org/scripts/575619/SlidySim%20UI%20Customization.user.js
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js
// ==/UserScript==

(function () {

    'use strict';
    const __listenerStore = new WeakMap();
    const originalAdd = EventTarget.prototype.addEventListener;
    let root;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (this.matches?.('.focus-area') && type === 'mousemove') {
            __listenerStore.set(this, listener);
        }
        return originalAdd.call(this, type, listener, options);
    };
    // Inject static CSS styles via GM_addStyle
    GM_addStyle(`
        .live-table td.pb-cell {
            color: cyan !important;
        }
        body {
            height: 100%;
        }
        .standard-main-panel {
            grid-area: a !important;
            position: relative !important;
            display: flex !important;          
            flex-direction: row !important;    
            height: 100%;                      
            overflow: hidden;                  
        }
            /* Wrapper for all original content – takes remaining space */
        .main-content {
            flex: 1 1 0%;          
            min-width: 100px;      
            overflow: auto;       
        }

        .live-stats-container {
            position: relative;     
            height: auto;            
            flex-shrink: 0;          
            width: 310px;            
            min-width: 10px;
            background: #1a1a1a;
            color: #ddd;
            font-family: monospace;
            font-size: 13px;
            overflow: hidden;         
            box-sizing: border-box;
            border-left: 2px solid #444;
            z-index: 9999;
            display: flex;            
            flex-direction: column;   
            max-height: 100vh;        
        }

        .live-table-wrapper {
            overflow-x: hidden;
            overflow-y: auto;           
            flex: 1;                  
            min-height: 0;            
        }

        .live-resize-handle {
            position: absolute;
            left: -6px;
            top: 0; bottom: 0;
            width: 12px;
            cursor: col-resize;
            touch-action: none;
            z-index: 10;
            background: transparent;
        }

        .live-resize-handle:hover,
        .live-resize-handle:active {
            background: rgba(255,255,255,0.05);
        }

        .live-table {
            width: auto;
            min-width: 95%;          
            border-collapse: collapse;
        }

        .live-table thead {
            position: sticky;        
            top: 0;                   
            z-index: 1;              
        }

        .live-table th, .live-table td {
            padding: 4px 6px;
            border-right: 1px solid #333;
            border-bottom: 1px solid #2a2a2a;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            box-sizing: border-box;
            white-space: nowrap;     
        }

        .live-table th.live-group-start,
        .live-table td.live-group-start {
            border-left: 3px solid rgba(255,255,255,0.75);
        }

        .live-table thead th {
            background: #2a2a2a;
            color: #aaa;
            font-weight: normal;
            font-size: 11px;
            border-bottom: 2px solid #444;
        }

        .live-table thead tr:first-child th {
            color: #ddd;
            font-size: 12px;
            font-weight: bold;
        }

        .live-table tbody tr:hover td {
            background: #252525;
        }


        .session-statistics-table th {
            cursor: pointer;
            user-select: none;
            position: relative;
            padding-right: 20px;
            transition: background-color 0.2s;
        }

        .session-statistics-table th:hover {
            background-color: rgba(0, 155, 121, 0.49);
        }

        /* Sort direction indicators based on table's data attributes */
        .session-statistics-table[data-sort-direction-0="asc"] th:nth-child(1)::after,
        .session-statistics-table[data-sort-direction-1="asc"] th:nth-child(2)::after,
        .session-statistics-table[data-sort-direction-2="asc"] th:nth-child(3)::after,
        .session-statistics-table[data-sort-direction-3="asc"] th:nth-child(4)::after,
        .session-statistics-table[data-sort-direction-4="asc"] th:nth-child(5)::after {
            content: '▲';
            position: absolute;
            right: 8px;
            font-size: 12px;
            color: #ffffff;
        }

        .session-statistics-table[data-sort-direction-0="desc"] th:nth-child(1)::after,
        .session-statistics-table[data-sort-direction-1="desc"] th:nth-child(2)::after,
        .session-statistics-table[data-sort-direction-2="desc"] th:nth-child(3)::after,
        .session-statistics-table[data-sort-direction-3="desc"] th:nth-child(4)::after,
        .session-statistics-table[data-sort-direction-4="desc"] th:nth-child(5)::after {
            content: '▼';
            position: absolute;
            right: 8px;
            font-size: 12px;
            color: #ffffff;
        }

        .module-container2 {
            margin: 0 !important;
            width: 100vw !important;
            height: var(--content_height) !important;
        }
        .piece .text {
            font-family: var(--puzzle-font-family) !important;
            font-size: var(--puzzle-font-size) !important;
            font-weight: var(--puzzle-font-bold) !important;
        }
        .piece {
            border-radius: var(--puzzle-border-radius) !important;
        }
        .piece.inactive {
            filter: brightness(var(--puzzle-inactive-brightness)) !important;
        }        
        .puzzle {
            opacity: var(--puzzle-dim, 1);
            background-color: color-mix(in srgb, var(--blank-color) calc(var(--blank-color-opacity, 1) * 100%), transparent);
        }
        .puzzle-container {
            position: relative !important;
            left: var(--puzzle-left, 0px) !important;
            top: var(--puzzle-top, 0px) !important;
        }
        .piece .subscheme {
            outline: var(--border-width-grids, 0) solid var(--border-color-grids, transparent);
            outline-offset: calc(-1 * var(--border-width-grids, 0px));
        }
        .multi-select-button,
        .ranking-table,
        .standard-stats-panel,
        .session-background,
        .session-statistics-page-container,
        .dialog,
        .fewest-moves-stats-panel,
        .fewest-moves-data-panel,
        .fewest-moves-input,
        .sessions-search-bar,
        .live-stats-container {
            opacity: var(--ui-opacity, 1);
        }

        .session-background {
            background-color: rgba(35, 35, 35, var(--ui-opacity, 1));
        }

        
        input[type="checkbox"] {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 44px !important;
            height: 24px !important;
            border: 2px solid #374151 !important;
            border-radius: 12px !important;
            background-color: #111827 !important;
            cursor: pointer !important;
            position: relative !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
            margin: 0 !important;
        }

        input[type="checkbox"]::after {
            content: '' !important;
            position: absolute !important;
            left: 2px !important;
            top: 2px !important;
            width: 16px !important;
            height: 16px !important;
            border-radius: 50% !important;
            background-color: #6b7280 !important;
            transition: all 0.2s ease !important;
        }

        input[type="checkbox"]:hover {
            border-color: #0891b2 !important;
        }

        input[type="checkbox"]:checked {
            background-color: #0e7490 !important;
            border-color: #0891b2 !important;
        }

        input[type="checkbox"]:checked::after {
            left: 22px !important;
            background-color: #fff !important;
        }

        .good {
            background-color: rgba(34, 197, 94,0.66) !important;
        }
        .bad {
            background-color: rgba(239, 68, 68,0.66) !important;
        }
        .session-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .focus-area:focus-visible {
            outline: none !important;
        }
        .left-hack, .center-hack, .right-hack {
            position: fixed !important;
            top: 0 !important;
            max-width: 330px;
        }
        .left-hack td, .center-hack td, .right-hack td {
            font-size: 12px !important;
        }
        .left-hack table, .center-hack table, .right-hack table {
            min-height: var(--header_height) !important;
            max-height: var(--header_height) !important;
        }

        .left-hack { left: 0 !important; }
        .center-hack {
            left: 50% !important;
            transform: translateX(-50%) !important;
        }
        .right-hack { right: 0 !important; }

        /* Scrollbar styling */
        body,
        .focus-container {
            scrollbar-width: auto !important;
            scrollbar-color: #8a92b8 #0f1115 !important;
            height: 100%;
        }
        body::-webkit-scrollbar,
        .focus-container::-webkit-scrollbar {
            width: 12px !important;
            height: 12px !important;
        }
        body::-webkit-scrollbar-track,
        .focus-container::-webkit-scrollbar-track {
            background: #0f1115 !important;
        }
        body::-webkit-scrollbar-thumb,
        .focus-container::-webkit-scrollbar-thumb {
            background: #8a92b8 !important;
            border-radius: 10px !important;
            border: 2px solid #0f1115 !important;
            background-clip: padding-box !important;
        }
        body::-webkit-scrollbar-thumb:hover,
        .focus-container::-webkit-scrollbar-thumb:hover {
            background: #b3badf !important;
        }

        /* Primary dialog and controls */
        .dialog {
            position: fixed;
            top: var(--header_height);
            left: 0;
            transform: none;
            margin: 0;
            max-height: calc(100vh - var(--header_height));
            overflow-y: auto;
            background: #1a1a1a;
            border-right: 1px solid #444;
            border-bottom: 1px solid #444;
            border-top: none;
            border-left: none;
            padding: 12px;
            min-width: 650px;
        }
        .tab-widget-button-container {
            display: flex;
            gap: 0;
            margin-bottom: 8px;
        }
        .tab-widget-button {
            flex: 1;
            text-align: center;
            padding: 6px 10px;
            background: #1e1e1e;
            border: 1px solid #333;
            border-bottom: none;
            color: #ddd;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .tab-widget-button + .tab-widget-button {
            border-left: 1px solid #333;
        }
        .tab-widget-button.selected {
            background: #222;
            color: #fff;
            border-color: #00bcd4;
            border-bottom: 2px solid #00bcd4;
            margin-bottom: -1px;
        }
        .tab-widget-button.selected + .tab-widget-button {
            border-left: 1px solid #00bcd4;
        }
        .tab-widget-button:hover:not(.selected) {
            background: #252525;
            color: #fff;
        }
        .tab-widget-content-container {
            background: #222;
            border: 1px solid #00bcd4;
            border-top: none;
            padding: 10px;
            min-height: 240px;
        }
        .form-row {
            display: flex;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #2a2a2a;
            min-width: 360px;
        }
        .form-row:last-child {
            border-bottom: none;
        }
        .form-row .value-container {
            flex: 1;
        }
        .form-row input,
        button.value {
            background: #2a2a2a;
            border: 1px solid #444;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 10px;
        }
        button.value:hover {
            background: #3a3a3a;
            border-color: #00bcd4;
            color: #fff;
        }
        fieldset {
            border: none;
            padding: 0;
            margin: 0;
        }
        legend {
            display: block;
            width: 100%;
        }

        /* Settings dropdown */
        .slidy-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 12px;
            position: relative;
        }
        .slidy-dropdown-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 14px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .slidy-dropdown-menu {
            display: none;
            position: fixed;
            top: var(--header_height);
            left: 0;
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            padding: 12px;
            min-width: 400px;
            max-width: 1200px;
            max-height: 100vh;
            overflow-y: auto;
            z-index: 10000;
            margin-top: 4px;
            grid-template-columns: repeat(3, minmax(300px, 1fr));
            gap: 12px;
        }
        @media (max-width: 1023px) {
            .slidy-dropdown-menu {
                min-width: 600px;
                max-width: 90vw;
                grid-template-columns: repeat(2, minmax(250px, 1fr));
            }
        }
        @media (max-width: 767px) {
            .slidy-dropdown-menu {
                left: 0;
                right: 0;
                min-width: unset;
                max-width: 100%;
                width: 100vw;
                grid-template-columns: 1fr;
            }
        }
        .slidy-setting-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 8px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 6px;
        }
        .slidy-setting-group.cursor-settings-group {
            max-height: 190px;
            overflow-y: auto;
            padding-right: 8px;
        }
        .slidy-action-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 8px 10px;
            cursor: pointer;
            font-size: 12px;
            border-radius: 3px;
            width: 100%;
        }
        .slidy-action-btn.danger {
            background: rgba(255,255,255,0.08);
            color: #ffdddd;
        }
        .slidy-section-label {
            color: #aaa;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 3px;
        }
        .slidy-setting-container {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .slidy-setting-container.hidden {
            display: none;
        }
        .slidy-setting-label {
            color: #ccc;
            font-size: 11px;
            min-width: 80px;
        }
        .slidy-see-stats-btn {
            display: none;
            min-width: 30px;
            margin-left: 5px;
            padding: 6px 6px;
            background: rgba(60,60,60,0.9);
            color: white;
            border: 1px solid #666;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-height: 30px;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
        }
        .slidy-see-stats-btn:hover {
            background: rgba(80,80,80,0.95);
            border-color: #888;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            max-height: 30px;
        }
        .slidy-slider {
            width: 140px;
            height: 4px;
            cursor: pointer;
        }
        .slidy-slider-value {
            color: #ccc;
            font-size: 11px;
            min-width: 30px;
        }
        .slidy-color-input {
            width: 24px;
            height: 20px;
            border: none;
            cursor: pointer;
            padding: 0;
            background: none;
        }
        .slidy-checkbox {
            width: 14px;
            height: 14px;
            cursor: pointer;
            margin: 0;
        }
        .slidy-select {
            background: #1e1e1e;
            border: 1px solid #333;
            color: #eaeaea;
            padding: 4px 6px;
            font-size: 11px;
            border-radius: 4px;
            width: 140px;
            cursor: pointer;
            outline: none;
            transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .slidy-select:focus {
            border: 1px solid #666;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.1);
        }
        .slidy-text-input {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 2px 4px;
            font-size: 11px;
            border-radius: 3px;
            width: 100px;
        }
        .slidy-file-input,
        .slidy-cursor-file-input {
            display: none;
        }
        .cursor-preview-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: 1px solid #444;
            border-radius: 6px;
            background: #111;
            margin-left: 8px;
            overflow: hidden;
            position: relative;
        }
        .cursor-preview-badge-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        .cursor-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 8px;
            margin-top: 8px;
        }
        .cursor-preview-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border: 1px solid #333;
            border-radius: 8px;
            background: rgba(255,255,255,0.04);
            color: #eee;
            text-align: left;
            cursor: pointer;
            position: relative;
            min-height: 42px;
            transition: border-color 0.2s ease, background 0.2s ease;
        }
        .cursor-preview-item.selected {
            border-color: #00bcd4;
            box-shadow: 0 0 0 2px rgba(0, 188, 212, 0.16);
        }
        .cursor-preview-thumb {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            object-fit: contain;
            background: #111;
            border: 1px solid #222;
        }
        .cursor-preview-thumb.default-cursor-thumb {
            padding: 6px;
            box-sizing: border-box;
        }
        .cursor-preview-label {
            flex: 1;
            font-size: 11px;
            color: #ccc;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .cursor-item-delete {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 22px;
            height: 22px;
            border: none;
            background: rgba(255, 80, 80, 0.18);
            color: #fff;
            border-radius: 50%;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .cursor-item-delete:hover {
            background: rgba(255, 80, 80, 0.32);
        }
        .cursor-preview-empty {
            color: #999;
            font-size: 12px;
            padding: 8px;
        }
        .slidy-drag-handle {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: linear-gradient(180deg, rgba(70,70,70,0.95) 0%, rgba(50,50,50,0.95) 100%);
            border: 1px solid #555;
            border-radius: 8px;
            cursor: move;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 50px !important;
            color: #ddd;
            user-select: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slidy-drag-handle:hover {
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 0 6px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .slidy-drag-handle:active {
            cursor: grabbing;
            transform: translate(-50%, -50%) scale(0.98);
        }
        .slidy-version-span {
            font-weight: 700;
            padding-left: 6px;
            font-size: 11px;
            color: #999;
            letter-spacing: 0.5px;
            opacity: 0.8;
        }

        /* Font combobox */
        .slidy-font-combobox {
            position: relative;
            width: 140px;
        }
        .slidy-font-input {
            background: #1e1e1e;
            border: 1px solid #333;
            color: #eaeaea;
            padding: 4px 8px;
            font-size: 11px;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box;
            outline: none;
        }
        .slidy-font-dropdown {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(30, 30, 30, 0.98);
            border: 1px solid #444;
            border-radius: 4px;
            max-height: 210px;
            min-width: 250px;
            overflow-y: auto;
            z-index: 100001;
            margin-top: 2px;
        }
        .slidy-font-dropdown.open {
            display: block;
        }
        .slidy-font-option {
            padding: 6px 10px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .slidy-font-option:hover {
            background: rgba(255,255,255,0.1);
        }
        .slidy-font-preview {
            font-size: 13px;
            color: #eaeaea;
        }
        .slidy-font-name {
            font-size: 10px;
            color: #888;
        }
        .slidy-font-empty {
            padding: 10px;
            text-align: center;
            color: #666;
            font-size: 11px;
        }

        /* Replay module */
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

        /* Stats graphs */
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

        /* Averages module */
        .avgs-calculator-container {
            background: #333;
            padding: 8px;
            backdrop-filter: blur(8px);
            border: 1px solid #555;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-y: auto;
            min-height: 330px;
        }
        .avgs-calculator-container.no-graphs {
            min-height: 330px;
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
        .avgs-filters-container .avgs-control-label {
            color: cyan;
            font-size: 12px;
            font-weight: bold;
            min-width: 70px;
            line-height: 1.2;
            flex: 0 0 70px;
        }
        .avgs-filters-container .date-filter-high {
            color: cyan;
            font-size: 12px;
            font-weight: bold;
            min-width: auto;
            flex: 0 0 auto;
        }
        .avgs-layout-main {
            display: flex;
            gap: 12px;
            height: 300px;
            max-height: 300px;
            flex-wrap: wrap;
            align-items: stretch;
        }
        .avgs-left-section,
        .avgs-middle-section,
        .avgs-right-section {
            flex: 1 1 350px;
            min-width: 300px;
            display: flex;
            flex-direction: column;
            height: 300px;
            max-height: 300px;
            min-height: 0;
        }
        @media screen and (max-width: 1100px) {
            .avgs-layout-main {
                height: auto;
                max-height: none;
            }

            .avgs-left-section,
            .avgs-middle-section,
            .avgs-right-section {
                width: 100%;
                max-width: 100%;
                height: 300px;
            }
        }
        .avgs-filters-container {
            background: #222;
            padding: 10px;
            border: 1px solid #555;
            height: 100%;
            min-height: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 6px;
            overflow-y: auto;
        }
        .avgs-filters-container .avgs-filter-row {
            display: flex;
            align-items: center;
            margin-bottom: 0;
            flex-wrap: wrap;
            gap: 5px 8px;
        }
        .avgs-filters-container .avgs-filter-row:last-child {
            margin-bottom: 0;
        }
        .avgs-filters-container .avgs-filter-controls {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
            flex: 1 1 230px;
            min-width: 0;
        }
        .avgs-filters-container .avgs-radio-group {
            gap: 5px;
        }
        .avgs-filters-container .avgs-radio-label {
            padding: 4px 8px;
            font-size: 11px;
            min-height: 24px;
            box-sizing: border-box;
        }
        .avgs-filters-container .avgs-filter-input,
        .avgs-filters-container .avgs-date-input,
        .avgs-filters-container .avgs-session-select {
            background: rgba(80, 80, 80, 0.8);
            border: 1px solid #555;
            color: #fff;
            padding: 3px 7px;
            min-width: 90px;
            max-width: 90px;
            font-size: 12px;
        }
        .avgs-filters-container .avgs-filter-input:focus,
        .avgs-filters-container .avgs-date-input:focus,
        .avgs-filters-container .avgs-session-select:focus {
            outline: none;
            border-color: #999;
        }
        .avgs-filters-container .avgs-session-select {
            min-width: 210px;
            flex: 1 1 230px;
        }
        .avgs-filters-container .avgs-checkbox-label {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 26px;
            margin: 0;
        }
        .avgs-date-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .avgs-filters-container .avgs-action-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-top: 6px;
            margin-top: auto;
            border-top: 1px solid #555;
            flex-wrap: wrap;
        }
        #avgs-start-date,
        #avgs-end-date {
        background-color: #1e1e1e;
        color: #ffffff;
        border: 1px solid #444444;
        color-scheme: dark;
        }

        #avgs-start-date::-webkit-calendar-picker-indicator,
        #avgs-end-date::-webkit-calendar-picker-indicator {
        filter: brightness(0) invert(1);
        cursor: pointer;
        }

        #avgs-start-date::-webkit-datetime-edit,
        #avgs-end-date::-webkit-datetime-edit {
        color: #ffffff;
        }

        #avgs-start-date::-webkit-datetime-edit-fields-wrapper,
        #avgs-end-date::-webkit-datetime-edit-fields-wrapper {
        color: #ffffff;
        }

        #avgs-start-date::-webkit-datetime-edit-text,
        #avgs-end-date::-webkit-datetime-edit-text {
        color: #aaaaaa;
        }

        #avgs-start-date::-webkit-datetime-edit-month-field,
        #avgs-start-date::-webkit-datetime-edit-day-field,
        #avgs-start-date::-webkit-datetime-edit-year-field,
        #avgs-end-date::-webkit-datetime-edit-month-field,
        #avgs-end-date::-webkit-datetime-edit-day-field,
        #avgs-end-date::-webkit-datetime-edit-year-field {
        color: #ffffff;
        }

        .avgs-progress-section {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        .avgs-progress-bar {
            width: 100%;
            height: 16px;
            accent-color: #888;
        }
        .avgs-progress-text {
            color: #bbb;
            font-size: 12px;
            min-width: 45px;
        }

        .avgs-filters-container .avgs-range-separator {
            color: #999;
            margin: 0 2px;
        }

        .avgs-filters-container .avgs-date-range {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
            flex: 1 1 220px;
        }

        .avgs-filters-container .avgs-quick-dates {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            padding-left: 78px;
        }

        .avgs-filters-container .avgs-quick-date-btn {
            background: rgba(80, 80, 80, 0.6);
            border: 1px solid #555;
            color: #ccc;
            padding: 4px 7px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.1s;
            border-radius: 0 !important;
            min-height: 24px;
        }

        .avgs-filters-container .avgs-quick-date-btn:hover {
            background: rgba(100, 100, 100, 0.8);
            color: #fff;
        }

        @media screen and (max-width: 640px) {
            .avgs-filters-container .avgs-control-label {
                flex-basis: 100%;
                min-width: 0;
            }

            .avgs-filters-container .avgs-quick-dates {
                padding-left: 0;
            }
        }

        .avgs-filters-container .avgs-end-date-row {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .avgs-calc-btn,
        .avgs-reset-btn,
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
        .avgs-calc-btn {
            display: none;
            border-bottom: 1px solid #555;
            padding: 6px 16px;
            font-size: 13px;
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
        .avgs-reset-btn:hover,
        .avgs-kill-btn:hover {
            background: rgba(160, 70, 70, 0.9);
            transform: translateY(-1px);
            border-bottom-width: 4px;
        }
        .avgs-output-area {
            width: 100%;
            flex: 1;
            min-height: 0;
            max-height: none;
            background: #222;
            border: 1px solid #555;
            color: #e0e0e0;
            padding: 8px 10px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 12px;
            line-height: 1.35;
            resize: none;
            box-sizing: border-box;
        }
        .avgs-output-area:focus {
            outline: none;
            border-color: #999;
        }
        #avgs-session-stats-container {
            height: 100%;
            min-height: 0;
        }
        .avgs-hint {
            color: #999;
            font-size: 11px;
            margin-left: 4px;
        }
        .avgs-session-stats {
            padding: 8px 10px;
            background: #222;
            border: 1px solid #555;
            height: 100%;
            box-sizing: border-box;
            overflow-y: auto;
        }
        .avgs-session-stats-title {
            color: cyan;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 6px;
        }
        .avgs-session-stats-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 4px;
        }
        .avgs-stat-item {
            display: flex;
            align-items: baseline;
            font-size: 11px;
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
            margin-top: 6px;
            padding-top: 6px;
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
            padding: 6px 10px;
            color: cyan;
            font-size: 12px;
            font-weight: bold;
            max-height: 52px;
            overflow-y: auto;
            box-sizing: border-box;
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

        /* Layout helpers for stats panel */
        .module-container[statistics-position="right"] .standard-container {
            grid-template-columns: 1fr !important;
            grid-template-areas: "a" !important;
        }
        .standard-stats-panel {
            position: absolute !important;
            right: 330px !important;
            top: 0 !important;
            max-width: 250px !important;
            pointer-events: none;
            user-select: none;
        }
        .header {
            z-index: 100 !important;
        }
        .fewest-moves-main-panel {
            grid-area: a !important;
            position: relative !important;
        }
        .fewest-moves-data-panel {
            padding: 2px;
        }
        .fewest-moves-stats-panel {
            position: absolute !important;
            right: 10px !important;
            top: 10px !important;
            max-width: 250px !important;
            pointer-events: none;
            user-select: none;
        }            
        .module-container {
            background-color: transparent !important;
            background: none !important;
        }

        .piece {
            outline-width: var(--border-width-puzzle, 0px) !important;
            outline-style: solid !important;
            outline-color: var(--border-color-puzzle, transparent) !important;
            outline-offset: calc(-1 * var(--border-width-puzzle, 0px)) !important;
        }
    `);

    let adjustButton = null;
    let toggleCenterButton = null;
    let isEditingMode = false;
    let dragHandle = null;
    let scrambled = false;
    let positionApplied = false;
    let previousSessionName = null;
    let isZenMode = false;

    const DEFAULT_CONFIG = {
        bgDim: 0.5,
        bgBlur: 0,
        puzzleDim: 1,
        uiOpacity: 0.8,
        puzzleLeft: 0,
        puzzleTop: 0,
        borderWidth: 0,
        borderColor: '#000000',
        gridsBorderWidth: 1,
        gridsBorderColor: '#000000',
        fontFamily: 'Arial',
        fontSize: 30,
        bold: false,
        inactiveBrightness: 0.3,
        base9: false,
        soundEnabled: true,
        soundVolume: 0.01,
        soundDebounce: 40,
        hideTimerDuringSolves: false,
        minimizeSessions: true,
        hideHeaderDuringSolves: true,
        puzzleAlwaysInCenter: true,
        blankColorOpacity: 0,
        blankColor: '#000000',
        statsGraphs: true,
        statsAverages: true,
        statsReplays: true,
        cursorEnabled: true,
        rawHardwareInput: false,
        borderRadius: 0
    };

    const STORAGE_KEYS = {
        bgDim: 'slidysim_dph_script_bg_dim',
        bgBlur: 'slidysim_dph_script_bg_blur',
        puzzleDim: 'slidysim_dph_script_puzzle_dim',
        uiOpacity: 'slidysim_dph_script_ui_opacity',
        puzzleLeft: 'slidysim_dph_script_puzzle_left',
        puzzleTop: 'slidysim_dph_script_puzzle_top',
        borderWidth: 'slidysim_dph_script_border_width',
        borderColor: 'slidysim_dph_script_border_color',
        gridsBorderWidth: 'slidysim_dph_script_grids_border_width',
        gridsBorderColor: 'slidysim_dph_script_grids_border_color',
        fontFamily: 'slidysim_dph_script_font_family',
        fontSize: 'slidysim_dph_script_font_size',
        bold: 'slidysim_dph_script_bold',
        inactiveBrightness: 'slidysim_dph_script_inactive_brightness',
        base9: 'slidysim_dph_script_base9',
        soundEnabled: 'slidysim_dph_script_sound_enabled',
        soundVolume: 'slidysim_dph_script_sound_volume',
        soundDebounce: 'slidysim_dph_script_sound_debounce',
        hideTimerDuringSolves: 'slidysim_dph_script_hide_timer_during_solves',
        minimizeSessions: 'slidysim_dph_script_minimize_sessions',
        hideHeaderDuringSolves: 'slidysim_dph_script_hide_header_during_solves',
        puzzleAlwaysInCenter: 'slidysim_dph_script_puzzle_always_in_center',
        blankColorOpacity: 'slidysim_dph_script_blank_color_opacity',
        blankColor: 'slidysim_dph_script_blank_color',
        statsGraphs: 'slidysim_dph_script_stats_graphs',
        statsAverages: 'slidysim_dph_script_stats_averages',
        statsReplays: 'slidysim_dph_script_stats_replays',
        cursorEnabled: 'slidysim_dph_script_cursor_enabled',
        selectedCursorId: 'slidysim_dph_script_cursor_selected',
        rawHardwareInput: 'slidysim_dph_script_raw_hardware_input',
        borderRadius: 'slidysim_dph_script_border_radius'
    };

    const FLOAT_SETTINGS = new Set([
        'puzzleDim',
        'bgDim',
        'blankColorOpacity',
        'uiOpacity',
        'inactiveBrightness',
        'soundVolume'
    ]);

    const currentConfig = { ...DEFAULT_CONFIG };

    function parseSettingValue(key, rawValue) {
        const def = DEFAULT_CONFIG[key];
        if (typeof def === 'boolean') {
            return rawValue === true || rawValue === 'true';
        }
        if (typeof def === 'number') {
            if (FLOAT_SETTINGS.has(key)) {
                return parseFloat(rawValue);
            }
            if (Number.isInteger(def)) {
                return parseInt(rawValue, 10);
            }
            return parseFloat(rawValue);
        }
        return rawValue;
    }

    function loadStoredSettings() {
        Object.keys(STORAGE_KEYS).forEach(key => {
            const stored = localStorage.getItem(STORAGE_KEYS[key]);
            currentConfig[key] = stored === null ? DEFAULT_CONFIG[key] : parseSettingValue(key, stored);
        });
    }

    function saveSettingValue(key, value) {
        const parsedValue = parseSettingValue(key, value);
        currentConfig[key] = parsedValue;
        localStorage.setItem(STORAGE_KEYS[key], String(value));
        return parsedValue;
    }

    function getCurrentSetting(key) {
        return currentConfig[key];
    }

    function unlockKeys() {
        window.addEventListener('keydown', function (e) {
            if (['F11', 'F12'].includes(e.key)) {
                e.stopImmediatePropagation();
            }
        }, true);
    }

    function resetAllSettings() {
        Object.keys(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(STORAGE_KEYS[key]);
        });

        alert(
            "🔄 SlidySim settings reset!\n\n" +
            "Please refresh the page to apply default settings."
        );
    }

    function updateSliderDisplay(input, valueDisplay, config) {
        if (!valueDisplay) return;

        let value = parseFloat(input.value);
        const unit = config.unit || '';
        if (config.id === "sound-volume" && value < 0.02) {
            valueDisplay.textContent = 'Disabled';
            return;
        }

        if (unit === '%') {
            value = Math.round(value * 100);
            valueDisplay.textContent = value + '%';
            return;
        }

        if (unit === 'px') {
            value = Math.round(value);
        }

        valueDisplay.textContent = value + unit;
    }

    function createSetting(config) {
        const {
            id,
            label,
            type,
            defaultValue,
            storageKey,
            onChange,
            onRestore,
            containerStyle = {},
            min,
            max,
            step,
            options,
            placeholder,
            checked
        } = config;

        const settingKey = Object.keys(STORAGE_KEYS).find(k => STORAGE_KEYS[k] === storageKey);
        const container = document.createElement('div');
        container.className = 'slidy-setting-container';
        if (type === 'hidden') {
            container.classList.add('hidden');
        }
        if (typeof containerStyle === 'string' && containerStyle) {
            container.style.cssText += containerStyle;
        }
        Object.assign(container.style, typeof containerStyle === 'object' ? containerStyle : {});

        const labelEl = document.createElement('span');
        labelEl.textContent = label + ':';
        labelEl.className = 'slidy-setting-label';
        container.appendChild(labelEl);

        let input, valueDisplay;

        function updateValueDisplay() {
            if (valueDisplay) {
                updateSliderDisplay(input, valueDisplay, config);
            }
        }

        function setInputValue(value) {
            if (type === 'checkbox') {
                input.checked = Boolean(value);
            } else {
                input.value = value;
            }
            updateValueDisplay();
        }

        function persistValue(value) {
            if (!settingKey) return value;
            return saveSettingValue(settingKey, value);
        }

        function notifyChange(parsedValue) {
            if (onChange) onChange(parsedValue);
        }

        switch (type) {
            case 'slider':
                input = document.createElement('input');
                input.type = 'range';
                input.min = min;
                input.max = max;
                input.step = step;
                input.value = defaultValue;
                input.className = 'slidy-slider';

                valueDisplay = document.createElement('span');
                valueDisplay.className = 'slidy-slider-value';
                updateValueDisplay();

                input.addEventListener('input', () => {
                    const parsedValue = persistValue(input.value);
                    updateValueDisplay();
                    notifyChange(parsedValue);
                });

                container.appendChild(input);
                container.appendChild(valueDisplay);
                break;

            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                input.value = defaultValue;
                input.className = 'slidy-color-input';

                input.addEventListener('input', () => {
                    const parsedValue = persistValue(input.value);
                    notifyChange(parsedValue);
                });

                container.appendChild(input);
                break;

            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = id;
                input.checked = checked !== undefined ? checked : Boolean(DEFAULT_CONFIG[settingKey]);
                input.className = 'slidy-checkbox';

                input.addEventListener('change', () => {
                    const parsedValue = persistValue(input.checked);
                    notifyChange(parsedValue);
                });

                container.appendChild(input);
                break;

            case 'select':
                input = document.createElement('select');
                input.className = 'slidy-select';

                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    input.appendChild(option);
                });

                input.value = defaultValue;

                input.addEventListener('change', () => {
                    const parsedValue = persistValue(input.value);
                    notifyChange(parsedValue);
                });

                container.appendChild(input);
                break;

            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.placeholder = placeholder || '';
                input.value = defaultValue;
                input.className = 'slidy-text-input';

                input.addEventListener('input', () => {
                    const parsedValue = persistValue(input.value);
                    notifyChange(parsedValue);
                });

                container.appendChild(input);
                break;
        }

        function setValue(val, options = { store: true, notify: true }) {
            const value = val === undefined || val === null ? DEFAULT_CONFIG[settingKey] : val;
            setInputValue(value);
            const parsedValue = options.store && settingKey ? saveSettingValue(settingKey, value) : parseSettingValue(settingKey, value);
            if (options.notify) {
                if (onChange) onChange(parsedValue);
            }
            return parsedValue;
        }

        function restore(val) {
            const restoredValue = val === undefined ? DEFAULT_CONFIG[settingKey] : val;
            setValue(restoredValue, { store: true, notify: Boolean(onRestore || onChange) });
            if (onRestore) {
                onRestore(currentConfig[settingKey]);
            }
        }

        return {
            container,
            input,
            getValue: () => (type === 'checkbox' ? input.checked : input.value),
            setValue,
            restore,
            settingKey,
            storageKey
        };
    }

    const DB_NAME = 'SlidySimBG';
    const DB_VERSION = 2;
    const STORE_NAME = 'backgrounds';
    const BG_KEY = 'custom_bg';
    const CURSOR_DB_NAME = 'SlidySimCursor';
    const CURSOR_STORE_NAME = 'cursors';
    const CURSOR_KEY = 'custom_cursor';
    const DEFAULT_CURSOR_ID = 'default_cursor';
    const DEFAULT_CURSOR_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAATCAYAAACk9eypAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADmSURBVDhPjY/NDsFAFIXv9ZOQRlVIiLew8hRe0UvoEovuJDYiwVYsNFYVFUSCOdMrmUpb861ub883Z4aI3SNVukOyRgnM3sxeUsJbYS+JAOwkQwD/pR8BFEsZAsiXcgSQLRUI98czQyoQQBRdfqQ/AgjDkyFZCGC/P2iJtfA695I6ouv1To5T03Op1JrrIYXREMe3N1EjnvhT/a1OnJbL7ZEkBRG+YdyT2V1jl1zDXUtSUIIZ1iv2/CBYwEGLn2rRrzfCGszc3ELYbHZoWcmffHAywtKylHUB9XYfLcytMVU7g2RJ9AEDZkogKtgbQgAAAABJRU5ErkJggg==";
    let db = null;
    let cursorDb = null;
    let currentBlobUrl = null;
    let currentCursorBlobUrl = null;
    const cursorEntries = [];
    let selectedCursorId = DEFAULT_CURSOR_ID;

    async function restoreMedia() {
        try {
            const blob = await loadFromDB();
            if (blob) {
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                }
                currentBlobUrl = URL.createObjectURL(blob);
                applyBackground(currentBlobUrl, currentConfig.bgDim);
            }
        } catch (error) {
            console.error('Failed to load background:', error);
        }
        try {
            const entries = await loadCursorEntriesFromDB();
            cursorEntries.length = 0;
            entries.forEach(entry => cursorEntries.push(entry));
            cursorEntries.forEach(entry => {
                createCursorObjectURL(entry);
                ensureCursorMetadata(entry);
            });

            const legacyCursorDisabled = currentConfig.cursorEnabled === false;
            const storedCursorExists = currentConfig.selectedCursorId
                && getCursorEntriesForPicker().some(entry => entry.id === currentConfig.selectedCursorId);
            selectedCursorId = legacyCursorDisabled
                ? DEFAULT_CURSOR_ID
                : (storedCursorExists ? currentConfig.selectedCursorId : DEFAULT_CURSOR_ID);
            if (legacyCursorDisabled) {
                localStorage.setItem(STORAGE_KEYS.selectedCursorId, DEFAULT_CURSOR_ID);
            }
            localStorage.removeItem(STORAGE_KEYS.cursorEnabled);
            currentConfig.cursorEnabled = true;

            const selectedEntry = getSelectedCursorEntry();
            if (selectedEntry?.isDefault) {
                currentCursorBlobUrl = null;
                toggleCustomCursor(false);
            } else if (selectedEntry) {
                currentCursorBlobUrl = createCursorObjectURL(selectedEntry);
                toggleCustomCursor(true);
            }

            renderCursorPicker();
        } catch (error) {
            console.error('Failed to load cursor:', error);
        }
    }

    async function loadCursorEntriesFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const request = store.openCursor();
            const entries = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor) {
                    resolve(entries);
                    return;
                }

                let value = cursor.value;
                const key = cursor.key;

                if (value instanceof Blob) {
                    value = {
                        id: key,
                        blob: value,
                        name: 'Custom cursor',
                        createdAt: Date.now()
                    };
                } else if (value && typeof value === 'object') {
                    value = {
                        id: key,
                        blob: value.blob || value,
                        name: value.name || `Cursor ${key}`,
                        createdAt: value.createdAt || Date.now()
                    };
                } else {
                    cursor.continue();
                    return;
                }

                entries.push(value);
                cursor.continue();
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function saveCursorEntryToDB(blob, id, name) {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const cursorData = {
                id,
                blob,
                name: name || `Cursor ${new Date().toLocaleString()}`,
                createdAt: Date.now()
            };
            const request = store.put(cursorData, id);
            request.onsuccess = () => resolve(cursorData);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function deleteCursorEntryFromDB(id) {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function getDefaultCursorEntry() {
        return {
            id: DEFAULT_CURSOR_ID,
            name: 'Default cursor',
            isDefault: true
        };
    }

    function getCursorEntriesForPicker() {
        return [getDefaultCursorEntry(), ...cursorEntries];
    }

    function createCursorObjectURL(entry) {
        if (entry?.isDefault) return null;
        if (entry.url) return entry.url;
        if (entry.blob) {
            entry.url = URL.createObjectURL(entry.blob);
        }
        return entry.url;
    }

    function ensureCursorMetadata(entry) {
        if (entry.hotspotX !== undefined && entry.hotspotY !== undefined) {
            return Promise.resolve(entry);
        }
        if (entry.metadataPromise) {
            return entry.metadataPromise;
        }

        entry.metadataPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const width = img.naturalWidth || img.width || 32;
                const height = img.naturalHeight || img.height || 32;
                entry.hotspotX = Math.round(width / 2);
                entry.hotspotY = Math.round(height / 2);
                renderCursorPicker();
                resolve(entry);
            };
            img.onerror = function () {
                entry.hotspotX = 16;
                entry.hotspotY = 16;
                renderCursorPicker();
                resolve(entry);
            };
            img.src = createCursorObjectURL(entry);
        });

        return entry.metadataPromise;
    }

    function revokeCursorObjectURL(entry) {
        if (entry && entry.url) {
            URL.revokeObjectURL(entry.url);
            entry.url = null;
        }
    }

    function getSelectedCursorEntry() {
        return getCursorEntriesForPicker().find(entry => entry.id === selectedCursorId) || getDefaultCursorEntry();
    }

    function updateCursorControlsVisibility() {
        cursorPreviewBadge.style.display = 'inline-flex';
    }

    function setSelectedCursorId(id, options = { store: true, notify: true }) {
        selectedCursorId = id;
        if (options.store) {
            localStorage.setItem(STORAGE_KEYS.selectedCursorId, String(id));
        }
        renderCursorPicker();
        if (options.notify) {
            const selected = getSelectedCursorEntry();
            currentCursorBlobUrl = selected?.isDefault ? null : createCursorObjectURL(selected);
            toggleCustomCursor(!selected?.isDefault);
        }
    }

    async function removeCursorEntry(id) {
        if (id === DEFAULT_CURSOR_ID) return;

        const index = cursorEntries.findIndex(entry => entry.id === id);
        if (index === -1) return;

        const [entry] = cursorEntries.splice(index, 1);
        revokeCursorObjectURL(entry);
        await deleteCursorEntryFromDB(id);

        if (selectedCursorId === id) {
            selectedCursorId = DEFAULT_CURSOR_ID;
            localStorage.setItem(STORAGE_KEYS.selectedCursorId, selectedCursorId);
            currentCursorBlobUrl = null;
            toggleCustomCursor(false);
        }

        renderCursorPicker();
    }

    function renderCursorPicker() {
        cursorListContainer.innerHTML = '';
        const selected = getSelectedCursorEntry();
        const pickerEntries = getCursorEntriesForPicker();
        updateCursorControlsVisibility();

        cursorPreviewImg.src = selected?.isDefault ? DEFAULT_CURSOR_ICON : createCursorObjectURL(selected);
        cursorPreviewImg.alt = selected ? selected.name : 'Cursor preview';
        if (selected?.isDefault) {
            cursorPreviewBadge.style.cursor = 'auto';
        } else if (selected) {
            const selectedHotspotX = selected.hotspotX ?? 16;
            const selectedHotspotY = selected.hotspotY ?? 16;
            cursorPreviewBadge.style.cursor = `url('${createCursorObjectURL(selected)}') ${selectedHotspotX} ${selectedHotspotY}, auto`;
        } else {
            cursorPreviewBadge.style.cursor = 'auto';
        }

        pickerEntries.forEach(entry => {
            const hotspotX = entry.hotspotX ?? 16;
            const hotspotY = entry.hotspotY ?? 16;
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'cursor-preview-item';
            if (entry.id === selectedCursorId) {
                item.classList.add('selected');
            }

            const img = document.createElement('img');
            img.className = 'cursor-preview-thumb';
            if (entry.isDefault) {
                img.classList.add('default-cursor-thumb');
            }
            img.src = entry.isDefault ? DEFAULT_CURSOR_ICON : createCursorObjectURL(entry);
            img.alt = entry.name;
            item.appendChild(img);

            const label = document.createElement('span');
            label.className = 'cursor-preview-label';
            label.textContent = entry.name;
            item.appendChild(label);

            item.style.cursor = entry.isDefault
                ? 'auto'
                : `url('${createCursorObjectURL(entry)}') ${hotspotX} ${hotspotY}, auto`;
            item.title = `Select "${entry.name}"`;

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                setSelectedCursorId(entry.id);
            });

            if (entry.isDefault) {
                cursorListContainer.appendChild(item);
                return;
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'cursor-item-delete';
            deleteBtn.textContent = '✕';
            deleteBtn.title = `Delete "${entry.name}"`;
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await removeCursorEntry(entry.id);
            });
            item.appendChild(deleteBtn);

            cursorListContainer.appendChild(item);
        });
    }

    async function restoreSettings() {
        loadStoredSettings();

        Object.keys(settings).forEach(key => {
            const setting = settings[key];
            const value = currentConfig[key];

            if (!setting) return;

            if (typeof setting.restore === 'function') {
                setting.restore(value);
            } else if (typeof setting.setValue === 'function') {
                setting.setValue(value);
            }
        });
        await restoreMedia();
    }

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function saveToDB(blob) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(blob, BG_KEY);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function loadFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(BG_KEY);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function deleteFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(BG_KEY);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function openCursorDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CURSOR_DB_NAME, 2);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CURSOR_STORE_NAME)) {
                    db.createObjectStore(CURSOR_STORE_NAME);
                }
            };
            request.onsuccess = (event) => {
                cursorDb = event.target.result;
                resolve(cursorDb);
            };
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function saveCursorToDB(blob) {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const request = store.put(blob, CURSOR_KEY);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function loadCursorFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const request = store.get(CURSOR_KEY);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    function deleteCursorFromDB() {
        return new Promise((resolve, reject) => {
            const transaction = cursorDb.transaction([CURSOR_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CURSOR_STORE_NAME);
            const request = store.delete(CURSOR_KEY);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    const controls = document.createElement('div');
    controls.className = 'slidy-controls';

    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '🎨';
    dropdownBtn.title = 'Settings';
    dropdownBtn.className = 'slidy-dropdown-btn';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'slidy-dropdown-menu';

    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '📁 Upload Background';
    uploadBtn.className = 'slidy-action-btn';

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️ Remove Background';
    removeBtn.className = 'slidy-action-btn';
    removeBtn.style.display = 'none';

    const cursorUploadBtn = document.createElement('button');
    cursorUploadBtn.textContent = '📁 Upload Cursor';
    cursorUploadBtn.className = 'slidy-action-btn';

    const cursorToolbar = document.createElement('div');
    cursorToolbar.className = 'slidy-setting-container';

    const cursorPreviewBadge = document.createElement('div');
    cursorPreviewBadge.className = 'cursor-preview-badge';
    cursorPreviewBadge.title = 'Selected cursor preview';
    cursorPreviewBadge.style.display = 'inline-flex';
    const cursorPreviewImg = document.createElement('img');
    cursorPreviewImg.className = 'cursor-preview-badge-img';
    cursorPreviewImg.alt = 'Selected cursor';
    cursorPreviewBadge.appendChild(cursorPreviewImg);
    cursorToolbar.appendChild(cursorUploadBtn);
    cursorToolbar.appendChild(cursorPreviewBadge);
    cursorPreviewBadge.style.marginLeft = 'auto';
    cursorPreviewBadge.style.marginRight = '0';

    const cursorListContainer = document.createElement('div');
    cursorListContainer.className = 'cursor-list';

    function createSectionLabel(text, marginTop = '6px') {
        const label = document.createElement('div');
        label.textContent = text;
        label.className = 'slidy-section-label';
        if (marginTop && marginTop !== '6px') {
            label.style.marginTop = marginTop;
        }
        return label;
    }

    const settings = {};

    const bgDimSetting = createSetting({
        id: 'bg-dim',
        label: 'Background Dim',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.bgDim,
        storageKey: STORAGE_KEYS.bgDim,
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => {
            const dim = parseFloat(val);
            if (currentBlobUrl) applyBackground(currentBlobUrl, dim);
        }
    });
    settings.bgDim = bgDimSetting;

    const bgBlurSetting = createSetting({
        id: 'bg-blur',
        label: 'Background Blur',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.bgBlur,
        storageKey: STORAGE_KEYS.bgBlur,
        unit: 'px',
        min: '0',
        max: '20',
        step: '1',
        onChange: (val) => {
            if (currentBlobUrl) applyBackground(currentBlobUrl);
        }
    });
    settings.bgBlur = bgBlurSetting;

    const puzzleDimSetting = createSetting({
        id: 'puzzle-dim',
        label: 'Puzzle Opacity',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.puzzleDim,
        storageKey: STORAGE_KEYS.puzzleDim,
        unit: '%',
        min: '0.5',
        max: '1',
        step: '0.01',
        onChange: (val) => applyPuzzleDim(parseFloat(val))
    });
    settings.puzzleDim = puzzleDimSetting;

    const blankColorOpacitySetting = createSetting({
        id: 'blank-color-opacity',
        label: 'Blank Opacity',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.blankColorOpacity,
        storageKey: STORAGE_KEYS.blankColorOpacity,
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => applyBlankColor()
    });
    settings.blankColorOpacity = blankColorOpacitySetting;

    const blankColorSetting = createSetting({
        id: 'blank-color',
        label: 'Blank Color',
        type: 'color',
        defaultValue: DEFAULT_CONFIG.blankColor,
        storageKey: STORAGE_KEYS.blankColor,
        onChange: (val) => applyBlankColor()
    });
    settings.blankColor = blankColorSetting;

    const uiOpacitySetting = createSetting({
        id: 'ui-opacity',
        label: 'UI Opacity',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.uiOpacity,
        storageKey: STORAGE_KEYS.uiOpacity,
        unit: '%',
        min: '0.1',
        max: '1',
        step: '0.01',
        onChange: (val) => applyUIOpacity(parseFloat(val))
    });
    settings.uiOpacity = uiOpacitySetting;

    const puzzleLeftSetting = createSetting({
        id: 'puzzle-left',
        label: 'Puzzle Left',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.puzzleLeft,
        storageKey: STORAGE_KEYS.puzzleLeft,
        unit: 'px',
        min: '-1900',
        max: '1900',
        step: '1',
        onChange: (val) => applyPuzzlePosition()
    });
    settings.puzzleLeft = puzzleLeftSetting;

    const puzzleTopSetting = createSetting({
        id: 'puzzle-top',
        label: 'Puzzle Top',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.puzzleTop,
        storageKey: STORAGE_KEYS.puzzleTop,
        unit: 'px',
        min: '-1000',
        max: '1000',
        step: '1',
        onChange: (val) => applyPuzzlePosition()
    });
    settings.puzzleTop = puzzleTopSetting;

    const borderWidthSetting = createSetting({
        id: 'border-width',
        label: 'Puzzle Border',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.borderWidth,
        storageKey: STORAGE_KEYS.borderWidth,
        unit: 'px',
        min: '0',
        max: '5',
        step: '1',
        onChange: (val) => applyBorder(parseInt(val), settings.borderColor.getValue())
    });
    settings.borderWidth = borderWidthSetting;

    const borderColorSetting = createSetting({
        id: 'border-color',
        label: '',
        type: 'color',
        defaultValue: DEFAULT_CONFIG.borderColor,
        storageKey: STORAGE_KEYS.borderColor,
        onChange: (val) => applyBorder(parseInt(settings.borderWidth.getValue()), val)
    });
    settings.borderColor = borderColorSetting;
    borderWidthSetting.container.appendChild(borderColorSetting.input);

    const gridsBorderWidthSetting = createSetting({
        id: 'grids-border-width',
        label: 'Grids Border',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.gridsBorderWidth,
        storageKey: STORAGE_KEYS.gridsBorderWidth,
        unit: 'px',
        min: '0',
        max: '4',
        step: '1',
        onChange: (val) => applyGridsBorder(parseInt(val), settings.gridsBorderColor.getValue())
    });
    settings.gridsBorderWidth = gridsBorderWidthSetting;

    const gridsBorderColorSetting = createSetting({
        id: 'grids-border-color',
        label: '',
        type: 'color',
        defaultValue: DEFAULT_CONFIG.gridsBorderColor,
        storageKey: STORAGE_KEYS.gridsBorderColor,
        onChange: (val) => applyGridsBorder(parseInt(settings.gridsBorderWidth.getValue()), val)
    });
    settings.gridsBorderColor = gridsBorderColorSetting;
    gridsBorderWidthSetting.container.appendChild(gridsBorderColorSetting.input);

    // ==================== FONT ====================

    // Local Font Access API - gets system fonts using unsafeWindow
    async function getLocalFonts() {
        try {
            // Check if API is available in unsafeWindow (required for userscripts)
            if (!unsafeWindow.queryLocalFonts) {
                return null;
            }
            const fonts = await unsafeWindow.queryLocalFonts();
            // Extract unique font family names, filter out duplicates and empty names
            const fontFamilies = [...new Set(
                fonts
                    .map(f => f.family)
                    .filter(f => f && f.trim().length > 0)
                    .sort((a, b) => a.localeCompare(b))
            )];
            return fontFamilies;
        } catch (error) {
            // User denied permission or API error - silently fall back
            return null;
        }
    }

    function isFontAvailable(font) {
        const text = "mmmmmmmmmmlli";
        const size = "72px";

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        context.font = `${size} monospace`;
        const baseline = context.measureText(text).width;

        context.font = `${size} "${font}", monospace`;
        const width = context.measureText(text).width;

        return width !== baseline;
    }

    // Default fallback fonts (used when Local Font Access is not available/denied)
    const defaultFontList = [
        'system-ui', 'Arial', 'Verdana', 'Tahoma', 'Trebuchet MS',
        'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Comic Sans MS',
        'Calibri', 'Cambria', 'Candara', 'Consolas', 'Constantia', 'Corbel',
        'Segoe UI', 'Segoe UI Variable', 'Segoe Print', 'Segoe Script',
        'Bahnschrift', 'Franklin Gothic Medium', 'Lucida Console', 'Lucida Sans Unicode',
        'Palatino Linotype', 'Book Antiqua',
        'San Francisco', 'Helvetica', 'Helvetica Neue', 'Arial Rounded MT Bold',
        'Avenir', 'Avenir Next', 'Gill Sans', 'Optima', 'Didot',
        'Menlo', 'Monaco', 'American Typewriter',
        'Ubuntu', 'Cantarell', 'DejaVu Sans', 'DejaVu Serif', 'Liberation Sans',
        'Liberation Serif', 'Liberation Mono', 'Noto Sans', 'Noto Serif',
        'FreeSans', 'FreeSerif', 'FreeMono',
        'Dubai', 'Exo 2',
        'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
        'Raleway', 'Nunito', 'DM Sans', 'Space Grotesk',
        'Manrope', 'Work Sans', 'Plus Jakarta Sans', 'Outfit', 'Urbanist',
        'Mulish', 'Quicksand', 'Rubik', 'Figtree', 'Hind', 'Karla',
        'Assistant', 'Public Sans', 'Red Hat Display', 'IBM Plex Sans',
        'JetBrains Mono', 'Fira Code', 'Source Code Pro',
        'Cascadia Code', 'Cascadia Mono', 'Inconsolata',
        'IBM Plex Mono', 'Hack', 'Anonymous Pro',
        'Impact', 'Charcoal', 'Copperplate', 'Papyrus', 'Brush Script MT',
        'Century Gothic', 'Rockwell', 'Baskerville',
        'Wingdings'
    ];

    // Store fonts globally for the combobox
    let availableFonts = ['Arial']; // Start with just Arial
    let localFontsLoaded = false;
    let fontLoadingAttempted = false;

    // Load fonts from user's system - called on first user interaction
    async function loadUserFonts() {
        if (fontLoadingAttempted) return; // Only try once
        fontLoadingAttempted = true;

        // Try to get local fonts first
        const localFonts = await getLocalFonts();

        if (localFonts && localFonts.length > 0) {
            // Use local fonts - no need to merge with defaults since system fonts cover everything
            availableFonts = localFonts;
            localFontsLoaded = true;
        } else {
            // Fall back to default font list, filtered for availability
            availableFonts = defaultFontList.filter(font => isFontAvailable(font));
            localFontsLoaded = false;
        }
    }

    function createFontCombobox(config) {
        const {
            id,
            label,
            defaultValue,
            storageKey,
            onChange
        } = config;

        const container = document.createElement('div');
        container.className = 'slidy-setting-container';

        const labelEl = document.createElement('span');
        labelEl.textContent = label + ':';
        labelEl.className = 'slidy-setting-label';
        container.appendChild(labelEl);

        const comboboxWrapper = document.createElement('div');
        comboboxWrapper.className = 'slidy-font-combobox';

        // Input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'slidy-font-input';
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-controls', id + '-listbox');
        input.placeholder = 'Search fonts...';

        // Dropdown list
        const dropdown = document.createElement('div');
        dropdown.className = 'slidy-font-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.id = id + '-listbox';

        comboboxWrapper.appendChild(input);
        comboboxWrapper.appendChild(dropdown);
        container.appendChild(comboboxWrapper);

        // State
        let fonts = ['Arial']; // Start with just Arial
        let filteredFonts = fonts;
        let highlightedIndex = -1;
        let selectedFont = null;
        let debounceTimer = null;
        let fontsLoaded = false;

        const storageKeyName = Object.keys(STORAGE_KEYS).find(k => STORAGE_KEYS[k] === storageKey);

        // Initialize - just set initial value, don't load fonts yet
        async function init() {
            // Use current availableFonts (initially just Arial)
            fonts = [...availableFonts];
            filteredFonts = fonts;
            renderDropdown();

            const savedValue = storageKeyName ? currentConfig[storageKeyName] : defaultValue;
            if (savedValue && savedValue !== 'custom') {
                selectFont(savedValue, false);
            } else if (savedValue === 'inherit') {
                selectFont('Default', false);
            }
        }

        // Load fonts on first user interaction
        async function ensureFontsLoaded() {
            if (fontsLoaded) return;

            fontsLoaded = true;
            // Trigger font loading
            await loadUserFonts();

            // Update the fonts list with newly loaded fonts
            fonts = [...availableFonts];
            filterFonts(input.value);
        }

        // Render dropdown options
        function renderDropdown() {
            dropdown.innerHTML = '';

            if (filteredFonts.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'slidy-font-empty';
                emptyMsg.textContent = 'No fonts found';
                dropdown.appendChild(emptyMsg);
                return;
            }

            filteredFonts.forEach((font, index) => {
                const option = document.createElement('div');
                option.className = 'slidy-font-option';
                option.setAttribute('role', 'option');
                option.setAttribute('data-font', font);

                if (index === highlightedIndex) {
                    option.classList.add('highlighted');
                }
                if (selectedFont === font) {
                    option.classList.add('selected');
                }

                // Preview with numbers in the actual font
                const preview = document.createElement('div');
                preview.className = 'slidy-font-preview';
                preview.textContent = '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15';
                preview.style.fontFamily = `"${font}", sans-serif`;

                // Font name label
                const name = document.createElement('div');
                name.className = 'slidy-font-name';
                name.textContent = font;

                option.appendChild(preview);
                option.appendChild(name);

                // Click to select
                option.addEventListener('click', () => {
                    selectFont(font, true);
                });

                dropdown.appendChild(option);
            });
        }

        // Filter fonts based on search query
        function filterFonts(query) {
            if (!query || query.trim() === '') {
                filteredFonts = fonts;
            } else {
                const lowerQuery = query.toLowerCase();
                filteredFonts = fonts.filter(font =>
                    font.toLowerCase().includes(lowerQuery)
                );
            }
            highlightedIndex = -1;
            renderDropdown();
        }

        // Select a font
        function selectFont(font, notify) {
            selectedFont = font;
            input.value = font;
            input.style.fontFamily = font === 'Default' ? 'inherit' : `"${font}", sans-serif`;
            dropdown.classList.remove('open');
            input.setAttribute('aria-expanded', 'false');

            if (notify && onChange) {
                const value = font === 'Default' ? 'inherit' : font;
                if (storageKeyName) {
                    saveSettingValue(storageKeyName, value);
                }
                onChange(value);
            }
        }

        // ==================== FONT STUF ENDS ====================

        function debouncedFilter(query) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                filterFonts(query);
            }, 150);
        }

        input.addEventListener('input', (e) => {
            debouncedFilter(e.target.value);
            dropdown.classList.add('open');
            input.setAttribute('aria-expanded', 'true');
        });

        input.addEventListener('focus', async () => {
            await ensureFontsLoaded();
            dropdown.classList.add('open');
            input.setAttribute('aria-expanded', 'true');
            filterFonts(input.value);
        });

        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!dropdown.contains(document.activeElement)) {
                    dropdown.classList.remove('open');
                    input.setAttribute('aria-expanded', 'false');
                }
            }, 150);
        });

        input.addEventListener('keydown', (e) => {
            const options = dropdown.querySelectorAll('.slidy-font-option');

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (filteredFonts.length > 0) {
                        highlightedIndex = Math.min(highlightedIndex + 1, filteredFonts.length - 1);
                        renderDropdown();
                        scrollToHighlighted();
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (filteredFonts.length > 0) {
                        highlightedIndex = Math.max(highlightedIndex - 1, 0);
                        renderDropdown();
                        scrollToHighlighted();
                    }
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (highlightedIndex >= 0 && filteredFonts[highlightedIndex]) {
                        selectFont(filteredFonts[highlightedIndex], true);
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    dropdown.classList.remove('open');
                    input.setAttribute('aria-expanded', 'false');
                    input.blur();
                    break;

                case 'Tab':
                    dropdown.classList.remove('open');
                    input.setAttribute('aria-expanded', 'false');
                    break;
            }
        });

        function scrollToHighlighted() {
            const options = dropdown.querySelectorAll('.slidy-font-option');
            if (options[highlightedIndex]) {
                options[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        // Initialize
        init();

        return {
            container,
            input,
            getValue: () => {
                const value = selectedFont === 'Default' ? 'inherit' : selectedFont;
                return value;
            },
            setValue: (val) => {
                if (val === 'inherit' || val === 'Default') {
                    selectFont('Default', false);
                    if (storageKeyName) saveSettingValue(storageKeyName, 'inherit');
                    if (onChange) onChange('inherit');
                } else if (val === 'custom') {
                    const customFont = prompt('Enter font family name: (it must exist on your system, otherwise default will be loaded)', localStorage.getItem('slidysim_dph_script_font_family_custom') || 'Arial');
                    if (customFont) {
                        localStorage.setItem('slidysim_dph_script_font_family_custom', customFont);
                        if (storageKeyName) saveSettingValue(storageKeyName, customFont);
                        selectFont(customFont, true);
                        if (onChange) onChange(customFont);
                    }
                } else if (val) {
                    selectFont(val, false);
                    if (storageKeyName) saveSettingValue(storageKeyName, val);
                    if (onChange) onChange(val);
                }
            },
            restore: (val) => {
                let actualValue = val;
                if (actualValue === 'custom') {
                    const customFont = localStorage.getItem('slidysim_dph_script_font_family_custom');
                    if (customFont) {
                        actualValue = customFont;
                    }
                }
                if (actualValue === 'inherit' || actualValue === 'Default') {
                    selectFont('Default', false);
                    if (storageKeyName) saveSettingValue(storageKeyName, 'inherit');
                    if (onChange) onChange('inherit');
                } else if (actualValue) {
                    selectFont(actualValue, false);
                    if (storageKeyName) saveSettingValue(storageKeyName, actualValue);
                    if (onChange) onChange(actualValue);
                }
            }
        };
    }

    const fontFamilySetting = createFontCombobox({
        id: 'font-family',
        label: 'Font Family',
        defaultValue: DEFAULT_CONFIG.fontFamily,
        storageKey: STORAGE_KEYS.fontFamily,
        onChange: (val) => {
            applyFontFamily(val);
        }
    });
    settings.fontFamily = fontFamilySetting;

    const fontSizeSetting = createSetting({
        id: 'font-size',
        label: 'Font Size',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.fontSize,
        storageKey: STORAGE_KEYS.fontSize,
        unit: 'px',
        min: '10',
        max: '50',
        step: '1',
        onChange: (val) => applyFontSize(parseInt(val))
    });
    settings.fontSize = fontSizeSetting;

    const boldSetting = createSetting({
        id: 'bold',
        label: 'Bold',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.bold,
        storageKey: STORAGE_KEYS.bold,
        onChange: (val) => applyBold(val)
    });
    settings.bold = boldSetting;

    const borderRadiusSetting = createSetting({
        id: 'border-radius',
        label: 'Rounded Corners',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.borderRadius,
        storageKey: STORAGE_KEYS.borderRadius,
        unit: 'px',
        min: '0',
        max: '40',
        step: '1',
        onChange: (val) => applyBorderRadius(parseInt(val))
    });
    settings.borderRadius = borderRadiusSetting;

    const inactiveBrightnessSetting = createSetting({
        id: 'inactive-brightness',
        label: 'Grids Opacity',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.inactiveBrightness,
        storageKey: STORAGE_KEYS.inactiveBrightness,
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => applyInactiveBrightness(parseFloat(val))
    });
    settings.inactiveBrightness = inactiveBrightnessSetting;

    const base9Setting = createSetting({
        id: 'base9',
        label: 'Base 9 for 9x9',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.base9,
        storageKey: STORAGE_KEYS.base9,
        onChange: (val) => {
            if (val) {
                convertBase9();
            }
        }
    });
    settings.base9 = base9Setting;

    const soundEnableSetting = createSetting({
        id: 'sound-enable',
        label: 'Sound',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.soundEnabled,
        storageKey: STORAGE_KEYS.soundEnabled,
        onChange: (val) => {
            if (val) {
                initSound();
            }
        }
    });
    settings.soundEnable = soundEnableSetting;

    const soundVolumeSetting = createSetting({
        id: 'sound-volume',
        label: 'Move sounds',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.soundVolume,
        storageKey: STORAGE_KEYS.soundVolume,
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => {
            if (soundAudio) {
                soundAudio.volume = parseFloat(val);
            }
        }
    });
    settings.soundVolume = soundVolumeSetting;

    const soundDebounceSetting = createSetting({
        id: 'sound-debounce',
        label: 'Sound frequency',
        type: 'slider',
        defaultValue: DEFAULT_CONFIG.soundDebounce,
        storageKey: STORAGE_KEYS.soundDebounce,
        unit: 'ms',
        min: '0',
        max: '50',
        step: '1',
        onChange: (val) => {
            killSound();
            initSound();
        }
    });
    settings.soundDebounce = soundDebounceSetting;

    const hideTimerDuringSolvesSetting = createSetting({
        id: 'minimize-avgs',
        label: 'Hide timer during solves',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.hideTimerDuringSolves,
        storageKey: STORAGE_KEYS.hideTimerDuringSolves,
        onChange: (val) => { }
    });
    settings.hideTimerDuringSolves = hideTimerDuringSolvesSetting;

    const minimizeSessionsSetting = createSetting({
        id: 'minimize-sessions',
        label: 'Minimize sessions list',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.minimizeSessions,
        storageKey: STORAGE_KEYS.minimizeSessions,
        onChange: (val) => {
            if (val) {
                minimizeSessions();
            }
        }
    });
    settings.minimizeSessions = minimizeSessionsSetting;

    const hideHeaderDuringSolvesSetting = createSetting({
        id: 'hide-header-during-solves',
        label: 'Hide header during solves',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.hideHeaderDuringSolves,
        storageKey: STORAGE_KEYS.hideHeaderDuringSolves,
        onChange: (val) => { }
    });
    settings.hideHeaderDuringSolves = hideHeaderDuringSolvesSetting;

    const puzzleAlwaysInCenterSetting = createSetting({
        id: 'puzzle-always-in-center',
        label: 'Puzzle always in center',
        type: 'checkbox',
        defaultValue: DEFAULT_CONFIG.puzzleAlwaysInCenter,
        storageKey: STORAGE_KEYS.puzzleAlwaysInCenter,
        onChange: (val) => {
            if (val) {
                toggleCenterPosition();
            }
        }
    });
    settings.puzzleAlwaysInCenter = puzzleAlwaysInCenterSetting;

    const rawHardwareInputSetting = createSetting({
        id: 'raw-hardware-input',
        label: 'Raw Hardware Input',
        type: 'checkbox',
        checked: DEFAULT_CONFIG.rawHardwareInput,
        storageKey: STORAGE_KEYS.rawHardwareInput,
        onChange: (val) => {
            if (val) {
                overwriteInputs();
            } else {
                restoreInputs();
            }
        }
    });
    settings.rawHardwareInput = rawHardwareInputSetting;

    const statsGraphsSetting = createSetting({
        id: 'stats-graphs',
        label: 'Graphs (requires Stats module)',
        type: 'checkbox',
        checked: DEFAULT_CONFIG.statsGraphs,
        storageKey: STORAGE_KEYS.statsGraphs,
        onChange: (val) => {
            if (_statsModule?.toggleGraphs) {
                _statsModule.toggleGraphs(val);
            }
        }
    });
    settings.statsGraphs = statsGraphsSetting;

    const statsAveragesSetting = createSetting({
        id: 'stats-averages',
        label: 'Main Stats module (averages, session stats)',
        type: 'checkbox',
        checked: DEFAULT_CONFIG.statsAverages,
        storageKey: STORAGE_KEYS.statsAverages,
        onChange: (val) => {
            if (_statsModule?.toggleCalculator) {
                _statsModule.toggleCalculator(val);
            }
        }
    });
    settings.statsAverages = statsAveragesSetting;

    const statsReplaysSetting = createSetting({
        id: 'stats-replays',
        label: 'Integrated replays on click',
        type: 'checkbox',
        checked: DEFAULT_CONFIG.statsReplays,
        storageKey: STORAGE_KEYS.statsReplays,
        onChange: (val) => {
            if (_statsModule?.toggleOverlay) {
                _statsModule.toggleOverlay(val);
            }
        }
    });
    settings.statsReplays = statsReplaysSetting;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '❌ Reset settings';
    resetBtn.className = 'slidy-action-btn danger';

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ok = confirm('Reset all SlidySim settings to default?');
        if (ok) resetAllSettings();
    });

    function createGroup(title, elements) {
        const group = document.createElement('div');
        group.className = 'slidy-setting-group';

        if (title) {
            group.appendChild(createSectionLabel(title));
        }

        elements.forEach(el => {
            if (el) group.appendChild(el);
        });

        return group;
    }

    const bgGroup = createGroup('🖼️ Background settings', [
        uploadBtn,
        removeBtn,
        bgDimSetting.container,
        bgBlurSetting.container
    ]);

    const cursorGroup = createGroup('🖱️ Cursor settings', [
        cursorToolbar,
        cursorListContainer
    ]);
    cursorGroup.classList.add('cursor-settings-group');

    const opacityGroup = createGroup('🪟 Opacity settings', [
        uiOpacitySetting.container,
        puzzleDimSetting.container,
        inactiveBrightnessSetting.container,
        blankColorOpacitySetting.container,
        blankColorSetting.container
    ]);

    const hiddenPuzzlePosGroup = createGroup(null, [
        puzzleLeftSetting.container,
        puzzleTopSetting.container
    ]);
    hiddenPuzzlePosGroup.style.display = 'none';

    const borderGroup = createGroup('🔲 Border settings', [
        borderWidthSetting.container,
        gridsBorderWidthSetting.container,
        borderRadiusSetting.container
    ]);

    const fontGroup = createGroup('1️⃣ Font settings', [
        fontFamilySetting.container,
        fontSizeSetting.container,
        boldSetting.container
    ]);

    const soundGroup = createGroup('⚠️ Experimental settings (may cause lag)', [
        base9Setting.container,
        soundEnableSetting.container,
        soundVolumeSetting.container,
        soundDebounceSetting.container,
        rawHardwareInputSetting.container
    ]);

    const miscGroup = createGroup('🧩 Layout settings', [
        hideTimerDuringSolvesSetting.container,
        hideHeaderDuringSolvesSetting.container,
        puzzleAlwaysInCenterSetting.container,
        minimizeSessionsSetting.container,
    ]);

    const statsGroup = createGroup('📊 Stats settings', [
        statsAveragesSetting.container,
        statsGraphsSetting.container,
        statsReplaysSetting.container
    ]);

    const resetGroup = createGroup('♻️ Manage settings', [
        resetBtn,
        createSectionLabel('Tip: Press End key to reset or maximize puzzle size'),
        createSectionLabel('Tip: Press Alt+Enter for Zen mode while solving'),
        createSectionLabel('Tip: Press "A" or "C" to adjust puzzle position'),
    ]);

    dropdownMenu.append(
        bgGroup,
        cursorGroup,
        opacityGroup,
        hiddenPuzzlePosGroup,
        borderGroup,
        fontGroup,
        soundGroup,
        miscGroup,
        statsGroup,
        resetGroup
    );

    controls.appendChild(dropdownBtn);
    controls.appendChild(dropdownMenu);
    soundEnableSetting.container.style.display = 'none';

    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'grid' ? 'none' : 'grid';
    });

    document.addEventListener('click', (e) => {
        if (!controls.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    function toggleEditingMode(e) {
        e.stopPropagation();
        if (isEditingMode) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    }

    function centerPuzzle() {
        settings.puzzleLeft.setValue(0);
        settings.puzzleTop.setValue(0);
    }

    function getActivePuzzleContainer() {
        return puzzleContainer && puzzleContainer.isConnected
            ? puzzleContainer
            : document.querySelector('.puzzle-container');
    }

    function getCurrentPuzzleOffset(puzzle) {
        const styles = getComputedStyle(puzzle);
        const left = parseFloat(styles.left);
        const top = parseFloat(styles.top);

        return {
            left: isNaN(left) ? currentConfig.puzzleLeft : left,
            top: isNaN(top) ? currentConfig.puzzleTop : top
        };
    }

    function getPuzzleTopLeftOffset() {
        const focusArea = document.querySelector('.focus-area');
        const puzzle = getActivePuzzleContainer();
        if (!focusArea || !puzzle) {
            return { left: 0, top: 0 };
        }

        const focusRect = focusArea.getBoundingClientRect();
        const puzzleRect = puzzle.getBoundingClientRect();
        const currentOffset = getCurrentPuzzleOffset(puzzle);

        return {
            left: Math.ceil(currentOffset.left + focusRect.left - puzzleRect.left),
            top: Math.ceil(currentOffset.top + focusRect.top - puzzleRect.top)
        };
    }

    function movePuzzleToTopLeft() {
        const focusContainer = document.querySelector('.focus-area');
        if (!focusContainer) return;

        const candidateOffset = getPuzzleTopLeftOffset();
        const topLeftOffset = clampPuzzlePosition(candidateOffset.left, candidateOffset.top);
        settings.puzzleLeft.setValue(topLeftOffset.left, { store: true, notify: false });
        settings.puzzleTop.setValue(topLeftOffset.top, { store: true, notify: false });
        focusContainer.setAttribute('puzzle-position', 'center');
        applyPuzzlePosition();
    }

    function enterEditMode() {
        const puzzleContainer = document.querySelector('.puzzle-container');
        if (!puzzleContainer) return;
        const focusArea = document.querySelector('.focus-area');
        if (focusArea) {
            focusArea.setAttribute('puzzle-position', 'center');
        }
        setTimeout(() => {
            if (focusArea) {
                focusArea.focus();
            }
        }, 10);
        dragHandle = document.createElement('div');
        dragHandle.className = 'slidy-drag-handle';
        dragHandle.innerHTML = '<span style="font-size:50px;">✥</span>';
        puzzleContainer.appendChild(dragHandle);

        puzzleContainer.style.position = 'relative';
        puzzleContainer.style.zIndex = '10';

        dragHandle.addEventListener('mousedown', onDragStart);
        dragHandle.addEventListener('touchstart', onDragStart, { passive: false });

        isEditingMode = true;
        adjustButton.textContent = '✅ Done';

    }

    function exitEditMode() {
        if (pendingLeft !== null && pendingTop !== null && puzzleContainer) {
            const clampedPosition = clampPuzzlePosition(pendingLeft, pendingTop);
            settings.puzzleLeft.setValue(clampedPosition.left, { store: true, notify: false });
            settings.puzzleTop.setValue(clampedPosition.top, { store: true, notify: false });
            puzzleContainer.style.left = clampedPosition.left + 'px';
            puzzleContainer.style.top = clampedPosition.top + 'px';
            root.style.setProperty('--puzzle-left', `${clampedPosition.left}px`);
            root.style.setProperty('--puzzle-top', `${clampedPosition.top}px`);
            pendingLeft = null;
            pendingTop = null;
        }
        if (dragHandle) {
            dragHandle.removeEventListener('mousedown', onDragStart);
            dragHandle.removeEventListener('touchstart', onDragStart);
            dragHandle.parentNode.removeChild(dragHandle);
            dragHandle = null;
        }
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);

        isEditingMode = false;
        adjustButton.textContent = '✥ Adjust';
    }

    let startX, startY, startLeft, startTop;
    let puzzleContainer = null;

    function onDragStart(e) {
        e.preventDefault();

        if (!puzzleContainer) {
            puzzleContainer = document.querySelector('.puzzle-container');
        }
        if (!puzzleContainer) return;

        startX = e.touches ? e.touches[0].clientX : e.clientX;
        startY = e.touches ? e.touches[0].clientY : e.clientY;

        startLeft = currentConfig.puzzleLeft;
        startTop = currentConfig.puzzleTop;

        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
    }

    let pendingLeft = null, pendingTop = null;
    let updateScheduled = false;

    function clampPuzzlePosition(left, top) {
        const { left: minLeft, top: minTop } = getPuzzleTopLeftOffset();

        return {
            left: Math.max(minLeft, left),
            top: Math.max(minTop, top)
        };
    }

    function scheduleUpdate() {
        if (updateScheduled) return;
        updateScheduled = true;
        requestAnimationFrame(() => {
            if (pendingLeft !== null && pendingTop !== null && puzzleContainer) {
                const clampedPosition = clampPuzzlePosition(pendingLeft, pendingTop);
                puzzleContainer.style.left = clampedPosition.left + 'px';
                puzzleContainer.style.top = clampedPosition.top + 'px';
                settings.puzzleLeft.setValue(clampedPosition.left, { store: true, notify: false });
                settings.puzzleTop.setValue(clampedPosition.top, { store: true, notify: false });
                root.style.setProperty('--puzzle-left', `${clampedPosition.left}px`);
                root.style.setProperty('--puzzle-top', `${clampedPosition.top}px`);
            }
            updateScheduled = false;
        });
    }

    function onDragMove(e) {
        e.preventDefault();
        if (!isEditingMode || !dragHandle) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        let newLeft = Math.round(startLeft + deltaX);
        let newTop = Math.round(startTop + deltaY);

        const clampedPosition = clampPuzzlePosition(newLeft, newTop);
        newLeft = clampedPosition.left;
        newTop = clampedPosition.top;

        pendingLeft = newLeft;
        pendingTop = newTop;
        scheduleUpdate();
    }

    function onDragEnd(e) {
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
    }

    function insertControls() {
        hideLogoutButton();
        const header = document.querySelector('.header');

        const button = createSeeStatsButton();
        const filler = header.querySelector('.filler');

        const betterLBButton = document.createElement('button');
        betterLBButton.textContent = 'Better LB';
        betterLBButton.style.whiteSpace = 'nowrap';
        betterLBButton.className = 'tab';
        betterLBButton.style.color = 'rgb(100, 255, 255)';
        betterLBButton.addEventListener('click', openLeaderboard);

        adjustButton = document.createElement('button');
        adjustButton.textContent = '✥ Adjust';
        adjustButton.id = 'adjust-puzzle-button';
        adjustButton.className = 'slidy-see-stats-btn';
        adjustButton.style.display = 'none';
        adjustButton.addEventListener('click', toggleEditingMode);

        toggleCenterButton = document.createElement('button');
        toggleCenterButton.textContent = '➕ Center';
        toggleCenterButton.id = 'toggle-center-button';
        toggleCenterButton.className = 'slidy-see-stats-btn';
        toggleCenterButton.style.display = 'none';
        toggleCenterButton.addEventListener('click', toggleCenterPosition);

        const versionSpan = document.createElement('span');
        versionSpan.textContent = `script v${GM_info.script.version}`;
        versionSpan.className = 'slidy-version-span';
        if (filler) {
            filler.parentNode.insertBefore(betterLBButton, filler);
            filler.parentNode.insertBefore(controls, filler);
            filler.parentNode.insertBefore(button, filler);
            filler.parentNode.insertBefore(adjustButton, filler);
            filler.parentNode.insertBefore(toggleCenterButton, filler);
            filler.parentNode.insertBefore(versionSpan, filler);
        } else {
            header.appendChild(betterLBButton);
            header.appendChild(controls);
            header.appendChild(button);
            header.appendChild(adjustButton);
            header.appendChild(toggleCenterButton);
            header.appendChild(versionSpan);
        }
    }

    function openLeaderboard() {
        const container = document.getElementById('main-content-container');
        if (!container) return;
        container.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = 'https://slidysim.github.io/lb';
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.title = 'Slidysim Leaderboard';
        container.appendChild(iframe);
    }

    function toggleCenterPosition() {
        if (isEditingMode) {
            exitEditMode();
        }
        const focusContainer = document.querySelector('.focus-area');
        if (!focusContainer) return;
        positionApplied = true;

        settings.puzzleLeft.setValue(0);
        settings.puzzleTop.setValue(0);
        focusContainer.setAttribute('puzzle-position', 'center');
        applyPuzzlePosition();
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'slidy-file-input';

    const cursorFileInput = document.createElement('input');
    cursorFileInput.type = 'file';
    cursorFileInput.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/svg+xml,.cur,image/x-icon,image/vnd.microsoft.icon';
    cursorFileInput.className = 'slidy-cursor-file-input';

    function applyCustomCursor(blobUrl) {
        const existingStyle = document.getElementById('custom-cursor-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        if (!blobUrl) {
            return;
        }

        const MAX_SIZE = 128;
        const cursorImg = new Image();

        cursorImg.onload = function () {
            const originalWidth = cursorImg.width;
            const originalHeight = cursorImg.height;

            if (originalWidth <= MAX_SIZE && originalHeight <= MAX_SIZE) {
                createCursorStyle(blobUrl, originalWidth, originalHeight);
                return;
            }

            const ratio = Math.min(MAX_SIZE / originalWidth, MAX_SIZE / originalHeight);
            const scaledWidth = Math.round(originalWidth * ratio);
            const scaledHeight = Math.round(originalHeight * ratio);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.drawImage(cursorImg, 0, 0, scaledWidth, scaledHeight);

            const scaledUrl = canvas.toDataURL('image/png');
            createCursorStyle(scaledUrl, scaledWidth, scaledHeight);
        };

        function createCursorStyle(url, width, height) {
            const hotspotX = Math.round(width / 2);
            const hotspotY = Math.round(height / 2);

            const style = document.createElement('style');
            style.id = 'custom-cursor-style';
            style.textContent = `
                .focus-area {
                    cursor: url('${url}') ${hotspotX} ${hotspotY}, auto;
                }
            `;
            document.head.appendChild(style);
        }

        cursorImg.onerror = function () {
            console.error("Failed to preload cursor image");
        };

        cursorImg.src = blobUrl;
    }

    function toggleCustomCursor(enabled) {
        if (enabled && currentCursorBlobUrl) {
            applyCustomCursor(currentCursorBlobUrl);
            document.body.classList.add('custom-cursor');
        } else {
            document.body.classList.remove('custom-cursor');
            const existingStyle = document.getElementById('custom-cursor-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            document.documentElement.style.cursor = 'auto';
        }
    }

    function applyBackground(blobUrl, dimAmount) {
        const mainContainer = document.querySelector('.main-content-container');
        if (mainContainer && blobUrl) {
            const dim = dimAmount !== undefined ? dimAmount : parseFloat(settings.bgDim.getValue());
            const blur = settings.bgBlur ? parseFloat(settings.bgBlur.getValue()) : currentConfig.bgBlur;

            let blurStyleEl = document.getElementById('slidy-blur-bg-style');
            if (!blurStyleEl) {
                blurStyleEl = document.createElement('style');
                blurStyleEl.id = 'slidy-blur-bg-style';
                document.head.appendChild(blurStyleEl);
            }

            const filters = [];
            if (blur > 0) filters.push(`blur(${blur}px)`);
            filters.push(`brightness(${dim})`);
            const filterString = filters.join(' ');

            blurStyleEl.textContent = `
                .main-content-container::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: url('${blobUrl}') center center / cover no-repeat fixed;
                    filter: ${filterString};
                    z-index: -1000;
                }
            `;

            mainContainer.style.position = 'relative';
            mainContainer.style.background = 'none';
        }
        const hasBg = !!blobUrl;
        settings.bgDim.container.style.display = 'flex';
        settings.puzzleDim.container.style.display = 'flex';
        settings.uiOpacity.container.style.display = 'flex';
        removeBtn.style.display = hasBg ? 'block' : 'none';
    }

    function removeBackground() {
        const mainContainer = document.querySelector('.main-content-container');
        if (mainContainer) {
            mainContainer.style.background = '';
            mainContainer.style.backgroundSize = '';
            mainContainer.style.backgroundPosition = '';
            mainContainer.style.backgroundRepeat = '';
            mainContainer.style.backgroundAttachment = '';
            mainContainer.style.position = '';
        }
        const blurStyleEl = document.getElementById('slidy-blur-bg-style');
        if (blurStyleEl) {
            blurStyleEl.remove();
        }
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
        deleteFromDB().catch(err => console.error('Failed to delete from DB:', err));
        removeBtn.style.display = 'none';
    }

    function applyPuzzleDim(dimAmount) {
        if (dimAmount) {
            root.style.setProperty('--puzzle-dim', dimAmount);
        } else {
            root.style.removeProperty('--puzzle-dim');
        }
    }

    function applyBlankColor() {
        const opacity = currentConfig.blankColorOpacity;
        const color = currentConfig.blankColor;

        root.style.setProperty('--blank-color', color);
        root.style.setProperty('--blank-color-opacity', opacity);
    }

    function applyUIOpacity(opacity) {
        if (opacity) {
            root.style.setProperty('--ui-opacity', opacity);
        } else {
            root.style.removeProperty('--ui-opacity');
        }
    }

    function addHorizontalScroll() {
        const container = document.querySelector('.focus-container');
        if (!container) return;
        if (!container.dataset.wheelListener) {
            container.addEventListener('wheel', (e) => {
                const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
                const hasVerticalScroll = container.scrollHeight > container.clientHeight;

                if (hasHorizontalScroll && (!hasVerticalScroll || e.altKey)) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY;
                }
            }, { passive: false });

            container.dataset.wheelListener = 'true';
        }
    }

    function overwriteInputs() {
        const element = document.querySelector('.focus-area');
        if (!element) return;
        const listener = __listenerStore.get(element);
        if (!listener) return;
        element.removeEventListener('mousemove', listener, false);
        element.addEventListener('pointerrawupdate', listener, false);
    }

    function restoreInputs() {
        const element = document.querySelector('.focus-area');
        if (!element) return;
        const listener = __listenerStore.get(element);
        if (!listener) return;
        element.removeEventListener('pointerrawupdate', listener, false);
        element.addEventListener('mousemove', listener, false);
    }

    function applyPuzzlePosition() {
        const focusContainer = document.querySelector('.focus-area');
        if (!focusContainer) {
            positionApplied = false;
            return;
        }
        focusContainer.setAttribute('puzzle-position', 'center');

        const clampedPosition = clampPuzzlePosition(currentConfig.puzzleLeft, currentConfig.puzzleTop);
        if (clampedPosition.left !== currentConfig.puzzleLeft) {
            settings.puzzleLeft.setValue(clampedPosition.left, { store: true, notify: false });
        }
        if (clampedPosition.top !== currentConfig.puzzleTop) {
            settings.puzzleTop.setValue(clampedPosition.top, { store: true, notify: false });
        }

        root.style.setProperty('--puzzle-left', `${clampedPosition.left}px`);
        root.style.setProperty('--puzzle-top', `${clampedPosition.top}px`);
        positionApplied = true;
    }

    function applyBorder(width, color) {
        if (width > 0) {
            root.style.setProperty('--border-width-puzzle', `${width}px`);
            root.style.setProperty('--border-color-puzzle', color);
        } else {
            root.style.removeProperty('--border-width-puzzle');
            root.style.removeProperty('--border-color-puzzle');
        }
    }

    function applyGridsBorder(width, color) {
        const subscheme = document.querySelector('.piece .subscheme');
        if (!subscheme) return;

        const bg = getComputedStyle(subscheme).backgroundColor;
        const hasBackground = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';

        if (width > 0 && hasBackground) {
            root.style.setProperty('--border-width-grids', `${width}px`);
            root.style.setProperty('--border-color-grids', color);
        } else {
            root.style.removeProperty('--border-width-grids');
            root.style.removeProperty('--border-color-grids');
        }
    }

    function applyFontFamily(family) {
        root.style.setProperty('--puzzle-font-family', `"${family}", sans-serif`);
    }

    function applyFontSize(size) {
        root.style.setProperty('--puzzle-font-size', `${size}px`);
    }

    function applyBorderRadius(radius) {
        root.style.setProperty('--puzzle-border-radius', `${radius}px`);
    }

    function applyBold(isBold) {
        root.style.setProperty('--puzzle-font-bold', isBold ? 'bold' : 'normal');
    }

    function applyInactiveBrightness(brightness) {
        root.style.setProperty('--puzzle-inactive-brightness', brightness);
    }

    function toBase9(num) {
        if (num === 0) return '0';
        let result = '';
        while (num > 0) {
            result = (num % 9) + result;
            num = Math.floor(num / 9);
        }
        return result;
    }

    function shouldConvertBase9(texts) {
        return Array.from(texts).some(el => el.textContent.trim() === '9');
    }

    function convertBase9() {
        const puzzle = document.querySelector('.puzzle');
        if (!puzzle) return;
        const pieces = puzzle.querySelectorAll('.piece');
        if (pieces.length !== 81) return;
        const texts = puzzle.querySelectorAll('.piece .text');
        if (!texts.length) return;
        if (!shouldConvertBase9(texts)) return;
        texts.forEach(el => {
            const raw = el.textContent.trim();
            if (!/^\d+$/.test(raw)) return;
            const num = parseInt(raw, 10);
            el.textContent = toBase9(num);
        });
    }

    let soundAudio = null;
    let soundObserver = null;

    function killSound() {
        const puzzle = document.querySelector('.puzzle');

        if (puzzle && puzzle._soundObserver) {
            puzzle._soundObserver.disconnect();
            puzzle._soundObserver = null;
        }
    }

    function initSound() {
        const puzzle = document.querySelector('.puzzle');
        const volume = currentConfig.soundVolume;
        const soundDebounceTime = currentConfig.soundDebounce;

        if (!puzzle || (volume < 0.02)) {
            return;
        }

        if (!soundAudio) {
            soundAudio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjE0LjEwMAAAAAAAAAAAAAAA//PgwAAAAAAAAAAAAEluZm8AAAAPAAAABAAACjQAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/////////////////////////////////AAAAAExhdmM1Ny4xNQAAAAAAAAAAAAAAACQAAAAAAAAAAAo0qhTsdwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//PgxABuBBYkAVrQAFiMsnVpgkCYUSYkOnEYYobNma06VhTCGDTLjaNDYJB46aFuejMdyELPDIrzgyzmyzgsSJUaBwevWeOaa0ODDBrHBvnhtFA8kMilOdQOZANUSSJMWZNClNGdBx8GDDVrzWozLh1XpUAAAWgWo6ZZwwAIwQAuw6pe8wYMvWsgxI0x40xYcDB1rtwQkIoMsiSmAIAGEDGGCAYIpYtswokzRgyw4OCIIzGlTOnzOlxomYIobVybdeaEijGCBBkjBmiwQUC4c0Sg1SYzxYxgBmoNAmHDgoW6wNAmFDmHEmHCgYOteCEvEHC46dcBIJCyhZBAA7pasxgwxQYvQ8JdcwIMBA1fpoGHEmJClv3zYAhIQcZIyMsoAgBcRgkEpfoB1rtwAIEwYEs2mHDychchSxu4EAGAAFtEUGWUsNu2ztlkEoJyyZdt81yKCOJHGGJCIBEHFNIEdNIcswgpCVKy2ZadAG9yPBhQphQKG8PJyFsC2i9FKzDCDDAi7DqRNrbX3fjc5NtbWHYnF7kYlmVSUUmMNuXI3ATHXXLmsLCLEa5StbRUUEdSPsrVOxORLkLTlt065EwAu4W0VgVXDBYBKBlI0YcJmQjJKCjo0MmBhAKEAJzQOaGKhzuaEQmPk5MQpgmflppiObIMG2hhmoWZ0Hi5qZKxGRwxsaUZNQGMlJUQ//PixEV+7BZUAZvYAEzORB+4d0cGcLICpTLUo0wBB0IOlgdHBswcalm1mB7rwZOmGniBjiCBBcCgBc0wgQAg2CB4zAzMaETDgU2IsNvZQwBXcrCFQJHcxAEGBAwkRARctQWRAdECIFFTkwkkBJ+Z7CGTNZih+yxuoWARQBDAFVJmRihCZWNGGkANGAqbmEgoCHTICoxoFA1IPB5nQEaWNmeGhnh+cGXALdNQTWJOMmEDAsOBX7BAKOiTWjDQRdYoGFk0MTDQEMRA4OLbEgMXBSiFhEdXDE0syQRFggaNzDR4x8NNKUDJi40URNYKjPBABd6wyQzdmJQG7ZgQKggLvQGIwousy8LBA4BmGhwOCXnS9UEMcETARZKcKAQXB1eCAJUXEhI24MN8RzaUI0APM+QzIzoKFJlCeYSmEKeQk5AWGBkpYIRgKAoaOhAhAGVjoBLmcvZUXyy1eLNXhguiVRLfDIMCANWMDFDviQqt8IA05kfVXBYEjahAFA5CtpOkeKi5KZxCHiAIEIQnWwNXDKwwuBIwYICpJmGgAUBU6hUKMPAiIAQGJVqzOU11lTkxrB/WstJjhd569T+LIYo6TSkxmJIQAQzvYszo14wsJw4DwZuyORz4tJtpRJ4nAxn6exgADoUAs1aAQ7zDcxoPcVe4WBEwFBo+0DDCKkNDiI4U/TKqUEZrMAhQSP/z4MRHclQWICOd4AAGugw4ETGgAMEIowkXTKgGMWjdlMoUNDhSYPC5jIUNfMdhwx8OzDJkAI8YDDkvhoyqeTKYTBw8FRQYlExlsiGMRopQXHCwwt3JVdbkYCFqfQ8ciIJGGACMC0EjMw8GTA4OBARMFCEYFxhshmOSVDVPJKWVMxcExqCTDoZBQEFkUYYExgcGkAKMHAZkgKExgsEAEGEoHIRUEAEZAJWEDAgFlk3l8qiVePVhgGr7BoDLtmFw2EC4gBxVBhgUKiAHFoUbSEFoZAwJhYFgoAGAQKWua4CgUtYwMExAGFuIxZ4VdR2U4TO+SqVZl9AgYI3tiXcAggIwIBg8BQM7zUEnFYzAwFZCCgSmYtVAEFAKFgOgMCoBW8iKhsBQIreVAIzBS9FCarb1jqZpcKHf5VtzSPseMEAIVBiA0HBpPgtmDQGYOApggGozhgCKwKuVu7dmeIqrpcVFFCUsCkamgXXWsxVWItUompg0RQdIBOlFZgKNqqiPdbPWOqtXC7v8q25qtnc39WpogCmOJmOCqkMKQMuUCCwiDmSKoHFzS3rcAKEMOEMGAMKIEg5mYB39R44xmQZurp6s50FI4eN/WP788qTgVIgDHYOOADVAxc5HwqKcmp5Rhxhq1HrkcphYLNyk1UAUMkU054VStqmkgOFQjTYNcxOMwDzUVBTIqMaKCv/z4sR6auQVKAPayACAwzDLAXeYRpoHgo1mAFIMY0zjzKFVoBohlkBgwoCZQ6lZlJmgOrgwzjVSBSyTpjHmGAj8u53qF2ZCyJayCIyzjNEWuACTONCCUORklJIqVJhQGX9Lap0xBKoGAmEGCgW8L3GCAjkmSAgWvggMFAuQDQDFCQHLZAgKKTjRqXWt4MqZsX2Ms4zQlrgAs0Dwg0ZAMsxLlG5BZ2y6pZlK2IIZFqTABLWuoXuLJJ9JGgIFlZgEgI1lgFEMkgMCUVMAVBaT2a1NTSprTzJHGKQAjmTggUyBw4FHYxRG9UyU2i6tqKrBZQuZTFMVdMgZUqZ1mQpgtjLOlrXUL3Fkkrmil3VjUeOVNTUztQemkYIQGCb8vaYAKOKhxZJ1C1Ra5xy9pZFDWAEExd0uSii9rAkVmTL5QdpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=');
            soundAudio.volume = volume;
            soundAudio.preload = 'auto';
            soundAudio.load();
        }

        if (puzzle._soundObserver) {
            return;
        }

        let lastPlay = 0;
        const observer = new MutationObserver(() => {
            if (soundAudio.volume < 0.02) {
                observer.disconnect();
                puzzle._soundObserver = null;
                return;
            }
            const now = performance.now();
            if (now - lastPlay < soundDebounceTime) return;
            lastPlay = now;

            const clone = soundAudio.cloneNode();
            clone.volume = soundAudio.volume;
            clone.play().catch(() => { });
        });

        observer.observe(puzzle, {
            attributes: true,
            subtree: true,
            attributeFilter: ['style']
        });

        puzzle._soundObserver = observer;

    }

    function replaceText() {
        const container = document.querySelector('.stats-grid-container');
        if (!container) return;
        const standardStatsPanel = document.querySelector('.standard-stats-panel');
        const fmcStatsPanel = document.querySelector('.fewest-moves-stats-panel');
        const isFMC = !!fmcStatsPanel;
        if (!standardStatsPanel && !fmcStatsPanel) return;
        const hideTimer = currentConfig.hideTimerDuringSolves;
        container.classList.remove('rounded');
        const hideHeaderDuringSolves = currentConfig.hideHeaderDuringSolves;
        container.classList.remove('right-hack');
        if (isZenMode || (hideHeaderDuringSolves && scrambled)) {
            container.classList.add('right-hack');
        }
        const thRow = container.querySelector('tr:has(th)');
        if (thRow) thRow.remove();
        const headers = container.querySelectorAll('td[column="header"]');
        headers.forEach(header => {
            let text = header.textContent;
            if (text.includes('Session average')) {
                text = text.replace(/Session average \((\d+) solves\)/i, 'ao$1');
            }
            text = text.replace(/Average of (\d+)/i, 'ao$1');
            header.textContent = text;
        });

        container.querySelectorAll('tr[avg]').forEach(row => {
            const avg = row.getAttribute('avg');
            if (scrambled || isZenMode) {
                row.style.display = avg === '1' ? '' : 'none';
                const tds = container.querySelectorAll('tr[avg="1"] td');
                const originalText = tds[0].textContent;
                const textWithoutSingle = originalText.replace("Single", '');
                if (textWithoutSingle.trim() === '') {
                    tds[0].style.display = 'none';
                } else {
                    tds[0].style.display = '';
                }
                if (scrambled && !isFMC) {
                    tds[1].textContent = '';
                    tds[2].textContent = 'Ready';
                    tds[3].textContent = '';
                    tds[1].style.color = 'yellow';
                    tds[2].style.color = 'yellow';
                    tds[3].style.color = 'yellow';
                } else {
                    // tds[1].style.color = 'white';
                    // tds[2].style.color = 'white';
                    // tds[3].style.color = 'white';
                }
                if (hideTimer) {
                    tds[1].style.display = 'none';
                    tds[2].style.display = 'none';
                    tds[3].style.display = 'none';
                }
            } else {
                container.querySelectorAll('tr[avg="1"] td').forEach(td => {
                    td.style.display = '';
                });
                if (avg === 'session' || avg === '1') return;
                const shouldHide = [...row.querySelectorAll('td')].some(cell => {
                    const text = cell.textContent.trim();
                    return text === 'DNF' || (text === '' && cell.getAttribute('column') !== 'header');
                });
                row.style.display = shouldHide ? 'none' : '';
            }
        });
    }

    function minimizeSessions() {
        const guardSessionInfo = document.querySelector('.session-info');
        if (!guardSessionInfo) return;
        if (guardSessionInfo.getAttribute('data-slidy-sessions-minimized') === 'true') return;
        guardSessionInfo.setAttribute('data-slidy-sessions-minimized', 'true');

        const sessionBackgrounds = document.querySelectorAll('.session-background-inner');
        const visibleSessions = [];
        let maxDivCount = 0;

        swapSessionElements();

        sessionBackgrounds.forEach(bg => {
            const sessionName = bg.querySelector('.session-name');

            if (sessionName && ['delete', 'remove', 'hide', 'hidden'].includes(
                sessionName.textContent.trim().toLowerCase()
            )) {
                bg.parentNode.parentNode.parentNode.parentNode.style.display = 'none';
                return;
            }

            const sessionInfo = bg.querySelector('.session-info');
            if (!sessionInfo) return;

            const sessionContainer = bg.parentNode.parentNode.parentNode;
            const tooltipContainer = sessionContainer.querySelector('.session-info-tooltip');
            if (tooltipContainer) {
                const tooltipDivs = tooltipContainer.querySelectorAll('div');
                tooltipDivs.forEach(tipDiv => {
                    let text = tipDiv.textContent.trim();
                    text = text.replace(/Showing optimal length /g, '').replace(/[\(\)\[\]\{\}]/g, '');
                    const newDiv = document.createElement('div');
                    newDiv.textContent = text || '\u00A0';
                    sessionInfo.appendChild(newDiv);
                });
                tooltipContainer.remove();
            }

            const divs = Array.from(sessionInfo.querySelectorAll('div'));
            divs.forEach(div => {
                let text = div.textContent.trim();
                // Apply all text modifications
                if (text === 'Standard' || text === 'Mouse hover (Lines)') {
                    div.remove();
                    return;
                }
                if (text === 'Fewest moves') {
                    div.textContent = 'FMC';
                    return;
                }
                if (text.includes('width+height relay')) {
                    text = text.replace(/width\+height relay/g, 'EUT');
                }
                if (text.includes('2x2-')) {
                    text = text.replace(/2x2-/g, '');
                }
                if (text.includes(' marathon')) {
                    text = text.replace(/ marathon/g, '');
                }
                if (text.includes(' solves')) {
                    text = text.replace(/ solves/g, ' attempts');
                }
                if (text.trim() === '') {
                    div.remove();
                } else {
                    div.textContent = text;
                }
            });

            const remainingDivs = Array.from(sessionInfo.querySelectorAll('div'));
            if (remainingDivs.length > 0 && sessionName) {
                const sessionNameText = sessionName.textContent.trim();
                remainingDivs.forEach(div => {
                    const divText = div.textContent.trim();
                    if (divText !== '' && sessionNameText.toLowerCase().includes(divText.toLowerCase())) {
                        div.remove();
                    }
                });
            }

            const finalDivCount = sessionInfo.querySelectorAll('div').length;
            if (finalDivCount > maxDivCount) maxDivCount = finalDivCount;
            visibleSessions.push(sessionInfo);
        });

        visibleSessions.forEach(sessionInfo => {
            const allDivs = Array.from(sessionInfo.querySelectorAll('div'));
            const currentCount = allDivs.length;
            const emptyNeeded = maxDivCount - currentCount;

            if (emptyNeeded > 0) {
                const emptyBefore = Math.floor(emptyNeeded / 2);
                const emptyAfter = emptyNeeded - emptyBefore;

                for (let i = 0; i < emptyBefore; i++) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.textContent = '\u00A0';
                    sessionInfo.insertBefore(emptyDiv, sessionInfo.firstChild);
                }
                for (let i = 0; i < emptyAfter; i++) {
                    const emptyDiv = document.createElement('div');
                    emptyDiv.textContent = '\u00A0';
                    sessionInfo.appendChild(emptyDiv);
                }
            } else if (currentCount === maxDivCount) {
                const nonEmptyDivs = allDivs.filter(div => {
                    const t = div.textContent.trim();
                    return t !== '' && t !== '\u00A0';
                });

                if (nonEmptyDivs.length > 0 && nonEmptyDivs.length < maxDivCount) {
                    const firstIdx = allDivs.indexOf(nonEmptyDivs[0]);
                    const lastIdx = allDivs.indexOf(nonEmptyDivs[nonEmptyDivs.length - 1]);
                    const emptyAbove = firstIdx;
                    const emptyBelow = maxDivCount - 1 - lastIdx;
                    const totalEmpty = emptyAbove + emptyBelow;
                    const targetEmptyAbove = Math.floor(totalEmpty / 2);
                    const divsToMove = emptyAbove - targetEmptyAbove;

                    if (divsToMove > 0) {
                        for (let i = 0; i < divsToMove; i++) {
                            const first = sessionInfo.firstChild;
                            if (first && first.textContent.trim() === '') {
                                sessionInfo.appendChild(first);
                            } else {
                                break;
                            }
                        }
                    } else if (divsToMove < 0) {
                        for (let i = 0; i < Math.abs(divsToMove); i++) {
                            const last = sessionInfo.lastChild;
                            if (last && last.textContent.trim() === '') {
                                sessionInfo.insertBefore(last, sessionInfo.firstChild);
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        });
    }

    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeBackground();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
            await saveToDB(file);
            currentBlobUrl = URL.createObjectURL(file);
            const currentDim = currentConfig.bgDim;
            applyBackground(currentBlobUrl, currentDim);
        } catch (error) {
            console.error('Failed to save background:', error);
            alert('Failed to save background. The file might be too large.');
        }
    });

    cursorUploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cursorFileInput.click();
    });

    cursorFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const id = `cursor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            const entry = await saveCursorEntryToDB(file, id, file.name || 'Custom cursor');
            createCursorObjectURL(entry);
            ensureCursorMetadata(entry);
            cursorEntries.push(entry);
            setSelectedCursorId(entry.id);
            currentCursorBlobUrl = entry.url;
            applyCustomCursor(currentCursorBlobUrl);
            cursorFileInput.value = '';
        } catch (error) {
            console.error('Failed to save cursor:', error);
            alert('Failed to save cursor. The file might be too large.');
        }
    });

    async function init() {
        try {
            await openDB();
            await openCursorDB();
            await restoreSettings();
            mainObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }
    function createSeeStatsButton() {
        const button = document.createElement('button');
        button.textContent = '📊';
        button.id = 'see-stats-button';
        button.className = 'slidy-see-stats-btn';

        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(250,250,250,0.8)';
            button.style.color = 'black';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(60,60,60,0.8)';
            button.style.color = 'white';
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isStatsTable = document.querySelector('.session-statistics-table');
            if (isStatsTable) {

                const focusTarget = document.body;
                focusTarget.focus();

                setTimeout(() => {
                    ['keydown', 'keyup'].forEach(eventType => {
                        const event = new KeyboardEvent(eventType, {
                            key: 'ArrowLeft',
                            code: 'ArrowLeft',
                            keyCode: 37,
                            which: 37,
                            bubbles: true,
                            cancelable: true
                        });
                        focusTarget.dispatchEvent(event);
                        document.dispatchEvent(event);
                    });
                }, 50);

                return;
            }

            const focusContainer = document.querySelector('.focus-area');
            const target = focusContainer || document;

            if (focusContainer) {
                focusContainer.focus();
            }

            setTimeout(() => {
                ['keydown', 'keyup'].forEach(eventType => {
                    const event = new KeyboardEvent(eventType, {
                        key: 'q',
                        code: 'KeyQ',
                        keyCode: 81,
                        which: 81,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(event);
                });
            }, focusContainer ? 50 : 0);
        });

        return button;
    }

    function updateButtonVisibility() {
        if (!document.querySelector('.slidy-controls')) {
            insertControls();
        }
        const button = document.getElementById('see-stats-button');
        if (!button) return;

        const hasPuzzle = document.querySelectorAll('.puzzle').length > 0;
        const hasStatsTable = document.querySelector('.session-statistics-table');

        if (hasPuzzle) {
            button.textContent = '📊';
            button.style.display = 'block';
        } else if (hasStatsTable) {
            button.textContent = '⬅️ Back';
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }

        if (adjustButton) {
            adjustButton.style.display = hasPuzzle ? 'block' : 'none';
        }
        if (toggleCenterButton) {
            toggleCenterButton.style.display = hasPuzzle ? 'block' : 'none';
        }
    }

    function detectPuzzleState(mutations) {
        let sawStatsUpdate = false;
        let puzzleChanged = false;

        for (const m of mutations) {
            const target = m.target;

            if (m.type === 'childList' && target.nodeName?.toLowerCase() === 'td') {
                for (const node of m.addedNodes) {
                    const text = node.textContent || '';

                    if (text.includes('Session')) {
                        sawStatsUpdate = true;
                    }
                }
            }

            if (m.type === 'childList' && target.classList?.contains('puzzle')) {
                puzzleChanged = true;
            }
        }

        if (sawStatsUpdate) {
            return "finished";
        }

        if (puzzleChanged) {
            const puzzleMatrix = parsePuzzleToNumberMatrix();
            if (puzzleIsSolved(puzzleMatrix)) {
                return "probably reset spam";
            } else {
                return "scrambled";
            }
        }

        return "unknown";
    }

    const logMutationDetails = (mutations) => {
        console.clear();
        mutations.forEach((m, i) => {
            console.group(`🔍 Mutation ${i + 1}: ${m.type}`);

            // Target info
            if (m.target.nodeType === 1) { // Element node
                console.log(`📍 Target element: <${m.target.tagName.toLowerCase()}${m.target.id ? ` id="${m.target.id}"` : ''}${m.target.className ? ` class="${m.target.className}"` : ''}>`);
                console.log(`📦 Target outerHTML:`, m.target.outerHTML);
            } else if (m.target.nodeType === 3) { // Text node
                console.log(`📍 Target text node inside: <${m.target.parentElement?.tagName.toLowerCase()}${m.target.parentElement?.id ? ` id="${m.target.parentElement.id}"` : ''}${m.target.parentElement?.className ? ` class="${m.target.parentElement.className}"` : ''}>`);
                console.log(`📝 Old text: "${m.oldValue || m.target.nodeValue}"`);
                console.log(`📝 New text: "${m.target.nodeValue}"`);
            }

            // Added nodes with FULL HTML
            if (m.addedNodes.length > 0) {
                console.log(`✅ ADDED (${m.addedNodes.length} nodes):`);
                Array.from(m.addedNodes).forEach((node, idx) => {
                    if (node.nodeType === 1) { // Element
                        console.log(`   ${idx + 1}. <${node.tagName.toLowerCase()}${node.id ? ` id="${node.id}"` : ''}${node.className ? ` class="${node.className}"` : ''}>`);
                        console.log(`      Full HTML: ${node.outerHTML}`);
                        console.log(`      Inner HTML: ${node.innerHTML}`);
                        console.log(`      Attributes:`, Array.from(node.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
                    } else if (node.nodeType === 3) { // Text
                        console.log(`   ${idx + 1}. Text: "${node.nodeValue}"`);
                    }
                });
            }

            // Removed nodes
            if (m.removedNodes.length > 0) {
                console.log(`❌ REMOVED (${m.removedNodes.length} nodes):`);
                Array.from(m.removedNodes).forEach((node, idx) => {
                    if (node.nodeType === 1) { // Element
                        console.log(`   ${idx + 1}. <${node.tagName.toLowerCase()}${node.id ? ` id="${node.id}"` : ''}${node.className ? ` class="${node.className}"` : ''}>`);
                        console.log(`      Full HTML: ${node.outerHTML}`);
                    } else if (node.nodeType === 3) { // Text
                        console.log(`   ${idx + 1}. Text: "${node.nodeValue}"`);
                    }
                });
            }

            // Attribute changes
            if (m.type === 'attributes') {
                console.log(`🔄 Attribute changed: ${m.attributeName}`);
                console.log(`   Old value: "${m.oldValue}"`);
                console.log(`   New value: "${m.target.getAttribute(m.attributeName)}"`);
            }

            console.groupEnd();
        });
    };

    function toggleHeader(show = false) {
        const header = document.querySelector('.header');
        if (!header) return;

        const mainContent = document.querySelector('.main-content-container');
        const standardStatsPanel = document.querySelector('.standard-stats-panel');
        const fmcStatsPanel = document.querySelector('.fewest-moves-stats-panel');
        const standardMainPanel = document.querySelector('.standard-main-panel');
        const moduleContainer = document.querySelector('.module-container');

        if (!show) {
            if (standardStatsPanel || fmcStatsPanel) {
                header.style.display = 'none';
                if (mainContent) {
                    mainContent.style.top = '0';
                    mainContent.style.paddingTop = 'var(--header_height)';
                }
            }
        } else {
            header.style.display = 'flex';
            if (mainContent) {
                mainContent.style.top = 'var(--header_height)';
                mainContent.style.paddingTop = '0';
            }
            if (standardStatsPanel) {
                standardStatsPanel.style.top = '0';
            }
            if (fmcStatsPanel) {
                fmcStatsPanel.style.top = '0';
            }
        }
    }

    const BASE = 75;

    function checkPuzzleBoundariesAfterZoom() {
        requestAnimationFrame(() => {
            applyPuzzlePosition();
        });
    }

    function setMaxSize() {
        const focus = document.querySelector('.focus-container');
        const puzzle = document.querySelector('.puzzle-container');
        if (!focus || !puzzle) return;

        const focusH = focus.getBoundingClientRect().height;
        const puzzleH = puzzle.getBoundingClientRect().height;

        let raw = parseFloat(getComputedStyle(puzzle).getPropertyValue('--zoom-factor'));
        let z = Math.round((isNaN(raw) ? 1 : raw) * BASE);

        const maxZ = Math.floor((focusH / puzzleH) * z);
        const finalZ = Math.max(1, maxZ);

        puzzle.style.setProperty('--zoom-factor', (finalZ / BASE));
        checkPuzzleBoundariesAfterZoom();
    }
    function setDefaultSize() {
        const el = document.querySelector('.puzzle-container');
        if (!el) return;
        el.style.setProperty('--zoom-factor', (1).toString());
        checkPuzzleBoundariesAfterZoom();
    }
    function isZoomDefault() {
        const el = document.querySelector('.puzzle-container');
        if (!el) return false;

        const raw = parseFloat(getComputedStyle(el).getPropertyValue('--zoom-factor'));
        const z = Math.round((isNaN(raw) ? 0 : raw) * BASE);

        return z === BASE;
    }
    function stepZoom(dir) {
        const el = document.querySelector('.puzzle-container');
        if (!el) return;

        const raw = parseFloat(getComputedStyle(el).getPropertyValue('--zoom-factor'));
        let z = Math.round((isNaN(raw) ? 1 : raw) * BASE);

        z += dir;
        if (z < 1) z = 1;

        el.style.setProperty('--zoom-factor', (z / BASE));
        checkPuzzleBoundariesAfterZoom();
    }

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            // Fullscreen was exited (possibly by Escape key)
            exitZenMode();
        }
    });

    // Also handle vendor-prefixed events for Safari/IE
    document.addEventListener('webkitfullscreenchange', () => {
        if (!document.webkitFullscreenElement) {
            exitZenMode();
        }
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'PageUp') setTimeout(() => stepZoom(+1), 0);
        if (e.key === 'PageDown') setTimeout(() => stepZoom(-1), 0);
        if (e.key === 'End') {
            e.preventDefault();
            e.stopImmediatePropagation();
            settings.puzzleLeft.setValue(0);
            settings.puzzleTop.setValue(0);
            applyPuzzlePosition();
            if (isZoomDefault()) {
                setMaxSize();
            } else {
                setDefaultSize();
            }
            //updatePuzzleWidthCSS();
        }
        if (e.altKey && e.key === 'Enter') {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (!isZenMode) {
                enterZenMode();
            } else {
                exitZenMode();
            }
        }
        if (e.key === '1' || e.key === '2') {
            setTimeout(() => {
                applyGridsBorder(currentConfig.gridsBorderWidth, currentConfig.gridsBorderColor);
                applyInactiveBrightness(currentConfig.inactiveBrightness);
            }, 10);
        }
        if (e.key === 'a' || e.key === "A") {
            e.stopImmediatePropagation();
            toggleEditingMode(e);
        }
        if (e.key === 'c' || e.key === "C") {
            e.stopImmediatePropagation();
            toggleCenterPosition();
        }
    }, { capture: true });

    function enterFullscreen(element) {
        // Guard: exit if no element provided
        if (!element) return;

        // Guard: exit if already in fullscreen (any element)
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement) {
            return;
        }

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        // Check if document is actually in fullscreen mode first
        if (!document.fullscreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            return; // Not in fullscreen, nothing to exit
        }

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }

    function toggleLiveOpacity(shown) {
        const liveStats = document.getElementById('liveStatsContainer');
        if (!liveStats) return;
        if (shown) {
            liveStats.style.opacity = '';
        } else {
            liveStats.style.opacity = 0;
        }
    }

    function enterZenMode() {
        const mainContent = document.querySelector('.focus-container');
        if (!mainContent) return;
        enterFullscreen(document.documentElement);
        toggleHeader(false);
        isZenMode = true;
        replaceText();
        toggleLiveOpacity(false);
    }

    function exitZenMode() {
        exitFullscreen(document.documentElement);
        if (!scrambled || !currentConfig.hideHeaderDuringSolves) {
            toggleHeader(true);
        }
        isZenMode = false;
        replaceText();
        toggleLiveOpacity(true);
    }

    function formatSingleSolve(finished) {
        const container = document.querySelector('.stats-grid-container');
        if (!container) return;
        const tds = container.querySelectorAll('tr[avg="1"] td');
        for (const td of tds) {
            const index = Array.from(tds).indexOf(td);
            if (index > 0) {
                if (finished) {
                    td.style.fontWeight = 'bold';
                    td.style.setProperty('font-size', '14px', 'important');
                    if (td.textContent !== 'DNF') {
                        td.style.color = '#00b919';
                    } else {
                        td.style.color = 'red';
                    }
                } else {
                    td.style.fontWeight = 'normal';
                    td.style.setProperty('font-size', '14px', 'important');
                    td.style.color = '#fff';
                }
            }
        }
    }
    //very slow
    function updatePuzzleWidthCSS() {
        const puzzle = document.querySelector('.puzzle');
        if (puzzle) {
            const container = document.querySelector('.puzzle-container')
            const zoomFactor = parseFloat(getComputedStyle(container).getPropertyValue('--zoom-factor'))
            root.style.setProperty('--puzzle-width', `${puzzle.clientWidth * parseFloat(zoomFactor)}px`);
        }
    }

    function hideLogoutButton() {
        const dropdown = document.querySelector('.user-menu .username-dropdown');
        if (!dropdown) return;

        const logoutBtn = dropdown.querySelector('.item');
        if (logoutBtn?.textContent.trim() === 'Log out') {
            logoutBtn.style.display = 'none';
        }

        const visible = [...dropdown.children].filter(child =>
            child.style.display !== 'none' && getComputedStyle(child).display !== 'none'
        );

        if (visible.length <= 1) dropdown.style.display = 'none';
    }

    function applyNonPuzzleMutations(mutations) {
        positionApplied = false;
        if (currentConfig.minimizeSessions) {
            minimizeSessions();
        }
        if (isEditingMode) {
            exitEditMode();
        }
    }

    function applyGenericMutations(mutations) {
        updateButtonVisibility();
        applyUIOpacity(currentConfig.uiOpacity);

    }

    function applyPuzzleMutations(mutations) {
        const state = detectPuzzleState(mutations);
        initLiveContainer();
        formatSingleSolve(false);
        let preservePosition = false;
        if (liveSolvesData.length > 0) {
            const solveCheck = getSolveFromTable();
            if (!solveCheck || solveFromSameSession(solveCheck)) {
                preservePosition = true;
            }
        }
        if (!preservePosition) {
            const sessionNameEl = document.querySelector('.session-name');
            if (sessionNameEl) {
                const currentSession = sessionNameEl.textContent.trim();
                if (currentSession && currentSession === previousSessionName) {
                    preservePosition = true;
                }
                previousSessionName = currentSession;
            }
        }
        const hideHeaderDuringSolves = currentConfig.hideHeaderDuringSolves;
        if (state === "scrambled") {
            unlockKeys();
            scrambled = true;
            if (hideHeaderDuringSolves) {
                toggleHeader(false);
            }
            if (isEditingMode) {
                exitEditMode();
            }
        } else if (state === "finished") {
            if (scrambled) {
                trackSolve(getSolveFromTable());
            } else if (liveStats) {
                const solveCheck = getSolveFromTable();
                if (solveCheck && !solveFromSameSession(solveCheck)) {
                    liveSolvesData.length = 0;
                    resetBestValues();
                    clearLiveTable();
                    resetPBStylesInStatsGrid();
                }
            }
            liveStats?.update();
            scrambled = false;
            if (hideHeaderDuringSolves && !isZenMode) {
                toggleHeader(true);
            }
            highlightPBsInStatsGrid();
        } else {
            if (liveStats) {
                const solveCheck = getSolveFromTable();
                if (solveCheck && !solveFromSameSession(solveCheck)) {
                    liveSolvesData.length = 0;
                    resetBestValues();
                    clearLiveTable();
                    resetPBStylesInStatsGrid();
                }
            }
        }
        initSound();
        if (!positionApplied) {
            if (preservePosition) {
                applyPuzzlePosition();
            } else if (currentConfig.puzzleAlwaysInCenter) {
                toggleCenterPosition();
            } else {
                movePuzzleToTopLeft();
            }
        } else {
            applyPuzzlePosition();
        }

        replaceText();

        if (currentConfig.base9) {
            convertBase9();
        }

        setTimeout(() => {
            applyGridsBorder(currentConfig.gridsBorderWidth, currentConfig.gridsBorderColor);
            applyInactiveBrightness(currentConfig.inactiveBrightness);
        }, 10);
        applyBorder(currentConfig.borderWidth, currentConfig.borderColor);
        applyPuzzleDim(currentConfig.puzzleDim);
        addHorizontalScroll();
        if (currentConfig.rawHardwareInput) {
            overwriteInputs();
        } else {
            restoreInputs();
        }
    }

    const mainObserver = new MutationObserver((mutations) => {
        if (mutations.length === 3 && mutations[0].target.closest('tr[avg="1"]')) return; //prevent timer spam
        mainObserver.disconnect();
        const isPuzzleMutation = !!document.querySelector('.focus-area');
        //console.log('Mutations observed:', mutations.length);
        //logMutationDetails(mutations);
        if (isPuzzleMutation) {
            applyPuzzleMutations(mutations);
        } else {
            applyNonPuzzleMutations(mutations);
        }
        applyGenericMutations(mutations);

        mainObserver.observe(document.body, { childList: true, subtree: true });
    });

    // ==================== STATS IMPROVEMENTS ====================
    let _statsModule = null;

    function destroyCharts() {
        if (_statsModule?.destroyCharts) {
            _statsModule.destroyCharts();
        }
    }

    function destroyCalculator() {
        if (_statsModule?.destroyCalculator) {
            _statsModule.destroyCalculator();
        }
    }

    function destroyOverlay() {
        if (_statsModule?.destroyOverlay) {
            _statsModule.destroyOverlay();
        }
    }

    let statsInitialized = false;

    async function initStats() {
        root = document.documentElement;
        await init();
        if (statsInitialized) return;
        statsInitialized = true;

        const graphsEnabled = settings.statsGraphs?.getValue() !== false;
        const avgsEnabled = settings.statsAverages?.getValue() !== false;
        const replaysEnabled = settings.statsReplays?.getValue() !== false;

        if (!graphsEnabled && !avgsEnabled && !replaysEnabled) {
            return;
        }

        _statsModule = createStatsModule(graphsEnabled, avgsEnabled, replaysEnabled);

        if (_statsModule.startStats) {
            _statsModule.startStats();
        }
    }
    const DNF_TIME = 999999.999;
    const DNF_MOVES = 999999;
    const DNF_TPS_BAD = -1e9;

    function createStatsModule(graphsEnabled, avgsEnabled, replaysEnabled) {
        // ==================== STATS VARIABLES ====================
        let overlay = null;
        let iframe = null;
        let isDragging = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        let isLoadingReplay = false;
        let currentMainRowMetadata = null;
        let isIframeReady = false;
        let useDetailsForStats = false;
        let extractedSolvesMain = [];
        let extractedSolvesDetails = [];


        // Calculator variables
        let calculatorContainer = null;
        let outputArea = null;
        let progressBar = null;
        let progressText = null;
        let currentWorker = null;
        let sessionStatsDiv = null;
        let filterSummaryDiv = null;
        let worker = null; // Web Worker reference for calculations
        const SESSION_GAP_MS = 60 * 60 * 1000;

        // Chart variables
        let chart1 = null;
        let chart2 = null;
        let currentGraphDataType = 'single';

        // ==================== REPLAY FUNCTIONS ====================
        function parseDetailTime(timeStr) {
            const parts = timeStr.split(':').map(part => parseFloat(part));
            let seconds = 0;
            for (let i = 0; i < parts.length - 1; i++) {
                seconds = (seconds + parts[i]) * 60;
            }
            seconds += parts[parts.length - 1];
            return seconds;
        }

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

            const header = overlay.querySelector('.replay-header');
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

            const maximizeBtn = overlay.querySelector('#maximizeReplayBtn');
            let isMaximized = false;
            let previousState = { left: '', top: '', width: '', height: '' };

            maximizeBtn.addEventListener('click', () => {
                if (!isMaximized) {
                    const rect = overlay.getBoundingClientRect();
                    previousState = {
                        left: overlay.style.left,
                        top: overlay.style.top,
                        width: overlay.style.width,
                        height: overlay.style.height
                    };
                    overlay.style.left = '0px';
                    overlay.style.top = '0px';
                    overlay.style.right = 'auto';
                    overlay.style.width = `${window.innerWidth}px`;
                    overlay.style.height = `${window.innerHeight}px`;
                    maximizeBtn.textContent = '❐';
                    maximizeBtn.title = 'Restore';
                    isMaximized = true;
                } else {
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

            window.addEventListener('resize', () => {
                if (isMaximized) {
                    overlay.style.width = `${window.innerWidth}px`;
                    overlay.style.height = `${window.innerHeight}px`;
                }
            });

            const closeBtn = overlay.querySelector('#closeReplayBtn');
            closeBtn.addEventListener('click', () => {
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
                overlay.style.top = '250px';
                overlay.style.right = '20px';
                overlay.style.left = 'auto';
                overlay.style.width = '450px';
                overlay.style.height = '684px';
                maximizeBtn.textContent = '□';
                maximizeBtn.title = 'Maximize';
                isMaximized = false;
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
                iframe.src = 'https://slidysim.github.io/replay';
                iframe.allow = 'clipboard-read; clipboard-write';
                iframe.sandbox = 'allow-same-origin allow-scripts allow-popups allow-forms allow-modals';

                container.appendChild(iframe);
                overlay.style.display = 'block';

                iframe.onload = () => {
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

            const headerTitle = overlay.querySelector('.replay-title');
            headerTitle.textContent = solveData.overlayTitle;

            const tpsInMs = solveData.tps * 1000;

            iframe.focus();

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
        }

        async function loadAndSendReplay(solveData) {
            if (isLoadingReplay) {
                return;
            }

            isLoadingReplay = true;

            try {
                if (!overlay) createOverlay();

                if (!iframe || !isIframeReady) {
                    await initializeIframe();
                }

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
                return;
            }

            const replaysActive = settings.statsReplays?.getValue() !== false;

            const cells = rowElement.querySelectorAll('td');
            if (cells.length < 5) return;

            const solveNumber = cells[0]?.textContent.trim();
            const timeStr = cells[1]?.textContent.trim();

            if (timeStr.includes('DNF')) {
                return;
            }

            currentMainRowMetadata = {
                solveNumber: solveNumber
            };

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
                            const detailRows = tbody.querySelectorAll('tr');
                            if (detailRows.length > 0) {
                                if (detailRows.length > 1) {
                                    useDetailsForStats = true;
                                    extractedSolvesDetails.length = 0;
                                    if (avgsEnabled) calculateAvgs();
                                }
                                if (detailRows.length === 1 && replaysActive) {
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

                            detailRows.forEach(detailRow => {
                                if (!detailRow.hasAttribute('data-detail-listener')) {
                                    const replaysActive = settings.statsReplays?.getValue() !== false;
                                    if (replaysActive) {
                                        detailRow.setAttribute('data-detail-listener', 'true');
                                        detailRow.classList.add('detail-row-clickable');
                                        detailRow.addEventListener('click', (e) => {
                                            e.stopPropagation();
                                            onDetailRowClick(detailRow);
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            }, 200);
        }

        function onDetailRowClick(detailRow) {
            if (settings.statsReplays?.getValue() === false) {
                return;
            }
            if (isLoadingReplay) {
                return;
            }

            if (!currentMainRowMetadata) {
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
                return;
            }

            const originalBg = detailRow.style.backgroundColor;
            detailRow.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';

            setTimeout(() => {
                detailRow.style.backgroundColor = originalBg;
            }, 200);

            if (!overlay) createOverlay();

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
                const tablesContainer = document.querySelector('.session-statistics-page-tables-container');
                if (!tablesContainer) {
                    document.querySelector('#closeReplayBtn')?.click();
                    closeObserver.disconnect();
                }
            });

            closeObserver.observe(document.body, { childList: true, subtree: true });

            const innerContainer = document.querySelector('.session-statistics-page-inner-container');
            const tablesContainer = document.querySelector('.session-statistics-page-tables-container');

            if (innerContainer && tablesContainer && !calculatorContainer && avgsEnabled) {
                calculatorContainer = createCalculator();
                innerContainer.insertBefore(calculatorContainer, tablesContainer);
                setupEventListeners(calculatorContainer);
                setTimeout(handleCalculateOrClick, 100);

                const graphsEnabled = settings.statsGraphs?.getValue() !== false;
                if (!graphsEnabled) {
                    const graphsContainer = document.querySelector('#avgs-graphs-container');
                    if (graphsContainer) graphsContainer.style.display = 'none';
                }

                let tableUpdateTimeout = null;
                const tableContainer = document.querySelector('.session-statistics-table-container');
                if (tableContainer && !tableContainer.hasAttribute('data-stats-observer')) {
                    tableContainer.setAttribute('data-stats-observer', 'true');
                    const statsObserver = new MutationObserver((mutations) => {
                        if (currentlySorting) return;
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

            tables.forEach((table, index) => {
                const container = table.closest('.session-statistics-table-container');
                if (container && container.style.display !== 'none') {
                    const tbody = table.querySelector('tbody');
                    if (tbody) {
                        const rows = tbody.querySelectorAll('tr');
                        rows.forEach(row => {
                            if (index === 0) {
                                if (!row.hasAttribute('data-replay-listener')) {
                                    const replaysActive = settings.statsReplays?.getValue() !== false;
                                    if (replaysActive) {
                                        row.setAttribute('data-replay-listener', 'true');
                                        row.classList.add('solve-row-clickable');
                                        row.addEventListener('click', (e) => {
                                            e.stopPropagation();
                                            onSolveClick(row);
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }

        function observeTables() {
            const tables = document.querySelectorAll('.session-statistics-table');
            const mainTable = tables[0];
            makeTableSortable(mainTable);
            //sortTable(mainTable, 0); //reverse id by default

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

        // ==================== AVERAGE CALCULATOR ====================
        const workerCode = `
            const DNF_TIME = 999999.999;
            const DNF_MOVES = 999999;
            const DNF_TPS_BAD = -1e9;

            function getTrimCount(ruleStr, N, customVal) {
                if (N < 3) return 0;
                if (ruleStr !== '0' && N < 13) return 1;
                let trim = 1;
                if (ruleStr === '0') trim = 0;
                else if (ruleStr === '1') trim = 1;
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

                const times = solves.map(s => s.time);
                const moves = solves.map(s => s.moves);
                const tpses = solves.map(s => s.tps);
                const ids = solves.map(s => s.solveId);
                const timestamps = solves.map(s => s.timestamp);

                const results = [];
                const higherBetter = (category === 'tps');
                const dnfMain = category === 'time' ? DNF_TIME : (category === 'moves' ? DNF_MOVES : DNF_TPS_BAD);

                let mainArray;
                if (category === 'time') mainArray = times;
                else if (category === 'moves') mainArray = moves;
                else mainArray = tpses;

                for (let sizeIdx = 0; sizeIdx < avgSizes.length; sizeIdx++) {
                    const size = avgSizes[sizeIdx];
                    if (size > n || (size < 3 && trimRule !== '0')) continue;
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

                    const progress = Math.floor(((sizeIdx + 1) / avgSizes.length) * 100);
                    self.postMessage({ type: 'progress', progress });
                }
                self.postMessage({ type: 'result', results });
            };
        `;

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
                            mainSum: bestMain / 1000,
                            compSum: bestComp / 1000,
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

                function findSubRelays(solves, sizePattern) {
                    const subResults = [];

                    if (type === 'relay' || type === 'width relay' || type === 'height relay') {
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
                        const maxDim = Math.max(...solves.map(s => s.width));

                        for (let n = maxDim; n >= 2; n--) {
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

            rows.forEach((row, rowIndex) => {
                const c = (i) => row.querySelectorAll('td')[i]?.textContent.trim() || '';

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
                    if (tpsText === "∞") {
                        tpsVal = Infinity;
                    } else {
                        tpsVal = parseFloat(tpsText);
                    }
                    if (isNaN(tpsVal) || tpsText === 'DNF') tpsVal = DNF_TPS_BAD;
                }

                const formatNumeric = (value) => {
                    if (value === Infinity) return '∞';
                    if (value === null) return 'DNF';
                    return (Math.floor(value * 1000) / 1000).toFixed(3);
                };

                solves.push({
                    solveId, time: timeVal, timeStr: timeText,
                    moves: movesVal, movesStr: movesText,
                    tps: tpsVal, tpsStr: isFMC ? formatNumeric(tpsVal) : tpsText,
                    timestamp, date: parseDateFromTable(timestamp),
                    isDNF: timeText === 'DNF',
                    rowIndex: rowIndex
                });
            });

            if (useDetailsForStats) extractedSolvesDetails = solves;
            else extractedSolvesMain = solves;
            // sort solves based on solveId from lowest to highest
            return solves.sort((a, b) => a.solveId - b.solveId);
        }

        function filterSolves(solves) {
            const startId = parseInt(document.querySelector('#avgs-start-id')?.value) || null;
            const endId = parseInt(document.querySelector('#avgs-end-id')?.value) || null;
            const selectedSession = document.querySelector('#avgs-session-select')?.value || 'all';
            const sinceLastDnf = document.querySelector('#avgs-since-last-dnf')?.checked || false;

            let filtered = solves;

            if (selectedSession !== 'all') {
                const [sessionStartId, sessionEndId] = selectedSession.split(':').map(Number);
                if (!Number.isNaN(sessionStartId) && !Number.isNaN(sessionEndId)) {
                    filtered = filtered.filter(solve => solve.solveId >= sessionStartId && solve.solveId <= sessionEndId);
                }
            }

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

            if (sinceLastDnf) {
                const lastDnfIndex = filtered.map(solve => solve.isDNF).lastIndexOf(true);
                if (lastDnfIndex !== -1) {
                    filtered = filtered.slice(lastDnfIndex + 1);
                }
            }

            return filtered;
        }

        function formatSessionDate(date) {
            if (!date) return 'Unknown date';
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function formatSessionTime(date) {
            if (!date) return '--:--';
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        function getSolveSessions(solves) {
            const datedSolves = solves
                .filter(solve => solve.date)
                .slice()
                .sort((a, b) => a.date - b.date || a.solveId - b.solveId);
            const sessions = [];
            let current = null;

            datedSolves.forEach(solve => {
                const shouldStartSession = !current || (solve.date - current.lastDate) > SESSION_GAP_MS;
                if (shouldStartSession) {
                    current = {
                        startId: solve.solveId,
                        endId: solve.solveId,
                        firstDate: solve.date,
                        lastDate: solve.date,
                        count: 1
                    };
                    sessions.push(current);
                    return;
                }

                current.endId = solve.solveId;
                current.lastDate = solve.date;
                current.count += 1;
            });

            return sessions.sort((a, b) => b.lastDate - a.lastDate || b.endId - a.endId);
        }

        function updateSessionFilterOptions(solves = extractSolvesFromTable()) {
            const select = document.querySelector('#avgs-session-select');
            if (!select) return;

            const previousValue = select.value || 'all';
            const sessions = getSolveSessions(solves);
            select.innerHTML = '<option value="all">All sub-sessions</option>';

            sessions.forEach((session, index) => {
                const option = document.createElement('option');
                option.value = `${session.startId}:${session.endId}`;
                const dateText = formatSessionDate(session.lastDate);
                const timeText = formatSessionTime(session.lastDate);
                const countText = session.count === 1 ? '1 solve' : `${session.count} solves`;
                const latestText = index === 0 ? 'Latest - ' : '';
                option.textContent = `${dateText} - ${timeText} - ${countText}`;
                select.appendChild(option);
            });

            select.value = Array.from(select.options).some(option => option.value === previousValue) ? previousValue : 'all';
        }

        function applySolveRowFilters(solves) {
            if (useDetailsForStats) return;

            const table = document.querySelector('.session-statistics-table');
            const rows = table?.querySelectorAll('tbody tr');
            if (!rows) return;

            const visibleIds = new Set(filterSolves(solves).map(solve => solve.solveId));
            rows.forEach(row => {
                const solveId = parseInt(row.querySelectorAll('td')[0]?.textContent.trim()) || 0;
                row.style.display = visibleIds.has(solveId) ? '' : 'none';
            });
        }

        function clearSolveRowFilters() {
            const table = document.querySelector('.session-statistics-table');
            const rows = table?.querySelectorAll('tbody tr');
            rows?.forEach(row => {
                row.style.display = '';
            });
        }

        function getSelectedAvgSizes() {
            const selected = document.querySelector('input[name="avgSet"]:checked')?.value || 'major100';
            const trimRule = document.querySelector('input[name="trimRule"]:checked')?.value || '5%';
            if (selected === 'all') {
                const sizes = [
                    4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
                    61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
                    81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
                    200, 250, 500, 1000, 2000, 2500, 5000, 10000
                ];
                if (trimRule === '0') {
                    return [2, 3, ...sizes];
                }
                return sizes;
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
            const sessionSelect = document.querySelector('#avgs-session-select');
            const selectedSessionText = sessionSelect?.value && sessionSelect.value !== 'all'
                ? sessionSelect.options[sessionSelect.selectedIndex]?.textContent
                : '';
            const sinceLastDnf = document.querySelector('#avgs-since-last-dnf')?.checked || false;

            const useDateRange = document.querySelector('#avgs-use-date-range')?.checked || false;

            let filterText = `Best averages in session, using ${trimText} outliers, best ${categoryText} values`;

            if (selectedSessionText) {
                filterText += `, ${selectedSessionText}`;
            }

            if (sinceLastDnf) {
                filterText += `, since last DNF`;
            }

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

            const firstSolve = filteredSolves[0];
            const lastSolve = filteredSolves[filteredSolves.length - 1];

            const parseAndAdjustTimestamp = (s, timeToSubtract) => {
                if (timeToSubtract == DNF_TIME) { return s; }
                const m = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\s*(AM|PM))?/i);
                if (!m) return s;

                let [, y, mo, d, h, mi, se, p] = m;
                const ampm = p || '';
                let hour24 = (+h % 12 + (ampm.toUpperCase() === "PM" ? 12 : 0));
                const date = new Date(+y, +mo - 1, +d, hour24, +mi, +se);
                const adjustedDate = new Date(date.getTime() - timeToSubtract * 1000);

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
                    sessionDurationSeconds = (lastSolve.date - firstSolve.date) / 1000;
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

            const getStreakDisplay = async () => {
                if (currentStreak > 2) {
                    try {
                        const result = await getFullAverage(filteredSolves.slice(-currentStreak));
                        if (result === "NO AVERAGE") {
                            return `${currentStreak}`;
                        }
                        const prefix = document.querySelector('input[name="trimRule"]:checked')?.value === '0' ? 'mo' : 'ao';
                        return `${prefix}${currentStreak}: ${result}`;
                    } catch (error) {
                        console.error('Failed to calculate average:', error);
                        return `${currentStreak} (error occured)`;
                    }
                } else {
                    return Promise.resolve(`${currentStreak}`);
                }
            };

            getStreakDisplay().then(streakDisplay => {
                const statsHtml = `
        <div class="avgs-session-stats">
            <div class="avgs-session-stats-title">📈 Session Statistics (filters apply)</div>
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
                    <span class="avgs-stat-value">${streakDisplay}</span>
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
            });
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

        function getFullAverage(solves) {
            return new Promise((resolve, reject) => {
                const trimRule = document.querySelector('input[name="trimRule"]:checked')?.value || '5%';
                const customTrim = document.querySelector('#customTrimInput')?.value || '2';
                const killBtn = document.querySelector('.avgs-kill-btn');
                if (killBtn) killBtn.style.display = 'block';
                if (currentWorker) {
                    currentWorker.terminate();
                    currentWorker = null;
                }
                if (progressBar) progressBar.value = 0;
                if (progressText) progressText.textContent = '0%';
                currentWorker = createWorker();

                currentWorker.onmessage = (e) => {
                    const { type: msgType, progress, results } = e.data;
                    if (msgType === 'progress') {
                        if (progressBar) progressBar.value = progress;
                        if (progressText) progressText.textContent = `${progress}%`;
                    } else if (msgType === 'result') {
                        if (progressBar) progressBar.value = 100;
                        if (progressText) progressText.textContent = 'done';
                        if (killBtn) killBtn.style.display = 'none';

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
                            if (value === Infinity) return '∞';
                            if (value === null) return 'DNF';
                            return (Math.floor(value * 1000) / 1000).toFixed(3);
                        };

                        if (results.length > 0) {

                            const r = results[0];
                            const comp1 = formatNumeric(r.movesAvg);
                            const comp2 = formatNumeric(r.tpsAvg);
                            const mainFormatted = formatTimeValue(r.mainAvg);

                            currentWorker = null;
                            resolve(`${mainFormatted} (${comp1}/${comp2})`);
                        } else {
                            currentWorker = null;
                            resolve("NO AVERAGE");
                        }
                    }
                };

                currentWorker.onerror = (e) => {
                    currentWorker = null;
                    reject(e);
                };

                currentWorker.postMessage({
                    solves, category: "time", trimRule, customTrim, avgSizes: [solves.length]
                });
            });
        }

        function calculateAvgs() {
            const allSolves = extractSolvesFromTable();
            let solves;
            let type = 'single';
            const killBtn = document.querySelector('.avgs-kill-btn');
            if (killBtn) killBtn.style.display = 'block';
            if (currentWorker) {
                currentWorker.terminate();
                currentWorker = null;
            }

            const resetBtn = document.querySelector('.avgs-reset-btn');
            if (!useDetailsForStats) updateSessionFilterOptions(allSolves);
            updateFilterSummary();
            if (!useDetailsForStats) {
                const table = document.querySelector('.session-statistics-table')
                addSortingListeners(table);
                sortTable(table, 0, 'desc'); //reverse id by default
                solves = filterSolves(allSolves);
                applySolveRowFilters(allSolves);
                if (resetBtn) resetBtn.style.display = 'none';
            } else {
                clearSolveRowFilters();
                if (resetBtn) resetBtn.style.display = 'block';
                solves = fixDetailsSolvesData(allSolves);
                type = getReplayType(solves);
            }

            if (graphsEnabled) {
                currentGraphDataType = type;
                updateGraphs(type);
            }

            if (solves.length === 0) {
                if (outputArea) outputArea.value = 'No solves found matching the filters.';
                return;
            }

            const category = document.querySelector('input[name="category"]:checked')?.value || 'time';
            const categoryVal = category;

            if (!useDetailsForStats) {
                const trimRule = document.querySelector('input[name="trimRule"]:checked')?.value || '5%';
                const customTrim = document.querySelector('#customTrimInput')?.value || '2';
                const avgSizes = getSelectedAvgSizes();
                if (!avgSizes.includes(solves.length)) {
                    avgSizes.push(solves.length);
                }

                if (progressBar) progressBar.value = 0;
                if (progressText) progressText.textContent = '0%';
                if (outputArea) outputArea.value = `Calculating... (${solves.length} solves selected)`;

                currentWorker = createWorker();

                currentWorker.onmessage = (e) => {
                    const { type: msgType, progress, results } = e.data;
                    if (msgType === 'progress') {
                        if (progressBar) progressBar.value = progress;
                        if (progressText) progressText.textContent = `${progress}%`;
                    } else if (msgType === 'result') {
                        if (progressBar) progressBar.value = 100;
                        if (progressText) progressText.textContent = 'done';
                        if (killBtn) killBtn.style.display = 'none';

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
                            if (value === Infinity) return '∞';
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
                            const range = `${r.startId}-${r.endId}`;
                            if (r.trimEach === 0) {
                                lines.push(`mo${r.size}: ${mainFormatted} (${comp1}/${comp2}) | ${ts} (${range})`);
                            } else {
                                const outText = r.trimEach === 1 ? '1 out' : `${r.trimEach} out`;
                                lines.push(`ao${r.size}: ${mainFormatted} (${comp1}/${comp2}) | ${ts} (${outText}) (${range})`);
                            }
                        }

                        if (outputArea) outputArea.value = lines.length ? lines.join('\n') : 'No valid averages (or DNF everywhere).';
                        currentWorker = null;
                        updateSessionStats();
                    }
                };

                currentWorker.postMessage({
                    solves: solves,
                    category, trimRule, customTrim, avgSizes
                });
            } else {
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
                    if (value === Infinity) return '∞';
                    if (value < 0) return "∞";
                    if (value === null || isNaN(value)) return 'DNF';
                    return (Math.floor(value * 1000) / 1000).toFixed(3);
                };
                const formatInteger = (value) => {
                    if (value === null || isNaN(value)) return 'DNF';
                    return Math.floor(value).toString();
                };

                if (progressBar) progressBar.value = 0;
                if (progressText) progressText.textContent = '0%';

                if (type === 'marathon') {
                    if (categoryVal === 'tps') {
                        if (outputArea) outputArea.value = "You can't find TPS splits of marathon, sorry";
                        if (killBtn) killBtn.style.display = 'none';
                        if (progressBar) progressBar.value = 100;
                        if (progressText) progressText.textContent = 'done';
                        return;
                    }

                    if (outputArea) outputArea.value = `Calculating marathon splits... (${solves.length} solves)`;
                    currentWorker = createMarathonWorker();

                    currentWorker.onmessage = (e) => {
                        const { type: msgType, progress, results, error } = e.data;
                        if (msgType === 'progress') {
                            if (progressBar) progressBar.value = progress;
                            if (progressText) progressText.textContent = `${progress}%`;
                        } else if (msgType === 'result') {
                            if (progressBar) progressBar.value = 100;
                            if (progressText) progressText.textContent = 'done';
                            if (killBtn) killBtn.style.display = 'none';

                            if (error === 'tps') {
                                if (outputArea) outputArea.value = "You can't find TPS splits of marathon, sorry";
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

                            if (outputArea) outputArea.value = lines.join('\n');
                            currentWorker = null;
                        }
                    };

                    currentWorker.postMessage({ solves, category: categoryVal });
                } else {
                    if (categoryVal === 'tps') {
                        if (outputArea) outputArea.value = "You can't find TPS splits of relays, sorry";
                        if (killBtn) killBtn.style.display = 'none';
                        if (progressBar) progressBar.value = 100;
                        if (progressText) progressText.textContent = 'done';
                        return;
                    }

                    if (outputArea) outputArea.value = `Calculating ${type} splits...`;
                    currentWorker = createRelayWorker();

                    currentWorker.onmessage = (e) => {
                        const { type: msgType, results, error } = e.data;
                        if (msgType === 'result') {
                            if (progressBar) progressBar.value = 100;
                            if (progressText) progressText.textContent = 'done';
                            if (killBtn) killBtn.style.display = 'none';

                            if (error === 'tps') {
                                if (outputArea) outputArea.value = "You can't find TPS splits of relays, sorry";
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
                            if (outputArea) outputArea.value = lines.join('\n');
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
                                    <div class="avgs-radio-group avgs-filter-controls">
                                        <label class="avgs-radio-label">
                                            <input type="radio" name="trimRule" value="0"> 0 (mean)
                                        </label>
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
                                    <div class="avgs-radio-group avgs-filter-controls">
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
                                    <div class="avgs-radio-group avgs-filter-controls">
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
                                    <div class="avgs-filter-controls">
                                        <input type="number" id="avgs-start-id" class="avgs-filter-input" placeholder="Start ID" min="1">
                                        <span class="avgs-range-separator">-</span>
                                        <input type="number" id="avgs-end-id" class="avgs-filter-input" placeholder="End ID" min="1">
                                    </div>
                                </div>

                                <div class="avgs-filter-row">
                                    <span class="avgs-control-label">Sub-session:</span>
                                    <div class="avgs-filter-controls">
                                        <select id="avgs-session-select" class="avgs-session-select">
                                            <option value="all">All sub-sessions</option>
                                        </select>
                                        <label class="avgs-checkbox-label">
                                            <input type="checkbox" id="avgs-since-last-dnf">
                                            <span class="date-filter-high">Since last DNF</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="avgs-filter-row">
                                    <span class="avgs-control-label">Date:</span>
                                    <div class="avgs-filter-controls">
                                        <label class="avgs-checkbox-label">
                                            <input type="checkbox" id="avgs-use-date-range">
                                            <span class="date-filter-high">Use range</span>
                                        </label>
                                        <div class="avgs-date-range" id="avgs-date-range-inputs" style="display:none;">
                                            <input type="date" id="avgs-start-date" class="avgs-date-input" value="${todayStr}">
                                            <span class="avgs-range-separator">to</span>
                                            <div class="avgs-end-date-row">
                                                <input type="date" id="avgs-end-date" class="avgs-date-input" value="${todayStr}" style="display:none;">
                                                <label class="avgs-checkbox-label">
                                                    <input type="checkbox" id="avgs-no-end-date" checked>
                                                    <span class="date-filter-high">Today</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="avgs-filter-row">
                                    <div class="avgs-quick-dates">
                                        <button class="avgs-quick-date-btn" data-preset="today">Today</button>
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
            const sessionSelect = container.querySelector('#avgs-session-select');
            const sinceLastDnfCheck = container.querySelector('#avgs-since-last-dnf');
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

            sessionSelect.addEventListener('change', calculateAvgs);
            sinceLastDnfCheck.addEventListener('change', calculateAvgs);

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

                    if (preset === 'today') {
                        startDateInput.value = todayStr;
                        endDateInput.value = todayStr;
                        noEndDateCheck.checked = true;
                    } else if (preset === 'last7') {
                        const startDate = new Date(today);
                        startDate.setDate(today.getDate() - 6);
                        startDateInput.value = startDate.toISOString().split('T')[0];
                        endDateInput.value = todayStr;
                        noEndDateCheck.checked = true;
                    } else if (preset === 'last30') {
                        const startDate = new Date(today);
                        startDate.setDate(today.getDate() - 29);
                        startDateInput.value = startDate.toISOString().split('T')[0];
                        endDateInput.value = todayStr;
                        noEndDateCheck.checked = true;
                    }

                    useDateRangeCheck.checked = true;
                    dateRangeDiv.style.display = 'flex';
                    endDateInput.style.display = noEndDateCheck.checked ? 'none' : 'inline-block';
                    calculateAvgs();
                });
            });

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.toggle('collapsed');
                toggleBtn.textContent = container.classList.contains('collapsed') ? '▶ Expand' : '▼ Collapse';
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
            updateSessionFilterOptions();
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
        function calculateBinSize(sessionAvg, category) {
            if (category === 'time') {
                if (sessionAvg < 2) return 0.05;
                if (sessionAvg < 5) return 0.1;
                if (sessionAvg < 30) return 0.5;
                if (sessionAvg < 60) return 1;
                if (sessionAvg < 120) return 2;
                if (sessionAvg < 300) return 5;
                if (sessionAvg < 600) return 10;
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
            } else {
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

            //const rawLowerBound = Math.max(0, mean - 2 * stdDev);
            const rawLowerBound = Math.max(0, Math.min(...values) - 0.0001); // Include the minimum value in the range
            const rawUpperBound = mean + 2 * stdDev;

            let niceBinSize = binSize;
            if (category === 'time') {
                if (binSize < 1) niceBinSize = binSize;
                else if (binSize < 10) niceBinSize = Math.ceil(binSize);
                else niceBinSize = Math.ceil(binSize / 10) * 10;
            }

            const lowerBound = Math.floor(rawLowerBound / niceBinSize) * niceBinSize;
            const upperBound = Math.ceil(rawUpperBound / niceBinSize) * niceBinSize;

            const inRange = sorted.filter(v => v >= lowerBound && v <= upperBound);

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

            let currentBin = lowerBound;

            while (currentBin <= maxVal) {
                bins.push(currentBin);
                const binMax = currentBin + niceBinSize;
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
                    return `${match[2]}/${match[3]}`;
                }
            } catch (e) { }
            return '';
        }

        function updateGraphs(dataType = currentGraphDataType) {
            if (!graphsEnabled) return;
            currentGraphDataType = dataType || 'single';

            if (typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }

            const allSolves = extractSolvesFromTable();
            const filteredSolves = filterSolves(allSolves);

            const category = document.querySelector('input[name="category"]:checked')?.value || 'time';

            const graphsContainer = document.querySelector('#avgs-graphs-container');
            if (!graphsContainer) return;
            destroyCharts();

            if (filteredSolves.length === 0) {
                graphsContainer.innerHTML = `
                    <div class="avgs-graph-card full-width">
                        <div class="avgs-graph-title">📊 Distribution Histogram</div>
                        <div class="avgs-no-data-message">No data available with current filters</div>
                    </div>
                `;
                return;
            }

            const validSolves = filteredSolves.filter(s => !s.isDNF);
            const tooManySolves = validSolves.length > 500;

            const dataTypeSupportsHistogram = currentGraphDataType === "single" || currentGraphDataType === "marathon";
            const shouldShowHistogram = dataTypeSupportsHistogram || tooManySolves;

            let values;
            if (category === 'time') {
                values = validSolves.map(s => s.time);
            } else if (category === 'moves') {
                values = validSolves.map(s => s.moves);
            } else {
                values = validSolves.map(s => s.tps);
            }

            if (!shouldShowHistogram) {
                graphsContainer.innerHTML = `
                    <div class="avgs-graph-card full-width">
                        <div class="avgs-graph-title" id="graph1-title">📈 Chronological Progress</div>
                        <div class="avgs-graph-canvas-container">
                            <canvas id="progressChart" class="avgs-graph-canvas"></canvas>
                        </div>
                    </div>
                `;
            } else if (tooManySolves) {
                graphsContainer.innerHTML = `
                    <div class="avgs-graph-card full-width">
                        <div class="avgs-graph-title" id="graph2-title">📊 Distribution Histogram</div>
                        <div class="avgs-graph-canvas-container">
                            <canvas id="histogramChart" class="avgs-graph-canvas"></canvas>
                        </div>
                    </div>
                `;
            } else {
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

            const shouldCreateChronological = !tooManySolves;
            if (shouldCreateChronological) {
                const chronologicalData = [];

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
                        date: solve.timestamp,
                        // Store all extra data for tooltip and click
                        time: solve.time,
                        timeStr: solve.timeStr,
                        moves: solve.moves,
                        movesStr: solve.movesStr,
                        tps: solve.tps,
                        tpsStr: solve.tpsStr,
                        rowIndex: solve.rowIndex
                    });
                });

                chronologicalData.sort((a, b) => a.solveId - b.solveId);

                const chartLabels = chronologicalData.map(d => `${d.solveId}`);
                const chartValues = chronologicalData.map(d => d.y);

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
                                legend: { display: false },
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
                                            } else if (category === 'moves') {
                                                return `${categoryDisplay}: ${Math.round(value)}`;
                                            } else {
                                                return `${categoryDisplay}: ${value.toFixed(3)}`;
                                            }
                                        },
                                        afterLabel: function (context) {
                                            const index = context.dataIndex;
                                            const dataPoint = chronologicalData[index];
                                            const lines = [];
                                            // Add extra info based on current category
                                            if (category === 'time') {
                                                lines.push(`Moves: ${dataPoint.movesStr}`);
                                                lines.push(`TPS: ${dataPoint.tpsStr}`);
                                            } else if (category === 'moves') {
                                                const timeVal = dataPoint.time;
                                                if (timeVal >= 60) {
                                                    const mins = Math.floor(timeVal / 60);
                                                    const secs = (timeVal % 60).toFixed(3);
                                                    lines.push(`Time: ${mins}:${secs.padStart(6, '0')}`);
                                                } else {
                                                    lines.push(`Time: ${timeVal.toFixed(3)}`);
                                                }
                                                lines.push(`TPS: ${dataPoint.tpsStr}`);
                                            } else { // tps
                                                const timeVal = dataPoint.time;
                                                if (timeVal >= 60) {
                                                    const mins = Math.floor(timeVal / 60);
                                                    const secs = (timeVal % 60).toFixed(3);
                                                    lines.push(`Time: ${mins}:${secs.padStart(6, '0')}`);
                                                } else {
                                                    lines.push(`Time: ${timeVal.toFixed(3)}`);
                                                }
                                                lines.push(`Moves: ${dataPoint.movesStr}`);
                                            }
                                            return lines;
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
                                    font: { size: 12, weight: 'normal' },
                                    padding: { top: 2, bottom: 2, left: 4, right: 4 },
                                    borderRadius: 3,
                                    formatter: function (value, context) {
                                        const total = context.chart.data.datasets[0].data.length;
                                        if (total <= 25) {
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
                                            return '';
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: { color: 'rgba(80, 80, 80, 0.3)' },
                                    ticks: {
                                        color: '#aaa',
                                        font: { size: 9, family: 'monospace' },
                                        maxRotation: 0,
                                        autoSkip: true,
                                        autoSkipPadding: 20
                                    }
                                },
                                y: {
                                    grid: { color: 'rgba(80, 80, 80, 0.3)' },
                                    ticks: {
                                        color: '#aaa',
                                        font: { size: 10, family: 'monospace' },
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
                                }
                            },
                            layout: { padding: { top: 20, left: 30, right: 30 } },
                            onClick: function (e, elements, chart) {
                                const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                                if (points.length) {
                                    const index = points[0].index;
                                    const dataPoint = chronologicalData[index];
                                    if (dataPoint.rowIndex !== undefined) {
                                        // Find and click the corresponding table row
                                        const tables = document.querySelectorAll('.session-statistics-table');
                                        const targetTable = useDetailsForStats ? tables[1] : tables[0];
                                        if (targetTable) {
                                            const tbody = targetTable.querySelector('tbody');
                                            if (tbody) {
                                                const rows = tbody.querySelectorAll('tr');
                                                if (rows[dataPoint.rowIndex]) {
                                                    rows[dataPoint.rowIndex].click();
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }

            if (shouldShowHistogram) {
                const sessionAvg = values.reduce((a, b) => a + b, 0) / values.length;
                const binSize = calculateBinSize(sessionAvg, category);

                const { bins, counts, outliers } = calculateBins(values, binSize, category);

                const binLabels = bins.map(b => {
                    if (category === 'time') {
                        if (binSize < 0.1) return b.toFixed(2);
                        if (binSize < 1) return b.toFixed(1);
                        return Math.round(b).toString();
                    } else if (category === 'moves') {
                        return Math.round(b).toString();
                    } else {
                        if (binSize < 0.1) return b.toFixed(2);
                        if (binSize < 0.5) return b.toFixed(1);
                        return Math.round(b).toString();
                    }
                });

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

                if (outliers.low > 0) {
                    const threshold = bins[0];
                    binLabels.unshift(`< ${formatThreshold(threshold)}`);
                    counts.unshift(outliers.low);
                }
                if (outliers.high > 0) {
                    const threshold = bins[bins.length - 1] + binSize;
                    binLabels.push(`> ${formatThreshold(threshold)}`);
                    counts.push(outliers.high);
                }

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
                            layout: { padding: { top: 30 } },
                            plugins: {
                                legend: { display: false },
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
                                    font: { size: 9, weight: 'bold' },
                                    formatter: function (value) {
                                        return value > 0 ? value : '';
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    grid: { color: 'rgba(80, 80, 80, 0.3)' },
                                    ticks: { color: '#aaa', maxRotation: 45, font: { size: 9 } },
                                    min: 0
                                },
                                y: {
                                    grid: { color: 'rgba(80, 80, 80, 0.3)' },
                                    ticks: {
                                        color: '#aaa',
                                        font: { size: 10 },
                                        stepSize: 1,
                                        callback: function (value) {
                                            if (Math.floor(value) === value) return value;
                                            return '';
                                        }
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

        function destroyOverlay() {
            if (overlay) {
                overlay.remove();
                overlay = null;
                iframe = null;
                isIframeReady = false;
            }
        }

        function destroyCalculator() {
            if (calculatorContainer) {
                calculatorContainer.remove();
                calculatorContainer = null;
            }
            if (currentWorker) {
                currentWorker.terminate();
                currentWorker = null;
            }
        }

        function toggleGraphs(show) {
            const graphsContainer = document.querySelector('#avgs-graphs-container');
            if (show) {
                if (graphsContainer) {
                    graphsContainer.style.display = '';
                    calculatorContainer?.classList.remove('no-graphs');
                }
                setTimeout(() => calculateAvgs?.(), 50);
            } else {
                if (graphsContainer) {
                    graphsContainer.style.display = 'none';
                    calculatorContainer?.classList.add('no-graphs');
                }
            }
        }

        function toggleCalculator(show) {
            if (show) {
                if (calculatorContainer) {
                    calculatorContainer.style.display = '';
                } else {
                    handleCalculateOrClick?.();
                }
            } else {
                if (calculatorContainer) {
                    calculatorContainer.style.display = 'none';
                }
            }
        }

        function toggleOverlay(show) {
            if (show) {
                const replaysActive = settings.statsReplays?.getValue() !== false;
                if (overlay) {
                    overlay.style.display = '';
                }
                addSolveRowListeners();
            } else {
                if (overlay) {
                    overlay.style.display = 'none';
                }
                document.querySelector('#closeReplayBtn')?.click();
            }
        }

        function startStats() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'q' || e.key === 'Q') {
                    setTimeout(observeTables, 10);
                }
            });
        }

        return {
            startStats,
            destroyOverlay,
            destroyCalculator,
            destroyCharts,
            toggleGraphs,
            toggleCalculator,
            toggleOverlay
        };
    }

    function waitForElements(selectors, callback) {
        if (selectors.every(s => document.querySelector(s))) {
            callback();
            return;
        }

        const observer = new MutationObserver(() => {
            if (selectors.every(s => document.querySelector(s))) {
                observer.disconnect();
                callback();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForElements(['.filler', '.header'], initStats);

    function parsePuzzleToNumberMatrix() {
        const puzzle = document.querySelector('.puzzle');
        if (!puzzle) return null;

        const pieces = Array.from(puzzle.querySelectorAll('.piece')).map(p => ({
            left: parseInt(p.style.left) || 0,
            top: parseInt(p.style.top) || 0,
            value: parseInt(p.querySelector('.text')?.textContent?.trim()) || 0
        }));

        const leftValues = [...new Set(pieces.map(p => p.left))].sort((a, b) => a - b);
        const topValues = [...new Set(pieces.map(p => p.top))].sort((a, b) => a - b);

        const matrix = Array(topValues.length).fill().map(() => Array(leftValues.length).fill(0));

        pieces.forEach(piece => {
            const col = leftValues.indexOf(piece.left);
            const row = topValues.indexOf(piece.top);
            matrix[row][col] = piece.value;
        });

        return matrix;
    }
    function puzzleIsSolved(matrix) {
        if (!matrix || matrix.length === 0) return false;

        const flatNumbers = matrix.flat();
        const nonZeroNumbers = flatNumbers.filter(num => num !== 0);

        for (let i = 1; i < nonZeroNumbers.length; i++) {
            if (nonZeroNumbers[i] <= nonZeroNumbers[i - 1]) {
                return false;
            }
        }

        return true;
    }

    function parseTimeToSecondsSorting(timeStr) {
        if (!timeStr) return 0;
        if (timeStr === 'DNF') return DNF_TIME;

        timeStr = timeStr.trim();

        // Check if it contains colons (time format like 1:00.543 or 1:02.065)
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');

            if (parts.length === 3) {
                // Format: hours:minutes:seconds (e.g., 1:02:05.123)
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                const seconds = parseFloat(parts[2]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            } else if (parts.length === 2) {
                // Format: minutes:seconds (e.g., 1:00.543)
                const minutes = parseInt(parts[0]) || 0;
                const seconds = parseFloat(parts[1]) || 0;
                return minutes * 60 + seconds;
            }
        }

        const parsed = parseFloat(timeStr);
        return isNaN(parsed) ? DNF_TIME : parsed;
    }

    let currentlySorting = false;
    function sortTable(table, columnIndex, forceDirection = null) {
        currentlySorting = true;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const headers = table.querySelectorAll('th');

        const headerText = headers[columnIndex].textContent.trim();
        let newDirection;

        if (forceDirection) {
            newDirection = forceDirection;
        } else {
            const currentDirection = table.getAttribute(`data-sort-direction-${columnIndex}`);
            if (!currentDirection) {
                if (headerText === 'TPS' || headerText === 'Solve') {
                    newDirection = 'desc';
                } else {
                    newDirection = 'asc';
                }
            } else {
                newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            }
        }

        for (let i = 0; i < headers.length; i++) {
            table.removeAttribute(`data-sort-direction-${i}`);
        }

        table.setAttribute(`data-sort-direction-${columnIndex}`, newDirection);

        rows.sort((a, b) => {
            const cellA = a.querySelectorAll('td')[columnIndex];
            const cellB = b.querySelectorAll('td')[columnIndex];

            let valueA = cellA.textContent.trim();
            let valueB = cellB.textContent.trim();

            let compareResult;

            if (headerText === 'Time') {
                const timeA = parseTimeToSecondsSorting(valueA);
                const timeB = parseTimeToSecondsSorting(valueB);
                compareResult = timeA - timeB;
            } else if (headerText === 'Solve' || headerText === 'Moves' || headerText === 'Optimals') {
                valueA = parseInt(valueA) || DNF_MOVES;
                valueB = parseInt(valueB) || DNF_MOVES;
                compareResult = valueA - valueB;
            } else if (headerText === 'TPS') {
                const toNumber = (val) => {
                    if (val === '∞') return Infinity;
                    const num = parseFloat(val);
                    return isNaN(num) ? DNF_TPS_BAD : num;
                };
                valueA = toNumber(valueA);
                valueB = toNumber(valueB);
                compareResult = valueA - valueB;
            } else if (headerText === 'Timestamp') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
                compareResult = valueA - valueB;
            } else {
                const numA = parseFloat(valueA);
                const numB = parseFloat(valueB);
                if (!isNaN(numA) && !isNaN(numB) && valueA !== '' && valueB !== '') {
                    compareResult = numA - numB;
                } else {
                    compareResult = valueA.localeCompare(valueB);
                }
            }

            return newDirection === 'asc' ? compareResult : -compareResult;
        });

        rows.forEach(row => tbody.appendChild(row));
        setTimeout(() => {
            currentlySorting = false;
        }, 0);
    }

    function addSortingListeners(table) {
        if (!table) return;
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            if (index === headers.length - 1) return; // Skip the last header
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            newHeader.addEventListener('click', () => sortTable(table, index));
        });
    }

    function makeTableSortable(table) {
        if (!table) return;

        // Check if table already has sorting enabled
        if (table.hasAttribute('data-sortable')) return;

        // Mark table as sortable
        table.setAttribute('data-sortable', 'true');

        const headers = table.querySelectorAll('th');

        headers.forEach((header, index) => {
            if (index === headers.length - 1) return; // Skip the last header
            header.style.cursor = 'pointer';
            header.title = `Click to sort by ${header.textContent.trim()}`;
        });
        //addSortingListeners(table);
    }

    function swapSessionElements() {
        const sessionsHeader = document.querySelector('.sessions-header');
        if (!sessionsHeader) return;

        if (sessionsHeader.children[0].tagName.toLowerCase() === 'button') return;

        const paddedDiv = sessionsHeader.querySelector('.padded');
        const button = sessionsHeader.querySelector('button');

        sessionsHeader.insertBefore(button, sessionsHeader.firstChild);
        sessionsHeader.appendChild(paddedDiv);
    }

    const liveSolvesData = [];

    // LIVE SESSION CODE

    // ---------- Helper: parse complex time string to milliseconds ----------
    function parseTimeToMs(timeStr) {
        if (!timeStr || timeStr === 'DNF' || timeStr === '—') return null;
        const parts = timeStr.trim().split(':');
        if (parts.length > 3) return null;

        let seconds = 0;
        let minutes = 0;
        let hours = 0;

        if (parts.length === 1) {
            seconds = parseFloat(parts[0]);
        } else if (parts.length === 2) {
            minutes = parseInt(parts[0], 10);
            seconds = parseFloat(parts[1]);
        } else if (parts.length === 3) {
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
            seconds = parseFloat(parts[2]);
        }

        if (isNaN(seconds)) return null;
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    // ---------- Global bests for each (key, metric) ----------
    const BEST_KEYS = [1, 5, 12, 25, 50, 100];
    const bestValues = {};

    function resetBestValues() {
        BEST_KEYS.forEach(k => {
            bestValues[k] = {
                timeMs: Infinity,
                moves: Infinity,
                tps: -Infinity
            };
        });
    }
    resetBestValues();

    /**
     * Scan existing liveSolvesData and set the bestValues thresholds
     * (Does NOT mark old solves as PB – only future solves are checked.)
     */
    function computeInitialBestFromHistory() {
        if (!liveSolvesData.length) return;
        for (const solve of liveSolvesData) {
            for (const k of BEST_KEYS) {
                const data = solve[k];
                if (!data || !data.timeMs) continue; // skip incomplete solves
                if (data.timeMs !== null && data.timeMs < bestValues[k].timeMs) {
                    bestValues[k].timeMs = data.timeMs;
                }
                if (data.movesNum !== null && data.movesNum < bestValues[k].moves) {
                    bestValues[k].moves = data.movesNum;
                }
                if (data.tpsNum !== null && data.tpsNum > bestValues[k].tps) {
                    bestValues[k].tps = data.tpsNum;
                }
            }
        }
    }

    /**
     * Create a solve object from the current stats-grid-container table.
     * Returns null if container not found.
     */
    function getSolveFromTable() {
        const container = document.querySelector('.stats-grid-container');
        if (!container) return null;

        const rows = container.querySelectorAll('tr');
        const rowKeys = [1, 5, 12, 25, 50, 100];
        const solve = { timestamp: Date.now() };

        let keyIndex = 0;
        let lastHeader = null;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (!cells[0]) return null;
            lastHeader = cells[0].textContent.trim();

            if (keyIndex >= rowKeys.length) return;

            const timeText = cells[1].textContent.trim() || 'DNF';
            const movesText = cells[2].textContent.trim() || 'DNF';
            const tpsText = cells[3].textContent.trim() || 'DNF';

            const timeMs = parseTimeToMs(timeText);
            const movesNum = (movesText === 'DNF' || movesText === '—') ? null : parseFloat(movesText);
            const tpsNum = (tpsText === 'DNF' || tpsText === '—') ? null : (tpsText === '∞' ? Infinity : parseFloat(tpsText));

            solve[rowKeys[keyIndex]] = {
                timeText,
                timeMs,
                movesNum: isNaN(movesNum) ? null : movesNum,
                tpsNum: isNaN(tpsNum) ? null : tpsNum,
                pbtime: false,
                pbmoves: false,
                pbtps: false
            };

            keyIndex++;
        });

        if (lastHeader) {
            solve.solveCounter = parseInt(lastHeader.replace(/\D/g, '')) || null;
        }

        const sessionName = document.querySelector('.session-name');
        if (sessionName) {
            solve.session = sessionName.textContent.trim();
        }

        return solve;
    }

    function solveFromSameSession(solve) {
        if (!solve || !liveSolvesData.length) return false;
        const last = liveSolvesData[liveSolvesData.length - 1];
        if (!last) return false;
        if (solve.session !== last.session) return false;

        for (const k of [5, 12, 25, 50, 100]) {
            const a = solve[k], b = last[k];
            if (!a || !b) return false;
            if (a.timeText !== b.timeText) return false;
            if (a.movesNum !== b.movesNum) return false;
            if (a.tpsNum !== b.tpsNum) return false;
        }
        return solve.solveCounter === last.solveCounter;
    }
    function clearLiveTable() {
        if (liveStats?.tbody) {
            liveStats.tbody.textContent = '';
            const headerEl = document.getElementById('solveCountHeader');
            if (headerEl) headerEl.textContent = '0';
        }
    }

    function trackSolve(solve) {
        const totalSolves = liveSolvesData.length + 1; // +1 for the solve about to be added

        for (const k of BEST_KEYS) {
            if (k > totalSolves) continue; // Not enough solves for this aoN to be valid

            const data = solve[k];
            if (!data) continue;

            // Time PB (lower is better)
            if (data.timeMs !== null && data.timeMs < bestValues[k].timeMs) {
                bestValues[k].timeMs = data.timeMs;
                data.pbtime = true;
            }
            // Moves PB (lower is better)
            if (data.movesNum !== null && data.movesNum < bestValues[k].moves) {
                bestValues[k].moves = data.movesNum;
                data.pbmoves = true;
            }
            // TPS PB (higher is better)
            if (data.tpsNum !== null && data.tpsNum > bestValues[k].tps) {
                bestValues[k].tps = data.tpsNum;
                data.pbtps = true;
            }
        }
        liveSolvesData.push(solve);
        if (liveStats && liveStats.tbody) {
            appendSolveRow(liveStats.tbody, solve, BEST_KEYS);
        }
        const headerEl = document.getElementById('solveCountHeader');
        if (headerEl) headerEl.textContent = liveSolvesData.length;
    }

    // ---------- Live stats container creation ----------
    function createLiveStatsContainer(parent = document.body) {
        const container = document.createElement('div');
        container.className = 'live-stats-container';
        container.id = 'liveStatsContainer';

        const handle = document.createElement('div');
        handle.className = 'live-resize-handle';

        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'live-table-wrapper';

        const table = document.createElement('table');
        table.className = 'live-table';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        tbody.id = 'liveTableBody';
        const colgroup = document.createElement('colgroup');

        const ONECELL = 60;
        const rowKeys = BEST_KEYS;
        const averageKeys = rowKeys.filter(k => k !== 1);
        const metricGroups = [
            { key: 'time', label: 'Time averages' },
            { key: 'moves', label: 'Moves averages' },
            { key: 'tps', label: 'TPS averages' }
        ];
        const totalColumns = 2 + 3 + (averageKeys.length * metricGroups.length);
        const GROUP_BORDER_WIDTH = 3;
        const groupStartColumns = [
            2,
            2 + 3,
            2 + 3 + averageKeys.length,
            2 + 3 + (averageKeys.length * 2)
        ];
        const groupColumnEdges = [
            2 + 3,
            2 + 3 + averageKeys.length,
            2 + 3 + (averageKeys.length * 2)
        ];
        const timeColWidth = ONECELL;
        const statColWidth = ONECELL;

        const colTime = document.createElement('col');
        colTime.style.width = timeColWidth + 'px';
        colgroup.appendChild(colTime);

        const colNum = document.createElement('col');
        colNum.style.width = statColWidth + 'px';
        colgroup.appendChild(colNum);

        for (let i = 2; i < totalColumns; i++) {
            const col = document.createElement('col');
            col.style.width = statColWidth + 'px';
            colgroup.appendChild(col);
        }

        table.appendChild(colgroup);
        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        container.appendChild(handle);
        container.appendChild(tableWrapper);

        function buildHeader() {
            const groupRow = document.createElement('tr');
            const labelRow = document.createElement('tr');

            const addGroupHeader = (label, span, className = '') => {
                const th = document.createElement('th');
                th.textContent = label;
                th.colSpan = span;
                if (className) th.classList.add(...className.split(' '));
                groupRow.appendChild(th);
            };

            const addColumnHeader = (label, className = '') => {
                const th = document.createElement('th');
                th.textContent = label;
                if (className) th.classList.add(...className.split(' '));
                labelRow.appendChild(th);
                return th;
            };

            addGroupHeader('Solve #', 2);
            addColumnHeader('HH:MM');
            const thNum = addColumnHeader(liveSolvesData.length);
            thNum.id = 'solveCountHeader';

            addGroupHeader('Single', 3, 'live-group-start');
            ['Time', 'Moves', 'TPS'].forEach((label, index) => {
                addColumnHeader(label, index === 0 ? 'live-group-start' : '');
            });

            metricGroups.forEach(({ key, label }) => {
                addGroupHeader(label, averageKeys.length, 'live-group-start');
                averageKeys.forEach((k, index) => {
                    addColumnHeader(`ao${k}`, index === 0 ? `live-group-start live-${key}-group` : '');
                });
            });
            thead.innerHTML = '';
            thead.appendChild(groupRow);
            thead.appendChild(labelRow);
        }
        buildHeader();

        const totalTableWidth = ONECELL * (totalColumns + 1); //safety margin
        table.style.width = totalTableWidth + 'px';
        //table.style.minWidth = totalTableWidth + 'px';

        const snapOffset = 30;
        const snapTargets = groupColumnEdges.map(cols => {
            const visibleGroupBorders = groupStartColumns.filter(startCol => startCol <= cols).length;
            return (cols * ONECELL) + snapOffset + (visibleGroupBorders * GROUP_BORDER_WIDTH);
        });
        const initialVisibleWidth = (2 + 3) * ONECELL + 10;
        container.style.width = initialVisibleWidth + 20 + 'px';
        container.style.maxHeight = '100vh';

        let startX, startWidth;
        handle.addEventListener('pointerdown', e => {
            e.preventDefault();
            handle.setPointerCapture?.(e.pointerId);
            startX = e.clientX;
            startWidth = container.offsetWidth;
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerUp);
        });

        function onPointerMove(e) {
            const dx = startX - e.clientX;
            let newWidth = startWidth + dx;
            newWidth = Math.max(10, Math.min(ONECELL * (totalColumns + 1), newWidth));  //safety margin
            let containerW = newWidth;
            if (containerW > 10) {
                containerW = containerW + 20;
            }

            // Snap to group edges when within 15px range
            const snapRange = 15;
            const snapTarget = snapTargets.find(target => Math.abs(containerW - target) <= snapRange);
            if (snapTarget !== undefined) {
                containerW = snapTarget;
            }

            container.style.width = containerW + 'px';

            // Hide scrollbar when width is 10px or less
            if (containerW <= 10) {
                tableWrapper.style.overflowY = 'hidden';
            } else {
                tableWrapper.style.overflowY = 'auto';
            }

            const statsPanel = document.querySelector('.standard-stats-panel');
            if (statsPanel) {
                statsPanel.style.right = containerW + 'px';
                statsPanel.style.setProperty('right', containerW + 'px', 'important');
            }
        }

        function onPointerUp(e) {
            handle.releasePointerCapture?.(e.pointerId);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointercancel', onPointerUp);
        }

        parent.appendChild(container);

        return {
            container,
            tbody,
            update: () => updateLiveStatsTable(tbody, rowKeys)
        };
    }

    function createInterleavedSolveRow(solve, rowKeys, totalSolves, isNewest) {
        const tr = document.createElement('tr');
        const d = new Date(solve.timestamp);
        const timeStr = d.getHours().toString().padStart(2, '0') + ':' +
            d.getMinutes().toString().padStart(2, '0');

        const tdTime = document.createElement('td');
        tdTime.textContent = timeStr;
        tr.appendChild(tdTime);

        const tdNum = document.createElement('td');
        tdNum.textContent = solve.solveCounter;
        tr.appendChild(tdNum);

        rowKeys.forEach(k => {
            const data = solve[k];
            if (!data) {
                for (let j = 0; j < 3; j++) {
                    const td = document.createElement('td');
                    td.textContent = '—';
                    tr.appendChild(td);
                }
                return;
            }

            const cellValues = [data.timeText, data.movesNum, data.tpsNum === Infinity ? '∞' : data.tpsNum];
            const pbFlags = [data.pbtime, data.pbmoves, data.pbtps];

            for (let j = 0; j < 3; j++) {
                const td = document.createElement('td');
                let content = cellValues[j];
                if (content === null || content === undefined || content === 'DNF' || content === '—') {
                    content = '—';
                } else if (typeof content === 'number') {
                    content = Number.isInteger(content) ? content.toString() : content.toFixed(3);
                }
                td.textContent = content;

                if (isNewest && k > totalSolves) {
                    td.style.color = 'gray';
                } else if (pbFlags[j]) {
                    td.classList.add('pb-cell');
                }
                tr.appendChild(td);
            }
        });

        return tr;
    }

    function createOrderedSolveRow(solve, rowKeys, totalSolves, isNewest) {
        const tr = document.createElement('tr');
        const d = new Date(solve.timestamp);
        const timeStr = d.getHours().toString().padStart(2, '0') + ':' +
            d.getMinutes().toString().padStart(2, '0');

        const tdTime = document.createElement('td');
        tdTime.textContent = timeStr;
        tr.appendChild(tdTime);

        const tdNum = document.createElement('td');
        tdNum.textContent = solve.solveCounter;
        tr.appendChild(tdNum);

        const appendStatCell = (value, isPb, isUnavailable, className) => {
            const td = document.createElement('td');
            if (className) td.classList.add(className);

            let content = value;
            if (content === null || content === undefined || content === 'DNF' || content === '—') {
                content = '—';
            } else if (typeof content === 'number') {
                content = Number.isInteger(content) ? content.toString() : content.toFixed(3);
            }
            td.textContent = content;

            if (isUnavailable) {
                td.style.color = 'gray';
            } else if (isPb) {
                td.classList.add('pb-cell');
            }
            tr.appendChild(td);
        };

        const appendMetricForKey = (k, metric, className = '') => {
            const data = solve[k];
            if (!data) {
                appendStatCell('—', false, false, className);
                return;
            }

            appendStatCell(
                metric.value(data),
                metric.pb(data),
                isNewest && k > totalSolves,
                className
            );
        };

        const metrics = [
            { value: data => data.timeText, pb: data => data.pbtime },
            { value: data => data.movesNum, pb: data => data.pbmoves },
            { value: data => data.tpsNum === Infinity ? '∞' : data.tpsNum, pb: data => data.pbtps }
        ];
        const averageKeys = rowKeys.filter(k => k !== 1);

        metrics.forEach((metric, index) => {
            appendMetricForKey(1, metric, index === 0 ? 'live-group-start' : '');
        });
        metrics.forEach(metric => {
            averageKeys.forEach((k, index) => {
                appendMetricForKey(k, metric, index === 0 ? 'live-group-start' : '');
            });
        });

        return tr;
    }

    function updateLiveStatsTable(tbody, rowKeys) {
        if (tbody.firstChild) return; // Already populated, use append instead

        const fragment = document.createDocumentFragment();
        for (let i = liveSolvesData.length - 1; i >= 0; i--) {
            fragment.appendChild(createOrderedSolveRow(liveSolvesData[i], rowKeys, liveSolvesData.length, false));
        }
        tbody.appendChild(fragment);
        const headerEl = document.getElementById('solveCountHeader');
        if (headerEl) headerEl.textContent = liveSolvesData.length;
    }

    function appendSolveRow(tbody, solve, rowKeys) {
        const totalSolves = liveSolvesData.length;
        tbody.insertBefore(createOrderedSolveRow(solve, rowKeys, totalSolves, true), tbody.firstChild);
    }

    let liveStats;

    /**
     * Initialise the live stats panel. Call this once after the page is ready.
     */
    function initLiveContainer() {
        const parent = document.querySelector('.standard-main-panel');
        if (!parent) return;
        if (parent.querySelector('.live-stats-container')) return;

        if (!parent.querySelector('.main-content')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'main-content';
            while (parent.firstChild) {
                wrapper.appendChild(parent.firstChild);
            }
            parent.appendChild(wrapper);
        }

        // Set best-value thresholds based on already captured solves
        computeInitialBestFromHistory();

        liveStats = createLiveStatsContainer(parent);
    }
    function resetPBStylesInStatsGrid() {
        const container = document.querySelector('.stats-grid-container');
        if (!container) return;

        container.querySelectorAll('td[column="time"], td[column="moves"], td[column="tps"]').forEach(cell => {
            cell.style.color = '';
            cell.style.fontWeight = '';
        });
    }
    function highlightPBsInStatsGrid() {
        const container = document.querySelector('.stats-grid-container');
        if (!container) return;

        const totalSolves = liveSolvesData.length;
        const keyMap = { '1': 1, '5': 5, '12': 12, '25': 25, '50': 50, '100': 100 };
        const metrics = [
            { col: 'time', parse: v => parseTimeToMs(v), isPB: (v, b) => v !== null && v <= b },
            { col: 'moves', parse: v => v === '∞' ? Infinity : parseFloat(v), isPB: (v, b) => !isNaN(v) && v <= b },
            { col: 'tps', parse: v => v === '∞' ? Infinity : parseFloat(v), isPB: (v, b) => !isNaN(v) && v >= b }
        ];

        container.querySelectorAll('tr').forEach(row => {
            const key = keyMap[row.getAttribute('avg')];
            if (!key || !bestValues[key]) return;
            if (key > totalSolves) return; // Not enough solves for this aoN

            metrics.forEach(({ col, parse, isPB }) => {
                const cell = row.querySelector(`td[column="${col}"]`);
                if (!cell) return;
                const val = parse(cell.textContent.trim());
                if (isPB(val, bestValues[key][col === 'tps' ? 'tps' : col === 'moves' ? 'moves' : 'timeMs'])) {
                    cell.style.color = 'cyan';
                    cell.style.fontWeight = 'bold';
                } else {
                    cell.style.color = '';
                    cell.style.fontWeight = '';
                }
            });
        });
    }

})();
