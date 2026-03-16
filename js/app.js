// app.js - Main application initialization and state management

import { TERRAIN_TYPES, TERRAIN_LIST, TERRAIN_BY_ID } from './terrain.js';
import { MapCanvas } from './canvas.js';
import { TOOL, getBrushCells, getLineCells, getRectCells, floodFill } from './tools.js';
import { HistoryManager } from './history.js';
import {
    serializeMap, deserializeMap,
    downloadFile, loadFileDialog, exportCanvasAsPNG
} from './export.js';
import {
    buildTerrainPalette, updatePaletteSelection,
    buildToolbar, updateToolSelection,
    updateCursor, showNewMapDialog, showGenerateDialog,
    showWelcomeOverlay, updateUndoRedoButtons,
    buildLayerPanel, showLabelEditor, closeLabelEditor,
    buildNationPanel
} from './ui.js';
import { generateMap } from './generator.js';
import { LabelManager } from './labels.js';
import { NationManager } from './nations.js';

// ==================== Application State ====================

const state = {
    mapWidth: 200,
    mapHeight: 150,
    mapName: 'Untitled Map',
    grid: null,
    selectedTerrain: TERRAIN_TYPES.PLAINS.id,
    currentTool: TOOL.BRUSH,
    brushSize: 3,
    brushOpacity: 1,
    softEdge: false
};

let mapCanvas = null;
let history = null;
let labelManager = null;
let nationManager = null;

// Interaction state
let isPainting = false;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let lastPaintGX = null;
let lastPaintGY = null;
let spaceDown = false;

// Line/rect tool drag state
let dragStartGX = null;
let dragStartGY = null;

// Label tool drag state
let draggingLabelId = null;
let labelDragOffsetX = 0;
let labelDragOffsetY = 0;

// Measure tool state
let isMeasuring = false;
let measureStartGX = null;
let measureStartGY = null;

// Minimap drag state
let isMinimapDragging = false;

// Nation lasso state
let nationLassoPoints = null; // Array of {sx, sy} screen points while drawing
let nationLassoGridPoints = null; // Array of {gx, gy} grid points

// ==================== Initialization ====================

function initGrid() {
    state.grid = new Uint8Array(state.mapWidth * state.mapHeight);
    // Fill with deep ocean
    state.grid.fill(TERRAIN_TYPES.DEEP_OCEAN.id);
}

