// tools.js - Painting tools (brush, fill, eraser, line, rect select)

import { TERRAIN_TYPES } from './terrain.js';

export const TOOL = {
    BRUSH: 'brush',
    FILL: 'fill',
    ERASER: 'eraser',
    LINE: 'line',
    RECT: 'rect',
    MEASURE: 'measure',
    LABEL: 'label',
    NATION: 'nation'
};

/**
 * Get all cells within a circular brush centered at (cx, cy) with given radius.
 * If softEdge is true, returns cells with an opacity weight based on distance.
 */
export function getBrushCells(cx, cy, radius, mapWidth, mapHeight, softEdge = false) {
    const cells = [];
    const r = Math.max(1, radius);
    const x0 = Math.max(0, Math.floor(cx - r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const x1 = Math.min(mapWidth - 1, Math.ceil(cx + r));
    const y1 = Math.min(mapHeight - 1, Math.ceil(cy + r));

    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= r) {
                let weight = 1;
                if (softEdge && r > 1) {
                    weight = 1 - Math.pow(dist / r, 2);
                    weight = Math.max(0, Math.min(1, weight));
                }
                cells.push({ x, y, weight });
            }
        }
    }
    return cells;
}

/**
 * Get cells along a line from (x0,y0) to (x1,y1) using Bresenham's,
 * expanded by brush radius.
 */
export function getLineCells(x0, y0, x1, y1, radius, mapWidth, mapHeight, softEdge = false) {
    const linePoints = bresenham(x0, y0, x1, y1);
    const cellSet = new Map();

    for (const pt of linePoints) {
        const brushCells = getBrushCells(pt.x, pt.y, radius, mapWidth, mapHeight, softEdge);
        for (const c of brushCells) {
            const key = `${c.x},${c.y}`;
            if (!cellSet.has(key) || cellSet.get(key).weight < c.weight) {
                cellSet.set(key, c);
            }
        }
    }
    return Array.from(cellSet.values());
}

/**
 * Get cells in a filled rectangle.
 */
export function getRectCells(x0, y0, x1, y1, mapWidth, mapHeight) {
    const cells = [];
    const minX = Math.max(0, Math.min(x0, x1));
    const maxX = Math.min(mapWidth - 1, Math.max(x0, x1));
    const minY = Math.max(0, Math.min(y0, y1));
    const maxY = Math.min(mapHeight - 1, Math.max(y0, y1));

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            cells.push({ x, y, weight: 1 });
        }
    }
    return cells;
}

/**
 * Flood fill from (startX, startY), replacing targetTerrain with fillTerrain.
 * Returns array of {x, y} cells that were filled.
 */
export function floodFill(grid, mapWidth, mapHeight, startX, startY, fillTerrainId) {
    if (startX < 0 || startX >= mapWidth || startY < 0 || startY >= mapHeight) return [];

    const targetId = grid[startY * mapWidth + startX];
    if (targetId === fillTerrainId) return [];

    const filled = [];
    const visited = new Uint8Array(mapWidth * mapHeight);
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const idx = y * mapWidth + x;

        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;
        if (visited[idx]) continue;
        if (grid[idx] !== targetId) continue;

        visited[idx] = 1;
        filled.push({ x, y, weight: 1 });

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
    }

    return filled;
}

// Bresenham's line algorithm
function bresenham(x0, y0, x1, y1) {
    const points = [];
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        points.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
}
