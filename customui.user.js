// ==UserScript==
// @name         SlidySim UI Customization
// @namespace    dphdmn
// @version      2.1.0
// @description  Customize SlidySim with background images, piece borders, font customization, grids border, base9, sound effects, and more
// @author       dphdmn
// @match        https://play.slidysim.com/*
// @icon data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-size="72">🎨</text></svg>
// @license      MIT
// @updateURL    https://update.greasyfork.org/scripts/575619/SlidySim%20UI%20Customization.user.js
// @downloadURL  https://update.greasyfork.org/scripts/575619/SlidySim%20UI%20Customization.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ==================== UTILITY FUNCTIONS ====================

    function resetAllSettings() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('slidysim_dph_script_')) {
                localStorage.removeItem(key);
            }
        });

        alert(
            "🔄 SlidySim settings reset!\n\n" +
            "Please refresh the page to apply default settings."
        );
    }

    // FIXED: Properly handle initial value display for all unit types
    function updateSliderDisplay(input, valueDisplay, config) {
        if (!valueDisplay) return;

        let value = parseFloat(input.value);
        const unit = config.unit || '';

        // Handle percent properly - multiply by 100 for display
        if (unit === '%') {
            value = Math.round(value * 100);
            valueDisplay.textContent = value + '%';
            return;
        }

        // Handle regular units
        if (unit === 'px') {
            value = Math.round(value);
        }

        valueDisplay.textContent = value + unit;
    }

    // Configuration factory for creating menu settings
    function createSetting(config) {
        const {
            id,
            label,
            type,
            defaultValue,
            storageKey,
            onChange,
            containerStyle = {},
            min,
            max,
            step,
            options,
            placeholder,
            checked
        } = config;

        const container = document.createElement('div');
        container.style.cssText = `
            display: ${type === 'hidden' ? 'none' : 'flex'};
            align-items: center;
            gap: 4px;
            margin-bottom: 6px;
            ${typeof containerStyle === 'string' ? containerStyle : ''}
        `;
        Object.assign(container.style, typeof containerStyle === 'object' ? containerStyle : {});

        const labelEl = document.createElement('span');
        labelEl.textContent = label + ':';
        labelEl.style.cssText = `
            color: #ccc;
            font-size: 11px;
            min-width: 70px;
        `;
        container.appendChild(labelEl);

        let input, valueDisplay;

        switch(type) {
            case 'slider':
                input = document.createElement('input');
                input.type = 'range';
                input.min = min;
                input.max = max;
                input.step = step;
                // FIXED: Parse the stored value as float, fallback to default
                const storedValue = localStorage.getItem(storageKey);
                input.value = storedValue !== null ? storedValue : defaultValue;
                input.style.cssText = `
                    width: 200px;
                    height: 4px;
                    cursor: pointer;
                `;

                valueDisplay = document.createElement('span');
                valueDisplay.style.cssText = `
                    color: #ccc;
                    font-size: 11px;
                    min-width: 35px;
                `;

                // FIXED: Ensure display is updated on creation
                updateSliderDisplay(input, valueDisplay, config);

                input.addEventListener('input', () => {
                    updateSliderDisplay(input, valueDisplay, config);
                    // Store the raw value (0-1 for percentages)
                    localStorage.setItem(storageKey, input.value);
                    if (onChange) onChange(input.value);
                });

                container.appendChild(input);
                container.appendChild(valueDisplay);
                break;

            case 'color':
                input = document.createElement('input');
                input.type = 'color';
                const storedColor = localStorage.getItem(storageKey);
                input.value = storedColor || defaultValue;
                input.style.cssText = `
                    width: 24px;
                    height: 20px;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    background: none;
                `;

                input.addEventListener('input', () => {
                    localStorage.setItem(storageKey, input.value);
                    if (onChange) onChange(input.value);
                });

                container.appendChild(input);
                break;

            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = id;
                // Handle both 'false' string and null/undefined
                const storedChecked = localStorage.getItem(storageKey);
                input.checked = storedChecked === null ? (checked !== undefined ? checked : true) : storedChecked !== 'false';
                input.style.cssText = `
                    width: 14px;
                    height: 14px;
                    cursor: pointer;
                    margin: 0;
                `;

                input.addEventListener('change', () => {
                    localStorage.setItem(storageKey, input.checked);
                    if (onChange) onChange(input.checked);
                });

                container.appendChild(input);
                break;

            case 'select':
                input = document.createElement('select');
                input.style.cssText = `
                    background: #1e1e1e;
                    border: 1px solid #333;
                    color: #eaeaea;
                    padding: 4px 6px;
                    font-size: 11px;
                    border-radius: 4px;
                    width: 200px;
                    cursor: pointer;
                    outline: none;
                    transition: border 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
                `;

                input.onfocus = () => {
                    input.style.border = '1px solid #666';
                    input.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.1)';
                };

                input.onblur = () => {
                    input.style.border = '1px solid #333';
                    input.style.boxShadow = 'none';
                };

                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    input.appendChild(option);
                });

                const storedSelect = localStorage.getItem(storageKey);
                input.value = storedSelect || defaultValue;

                input.addEventListener('change', () => {
                    localStorage.setItem(storageKey, input.value);
                    if (onChange) onChange(input.value);
                });

                container.appendChild(input);
                break;

            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.placeholder = placeholder || '';
                const storedText = localStorage.getItem(storageKey);
                input.value = storedText || defaultValue;
                input.style.cssText = `
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 2px 4px;
                    font-size: 11px;
                    border-radius: 3px;
                    width: 120px;
                `;

                input.addEventListener('input', () => {
                    localStorage.setItem(storageKey, input.value);
                    if (onChange) onChange(input.value);
                });

                container.appendChild(input);
                break;
        }

        return {
            container,
            input,
            getValue: () => {
                if (type === 'checkbox') return input.checked;
                return input.value;
            },
            setValue: (val) => {
                if (type === 'checkbox') {
                    input.checked = val;
                } else {
                    input.value = val;
                }
                localStorage.setItem(storageKey, val);
                if (onChange) onChange(val);
                // Update display for sliders
                if (type === 'slider' && valueDisplay) {
                    updateSliderDisplay(input, valueDisplay, config);
                }
            }
        };
    }

    // IndexedDB setup
    const DB_NAME = 'SlidySimBG';
    const DB_VERSION = 1;
    const STORE_NAME = 'backgrounds';
    const BG_KEY = 'custom_bg';

    let db = null;
    let currentBlobUrl = null;

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

    // ==================== UI CREATION ====================

    const controls = document.createElement('div');
    controls.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 12px;
        position: relative;
    `;

    const dropdownBtn = document.createElement('button');
    dropdownBtn.textContent = '🖼️';
    dropdownBtn.title = 'Settings';
    dropdownBtn.style.cssText = `
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
    `;

    const dropdownMenu = document.createElement('div');
    dropdownMenu.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        padding: 8px;
        min-width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 10000;
        margin-top: 4px;
    `;

    // Upload/Remove buttons
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = '📁 Upload Background';
    uploadBtn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        border-radius: 3px;
        width: 100%;
        margin-bottom: 8px;
    `;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️ Remove Background';
    removeBtn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        border-radius: 3px;
        width: 100%;
        margin-bottom: 8px;
        display: none;
    `;

    // Section helper
    function createSectionLabel(text, marginTop = '6px') {
        const label = document.createElement('div');
        label.textContent = text;
        label.style.cssText = `
            color: #999;
            font-size: 14px;
            font-weight: bold;
            margin-top: ${marginTop};
            margin-bottom: 6px;
        `;
        return label;
    }

    // Create all settings using the factory
    const settings = {};

    // Background dim
    const bgDimSetting = createSetting({
        id: 'bg-dim',
        label: 'Background',
        type: 'slider',
        defaultValue: '0.5',
        storageKey: 'slidysim_dph_script_bg_dim',
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

    // Puzzle dim
    const puzzleDimSetting = createSetting({
        id: 'puzzle-dim',
        label: 'Puzzle',
        type: 'slider',
        defaultValue: '1',
        storageKey: 'slidysim_dph_script_puzzle_dim',
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => applyPuzzleDim(parseFloat(val))
    });
    settings.puzzleDim = puzzleDimSetting;

    // UI opacity
    const uiOpacitySetting = createSetting({
        id: 'ui-opacity',
        label: 'UI',
        type: 'slider',
        defaultValue: '0.8',
        storageKey: 'slidysim_dph_script_ui_opacity',
        unit: '%',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => applyUIOpacity(parseFloat(val))
    });
    settings.uiOpacity = uiOpacitySetting;

    // NEW: Puzzle container left position slider
    const puzzleLeftSetting = createSetting({
        id: 'puzzle-left',
        label: 'Puzzle Left',
        type: 'slider',
        defaultValue: '-125',
        storageKey: 'slidysim_dph_script_puzzle_left',
        unit: 'px',
        min: '-500',
        max: '500',
        step: '1',
        onChange: (val) => applyPuzzlePosition()
    });
    settings.puzzleLeft = puzzleLeftSetting;

    // NEW: Puzzle container right position slider
    const puzzleTopSetting = createSetting({
        id: 'puzzle-top',
        label: 'Puzzle Top',
        type: 'slider',
        defaultValue: '0',
        storageKey: 'slidysim_dph_script_puzzle_top',
        unit: 'px',
        min: '-500',
        max: '500',
        step: '1',
        onChange: (val) => applyPuzzlePosition()
    });
    settings.puzzleTop = puzzleTopSetting;

    // Border width
    const borderWidthSetting = createSetting({
        id: 'border-width',
        label: 'Border',
        type: 'slider',
        defaultValue: '0',
        storageKey: 'slidysim_dph_script_border_width',
        unit: 'px',
        min: '0',
        max: '5',
        step: '1',
        onChange: (val) => applyBorder(parseInt(val), settings.borderColor.getValue())
    });
    settings.borderWidth = borderWidthSetting;

    // Border color
    const borderColorSetting = createSetting({
        id: 'border-color',
        label: '',
        type: 'color',
        defaultValue: '#000000',
        storageKey: 'slidysim_dph_script_border_color',
        onChange: (val) => applyBorder(parseInt(settings.borderWidth.getValue()), val)
    });
    settings.borderColor = borderColorSetting;
    borderWidthSetting.container.appendChild(borderColorSetting.input);

    // Grids border width
    const gridsBorderWidthSetting = createSetting({
        id: 'grids-border-width',
        label: 'Grids Border',
        type: 'slider',
        defaultValue: '0',
        storageKey: 'slidysim_dph_script_grids_border_width',
        unit: 'px',
        min: '0',
        max: '4',
        step: '1',
        onChange: (val) => applyGridsBorder(parseInt(val), settings.gridsBorderColor.getValue())
    });
    settings.gridsBorderWidth = gridsBorderWidthSetting;

    // Grids border color
    const gridsBorderColorSetting = createSetting({
        id: 'grids-border-color',
        label: '',
        type: 'color',
        defaultValue: '#000000',
        storageKey: 'slidysim_dph_script_grids_border_color',
        onChange: (val) => applyGridsBorder(parseInt(settings.gridsBorderWidth.getValue()), val)
    });
    settings.gridsBorderColor = gridsBorderColorSetting;
    gridsBorderWidthSetting.container.appendChild(gridsBorderColorSetting.input);

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

    const allFonts = [
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

    const fontOptions = [
        { value: 'custom', label: 'Custom...' },
        { value: 'inherit', label: 'Default' },
        ...allFonts
        .filter(font => isFontAvailable(font))
        .map(font => ({ value: font, label: font }))
    ];

    // Font family
    const fontFamilySetting = createSetting({
        id: 'font-family',
        label: 'Font Family',
        type: 'select',
        defaultValue: 'inherit',
        storageKey: 'slidysim_dph_script_font_family',
        options: fontOptions,
        onChange: (val) => {
            if (val === 'custom') {
                const customFont = prompt('Enter font family name: (it must exist on your system, otherwise default will be loaded)', localStorage.getItem('slidysim_dph_script_font_family_custom') || 'Arial');
                if (customFont) {
                    localStorage.setItem('slidysim_dph_script_font_family_custom', customFont);
                    applyFontFamily(customFont);
                } else {
                    fontFamilySetting.setValue('inherit');
                    localStorage.setItem('slidysim_dph_script_font_family', 'inherit');
                    applyFontFamily('inherit');
                }
            } else {
                applyFontFamily(val);
            }
        }
    });
    settings.fontFamily = fontFamilySetting;

    // Font size
    const fontSizeSetting = createSetting({
        id: 'font-size',
        label: 'Font Size',
        type: 'slider',
        defaultValue: '30',
        storageKey: 'slidysim_dph_script_font_size',
        unit: 'px',
        min: '10',
        max: '50',
        step: '1',
        onChange: (val) => applyFontSize(parseInt(val))
    });
    settings.fontSize = fontSizeSetting;

    // Bold toggle
    const boldSetting = createSetting({
        id: 'bold',
        label: 'Bold',
        type: 'checkbox',
        defaultValue: false,
        storageKey: 'slidysim_dph_script_bold',
        onChange: (val) => applyBold(val)
    });
    settings.bold = boldSetting;

    // Inactive grids brightness
    const inactiveBrightnessSetting = createSetting({
        id: 'inactive-brightness',
        label: 'Inactive Brightness',
        type: 'slider',
        defaultValue: '0.3',
        storageKey: 'slidysim_dph_script_inactive_brightness',
        unit: '',
        min: '0',
        max: '1',
        step: '0.01',
        onChange: (val) => applyInactiveBrightness(parseFloat(val))
    });
    settings.inactiveBrightness = inactiveBrightnessSetting;

    // Base 9 toggle
    const base9Setting = createSetting({
        id: 'base9',
        label: 'Base 9 for 9x9',
        type: 'checkbox',
        defaultValue: true,
        storageKey: 'slidysim_dph_script_base9',
        onChange: (val) => {
            if (val) {
                convertBase9();
            }
        }
    });
    settings.base9 = base9Setting;

    // Sound enable toggle
    const soundEnableSetting = createSetting({
        id: 'sound-enable',
        label: 'Sound',
        type: 'checkbox',
        defaultValue: true,
        storageKey: 'slidysim_dph_script_sound_enabled',
        onChange: (val) => {
            if (val) {
                initSound();
            }
        }
    });
    settings.soundEnable = soundEnableSetting;


    // Sound volume
    const soundVolumeSetting = createSetting({
        id: 'sound-volume',
        label: 'Volume',
        type: 'slider',
        defaultValue: '0',
        storageKey: 'slidysim_dph_script_sound_volume',
        unit: '',
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

    // Sound debounce
    const soundDebounceSetting = createSetting({
        id: 'sound-debounce',
        label: 'Debounce',
        type: 'slider',
        defaultValue: '40',
        storageKey: 'slidysim_dph_script_sound_debounce',
        unit: 'ms',
        min: '0',
        max: '50',
        step: '1',
        onChange: (val) => {
            soundDebounceTime = parseInt(val);
        }
    });
    settings.soundDebounce = soundDebounceSetting;

    // Minimize avgs
    const minimizeAvgsSetting = createSetting({
        id: 'minimize-avgs',
        label: 'Minimize avgs',
        type: 'checkbox',
        defaultValue: true,
        storageKey: 'slidysim_dph_script_minimize_avgs',
        onChange: (val) => {
            if (val) {
                replaceText();
            }
        }
    });
    settings.minimizeAvgs = minimizeAvgsSetting;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '❌ Reset settings';
    resetBtn.style.cssText = `
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.2);
        color: #ffdddd;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        border-radius: 3px;
        width: 100%;
        margin-bottom: 8px;
    `;

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ok = confirm('Reset all SlidySim settings to default?');
        if (ok) resetAllSettings();
    });

    // Assemble dropdown menu
    dropdownMenu.appendChild(uploadBtn);
    dropdownMenu.appendChild(removeBtn);
    dropdownMenu.appendChild(createSectionLabel('Opacity settings:'));
    dropdownMenu.appendChild(bgDimSetting.container);
    dropdownMenu.appendChild(puzzleDimSetting.container);
    dropdownMenu.appendChild(uiOpacitySetting.container);
    dropdownMenu.appendChild(createSectionLabel('Puzzle Position:'));
    dropdownMenu.appendChild(puzzleLeftSetting.container);
    dropdownMenu.appendChild(puzzleTopSetting.container);
    dropdownMenu.appendChild(createSectionLabel('Border settings:'));
    dropdownMenu.appendChild(borderWidthSetting.container);
    dropdownMenu.appendChild(createSectionLabel('Font settings:'));
    dropdownMenu.appendChild(fontFamilySetting.container);
    dropdownMenu.appendChild(fontSizeSetting.container);
    dropdownMenu.appendChild(boldSetting.container);
    dropdownMenu.appendChild(createSectionLabel('Grid settings:'));
    dropdownMenu.appendChild(inactiveBrightnessSetting.container);
    dropdownMenu.appendChild(gridsBorderWidthSetting.container);
    dropdownMenu.appendChild(createSectionLabel('Puzzle settings:'));
    dropdownMenu.appendChild(base9Setting.container);
    dropdownMenu.appendChild(createSectionLabel('Sound settings:'));
    dropdownMenu.appendChild(soundEnableSetting.container);
    dropdownMenu.appendChild(soundVolumeSetting.container);
    dropdownMenu.appendChild(soundDebounceSetting.container);
    dropdownMenu.appendChild(createSectionLabel('Misc:'));
    dropdownMenu.appendChild(minimizeAvgsSetting.container);
    dropdownMenu.appendChild(createSectionLabel('⚠️Some changes require a refresh to apply'));
    dropdownMenu.appendChild(resetBtn);

    controls.appendChild(dropdownBtn);
    controls.appendChild(dropdownMenu);
    soundEnableSetting.container.style.display = 'none';
    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!controls.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // ==================== APPLICATION FUNCTIONS ====================

    function insertControls() {
        const header = document.querySelector('.header');
        if (!header) return;

        const button = createSeeStatsButton();
        const filler = header.querySelector('.filler');

        if (filler) {
            filler.parentNode.insertBefore(controls, filler);
            filler.parentNode.insertBefore(button, filler);
        } else {
            header.appendChild(controls);
            header.appendChild(button);
        }
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    function applyBackground(blobUrl, dimAmount) {
        const mainContainer = document.querySelector('.main-content-container');
        if (mainContainer && blobUrl) {
            const dim = dimAmount !== undefined ? dimAmount : parseFloat(settings.bgDim.getValue());
            mainContainer.style.background = `linear-gradient(rgba(0, 0, 0, ${1-dim}), rgba(0, 0, 0, ${1-dim})), url('${blobUrl}')`;
            mainContainer.style.backgroundSize = 'cover';
            mainContainer.style.backgroundPosition = 'center';
            mainContainer.style.backgroundRepeat = 'no-repeat';
            mainContainer.style.backgroundAttachment = 'fixed';
        }
        removeModuleContainerBackground();
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
        }
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
        deleteFromDB().catch(err => console.error('Failed to delete from DB:', err));
        removeBtn.style.display = 'none';
    }

    function removeModuleContainerBackground() {
        const moduleContainers = document.querySelectorAll('.module-container');
        moduleContainers.forEach(container => {
            container.style.backgroundColor = 'transparent';
            container.style.background = 'none';
        });
    }

    function applyPuzzleDim(dimAmount) {
        const puzzleElements = document.querySelectorAll('.puzzle');
        puzzleElements.forEach(element => {
            element.style.opacity = dimAmount;
        });
    }

    function applyUIOpacity(opacity) {
        const elements = document.querySelectorAll(
            '.standard-stats-panel, .session-background, .session-statistics-page-container, .dialog, .fewest-moves-stats-panel, .fewest-moves-data-panel, .fewest-moves-input, .sessions-search-bar'
        );
        elements.forEach(element => {
            element.style.opacity = opacity;
            if (element.classList.contains('session-background')) {
                element.style.backgroundColor = `rgba(35, 35, 35, ${opacity})`;
            }
        });
    }

    function applyPuzzlePosition() {
        const puzzleContainers = document.querySelectorAll('.puzzle-container');
        const leftVal = parseFloat(settings.puzzleLeft.getValue());
        const topVal = parseFloat(settings.puzzleTop.getValue());

        puzzleContainers.forEach(container => {
            container.style.position = 'relative';
            container.style.left = leftVal + 'px';
            container.style.top = topVal + 'px';
        });
    }

    function applyBorder(width, color) {
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            if (width > 0) {
                piece.style.boxShadow = `inset 0 0 0 ${width}px ${color}`;
            } else {
                piece.style.boxShadow = '';
            }
        });
    }

    function applyGridsBorder(width, color) {
        const subschemes = document.querySelectorAll('.piece .subscheme');
        subschemes.forEach(subscheme => {
            const bg = getComputedStyle(subscheme).backgroundColor;
            const hasBackground = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
            if (width > 0 && hasBackground) {
                subscheme.style.boxShadow = `inset 0 0 0 ${width}px ${color}`;
            } else {
                subscheme.style.boxShadow = '';
            }
        });
    }

    function applyFontFamily(family) {
        let fontFamily = family;
        if (family === 'inherit') {
            fontFamily = '';
        }
        const styleId = 'slidysim-font-family-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        if (fontFamily) {
            styleEl.textContent = `.piece .text { font-family: "${fontFamily}", sans-serif !important; }`;
        } else {
            styleEl.textContent = '';
        }
    }

    function applyFontSize(size) {
        const styleId = 'slidysim-font-size-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `.piece .text { font-size: ${size}px !important; }`;
    }

    function applyBold(isBold) {
        const styleId = 'slidysim-font-bold-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `.piece .text { font-weight: ${isBold ? 'bold' : 'normal'} !important; }`;
    }

    function applyInactiveBrightness(brightness) {
        const styleId = 'slidysim-inactive-brightness-style';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = `.piece.inactive { filter: brightness(${brightness}) !important; }`;
    }

    // ==================== BASE 9 FUNCTIONALITY ====================

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
        //console.log("trying to convert");
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

    // ==================== SOUND FUNCTIONALITY ====================

    let soundAudio = null;
    let soundDebounceTime = parseInt(localStorage.getItem('slidysim_dph_script_sound_debounce') || '40');
    let soundObserver = null;

    function createAudio() {
    if (!soundAudio) {
        soundAudio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjE0LjEwMAAAAAAAAAAAAAAA//PgwAAAAAAAAAAAAEluZm8AAAAPAAAABAAACjQAZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmczMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/////////////////////////////////AAAAAExhdmM1Ny4xNQAAAAAAAAAAAAAAACQAAAAAAAAAAAo0qhTsdwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//PgxABuBBYkAVrQAFiMsnVpgkCYUSYkOnEYYobNma06VhTCGDTLjaNDYJB46aFuejMdyELPDIrzgyzmyzgsSJUaBwevWeOaa0ODDBrHBvnhtFA8kMilOdQOZANUSSJMWZNClNGdBx8GDDVrzWozLh1XpUAAAWgWo6ZZwwAIwQAuw6pe8wYMvWsgxI0x40xYcDB1rtwQkIoMsiSmAIAGEDGGCAYIpYtswokzRgyw4OCIIzGlTOnzOlxomYIobVybdeaEijGCBBkjBmiwQUC4c0Sg1SYzxYxgBmoNAmHDgoW6wNAmFDmHEmHCgYOteCEvEHC46dcBIJCyhZBAA7pasxgwxQYvQ8JdcwIMBA1fpoGHEmJClv3zYAhIQcZIyMsoAgBcRgkEpfoB1rtwAIEwYEs2mHDychchSxu4EAGAAFtEUGWUsNu2ztlkEoJyyZdt81yKCOJHGGJCIBEHFNIEdNIcswgpCVKy2ZadAG9yPBhQphQKG8PJyFsC2i9FKzDCDDAi7DqRNrbX3fjc5NtbWHYnF7kYlmVSUUmMNuXI3ATHXXLmsLCLEa5StbRUUEdSPsrVOxORLkLTlt065EwAu4W0VgVXDBYBKBlI0YcJmQjJKCjo0MmBhAKEAJzQOaGKhzuaEQmPk5MQpgmflppiObIMG2hhmoWZ0Hi5qZKxGRwxsaUZNQGMlJUQ//PixEV+7BZUAZvYAEzORB+4d0cGcLICpTLUo0wBB0IOlgdHBswcalm1mB7rwZOmGniBjiCBBcCgBc0wgQAg2CB4zAzMaETDgU2IsNvZQwBXcrCFQJHcxAEGBAwkRARctQWRAdECIFFTkwkkBJ+Z7CGTNZih+yxuoWARQBDAFVJmRihCZWNGGkANGAqbmEgoCHTICoxoFA1IPB5nQEaWNmeGhnh+cGXALdNQTWJOMmEDAsOBX7BAKOiTWjDQRdYoGFk0MTDQEMRA4OLbEgMXBSiFhEdXDE0syQRFggaNzDR4x8NNKUDJi40URNYKjPBABd6wyQzdmJQG7ZgQKggLvQGIwousy8LBA4BmGhwOCXnS9UEMcETARZKcKAQXB1eCAJUXEhI24MN8RzaUI0APM+QzIzoKFJlCeYSmEKeQk5AWGBkpYIRgKAoaOhAhAGVjoBLmcvZUXyy1eLNXhguiVRLfDIMCANWMDFDviQqt8IA05kfVXBYEjahAFA5CtpOkeKi5KZxCHiAIEIQnWwNXDKwwuBIwYICpJmGgAUBU6hUKMPAiIAQGJVqzOU11lTkxrB/WstJjhd569T+LIYo6TSkxmJIQAQzvYszo14wsJw4DwZuyORz4tJtpRJ4nAxn6exgADoUAs1aAQ7zDcxoPcVe4WBEwFBo+0DDCKkNDiI4U/TKqUEZrMAhQSP/z4MRHclQWICOd4AAGugw4ETGgAMEIowkXTKgGMWjdlMoUNDhSYPC5jIUNfMdhwx8OzDJkAI8YDDkvhoyqeTKYTBw8FRQYlExlsiGMRopQXHCwwt3JVdbkYCFqfQ8ciIJGGACMC0EjMw8GTA4OBARMFCEYFxhshmOSVDVPJKWVMxcExqCTDoZBQEFkUYYExgcGkAKMHAZkgKExgsEAEGEoHIRUEAEZAJWEDAgFlk3l8qiVePVhgGr7BoDLtmFw2EC4gBxVBhgUKiAHFoUbSEFoZAwJhYFgoAGAQKWua4CgUtYwMExAGFuIxZ4VdR2U4TO+SqVZl9AgYI3tiXcAggIwIBg8BQM7zUEnFYzAwFZCCgSmYtVAEFAKFgOgMCoBW8iKhsBQIreVAIzBS9FCarb1jqZpcKHf5VtzSPseMEAIVBiA0HBpPgtmDQGYOApggGozhgCKwKuVu7dmeIqrpcVFFCUsCkamgXXWsxVWItUompg0RQdIBOlFZgKNqqiPdbPWOqtXC7v8q25qtnc39WpogCmOJmOCqkMKQMuUCCwiDmSKoHFzS3rcAKEMOEMGAMKIEg5mYB39R44xmQZurp6s50FI4eN/WP788qTgVIgDHYOOADVAxc5HwqKcmp5Rhxhq1HrkcphYLNyk1UAUMkU054VStqmkgOFQjTYNcxOMwDzUVBTIqMaKCv/z4sR6auQVKAPayACAwzDLAXeYRpoHgo1mAFIMY0zjzKFVoBohlkBgwoCZQ6lZlJmgOrgwzjVSBSyTpjHmGAj8u53qF2ZCyJayCIyzjNEWuACTONCCUORklJIqVJhQGX9Lap0xBKoGAmEGCgW8L3GCAjkmSAgWvggMFAuQDQDFCQHLZAgKKTjRqXWt4MqZsX2Ms4zQlrgAs0Dwg0ZAMsxLlG5BZ2y6pZlK2IIZFqTABLWuoXuLJJ9JGgIFlZgEgI1lgFEMkgMCUVMAVBaT2a1NTSprTzJHGKQAjmTggUyBw4FHYxRG9UyU2i6tqKrBZQuZTFMVdMgZUqZ1mQpgtjLOlrXUL3Fkkrmil3VjUeOVNTUztQemkYIQGCb8vaYAKOKhxZJ1C1Ra5xy9pZFDWAEExd0uSii9rAkVmTL5QdpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=');
        soundAudio.volume = parseFloat(localStorage.getItem('slidysim_dph_script_sound_volume') || '0.5');
        soundAudio.preload = 'auto';
        soundAudio.load();
    }
    return soundAudio;
}

    function initSound() {
        createAudio();

        const puzzle = document.querySelector('.puzzle');
        if (!puzzle) {
            setTimeout(initSound, 100);
            return;
        }

        let lastPlay = 0;

        const observer = new MutationObserver(() => {
            const now = performance.now();
            if (now - lastPlay < soundDebounceTime) return;
            if (soundAudio.volume < 0.1) return;
            lastPlay = now;

            const clone = soundAudio.cloneNode();
            clone.volume = soundAudio.volume;
            clone.play().catch(() => {});
        });

        observer.observe(puzzle, {
            attributes: true,
            subtree: true,
            attributeFilter: ['style']
        });
    }

    // ==================== TEXT REPLACEMENT ====================

    function replaceText() {
        const headers = document.querySelectorAll('td[column="header"]');
        headers.forEach(header => {
            let text = header.textContent;
            if (text.includes('Session average')) {
                text = text.replace(/Session average \((\d+) solves\)/i, 'ao$1');
            }
            text = text.replace(/Average of (\d+)/i, 'ao$1');
            header.textContent = text;
        });

        document.querySelectorAll('tr[avg]').forEach(row => {
            const avg = row.getAttribute('avg');
            if (avg === 'session' || avg === '1') return;
            const shouldHide = [...row.querySelectorAll('td')].some(cell => {
                const text = cell.textContent.trim();
                return text === 'DNF' || (text === '' && cell.getAttribute('column') !== 'header');
            });
            row.style.display = shouldHide ? 'none' : '';
        });
    }

    // ==================== EVENT HANDLERS ====================

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
            const currentDim = parseFloat(settings.bgDim.getValue());
            applyBackground(currentBlobUrl, currentDim);
        } catch (error) {
            console.error('Failed to save background:', error);
            alert('Failed to save background. The file might be too large.');
        }
    });

    // ==================== INITIALIZATION ====================

    async function restoreSettings() {
        // Restore background dim
        const savedBgDim = parseFloat(localStorage.getItem('slidysim_dph_script_bg_dim') || '0.5');
        bgDimSetting.setValue(savedBgDim);

        // Restore puzzle dim
        const savedPuzzleDim = parseFloat(localStorage.getItem('slidysim_dph_script_puzzle_dim') || '1');
        puzzleDimSetting.setValue(savedPuzzleDim);
        applyPuzzleDim(savedPuzzleDim);

        // Restore UI opacity
        const savedUIOpacity = parseFloat(localStorage.getItem('slidysim_dph_script_ui_opacity') || '0.8');
        uiOpacitySetting.setValue(savedUIOpacity);
        applyUIOpacity(savedUIOpacity);

        // Restore puzzle position
        const savedPuzzleLeft = parseFloat(localStorage.getItem('slidysim_dph_script_puzzle_left') || '-125');
        puzzleLeftSetting.setValue(savedPuzzleLeft);
        const savedPuzzleTop = parseFloat(localStorage.getItem('slidysim_dph_script_puzzle_top') || '0');
        puzzleTopSetting.setValue(savedPuzzleTop);
        applyPuzzlePosition();

        // Restore borders
        const savedBorderWidth = parseInt(localStorage.getItem('slidysim_dph_script_border_width') || '0');
        const savedBorderColor = localStorage.getItem('slidysim_dph_script_border_color') || '#000000';
        borderWidthSetting.setValue(savedBorderWidth);
        borderColorSetting.setValue(savedBorderColor);
        applyBorder(savedBorderWidth, savedBorderColor);

        // Restore grids borders
        const savedGridsBorderWidth = parseInt(localStorage.getItem('slidysim_dph_script_grids_border_width') || '0');
        const savedGridsBorderColor = localStorage.getItem('slidysim_dph_script_grids_border_color') || '#000000';
        gridsBorderWidthSetting.setValue(savedGridsBorderWidth);
        gridsBorderColorSetting.setValue(savedGridsBorderColor);

        // Restore font settings
        const savedFontFamily = localStorage.getItem('slidysim_dph_script_font_family') || 'inherit';
        const customFont = localStorage.getItem('slidysim_dph_script_font_family_custom');
        if (savedFontFamily === 'custom' && customFont) {
            fontFamilySetting.setValue(customFont);
            applyFontFamily(customFont);
        } else {
            fontFamilySetting.setValue(savedFontFamily);
            applyFontFamily(savedFontFamily);
        }

        const savedFontSize = parseInt(localStorage.getItem('slidysim_dph_script_font_size') || '30');
        fontSizeSetting.setValue(savedFontSize);
        applyFontSize(savedFontSize);

        const savedBold = localStorage.getItem('slidysim_dph_script_bold') === 'true';
        boldSetting.setValue(savedBold);
        applyBold(savedBold);

        // Restore inactive brightness
        const savedInactiveBrightness = parseFloat(localStorage.getItem('slidysim_dph_script_inactive_brightness') || '0.3');
        inactiveBrightnessSetting.setValue(savedInactiveBrightness);
        applyInactiveBrightness(savedInactiveBrightness);

        // Restore base9
        const savedBase9 = localStorage.getItem('slidysim_dph_script_base9') !== 'false';
        base9Setting.setValue(savedBase9);
        if (savedBase9) {
            convertBase9();
        }

        // Restore sound settings
        const savedSoundEnabled = localStorage.getItem('slidysim_dph_script_sound_enabled') !== 'false';
        soundEnableSetting.setValue(savedSoundEnabled);
        const savedSoundVolume = parseFloat(localStorage.getItem('slidysim_dph_script_sound_volume') || '0.5');
        soundVolumeSetting.setValue(savedSoundVolume);
        const savedSoundDebounce = parseInt(localStorage.getItem('slidysim_dph_script_sound_debounce') || '40');
        soundDebounceSetting.setValue(savedSoundDebounce);
        soundDebounceTime = savedSoundDebounce;

        // Restore minimize avgs
        const minimizeAvgs = localStorage.getItem('slidysim_dph_script_minimize_avgs') !== 'false';
        minimizeAvgsSetting.setValue(minimizeAvgs);
        if (minimizeAvgs) {
            replaceText();
        }

        // Load background from IndexedDB
        try {
            const blob = await loadFromDB();
            if (blob) {
                if (currentBlobUrl) {
                    URL.revokeObjectURL(currentBlobUrl);
                }
                currentBlobUrl = URL.createObjectURL(blob);
                applyBackground(currentBlobUrl, savedBgDim);
            }
        } catch (error) {
            console.error('Failed to load background:', error);
        }

        removeModuleContainerBackground();

        function handleUserInteraction(e) {
            setTimeout(() => {
                applyGridsBorder(
                    parseInt(settings.gridsBorderWidth.getValue()),
                    settings.gridsBorderColor.getValue()
                );
                applyInactiveBrightness(parseFloat(settings.inactiveBrightness.getValue()));
                applyBorder(parseInt(settings.borderWidth.getValue()), settings.borderColor.getValue());
                applyPuzzleDim(parseFloat(settings.puzzleDim.getValue()));
                applyPuzzlePosition();
                // add other actions here later to use instead of using all the time in observer
            }, 10);
        }

        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('click', handleUserInteraction);
    }

    async function init() {
        try {
            await openDB();
            insertControls();
            await restoreSettings();
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function forcePuzzleLayout() {
        const style = document.createElement('style');
        style.textContent = `
    .module-container[statistics-position="right"] .standard-container {
      grid-template-columns: 1fr !important;
      grid-template-areas: "a" !important;
    }

    .standard-stats-panel {
      position: absolute !important;
      right: 10px !important;
      top: 10px !important;
      z-index: -100 !important;
      max-width: 250px !important;
    }

    .standard-main-panel {
      grid-area: a !important;
      position: relative !important;
    }
  `;
        document.head.appendChild(style);
    }

    function createSeeStatsButton() {
        const button = document.createElement('button');
        button.textContent = 'See stats';
        button.id = 'see-stats-button';
        button.style.cssText = `
        display: none;
        width: 100px;
        margin: 10px;
        padding: 8px 16px;
        background: rgba(60,60,60,0.8);
        color: white;
        border: 1px solid #555;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: background 0.3s;
    `;

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

                // Focus the stats table or a focusable element first
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
        const button = document.getElementById('see-stats-button');
        if (!button) return;

        const hasPuzzle = document.querySelectorAll('.puzzle').length > 0;
        const hasStatsTable = document.querySelector('.session-statistics-table');

        if (hasPuzzle) {
            button.textContent = 'Stats';
            button.style.display = 'block';
        } else if (hasStatsTable) {
            button.textContent = 'Back';
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    }

    // ==================== MAIN MUTATION OBSERVER ====================

    const mainObserver = new MutationObserver((mutations) => {
        mainObserver.disconnect();
        for (const mutation of mutations) {
            if (mutation.target.closest?.('tr[avg="1"]')) {
                mainObserver.observe(document.body, { childList: true, subtree: true });
                return;
            }
        }
        //console.log('mutations', mutations);
        updateButtonVisibility()
        removeModuleContainerBackground();
        applyUIOpacity(parseFloat(settings.uiOpacity.getValue()));
        if (localStorage.getItem('slidysim_dph_script_minimize_avgs') !== 'false') {
            replaceText();
            forcePuzzleLayout();
        }

        if (localStorage.getItem('slidysim_dph_script_base9') !== 'false') {
            convertBase9();
        }

        const logoutButton = document.querySelector('.user-menu .username-dropdown .item');
        if (logoutButton && logoutButton.textContent.trim() === 'Log out') {
            logoutButton.style.display = 'none';
        }

        const dropdown = document.querySelector('.user-menu .username-dropdown');
        if (dropdown) {
            const visibleChildren = Array.from(dropdown.children).filter(child => {
                return child.style.display !== 'none' &&
                    window.getComputedStyle(child).display !== 'none';
            });
            if (visibleChildren.length <= 1) {
                dropdown.style.display = 'none';
            }
        }

        if (currentBlobUrl) {
            const mainContainer = document.querySelector('.main-content-container');
            if (mainContainer && !mainContainer.style.background.includes('blob:')) {
                const savedBgDim = parseFloat(localStorage.getItem('slidysim_dph_script_bg_dim') || '0.5');
                applyBackground(currentBlobUrl, savedBgDim);
            }
        }

        if (!document.body.contains(controls)) {
            insertControls();
        }

        mainObserver.observe(document.body, { childList: true, subtree: true });
    });

    mainObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
})();