function init() {
    initGrid();

    history = new HistoryManager();
    history.onStateChange = () => updateUndoRedoButtons(history);

    // Create label manager
    labelManager = new LabelManager();
    state.labelManager = labelManager;

    // Create nation manager
    nationManager = new NationManager();
    state.nationManager = nationManager;
    state.selectedNationId = null;

    const canvasEl = document.getElementById('map-canvas');
    mapCanvas = new MapCanvas(canvasEl, state);
    mapCanvas.labelManager = labelManager;
    mapCanvas.nationManager = nationManager;
    mapCanvas.centerView();
    mapCanvas.startRenderLoop();

    // Build UI
    const paletteContainer = document.getElementById('terrain-palette');
    buildTerrainPalette(paletteContainer, state, (id) => {
        state.selectedTerrain = id;
    });

    const toolContainer = document.getElementById('tool-buttons');
    buildToolbar(toolContainer, state, (toolId) => {
        state.currentTool = toolId;
        updateCursor(canvasEl, toolId);
    });

    updateCursor(canvasEl, state.currentTool);

    // Brush size slider
    const brushSlider = document.getElementById('brush-size');
    const brushLabel = document.getElementById('brush-size-label');
    brushSlider.value = state.brushSize;
    brushLabel.textContent = state.brushSize;
    brushSlider.addEventListener('input', () => {
        state.brushSize = parseInt(brushSlider.value);
        brushLabel.textContent = state.brushSize;
    });

    // Opacity slider
    const opacitySlider = document.getElementById('brush-opacity');
    const opacityLabel = document.getElementById('brush-opacity-label');
    opacitySlider.value = Math.round(state.brushOpacity * 100);
    opacityLabel.textContent = Math.round(state.brushOpacity * 100) + '%';
    opacitySlider.addEventListener('input', () => {
        state.brushOpacity = parseInt(opacitySlider.value) / 100;
        opacityLabel.textContent = opacitySlider.value + '%';
    });

    // Soft edge toggle
    const softEdgeToggle = document.getElementById('soft-edge');
    softEdgeToggle.checked = state.softEdge;
    softEdgeToggle.addEventListener('change', () => {
        state.softEdge = softEdgeToggle.checked;
    });

    // Map name
    const mapNameInput = document.getElementById('map-name');
    mapNameInput.value = state.mapName;
    mapNameInput.addEventListener('input', () => {
        state.mapName = mapNameInput.value || 'Untitled Map';
    });

    // Toolbar buttons
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-load').addEventListener('click', handleLoad);
    document.getElementById('btn-export').addEventListener('click', handleExport);
    document.getElementById('btn-generate').addEventListener('click', handleGenerate);
    document.getElementById('btn-undo').addEventListener('click', handleUndo);
    document.getElementById('btn-redo').addEventListener('click', handleRedo);
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        mapCanvas.zoomAt(mapCanvas._screenWidth / 2, mapCanvas._screenHeight / 2, 1.3);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        mapCanvas.zoomAt(mapCanvas._screenWidth / 2, mapCanvas._screenHeight / 2, 1 / 1.3);
    });
    // Grid starts off by default
    mapCanvas.showGrid = false;

    // Text scale buttons
    const textScaleLabel = document.getElementById('text-scale-label');
    document.getElementById('btn-text-up').addEventListener('click', () => {
        mapCanvas.textScale = Math.min(4.0, mapCanvas.textScale + 0.25);
        textScaleLabel.textContent = Math.round(mapCanvas.textScale * 100) + '%';
        mapCanvas.markDirty();
    });
    document.getElementById('btn-text-down').addEventListener('click', () => {
        mapCanvas.textScale = Math.max(0.25, mapCanvas.textScale - 0.25);
        textScaleLabel.textContent = Math.round(mapCanvas.textScale * 100) + '%';
        mapCanvas.markDirty();
    });


    // Build layer panel
    const layerContainer = document.getElementById('layer-panel');
    if (layerContainer) {
        buildLayerPanel(layerContainer, mapCanvas);
    }

    // Build nation panel
    const nationContainer = document.getElementById('nation-panel');
    if (nationContainer) {
        buildNationPanel(nationContainer, nationManager, mapCanvas, state);
    }

    // Nations overlay toggle button
    document.getElementById('btn-nations').addEventListener('click', () => {
        const on = mapCanvas.toggleNationOverlay();
        document.getElementById('btn-nations').classList.toggle('active', on);
        // Also update checkbox in nation panel
        const cb = document.getElementById('nation-overlay-toggle');
        if (cb) cb.checked = on;
    });
    document.getElementById('btn-nations').classList.remove('active');

    // Canvas mouse/touch events
    setupCanvasEvents(canvasEl);

    // Keyboard shortcuts
    setupKeyboard(canvasEl);

    // Window resize
    window.addEventListener('resize', () => mapCanvas.resize());

    // Context menu prevention
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Update undo/redo initial state
    updateUndoRedoButtons(history);

    // Show welcome overlay
    showWelcomeOverlay();
}

// ==================== Canvas Events ====================

