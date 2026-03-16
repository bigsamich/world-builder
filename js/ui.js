// ui.js - UI controls, sidebar, toolbar, dialogs

import { TERRAIN_LIST, TERRAIN_TYPES } from './terrain.js';
import { TOOL } from './tools.js';
import { LABEL_TYPES } from './labels.js';
import { MARKER_TYPES, renderMarkerThumbnail } from './markers.js';
import { NATION_COLORS } from './nations.js';

/**
 * Build the terrain palette in the sidebar, grouped by category.
 */
export function buildTerrainPalette(container, state, onSelect) {
    container.innerHTML = '';

    const categories = [
        { key: 'water', label: 'Water' },
        { key: 'land', label: 'Land' },
        { key: 'structure', label: 'Structure' }
    ];

    for (const cat of categories) {
        const terrains = TERRAIN_LIST.filter(t => t.category === cat.key);
        if (terrains.length === 0) continue;

        const header = document.createElement('div');
        header.className = 'terrain-category-header';
        header.textContent = cat.label;
        container.appendChild(header);

        for (const terrain of terrains) {
            const item = document.createElement('div');
            item.className = 'terrain-item';
            if (state.selectedTerrain === terrain.id) {
                item.classList.add('selected');
            }
            item.dataset.terrainId = terrain.id;

            const swatch = document.createElement('div');
            swatch.className = 'terrain-swatch';
            swatch.style.backgroundColor = terrain.baseColor;

            const label = document.createElement('span');
            label.className = 'terrain-label';
            label.textContent = terrain.name;

            const shortcut = document.createElement('span');
            shortcut.className = 'terrain-shortcut';
            shortcut.textContent = terrain.key ? terrain.key : '';

            item.appendChild(swatch);
            item.appendChild(label);
            item.appendChild(shortcut);

            item.addEventListener('click', () => {
                state.selectedTerrain = terrain.id;
                onSelect(terrain.id);
                updatePaletteSelection(container, terrain.id);
            });

            container.appendChild(item);
        }
    }
}

export function updatePaletteSelection(container, terrainId) {
    container.querySelectorAll('.terrain-item').forEach(el => {
        el.classList.toggle('selected', parseInt(el.dataset.terrainId) === terrainId);
    });
}

/**
 * Build tool buttons.
 */
export function buildToolbar(container, state, onSelectTool) {
    const tools = [
        { id: TOOL.BRUSH, icon: '🖌', label: 'Brush', shortcut: 'B' },
        { id: TOOL.FILL, icon: '🪣', label: 'Fill', shortcut: 'F' },
        { id: TOOL.ERASER, icon: '🧹', label: 'Eraser', shortcut: 'E' },
        { id: TOOL.LINE, icon: '📏', label: 'Line', shortcut: 'L' },
        { id: TOOL.RECT, icon: '⬜', label: 'Rectangle', shortcut: 'R' },
        { id: TOOL.LABEL, icon: 'Aa', label: 'Label', shortcut: 'T' },
        { id: TOOL.MEASURE, icon: '📐', label: 'Measure', shortcut: 'D' },
        { id: TOOL.NATION, icon: '\u2691', label: 'Nation', shortcut: 'N' }
    ];

    container.innerHTML = '';
    tools.forEach(tool => {
        const btn = document.createElement('button');
        btn.className = 'tool-btn';
        btn.dataset.tool = tool.id;
        btn.title = `${tool.label} (${tool.shortcut})`;
        if (state.currentTool === tool.id) btn.classList.add('active');

        btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-name">${tool.label}</span>`;
        btn.addEventListener('click', () => {
            state.currentTool = tool.id;
            onSelectTool(tool.id);
            updateToolSelection(container, tool.id);
        });
        container.appendChild(btn);
    });
}

export function updateToolSelection(container, toolId) {
    container.querySelectorAll('.tool-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.tool === toolId);
    });
}

/**
 * Update the cursor for the canvas based on current tool.
 */
