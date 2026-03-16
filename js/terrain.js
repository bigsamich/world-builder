// terrain.js - Terrain type definitions and procedural rendering

// Seeded pseudo-random number generator for consistent per-cell variation
function seededRandom(x, y, seed = 0) {
    let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    h = (h ^ (h >> 16)) | 0;
    return (h & 0x7fffffff) / 0x7fffffff;
}

function seededRandomRange(x, y, min, max, seed = 0) {
    return min + seededRandom(x, y, seed) * (max - min);
}

// Color utility: lighten/darken a hex color
function adjustColor(hex, amount) {
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
    return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

export const TERRAIN_TYPES = {
    DEEP_OCEAN: {
        id: 0,
        name: 'Deep Ocean',
        key: '1',
        baseColor: '#1a3a5c',
        category: 'water'
    },
    SHALLOW_WATER: {
        id: 1,
        name: 'Shallow Water',
        key: '2',
        baseColor: '#4a8ab5',
        category: 'water'
    },
    BEACH: {
        id: 2,
        name: 'Beach / Sand',
        key: '3',
        baseColor: '#d4b878',
        category: 'land'
    },
    PLAINS: {
        id: 3,
        name: 'Plains',
        key: '4',
        baseColor: '#6aaa3a',
        category: 'land'
    },
    FOREST: {
        id: 4,
        name: 'Forest',
        key: '5',
        baseColor: '#2d6e2d',
        category: 'land'
    },
    JUNGLE: {
        id: 5,
        name: 'Dense Jungle',
        key: '6',
        baseColor: '#1a4a1a',
        category: 'land'
    },
    HILLS: {
        id: 6,
        name: 'Hills',
        key: '7',
        baseColor: '#9a8a5a',
        category: 'land'
    },
    MOUNTAINS: {
        id: 7,
        name: 'Mountains',
        key: '8',
        baseColor: '#7a7a7a',
        category: 'land'
    },
    SNOW: {
        id: 8,
        name: 'Snow / Tundra',
        key: '9',
        baseColor: '#dce8f0',
        category: 'land'
    },
    DESERT: {
        id: 9,
        name: 'Desert',
        key: '0',
        baseColor: '#d4a840',
        category: 'land'
    },
    SWAMP: {
        id: 10,
        name: 'Swamp / Marsh',
        key: null,
        baseColor: '#4a5a2a',
        category: 'land'
    },
    VOLCANIC: {
        id: 11,
        name: 'Volcanic',
        key: null,
        baseColor: '#3a1a1a',
        category: 'land'
    },
    RIVER: {
        id: 12,
        name: 'River',
        key: null,
        baseColor: '#3a7abf',
        category: 'water',
        isLine: true,
        lineWidth: 0.4
    },
    LAKE: {
        id: 13,
        name: 'Lake',
        key: null,
        baseColor: '#4a90c4',
        category: 'water'
    },
    CITY: {
        id: 14,
        name: 'City / Settlement',
        key: null,
        baseColor: '#8a8a8a',
        category: 'structure'
    },
    ROAD: {
        id: 15,
        name: 'Road / Path',
        key: null,
        baseColor: '#8a7050',
        category: 'structure',
        isLine: true,
        lineWidth: 0.4
    },
    FARMLAND: {
        id: 16,
        name: 'Farmland',
        key: null,
        baseColor: '#a8c050',
        category: 'land'
    },
    TOWN: {
        id: 17,
        name: 'Town',
        key: null,
        baseColor: '#a09080',
        category: 'structure'
    },
    RUINS: {
        id: 18,
        name: 'Ruins',
        key: null,
        baseColor: '#6a6a5a',
        category: 'structure'
    },
    ICE: {
        id: 19,
        name: 'Ice / Glacier',
        key: null,
        baseColor: '#c8e0f0',
        category: 'land'
    },
    CORAL_REEF: {
        id: 20,
        name: 'Coral Reef',
        key: null,
        baseColor: '#e07060',
        category: 'water'
    },
    CAVE: {
        id: 21,
        name: 'Cave',
        key: null,
        baseColor: '#3a3030',
        category: 'land'
    },
    FORTRESS: {
        id: 22,
        name: 'Fortress',
        key: null,
        baseColor: '#707070',
        category: 'structure'
    },
    PORT: {
        id: 23,
        name: 'Port',
        key: null,
        baseColor: '#7a90a0',
        category: 'structure'
    },
    OASIS: {
        id: 24,
        name: 'Oasis',
        key: null,
        baseColor: '#50a050',
        category: 'land'
    },
    SAVANNA: {
        id: 25,
        name: 'Savanna',
        key: null,
        baseColor: '#b8a848',
        category: 'land'
    },
    TAIGA: {
        id: 26,
        name: 'Taiga',
        key: null,
        baseColor: '#2a5a3a',
        category: 'land'
    },
    CLIFF: {
        id: 27,
        name: 'Cliff',
        key: null,
        baseColor: '#5a4a3a',
        category: 'land'
    },
    TALL_GRASS: {
        id: 28,
        name: 'Tall Grass',
        key: null,
        baseColor: '#4a9a30',
        category: 'land'
    },
    POKEMON_CENTER: {
        id: 29,
        name: 'Pokemon Center',
        key: null,
        baseColor: '#cc3333',
        category: 'structure'
    },
    GYM: {
        id: 30,
        name: 'Gym',
        key: null,
        baseColor: '#5555bb',
        category: 'structure'
    },
    POKE_MART: {
        id: 31,
        name: 'Poke Mart',
        key: null,
        baseColor: '#3377cc',
        category: 'structure'
    },
    ROUTE_PATH: {
        id: 32,
        name: 'Route Path',
        key: null,
        baseColor: '#c4a86a',
        category: 'land'
    },
    LEDGE: {
        id: 33,
        name: 'Ledge',
        key: null,
        baseColor: '#6a5a3a',
        category: 'land'
    },
    CAVE_ENTRANCE: {
        id: 34,
        name: 'Cave Entrance',
        key: null,
        baseColor: '#2a2020',
        category: 'land'
    }
};

// Build lookup by id
export const TERRAIN_BY_ID = {};
for (const key of Object.keys(TERRAIN_TYPES)) {
    TERRAIN_BY_ID[TERRAIN_TYPES[key].id] = TERRAIN_TYPES[key];
}

// Ordered list for the palette
export const TERRAIN_LIST = Object.values(TERRAIN_TYPES);

// Helper: get the varied base color components for a cell
function getCellColor(terrainId, gridX, gridY) {
    const terrain = TERRAIN_BY_ID[terrainId];
    if (!terrain) return null;
    const rgb = hexToRgb(terrain.baseColor);
    const variation = seededRandomRange(gridX, gridY, -12, 12, 1);
    return {
        r: Math.min(255, Math.max(0, rgb.r + variation)) | 0,
        g: Math.min(255, Math.max(0, rgb.g + variation)) | 0,
        b: Math.min(255, Math.max(0, rgb.b + variation)) | 0
    };
}

/**
 * Render ONLY the base color fill for a cell, with edge blending to neighbors.
 * grid, mapWidth, mapHeight are needed for neighbor lookups.
 */
export function renderTerrainBase(ctx, cx, cy, cellSize, terrainId, gridX, gridY, grid, mapWidth, mapHeight) {
    const color = getCellColor(terrainId, gridX, gridY);
    if (!color) return;

    // Fill the cell with its base color
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
    ctx.fillRect(cx, cy, cellSize + 0.5, cellSize + 0.5);

    // Edge blending: multi-pass low-opacity blending for rich terrain transitions.
    // Cardinal neighbors get a wide gradient strip; diagonal neighbors get a
    // radial corner blend. Multiple layers at low opacity produce natural results.
    if (cellSize < 3) return; // skip blending at tiny sizes

    const blendWidth = cellSize * 0.42;
    const halfCell = cellSize * 0.5;

    // --- Pass 1: Cardinal neighbor gradients (wide, low-opacity, multi-stop) ---
    const cardinals = [
        { dx: 0, dy: -1, name: 'top' },
        { dx: 1, dy: 0, name: 'right' },
        { dx: 0, dy: 1, name: 'bottom' },
        { dx: -1, dy: 0, name: 'left' }
    ];

    for (const n of cardinals) {
        const nx = gridX + n.dx;
        const ny = gridY + n.dy;
        if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;

        const neighborId = grid[ny * mapWidth + nx];
        if (neighborId === terrainId) continue;

        const nColor = getCellColor(neighborId, nx, ny);
        if (!nColor) continue;

        let grad;
        let gx, gy, gw, gh;

        switch (n.name) {
            case 'top':
                grad = ctx.createLinearGradient(cx, cy, cx, cy + blendWidth);
                gx = cx; gy = cy; gw = cellSize + 0.5; gh = blendWidth;
                break;
            case 'bottom':
                grad = ctx.createLinearGradient(cx, cy + cellSize, cx, cy + cellSize - blendWidth);
                gx = cx; gy = cy + cellSize - blendWidth; gw = cellSize + 0.5; gh = blendWidth;
                break;
            case 'left':
                grad = ctx.createLinearGradient(cx, cy, cx + blendWidth, cy);
                gx = cx; gy = cy; gw = blendWidth; gh = cellSize + 0.5;
                break;
            case 'right':
                grad = ctx.createLinearGradient(cx + cellSize, cy, cx + cellSize - blendWidth, cy);
                gx = cx + cellSize - blendWidth; gy = cy; gw = blendWidth; gh = cellSize + 0.5;
                break;
        }

        // Multi-stop gradient: soft leading edge, richer mid blend, gentle fade out
        grad.addColorStop(0, `rgba(${nColor.r},${nColor.g},${nColor.b},0.38)`);
        grad.addColorStop(0.35, `rgba(${nColor.r},${nColor.g},${nColor.b},0.22)`);
        grad.addColorStop(0.7, `rgba(${nColor.r},${nColor.g},${nColor.b},0.08)`);
        grad.addColorStop(1, `rgba(${nColor.r},${nColor.g},${nColor.b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(gx, gy, gw, gh);
    }

    // --- Pass 2: Diagonal corner blends (radial gradient at corners) ---
    if (cellSize < 8) return; // skip expensive passes at small sizes
    const diagonals = [
        { dx: -1, dy: -1, cornerX: 0, cornerY: 0 },         // top-left
        { dx: 1, dy: -1, cornerX: 1, cornerY: 0 },          // top-right
        { dx: -1, dy: 1, cornerX: 0, cornerY: 1 },          // bottom-left
        { dx: 1, dy: 1, cornerX: 1, cornerY: 1 }            // bottom-right
    ];

    for (const d of diagonals) {
        const nx = gridX + d.dx;
        const ny = gridY + d.dy;
        if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;

        const neighborId = grid[ny * mapWidth + nx];
        if (neighborId === terrainId) continue;

        const nColor = getCellColor(neighborId, nx, ny);
        if (!nColor) continue;

        const cornerPx = cx + d.cornerX * cellSize;
        const cornerPy = cy + d.cornerY * cellSize;
        const radius = blendWidth * 0.85;

        const grad = ctx.createRadialGradient(cornerPx, cornerPy, 0, cornerPx, cornerPy, radius);
        grad.addColorStop(0, `rgba(${nColor.r},${nColor.g},${nColor.b},0.25)`);
        grad.addColorStop(0.5, `rgba(${nColor.r},${nColor.g},${nColor.b},0.10)`);
        grad.addColorStop(1, `rgba(${nColor.r},${nColor.g},${nColor.b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(cornerPx - radius, cornerPy - radius, radius * 2, radius * 2);
    }

    // --- Pass 3: Noise-dithered transition fringe for organic edges ---
    // Adds scattered semi-transparent dots of neighbor color near boundaries
    // Only at larger cell sizes to keep rendering fast at overview zoom
    if (cellSize >= 10) {
        for (const n of cardinals) {
            const nx = gridX + n.dx;
            const ny = gridY + n.dy;
            if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) continue;

            const neighborId = grid[ny * mapWidth + nx];
            if (neighborId === terrainId) continue;

            const nColor = getCellColor(neighborId, nx, ny);
            if (!nColor) continue;

            const dotCount = Math.max(2, Math.floor(cellSize * 0.3));
            for (let i = 0; i < dotCount; i++) {
                // Position dots near the edge, scattered by seeded noise
                const rSeed = gridX * 127 + gridY * 311 + n.dx * 53 + n.dy * 97 + i * 17;
                const rx = seededRandom(rSeed, i, 7701);
                const ry = seededRandom(rSeed, i, 7702);
                const depth = seededRandom(rSeed, i, 7703) * 0.4; // how far inward (0-40% of cell)

                let dotX, dotY;
                switch (n.name) {
                    case 'top':    dotX = cx + rx * cellSize; dotY = cy + depth * cellSize; break;
                    case 'bottom': dotX = cx + rx * cellSize; dotY = cy + cellSize - depth * cellSize; break;
                    case 'left':   dotX = cx + depth * cellSize; dotY = cy + ry * cellSize; break;
                    case 'right':  dotX = cx + cellSize - depth * cellSize; dotY = cy + ry * cellSize; break;
                }

                const dotR = cellSize * (0.02 + seededRandom(rSeed, i, 7704) * 0.03);
                const alpha = 0.12 + (1 - depth / 0.4) * 0.18; // stronger near edge
                ctx.fillStyle = `rgba(${nColor.r},${nColor.g},${nColor.b},${alpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

/**
 * Render ONLY the sprite/icon overlay for a cell.
 * Sprites may overflow cell boundaries by up to 30% of cellSize.
 * Position is offset by a seeded random value for organic placement.
 */
export function renderTerrainSprite(ctx, cx, cy, cellSize, terrainId, gridX, gridY) {
    if (cellSize < 4) return;

    const terrain = TERRAIN_BY_ID[terrainId];
    if (!terrain) return;

    // Apply a slight seeded random offset so sprites don't sit perfectly grid-aligned
    const offsetFrac = 0.15; // max +/-15% of cellSize
    const ox = (seededRandom(gridX, gridY, 9991) - 0.5) * 2 * offsetFrac * cellSize;
    const oy = (seededRandom(gridX, gridY, 9992) - 0.5) * 2 * offsetFrac * cellSize;
    const sx = cx + ox;
    const sy = cy + oy;

    const detail = cellSize >= 8;
    const fineDetail = cellSize >= 12;

    switch (terrainId) {
        case TERRAIN_TYPES.DEEP_OCEAN.id:
            drawDeepOcean(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.SHALLOW_WATER.id:
            drawShallowWater(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.BEACH.id:
            drawBeach(ctx, sx, sy, cellSize, gridX, gridY, fineDetail);
            break;
        case TERRAIN_TYPES.PLAINS.id:
            drawPlains(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.FOREST.id:
            drawForest(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.JUNGLE.id:
            drawJungle(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.HILLS.id:
            drawHills(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.MOUNTAINS.id:
            drawMountains(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.SNOW.id:
            drawSnow(ctx, sx, sy, cellSize, gridX, gridY, fineDetail);
            break;
        case TERRAIN_TYPES.DESERT.id:
            drawDesert(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.SWAMP.id:
            drawSwamp(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.VOLCANIC.id:
            drawVolcanic(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.RIVER.id:
            drawRiver(ctx, sx, sy, cellSize, gridX, gridY);
            break;
        case TERRAIN_TYPES.LAKE.id:
            drawLake(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.CITY.id:
            drawCity(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ROAD.id:
            drawRoad(ctx, sx, sy, cellSize, gridX, gridY);
            break;
        case TERRAIN_TYPES.FARMLAND.id:
            drawFarmland(ctx, sx, sy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.TOWN.id:
            drawTown(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.RUINS.id:
            drawRuins(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ICE.id:
            drawIce(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CORAL_REEF.id:
            drawCoralReef(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CAVE.id:
            drawCave(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.FORTRESS.id:
            drawFortress(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.PORT.id:
            drawPort(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.OASIS.id:
            drawOasis(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.SAVANNA.id:
            drawSavanna(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.TAIGA.id:
            drawTaiga(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CLIFF.id:
            drawCliff(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.TALL_GRASS.id:
            drawTallGrass(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.POKEMON_CENTER.id:
            drawPokemonCenter(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.GYM.id:
            drawGym(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.POKE_MART.id:
            drawPokeMart(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ROUTE_PATH.id:
            drawRoutePath(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.LEDGE.id:
            drawLedge(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CAVE_ENTRANCE.id:
            drawCaveEntrance(ctx, sx, sy, cellSize, gridX, gridY, detail, fineDetail);
            break;
    }
}

/**
 * Render a single terrain cell onto the canvas (convenience: base + sprite).
 * cx, cy: pixel coordinates of the cell top-left
 * cellSize: pixel size of the cell
 * terrainId: which terrain
 * gridX, gridY: cell grid coordinates (for seeded randomness)
 */
export function renderTerrainCell(ctx, cx, cy, cellSize, terrainId, gridX, gridY) {
    const terrain = TERRAIN_BY_ID[terrainId];
    if (!terrain) return;

    const { baseColor } = terrain;
    const rgb = hexToRgb(baseColor);

    // Per-cell color variation
    const variation = seededRandomRange(gridX, gridY, -12, 12, 1);
    const r = Math.min(255, Math.max(0, rgb.r + variation));
    const g = Math.min(255, Math.max(0, rgb.g + variation));
    const b = Math.min(255, Math.max(0, rgb.b + variation));

    ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
    ctx.fillRect(cx, cy, cellSize + 0.5, cellSize + 0.5);

    // Only draw detail patterns when cells are large enough to see
    if (cellSize < 4) return;

    const detail = cellSize >= 8;
    const fineDetail = cellSize >= 12;

    switch (terrainId) {
        case TERRAIN_TYPES.DEEP_OCEAN.id:
            drawDeepOcean(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.SHALLOW_WATER.id:
            drawShallowWater(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.BEACH.id:
            drawBeach(ctx, cx, cy, cellSize, gridX, gridY, fineDetail);
            break;
        case TERRAIN_TYPES.PLAINS.id:
            drawPlains(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.FOREST.id:
            drawForest(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.JUNGLE.id:
            drawJungle(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.HILLS.id:
            drawHills(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.MOUNTAINS.id:
            drawMountains(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.SNOW.id:
            drawSnow(ctx, cx, cy, cellSize, gridX, gridY, fineDetail);
            break;
        case TERRAIN_TYPES.DESERT.id:
            drawDesert(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.SWAMP.id:
            drawSwamp(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.VOLCANIC.id:
            drawVolcanic(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.RIVER.id:
            drawRiver(ctx, cx, cy, cellSize, gridX, gridY);
            break;
        case TERRAIN_TYPES.LAKE.id:
            drawLake(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.CITY.id:
            drawCity(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ROAD.id:
            drawRoad(ctx, cx, cy, cellSize, gridX, gridY);
            break;
        case TERRAIN_TYPES.FARMLAND.id:
            drawFarmland(ctx, cx, cy, cellSize, gridX, gridY, detail);
            break;
        case TERRAIN_TYPES.TOWN.id:
            drawTown(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.RUINS.id:
            drawRuins(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ICE.id:
            drawIce(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CORAL_REEF.id:
            drawCoralReef(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CAVE.id:
            drawCave(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.FORTRESS.id:
            drawFortress(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.PORT.id:
            drawPort(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.OASIS.id:
            drawOasis(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.SAVANNA.id:
            drawSavanna(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.TAIGA.id:
            drawTaiga(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CLIFF.id:
            drawCliff(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.TALL_GRASS.id:
            drawTallGrass(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.POKEMON_CENTER.id:
            drawPokemonCenter(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.GYM.id:
            drawGym(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.POKE_MART.id:
            drawPokeMart(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.ROUTE_PATH.id:
            drawRoutePath(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.LEDGE.id:
            drawLedge(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
        case TERRAIN_TYPES.CAVE_ENTRANCE.id:
            drawCaveEntrance(ctx, cx, cy, cellSize, gridX, gridY, detail, fineDetail);
            break;
    }
}

// --- Individual terrain renderers ---
// All sprites are bold, high-contrast, and clearly visible.
// Opacity values range 0.5-0.9 for strong visibility.
// Line widths scale proportionally to cell size.

function drawDeepOcean(ctx, cx, cy, s, gx, gy, detail) {
    // 3 bold white-blue wavy lines on dark blue, darker gradient at bottom
    ctx.save();
    const lw = Math.max(1, s * 0.07);
    const phase = seededRandom(gx, gy, 10) * Math.PI * 2;

    // Darker blue gradient at bottom
    ctx.fillStyle = 'rgba(10,20,50,0.35)';
    ctx.fillRect(cx, cy + s * 0.65, s, s * 0.35);

    // 3 wavy lines
    const yPositions = [0.25, 0.5, 0.75];
    const alphas = [0.7, 0.8, 0.6];
    for (let i = 0; i < 3; i++) {
        const yBase = cy + s * yPositions[i];
        const amp = s * 0.08;
        ctx.strokeStyle = `rgba(180,210,255,${alphas[i]})`;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= s; x += s * 0.05) {
            const wavY = yBase + Math.sin((x / s) * Math.PI * 2 + phase + i * 1.5) * amp;
            if (x === 0) ctx.moveTo(cx + x, wavY);
            else ctx.lineTo(cx + x, wavY);
        }
        ctx.stroke();
    }

    if (detail) {
        // Small foam dots between waves
        ctx.fillStyle = 'rgba(200,230,255,0.5)';
        for (let i = 0; i < 3; i++) {
            const dx = seededRandom(gx, gy, 12 + i) * s * 0.7 + s * 0.15;
            const dy = seededRandom(gx, gy, 15 + i) * s * 0.6 + s * 0.2;
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dy, s * 0.02, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawShallowWater(ctx, cx, cy, s, gx, gy, detail) {
    // 2 lighter, thinner wavy lines, more spaced apart, light blue tint
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const phase = seededRandom(gx, gy, 20) * Math.PI * 2;

    // Light blue tint overlay
    ctx.fillStyle = 'rgba(150,210,255,0.2)';
    ctx.fillRect(cx, cy, s, s);

    const yPositions = [0.35, 0.65];
    for (let i = 0; i < 2; i++) {
        const yBase = cy + s * yPositions[i];
        const amp = s * 0.06;
        ctx.strokeStyle = `rgba(200,235,255,${0.65 - i * 0.1})`;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= s; x += s * 0.05) {
            const wavY = yBase + Math.sin((x / s) * Math.PI * 2 + phase + i * 2) * amp;
            if (x === 0) ctx.moveTo(cx + x, wavY);
            else ctx.lineTo(cx + x, wavY);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function drawRiver(ctx, cx, cy, s, gx, gy) {
    // Bold flowing S-curve through center with highlight streak
    ctx.save();
    const lw = Math.max(1.5, s * 0.12);
    const phase = seededRandom(gx, gy, 300) * 0.5;

    // Main S-curve body
    ctx.strokeStyle = 'rgba(80,160,230,0.7)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.5, cy);
    ctx.bezierCurveTo(
        cx + s * (0.8 + phase * 0.2), cy + s * 0.3,
        cx + s * (0.2 - phase * 0.2), cy + s * 0.7,
        cx + s * 0.5, cy + s
    );
    ctx.stroke();

    // Lighter highlight streak along the curve
    ctx.strokeStyle = 'rgba(180,225,255,0.6)';
    ctx.lineWidth = Math.max(1, lw * 0.4);
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.48, cy + s * 0.1);
    ctx.bezierCurveTo(
        cx + s * (0.75 + phase * 0.2), cy + s * 0.35,
        cx + s * (0.25 - phase * 0.2), cy + s * 0.65,
        cx + s * 0.48, cy + s * 0.9
    );
    ctx.stroke();
    ctx.restore();
}

function drawLake(ctx, cx, cy, s, gx, gy, detail) {
    // Gentle ripple rings (2-3 concentric arcs) with bright shimmer center
    ctx.save();
    const centerX = cx + s * 0.5;
    const centerY = cy + s * 0.5;
    const lw = Math.max(1, s * 0.04);

    // Bright blue shimmer highlight in center
    ctx.fillStyle = 'rgba(160,220,255,0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Concentric ripple arcs
    const ripples = detail ? 3 : 2;
    for (let i = 0; i < ripples; i++) {
        const radius = s * (0.15 + i * 0.1);
        const startAngle = seededRandom(gx, gy, 270 + i) * Math.PI * 0.5;
        ctx.strokeStyle = `rgba(140,210,255,${0.7 - i * 0.15})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI * 1.3);
        ctx.stroke();
    }
    ctx.restore();
}

function drawCoralReef(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Colorful coral formations over blue-tinted background
    ctx.save();
    const lw = Math.max(1, s * 0.06);

    // Blue water tint
    ctx.fillStyle = 'rgba(40,100,170,0.3)';
    ctx.fillRect(cx, cy, s, s);

    // Coral bump dots - pink, orange, yellow
    const bumps = fineDetail ? 7 : (detail ? 4 : 2);
    const colors = [
        'rgba(240,100,120,0.75)',  // pink
        'rgba(255,160,60,0.7)',    // orange
        'rgba(255,220,80,0.65)',   // yellow
        'rgba(230,80,140,0.7)',    // hot pink
    ];
    for (let i = 0; i < bumps; i++) {
        const bx = cx + seededRandom(gx, gy, 500 + i) * s * 0.8 + s * 0.1;
        const by = cy + seededRandom(gx, gy, 510 + i) * s * 0.8 + s * 0.1;
        const br = s * (0.06 + seededRandom(gx, gy, 520 + i) * 0.06);
        const colorIdx = (seededRandom(gx, gy, 530 + i) * colors.length) | 0;
        ctx.fillStyle = colors[colorIdx];
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }

    // Branching coral shapes (Y-shaped strokes)
    if (fineDetail) {
        for (let i = 0; i < 3; i++) {
            const bx = cx + seededRandom(gx, gy, 540 + i) * s * 0.6 + s * 0.2;
            const by = cy + seededRandom(gx, gy, 545 + i) * s * 0.5 + s * 0.4;
            const h = s * 0.2;
            const branchColors = ['rgba(230,90,100,0.8)', 'rgba(240,150,60,0.8)', 'rgba(220,80,160,0.8)'];
            ctx.strokeStyle = branchColors[i % branchColors.length];
            ctx.lineWidth = Math.max(1, s * 0.04);
            ctx.lineCap = 'round';
            // Trunk
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx, by - h * 0.6);
            ctx.stroke();
            // Left branch
            ctx.beginPath();
            ctx.moveTo(bx, by - h * 0.6);
            ctx.lineTo(bx - s * 0.06, by - h);
            ctx.stroke();
            // Right branch
            ctx.beginPath();
            ctx.moveTo(bx, by - h * 0.6);
            ctx.lineTo(bx + s * 0.06, by - h);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawBeach(ctx, cx, cy, s, gx, gy, fineDetail) {
    // Shell shapes, pebble dots, wavy waterline, sandy speckles
    ctx.save();
    const lw = Math.max(1, s * 0.05);

    // Sandy speckles
    const speckleCount = fineDetail ? 8 : 4;
    for (let i = 0; i < speckleCount; i++) {
        const dx = seededRandom(gx, gy, 31 + i) * s;
        const dy = seededRandom(gx, gy, 41 + i) * s;
        const bright = seededRandom(gx, gy, 51 + i) > 0.5;
        ctx.fillStyle = bright ? 'rgba(230,210,170,0.6)' : 'rgba(160,130,80,0.5)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, s * 0.025 + seededRandom(gx, gy, 55 + i) * s * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    // Wavy waterline along bottom edge
    ctx.strokeStyle = 'rgba(100,180,230,0.7)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const waveY = cy + s * 0.85;
    for (let x = 0; x <= s; x += s * 0.05) {
        const wy = waveY + Math.sin((x / s) * Math.PI * 3 + seededRandom(gx, gy, 35)) * s * 0.04;
        if (x === 0) ctx.moveTo(cx + x, wy);
        else ctx.lineTo(cx + x, wy);
    }
    ctx.stroke();

    // Shell spiral marks
    if (fineDetail) {
        for (let i = 0; i < 2; i++) {
            const sx = cx + seededRandom(gx, gy, 60 + i) * s * 0.7 + s * 0.1;
            const sy = cy + seededRandom(gx, gy, 65 + i) * s * 0.5 + s * 0.15;
            const sr = s * 0.04;
            ctx.strokeStyle = 'rgba(180,150,110,0.8)';
            ctx.lineWidth = Math.max(1, s * 0.03);
            // Spiral approximation
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 1.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(sx + sr * 0.3, sy, sr * 0.5, Math.PI, Math.PI * 2.2);
            ctx.stroke();
        }

        // Pebble dots
        for (let i = 0; i < 3; i++) {
            const px = cx + seededRandom(gx, gy, 70 + i) * s * 0.8 + s * 0.1;
            const py = cy + seededRandom(gx, gy, 75 + i) * s * 0.6 + s * 0.2;
            ctx.fillStyle = 'rgba(140,120,90,0.7)';
            ctx.beginPath();
            ctx.ellipse(px, py, s * 0.025, s * 0.018, seededRandom(gx, gy, 78 + i) * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawPlains(ctx, cx, cy, s, gx, gy, detail) {
    // 4-6 bold grass tufts with fanning blades, occasional flower dot
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const count = detail ? (4 + ((seededRandom(gx, gy, 50) * 3) | 0)) : 3;

    for (let i = 0; i < count; i++) {
        const bx = cx + seededRandom(gx, gy, 51 + i) * s * 0.8 + s * 0.1;
        const by = cy + seededRandom(gx, gy, 61 + i) * s * 0.5 + s * 0.45;
        const h = s * (0.2 + seededRandom(gx, gy, 71 + i) * 0.1);

        ctx.strokeStyle = 'rgba(50,130,30,0.8)';
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';

        // 3 blades fanning out from base
        const blades = 3;
        for (let j = 0; j < blades; j++) {
            const angle = -Math.PI / 2 + (j - 1) * 0.4;
            const tipX = bx + Math.cos(angle) * h * 0.4;
            const tipY = by + Math.sin(angle) * h;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx + (j - 1) * s * 0.04, by - h * 0.6, tipX, tipY);
            ctx.stroke();
        }
    }

    // Occasional small flower dots (yellow/white)
    if (detail) {
        const flowerCount = 1 + ((seededRandom(gx, gy, 80) * 2) | 0);
        for (let i = 0; i < flowerCount; i++) {
            const fx = cx + seededRandom(gx, gy, 82 + i) * s * 0.8 + s * 0.1;
            const fy = cy + seededRandom(gx, gy, 85 + i) * s * 0.6 + s * 0.15;
            const isYellow = seededRandom(gx, gy, 88 + i) > 0.5;
            ctx.fillStyle = isYellow ? 'rgba(255,230,50,0.8)' : 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(fx, fy, s * 0.025, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawForest(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // 2-3 deciduous trees: round puffy crown on brown trunk, lighter highlight
    ctx.save();
    const count = fineDetail ? 3 : (detail ? 2 : 1);

    for (let i = 0; i < count; i++) {
        const tx = cx + seededRandom(gx, gy, 70 + i) * s * 0.6 + s * 0.2;
        const crownY = cy + seededRandom(gx, gy, 80 + i) * s * 0.3 + s * 0.25;
        const trunkBase = crownY + s * 0.2;
        const crownR = s * (0.14 + seededRandom(gx, gy, 90 + i) * 0.06);

        // Brown trunk
        ctx.strokeStyle = 'rgba(90,60,30,0.8)';
        ctx.lineWidth = Math.max(1.5, s * 0.06);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, crownY + crownR * 0.5);
        ctx.lineTo(tx, trunkBase + s * 0.12);
        ctx.stroke();

        // Dark green crown
        ctx.fillStyle = 'rgba(30,100,30,0.75)';
        ctx.beginPath();
        ctx.arc(tx, crownY, crownR, 0, Math.PI * 2);
        ctx.fill();

        // Crown outline
        ctx.strokeStyle = 'rgba(15,60,15,0.6)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.arc(tx, crownY, crownR, 0, Math.PI * 2);
        ctx.stroke();

        // Lighter highlight circle on crown
        ctx.fillStyle = 'rgba(80,170,60,0.55)';
        ctx.beginPath();
        ctx.arc(tx - crownR * 0.25, crownY - crownR * 0.25, crownR * 0.45, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawJungle(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Dense: 4-5 overlapping large dark tree crowns with hanging vines
    ctx.save();
    const count = fineDetail ? 5 : (detail ? 3 : 2);

    for (let i = 0; i < count; i++) {
        const tx = cx + seededRandom(gx, gy, 100 + i) * s * 0.8 + s * 0.1;
        const crownY = cy + seededRandom(gx, gy, 110 + i) * s * 0.4 + s * 0.2;
        const crownR = s * (0.16 + seededRandom(gx, gy, 120 + i) * 0.08);

        // Very dark green crown
        ctx.fillStyle = 'rgba(15,65,15,0.8)';
        ctx.beginPath();
        ctx.arc(tx, crownY, crownR, 0, Math.PI * 2);
        ctx.fill();

        // Even darker inner shadow
        ctx.fillStyle = 'rgba(5,35,5,0.5)';
        ctx.beginPath();
        ctx.arc(tx + crownR * 0.15, crownY + crownR * 0.15, crownR * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Crown outline
        ctx.strokeStyle = 'rgba(5,40,5,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.arc(tx, crownY, crownR, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Hanging vine lines
    if (fineDetail) {
        ctx.strokeStyle = 'rgba(30,90,20,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.025);
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            const vx = cx + seededRandom(gx, gy, 130 + i) * s * 0.8 + s * 0.1;
            const vy = cy + seededRandom(gx, gy, 135 + i) * s * 0.3 + s * 0.15;
            const vLen = s * (0.15 + seededRandom(gx, gy, 138 + i) * 0.15);
            ctx.beginPath();
            ctx.moveTo(vx, vy);
            ctx.quadraticCurveTo(vx + s * 0.03 * (seededRandom(gx, gy, 140 + i) - 0.5), vy + vLen * 0.6, vx + s * 0.02, vy + vLen);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawHills(ctx, cx, cy, s, gx, gy, detail) {
    // 2 overlapping rounded bumps, front lighter, back darker, with contour lines
    ctx.save();
    const lw = Math.max(1, s * 0.06);
    const hx = cx + s * 0.15 + seededRandom(gx, gy, 130) * s * 0.15;
    const hy = cy + s * 0.7;
    const hw = s * 0.6;
    const hh = s * 0.35;

    // Back hill (darker)
    ctx.fillStyle = 'rgba(110,95,60,0.6)';
    ctx.beginPath();
    ctx.moveTo(hx + s * 0.1, hy);
    ctx.quadraticCurveTo(hx + s * 0.1 + hw * 0.5, hy - hh * 0.85, hx + s * 0.1 + hw, hy);
    ctx.closePath();
    ctx.fill();
    // Back contour line
    ctx.strokeStyle = 'rgba(80,65,35,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(hx + s * 0.1, hy);
    ctx.quadraticCurveTo(hx + s * 0.1 + hw * 0.5, hy - hh * 0.85, hx + s * 0.1 + hw, hy);
    ctx.stroke();

    // Front hill (lighter, overlapping)
    ctx.fillStyle = 'rgba(140,125,75,0.65)';
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.05, hy + s * 0.05);
    ctx.quadraticCurveTo(hx + hw * 0.4, hy - hh * 0.7, hx + hw * 0.85, hy + s * 0.05);
    ctx.closePath();
    ctx.fill();
    // Front contour line
    ctx.strokeStyle = 'rgba(100,85,50,0.8)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.05, hy + s * 0.05);
    ctx.quadraticCurveTo(hx + hw * 0.4, hy - hh * 0.7, hx + hw * 0.85, hy + s * 0.05);
    ctx.stroke();

    // Green tint on top
    if (detail) {
        ctx.fillStyle = 'rgba(80,130,50,0.3)';
        ctx.beginPath();
        ctx.moveTo(hx + hw * 0.1, hy - hh * 0.3);
        ctx.quadraticCurveTo(hx + hw * 0.4, hy - hh * 0.65, hx + hw * 0.7, hy - hh * 0.25);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawMountains(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Bold triangular peak with snow cap, second smaller peak behind, strong ridge lines
    ctx.save();
    const lw = Math.max(1.5, s * 0.07);

    // Second peak behind (smaller, offset)
    const p2x = cx + s * 0.65;
    const p2base = cy + s * 0.8;
    const p2w = s * 0.35;
    const p2h = s * 0.4;
    ctx.fillStyle = 'rgba(85,85,80,0.65)';
    ctx.beginPath();
    ctx.moveTo(p2x - p2w * 0.5, p2base);
    ctx.lineTo(p2x, p2base - p2h);
    ctx.lineTo(p2x + p2w * 0.5, p2base);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,35,0.7)';
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(p2x - p2w * 0.5, p2base);
    ctx.lineTo(p2x, p2base - p2h);
    ctx.lineTo(p2x + p2w * 0.5, p2base);
    ctx.stroke();

    // Main peak (bigger, in front)
    const px = cx + s * 0.4;
    const pBase = cy + s * 0.85;
    const pw = s * 0.55;
    const ph = s * 0.65;

    // Mountain body - gray
    ctx.fillStyle = 'rgba(100,100,95,0.75)';
    ctx.beginPath();
    ctx.moveTo(px - pw * 0.5, pBase);
    ctx.lineTo(px, pBase - ph);
    ctx.lineTo(px + pw * 0.5, pBase);
    ctx.closePath();
    ctx.fill();

    // Strong dark ridge lines
    ctx.strokeStyle = 'rgba(30,30,25,0.8)';
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(px - pw * 0.5, pBase);
    ctx.lineTo(px, pBase - ph);
    ctx.lineTo(px + pw * 0.5, pBase);
    ctx.stroke();

    // Snow cap on top - white
    ctx.fillStyle = 'rgba(240,245,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(px - pw * 0.15, pBase - ph * 0.7);
    ctx.lineTo(px, pBase - ph);
    ctx.lineTo(px + pw * 0.15, pBase - ph * 0.7);
    // Jagged snow line
    ctx.lineTo(px + pw * 0.08, pBase - ph * 0.63);
    ctx.lineTo(px - pw * 0.02, pBase - ph * 0.68);
    ctx.lineTo(px - pw * 0.1, pBase - ph * 0.62);
    ctx.closePath();
    ctx.fill();

    // Snow cap on back peak too
    if (fineDetail) {
        ctx.fillStyle = 'rgba(230,240,250,0.75)';
        ctx.beginPath();
        ctx.moveTo(p2x - p2w * 0.12, p2base - p2h * 0.72);
        ctx.lineTo(p2x, p2base - p2h);
        ctx.lineTo(p2x + p2w * 0.12, p2base - p2h * 0.72);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawSnow(ctx, cx, cy, s, gx, gy, fineDetail) {
    // Snowflake symbols (3 crossed lines with branches) and wind streaks
    ctx.save();
    const lw = Math.max(1, s * 0.05);

    // Draw 1-2 snowflake sprites
    const flakeCount = fineDetail ? 2 : 1;
    for (let f = 0; f < flakeCount; f++) {
        const fx = cx + seededRandom(gx, gy, 160 + f) * s * 0.5 + s * 0.25;
        const fy = cy + seededRandom(gx, gy, 165 + f) * s * 0.5 + s * 0.25;
        const fr = s * 0.12;

        ctx.strokeStyle = 'rgba(220,235,255,0.8)';
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';

        // 3 crossed lines through center (6-pointed snowflake)
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI / 3) * i;
            const ax = Math.cos(angle) * fr;
            const ay = Math.sin(angle) * fr;
            ctx.beginPath();
            ctx.moveTo(fx - ax, fy - ay);
            ctx.lineTo(fx + ax, fy + ay);
            ctx.stroke();

            // Small branches at each end
            if (fineDetail) {
                const branchLen = fr * 0.35;
                for (let side = -1; side <= 1; side += 2) {
                    const endX = fx + ax * side;
                    const endY = fy + ay * side;
                    const bAngle1 = angle + Math.PI * 0.25;
                    const bAngle2 = angle - Math.PI * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - Math.cos(bAngle1) * branchLen * side, endY - Math.sin(bAngle1) * branchLen * side);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(endX - Math.cos(bAngle2) * branchLen * side, endY - Math.sin(bAngle2) * branchLen * side);
                    ctx.stroke();
                }
            }
        }
    }

    // Wind streak lines
    ctx.strokeStyle = 'rgba(200,220,240,0.5)';
    ctx.lineWidth = Math.max(1, s * 0.03);
    for (let i = 0; i < 2; i++) {
        const wy = cy + s * 0.3 + seededRandom(gx, gy, 175 + i) * s * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.05, wy);
        ctx.lineTo(cx + s * 0.4 + seededRandom(gx, gy, 178 + i) * s * 0.3, wy + s * 0.02);
        ctx.stroke();
    }
    ctx.restore();
}

function drawDesert(ctx, cx, cy, s, gx, gy, detail) {
    // Rolling sand dune curves with shadow, cactus sprite, yellow-orange sand dots
    ctx.save();
    const lw = Math.max(1, s * 0.06);

    // Sand dots
    const dotCount = detail ? 6 : 3;
    for (let i = 0; i < dotCount; i++) {
        const dx = seededRandom(gx, gy, 181 + i) * s;
        const dy = seededRandom(gx, gy, 191 + i) * s;
        ctx.fillStyle = `rgba(220,170,50,${0.5 + seededRandom(gx, gy, 195 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, s * 0.02 + seededRandom(gx, gy, 197 + i) * s * 0.015, 0, Math.PI * 2);
        ctx.fill();
    }

    // Two overlapping dune S-curves
    ctx.strokeStyle = 'rgba(200,155,50,0.75)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    const duneY1 = cy + s * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx, duneY1 + s * 0.05);
    ctx.quadraticCurveTo(cx + s * 0.3, duneY1 - s * 0.12, cx + s * 0.6, duneY1);
    ctx.quadraticCurveTo(cx + s * 0.8, duneY1 + s * 0.08, cx + s, duneY1 + s * 0.03);
    ctx.stroke();

    // Shadow underneath dune
    ctx.strokeStyle = 'rgba(140,100,30,0.5)';
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.05, duneY1 + s * 0.08);
    ctx.quadraticCurveTo(cx + s * 0.35, duneY1 + s * 0.02, cx + s * 0.65, duneY1 + s * 0.06);
    ctx.stroke();

    // Second dune
    const duneY2 = cy + s * 0.7;
    ctx.strokeStyle = 'rgba(190,145,40,0.65)';
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.1, duneY2);
    ctx.quadraticCurveTo(cx + s * 0.5, duneY2 - s * 0.1, cx + s * 0.9, duneY2 + s * 0.02);
    ctx.stroke();

    // Cactus sprite (saguaro silhouette) when detail is on
    if (detail) {
        const cacX = cx + seededRandom(gx, gy, 199) * s * 0.4 + s * 0.3;
        const cacBase = cy + s * 0.65;
        const cacH = s * 0.35;
        ctx.strokeStyle = 'rgba(60,110,40,0.8)';
        ctx.lineWidth = Math.max(1.5, s * 0.06);
        ctx.lineCap = 'round';
        // Main trunk
        ctx.beginPath();
        ctx.moveTo(cacX, cacBase);
        ctx.lineTo(cacX, cacBase - cacH);
        ctx.stroke();
        // Left arm
        ctx.beginPath();
        ctx.moveTo(cacX, cacBase - cacH * 0.5);
        ctx.lineTo(cacX - s * 0.08, cacBase - cacH * 0.5);
        ctx.lineTo(cacX - s * 0.08, cacBase - cacH * 0.7);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(cacX, cacBase - cacH * 0.35);
        ctx.lineTo(cacX + s * 0.07, cacBase - cacH * 0.35);
        ctx.lineTo(cacX + s * 0.07, cacBase - cacH * 0.6);
        ctx.stroke();
    }
    ctx.restore();
}

function drawSwamp(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Dark water puddles, reed/cattail sprites, lily pads
    ctx.save();
    const lw = Math.max(1, s * 0.05);

    // Dark water puddle patches
    const puddleCount = detail ? 3 : 2;
    for (let i = 0; i < puddleCount; i++) {
        const px = cx + seededRandom(gx, gy, 200 + i) * s * 0.6 + s * 0.2;
        const py = cy + seededRandom(gx, gy, 210 + i) * s * 0.6 + s * 0.2;
        ctx.fillStyle = 'rgba(35,55,30,0.65)';
        ctx.beginPath();
        ctx.ellipse(px, py, s * 0.14, s * 0.09, seededRandom(gx, gy, 215 + i) * Math.PI, 0, Math.PI * 2);
        ctx.fill();

        // Lily pad circles on puddles
        if (fineDetail) {
            ctx.fillStyle = 'rgba(60,120,40,0.7)';
            ctx.beginPath();
            ctx.arc(px + s * 0.04, py - s * 0.02, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Reed/cattail sprites
    const reedCount = fineDetail ? 4 : (detail ? 2 : 1);
    for (let i = 0; i < reedCount; i++) {
        const rx = cx + seededRandom(gx, gy, 220 + i) * s * 0.8 + s * 0.1;
        const rBase = cy + seededRandom(gx, gy, 225 + i) * s * 0.3 + s * 0.6;
        const rh = s * (0.25 + seededRandom(gx, gy, 228 + i) * 0.1);

        // Vertical reed stem
        ctx.strokeStyle = 'rgba(80,100,40,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rx, rBase);
        ctx.lineTo(rx, rBase - rh);
        ctx.stroke();

        // Oval cattail blob at top
        ctx.fillStyle = 'rgba(100,70,30,0.8)';
        ctx.beginPath();
        ctx.ellipse(rx, rBase - rh - s * 0.02, s * 0.02, s * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Murky green-brown tint
    ctx.fillStyle = 'rgba(50,60,20,0.15)';
    ctx.fillRect(cx, cy, s, s);
    ctx.restore();
}

function drawVolcanic(ctx, cx, cy, s, gx, gy, detail) {
    // Volcano cone with crater, lava glow, smoke lines, ash texture
    ctx.save();
    const lw = Math.max(1, s * 0.06);

    // Dark ash texture around base
    ctx.fillStyle = 'rgba(30,15,10,0.3)';
    for (let i = 0; i < 5; i++) {
        const dx = seededRandom(gx, gy, 250 + i) * s;
        const dy = seededRandom(gx, gy, 260 + i) * s;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, s * 0.03, 0, Math.PI * 2);
        ctx.fill();
    }

    // Volcano cone (triangle with flat top crater)
    const vx = cx + s * 0.5;
    const vBase = cy + s * 0.85;
    const vw = s * 0.45;
    const vh = s * 0.55;
    const craterW = s * 0.12;

    // Cone body
    ctx.fillStyle = 'rgba(60,35,25,0.8)';
    ctx.beginPath();
    ctx.moveTo(vx - vw * 0.5, vBase);
    ctx.lineTo(vx - craterW, vBase - vh);
    ctx.lineTo(vx + craterW, vBase - vh);
    ctx.lineTo(vx + vw * 0.5, vBase);
    ctx.closePath();
    ctx.fill();

    // Cone outline
    ctx.strokeStyle = 'rgba(30,15,10,0.8)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(vx - vw * 0.5, vBase);
    ctx.lineTo(vx - craterW, vBase - vh);
    ctx.lineTo(vx + craterW, vBase - vh);
    ctx.lineTo(vx + vw * 0.5, vBase);
    ctx.stroke();

    // Bright lava glow at crater
    ctx.fillStyle = 'rgba(255,120,20,0.85)';
    ctx.beginPath();
    ctx.ellipse(vx, vBase - vh + s * 0.02, craterW * 0.9, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright glow
    ctx.fillStyle = 'rgba(255,200,50,0.7)';
    ctx.beginPath();
    ctx.ellipse(vx, vBase - vh + s * 0.02, craterW * 0.5, s * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wispy smoke lines rising from top
    if (detail) {
        ctx.strokeStyle = 'rgba(120,110,100,0.5)';
        ctx.lineWidth = Math.max(1, s * 0.035);
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            const smokeX = vx + (i - 1) * s * 0.06;
            const smokeBase = vBase - vh - s * 0.02;
            ctx.beginPath();
            ctx.moveTo(smokeX, smokeBase);
            ctx.quadraticCurveTo(
                smokeX + (seededRandom(gx, gy, 270 + i) - 0.5) * s * 0.1,
                smokeBase - s * 0.1,
                smokeX + (seededRandom(gx, gy, 275 + i) - 0.5) * s * 0.12,
                smokeBase - s * 0.18
            );
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawFarmland(ctx, cx, cy, s, gx, gy, detail) {
    // Neat parallel crop rows, wheat/crop V-shapes, patchwork borders
    ctx.save();
    const lw = Math.max(1, s * 0.05);

    // Patchwork border
    ctx.strokeStyle = 'rgba(90,110,40,0.6)';
    ctx.lineWidth = lw;
    ctx.strokeRect(cx + s * 0.05, cy + s * 0.05, s * 0.9, s * 0.9);

    // Horizontal crop rows
    const rows = detail ? 5 : 3;
    ctx.strokeStyle = 'rgba(80,100,30,0.65)';
    ctx.lineWidth = Math.max(1, s * 0.035);
    for (let i = 1; i < rows; i++) {
        const y = cy + (s / rows) * i;
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.08, y);
        ctx.lineTo(cx + s * 0.92, y);
        ctx.stroke();
    }

    // Small wheat/crop stalks (tiny V shapes on rows)
    if (detail) {
        ctx.strokeStyle = 'rgba(180,170,50,0.75)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.lineCap = 'round';
        for (let i = 0; i < rows - 1; i++) {
            const rowY = cy + (s / rows) * (i + 0.5);
            const stalks = 3 + ((seededRandom(gx, gy, 330 + i) * 3) | 0);
            for (let j = 0; j < stalks; j++) {
                const sx = cx + s * 0.12 + (s * 0.76 / stalks) * j + seededRandom(gx, gy, 335 + i * 10 + j) * s * 0.05;
                const stalkH = s * 0.06;
                // V shape
                ctx.beginPath();
                ctx.moveTo(sx - s * 0.015, rowY);
                ctx.lineTo(sx, rowY - stalkH);
                ctx.lineTo(sx + s * 0.015, rowY);
                ctx.stroke();
            }
        }
    }

    // Vertical divider for patchwork feel
    const vx = cx + s * 0.5 + seededRandom(gx, gy, 340) * s * 0.2 - s * 0.1;
    ctx.strokeStyle = 'rgba(90,110,40,0.5)';
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(vx, cy + s * 0.08);
    ctx.lineTo(vx, cy + s * 0.92);
    ctx.stroke();
    ctx.restore();
}

function drawCity(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Cluster of 4-6 building rectangles with a tall central tower, windows
    ctx.save();
    const lw = Math.max(1, s * 0.04);
    const buildingCount = fineDetail ? 6 : (detail ? 4 : 2);
    const baseY = cy + s * 0.85;

    // Draw buildings from back to front (tallest in center)
    for (let i = 0; i < buildingCount; i++) {
        const bx = cx + s * 0.08 + (s * 0.75 / buildingCount) * i + seededRandom(gx, gy, 280 + i) * s * 0.05;
        const bw = s * (0.1 + seededRandom(gx, gy, 285 + i) * 0.08);
        const isCenterTower = (i === ((buildingCount / 2) | 0));
        const bh = isCenterTower
            ? s * (0.5 + seededRandom(gx, gy, 290 + i) * 0.1)
            : s * (0.2 + seededRandom(gx, gy, 290 + i) * 0.2);
        const bTop = baseY - bh;

        // Building body
        ctx.fillStyle = `rgba(80,80,85,${0.7 + seededRandom(gx, gy, 295 + i) * 0.1})`;
        ctx.fillRect(bx, bTop, bw, bh);

        // Building outline
        ctx.strokeStyle = 'rgba(180,180,190,0.7)';
        ctx.lineWidth = lw;
        ctx.strokeRect(bx, bTop, bw, bh);

        // Pointed or flat roof
        const hasPointedRoof = seededRandom(gx, gy, 298 + i) > 0.5 || isCenterTower;
        if (hasPointedRoof) {
            ctx.fillStyle = 'rgba(60,60,65,0.8)';
            ctx.beginPath();
            ctx.moveTo(bx - bw * 0.05, bTop);
            ctx.lineTo(bx + bw * 0.5, bTop - bh * 0.2);
            ctx.lineTo(bx + bw * 1.05, bTop);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(180,180,190,0.6)';
            ctx.lineWidth = lw * 0.7;
            ctx.stroke();
        }

        // Windows (tiny rectangles on building face)
        if (fineDetail && bh > s * 0.15) {
            ctx.fillStyle = 'rgba(255,240,150,0.7)';
            const winRows = Math.max(1, ((bh / (s * 0.08)) | 0) - 1);
            const winCols = Math.max(1, ((bw / (s * 0.06)) | 0));
            for (let r = 0; r < winRows; r++) {
                for (let c = 0; c < winCols; c++) {
                    const wx = bx + bw * 0.15 + (bw * 0.7 / winCols) * c;
                    const wy = bTop + bh * 0.1 + (bh * 0.75 / winRows) * r;
                    const winW = Math.max(1, s * 0.02);
                    const winH = Math.max(1, s * 0.025);
                    ctx.fillRect(wx, wy, winW, winH);
                }
            }
        }
    }

    // Spire on the center tower
    if (detail) {
        const spireX = cx + s * 0.5;
        const tallestTop = baseY - s * 0.5;
        ctx.strokeStyle = 'rgba(200,200,210,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.moveTo(spireX, tallestTop - s * 0.15);
        ctx.lineTo(spireX, tallestTop - s * 0.02);
        ctx.stroke();
    }
    ctx.restore();
}

function drawTown(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // 2-4 houses with triangular roofs, chimney, church spire
    ctx.save();
    const lw = Math.max(1, s * 0.04);
    const houseCount = fineDetail ? 4 : (detail ? 2 : 1);
    const baseY = cy + s * 0.82;

    for (let i = 0; i < houseCount; i++) {
        const hx = cx + s * 0.08 + (s * 0.7 / houseCount) * i + seededRandom(gx, gy, 340 + i) * s * 0.06;
        const hw = s * (0.12 + seededRandom(gx, gy, 345 + i) * 0.08);
        const hh = s * (0.15 + seededRandom(gx, gy, 350 + i) * 0.08);
        const hTop = baseY - hh;

        // House body (warm brown/tan)
        ctx.fillStyle = `rgba(170,140,100,${0.7 + seededRandom(gx, gy, 355 + i) * 0.1})`;
        ctx.fillRect(hx, hTop, hw, hh);

        // House outline
        ctx.strokeStyle = 'rgba(100,70,40,0.8)';
        ctx.lineWidth = lw;
        ctx.strokeRect(hx, hTop, hw, hh);

        // Triangular roof
        ctx.fillStyle = 'rgba(140,60,30,0.75)';
        ctx.beginPath();
        ctx.moveTo(hx - hw * 0.1, hTop);
        ctx.lineTo(hx + hw * 0.5, hTop - hh * 0.45);
        ctx.lineTo(hx + hw * 1.1, hTop);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,40,20,0.8)';
        ctx.lineWidth = lw * 0.8;
        ctx.stroke();

        // Door on first house
        if (i === 0 && fineDetail) {
            ctx.fillStyle = 'rgba(80,50,25,0.8)';
            const doorW = hw * 0.25;
            const doorH = hh * 0.4;
            ctx.fillRect(hx + hw * 0.38, baseY - doorH, doorW, doorH);
        }

        // Chimney on one house
        if (i === 1 && fineDetail) {
            ctx.fillStyle = 'rgba(120,80,50,0.8)';
            const chimW = s * 0.04;
            const chimH = s * 0.08;
            ctx.fillRect(hx + hw * 0.7, hTop - hh * 0.35 - chimH, chimW, chimH);
        }
    }

    // Church spire / flag on last building
    if (detail && houseCount >= 2) {
        const lastHx = cx + s * 0.08 + (s * 0.7 / houseCount) * (houseCount - 1);
        const lastHw = s * 0.15;
        const spireX = lastHx + lastHw * 0.5;
        const spireBase = baseY - s * 0.22;
        ctx.strokeStyle = 'rgba(100,70,40,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.moveTo(spireX, spireBase);
        ctx.lineTo(spireX, spireBase - s * 0.12);
        ctx.stroke();
        // Small flag
        ctx.fillStyle = 'rgba(200,50,50,0.8)';
        ctx.beginPath();
        ctx.moveTo(spireX, spireBase - s * 0.12);
        ctx.lineTo(spireX + s * 0.05, spireBase - s * 0.1);
        ctx.lineTo(spireX, spireBase - s * 0.08);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawRuins(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Broken walls with jagged tops, broken columns, rubble, ivy
    ctx.save();
    const lw = Math.max(1, s * 0.06);

    // Rubble dots around base
    ctx.fillStyle = 'rgba(100,95,80,0.6)';
    for (let i = 0; i < 5; i++) {
        const rx = cx + seededRandom(gx, gy, 440 + i) * s * 0.8 + s * 0.1;
        const ry = cy + seededRandom(gx, gy, 445 + i) * s * 0.3 + s * 0.65;
        ctx.beginPath();
        ctx.arc(rx, ry, s * 0.02 + seededRandom(gx, gy, 448 + i) * s * 0.015, 0, Math.PI * 2);
        ctx.fill();
    }

    // Broken wall segments
    const walls = fineDetail ? 3 : (detail ? 2 : 1);
    for (let i = 0; i < walls; i++) {
        const wx = cx + seededRandom(gx, gy, 400 + i) * s * 0.5 + s * 0.1;
        const wBase = cy + s * 0.75;
        const ww = s * (0.15 + seededRandom(gx, gy, 420 + i) * 0.12);
        const wh = s * (0.2 + seededRandom(gx, gy, 430 + i) * 0.15);

        // Wall body with jagged/broken top
        ctx.fillStyle = 'rgba(100,95,75,0.7)';
        ctx.beginPath();
        ctx.moveTo(wx, wBase);
        ctx.lineTo(wx, wBase - wh);
        ctx.lineTo(wx + ww * 0.25, wBase - wh * 0.7);
        ctx.lineTo(wx + ww * 0.4, wBase - wh * 0.95);
        ctx.lineTo(wx + ww * 0.55, wBase - wh * 0.5);
        ctx.lineTo(wx + ww * 0.75, wBase - wh * 0.8);
        ctx.lineTo(wx + ww, wBase - wh * 0.55);
        ctx.lineTo(wx + ww, wBase);
        ctx.closePath();
        ctx.fill();

        // Wall outline
        ctx.strokeStyle = 'rgba(60,55,45,0.8)';
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(wx, wBase);
        ctx.lineTo(wx, wBase - wh);
        ctx.lineTo(wx + ww * 0.25, wBase - wh * 0.7);
        ctx.lineTo(wx + ww * 0.4, wBase - wh * 0.95);
        ctx.lineTo(wx + ww * 0.55, wBase - wh * 0.5);
        ctx.lineTo(wx + ww * 0.75, wBase - wh * 0.8);
        ctx.lineTo(wx + ww, wBase - wh * 0.55);
        ctx.lineTo(wx + ww, wBase);
        ctx.stroke();

        // Ivy/vine green streaks on walls
        if (fineDetail) {
            ctx.strokeStyle = 'rgba(50,110,40,0.6)';
            ctx.lineWidth = Math.max(1, s * 0.025);
            ctx.beginPath();
            ctx.moveTo(wx + ww * 0.2, wBase - wh * 0.6);
            ctx.quadraticCurveTo(wx + ww * 0.25, wBase - wh * 0.3, wx + ww * 0.15, wBase - wh * 0.1);
            ctx.stroke();
        }
    }

    // Broken column
    if (fineDetail) {
        const colX = cx + seededRandom(gx, gy, 450) * s * 0.3 + s * 0.55;
        const colBase = cy + s * 0.75;
        const colH = s * 0.22;
        const colW = s * 0.07;
        // Column body (slightly tilted)
        ctx.fillStyle = 'rgba(120,115,100,0.7)';
        ctx.beginPath();
        ctx.moveTo(colX, colBase);
        ctx.lineTo(colX + s * 0.02, colBase - colH);
        ctx.lineTo(colX + colW + s * 0.02, colBase - colH);
        ctx.lineTo(colX + colW, colBase);
        ctx.closePath();
        ctx.fill();
        // Circular top (broken)
        ctx.fillStyle = 'rgba(130,125,110,0.7)';
        ctx.beginPath();
        ctx.arc(colX + colW * 0.5 + s * 0.02, colBase - colH, colW * 0.7, 0, Math.PI, true);
        ctx.fill();
    }
    ctx.restore();
}

function drawRoad(ctx, cx, cy, s, gx, gy) {
    // Packed dirt path through center with pebbles and dotted center line
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const angle = seededRandom(gx, gy, 320) * Math.PI;

    // Lighter brown strip (road surface)
    ctx.fillStyle = 'rgba(150,120,80,0.6)';
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.5, cy + s * 0.5, s * 0.4, s * 0.18, angle, 0, Math.PI * 2);
    ctx.fill();

    // Road outline
    ctx.strokeStyle = 'rgba(110,85,55,0.7)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.5, cy + s * 0.5, s * 0.4, s * 0.18, angle, 0, Math.PI * 2);
    ctx.stroke();

    // Pebble/stone dots along the path
    ctx.fillStyle = 'rgba(130,110,80,0.7)';
    for (let i = 0; i < 4; i++) {
        const t = seededRandom(gx, gy, 322 + i) * Math.PI * 2;
        const px = cx + s * 0.5 + Math.cos(angle) * Math.cos(t) * s * 0.25 - Math.sin(angle) * Math.sin(t) * s * 0.1;
        const py = cy + s * 0.5 + Math.sin(angle) * Math.cos(t) * s * 0.25 + Math.cos(angle) * Math.sin(t) * s * 0.1;
        ctx.beginPath();
        ctx.arc(px, py, s * 0.015 + seededRandom(gx, gy, 326 + i) * s * 0.01, 0, Math.PI * 2);
        ctx.fill();
    }

    // Center dotted line
    ctx.fillStyle = 'rgba(180,160,120,0.6)';
    for (let i = 0; i < 3; i++) {
        const t = -0.6 + i * 0.6;
        const dx = cx + s * 0.5 + Math.cos(angle) * t * s * 0.3;
        const dy = cy + s * 0.5 + Math.sin(angle) * t * s * 0.3;
        ctx.beginPath();
        ctx.arc(dx, dy, s * 0.012, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawIce(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Cracked ice lines radiating from center, blue-white crystalline highlights
    ctx.save();
    const lw = Math.max(1.5, s * 0.07);

    // Blue-white crystalline highlight patches
    ctx.fillStyle = 'rgba(200,230,255,0.4)';
    ctx.beginPath();
    ctx.arc(cx + s * 0.35, cy + s * 0.4, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,220,250,0.3)';
    ctx.beginPath();
    ctx.arc(cx + s * 0.65, cy + s * 0.55, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Thick crack lines radiating from center
    const crackX = cx + s * 0.45 + seededRandom(gx, gy, 450) * s * 0.1;
    const crackY = cy + s * 0.45 + seededRandom(gx, gy, 451) * s * 0.1;
    const cracks = fineDetail ? 4 : (detail ? 3 : 2);

    ctx.strokeStyle = 'rgba(140,190,220,0.8)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    for (let i = 0; i < cracks; i++) {
        const angle = seededRandom(gx, gy, 452 + i) * Math.PI * 2;
        const len = s * (0.25 + seededRandom(gx, gy, 462 + i) * 0.15);
        const midAngle = angle + (seededRandom(gx, gy, 472 + i) - 0.5) * 0.8;
        const midLen = len * 0.5;
        ctx.beginPath();
        ctx.moveTo(crackX, crackY);
        ctx.lineTo(crackX + Math.cos(midAngle) * midLen, crackY + Math.sin(midAngle) * midLen);
        ctx.lineTo(crackX + Math.cos(angle) * len, crackY + Math.sin(angle) * len);
        ctx.stroke();

        // Sub-cracks branching off
        if (fineDetail) {
            ctx.lineWidth = lw * 0.5;
            const branchX = crackX + Math.cos(midAngle) * midLen;
            const branchY = crackY + Math.sin(midAngle) * midLen;
            const bAngle = midAngle + (seededRandom(gx, gy, 480 + i) > 0.5 ? 0.7 : -0.7);
            ctx.beginPath();
            ctx.moveTo(branchX, branchY);
            ctx.lineTo(branchX + Math.cos(bAngle) * len * 0.3, branchY + Math.sin(bAngle) * len * 0.3);
            ctx.stroke();
            ctx.lineWidth = lw;
        }
    }
    ctx.restore();
}

function drawCave(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Dark arch opening, rocky overhang, stalactites, boulders
    ctx.save();
    const lw = Math.max(1, s * 0.06);
    const openX = cx + s * 0.5;
    const openY = cy + s * 0.55;

    // Boulders around entrance
    ctx.fillStyle = 'rgba(70,55,45,0.7)';
    const boulders = fineDetail ? 4 : 2;
    for (let i = 0; i < boulders; i++) {
        const bAngle = Math.PI * 0.8 + seededRandom(gx, gy, 550 + i) * Math.PI * 0.4;
        const bDist = s * 0.3 + seededRandom(gx, gy, 555 + i) * s * 0.1;
        const bx = openX + Math.cos(bAngle) * bDist;
        const by = openY + Math.sin(bAngle) * bDist * 0.7;
        const br = s * (0.04 + seededRandom(gx, gy, 560 + i) * 0.03);
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dark cave opening (half circle, very dark inside)
    ctx.fillStyle = 'rgba(10,8,5,0.85)';
    ctx.beginPath();
    ctx.ellipse(openX, openY, s * 0.28, s * 0.22, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Slightly lighter depth gradient inside
    ctx.fillStyle = 'rgba(25,20,15,0.5)';
    ctx.beginPath();
    ctx.ellipse(openX, openY + s * 0.03, s * 0.2, s * 0.12, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Rocky overhang (rough line above arch)
    ctx.strokeStyle = 'rgba(90,70,55,0.85)';
    ctx.lineWidth = lw * 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(openX - s * 0.35, openY + s * 0.02);
    ctx.quadraticCurveTo(openX - s * 0.15, openY - s * 0.25, openX, openY - s * 0.22);
    ctx.quadraticCurveTo(openX + s * 0.15, openY - s * 0.25, openX + s * 0.35, openY + s * 0.02);
    ctx.stroke();

    // Stalactite points hanging from arch top
    if (fineDetail) {
        ctx.fillStyle = 'rgba(80,65,50,0.8)';
        for (let i = 0; i < 4; i++) {
            const stX = openX + (i - 1.5) * s * 0.1;
            const stY = openY - s * 0.18 + Math.abs(i - 1.5) * s * 0.04;
            const stLen = s * (0.05 + seededRandom(gx, gy, 570 + i) * 0.04);
            ctx.beginPath();
            ctx.moveTo(stX - s * 0.015, stY);
            ctx.lineTo(stX, stY + stLen);
            ctx.lineTo(stX + s * 0.015, stY);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawFortress(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Thick square wall with crenellations, 4 corner towers, flag, gate
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const margin = s * 0.18;
    const wallLeft = cx + margin;
    const wallTop = cy + margin;
    const wallW = s - margin * 2;
    const wallH = s - margin * 2;

    // Wall fill
    ctx.fillStyle = 'rgba(100,95,90,0.75)';
    ctx.fillRect(wallLeft, wallTop, wallW, wallH);

    // Wall outline
    ctx.strokeStyle = 'rgba(50,45,40,0.85)';
    ctx.lineWidth = lw;
    ctx.strokeRect(wallLeft, wallTop, wallW, wallH);

    // Crenellations (battlements) on top edge
    const merlonCount = fineDetail ? 5 : 3;
    const merlonW = wallW / (merlonCount * 2);
    const merlonH = s * 0.06;
    ctx.fillStyle = 'rgba(90,85,80,0.8)';
    for (let i = 0; i < merlonCount; i++) {
        const mx = wallLeft + merlonW * (i * 2 + 0.5);
        ctx.fillRect(mx, wallTop - merlonH, merlonW, merlonH);
        ctx.strokeRect(mx, wallTop - merlonH, merlonW, merlonH);
    }

    // 4 corner tower squares
    if (detail) {
        const tSize = s * 0.12;
        ctx.fillStyle = 'rgba(85,80,75,0.8)';
        const corners = [
            [wallLeft - tSize * 0.3, wallTop - tSize * 0.3],
            [wallLeft + wallW - tSize * 0.7, wallTop - tSize * 0.3],
            [wallLeft - tSize * 0.3, wallTop + wallH - tSize * 0.7],
            [wallLeft + wallW - tSize * 0.7, wallTop + wallH - tSize * 0.7]
        ];
        for (const [tx, ty] of corners) {
            ctx.fillRect(tx, ty, tSize, tSize);
            ctx.strokeStyle = 'rgba(50,45,40,0.85)';
            ctx.lineWidth = lw;
            ctx.strokeRect(tx, ty, tSize, tSize);
        }

        // Flag on top-right tower
        if (fineDetail) {
            const flagX = corners[1][0] + tSize * 0.5;
            const flagBaseY = corners[1][1];
            ctx.strokeStyle = 'rgba(50,45,40,0.8)';
            ctx.lineWidth = Math.max(1, s * 0.025);
            ctx.beginPath();
            ctx.moveTo(flagX, flagBaseY);
            ctx.lineTo(flagX, flagBaseY - s * 0.1);
            ctx.stroke();
            ctx.fillStyle = 'rgba(200,40,40,0.85)';
            ctx.beginPath();
            ctx.moveTo(flagX, flagBaseY - s * 0.1);
            ctx.lineTo(flagX + s * 0.06, flagBaseY - s * 0.08);
            ctx.lineTo(flagX, flagBaseY - s * 0.06);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Gate opening at bottom center
    ctx.fillStyle = 'rgba(30,25,20,0.8)';
    const gateW = s * 0.1;
    const gateH = s * 0.12;
    ctx.fillRect(cx + s * 0.5 - gateW * 0.5, wallTop + wallH - gateH, gateW, gateH);
    // Gate arch
    ctx.beginPath();
    ctx.arc(cx + s * 0.5, wallTop + wallH - gateH, gateW * 0.5, Math.PI, 0);
    ctx.fill();
    ctx.restore();
}

function drawPort(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Dock/pier extending into water, small boats, wooden plank texture
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const side = seededRandom(gx, gy, 600) > 0.5 ? 'right' : 'bottom';

    // Water area on one side
    ctx.fillStyle = 'rgba(50,110,170,0.5)';
    if (side === 'right') {
        ctx.fillRect(cx + s * 0.55, cy, s * 0.45, s);
    } else {
        ctx.fillRect(cx, cy + s * 0.55, s, s * 0.45);
    }

    // Dock/pier
    ctx.fillStyle = 'rgba(140,105,60,0.8)';
    ctx.strokeStyle = 'rgba(90,65,35,0.8)';
    ctx.lineWidth = lw;
    if (side === 'right') {
        ctx.fillRect(cx + s * 0.35, cy + s * 0.35, s * 0.45, s * 0.1);
        ctx.strokeRect(cx + s * 0.35, cy + s * 0.35, s * 0.45, s * 0.1);
        // Plank lines
        if (fineDetail) {
            ctx.strokeStyle = 'rgba(100,75,40,0.6)';
            ctx.lineWidth = Math.max(1, s * 0.02);
            for (let i = 0; i < 4; i++) {
                const px = cx + s * 0.38 + i * s * 0.1;
                ctx.beginPath();
                ctx.moveTo(px, cy + s * 0.35);
                ctx.lineTo(px, cy + s * 0.45);
                ctx.stroke();
            }
        }
    } else {
        ctx.fillRect(cx + s * 0.35, cy + s * 0.35, s * 0.1, s * 0.45);
        ctx.strokeRect(cx + s * 0.35, cy + s * 0.35, s * 0.1, s * 0.45);
        if (fineDetail) {
            ctx.strokeStyle = 'rgba(100,75,40,0.6)';
            ctx.lineWidth = Math.max(1, s * 0.02);
            for (let i = 0; i < 4; i++) {
                const py = cy + s * 0.38 + i * s * 0.1;
                ctx.beginPath();
                ctx.moveTo(cx + s * 0.35, py);
                ctx.lineTo(cx + s * 0.45, py);
                ctx.stroke();
            }
        }
    }

    // Small boat shapes (pointed oval with mast)
    if (detail) {
        const boatCount = fineDetail ? 2 : 1;
        for (let i = 0; i < boatCount; i++) {
            let bx, by;
            if (side === 'right') {
                bx = cx + s * 0.65 + seededRandom(gx, gy, 610 + i) * s * 0.15;
                by = cy + s * 0.55 + seededRandom(gx, gy, 615 + i) * s * 0.25;
            } else {
                bx = cx + s * 0.55 + seededRandom(gx, gy, 610 + i) * s * 0.25;
                by = cy + s * 0.65 + seededRandom(gx, gy, 615 + i) * s * 0.15;
            }
            // Boat hull
            ctx.fillStyle = 'rgba(130,90,50,0.8)';
            ctx.beginPath();
            ctx.ellipse(bx, by, s * 0.08, s * 0.035, 0, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
            // Mast
            ctx.strokeStyle = 'rgba(100,70,35,0.8)';
            ctx.lineWidth = Math.max(1, s * 0.025);
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx, by - s * 0.1);
            ctx.stroke();
            // Small sail triangle
            ctx.fillStyle = 'rgba(230,220,200,0.7)';
            ctx.beginPath();
            ctx.moveTo(bx, by - s * 0.1);
            ctx.lineTo(bx + s * 0.05, by - s * 0.04);
            ctx.lineTo(bx, by - s * 0.02);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Small building on land side
    ctx.fillStyle = 'rgba(130,110,80,0.7)';
    ctx.fillRect(cx + s * 0.08, cy + s * 0.08, s * 0.18, s * 0.15);
    ctx.strokeStyle = 'rgba(80,60,40,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.strokeRect(cx + s * 0.08, cy + s * 0.08, s * 0.18, s * 0.15);
    ctx.restore();
}

function drawOasis(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Bright blue water pool, palm trees around it, green vegetation ring
    ctx.save();
    const lw = Math.max(1, s * 0.05);
    const centerX = cx + s * 0.5;
    const centerY = cy + s * 0.52;

    // Sandy background tint
    ctx.fillStyle = 'rgba(210,180,100,0.25)';
    ctx.fillRect(cx, cy, s, s);

    // Green vegetation ring
    ctx.fillStyle = 'rgba(50,150,50,0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, s * 0.32, 0, Math.PI * 2);
    ctx.fill();

    // Bright blue water pool
    ctx.fillStyle = 'rgba(60,150,220,0.8)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, s * 0.18, s * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water shimmer highlight
    ctx.fillStyle = 'rgba(150,210,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(centerX - s * 0.04, centerY - s * 0.03, s * 0.08, s * 0.05, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Palm trees around the pool
    if (detail) {
        const palmCount = fineDetail ? 3 : 2;
        for (let i = 0; i < palmCount; i++) {
            const angle = seededRandom(gx, gy, 650 + i) * Math.PI * 2;
            const dist = s * 0.25;
            const ptx = centerX + Math.cos(angle) * dist;
            const pty = centerY + Math.sin(angle) * dist;
            const trunkTopX = ptx + (centerX > ptx ? -1 : 1) * s * 0.04;
            const trunkTopY = pty - s * 0.2;

            // Curved trunk
            ctx.strokeStyle = 'rgba(120,85,40,0.8)';
            ctx.lineWidth = Math.max(1.5, s * 0.04);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ptx, pty);
            ctx.quadraticCurveTo(ptx + (trunkTopX - ptx) * 0.5, pty - s * 0.12, trunkTopX, trunkTopY);
            ctx.stroke();

            // Fan of leaf lines at top
            ctx.strokeStyle = 'rgba(40,130,30,0.8)';
            ctx.lineWidth = Math.max(1, s * 0.03);
            for (let l = 0; l < 5; l++) {
                const leafAngle = -Math.PI * 0.8 + l * Math.PI * 0.4;
                const leafLen = s * 0.1;
                ctx.beginPath();
                ctx.moveTo(trunkTopX, trunkTopY);
                ctx.quadraticCurveTo(
                    trunkTopX + Math.cos(leafAngle) * leafLen * 0.7,
                    trunkTopY + Math.sin(leafAngle) * leafLen * 0.3,
                    trunkTopX + Math.cos(leafAngle) * leafLen,
                    trunkTopY + Math.sin(leafAngle) * leafLen + s * 0.03
                );
                ctx.stroke();
            }
        }
    }
    ctx.restore();
}

function drawSavanna(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Tall dry grass blades, iconic flat-topped acacia tree, warm golden tones
    ctx.save();
    const lw = Math.max(1, s * 0.04);

    // Tall dry grass blades (yellow-brown, taller than plains)
    const grassCount = fineDetail ? 7 : (detail ? 4 : 2);
    for (let i = 0; i < grassCount; i++) {
        const bx = cx + seededRandom(gx, gy, 700 + i) * s * 0.85 + s * 0.075;
        const by = cy + seededRandom(gx, gy, 710 + i) * s * 0.25 + s * 0.7;
        const h = s * (0.25 + seededRandom(gx, gy, 720 + i) * 0.15);
        const lean = (seededRandom(gx, gy, 730 + i) - 0.5) * s * 0.08;

        ctx.strokeStyle = 'rgba(180,160,60,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.035);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + lean * 0.5, by - h * 0.6, bx + lean, by - h);
        ctx.stroke();
    }

    // Iconic flat-topped acacia tree
    if (detail) {
        const tx = cx + s * 0.5 + (seededRandom(gx, gy, 741) - 0.5) * s * 0.2;
        const tBase = cy + s * 0.7;
        const tTop = tBase - s * 0.35;

        // Thin trunk
        ctx.strokeStyle = 'rgba(100,70,35,0.8)';
        ctx.lineWidth = Math.max(1.5, s * 0.04);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, tBase);
        ctx.lineTo(tx, tTop + s * 0.04);
        ctx.stroke();

        // Wide flat canopy
        ctx.fillStyle = 'rgba(90,120,35,0.7)';
        ctx.beginPath();
        ctx.ellipse(tx, tTop, s * 0.2, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,80,20,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.ellipse(tx, tTop, s * 0.2, s * 0.07, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Darker underside of canopy
        ctx.fillStyle = 'rgba(50,70,20,0.4)';
        ctx.beginPath();
        ctx.ellipse(tx, tTop + s * 0.03, s * 0.18, s * 0.04, 0, 0, Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

function drawTaiga(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // 2-3 triangular pine/conifer tree sprites (stacked triangles, thin trunk)
    ctx.save();
    const lw = Math.max(1, s * 0.04);
    const count = fineDetail ? 3 : (detail ? 2 : 1);

    for (let i = 0; i < count; i++) {
        const tx = cx + seededRandom(gx, gy, 800 + i) * s * 0.55 + s * 0.22;
        const tBase = cy + seededRandom(gx, gy, 810 + i) * s * 0.15 + s * 0.78;
        const tHeight = s * (0.45 + seededRandom(gx, gy, 820 + i) * 0.1);
        const tWidth = s * (0.12 + seededRandom(gx, gy, 830 + i) * 0.05);

        // Brown trunk
        ctx.strokeStyle = 'rgba(90,55,25,0.8)';
        ctx.lineWidth = Math.max(1.5, s * 0.04);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, tBase);
        ctx.lineTo(tx, tBase - tHeight * 0.25);
        ctx.stroke();

        // 3 stacked triangles (bottom to top, getting smaller)
        const tiers = fineDetail ? 3 : 2;
        for (let t = 0; t < tiers; t++) {
            const tierY = tBase - tHeight * (0.2 + t * 0.28);
            const tierW = tWidth * (1.1 - t * 0.25);
            const tierH = tHeight * 0.35;

            ctx.fillStyle = `rgba(25,${75 - t * 10},${40 - t * 5},0.8)`;
            ctx.beginPath();
            ctx.moveTo(tx, tierY - tierH);
            ctx.lineTo(tx - tierW, tierY);
            ctx.lineTo(tx + tierW, tierY);
            ctx.closePath();
            ctx.fill();

            // Tier outline
            ctx.strokeStyle = `rgba(15,${50 - t * 8},${25 - t * 3},0.6)`;
            ctx.lineWidth = Math.max(1, s * 0.025);
            ctx.beginPath();
            ctx.moveTo(tx, tierY - tierH);
            ctx.lineTo(tx - tierW, tierY);
            ctx.lineTo(tx + tierW, tierY);
            ctx.closePath();
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawCliff(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Bold jagged edge lines, hatching/shading below, dark brown rock face
    ctx.save();
    const lw = Math.max(1.5, s * 0.07);

    // Cliff edge - bold jagged line across upper portion
    const edgeY = cy + s * 0.35;
    const segments = fineDetail ? 7 : (detail ? 5 : 3);
    ctx.strokeStyle = 'rgba(60,45,30,0.9)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(cx, edgeY + seededRandom(gx, gy, 900) * s * 0.05);
    for (let j = 1; j <= segments; j++) {
        const sx = cx + (s / segments) * j;
        const sy = edgeY + (seededRandom(gx, gy, 910 + j) - 0.5) * s * 0.15;
        ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Second edge line (slightly below, parallel jagged)
    ctx.strokeStyle = 'rgba(80,60,40,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    const edgeY2 = edgeY + s * 0.08;
    ctx.moveTo(cx, edgeY2 + seededRandom(gx, gy, 930) * s * 0.04);
    for (let j = 1; j <= segments; j++) {
        const sx = cx + (s / segments) * j;
        const sy = edgeY2 + (seededRandom(gx, gy, 940 + j) - 0.5) * s * 0.1;
        ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Hatching/shading below cliff edge (parallel diagonal lines)
    ctx.strokeStyle = 'rgba(50,35,22,0.55)';
    ctx.lineWidth = Math.max(1, s * 0.03);
    const hatchCount = fineDetail ? 8 : (detail ? 5 : 3);
    for (let i = 0; i < hatchCount; i++) {
        const hx = cx + (s / hatchCount) * i + s * 0.05;
        const hy = edgeY + s * 0.12;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + s * 0.06, hy + s * 0.2);
        ctx.stroke();
    }

    // Dark rock face fill below edge
    ctx.fillStyle = 'rgba(50,38,25,0.4)';
    ctx.fillRect(cx, edgeY + s * 0.1, s, s * 0.55);

    // Rock layer lines
    if (detail) {
        ctx.strokeStyle = 'rgba(70,55,35,0.6)';
        ctx.lineWidth = Math.max(1, s * 0.04);
        for (let i = 0; i < 2; i++) {
            const ly = edgeY + s * 0.25 + i * s * 0.18;
            ctx.beginPath();
            ctx.moveTo(cx + s * 0.05, ly);
            ctx.lineTo(cx + s * 0.95, ly + (seededRandom(gx, gy, 960 + i) - 0.5) * s * 0.06);
            ctx.stroke();
        }
    }
    ctx.restore();
}

// --- Pokemon terrain renderers ---

function drawTallGrass(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Bold V-shaped grass blades in varying dark green shades on bright green base
    ctx.save();
    const lw = Math.max(1.5, s * 0.08);

    // Draw 3-5 V-shaped grass blades
    const bladeCount = fineDetail ? 5 : (detail ? 4 : 3);
    const greens = [
        'rgba(30,100,15,0.85)',
        'rgba(25,80,10,0.8)',
        'rgba(40,110,20,0.9)',
        'rgba(20,70,8,0.75)',
        'rgba(35,95,18,0.85)'
    ];

    for (let i = 0; i < bladeCount; i++) {
        const bx = cx + s * (0.12 + seededRandom(gx, gy, 1000 + i) * 0.7);
        const by = cy + s * (0.4 + seededRandom(gx, gy, 1010 + i) * 0.45);
        const bladeH = s * (0.25 + seededRandom(gx, gy, 1020 + i) * 0.2);
        const spread = s * (0.06 + seededRandom(gx, gy, 1030 + i) * 0.06);

        ctx.strokeStyle = greens[i % greens.length];
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Left blade of V
        ctx.beginPath();
        ctx.moveTo(bx - spread, by - bladeH);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // Right blade of V
        ctx.beginPath();
        ctx.moveTo(bx + spread, by - bladeH * 0.9);
        ctx.lineTo(bx, by);
        ctx.stroke();
    }

    // Tiny dots/seeds between blades at fine detail
    if (fineDetail) {
        ctx.fillStyle = 'rgba(60,130,30,0.6)';
        for (let i = 0; i < 4; i++) {
            const dx = cx + s * (0.15 + seededRandom(gx, gy, 1050 + i) * 0.7);
            const dy = cy + s * (0.5 + seededRandom(gx, gy, 1060 + i) * 0.35);
            ctx.beginPath();
            ctx.arc(dx, dy, Math.max(0.5, s * 0.02), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawPokemonCenter(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Iconic red-roofed Pokemon Center with pokeball symbol
    ctx.save();
    const lw = Math.max(1, s * 0.04);

    // Red roof - top 60% of cell
    const roofBottom = cy + s * 0.6;
    ctx.fillStyle = 'rgba(200,40,40,0.85)';
    ctx.fillRect(cx + s * 0.05, cy + s * 0.05, s * 0.9, s * 0.55);

    // Roof outline
    ctx.strokeStyle = 'rgba(140,20,20,0.9)';
    ctx.lineWidth = lw;
    ctx.strokeRect(cx + s * 0.05, cy + s * 0.05, s * 0.9, s * 0.55);

    // White circle (pokeball symbol) on roof
    if (detail) {
        const circR = s * 0.12;
        const circX = cx + s * 0.5;
        const circY = cy + s * 0.3;

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(circX, circY, circR, 0, Math.PI * 2);
        ctx.fill();

        // Horizontal line through circle (pokeball divider)
        ctx.strokeStyle = 'rgba(180,30,30,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.moveTo(circX - circR, circY);
        ctx.lineTo(circX + circR, circY);
        ctx.stroke();

        // Small center dot
        ctx.fillStyle = 'rgba(180,30,30,0.8)';
        ctx.beginPath();
        ctx.arc(circX, circY, circR * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Building face below roof - cream/white
    ctx.fillStyle = 'rgba(240,235,220,0.85)';
    ctx.fillRect(cx + s * 0.08, roofBottom, s * 0.84, s * 0.35);

    // Building face outline
    ctx.strokeStyle = 'rgba(160,150,130,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.strokeRect(cx + s * 0.08, roofBottom, s * 0.84, s * 0.35);

    // Dark door centered on building face
    if (detail) {
        const doorW = s * 0.14;
        const doorH = s * 0.2;
        const doorX = cx + s * 0.5 - doorW / 2;
        const doorY = roofBottom + s * 0.15;

        ctx.fillStyle = 'rgba(40,35,30,0.8)';
        ctx.fillRect(doorX, doorY, doorW, doorH);

        // Door frame
        ctx.strokeStyle = 'rgba(100,90,70,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.strokeRect(doorX, doorY, doorW, doorH);
    }

    ctx.restore();
}

function drawGym(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Larger blue/indigo gym building with badge star symbol
    ctx.save();
    const lw = Math.max(1, s * 0.04);

    // Building body - slightly taller than Pokemon Center
    const bodyTop = cy + s * 0.02;
    const bodyH = s * 0.96;

    // Indigo/blue roof - top 55%
    ctx.fillStyle = 'rgba(65,65,160,0.85)';
    ctx.fillRect(cx + s * 0.03, bodyTop, s * 0.94, s * 0.55);

    // Roof outline
    ctx.strokeStyle = 'rgba(40,40,110,0.9)';
    ctx.lineWidth = lw;
    ctx.strokeRect(cx + s * 0.03, bodyTop, s * 0.94, s * 0.55);

    // Pointed roof peak
    ctx.fillStyle = 'rgba(55,55,140,0.9)';
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.03, bodyTop);
    ctx.lineTo(cx + s * 0.5, bodyTop - s * 0.08);
    ctx.lineTo(cx + s * 0.97, bodyTop);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,110,0.9)';
    ctx.lineWidth = lw * 0.8;
    ctx.stroke();

    // Star/badge symbol on front
    if (detail) {
        const starX = cx + s * 0.5;
        const starY = cy + s * 0.3;
        const outerR = s * 0.1;
        const innerR = s * 0.04;
        const points = 5;

        ctx.fillStyle = 'rgba(255,220,60,0.9)';
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (Math.PI / 2 * -1) + (i * Math.PI / points);
            const r = i % 2 === 0 ? outerR : innerR;
            const px = starX + Math.cos(angle) * r;
            const py = starY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,150,20,0.8)';
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.stroke();
    }

    // Building face below roof - lighter blue/gray
    const faceTop = bodyTop + s * 0.55;
    ctx.fillStyle = 'rgba(200,200,220,0.85)';
    ctx.fillRect(cx + s * 0.06, faceTop, s * 0.88, s * 0.41);

    // Building face outline
    ctx.strokeStyle = 'rgba(100,100,140,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.strokeRect(cx + s * 0.06, faceTop, s * 0.88, s * 0.41);

    // Double doors
    if (detail) {
        const doorW = s * 0.1;
        const doorH = s * 0.22;
        const doorY = faceTop + s * 0.19;

        // Left door
        ctx.fillStyle = 'rgba(50,50,90,0.8)';
        ctx.fillRect(cx + s * 0.39, doorY, doorW, doorH);
        // Right door
        ctx.fillRect(cx + s * 0.51, doorY, doorW, doorH);

        // Door frames
        ctx.strokeStyle = 'rgba(80,80,130,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.strokeRect(cx + s * 0.39, doorY, doorW, doorH);
        ctx.strokeRect(cx + s * 0.51, doorY, doorW, doorH);
    }

    ctx.restore();
}

function drawPokeMart(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Blue-roofed shop building with sign
    ctx.save();
    const lw = Math.max(1, s * 0.04);

    // Blue roof - top 50%
    const roofBottom = cy + s * 0.5;
    ctx.fillStyle = 'rgba(40,100,190,0.85)';
    ctx.fillRect(cx + s * 0.06, cy + s * 0.08, s * 0.88, s * 0.42);

    // Roof outline
    ctx.strokeStyle = 'rgba(25,70,140,0.9)';
    ctx.lineWidth = lw;
    ctx.strokeRect(cx + s * 0.06, cy + s * 0.08, s * 0.88, s * 0.42);

    // Building face below roof - light blue/white
    ctx.fillStyle = 'rgba(230,240,250,0.85)';
    ctx.fillRect(cx + s * 0.08, roofBottom, s * 0.84, s * 0.42);

    // Building face outline
    ctx.strokeStyle = 'rgba(120,140,170,0.7)';
    ctx.lineWidth = lw * 0.7;
    ctx.strokeRect(cx + s * 0.08, roofBottom, s * 0.84, s * 0.42);

    // Sign on front (small rectangle)
    if (detail) {
        const signW = s * 0.3;
        const signH = s * 0.1;
        const signX = cx + s * 0.5 - signW / 2;
        const signY = roofBottom + s * 0.05;

        ctx.fillStyle = 'rgba(50,110,200,0.8)';
        ctx.fillRect(signX, signY, signW, signH);
        ctx.strokeStyle = 'rgba(30,70,140,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.strokeRect(signX, signY, signW, signH);

        // "M" text hint on sign at fine detail
        if (fineDetail) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = Math.max(1, s * 0.025);
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            const mLeft = signX + signW * 0.25;
            const mRight = signX + signW * 0.75;
            const mTop = signY + signH * 0.2;
            const mBottom = signY + signH * 0.8;
            ctx.beginPath();
            ctx.moveTo(mLeft, mBottom);
            ctx.lineTo(mLeft, mTop);
            ctx.lineTo(signX + signW * 0.5, mBottom * 0.5 + mTop * 0.5);
            ctx.lineTo(mRight, mTop);
            ctx.lineTo(mRight, mBottom);
            ctx.stroke();
        }
    }

    // Door
    if (detail) {
        const doorW = s * 0.12;
        const doorH = s * 0.18;
        const doorX = cx + s * 0.5 - doorW / 2;
        const doorY = roofBottom + s * 0.24;

        ctx.fillStyle = 'rgba(40,35,30,0.8)';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeStyle = 'rgba(80,90,110,0.7)';
        ctx.lineWidth = Math.max(1, s * 0.02);
        ctx.strokeRect(doorX, doorY, doorW, doorH);
    }

    ctx.restore();
}

function drawRoutePath(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Subtle dirt path texture with scattered pebbles and faint parallel lines
    ctx.save();

    // Faint parallel path lines
    ctx.strokeStyle = 'rgba(160,130,80,0.5)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, cy);
    ctx.lineTo(cx + s * 0.2, cy + s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + s * 0.8, cy);
    ctx.lineTo(cx + s * 0.8, cy + s);
    ctx.stroke();

    // Scattered pebbles/dots
    const pebbleCount = fineDetail ? 8 : (detail ? 5 : 3);
    for (let i = 0; i < pebbleCount; i++) {
        const px = cx + s * (0.1 + seededRandom(gx, gy, 1200 + i) * 0.8);
        const py = cy + s * (0.1 + seededRandom(gx, gy, 1210 + i) * 0.8);
        const pr = Math.max(0.5, s * (0.015 + seededRandom(gx, gy, 1220 + i) * 0.015));
        const shade = 100 + seededRandom(gx, gy, 1230 + i) * 60 | 0;

        ctx.fillStyle = `rgba(${shade},${shade - 20},${shade - 40},0.6)`;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
    }

    // Worn texture lines (short horizontal scratches)
    if (detail) {
        ctx.strokeStyle = 'rgba(140,115,65,0.4)';
        ctx.lineWidth = Math.max(1, s * 0.025);
        for (let i = 0; i < 3; i++) {
            const lx = cx + s * (0.25 + seededRandom(gx, gy, 1250 + i) * 0.5);
            const ly = cy + s * (0.2 + seededRandom(gx, gy, 1260 + i) * 0.6);
            const ll = s * (0.08 + seededRandom(gx, gy, 1270 + i) * 0.12);
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + ll, ly);
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawLedge(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Horizontal ledge line with shadow beneath and hatching on face
    ctx.save();
    const lw = Math.max(1.5, s * 0.08);

    // Main ledge line across the cell
    const ledgeY = cy + s * 0.4;
    ctx.strokeStyle = 'rgba(70,50,30,0.9)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, ledgeY);
    ctx.lineTo(cx + s, ledgeY);
    ctx.stroke();

    // Shadow below the ledge line
    ctx.fillStyle = 'rgba(40,30,15,0.5)';
    ctx.fillRect(cx, ledgeY + lw * 0.5, s, s * 0.08);

    // Ledge face fill (between ledge line and bottom)
    ctx.fillStyle = 'rgba(80,65,40,0.4)';
    ctx.fillRect(cx, ledgeY + s * 0.08, s, s * 0.25);

    // Hatching marks on the ledge face
    const hatchCount = fineDetail ? 7 : (detail ? 5 : 3);
    ctx.strokeStyle = 'rgba(55,40,22,0.6)';
    ctx.lineWidth = Math.max(1, s * 0.03);
    for (let i = 0; i < hatchCount; i++) {
        const hx = cx + (s / (hatchCount + 1)) * (i + 1);
        const hy = ledgeY + s * 0.1;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - s * 0.03, hy + s * 0.2);
        ctx.stroke();
    }

    // Bottom edge line (lighter)
    if (detail) {
        ctx.strokeStyle = 'rgba(90,75,50,0.6)';
        ctx.lineWidth = Math.max(1, s * 0.04);
        ctx.beginPath();
        ctx.moveTo(cx, ledgeY + s * 0.33);
        ctx.lineTo(cx + s, ledgeY + s * 0.33);
        ctx.stroke();
    }

    // Downward arrow hint (jump direction) at fine detail
    if (fineDetail) {
        ctx.fillStyle = 'rgba(50,35,18,0.5)';
        const ax = cx + s * 0.5;
        const ay = ledgeY + s * 0.45;
        ctx.beginPath();
        ctx.moveTo(ax - s * 0.06, ay);
        ctx.lineTo(ax + s * 0.06, ay);
        ctx.lineTo(ax, ay + s * 0.1);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawCaveEntrance(ctx, cx, cy, s, gx, gy, detail, fineDetail) {
    // Dark arch opening in a rocky gray surround
    ctx.save();
    const lw = Math.max(1, s * 0.05);

    // Rocky surround - gray stone border
    ctx.fillStyle = 'rgba(90,80,70,0.7)';
    ctx.fillRect(cx + s * 0.05, cy + s * 0.05, s * 0.9, s * 0.9);

    // Rocky texture bumps on surround
    if (detail) {
        const bumpCount = fineDetail ? 6 : 4;
        for (let i = 0; i < bumpCount; i++) {
            const bx = cx + s * (0.08 + seededRandom(gx, gy, 1400 + i) * 0.84);
            const by = cy + s * (0.08 + seededRandom(gx, gy, 1410 + i) * 0.84);
            const br = Math.max(1, s * (0.03 + seededRandom(gx, gy, 1420 + i) * 0.03));
            const shade = 70 + seededRandom(gx, gy, 1430 + i) * 40 | 0;
            ctx.fillStyle = `rgba(${shade},${shade - 10},${shade - 15},0.6)`;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Dark cave opening (arch/oval)
    const archCx = cx + s * 0.5;
    const archCy = cy + s * 0.55;
    const archW = s * 0.35;
    const archH = s * 0.4;

    // Near-black interior
    ctx.fillStyle = 'rgba(10,5,5,0.9)';
    ctx.beginPath();
    ctx.ellipse(archCx, archCy, archW, archH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slightly lighter arch rim
    ctx.strokeStyle = 'rgba(60,50,40,0.8)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(archCx, archCy, archW, archH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Stalactite hints at top of arch
    if (fineDetail) {
        ctx.fillStyle = 'rgba(70,60,50,0.7)';
        for (let i = 0; i < 3; i++) {
            const tx = archCx + (i - 1) * s * 0.1;
            const ty = archCy - archH + s * 0.02;
            const th = s * (0.05 + seededRandom(gx, gy, 1450 + i) * 0.05);
            ctx.beginPath();
            ctx.moveTo(tx - s * 0.02, ty);
            ctx.lineTo(tx, ty + th);
            ctx.lineTo(tx + s * 0.02, ty);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Depth gradient inside cave opening
    const depthGrad = ctx.createRadialGradient(archCx, archCy, 0, archCx, archCy, archW);
    depthGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
    depthGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = depthGrad;
    ctx.beginPath();
    ctx.ellipse(archCx, archCy, archW * 0.7, archH * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