function setupCanvasEvents(canvasEl) {
    canvasEl.addEventListener('mousedown', (e) => {
        const rect = canvasEl.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Middle mouse or space+left for panning
        if (e.button === 1 || (e.button === 0 && spaceDown)) {
            isPanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            canvasEl.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        // Right click: eyedropper (or unassign nation)
        if (e.button === 2) {
            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);
            if (state.currentTool === TOOL.NATION) {
                // Right-click with nation tool: unassign cell
                if (gx >= 0 && gx < state.mapWidth && gy >= 0 && gy < state.mapHeight) {
                    nationManager.unassignCell(gx, gy);
                    mapCanvas.markDirty();
                    rebuildNationPanel();
                }
            } else {
                if (gx >= 0 && gx < state.mapWidth && gy >= 0 && gy < state.mapHeight) {
                    const terrainId = state.grid[gy * state.mapWidth + gx];
                    state.selectedTerrain = terrainId;
                    const palette = document.getElementById('terrain-palette');
                    updatePaletteSelection(palette, terrainId);
                }
            }
            e.preventDefault();
            return;
        }

        // Left click: paint, label, measure, or minimap
        if (e.button === 0) {
            // Check minimap click first
            const minimapHit = mapCanvas.minimapHitTest(sx, sy);
            if (minimapHit) {
                mapCanvas.panToNormalized(minimapHit.normX, minimapHit.normY);
                isMinimapDragging = true;
                e.preventDefault();
                return;
            }

            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);

            // Measure tool
            if (state.currentTool === TOOL.MEASURE) {
                isMeasuring = true;
                measureStartGX = gx;
                measureStartGY = gy;
                mapCanvas.measureLine = null;
                mapCanvas.markDirty();
                return;
            }

            // Label tool: click to create/edit, drag to move
            if (state.currentTool === TOOL.LABEL) {
                handleLabelMouseDown(gx, gy, e.clientX, e.clientY);
                return;
            }

            // Nation tool: start lasso to draw territory boundary
            if (state.currentTool === TOOL.NATION) {
                if (state.selectedNationId === null) return;
                nationLassoPoints = [{ sx, sy }];
                nationLassoGridPoints = [{ gx, gy }];
                mapCanvas.nationLasso = nationLassoPoints;
                mapCanvas.markDirty();
                return;
            }

            if (state.currentTool === TOOL.LINE || state.currentTool === TOOL.RECT) {
                // Start drag for line/rect
                dragStartGX = gx;
                dragStartGY = gy;
                isPainting = true;
                return;
            }

            if (state.currentTool === TOOL.FILL) {
                handleFill(gx, gy);
                return;
            }

            // Brush or eraser: begin stroke
            isPainting = true;
            lastPaintGX = gx;
            lastPaintGY = gy;
            history.beginAction();
            applyBrush(gx, gy);
            markBrushCellsDirty(gx, gy);
        }
    });

    canvasEl.addEventListener('mousemove', (e) => {
        const rect = canvasEl.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        if (isPanning) {
            mapCanvas.pan(e.clientX - lastPanX, e.clientY - lastPanY);
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            return;
        }

        // Minimap dragging
        if (isMinimapDragging) {
            const minimapHit = mapCanvas.minimapHitTest(sx, sy);
            if (minimapHit) {
                mapCanvas.panToNormalized(minimapHit.normX, minimapHit.normY);
            }
            return;
        }

        // Nation lasso dragging
        if (nationLassoPoints !== null) {
            nationLassoPoints.push({ sx, sy });
            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);
            nationLassoGridPoints.push({ gx, gy });
            mapCanvas.nationLasso = nationLassoPoints;
            mapCanvas.markDirty();
            return;
        }

        // Measure tool dragging
        if (isMeasuring && measureStartGX !== null) {
            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);
            const dx = gx - measureStartGX;
            const dy = gy - measureStartGY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            mapCanvas.measureLine = {
                x0: measureStartGX, y0: measureStartGY,
                x1: gx, y1: gy,
                distance,
                fadeStart: null
            };
            mapCanvas.markDirty();
            // Update status bar with distance
            const el = document.getElementById('status-bar');
            if (el) {
                el.textContent = `Measuring: ${distance.toFixed(1)} cells  |  From (${measureStartGX}, ${measureStartGY}) to (${gx}, ${gy})`;
            }
            return;
        }

        // Label dragging
        if (draggingLabelId !== null) {
            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);
            const gridX = gx + labelDragOffsetX;
            const gridY = gy + labelDragOffsetY;
            labelManager.updateLabel(draggingLabelId, { x: gridX, y: gridY });
            mapCanvas.markDirty();
            return;
        }

        if (isPainting) {
            const { gx, gy } = mapCanvas.screenToGrid(sx, sy);

            if (state.currentTool === TOOL.LINE) {
                // Preview line
                const terrainId = state.selectedTerrain;
                const cells = getLineCells(
                    dragStartGX, dragStartGY, gx, gy,
                    state.brushSize, state.mapWidth, state.mapHeight, state.softEdge
                );
                mapCanvas.previewCells = cells.map(c => ({ ...c, terrainId }));
                mapCanvas.markDirty();
                return;
            }

            if (state.currentTool === TOOL.RECT) {
                const terrainId = state.selectedTerrain;
                const cells = getRectCells(
                    dragStartGX, dragStartGY, gx, gy,
                    state.mapWidth, state.mapHeight
                );
                mapCanvas.previewCells = cells.map(c => ({ ...c, terrainId }));
                mapCanvas.markDirty();
                return;
            }

            // Continuous brush/eraser painting with interpolation
            if (lastPaintGX !== null) {
                interpolatePaint(lastPaintGX, lastPaintGY, gx, gy);
            } else {
                applyBrush(gx, gy);
            }
            lastPaintGX = gx;
            lastPaintGY = gy;
            markBrushCellsDirty(gx, gy);
        }

        // Update status bar
        const { gx, gy } = mapCanvas.screenToGrid(sx, sy);
        updateStatusBar(gx, gy);
    });

    const endPaint = (e) => {
        if (isPanning) {
            isPanning = false;
            updateCursor(canvasEl, state.currentTool);
            return;
        }

        // End minimap drag
        if (isMinimapDragging) {
            isMinimapDragging = false;
            return;
        }

        // End nation lasso
        if (nationLassoPoints !== null) {
            if (nationLassoGridPoints.length >= 3 && state.selectedNationId !== null) {
                assignNationFromLasso(nationLassoGridPoints, state.selectedNationId);
            }
            nationLassoPoints = null;
            nationLassoGridPoints = null;
            mapCanvas.nationLasso = null;
            mapCanvas.markDirty();
            rebuildNationPanel();
            return;
        }

        // End measurement
        if (isMeasuring) {
            isMeasuring = false;
            if (mapCanvas.measureLine && mapCanvas.measureLine.distance > 0) {
                // Start the fade-out timer
                mapCanvas.measureLine.fadeStart = performance.now();
                mapCanvas.markDirty();
            } else {
                mapCanvas.measureLine = null;
            }
            measureStartGX = null;
            measureStartGY = null;
            return;
        }

        // End label drag
        if (draggingLabelId !== null) {
            draggingLabelId = null;
            mapCanvas.markDirty();
            return;
        }

        if (isPainting) {
            if (state.currentTool === TOOL.LINE || state.currentTool === TOOL.RECT) {
                // Commit the preview
                if (mapCanvas.previewCells && mapCanvas.previewCells.length > 0) {
                    history.beginAction();
                    for (const cell of mapCanvas.previewCells) {
                        if (cell.x >= 0 && cell.x < state.mapWidth && cell.y >= 0 && cell.y < state.mapHeight) {
                            const idx = cell.y * state.mapWidth + cell.x;
                            const oldVal = state.grid[idx];
                            // Apply opacity/weight-based painting
                            if (cell.weight * state.brushOpacity >= seededThreshold(cell.x, cell.y)) {
                                history.recordCell(cell.x, cell.y, oldVal, cell.terrainId);
                                state.grid[idx] = cell.terrainId;
                            }
                        }
                    }
                    history.commitAction();
                    // Mark each changed cell's chunk as dirty
                    for (const cell of mapCanvas.previewCells) {
                        mapCanvas.markCellDirty(cell.x, cell.y);
                    }
                    mapCanvas.previewCells = null;
                }
                dragStartGX = null;
                dragStartGY = null;
            } else {
                history.commitAction();
            }
            isPainting = false;
            lastPaintGX = null;
            lastPaintGY = null;
        }
    };

    canvasEl.addEventListener('mouseup', endPaint);
    canvasEl.addEventListener('mouseleave', endPaint);

    // Mouse wheel zoom
    canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvasEl.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        mapCanvas.zoomAt(sx, sy, factor);
    }, { passive: false });
}