export function updateCursor(canvasEl, tool) {
    switch (tool) {
        case TOOL.BRUSH:
            canvasEl.style.cursor = 'crosshair';
            break;
        case TOOL.FILL:
            canvasEl.style.cursor = 'cell';
            break;
        case TOOL.ERASER:
            canvasEl.style.cursor = 'crosshair';
            break;
        case TOOL.LINE:
            canvasEl.style.cursor = 'crosshair';
            break;
        case TOOL.RECT:
            canvasEl.style.cursor = 'crosshair';
            break;
        case TOOL.LABEL:
            canvasEl.style.cursor = 'text';
            break;
        case TOOL.MEASURE:
            canvasEl.style.cursor = 'crosshair';
            break;
        case TOOL.NATION:
            canvasEl.style.cursor = 'cell';
            break;
        default:
            canvasEl.style.cursor = 'default';
    }
}

/**
 * Show the "New Map" dialog. Returns a promise that resolves with { width, height } or null.
 */
export function showNewMapDialog() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <h3>New Map</h3>
            <div class="dialog-field">
                <label>Width (cells):</label>
                <input type="number" id="dlg-width" value="200" min="10" max="1000" />
            </div>
            <div class="dialog-field">
                <label>Height (cells):</label>
                <input type="number" id="dlg-height" value="150" min="10" max="1000" />
            </div>
            <div class="dialog-actions">
                <button id="dlg-cancel" class="btn btn-secondary">Cancel</button>
                <button id="dlg-ok" class="btn btn-primary">Create</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const close = (result) => {
            document.body.removeChild(overlay);
            resolve(result);
        };

        dialog.querySelector('#dlg-cancel').onclick = () => close(null);
        dialog.querySelector('#dlg-ok').onclick = () => {
            const w = parseInt(dialog.querySelector('#dlg-width').value) || 200;
            const h = parseInt(dialog.querySelector('#dlg-height').value) || 150;
            close({ width: Math.max(10, Math.min(1000, w)), height: Math.max(10, Math.min(1000, h)) });
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(null);
        });

        dialog.querySelector('#dlg-width').focus();
    });
}

/**
 * Show a brief welcome tooltip overlay.
 */
export function showWelcomeOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
        <div class="welcome-card">
            <h2>World Builder</h2>
            <p>Fantasy Map Maker</p>
            <ul>
                <li><strong>Left click + drag</strong> to paint terrain</li>
                <li><strong>Right click</strong> to pick terrain (eyedropper)</li>
                <li><strong>Mouse wheel</strong> to zoom</li>
                <li><strong>Middle mouse / Space+drag</strong> to pan</li>
                <li><strong>Ctrl+Z</strong> / <strong>Ctrl+Y</strong> to undo / redo</li>
                <li><strong>G</strong> to toggle grid</li>
                <li><strong>T</strong> to add labels &amp; markers</li>
                <li><strong>1-0</strong> to select terrain types</li>
            </ul>
            <button class="btn btn-primary" id="welcome-dismiss">Start Building</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const dismiss = () => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
        }, 300);
    };

    overlay.querySelector('#welcome-dismiss').onclick = dismiss;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismiss();
    });
}

/**
 * Update undo/redo button states.
 */
export function updateUndoRedoButtons(history) {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = !history.canUndo();
    if (redoBtn) redoBtn.disabled = !history.canRedo();
}

/**
 * Show the "Generate World" dialog. Returns a promise resolving to { mode, seed } or null.
 */
