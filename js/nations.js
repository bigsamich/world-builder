// nations.js - Nation/territory data management

import { TERRAIN_BY_ID } from './terrain.js';

export const NATION_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
    '#fd79a8', '#00cec9', '#fab1a0', '#a29bfe', '#ffeaa7',
    '#dfe6e9', '#b2bec3', '#636e72'
];

// Syllable pools for fantasy nation name generation
const NAME_PREFIXES = [
    'Val', 'Kar', 'Eth', 'Mar', 'Gon', 'Ris', 'Wen', 'Thal',
    'Dor', 'Ael', 'Bri', 'Cor', 'Fen', 'Hal', 'Ith', 'Kel',
    'Lor', 'Mor', 'Nar', 'Orm', 'Pyr', 'Rav', 'Sul', 'Tor',
    'Ulm', 'Vor', 'Zan', 'Ash', 'Ber', 'Cyr'
];

const NAME_SUFFIXES = [
    'dor', 'heim', 'eth', 'mar', 'ris', 'thal', 'wen', 'gon',
    'dar', 'ael', 'ion', 'ora', 'und', 'enn', 'ark', 'oth',
    'ium', 'eld', 'ain', 'orn', 'ath', 'ire', 'aal', 'ost',
    'urn', 'ell', 'iss', 'ard', 'ulf', 'ian'
];

/**
 * Generate a fantasy nation name from a seed value.
 */
export function generateNationName(seed) {
    const pi = Math.abs(seed * 374761393) % NAME_PREFIXES.length;
    const si = Math.abs(seed * 668265263) % NAME_SUFFIXES.length;
    return NAME_PREFIXES[pi] + NAME_SUFFIXES[si];
}

export class NationManager {
    constructor() {
        this.nations = [];              // Array of { id, name, color, cells: Set<"x,y"> }
        this.nextId = 1;
        this.cellToNation = new Map();  // "x,y" -> nationId (fast lookup)
    }

    /**
     * Create a new nation with given name and color.
     */
    addNation(name, color) {
        const nation = {
            id: this.nextId++,
            name,
            color,
            cells: new Set()
        };
        this.nations.push(nation);
        return nation;
    }

    /**
     * Remove a nation by id, clearing all its cell assignments.
     */
    removeNation(id) {
        const nation = this.getNation(id);
        if (!nation) return;
        // Clear cell lookups
        for (const key of nation.cells) {
            this.cellToNation.delete(key);
        }
        this.nations = this.nations.filter(n => n.id !== id);
    }

    /**
     * Get a nation by id.
     */
    getNation(id) {
        return this.nations.find(n => n.id === id) || null;
    }

    /**
     * Return all nations.
     */
    getAllNations() {
        return this.nations;
    }

    /**
     * Assign a cell to a nation.
     */
    assignCell(nationId, x, y) {
        const key = `${x},${y}`;
        // Remove from previous nation if any
        const prevId = this.cellToNation.get(key);
        if (prevId !== undefined) {
            const prevNation = this.getNation(prevId);
            if (prevNation) prevNation.cells.delete(key);
        }
        // Assign to new nation
        this.cellToNation.set(key, nationId);
        const nation = this.getNation(nationId);
        if (nation) nation.cells.add(key);
    }

    /**
     * Remove a cell from any nation.
     */
    unassignCell(x, y) {
        const key = `${x},${y}`;
        const nationId = this.cellToNation.get(key);
        if (nationId !== undefined) {
            const nation = this.getNation(nationId);
            if (nation) nation.cells.delete(key);
            this.cellToNation.delete(key);
        }
    }

    /**
     * Get the nation id at a cell, or null.
     */
    getNationAt(x, y) {
        const key = `${x},${y}`;
        const id = this.cellToNation.get(key);
        return id !== undefined ? id : null;
    }

    /**
     * Flood-fill assign cells to a nation from a starting point.
     * Only fills land cells (same terrain category as start). Stops at water for land starts.
     */
    floodAssign(nationId, grid, mapWidth, mapHeight, startX, startY) {
        if (startX < 0 || startX >= mapWidth || startY < 0 || startY >= mapHeight) return;

        const startTerrain = grid[startY * mapWidth + startX];
        const startInfo = TERRAIN_BY_ID[startTerrain];
        if (!startInfo) return;

        // Determine which terrain categories to fill through
        const startCat = startInfo.category;
        // For land starts, fill through all land + structure categories
        // For water starts, fill through water only
        const allowedCategories = new Set();
        if (startCat === 'water') {
            allowedCategories.add('water');
        } else {
            allowedCategories.add('land');
            allowedCategories.add('structure');
        }

        const visited = new Uint8Array(mapWidth * mapHeight);
        const stack = [{ x: startX, y: startY }];
        const assigned = [];

        while (stack.length > 0) {
            const { x, y } = stack.pop();
            if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) continue;

            const idx = y * mapWidth + x;
            if (visited[idx]) continue;
            visited[idx] = 1;

            const terrainId = grid[idx];
            const terrainInfo = TERRAIN_BY_ID[terrainId];
            if (!terrainInfo || !allowedCategories.has(terrainInfo.category)) continue;

            // Assign cell
            this.assignCell(nationId, x, y);
            assigned.push({ x, y });

            // Expand to 4 neighbors
            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }

        return assigned;
    }

    /**
     * Serialize nation data for save/load.
     */
    serialize() {
        return {
            nextId: this.nextId,
            nations: this.nations.map(n => ({
                id: n.id,
                name: n.name,
                color: n.color,
                cells: Array.from(n.cells)
            }))
        };
    }

    /**
     * Deserialize nation data from save/load.
     */
    deserialize(data) {
        if (!data) return;
        this.clear();
        this.nextId = data.nextId || 1;
        if (data.nations) {
            for (const nd of data.nations) {
                const nation = {
                    id: nd.id,
                    name: nd.name,
                    color: nd.color,
                    cells: new Set(nd.cells)
                };
                this.nations.push(nation);
                // Rebuild cellToNation lookup
                for (const key of nation.cells) {
                    this.cellToNation.set(key, nation.id);
                }
            }
        }
    }

    /**
     * Remove all nations and cell assignments.
     */
    clear() {
        this.nations = [];
        this.nextId = 1;
        this.cellToNation.clear();
    }
}