function seededThreshold(x, y) {
    // Simple hash for opacity dithering
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >> 13)) | 0;
    return (h & 0xff) / 255;
}

function markBrushCellsDirty(gx, gy) {
    const half = Math.ceil(state.brushSize / 2);
    for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
            const cx = gx + dx;
            const cy = gy + dy;
            if (cx >= 0 && cx < state.mapWidth && cy >= 0 && cy < state.mapHeight) {
                mapCanvas.markCellDirty(cx, cy);
            }
        }
    }
}

function applyBrush(gx, gy) {
    const tool = state.currentTool;
    const terrainId = tool === TOOL.ERASER ? TERRAIN_TYPES.DEEP_OCEAN.id : state.selectedTerrain;
    const cells = getBrushCells(gx, gy, state.brushSize, state.mapWidth, state.mapHeight, state.softEdge);

    for (const cell of cells) {
        if (cell.x < 0 || cell.x >= state.mapWidth || cell.y < 0 || cell.y >= state.mapHeight) continue;
        const idx = cell.y * state.mapWidth + cell.x;
        const oldVal = state.grid[idx];

        // Opacity and weight check
        const effectiveOpacity = cell.weight * state.brushOpacity;
        if (effectiveOpacity >= seededThreshold(cell.x, cell.y)) {
            history.recordCell(cell.x, cell.y, oldVal, terrainId);
            state.grid[idx] = terrainId;
        }
    }
}

