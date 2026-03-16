// canvas.js - Canvas rendering engine: viewport, zoom, pan, grid, chunk-cached terrain rendering

import { renderTerrainCell, renderTerrainBase, renderTerrainSprite, TERRAIN_BY_ID } from './terrain.js';
import { LABEL_TYPES } from './labels.js';
import { drawMarker } from './markers.js';

export class MapCanvas {
    constructor(canvasEl, state) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.state = state;

        // Viewport: offset in world-pixels, zoom factor
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;
        this.baseCellSize = 6;
        this.showGrid = true;
        this.smoothMode = false;
        this.textScale = 1.0;  // user-adjustable text scale multiplier

        // Rendering
        this._rafId = null;
        this._dirty = true;

        // Preview overlay (for line/rect tools)
        this.previewCells = null;

        // Chunk-based caching
        this._chunkSize = 64;      // cells per chunk side (larger = fewer chunks = less overhead)
        this._chunkPadding = 1;    // extra cells of padding for sprite overflow
        this._chunks = new Map();  // key: "chunkCol,chunkRow" -> { canvas, ctx, dirty, zoom }
        this._maxChunksPerFrame = 30; // frame budget: max chunks to re-render per frame

        // Smooth mode temp canvas (cached to avoid recreating every frame)
        this._smoothTempCanvas = null;
        this._smoothTempCtx = null;

        // Minimap
        this.showMinimap = true;
        this._minimapDirty = true;
        this._minimapCanvas = null;
        this._minimapCtx = null;
        this._minimapW = 0;
        this._minimapH = 0;
        this._minimapMargin = 10;
        this._minimapMaxWidth = 200;

        // Layer visibility
        this.visibleLayers = { water: true, land: true, structures: true };
        this._hiddenColor = '#2a2a3a';

        // Measurement line
        this.measureLine = null;   // { x0, y0, x1, y1, distance, fadeStart }
        this._measureFadeDuration = 3000;

        // Labels
        this.labelManager = null;      // Set from app.js
        this.selectedLabelId = null;    // Currently selected label id for highlight

        // Nation lasso drawing preview
        this.nationLasso = null;       // Array of {sx, sy} screen points, or null

        // Nations overlay
        this.nationManager = null;     // Set from app.js
        this.showNationOverlay = false;