export function showGenerateDialog() {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.style.minWidth = '580px';

        const initialSeed = Math.floor(Math.random() * 999999) + 1;

        dialog.innerHTML = `
            <h3>Generate World</h3>
            <div class="generate-modes">
                <div class="mode-card selected" data-mode="pangea">
                    <span class="mode-icon">&#x1F30B;</span>
                    <div class="mode-name">Pangea</div>
                    <div class="mode-desc">One massive supercontinent</div>
                </div>
                <div class="mode-card" data-mode="continents">
                    <span class="mode-icon">&#x1F30D;</span>
                    <div class="mode-name">Continents</div>
                    <div class="mode-desc">Several medium landmasses</div>
                </div>
                <div class="mode-card" data-mode="islands">
                    <span class="mode-icon">&#x1F3DD;</span>
                    <div class="mode-name">Islands</div>
                    <div class="mode-desc">Many small islands</div>
                </div>
                <div class="mode-card pokemon-mode-card" data-mode="pokemon">
                    <span class="mode-icon">&#x26A1;</span>
                    <div class="mode-name">Pokemon</div>
                    <div class="mode-desc">Pokemon region with routes &amp; gyms</div>
                </div>
            </div>
            <div class="dialog-field">
                <label>Seed</label>
                <div class="seed-row">
                    <input type="number" id="dlg-seed" value="${initialSeed}" min="1" max="999999999" />
                    <button class="btn" id="dlg-randomize">Randomize</button>
                </div>
            </div>
            <div class="dialog-actions">
                <button id="dlg-cancel" class="btn btn-secondary">Cancel</button>
                <button id="dlg-ok" class="btn btn-primary">Generate</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        let selectedMode = 'pangea';

        // Mode card selection
        const modeCards = dialog.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                modeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedMode = card.dataset.mode;
            });
        });

        // Default to continents
        modeCards.forEach(c => c.classList.remove('selected'));
        dialog.querySelector('[data-mode="continents"]').classList.add('selected');
        selectedMode = 'continents';

        // Randomize button
        dialog.querySelector('#dlg-randomize').addEventListener('click', () => {
            dialog.querySelector('#dlg-seed').value = Math.floor(Math.random() * 999999) + 1;
        });

        const close = (result) => {
            document.body.removeChild(overlay);
            resolve(result);
        };

        dialog.querySelector('#dlg-cancel').onclick = () => close(null);
        dialog.querySelector('#dlg-ok').onclick = () => {
            const seed = parseInt(dialog.querySelector('#dlg-seed').value) || 1;
            close({ mode: selectedMode, seed });
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(null);
        });

        dialog.querySelector('#dlg-seed').focus();
    });
}

// ==================== Layer Panel ====================

/**
 * Build the layer visibility panel.
 * @param {HTMLElement} container - The #layer-panel element
 * @param {MapCanvas} mapCanvas - The canvas instance with visibleLayers
 */
export function buildLayerPanel(container, mapCanvas) {
    const layers = [
        { key: 'water', name: 'Water', color: '#4a8ab5' },
        { key: 'land', name: 'Land', color: '#6aaa3a' },
        { key: 'structures', name: 'Structures', color: '#8a8a8a' }
    ];

    container.innerHTML = '';

    for (const layer of layers) {
        const item = document.createElement('div');
        item.className = 'layer-item';

        const colorDot = document.createElement('div');
        colorDot.className = 'layer-color';
        colorDot.style.backgroundColor = layer.color;

        const name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = layer.name;

        const toggle = document.createElement('div');
        toggle.className = 'layer-toggle visible';
        toggle.dataset.layer = layer.key;
        // Eye icon: open eye when visible, closed when hidden
        toggle.innerHTML = '&#x1F441;';
        toggle.title = `Toggle ${layer.name} visibility`;

        toggle.addEventListener('click', () => {
            const isVisible = toggle.classList.contains('visible');
            toggle.classList.toggle('visible', !isVisible);
            toggle.innerHTML = !isVisible ? '&#x1F441;' : '&#x2014;';
            mapCanvas.setLayerVisible(layer.key, !isVisible);
        });

        item.appendChild(colorDot);
        item.appendChild(name);
        item.appendChild(toggle);
        container.appendChild(item);
    }
}

// ==================== Label Editor Popup ====================

let _activeLabelEditor = null;

/**
 * Close any open label editor popup.
 */
export function closeLabelEditor() {
    if (_activeLabelEditor && _activeLabelEditor.parentElement) {
        _activeLabelEditor.parentElement.removeChild(_activeLabelEditor);
    }
    _activeLabelEditor = null;
}

/**
 * Show a label editor popup near the given screen position.
 * @param {number} screenX - Screen X position for the popup
 * @param {number} screenY - Screen Y position for the popup
 * @param {object} label - Existing label object to edit, or null for a new label
 * @param {function} onSave - Called with { text, type, marker, fontSize, color } when saved
 * @param {function} onDelete - Called when delete is clicked (only for existing labels)
 */
export function showLabelEditor(screenX, screenY, label, onSave, onDelete) {
    closeLabelEditor();

    const isEdit = !!label;
    const defaults = label || {
        text: '',
        type: 'city',
        marker: LABEL_TYPES.city.markerDefault,
        fontSize: LABEL_TYPES.city.baseFontSize,
        color: LABEL_TYPES.city.color
    };

    const popup = document.createElement('div');
    popup.className = 'label-editor';

    // Build marker grid HTML
    let markerGridHTML = '';
    for (const mt of MARKER_TYPES) {
        markerGridHTML += `<div class="marker-option${defaults.marker === mt.id ? ' selected' : ''}" data-marker="${mt.id}" title="${mt.label}">
            <img src="${renderMarkerThumbnail(mt.id, 28, '#e0e0e0')}" width="24" height="24" alt="${mt.label}" />
        </div>`;
    }

    // Build type options
    const typeOptions = Object.keys(LABEL_TYPES).map(t =>
        `<option value="${t}"${defaults.type === t ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
    ).join('');

    popup.innerHTML = `
        <h4>${isEdit ? 'Edit Label' : 'New Label'}</h4>
        <div class="field">
            <label>Text</label>
            <input type="text" class="le-text" value="${(defaults.text || '').replace(/"/g, '&quot;')}" placeholder="Label text..." />
        </div>
        <div class="field">
            <label>Type</label>
            <select class="le-type">${typeOptions}</select>
        </div>
        <div class="field">
            <label>Marker Icon</label>
            <div class="marker-grid">${markerGridHTML}</div>
        </div>
        <div class="field">
            <label>Font Size: <span class="le-size-val">${defaults.fontSize}</span></label>
            <input type="range" class="le-fontsize" min="8" max="48" value="${defaults.fontSize}" />
        </div>
        <div class="field">
            <label>Color</label>
            <input type="color" class="le-color" value="${toHexColor(defaults.color)}" />
        </div>
        <div class="actions">
            ${isEdit ? '<button class="btn btn-danger le-delete">Delete</button>' : ''}
            <button class="btn btn-secondary le-cancel">Cancel</button>
            <button class="btn btn-primary le-save">Save</button>
        </div>
    `;

    document.body.appendChild(popup);
    _activeLabelEditor = popup;

    // Position the popup near the click, keeping it on screen
    const popupRect = popup.getBoundingClientRect();
    let px = screenX + 12;
    let py = screenY - 20;
    if (px + popupRect.width > window.innerWidth - 10) {
        px = screenX - popupRect.width - 12;
    }
    if (py + popupRect.height > window.innerHeight - 10) {
        py = window.innerHeight - popupRect.height - 10;
    }
    if (py < 10) py = 10;
    if (px < 10) px = 10;
    popup.style.left = px + 'px';
    popup.style.top = py + 'px';

    // Focus text input
    const textInput = popup.querySelector('.le-text');
    textInput.focus();
    textInput.select();

    // State for current selections
    let selectedMarker = defaults.marker;
    let selectedType = defaults.type;

    // Marker grid click
    popup.querySelectorAll('.marker-option').forEach(opt => {
        opt.addEventListener('click', () => {
            popup.querySelectorAll('.marker-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedMarker = opt.dataset.marker;
        });
    });

    // Type change applies defaults for new labels
    const typeSelect = popup.querySelector('.le-type');
    const fontSlider = popup.querySelector('.le-fontsize');
    const fontSizeVal = popup.querySelector('.le-size-val');
    const colorInput = popup.querySelector('.le-color');

    typeSelect.addEventListener('change', () => {
        selectedType = typeSelect.value;
        if (!isEdit) {
            const td = LABEL_TYPES[selectedType] || LABEL_TYPES.custom;
            fontSlider.value = td.baseFontSize;
            fontSizeVal.textContent = td.baseFontSize;
            colorInput.value = toHexColor(td.color);
            // Update marker selection
            selectedMarker = td.markerDefault;
            popup.querySelectorAll('.marker-option').forEach(o => {
                o.classList.toggle('selected', o.dataset.marker === selectedMarker);
            });
        }
    });

    fontSlider.addEventListener('input', () => {
        fontSizeVal.textContent = fontSlider.value;
    });

    // Save
    popup.querySelector('.le-save').addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) { textInput.focus(); return; }
        onSave({
            text,
            type: typeSelect.value,
            marker: selectedMarker,
            fontSize: parseInt(fontSlider.value),
            color: colorInput.value
        });
        closeLabelEditor();
    });

    // Cancel
    popup.querySelector('.le-cancel').addEventListener('click', () => {
        closeLabelEditor();
    });

    // Delete
    if (isEdit) {
        popup.querySelector('.le-delete').addEventListener('click', () => {
            if (onDelete) onDelete();
            closeLabelEditor();
        });
    }

    // Enter key saves
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            popup.querySelector('.le-save').click();
        }
        if (e.key === 'Escape') {
            closeLabelEditor();
        }
    });
}