function interpolatePaint(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const gx = Math.round(x0 + dx * t);
        const gy = Math.round(y0 + dy * t);
        applyBrush(gx, gy);
    }
}

function handleFill(gx, gy) {
    const terrainId = state.selectedTerrain;
    const cells = floodFill(state.grid, state.mapWidth, state.mapHeight, gx, gy, terrainId);
    if (cells.length === 0) return;

    history.beginAction();
    for (const cell of cells) {
        const idx = cell.y * state.mapWidth + cell.x;
        const oldVal = state.grid[idx];
        history.recordCell(cell.x, cell.y, oldVal, terrainId);
        state.grid[idx] = terrainId;
        mapCanvas.markCellDirty(cell.x, cell.y);
    }
    history.commitAction();
}

function updateStatusBar(gx, gy) {
    const el = document.getElementById('status-bar');
    if (!el) return;
    if (gx >= 0 && gx < state.mapWidth && gy >= 0 && gy < state.mapHeight) {
        const terrainId = state.grid[gy * state.mapWidth + gx];
        const terrain = TERRAIN_BY_ID[terrainId];
        el.textContent = `Cell: ${gx}, ${gy}  |  Terrain: ${terrain ? terrain.name : 'Unknown'}  |  Zoom: ${Math.round(mapCanvas.zoom * 100)}%`;
    } else {
        el.textContent = `Zoom: ${Math.round(mapCanvas.zoom * 100)}%`;
    }
}

// ==================== Label Tool ====================

function handleLabelMouseDown(gx, gy, clientX, clientY) {
    closeLabelEditor();

    // Check if clicking an existing label (search radius scales with zoom)
    const searchRadius = Math.max(2, 8 / mapCanvas.zoom);
    const existingLabel = labelManager.findLabelAt(gx, gy, searchRadius);

    if (existingLabel) {
        // Select the label
        mapCanvas.selectedLabelId = existingLabel.id;
        mapCanvas.markDirty();

        // Start drag tracking (we'll distinguish click vs drag on mouseup)
        draggingLabelId = existingLabel.id;
        labelDragOffsetX = existingLabel.x - gx;
        labelDragOffsetY = existingLabel.y - gy;

        // Also show the editor after a brief timeout (allows drag to cancel it)
        const startX = clientX;
        const startY = clientY;
        const labelId = existingLabel.id;

        const checkDragTimer = setTimeout(() => {
            // If still dragging the same label, don't open editor yet
            // Editor will open on mouseup if it was just a click
        }, 200);

        // Use a one-time mouseup to detect click vs drag
        const onMouseUp = (e) => {
            clearTimeout(checkDragTimer);
            document.removeEventListener('mouseup', onMouseUp);

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const wasDrag = Math.sqrt(dx * dx + dy * dy) > 5;

            if (!wasDrag) {
                // It was a click, open editor
                const label = labelManager.getLabel(labelId);
                if (label) {
                    showLabelEditor(e.clientX, e.clientY, label,
                        (props) => {
                            labelManager.updateLabel(labelId, props);
                            mapCanvas.markDirty();
                        },
                        () => {
                            labelManager.removeLabel(labelId);
                            mapCanvas.selectedLabelId = null;
                            mapCanvas.markDirty();
                        }
                    );
                }
            }
            draggingLabelId = null;
        };
        document.addEventListener('mouseup', onMouseUp, { once: true });

    } else {
        // No existing label: create a new one
        mapCanvas.selectedLabelId = null;
        mapCanvas.markDirty();

        showLabelEditor(clientX, clientY, null,
            (props) => {
                const newId = labelManager.addLabel(gx, gy, props.text, props.type, props.marker);
                labelManager.updateLabel(newId, {
                    fontSize: props.fontSize,
                    color: props.color
                });
                mapCanvas.selectedLabelId = newId;
                mapCanvas.markDirty();
            },
            null
        );
    }
}