        this.resize();
    }

    get cellSize() {
        return this.baseCellSize * this.zoom;
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        this._screenWidth = rect.width;
        this._screenHeight = rect.height;
        this.markAllDirty();
    }

    /**
     * Convert screen (mouse) coordinates to grid cell coordinates.
     */
    screenToGrid(sx, sy) {
        const cs = this.cellSize;
        const gx = Math.floor((sx - this.offsetX) / cs);
        const gy = Math.floor((sy - this.offsetY) / cs);
        return { gx, gy };
    }

    /**
     * Convert grid coordinates to screen pixel coordinates of cell center.
     */
    gridToScreen(gx, gy) {
        const cs = this.cellSize;
        return {
            sx: gx * cs + this.offsetX + cs / 2,
            sy: gy * cs + this.offsetY + cs / 2
        };
    }

    /**
     * Center view on the map.
     */
    centerView() {
        const totalW = this.state.mapWidth * this.cellSize;
        const totalH = this.state.mapHeight * this.cellSize;
        this.offsetX = (this._screenWidth - totalW) / 2;
        this.offsetY = (this._screenHeight - totalH) / 2;
        this.markAllDirty();
    }

    /**
     * Zoom around a screen point.
     * Uses deferred chunk re-rendering: composites existing chunks at new scale
     * immediately, then progressively re-renders at correct resolution.
     */
    zoomAt(sx, sy, factor) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.15, Math.min(12, this.zoom * factor));
        const ratio = this.zoom / oldZoom;
        this.offsetX = sx - (sx - this.offsetX) * ratio;
        this.offsetY = sy - (sy - this.offsetY) * ratio;
        // Only mark dirty for composite redraw — chunks will re-render
        // progressively when their zoom doesn't match current zoom
        this._dirty = true;
        this._minimapDirty = true;
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        // Pan doesn't invalidate chunk caches, just needs a composite redraw
        this._dirty = true;
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        this._dirty = true;
        return this.showGrid;
    }

    toggleMinimap() {
        this.showMinimap = !this.showMinimap;
        this._dirty = true;
        return this.showMinimap;
    }

    toggleNationOverlay() {
        this.showNationOverlay = !this.showNationOverlay;
        this._dirty = true;
        return this.showNationOverlay;
    }

    /**
     * Toggle smooth rendering mode. When on, grid is hidden and
     * a softening/blur pass is applied to blend cell edges.
     * Returns the new smooth mode state.
     */
    toggleSmoothMode() {
        this.smoothMode = !this.smoothMode;
        if (this.smoothMode) {
            this.showGrid = false;
            // Increase chunk padding for more overlap blending area
            this._chunkPadding = 2;
        } else {
            // Restore default chunk padding
            this._chunkPadding = 1;
        }
        // Clear chunk cache since padding changed (affects canvas sizes)
        this._chunks.clear();
        this.markAllDirty();
        return this.smoothMode;
    }

    /**
     * Set a layer's visibility and mark all chunks dirty.
     */
    setLayerVisible(layerName, visible) {
        if (this.visibleLayers[layerName] === undefined) return;
        this.visibleLayers[layerName] = visible;
        this.markAllDirty();
        this._minimapDirty = true;
    }

    /**
     * Check if a terrain category is visible based on layer settings.
     */
    _isTerrainVisible(terrainId) {
        const terrain = TERRAIN_BY_ID[terrainId];
        if (!terrain) return true;
        const cat = terrain.category;
        if (cat === 'water') return this.visibleLayers.water;
        if (cat === 'land') return this.visibleLayers.land;
        if (cat === 'structure') return this.visibleLayers.structures;
        return true;
    }

    /**
     * Check if a screen point is within the minimap bounds.
     * Returns the normalized position (0-1) within the map, or null.
     */
    minimapHitTest(sx, sy) {
        if (!this.showMinimap || !this._minimapCanvas) return null;
        const margin = this._minimapMargin;
        const mw = this._minimapW;
        const mh = this._minimapH;
        const statusBarH = 28;
        const mx = this._screenWidth - mw - margin;
        const my = this._screenHeight - mh - margin - statusBarH;

        if (sx >= mx && sx <= mx + mw && sy >= my && sy <= my + mh) {
            const normX = (sx - mx) / mw;
            const normY = (sy - my) / mh;
            return { normX, normY };
        }
        return null;
    }

    /**
     * Pan the view so that the given normalized map position is centered.
     */
    panToNormalized(normX, normY) {
        const cs = this.cellSize;
        const targetWorldX = normX * this.state.mapWidth * cs;
        const targetWorldY = normY * this.state.mapHeight * cs;
        this.offsetX = this._screenWidth / 2 - targetWorldX;
        this.offsetY = this._screenHeight / 2 - targetWorldY;
        this._dirty = true;
    }

    /**
     * Mark the rendering as needing a redraw (for pan, grid toggle, preview).
     * Does NOT invalidate chunk caches.
     */
    markDirty() {
        this._dirty = true;
    }

    /**
     * Mark ALL chunks as dirty (for zoom change, resize, generate, load).
     */
    markAllDirty() {
        this._dirty = true;
        this._minimapDirty = true;
        for (const chunk of this._chunks.values()) {
            chunk.dirty = true;
        }
    }

    /**
     * Mark only the chunk containing a specific grid cell as dirty.
     * Also marks neighboring chunks dirty if the cell is on a chunk edge
     * (because edge blending and sprite overflow can affect neighbors).
     */
    markCellDirty(gx, gy) {
        this._dirty = true;
        this._minimapDirty = true;
        const cs = this._chunkSize;
        const chunkCol = Math.floor(gx / cs);
        const chunkRow = Math.floor(gy / cs);

        // Mark this chunk and its neighbors dirty (for blending/overflow)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const key = `${chunkCol + dc},${chunkRow + dr}`;
                const chunk = this._chunks.get(key);
                if (chunk) chunk.dirty = true;
            }
        }
    }

    /**
     * Get or create a chunk entry for the given chunk coordinates.
     */
    _getChunk(chunkCol, chunkRow) {
        const key = `${chunkCol},${chunkRow}`;
        let chunk = this._chunks.get(key);
        if (!chunk) {
            chunk = { canvas: null, ctx: null, dirty: true, zoom: -1 };
            this._chunks.set(key, chunk);
        }
        return chunk;
    }

    /**
     * Ensure a chunk's offscreen canvas is the right size for the current zoom.
     */
    _ensureChunkCanvas(chunk) {
        const cs = this.cellSize;
        const totalCells = this._chunkSize + 2 * this._chunkPadding;
        const needed = Math.ceil(totalCells * cs);

        if (!chunk.canvas || chunk.zoom !== this.zoom) {
            if (!chunk.canvas) {
                chunk.canvas = document.createElement('canvas');
                chunk.ctx = chunk.canvas.getContext('2d');
            }
            chunk.canvas.width = needed;
            chunk.canvas.height = needed;
            chunk.zoom = this.zoom;
            chunk.dirty = true;
        }
    }

    /**
     * Render a single chunk's contents onto its offscreen canvas.
     * Two-pass: first all base colors with blending, then all sprites.
     */
    _renderChunk(chunk, chunkCol, chunkRow) {
        const { grid, mapWidth, mapHeight } = this.state;
        const cs = this.cellSize;
        const pad = this._chunkPadding;
        const chunkCells = this._chunkSize;
        const ctx = chunk.ctx;

        // Enable smoothing on chunk context when in smooth mode
        ctx.imageSmoothingEnabled = this.smoothMode;
        if (this.smoothMode) {
            ctx.imageSmoothingQuality = 'high';
        }

        // Clear the offscreen canvas
        ctx.clearRect(0, 0, chunk.canvas.width, chunk.canvas.height);

        // The chunk covers grid cells [startCol..endCol) x [startRow..endRow)
        const startCol = chunkCol * chunkCells;
        const startRow = chunkRow * chunkCells;
        const endCol = Math.min(startCol + chunkCells, mapWidth);
        const endRow = Math.min(startRow + chunkCells, mapHeight);

        if (startCol >= mapWidth || startRow >= mapHeight) return;

        // Pass 1: Base colors with edge blending
        ctx.save();
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const cx = (col - startCol + pad) * cs;
                const cy = (row - startRow + pad) * cs;
                const terrainId = grid[row * mapWidth + col];
                if (this._isTerrainVisible(terrainId)) {
                    renderTerrainBase(ctx, cx, cy, cs, terrainId, col, row, grid, mapWidth, mapHeight);
                } else {
                    // Render hidden layer as neutral gray
                    ctx.fillStyle = this._hiddenColor;
                    ctx.fillRect(cx, cy, cs, cs);
                }
            }
        }
        ctx.restore();

        // Pass 2: Sprite overlays (can overflow into padding area)
        ctx.save();
        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const cx = (col - startCol + pad) * cs;
                const cy = (row - startRow + pad) * cs;
                const terrainId = grid[row * mapWidth + col];
                if (this._isTerrainVisible(terrainId)) {
                    renderTerrainSprite(ctx, cx, cy, cs, terrainId, col, row);
                }
            }
        }
        ctx.restore();

        chunk.dirty = false;
    }

    /**
     * Start the render loop.
     */
    startRenderLoop() {
        const loop = () => {
            if (this._dirty || this._hasStaleChunks()) {
                this.render();
            }
            this._rafId = requestAnimationFrame(loop);
        };
        loop();
    }

    /**
     * Check if any visible chunks have a stale zoom level.
     */
    _hasStaleChunks() {
        const cs = this.cellSize;
        const chunkCells = this._chunkSize;
        const w = this._screenWidth;
        const h = this._screenHeight;
        const { mapWidth, mapHeight } = this.state;

        const startCol = Math.max(0, Math.floor(-this.offsetX / (cs * chunkCells)));
        const startRow = Math.max(0, Math.floor(-this.offsetY / (cs * chunkCells)));
        const maxChunkCol = Math.ceil(mapWidth / chunkCells) - 1;
        const maxChunkRow = Math.ceil(mapHeight / chunkCells) - 1;
        const endCol = Math.min(maxChunkCol, Math.floor((w - this.offsetX) / (cs * chunkCells)));
        const endRow = Math.min(maxChunkRow, Math.floor((h - this.offsetY) / (cs * chunkCells)));

        for (let cr = startRow; cr <= endRow; cr++) {
            for (let cc = startCol; cc <= endCol; cc++) {
                const key = `${cc},${cr}`;
                const chunk = this._chunks.get(key);
                if (!chunk || chunk.zoom !== this.zoom || chunk.dirty) return true;
            }
        }
        return false;
    }

    stopRenderLoop() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    /**
     * Main render function with chunk-based caching and frame budgeting.
     */
    render() {
        const ctx = this.ctx;
        const w = this._screenWidth;
        const h = this._screenHeight;
        const cs = this.cellSize;
        const { grid, mapWidth, mapHeight } = this.state;
        const chunkCells = this._chunkSize;
        const pad = this._chunkPadding;

        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);

        // Determine visible chunk range from viewport
        const startCol = Math.max(0, Math.floor(-this.offsetX / (cs * chunkCells)));
        const startRow = Math.max(0, Math.floor(-this.offsetY / (cs * chunkCells)));
        const maxChunkCol = Math.ceil(mapWidth / chunkCells) - 1;
        const maxChunkRow = Math.ceil(mapHeight / chunkCells) - 1;
        const endCol = Math.min(maxChunkCol, Math.floor((w - this.offsetX) / (cs * chunkCells)));
        const endRow = Math.min(maxChunkRow, Math.floor((h - this.offsetY) / (cs * chunkCells)));

        // Frame budget: track how many chunks we re-render this frame
        let chunksRendered = 0;
        let stillDirty = false;

        // For each visible chunk: ensure canvas, re-render if dirty/stale, composite
        for (let cr = startRow; cr <= endRow; cr++) {
            for (let cc = startCol; cc <= endCol; cc++) {
                const chunk = this._getChunk(cc, cr);

                // Check if chunk needs re-rendering (dirty or wrong zoom)
                const needsRender = chunk.dirty || chunk.zoom !== this.zoom;

                if (needsRender && chunksRendered < this._maxChunksPerFrame) {
                    this._ensureChunkCanvas(chunk);
                    this._renderChunk(chunk, cc, cr);
                    chunksRendered++;
                } else if (needsRender) {
                    stillDirty = true;
                }

                // Composite — scale old chunks to current zoom if not yet re-rendered
                if (!chunk.canvas) continue;

                const chunkGridX = cc * chunkCells;
                const chunkGridY = cr * chunkCells;
                const screenX = chunkGridX * cs + this.offsetX - pad * cs;
                const screenY = chunkGridY * cs + this.offsetY - pad * cs;

                if (chunk.zoom === this.zoom) {
                    // Pixel-perfect: chunk matches current zoom
                    ctx.drawImage(chunk.canvas, screenX, screenY, chunk.canvas.width, chunk.canvas.height);
                } else {
                    // Scaled: draw old chunk stretched to current zoom (instant but blurry)
                    const totalCells = this._chunkSize + 2 * pad;
                    const drawSize = Math.ceil(totalCells * cs);
                    ctx.imageSmoothingEnabled = true;
                    ctx.drawImage(chunk.canvas, screenX, screenY, drawSize, drawSize);
                }
            }
        }

        // If we hit the frame budget or have stale chunks, keep rendering next frame
        if (stillDirty) {
            this._dirty = true;
        } else {
            this._dirty = false;
        }

        // Smooth mode post-processing — skip while chunks are still loading for responsiveness
        if (this.smoothMode && !stillDirty) {
            const blurAmount = 0.80; // scale factor (lower = more blur)
            const tw = Math.round(this.canvas.width * blurAmount);
            const th = Math.round(this.canvas.height * blurAmount);

            // Lazily create or resize the cached temp canvas
            if (!this._smoothTempCanvas ||
                this._smoothTempCanvas.width !== tw ||
                this._smoothTempCanvas.height !== th) {
                if (!this._smoothTempCanvas) {
                    this._smoothTempCanvas = document.createElement('canvas');
                    this._smoothTempCtx = this._smoothTempCanvas.getContext('2d');
                }
                this._smoothTempCanvas.width = tw;
                this._smoothTempCanvas.height = th;
            }

            const tmpCtx = this._smoothTempCtx;
            tmpCtx.imageSmoothingEnabled = true;
            tmpCtx.imageSmoothingQuality = 'high';
            // Draw the main canvas scaled down
            tmpCtx.drawImage(this.canvas, 0, 0, tw, th);

            // Draw it back scaled up with smoothing, using raw pixel coords
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this._smoothTempCanvas, 0, 0, this.canvas.width, this.canvas.height);
            ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            ctx.restore();
        }

        // Preview overlay (for line/rect tool) - always redraws
        if (this.previewCells && this.previewCells.length > 0) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            for (const cell of this.previewCells) {
                const cx = cell.x * cs + this.offsetX;
                const cy = cell.y * cs + this.offsetY;
                if (cx > w || cy > h || cx + cs < 0 || cy + cs < 0) continue;
                renderTerrainCell(ctx, cx, cy, cs, cell.terrainId, cell.x, cell.y);
            }
            ctx.restore();
        }

        // Nation overlay - colored regions with borders between nations
        if (this.showNationOverlay && this.nationManager) {
            this._renderNationOverlay(ctx, cs, w, h, mapWidth, mapHeight);
        }

        // Nation lasso preview
        if (this.nationLasso && this.nationLasso.length > 1) {
            ctx.save();
            // Get the nation color for the lasso
            let lassoColor = '#ffffff';
            if (this.nationManager && this.state) {
                const selId = this.state.selectedNationId;
                if (selId !== null) {
                    const nation = this.nationManager.getNation(selId);
                    if (nation) lassoColor = nation.color;
                }
            }

            // Draw filled preview (semi-transparent)
            ctx.beginPath();
            ctx.moveTo(this.nationLasso[0].sx, this.nationLasso[0].sy);
            for (let i = 1; i < this.nationLasso.length; i++) {
                ctx.lineTo(this.nationLasso[i].sx, this.nationLasso[i].sy);
            }
            ctx.closePath();
            ctx.fillStyle = lassoColor;
            ctx.globalAlpha = 0.15;
            ctx.fill();

            // Draw lasso outline
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = lassoColor;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw dots at start and current position
            ctx.globalAlpha = 1;
            ctx.fillStyle = lassoColor;
            const first = this.nationLasso[0];
            const last = this.nationLasso[this.nationLasso.length - 1];
            ctx.beginPath();
            ctx.arc(first.sx, first.sy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(last.sx, last.sy, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Grid overlay - always redraws
        if (this.showGrid && cs >= 6) {
            // Determine visible cell range for grid lines
            const cellStartCol = Math.max(0, Math.floor(-this.offsetX / cs));
            const cellStartRow = Math.max(0, Math.floor(-this.offsetY / cs));
            const cellEndCol = Math.min(mapWidth - 1, Math.floor((w - this.offsetX) / cs));
            const cellEndRow = Math.min(mapHeight - 1, Math.floor((h - this.offsetY) / cs));

            ctx.save();
            ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.15, cs / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let col = cellStartCol; col <= cellEndCol + 1; col++) {
                const x = col * cs + this.offsetX;
                ctx.moveTo(x, cellStartRow * cs + this.offsetY);
                ctx.lineTo(x, (cellEndRow + 1) * cs + this.offsetY);
            }
            for (let row = cellStartRow; row <= cellEndRow + 1; row++) {
                const y = row * cs + this.offsetY;
                ctx.moveTo(cellStartCol * cs + this.offsetX, y);
                ctx.lineTo((cellEndCol + 1) * cs + this.offsetX, y);
            }
            ctx.stroke();
            ctx.restore();
        }

        // Map border
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
            this.offsetX, this.offsetY,
            mapWidth * cs, mapHeight * cs
        );
        ctx.restore();

        // Label rendering pass
        this._renderLabels(ctx, cs, w, h);

        // Measurement line overlay
        if (this.measureLine) {
            const ml = this.measureLine;
            let alpha = 1;
            if (ml.fadeStart) {
                const elapsed = performance.now() - ml.fadeStart;
                alpha = 1 - elapsed / this._measureFadeDuration;
                if (alpha <= 0) {
                    this.measureLine = null;
                } else {
                    this._dirty = true; // keep redrawing during fade
                }
            }
            if (this.measureLine && alpha > 0) {
                const sx0 = ml.x0 * cs + this.offsetX + cs / 2;
                const sy0 = ml.y0 * cs + this.offsetY + cs / 2;
                const sx1 = ml.x1 * cs + this.offsetX + cs / 2;
                const sy1 = ml.y1 * cs + this.offsetY + cs / 2;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Contrasting background line
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 4;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(sx0, sy0);
                ctx.lineTo(sx1, sy1);
                ctx.stroke();

                // Dashed white line
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(sx0, sy0);
                ctx.lineTo(sx1, sy1);
                ctx.stroke();
                ctx.setLineDash([]);

                // Endpoint dots
                for (const [px, py] of [[sx0, sy0], [sx1, sy1]]) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Distance text at midpoint
                const midX = (sx0 + sx1) / 2;
                const midY = (sy0 + sy1) / 2;
                const text = `${ml.distance.toFixed(1)} cells`;
                ctx.font = 'bold 13px sans-serif';
                const tm = ctx.measureText(text);
                const textH = 16;
                const padX = 6;
                const padY = 3;

                // Background pill
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                const rx = midX - tm.width / 2 - padX;
                const ry = midY - textH / 2 - padY - 2;
                const rw = tm.width + padX * 2;
                const rh = textH + padY * 2;
                ctx.beginPath();
                ctx.roundRect(rx, ry, rw, rh, 4);
                ctx.fill();

                // Text
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, midX, midY - 2);

                ctx.restore();
            }
        }

        // Minimap overlay
        if (this.showMinimap) {
            this._renderMinimap(ctx, w, h, cs, mapWidth, mapHeight);
        }
    }

    /**
     * Render the minimap in the bottom-right corner.
     */
    _renderMinimap(ctx, screenW, screenH, cs, mapWidth, mapHeight) {
        // Calculate minimap dimensions proportional to map aspect ratio
        const aspect = mapWidth / mapHeight;
        let mw, mh;
        if (aspect >= 1) {
            mw = this._minimapMaxWidth;
            mh = Math.round(mw / aspect);
        } else {
            mh = Math.round(this._minimapMaxWidth * 0.75);
            mw = Math.round(mh * aspect);
        }
        this._minimapW = mw;
        this._minimapH = mh;

        // Rebuild minimap image if dirty
        if (this._minimapDirty || !this._minimapCanvas ||
            this._minimapCanvas.width !== mw || this._minimapCanvas.height !== mh) {
            this._rebuildMinimap(mw, mh, mapWidth, mapHeight);
        }

        const margin = this._minimapMargin;
        const statusBarH = 28;
        const mx = screenW - mw - margin;
        const my = screenH - mh - margin - statusBarH;

        ctx.save();

        // Dark background panel with rounded corners
        ctx.beginPath();
        ctx.roundRect(mx - 4, my - 4, mw + 8, mh + 8, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Clip to rounded rect for the map image
        ctx.beginPath();
        ctx.roundRect(mx, my, mw, mh, 4);
        ctx.clip();

        // Draw the cached minimap
        ctx.drawImage(this._minimapCanvas, mx, my, mw, mh);

        ctx.restore();

        // Viewport rectangle showing what's currently visible
        ctx.save();
        const scaleX = mw / (mapWidth * cs);
        const scaleY = mh / (mapHeight * cs);

        const vpX = mx + (-this.offsetX) * scaleX;
        const vpY = my + (-this.offsetY) * scaleY;
        const vpW = screenW * scaleX;
        const vpH = screenH * scaleY;

        // Clamp viewport rect to minimap bounds
        const clampX = Math.max(mx, Math.min(mx + mw, vpX));
        const clampY = Math.max(my, Math.min(my + mh, vpY));
        const clampX2 = Math.max(mx, Math.min(mx + mw, vpX + vpW));
        const clampY2 = Math.max(my, Math.min(my + mh, vpY + vpH));

        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(clampX, clampY, clampX2 - clampX, clampY2 - clampY);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(clampX, clampY, clampX2 - clampX, clampY2 - clampY);

        ctx.restore();
    }

    /**
     * Rebuild the cached minimap image from terrain base colors.
     */
    _rebuildMinimap(mw, mh, mapWidth, mapHeight) {
        if (!this._minimapCanvas) {
            this._minimapCanvas = document.createElement('canvas');
            this._minimapCtx = this._minimapCanvas.getContext('2d');
        }
        this._minimapCanvas.width = mw;
        this._minimapCanvas.height = mh;
        const mctx = this._minimapCtx;
        const { grid } = this.state;

        // Use ImageData for fast pixel-level rendering
        const imgData = mctx.createImageData(mw, mh);
        const data = imgData.data;

        // Build a color lookup table from terrain IDs
        if (!this._terrainColorLUT) {
            this._terrainColorLUT = [];
            for (let i = 0; i < 256; i++) {
                const t = TERRAIN_BY_ID[i];
                if (t && t.baseColor) {
                    const hex = t.baseColor;
                    this._terrainColorLUT[i] = {
                        r: parseInt(hex.slice(1, 3), 16),
                        g: parseInt(hex.slice(3, 5), 16),
                        b: parseInt(hex.slice(5, 7), 16)
                    };
                } else {
                    this._terrainColorLUT[i] = { r: 26, g: 26, b: 46 }; // bg color
                }
            }
        }

        const hiddenRGB = { r: 42, g: 42, b: 58 }; // #2a2a3a

        for (let py = 0; py < mh; py++) {
            const gy = Math.floor((py / mh) * mapHeight);
            for (let px = 0; px < mw; px++) {
                const gx = Math.floor((px / mw) * mapWidth);
                const terrainId = grid[gy * mapWidth + gx];
                const visible = this._isTerrainVisible(terrainId);
                const c = visible ? this._terrainColorLUT[terrainId] || hiddenRGB : hiddenRGB;
                const idx = (py * mw + px) * 4;
                data[idx] = c.r;
                data[idx + 1] = c.g;
                data[idx + 2] = c.b;
                data[idx + 3] = 255;
            }
        }

        mctx.putImageData(imgData, 0, 0);
        this._minimapDirty = false;
    }

    /**
     * Render the full map to an offscreen canvas for PNG export.
     * Uses the simple single-pass approach (no chunking needed for export).
     */
    renderFullMap() {
        const cs = Math.max(6, this.baseCellSize);
        const { grid, mapWidth, mapHeight } = this.state;
        const offscreen = document.createElement('canvas');
        offscreen.width = mapWidth * cs;
        offscreen.height = mapHeight * cs;
        const ctx = offscreen.getContext('2d');

        // Pass 1: base colors with blending
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                const terrainId = grid[row * mapWidth + col];
                renderTerrainBase(ctx, col * cs, row * cs, cs, terrainId, col, row, grid, mapWidth, mapHeight);
            }
        }

        // Pass 2: sprites
        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                const terrainId = grid[row * mapWidth + col];
                renderTerrainSprite(ctx, col * cs, row * cs, cs, terrainId, col, row);
            }
        }

        // Pass 3: labels for export
        if (this.labelManager) {
            const labels = this.labelManager.getAll();
            for (const label of labels) {
                const sx = label.x * cs + cs / 2;
                const sy = label.y * cs + cs / 2;
                this._renderSingleLabel(ctx, label, sx, sy, cs, false);
            }
        }

        return offscreen;
    }

    /**
     * Render all labels onto the main canvas.
     */
    _renderLabels(ctx, cs, viewW, viewH) {
        if (!this.labelManager) return;
        const labels = this.labelManager.getAll();
        if (labels.length === 0) return;

        for (const label of labels) {
            // Convert grid coords to screen coords
            const sx = label.x * cs + this.offsetX + cs / 2;
            const sy = label.y * cs + this.offsetY + cs / 2;

            // Cull labels that are off-screen (with generous margin for large text)
            const margin = 200;
            if (sx < -margin || sx > viewW + margin || sy < -margin || sy > viewH + margin) continue;

            const isSelected = (this.selectedLabelId === label.id);
            this._renderSingleLabel(ctx, label, sx, sy, cs, isSelected);
        }
    }

    /**
     * Render a single label at the given screen position.
     */
    _renderSingleLabel(ctx, label, sx, sy, cs, isSelected) {
        const typeDefaults = LABEL_TYPES[label.type] || LABEL_TYPES.custom;

        // Calculate font size: sqrt scaling so text stays readable at all zoom levels
        // At far zoom text shrinks slowly; at close zoom it grows slowly
        const zoomFactor = Math.sqrt(cs / 6);  // sqrt dampens extreme zoom
        const rawSize = label.fontSize * zoomFactor * this.textScale;
        const fontSize = Math.max(8, Math.min(120, rawSize));

        // Marker rendering
        const markerSize = fontSize * 1.4;
        let textOffsetY = 0;

        if (label.marker && label.marker !== 'none') {
            drawMarker(ctx, sx, sy - fontSize * 0.4, markerSize, label.marker, label.color);
            textOffsetY = markerSize * 0.45;
        }

        // Selected highlight ring
        if (isSelected) {
            ctx.save();
            ctx.strokeStyle = '#64b5f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            const ringR = Math.max(markerSize * 0.6, fontSize * 0.8);
            ctx.beginPath();
            ctx.arc(sx, sy - fontSize * 0.4 + textOffsetY * 0.3, ringR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Text rendering
        ctx.save();

        if (label.rotation) {
            ctx.translate(sx, sy + textOffsetY);
            ctx.rotate(label.rotation * Math.PI / 180);
            ctx.translate(-sx, -(sy + textOffsetY));
        }

        // Build font string
        const italic = typeDefaults.italic ? 'italic ' : '';
        const weight = typeDefaults.font === 'bold' ? 'bold ' : '';
        ctx.font = `${italic}${weight}${Math.round(fontSize)}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = label.color;

        const letterSpacing = typeDefaults.letterSpacing * (cs / 6);
        const textY = sy + textOffsetY;

        if (letterSpacing > 0 && label.text.length > 1) {
            // Draw with letter spacing
            this._drawSpacedText(ctx, label.text, sx, textY, letterSpacing);
        } else {
            // Text shadow for readability
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillText(label.text, sx, textY);
            ctx.restore();
            ctx.fillText(label.text, sx, textY);
        }

        ctx.restore();
    }

    /**
     * Draw text with custom letter spacing, centered at (cx, y).
     */
    /**
     * Render nation territory overlay: semi-transparent fills and border lines.
     */
    _renderNationOverlay(ctx, cs, viewW, viewH, mapWidth, mapHeight) {
        const nm = this.nationManager;
        if (!nm) return;
        const nations = nm.getAllNations();
        if (nations.length === 0) return;

        // Determine visible cell range
        const cellStartCol = Math.max(0, Math.floor(-this.offsetX / cs));
        const cellStartRow = Math.max(0, Math.floor(-this.offsetY / cs));
        const cellEndCol = Math.min(mapWidth - 1, Math.floor((viewW - this.offsetX) / cs));
        const cellEndRow = Math.min(mapHeight - 1, Math.floor((viewH - this.offsetY) / cs));

        // Build a color cache by nation id
        const colorCache = new Map();
        for (const n of nations) {
            colorCache.set(n.id, n.color);
        }

        ctx.save();

        // Pass 1: Semi-transparent fill for each nation cell
        for (let row = cellStartRow; row <= cellEndRow; row++) {
            for (let col = cellStartCol; col <= cellEndCol; col++) {
                const nationId = nm.getNationAt(col, row);
                if (nationId === null) continue;

                const color = colorCache.get(nationId);
                if (!color) continue;

                const sx = col * cs + this.offsetX;
                const sy = row * cs + this.offsetY;

                ctx.globalAlpha = 0.3;
                ctx.fillStyle = color;
                ctx.fillRect(sx, sy, cs, cs);
            }
        }

        // Pass 2: Border lines where nation cells meet different/no nation cells
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = Math.max(1.5, Math.min(3, cs * 0.15));

        for (let row = cellStartRow; row <= cellEndRow; row++) {
            for (let col = cellStartCol; col <= cellEndCol; col++) {
                const nationId = nm.getNationAt(col, row);
                if (nationId === null) continue;

                const color = colorCache.get(nationId);
                if (!color) continue;

                const sx = col * cs + this.offsetX;
                const sy = row * cs + this.offsetY;

                ctx.strokeStyle = color;

                // Check each edge: top, bottom, left, right
                const neighborChecks = [
                    { nx: col, ny: row - 1, x1: sx, y1: sy, x2: sx + cs, y2: sy },         // top
                    { nx: col, ny: row + 1, x1: sx, y1: sy + cs, x2: sx + cs, y2: sy + cs }, // bottom
                    { nx: col - 1, ny: row, x1: sx, y1: sy, x2: sx, y2: sy + cs },           // left
                    { nx: col + 1, ny: row, x1: sx + cs, y1: sy, x2: sx + cs, y2: sy + cs }  // right
                ];

                for (const edge of neighborChecks) {
                    const neighborNation = nm.getNationAt(edge.nx, edge.ny);
                    if (neighborNation !== nationId) {
                        ctx.beginPath();
                        ctx.moveTo(edge.x1, edge.y1);
                        ctx.lineTo(edge.x2, edge.y2);
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.restore();
    }

    _drawSpacedText(ctx, text, cx, y, spacing) {
        // Measure total width with spacing
        let totalWidth = 0;
        for (let i = 0; i < text.length; i++) {
            totalWidth += ctx.measureText(text[i]).width;
            if (i < text.length - 1) totalWidth += spacing;
        }

        let x = cx - totalWidth / 2;

        // Shadow pass
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.textAlign = 'left';
        for (let i = 0; i < text.length; i++) {
            ctx.fillText(text[i], x, y);
            x += ctx.measureText(text[i]).width + spacing;
        }
        ctx.restore();

        // Foreground pass
        x = cx - totalWidth / 2;
        ctx.textAlign = 'left';
        for (let i = 0; i < text.length; i++) {
            ctx.fillText(text[i], x, y);
            x += ctx.measureText(text[i]).width + spacing;
        }
    }
}