/**
 * Convert a CSS color string to a hex color suitable for <input type="color">.
 */
function toHexColor(color) {
    if (!color) return '#e0e0e0';
    // If already hex
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color;
    // Try to parse rgba/rgb
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
        const r = parseInt(m[1]).toString(16).padStart(2, '0');
        const g = parseInt(m[2]).toString(16).padStart(2, '0');
        const b = parseInt(m[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#e0e0e0';
}

// ==================== Nation Panel ====================

/**
 * Build the nation management panel in the sidebar.
 * @param {HTMLElement} container - The #nation-panel element
 * @param {NationManager} nationManager
 * @param {MapCanvas} mapCanvas
 * @param {object} state - App state (has selectedNationId)
 */
export function buildNationPanel(container, nationManager, mapCanvas, state) {
    container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'nation-panel';

    // Toggle row for nation overlay visibility
    const toggleRow = document.createElement('div');
    toggleRow.className = 'toggle-row';
    const toggleCb = document.createElement('input');
    toggleCb.type = 'checkbox';
    toggleCb.id = 'nation-overlay-toggle';
    toggleCb.checked = mapCanvas.showNationOverlay;
    toggleCb.addEventListener('change', () => {
        mapCanvas.showNationOverlay = toggleCb.checked;
        mapCanvas.markDirty();
    });
    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = 'nation-overlay-toggle';
    toggleLabel.textContent = 'Show overlay';
    toggleRow.appendChild(toggleCb);
    toggleRow.appendChild(toggleLabel);
    panel.appendChild(toggleRow);

    // Add Nation button
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary nation-add-btn';
    addBtn.textContent = '+ Add Nation';
    addBtn.addEventListener('click', () => {
        const count = nationManager.getAllNations().length;
        const colorIdx = count % NATION_COLORS.length;
        const name = `Nation ${count + 1}`;
        const nation = nationManager.addNation(name, NATION_COLORS[colorIdx]);
        state.selectedNationId = nation.id;
        buildNationPanel(container, nationManager, mapCanvas, state);
        mapCanvas.markDirty();
    });
    panel.appendChild(addBtn);

    // Nation list
    const nations = nationManager.getAllNations();
    for (const nation of nations) {
        const item = document.createElement('div');
        item.className = 'nation-item';
        if (state.selectedNationId === nation.id) {
            item.classList.add('selected');
        }

        // Color swatch (clickable to change)
        const colorSwatch = document.createElement('input');
        colorSwatch.type = 'color';
        colorSwatch.className = 'nation-color';
        colorSwatch.value = toHexColor(nation.color);
        colorSwatch.title = 'Change color';
        colorSwatch.addEventListener('input', (e) => {
            nation.color = e.target.value;
            mapCanvas.markDirty();
        });
        colorSwatch.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'nation-name';
        nameInput.value = nation.name;
        nameInput.addEventListener('input', () => {
            nation.name = nameInput.value;
        });
        nameInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Cell count
        const countEl = document.createElement('span');
        countEl.className = 'nation-count';
        countEl.textContent = nation.cells.size;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'nation-delete';
        deleteBtn.innerHTML = '&#x2715;';
        deleteBtn.title = 'Remove nation';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nationManager.removeNation(nation.id);
            if (state.selectedNationId === nation.id) {
                state.selectedNationId = null;
            }
            buildNationPanel(container, nationManager, mapCanvas, state);
            mapCanvas.markDirty();
        });

        // Click item to select nation
        item.addEventListener('click', () => {
            state.selectedNationId = nation.id;
            // Update selection highlights
            container.querySelectorAll('.nation-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
        });

        item.appendChild(colorSwatch);
        item.appendChild(nameInput);
        item.appendChild(countEl);
        item.appendChild(deleteBtn);
        panel.appendChild(item);
    }

    container.appendChild(panel);
}