// ==================== Nation Tool ====================

function assignNationFromLasso(gridPoints, nationId) {
    // Find bounding box of the lasso polygon in grid coords
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of gridPoints) {
        if (p.gx < minX) minX = p.gx;
        if (p.gx > maxX) maxX = p.gx;
        if (p.gy < minY) minY = p.gy;
        if (p.gy > maxY) maxY = p.gy;
    }
    minX = Math.max(0, Math.floor(minX));
    maxX = Math.min(state.mapWidth - 1, Math.ceil(maxX));
    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(state.mapHeight - 1, Math.ceil(maxY));

    const WATER_IDS = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id
    ]);

    // For each cell in the bounding box, test if it's inside the lasso polygon
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (pointInPolygon(x + 0.5, y + 0.5, gridPoints)) {
                // Only assign land/structure cells, not deep ocean
                const tid = state.grid[y * state.mapWidth + x];
                if (!WATER_IDS.has(tid)) {
                    nationManager.assignCell(nationId, x, y);
                }
            }
        }
    }
    mapCanvas.markDirty();
}

// Ray casting algorithm for point-in-polygon test
function pointInPolygon(px, py, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].gx, yi = polygon[i].gy;
        const xj = polygon[j].gx, yj = polygon[j].gy;
        if (((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function rebuildNationPanel() {
    const container = document.getElementById('nation-panel');
    if (container) {
        buildNationPanel(container, nationManager, mapCanvas, state);
    }
}

// ==================== Keyboard ====================

function setupKeyboard(canvasEl) {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === ' ') {
            spaceDown = true;
            canvasEl.style.cursor = 'grab';
            e.preventDefault();
            return;
        }

        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z'))) {
            e.preventDefault();
            handleRedo();
            return;
        }

        // Escape: close label editor, deselect label
        if (e.key === 'Escape') {
            closeLabelEditor();
            if (mapCanvas.selectedLabelId !== null) {
                mapCanvas.selectedLabelId = null;
                mapCanvas.markDirty();
            }
            return;
        }

        // Delete/Backspace: delete selected label
        if ((e.key === 'Delete' || e.key === 'Backspace') && state.currentTool === TOOL.LABEL && mapCanvas.selectedLabelId !== null) {
            labelManager.removeLabel(mapCanvas.selectedLabelId);
            mapCanvas.selectedLabelId = null;
            closeLabelEditor();
            mapCanvas.markDirty();
            return;
        }

        // Tool shortcuts
        const toolMap = { 'b': TOOL.BRUSH, 'f': TOOL.FILL, 'e': TOOL.ERASER, 'l': TOOL.LINE, 'r': TOOL.RECT, 't': TOOL.LABEL, 'd': TOOL.MEASURE, 'n': TOOL.NATION };
        if (toolMap[e.key.toLowerCase()]) {
            state.currentTool = toolMap[e.key.toLowerCase()];
            updateToolSelection(document.getElementById('tool-buttons'), state.currentTool);
            updateCursor(canvasEl, state.currentTool);
            return;
        }


        // Terrain shortcuts (1-0 maps to first 10 terrains)
        const terrainKeys = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9 };
        if (terrainKeys[e.key] !== undefined) {
            const terrain = TERRAIN_LIST[terrainKeys[e.key]];
            if (terrain) {
                state.selectedTerrain = terrain.id;
                updatePaletteSelection(document.getElementById('terrain-palette'), terrain.id);
            }
            return;
        }

        // Brush size with [ and ]
        if (e.key === '[') {
            state.brushSize = Math.max(1, state.brushSize - 1);
            document.getElementById('brush-size').value = state.brushSize;
            document.getElementById('brush-size-label').textContent = state.brushSize;
            return;
        }
        if (e.key === ']') {
            state.brushSize = Math.min(20, state.brushSize + 1);
            document.getElementById('brush-size').value = state.brushSize;
            document.getElementById('brush-size-label').textContent = state.brushSize;
            return;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === ' ') {
            spaceDown = false;
            updateCursor(canvasEl, state.currentTool);
        }
    });
}

// ==================== Toolbar Actions ====================

async function handleNew() {
    const result = await showNewMapDialog();
    if (!result) return;
    state.mapWidth = result.width;
    state.mapHeight = result.height;
    state.mapName = 'Untitled Map';
    document.getElementById('map-name').value = state.mapName;
    initGrid();
    labelManager = new LabelManager();
    state.labelManager = labelManager;
    mapCanvas.labelManager = labelManager;
    nationManager = new NationManager();
    state.nationManager = nationManager;
    state.selectedNationId = null;
    mapCanvas.nationManager = nationManager;
    rebuildNationPanel();
    history.clear();
    mapCanvas.state = state;
    mapCanvas._chunks.clear();
    mapCanvas.centerView();
    mapCanvas.markAllDirty();
}

function handleSave() {
    const json = serializeMap(state);
    const filename = (state.mapName || 'map').replace(/[^a-z0-9_-]/gi, '_') + '.json';
    downloadFile(filename, json);
}

async function handleLoad() {
    try {
        const content = await loadFileDialog();
        const loaded = deserializeMap(content);
        state.mapWidth = loaded.mapWidth;
        state.mapHeight = loaded.mapHeight;
        state.mapName = loaded.mapName;
        state.grid = loaded.grid;
        document.getElementById('map-name').value = state.mapName;
        // Restore labels
        labelManager = new LabelManager();
        if (loaded.labels) {
            labelManager.deserialize(loaded.labels);
        }
        state.labelManager = labelManager;
        mapCanvas.labelManager = labelManager;
        // Restore nations
        nationManager = new NationManager();
        if (loaded.nations) {
            nationManager.deserialize(loaded.nations);
        }
        state.nationManager = nationManager;
        state.selectedNationId = null;
        mapCanvas.nationManager = nationManager;
        rebuildNationPanel();
        history.clear();
        mapCanvas.state = state;
        mapCanvas._chunks.clear();
        mapCanvas.centerView();
        mapCanvas.markAllDirty();
    } catch (err) {
        console.error('Load error:', err);
        alert('Failed to load map: ' + err.message);
    }
}

function handleExport() {
    const offscreen = mapCanvas.renderFullMap();
    const filename = (state.mapName || 'map').replace(/[^a-z0-9_-]/gi, '_') + '.png';
    exportCanvasAsPNG(offscreen, filename);
}

async function handleGenerate() {
    const result = await showGenerateDialog();
    if (!result) return;

    // Pokemon mode: enforce minimum 500x500 map
    if (result.mode === 'pokemon') {
        if (state.mapWidth < 500 || state.mapHeight < 500) {
            state.mapWidth = 500;
            state.mapHeight = 500;
            initGrid();
            mapCanvas.state = state;
            mapCanvas._chunks.clear();
        }
    }

    generateMap(state.grid, state.mapWidth, state.mapHeight, result.mode, result.seed, nationManager, labelManager);
    state.selectedNationId = null;
    rebuildNationPanel();
    history.clear();

    // Pokemon mode: auto-enable smooth rendering for softer graphics
    if (result.mode === 'pokemon') {
        if (!mapCanvas.smoothMode) {
            mapCanvas.toggleSmoothMode();
        }
    } else {
        if (mapCanvas.smoothMode) {
            mapCanvas.toggleSmoothMode();
        }
    }

    mapCanvas.centerView();
    mapCanvas.markAllDirty();
}

function handleUndo() {
    const changes = history.undo();
    if (!changes) return;
    for (const c of changes) {
        state.grid[c.y * state.mapWidth + c.x] = c.val;
        mapCanvas.markCellDirty(c.x, c.y);
    }
}

function handleRedo() {
    const changes = history.redo();
    if (!changes) return;
    for (const c of changes) {
        state.grid[c.y * state.mapWidth + c.x] = c.val;
        mapCanvas.markCellDirty(c.x, c.y);
    }
}

// ==================== Boot ====================

document.addEventListener('DOMContentLoaded', init);
