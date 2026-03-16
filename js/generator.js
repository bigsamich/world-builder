// generator.js - Procedural map generation using simplex-like noise

import { TERRAIN_TYPES, TERRAIN_BY_ID } from './terrain.js';
import { NATION_COLORS, generateNationName } from './nations.js';

// ==================== Fantasy Settlement Name Generator ====================

const CITY_PREFIXES = [
    'King', 'Iron', 'Storm', 'Haven', 'Silver', 'Dragon', 'Raven', 'Stone',
    'North', 'South', 'East', 'West', 'High', 'Old', 'New', 'White',
    'Black', 'Red', 'Gold', 'Sun', 'Moon', 'Star', 'Frost', 'Shadow',
    'Bright', 'Dark', 'Sea', 'River', 'Lake', 'Oak', 'Elm', 'Wolf',
    'Eagle', 'Lion', 'Bear', 'Falcon', 'Crown', 'Shield', 'Sword', 'Tower'
];

const CITY_SUFFIXES = [
    'hold', 'gate', 'port', 'keep', 'burgh', 'ford', 'dale', 'haven',
    'watch', 'guard', 'fell', 'wick', 'ton', 'holm', 'bridge', 'moor',
    'vale', 'crest', 'march', 'reach', 'shore', 'cliff', 'peak', 'wood',
    'field', 'stead', 'helm', 'spire', 'wall', 'barrow', 'mere', 'glen',
    'thorpe', 'bay', 'rock', 'cross', 'well', 'mount', 'deep', 'hollow'
];

const TOWN_PREFIXES = [
    'Green', 'Mill', 'Fair', 'Ash', 'Willow', 'Maple', 'Honey', 'Thorn',
    'Moss', 'Fern', 'Copper', 'Amber', 'Berry', 'Fox', 'Hare', 'Dove',
    'Wren', 'Lark', 'Brook', 'Spring', 'Meadow', 'Pebble', 'Sandy', 'Misty',
    'Quiet', 'Little', 'Long', 'Round', 'Steep', 'Dry', 'Wet', 'Cold'
];

const TOWN_SUFFIXES = [
    'village', 'ham', 'bury', 'by', 'worth', 'ley', 'cot', 'end',
    'green', 'hill', 'heath', 'down', 'side', 'bank', 'pool', 'ford',
    'nook', 'bend', 'rest', 'way', 'walk', 'lane', 'row', 'bottom'
];

const RUIN_NAMES = [
    'Lost Temple', 'Fallen Spire', 'Broken Tower', 'Sunken Hall',
    'Cursed Ruins', 'Ancient Keep', 'Forgotten Shrine', 'Shattered Gate',
    'Tomb of Kings', 'Shadow Crypt', 'Haunted Citadel', 'Dragonbone Ruins',
    'Silent Sanctum', 'Ashen Fortress', 'Wraithhold', 'Old Bones',
    'Dire Hollow', 'Blighted Hall', 'Darkspire Ruins', 'The Dead City'
];

function generateSettlementName(seed, type) {
    const h = Math.abs(Math.floor(seed)) || 1;
    if (type === 'city') {
        const pi = Math.floor(hash2d(h, 200, h) * CITY_PREFIXES.length);
        const si = Math.floor(hash2d(h, 201, h) * CITY_SUFFIXES.length);
        return CITY_PREFIXES[pi] + CITY_SUFFIXES[si];
    } else if (type === 'town') {
        const pi = Math.floor(hash2d(h, 210, h) * TOWN_PREFIXES.length);
        const si = Math.floor(hash2d(h, 211, h) * TOWN_SUFFIXES.length);
        return TOWN_PREFIXES[pi] + TOWN_SUFFIXES[si];
    } else {
        const ri = Math.floor(hash2d(h, 220, h) * RUIN_NAMES.length);
        return RUIN_NAMES[ri];
    }
}

// ==================== Pokemon-Style Name Generators ====================

const PKM_TOWN_PREFIXES = [
    'Amber', 'Ashen', 'Azure', 'Birch', 'Bloom', 'Bramble', 'Bright',
    'Cedar', 'Cobalt', 'Coral', 'Crimson', 'Crystal', 'Dusk', 'Elder',
    'Ember', 'Fern', 'Flint', 'Frost', 'Gale', 'Golden', 'Granite',
    'Harbor', 'Hazel', 'Hollow', 'Indigo', 'Iron', 'Ivory', 'Jade',
    'Kindle', 'Lapis', 'Linden', 'Lunar', 'Maple', 'Marsh', 'Mist',
    'Moss', 'Opal', 'Orchid', 'Pearl', 'Pine', 'Quartz', 'Raven',
    'Reed', 'Ridge', 'Rose', 'Russet', 'Sage', 'Scarlet', 'Shadow',
    'Silver', 'Slate', 'Solar', 'Stone', 'Storm', 'Thorn', 'Timber',
    'Topaz', 'Verdant', 'Violet', 'Willow', 'Wren', 'Zephyr'
];

const PKM_TOWN_SUFFIXES = [
    ' Town', ' City', ' Village', ' Hamlet', ' Landing', ' Crossing',
    ' Falls', ' Springs', ' Hollow', ' Grove', ' Bluff', ' Glen',
    ' Pines', ' Meadow', ' Cove', ' Bay', ' Point', ' Harbor'
];

const PKM_CAVE_PREFIXES = [
    'Iron', 'Crystal', 'Shadow', 'Storm', 'Ember', 'Frost', 'Granite',
    'Obsidian', 'Onyx', 'Gloom', 'Echo', 'Thunder', 'Silent', 'Ashen',
    'Molten', 'Twilight', 'Howling', 'Deep', 'Ancient', 'Hollow'
];

const PKM_CAVE_SUFFIXES = [
    ' Cavern', ' Tunnel', ' Depths', ' Passage', ' Grotto',
    ' Mine', ' Pit', ' Chasm', ' Burrow', ' Lair'
];

const PKM_MT_PREFIXES = [
    'Mt. Cinder', 'Mt. Frost', 'Mt. Iron', 'Mt. Storm', 'Mt. Ember',
    'Mt. Crystal', 'Mt. Shadow', 'Mt. Thunder', 'Mt. Granite', 'Mt. Onyx',
    'Mt. Ashen', 'Mt. Silver', 'Mt. Hollow', 'Mt. Gale', 'Mt. Obsidian'
];

function generatePkmTownName(seed, index) {
    const pi = Math.floor(hash2d(index, 320, seed) * PKM_TOWN_PREFIXES.length);
    const si = Math.floor(hash2d(index, 321, seed) * PKM_TOWN_SUFFIXES.length);
    return PKM_TOWN_PREFIXES[pi] + PKM_TOWN_SUFFIXES[si];
}

function generatePkmCaveName(seed, index) {
    // 50% chance of "Mt. X" vs "X Cavern" style
    if (hash2d(index, 330, seed) < 0.4) {
        const mi = Math.floor(hash2d(index, 331, seed) * PKM_MT_PREFIXES.length);
        return PKM_MT_PREFIXES[mi];
    }
    const pi = Math.floor(hash2d(index, 332, seed) * PKM_CAVE_PREFIXES.length);
    const si = Math.floor(hash2d(index, 333, seed) * PKM_CAVE_SUFFIXES.length);
    return PKM_CAVE_PREFIXES[pi] + PKM_CAVE_SUFFIXES[si];
}

// ==================== Seeded Hash / Noise ====================

// Seed-based hash producing a float in [0,1)
function hash2d(x, y, seed) {
    let h = (seed * 374761393 + x * 668265263 + y * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = Math.imul(h ^ (h >>> 16), 1103515245);
    return ((h ^ (h >>> 15)) & 0x7fffffff) / 0x7fffffff;
}

// Smooth value noise with cosine interpolation
function valueNoise(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // Cosine interpolation for smoother results
    const sx = (1 - Math.cos(fx * Math.PI)) * 0.5;
    const sy = (1 - Math.cos(fy * Math.PI)) * 0.5;

    const n00 = hash2d(ix, iy, seed);
    const n10 = hash2d(ix + 1, iy, seed);
    const n01 = hash2d(ix, iy + 1, seed);
    const n11 = hash2d(ix + 1, iy + 1, seed);

    const nx0 = n00 + (n10 - n00) * sx;
    const nx1 = n01 + (n11 - n01) * sx;
    return nx0 + (nx1 - nx0) * sy;
}

// Fractal Brownian Motion - octave-based noise
function fbm(x, y, seed, octaves, lacunarity, gain) {
    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let maxAmp = 0;

    for (let i = 0; i < octaves; i++) {
        total += valueNoise(x * frequency, y * frequency, seed + i * 1000) * amplitude;
        maxAmp += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
    }

    return total / maxAmp;
}

// Standard elevation noise with 6 octaves
function elevationNoise(x, y, seed, scale) {
    return fbm(x / scale, y / scale, seed, 6, 2.0, 0.5);
}

// Moisture noise - different seed offset and scale
function moistureNoise(x, y, seed, scale) {
    return fbm(x / scale, y / scale, seed + 5000, 5, 2.0, 0.5);
}

// Temperature variation noise
function tempNoise(x, y, seed, scale) {
    return fbm(x / scale, y / scale, seed + 9000, 4, 2.0, 0.5);
}

// ==================== Ridged Noise ====================

// Creates sharp ridges and valleys - great for fjords and peninsulas
function ridgedNoise(x, y, seed, scale, octaves) {
    let amplitude = 1;
    let frequency = 1;
    let total = 0;
    let maxAmp = 0;

    for (let i = 0; i < octaves; i++) {
        let val = valueNoise(x * frequency / scale, y * frequency / scale, seed + i * 1000);
        val = 1.0 - Math.abs(val * 2 - 1); // creates ridges
        val = val * val; // sharpen the ridges
        total += val * amplitude;
        maxAmp += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return total / maxAmp;
}

// ==================== Domain Warping ====================

// Warp sampling coordinates using noise itself for organic coastlines
function warpedElevation(x, y, seed, scale) {
    const warpScale = scale * 0.5;
    const warpStrength = scale * 0.4;
    const warpX = fbm(x / warpScale, y / warpScale, seed + 7000, 3, 2.0, 0.5) * warpStrength;
    const warpY = fbm(x / warpScale, y / warpScale, seed + 8000, 3, 2.0, 0.5) * warpStrength;
    return elevationNoise(x + warpX, y + warpY, seed, scale);
}

// ==================== Distance Utilities ====================

function dist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

// Elliptical distance with rotation
function ellipseDist(x, y, cx, cy, radiusX, radiusY, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const dx = x - cx;
    const dy = y - cy;
    // Rotate point into ellipse-local coordinates
    const rx = (dx * cosA + dy * sinA) / radiusX;
    const ry = (-dx * sinA + dy * cosA) / radiusY;
    return Math.sqrt(rx * rx + ry * ry);
}

function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}

// ==================== Elevation Map Generators ====================

// ---- Shared tectonic plate helpers ----

// For each cell, find nearest and second-nearest plate index + distance.
// Uses domain-warped coordinates for irregular plate boundaries.
function findTwoNearest(px, py, plates) {
    let n1Idx = 0, n2Idx = 1;
    let n1Dist = Infinity, n2Dist = Infinity;
    for (let i = 0; i < plates.length; i++) {
        const dx = px - plates[i].x;
        const dy = py - plates[i].y;
        const d = dx * dx + dy * dy; // squared distance for speed
        if (d < n1Dist) {
            n2Dist = n1Dist; n2Idx = n1Idx;
            n1Dist = d; n1Idx = i;
        } else if (d < n2Dist) {
            n2Dist = d; n2Idx = i;
        }
    }
    return { n1Idx, n2Idx, n1Dist: Math.sqrt(n1Dist), n2Dist: Math.sqrt(n2Dist) };
}

// Compute plate-based elevation for a single cell.
// boundaryWidth controls how wide the mountain ranges are (in pixels).
// interiorNoise adds rolling variation inside continental plates.
function plateCellElevation(x, y, w, h, seed, plates, continentalSet, noiseScale, boundaryWidth, mountainHeight, interiorBase) {
    // Domain-warp the lookup coordinates to create irregular plate boundaries
    const warpStr = noiseScale * 0.6;
    const wx = fbm(x / (noiseScale * 0.7), y / (noiseScale * 0.7), seed + 4400, 3, 2.0, 0.5) * warpStr;
    const wy = fbm(x / (noiseScale * 0.7), y / (noiseScale * 0.7), seed + 4500, 3, 2.0, 0.5) * warpStr;
    const px = x + wx;
    const py = y + wy;

    const { n1Idx, n2Idx, n1Dist, n2Dist } = findTwoNearest(px, py, plates);

    // Boundary proximity: 0 = right on boundary, 1 = deep interior
    const boundaryRatio = (n2Dist - n1Dist) / (n2Dist + n1Dist + 0.001);

    const isContinental = continentalSet.has(n1Idx);
    const neighborContinental = continentalSet.has(n2Idx);

    let elev;

    if (isContinental) {
        // Continental plate interior: rolling lowlands
        const interiorNoise = warpedElevation(x, y, seed + 1100, noiseScale * 1.2) * 0.12;
        const gentleHills = fbm(x / (noiseScale * 0.6), y / (noiseScale * 0.6), seed + 1200, 4, 2.0, 0.45) * 0.08;
        elev = interiorBase + interiorNoise + gentleHills;

        // Mountain ranges where plates meet
        if (boundaryRatio < 0.15) {
            // Normalized proximity to boundary: 1.0 at boundary, 0 at boundaryRatio=0.15
            const t = 1.0 - boundaryRatio / 0.15;
            // Smooth bell curve for mountain cross-section
            const profile = t * t * (3 - 2 * t);

            // Ridged noise along the boundary for jagged peaks
            const ridgeDetail = ridgedNoise(x, y, seed + 2200, noiseScale * 0.35, 5);
            // Vary mountain height along length using low-freq noise
            const lengthVar = fbm(x / (noiseScale * 2.0), y / (noiseScale * 2.0), seed + 2300, 2, 2.0, 0.5);
            const heightMod = 0.6 + lengthVar * 0.4;

            // Continental-continental boundaries make the tallest ranges (like Himalayas)
            const rangeMult = neighborContinental ? 1.0 : 0.75;

            elev += profile * mountainHeight * heightMod * rangeMult * (0.5 + ridgeDetail * 0.5);
        }
    } else {
        // Oceanic plate: deep ocean floor
        const oceanFloor = fbm(x / (noiseScale * 1.5), y / (noiseScale * 1.5), seed + 1300, 3, 2.0, 0.5) * 0.06;
        elev = 0.12 + oceanFloor;

        // Continental shelf where ocean meets continent
        if (neighborContinental && boundaryRatio < 0.12) {
            const t = 1.0 - boundaryRatio / 0.12;
            elev += t * 0.12;
        }

        // Oceanic ridges where two ocean plates meet (mid-ocean ridges)
        if (!neighborContinental && boundaryRatio < 0.06) {
            const t = 1.0 - boundaryRatio / 0.06;
            const ridgeNoise = ridgedNoise(x, y, seed + 2400, noiseScale * 0.5, 3);
            elev += t * 0.08 * ridgeNoise;
        }
    }

    return elev;
}

// Edge falloff: push map edges toward ocean to avoid landmasses cut by borders
function edgeFalloff(x, y, w, h, margin) {
    const ex = Math.min(x, w - 1 - x) / margin;
    const ey = Math.min(y, h - 1 - y) / margin;
    const e = Math.min(ex, ey);
    return clamp(e, 0, 1);
}


function generatePangea(elevMap, w, h, seed) {
    const noiseScale = Math.min(w, h) * 0.3;
    const margin = Math.min(w, h) * 0.12;

    // 7 plates total: 4-5 continental clustered near center, 2-3 oceanic around edges
    const numPlates = 7 + Math.floor(hash2d(0, 100, seed) * 2); // 7-8
    const numContinental = 4 + Math.floor(hash2d(0, 101, seed) * 2); // 4-5

    const plates = [];
    const continentalSet = new Set();

    // Continental plates: clustered near center to form one supercontinent
    for (let i = 0; i < numContinental; i++) {
        const angle = (i / numContinental) * Math.PI * 2 + hash2d(i, 102, seed) * 1.2;
        const radius = Math.min(w, h) * (0.05 + hash2d(i, 103, seed) * 0.15);
        plates.push({
            x: w * 0.5 + Math.cos(angle) * radius,
            y: h * 0.5 + Math.sin(angle) * radius
        });
        continentalSet.add(i);
    }

    // Oceanic plates: spread around edges
    for (let i = numContinental; i < numPlates; i++) {
        const oi = i - numContinental;
        const angle = (oi / (numPlates - numContinental)) * Math.PI * 2 + hash2d(i, 104, seed) * 0.8;
        const radius = Math.min(w, h) * (0.4 + hash2d(i, 105, seed) * 0.15);
        plates.push({
            x: w * 0.5 + Math.cos(angle) * radius,
            y: h * 0.5 + Math.sin(angle) * radius
        });
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let elev = plateCellElevation(x, y, w, h, seed, plates, continentalSet,
                noiseScale, 8, 0.45, 0.48);

            // Coastal detail: fine noise near the land/water boundary
            const coastDetail = ridgedNoise(x, y, seed + 3000, noiseScale * 0.4, 4) * 0.06;
            elev += coastDetail;

            // Peninsulas and bays: domain-warped noise that carves into coastlines
            const peninsulaNoise = warpedElevation(x, y, seed + 3300, noiseScale * 0.7) * 0.1 - 0.05;
            elev += peninsulaNoise;

            // Edge falloff to keep ocean at borders
            const ef = edgeFalloff(x, y, w, h, margin);
            elev = elev * (0.3 + 0.7 * ef) - (1 - ef) * 0.15;

            elevMap[y * w + x] = clamp(elev, 0, 1);
        }
    }
}

function generateContinents(elevMap, w, h, seed) {
    const noiseScale = Math.min(w, h) * 0.28;
    const margin = Math.min(w, h) * 0.08;

    // 10-12 plates total: 3-5 continental spread apart, rest oceanic
    const numPlates = 10 + Math.floor(hash2d(1, 100, seed) * 3); // 10-12
    const numContinental = 3 + Math.floor(hash2d(1, 101, seed) * 3); // 3-5

    const plates = [];
    const continentalSet = new Set();

    // Continental plates: spread across the map using golden-angle distribution
    for (let i = 0; i < numContinental; i++) {
        const angle = i * 2.399963 + hash2d(i, 110, seed) * 1.0;
        const radius = Math.min(w, h) * (0.15 + hash2d(i, 111, seed) * 0.2);
        const px = clamp(w * 0.5 + Math.cos(angle) * radius, w * 0.08, w * 0.92);
        const py = clamp(h * 0.5 + Math.sin(angle) * radius, h * 0.08, h * 0.92);
        plates.push({ x: px, y: py });
        continentalSet.add(i);
    }

    // Oceanic plates: fill remaining space
    for (let i = numContinental; i < numPlates; i++) {
        // Use a different hash sequence to spread oceanic plates
        const px = hash2d(i, 120, seed) * w;
        const py = hash2d(i, 121, seed) * h;

        // Reject if too close to an existing plate (avoids plate overlap)
        let tooClose = false;
        for (let j = 0; j < plates.length; j++) {
            if (dist(px, py, plates[j].x, plates[j].y) < Math.min(w, h) * 0.1) {
                tooClose = true; break;
            }
        }
        if (tooClose) {
            // Shift it with a different hash
            plates.push({
                x: hash2d(i, 122, seed) * w,
                y: hash2d(i, 123, seed) * h
            });
        } else {
            plates.push({ x: px, y: py });
        }
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let elev = plateCellElevation(x, y, w, h, seed, plates, continentalSet,
                noiseScale, 6, 0.40, 0.46);

            // Fine coastal detail
            const coastDetail = ridgedNoise(x, y, seed + 3100, noiseScale * 0.35, 4) * 0.06;
            elev += coastDetail;

            // Peninsulas, bays, and irregular coastline features
            const peninsulaNoise = warpedElevation(x, y, seed + 3400, noiseScale * 0.6) * 0.12 - 0.06;
            elev += peninsulaNoise;

            // Subtle edge falloff
            const ef = edgeFalloff(x, y, w, h, margin);
            elev = elev * (0.5 + 0.5 * ef) - (1 - ef) * 0.08;

            elevMap[y * w + x] = clamp(elev, 0, 1);
        }
    }
}

function generateIslands(elevMap, w, h, seed) {
    const noiseScale = Math.min(w, h) * 0.2;
    const margin = Math.min(w, h) * 0.06;

    // 14-18 plates: 5-8 small continental, rest oceanic
    const numPlates = 14 + Math.floor(hash2d(2, 100, seed) * 5); // 14-18
    const numContinental = 5 + Math.floor(hash2d(2, 101, seed) * 4); // 5-8

    const plates = [];
    const continentalSet = new Set();

    // Continental plates: scattered across the map, smaller regions
    for (let i = 0; i < numContinental; i++) {
        plates.push({
            x: w * (0.08 + hash2d(i, 130, seed) * 0.84),
            y: h * (0.08 + hash2d(i, 131, seed) * 0.84)
        });
        continentalSet.add(i);
    }

    // Oceanic plates: fill remaining space
    for (let i = numContinental; i < numPlates; i++) {
        plates.push({
            x: hash2d(i, 140, seed) * w,
            y: hash2d(i, 141, seed) * h
        });
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let elev = plateCellElevation(x, y, w, h, seed, plates, continentalSet,
                noiseScale, 5, 0.35, 0.42);

            // Volcanic island chains along oceanic plate boundaries
            // Re-check boundary proximity for volcanic features
            const warpStr = noiseScale * 0.6;
            const wx = fbm(x / (noiseScale * 0.7), y / (noiseScale * 0.7), seed + 4400, 3, 2.0, 0.5) * warpStr;
            const wy = fbm(x / (noiseScale * 0.7), y / (noiseScale * 0.7), seed + 4500, 3, 2.0, 0.5) * warpStr;
            const { n1Idx, n2Idx, n1Dist, n2Dist } = findTwoNearest(x + wx, y + wy, plates);
            const bRatio = (n2Dist - n1Dist) / (n2Dist + n1Dist + 0.001);
            const isCont = continentalSet.has(n1Idx);
            const neighborCont = continentalSet.has(n2Idx);

            // Volcanic hotspot islands: speckled along oceanic boundaries
            if (!isCont && !neighborCont && bRatio < 0.08) {
                const t = 1.0 - bRatio / 0.08;
                const volcNoise = ridgedNoise(x, y, seed + 5500, noiseScale * 0.2, 5);
                // Only create islands where ridged noise peaks high
                if (volcNoise > 0.6) {
                    const spike = (volcNoise - 0.6) * 2.5;
                    elev = Math.max(elev, 0.3 + t * spike * 0.55);
                }
            }

            // Fine coastal detail
            const coastDetail = ridgedNoise(x, y, seed + 3200, noiseScale * 0.3, 4) * 0.07;
            elev += coastDetail;

            // Bays and peninsulas
            const peninsulaNoise = warpedElevation(x, y, seed + 3500, noiseScale * 0.5) * 0.1 - 0.05;
            elev += peninsulaNoise;

            // Edge falloff
            const ef = edgeFalloff(x, y, w, h, margin);
            elev = elev * (0.6 + 0.4 * ef) - (1 - ef) * 0.05;

            elevMap[y * w + x] = clamp(elev, 0, 1);
        }
    }
}

// ==================== Shoreline Post-Processing ====================

// Adds fine-grained detail at coastlines for tiny inlets, points, and natural beach placement
function refineShorelines(elevMap, w, h, seed) {
    const shoreScale = Math.min(w, h) * 0.05;
    const threshold = 0.32; // land/water boundary region

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const elev = elevMap[idx];

            // Only process cells near the coastline
            if (elev > 0.22 && elev < 0.42) {
                // Add small-scale detail noise in the shore zone
                const detail = fbm(x / shoreScale, y / shoreScale, seed + 6000, 4, 2.5, 0.45) * 0.08;
                const micro = valueNoise(x / (shoreScale * 0.3), y / (shoreScale * 0.3), seed + 6500) * 0.04;

                // Proximity to threshold - strongest effect right at the coastline
                const proximity = 1.0 - Math.abs(elev - threshold) / 0.1;
                const effect = Math.max(0, proximity);

                elevMap[idx] = clamp(elev + (detail + micro - 0.06) * effect, 0, 1);
            }
        }
    }
}

// ==================== Volcanic Feature Placement ====================

function placeVolcanics(grid, elevMap, w, h, seed, mode) {
    // For island mode: 1-3 volcanic cells on larger islands
    // For all modes: occasional volcanic at very high elevation + low moisture
    const moistScale = Math.min(w, h) * 0.35;

    let volcanoCount;
    if (mode === 'islands') {
        volcanoCount = 1 + Math.floor(hash2d(80, 80, seed) * 3); // 1-3
    } else {
        volcanoCount = Math.floor(hash2d(80, 80, seed) * 2); // 0-1
    }

    // Find high-elevation candidates
    const candidates = [];
    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            const elev = elevMap[y * w + x];
            if (elev > 0.7) {
                const moisture = moistureNoise(x, y, seed, moistScale);
                if (moisture < 0.4) {
                    candidates.push({ x, y, score: elev - moisture });
                }
            }
        }
    }

    if (candidates.length === 0) return;

    // Sort by score descending, pick spread-out locations
    candidates.sort((a, b) => b.score - a.score);
    const placed = [];
    const minVolcDist = Math.min(w, h) * 0.15;

    for (const c of candidates) {
        if (placed.length >= volcanoCount) break;
        let tooClose = false;
        for (const p of placed) {
            if (dist(c.x, c.y, p.x, p.y) < minVolcDist) { tooClose = true; break; }
        }
        if (tooClose) continue;

        grid[c.y * w + c.x] = TERRAIN_TYPES.VOLCANIC.id;
        placed.push(c);
    }
}

// ==================== River Generation ====================

function generateRivers(grid, elevMap, w, h, seed, numRivers) {
    // Find mountain/high-elevation starting points
    const candidates = [];
    for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
            if (elevMap[y * w + x] > 0.72) {
                candidates.push({ x, y, elev: elevMap[y * w + x] });
            }
        }
    }

    if (candidates.length === 0) return;

    // Sort by elevation descending
    candidates.sort((a, b) => b.elev - a.elev);

    // Pick spread-out starting points
    const starts = [];
    const minDist = Math.min(w, h) * 0.12;
    for (const c of candidates) {
        if (starts.length >= numRivers) break;
        let tooClose = false;
        for (const s of starts) {
            if (dist(c.x, c.y, s.x, s.y) < minDist) { tooClose = true; break; }
        }
        if (!tooClose) starts.push(c);
    }

    const WATER_IDS = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id,
        TERRAIN_TYPES.LAKE.id
    ]);

    // Trace each river downhill
    for (const start of starts) {
        let cx = start.x;
        let cy = start.y;
        const visited = new Set();
        const maxSteps = w + h;

        for (let step = 0; step < maxSteps; step++) {
            const key = cy * w + cx;
            if (visited.has(key)) break;
            visited.add(key);

            const terrainId = grid[key];
            // Stop if we hit ocean/water
            if (WATER_IDS.has(terrainId)) break;

            // Place river
            grid[key] = TERRAIN_TYPES.RIVER.id;

            // Find lowest neighbor
            let bestX = cx, bestY = cy;
            let bestElev = elevMap[key];
            const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
            for (const [dx, dy] of dirs) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const nElev = elevMap[ny * w + nx];
                if (nElev < bestElev) {
                    bestElev = nElev;
                    bestX = nx;
                    bestY = ny;
                }
            }

            // If no downhill neighbor found, try adding some noise to break out of flat areas
            if (bestX === cx && bestY === cy) {
                const ri = Math.floor(hash2d(cx, cy, seed + step) * 8);
                const [dx, dy] = dirs[ri];
                const nx = clamp(cx + dx, 0, w - 1);
                const ny = clamp(cy + dy, 0, h - 1);
                bestX = nx;
                bestY = ny;
            }

            cx = bestX;
            cy = bestY;
        }
    }
}

// ==================== Lake Placement ====================

function placeLakes(grid, elevMap, w, h, seed) {
    const numLakes = 3 + Math.floor(hash2d(20, 20, seed) * 5);
    for (let i = 0; i < numLakes; i++) {
        // Find low-elevation inland areas
        const lx = Math.floor(hash2d(i, 30, seed) * (w - 20)) + 10;
        const ly = Math.floor(hash2d(i, 31, seed) * (h - 20)) + 10;
        const elev = elevMap[ly * w + lx];

        // Only place in low-to-mid land areas
        if (elev < 0.35 || elev > 0.55) continue;

        // Check it's actually land
        const tid = grid[ly * w + lx];
        if (tid === TERRAIN_TYPES.DEEP_OCEAN.id || tid === TERRAIN_TYPES.SHALLOW_WATER.id) continue;

        const lakeSize = 2 + Math.floor(hash2d(i, 32, seed) * 4);
        for (let dy = -lakeSize; dy <= lakeSize; dy++) {
            for (let dx = -lakeSize; dx <= lakeSize; dx++) {
                const nx = lx + dx;
                const ny = ly + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d <= lakeSize * 0.8 + hash2d(nx, ny, seed + 40) * lakeSize * 0.4) {
                    const nTid = grid[ny * w + nx];
                    if (nTid !== TERRAIN_TYPES.DEEP_OCEAN.id && nTid !== TERRAIN_TYPES.SHALLOW_WATER.id) {
                        grid[ny * w + nx] = TERRAIN_TYPES.LAKE.id;
                    }
                }
            }
        }
    }
}

// ==================== Settlement Placement ====================

// Score a candidate cell for settlement desirability.
// Higher score = better location for a city/town.
function scoreCellForSettlement(grid, elevMap, w, h, x, y, searchRadius) {
    let score = 1.0; // baseline

    const WATER_IDS = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id,
        TERRAIN_TYPES.LAKE.id,
        TERRAIN_TYPES.CORAL_REEF.id
    ]);

    let nearRiver = 0;
    let nearOcean = 0;
    let nearLake = 0;
    let nearMountain = 0;
    let mountainDirs = 0; // count distinct directions with mountains (for pass detection)
    let landCount = 0;
    let totalCount = 0;
    let riverCount = 0;

    // Track mountains in quadrants for pass detection
    let mtNorth = false, mtSouth = false, mtEast = false, mtWest = false;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > searchRadius) continue;

            totalCount++;
            const tid = grid[ny * w + nx];

            if (tid === TERRAIN_TYPES.RIVER.id) {
                riverCount++;
                if (d <= 3) nearRiver += (4 - d); // closer = more bonus
            }
            if (tid === TERRAIN_TYPES.DEEP_OCEAN.id || tid === TERRAIN_TYPES.SHALLOW_WATER.id) {
                if (d <= 4) nearOcean += (5 - d);
            }
            if (tid === TERRAIN_TYPES.LAKE.id) {
                if (d <= 3) nearLake += (4 - d);
            }
            if (tid === TERRAIN_TYPES.MOUNTAINS.id) {
                nearMountain++;
                if (dy < -1) mtNorth = true;
                if (dy > 1) mtSouth = true;
                if (dx < -1) mtWest = true;
                if (dx > 1) mtEast = true;
            }
            if (!WATER_IDS.has(tid) && tid !== TERRAIN_TYPES.DEEP_OCEAN.id) {
                landCount++;
            }
        }
    }

    // --- River bonus: cities love rivers ---
    if (nearRiver > 0) score += nearRiver * 3.0;

    // --- River confluence bonus: multiple river cells nearby = river junction ---
    if (riverCount >= 4) score += riverCount * 1.5;

    // --- Delta bonus: river AND ocean nearby = river delta ---
    if (nearRiver > 0 && nearOcean > 0) score += 8.0;

    // --- Coastal bonus: near ocean but not in it ---
    if (nearOcean > 0) score += nearOcean * 0.6;

    // --- Lake bonus ---
    if (nearLake > 0) score += nearLake * 1.2;

    // --- Mountain pass bonus: mountains on two opposite sides = valley/pass ---
    if ((mtNorth && mtSouth) || (mtEast && mtWest)) {
        score += 6.0;
    }
    // Mountains on one side (sheltered) is still good
    mountainDirs = (mtNorth ? 1 : 0) + (mtSouth ? 1 : 0) + (mtEast ? 1 : 0) + (mtWest ? 1 : 0);
    if (mountainDirs === 1 || mountainDirs === 2) {
        score += 2.0;
    }

    // --- Island bonus: small amount of land surrounded by water = island settlement ---
    if (totalCount > 0) {
        const waterRatio = 1 - (landCount / totalCount);
        if (waterRatio > 0.5 && waterRatio < 0.85 && landCount > 8) {
            score += 5.0; // island
        }
    }

    // --- Flat terrain preference (not too high, not too low) ---
    const elev = elevMap[y * w + x];
    if (elev >= 0.36 && elev <= 0.50) score += 1.5; // ideal flat land
    if (elev > 0.60) score -= 2.0; // too high

    return score;
}

function placeSettlements(grid, elevMap, w, h, seed) {
    const WATER_IDS = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id,
        TERRAIN_TYPES.RIVER.id,
        TERRAIN_TYPES.LAKE.id,
        TERRAIN_TYPES.CORAL_REEF.id
    ]);

    const searchRadius = Math.max(4, Math.min(8, Math.floor(Math.min(w, h) * 0.04)));

    // Build scored candidate pool for all valid land cells
    const candidates = [];
    for (let y = 3; y < h - 3; y++) {
        for (let x = 3; x < w - 3; x++) {
            const tid = grid[y * w + x];
            if (WATER_IDS.has(tid)) continue;
            if (tid === TERRAIN_TYPES.MOUNTAINS.id || tid === TERRAIN_TYPES.ICE.id ||
                tid === TERRAIN_TYPES.VOLCANIC.id) continue;
            const elev = elevMap[y * w + x];
            if (elev < 0.33 || elev > 0.65) continue;

            const score = scoreCellForSettlement(grid, elevMap, w, h, x, y, searchRadius);
            candidates.push({ x, y, score });
        }
    }

    // Sort by score descending - best locations first
    candidates.sort((a, b) => b.score - a.score);

    const numCities = 2 + Math.floor(hash2d(50, 50, seed) * 3);
    const numTowns = 4 + Math.floor(hash2d(51, 51, seed) * 5);
    const placed = [];
    const minSettleDist = Math.min(w, h) * 0.08;

    // Place cities: pick from top-scored candidates with spacing
    let citiesPlaced = 0;
    for (const cell of candidates) {
        if (citiesPlaced >= numCities) break;

        let tooClose = false;
        for (const p of placed) {
            if (dist(cell.x, cell.y, p.x, p.y) < minSettleDist) { tooClose = true; break; }
        }
        if (tooClose) continue;

        grid[cell.y * w + cell.x] = TERRAIN_TYPES.CITY.id;
        placed.push({ x: cell.x, y: cell.y, type: 'city' });
        citiesPlaced++;
    }

    // Place towns: use next-best candidates, slightly less strict spacing
    const townMinDist = minSettleDist * 0.7;
    let townsPlaced = 0;
    for (const cell of candidates) {
        if (townsPlaced >= numTowns) break;

        let tooClose = false;
        for (const p of placed) {
            if (dist(cell.x, cell.y, p.x, p.y) < townMinDist) { tooClose = true; break; }
        }
        if (tooClose) continue;

        grid[cell.y * w + cell.x] = TERRAIN_TYPES.TOWN.id;
        placed.push({ x: cell.x, y: cell.y, type: 'town' });
        townsPlaced++;
    }

    // Place 1-3 ruins in remote areas
    const REMOTE_IDS = new Set([
        TERRAIN_TYPES.JUNGLE.id,
        TERRAIN_TYPES.DESERT.id,
        TERRAIN_TYPES.FOREST.id
    ]);
    const numRuins = 1 + Math.floor(hash2d(52, 52, seed) * 3);
    let ruinsPlaced = 0;
    for (let attempt = 0; attempt < 300 && ruinsPlaced < numRuins; attempt++) {
        const rx = Math.floor(hash2d(attempt, 70, seed) * w);
        const ry = Math.floor(hash2d(attempt, 71, seed) * h);
        if (rx < 0 || rx >= w || ry < 0 || ry >= h) continue;
        if (REMOTE_IDS.has(grid[ry * w + rx])) {
            let tooClose = false;
            for (const p of placed) {
                if (dist(rx, ry, p.x, p.y) < minSettleDist * 0.5) { tooClose = true; break; }
            }
            if (tooClose) continue;
            grid[ry * w + rx] = TERRAIN_TYPES.RUINS.id;
            placed.push({ x: rx, y: ry, type: 'ruins' });
            ruinsPlaced++;
        }
    }

    return placed; // Return all settlements for labeling and road generation
}

// ==================== Road Generation ====================

function generateRoads(grid, elevMap, w, h, seed, settlements) {
    if (settlements.length < 2) return;

    const WATER_BLOCK = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id,
        TERRAIN_TYPES.LAKE.id,
        TERRAIN_TYPES.CORAL_REEF.id
    ]);

    // Connect settlements using a minimum spanning tree approach:
    // 1. Calculate distances between all settlement pairs
    // 2. Build MST edges (guaranteed connectivity with minimum total distance)
    // 3. Add a few extra short connections for redundancy
    // 4. For each edge, pathfind a road using weighted A*

    // Build adjacency: for each settlement, find the N nearest
    const edges = [];
    for (let i = 0; i < settlements.length; i++) {
        for (let j = i + 1; j < settlements.length; j++) {
            const d = dist(settlements[i].x, settlements[i].y, settlements[j].x, settlements[j].y);
            // Only consider connections within reasonable distance
            if (d < Math.min(w, h) * 0.5) {
                edges.push({ i, j, dist: d });
            }
        }
    }
    edges.sort((a, b) => a.dist - b.dist);

    // Kruskal's MST
    const parent = settlements.map((_, i) => i);
    function find(x) {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }
    function union(a, b) { parent[find(a)] = find(b); }

    const roadEdges = [];
    for (const e of edges) {
        if (find(e.i) !== find(e.j)) {
            union(e.i, e.j);
            roadEdges.push(e);
        }
    }

    // Add 1-3 extra short connections for a more realistic network
    const extraRoads = 1 + Math.floor(hash2d(90, 90, seed) * 3);
    let added = 0;
    for (const e of edges) {
        if (added >= extraRoads) break;
        // Check if this edge is not already in MST
        const already = roadEdges.some(re => (re.i === e.i && re.j === e.j));
        if (!already && e.dist < Math.min(w, h) * 0.25) {
            roadEdges.push(e);
            added++;
        }
    }

    // Pathfind each road using a simple A* on the grid
    for (const edge of roadEdges) {
        const start = settlements[edge.i];
        const end = settlements[edge.j];
        const path = findRoadPath(grid, elevMap, w, h, start.x, start.y, end.x, end.y, WATER_BLOCK);
        if (path) {
            // Place road terrain along the path (skip the settlement endpoints)
            for (let k = 1; k < path.length - 1; k++) {
                const { x, y } = path[k];
                const tid = grid[y * w + x];
                // Don't overwrite settlements, rivers, or water
                if (tid === TERRAIN_TYPES.CITY.id || tid === TERRAIN_TYPES.TOWN.id ||
                    tid === TERRAIN_TYPES.RUINS.id || tid === TERRAIN_TYPES.RIVER.id ||
                    WATER_BLOCK.has(tid)) continue;
                grid[y * w + x] = TERRAIN_TYPES.ROAD.id;
            }
        }
    }
}

// Simple A* pathfinding for roads - prefers flat terrain, avoids water and mountains
function findRoadPath(grid, elevMap, w, h, sx, sy, ex, ey, waterBlock) {
    const maxSteps = w * h; // safety limit
    const key = (x, y) => y * w + x;
    const heuristic = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);

    const gScore = new Float32Array(w * h).fill(Infinity);
    const fScore = new Float32Array(w * h).fill(Infinity);
    const cameFrom = new Int32Array(w * h).fill(-1);

    const startKey = key(sx, sy);
    gScore[startKey] = 0;
    fScore[startKey] = heuristic(sx, sy);

    // Simple priority queue using sorted array (good enough for small maps)
    let open = [{ x: sx, y: sy, f: fScore[startKey] }];
    const closed = new Uint8Array(w * h);
    let steps = 0;

    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];

    while (open.length > 0 && steps < maxSteps) {
        steps++;
        // Pop lowest f-score
        const current = open.shift();
        const cx = current.x, cy = current.y;
        const ck = key(cx, cy);

        if (cx === ex && cy === ey) {
            // Reconstruct path
            const path = [];
            let k = ck;
            while (k !== -1) {
                const py = Math.floor(k / w);
                const px = k % w;
                path.unshift({ x: px, y: py });
                k = cameFrom[k];
            }
            return path;
        }

        if (closed[ck]) continue;
        closed[ck] = 1;

        for (const [dx, dy] of dirs) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nk = key(nx, ny);
            if (closed[nk]) continue;

            const tid = grid[nk];
            // Block deep water
            if (waterBlock.has(tid)) continue;

            // Movement cost based on terrain
            const diagonal = (dx !== 0 && dy !== 0) ? 1.414 : 1.0;
            let cost = diagonal;
            if (tid === TERRAIN_TYPES.MOUNTAINS.id) cost *= 4;
            else if (tid === TERRAIN_TYPES.HILLS.id) cost *= 2;
            else if (tid === TERRAIN_TYPES.SWAMP.id) cost *= 3;
            else if (tid === TERRAIN_TYPES.FOREST.id || tid === TERRAIN_TYPES.JUNGLE.id) cost *= 1.5;
            else if (tid === TERRAIN_TYPES.ROAD.id) cost *= 0.5; // prefer existing roads
            else if (tid === TERRAIN_TYPES.RIVER.id) cost *= 2; // rivers: crossable but costly
            else if (tid === TERRAIN_TYPES.PLAINS.id || tid === TERRAIN_TYPES.SAVANNA.id || tid === TERRAIN_TYPES.BEACH.id) cost *= 0.8;

            const tentG = gScore[ck] + cost;
            if (tentG < gScore[nk]) {
                cameFrom[nk] = ck;
                gScore[nk] = tentG;
                fScore[nk] = tentG + heuristic(nx, ny);
                // Insert maintaining sort order
                const entry = { x: nx, y: ny, f: fScore[nk] };
                let ins = open.length;
                for (let i = 0; i < open.length; i++) {
                    if (open[i].f > entry.f) { ins = i; break; }
                }
                open.splice(ins, 0, entry);
            }
        }
    }

    return null; // No path found
}

// ==================== Settlement Label Generation ====================

function generateSettlementLabels(settlements, seed, labelManager) {
    if (!labelManager) return;

    // Generate unique names using a set to avoid duplicates
    const usedNames = new Set();

    for (let i = 0; i < settlements.length; i++) {
        const s = settlements[i];
        let name;
        let attempts = 0;

        // Generate a unique name
        do {
            name = generateSettlementName(seed + i * 13 + attempts * 7, s.type);
            attempts++;
        } while (usedNames.has(name) && attempts < 20);

        usedNames.add(name);

        // Determine label type and marker
        let labelType, marker;
        if (s.type === 'city') {
            labelType = 'city';
            marker = 'star';
        } else if (s.type === 'town') {
            labelType = 'city';
            marker = 'town_dot';
        } else {
            labelType = 'mountain'; // use muted style for ruins
            marker = 'skull';
        }

        const labelId = labelManager.addLabel(s.x, s.y, name, labelType, marker);

        // Adjust font size: cities bigger than towns, ruins smaller
        if (s.type === 'city') {
            labelManager.updateLabel(labelId, { fontSize: 16 });
        } else if (s.type === 'town') {
            labelManager.updateLabel(labelId, { fontSize: 11 });
        } else {
            labelManager.updateLabel(labelId, { fontSize: 9, color: '#8a8a6a' });
        }
    }
}

// ==================== Main Terrain Assignment ====================

function assignTerrain(grid, elevMap, w, h, seed) {
    const moistScale = Math.min(w, h) * 0.35;
    const tempScale = Math.min(w, h) * 0.4;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const elev = elevMap[idx];

            // Latitude: 0 at poles (top/bottom), 1 at equator (middle)
            const latNorm = 1.0 - Math.abs(y / h - 0.5) * 2; // 0=pole, 1=equator

            const moisture = moistureNoise(x, y, seed, moistScale);
            const tempVariation = tempNoise(x, y, seed, tempScale) * 0.2;
            const temperature = latNorm * 0.8 + 0.1 + tempVariation; // warmer at equator

            let terrainId;

            if (elev < 0.22) {
                // Deep ocean
                terrainId = TERRAIN_TYPES.DEEP_OCEAN.id;
            } else if (elev < 0.32) {
                // Shallow water
                terrainId = TERRAIN_TYPES.SHALLOW_WATER.id;
            } else if (elev < 0.36) {
                // Beach/shore - use slope awareness for more natural placement
                // Check local gradient: steeper slopes get cliff-like terrain instead of beach
                let maxSlope = 0;
                const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
                for (const [dx, dy] of dirs) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const slope = Math.abs(elev - elevMap[ny * w + nx]);
                        if (slope > maxSlope) maxSlope = slope;
                    }
                }
                if (maxSlope > 0.06) {
                    terrainId = TERRAIN_TYPES.CLIFF.id;
                } else {
                    terrainId = TERRAIN_TYPES.BEACH.id;
                }
            } else if (elev < 0.55) {
                // Low land - depends on climate
                if (temperature < 0.25) {
                    // Cold
                    terrainId = moisture > 0.5 ? TERRAIN_TYPES.TAIGA.id : TERRAIN_TYPES.SNOW.id;
                } else if (temperature < 0.4) {
                    // Cool
                    terrainId = moisture > 0.55 ? TERRAIN_TYPES.FOREST.id : TERRAIN_TYPES.PLAINS.id;
                } else if (temperature > 0.7) {
                    // Hot
                    if (moisture < 0.3) {
                        terrainId = TERRAIN_TYPES.DESERT.id;
                    } else if (moisture < 0.5) {
                        terrainId = TERRAIN_TYPES.SAVANNA.id;
                    } else {
                        terrainId = TERRAIN_TYPES.JUNGLE.id;
                    }
                } else {
                    // Temperate
                    if (moisture > 0.6) {
                        terrainId = TERRAIN_TYPES.FOREST.id;
                    } else if (moisture > 0.4) {
                        terrainId = TERRAIN_TYPES.PLAINS.id;
                    } else {
                        terrainId = TERRAIN_TYPES.PLAINS.id;
                    }
                }

                // Swamp: high moisture + very low land elevation
                if (elev < 0.42 && moisture > 0.65 && temperature > 0.35) {
                    terrainId = TERRAIN_TYPES.SWAMP.id;
                }
            } else if (elev < 0.65) {
                // Mid land - hills region
                if (temperature < 0.25) {
                    terrainId = TERRAIN_TYPES.TAIGA.id;
                } else {
                    terrainId = TERRAIN_TYPES.HILLS.id;
                }
            } else if (elev < 0.78) {
                // High land - mountains
                terrainId = TERRAIN_TYPES.MOUNTAINS.id;
            } else {
                // Very high - snow peaks
                if (temperature < 0.3) {
                    terrainId = TERRAIN_TYPES.ICE.id;
                } else {
                    terrainId = TERRAIN_TYPES.SNOW.id;
                }
            }

            grid[idx] = terrainId;
        }
    }
}

// ==================== Pokemon Region Generator ====================

function generatePokemonRegion(grid, elevMap, w, h, seed, nationManager, labelManager) {
    // Step 1: Generate base elevation using a MIX of all terrain modes
    // Blend pangea (central landmass), continents (varied terrain), and islands (archipelagos)
    // Use islands mode as the primary generator — it naturally creates separated landmasses
    generateIslands(elevMap, w, h, seed);

    refineShorelines(elevMap, w, h, seed);

    // Step 2: Assign base terrain (water, land, mountains, etc.)
    assignTerrain(grid, elevMap, w, h, seed);

    // Step 2b: Fix mountain generation — add proper mountain ranges
    // Use ridged noise to create coherent mountain chains instead of scattered peaks
    const mtScale = Math.min(w, h) * 0.25;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const elev = elevMap[idx];
            if (elev < 0.55 || elev > 0.85) continue; // only mid-high elevations

            // Ridged noise creates linear mountain chains
            const ridge = ridgedNoise(x, y, seed + 7700, mtScale, 4);
            const ridgeStrength = ridge * ridge; // sharpen

            if (ridgeStrength > 0.5 && elev > 0.58) {
                // Make a mountain range along the ridge
                if (ridgeStrength > 0.7) {
                    grid[idx] = TERRAIN_TYPES.MOUNTAINS.id;
                    elevMap[idx] = clamp(elev + 0.1, 0, 1);
                } else if (ridgeStrength > 0.55) {
                    grid[idx] = TERRAIN_TYPES.HILLS.id;
                }
            }
        }
    }

    // Step 3: Determine number of towns (6-10 based on map size)
    const mapScale = Math.min(w, h);
    const numTowns = Math.min(8, Math.max(3, Math.floor(mapScale / 80) + 3));

    // Find all land cells for town placement
    const WATER_IDS = new Set([
        TERRAIN_TYPES.DEEP_OCEAN.id,
        TERRAIN_TYPES.SHALLOW_WATER.id,
        TERRAIN_TYPES.LAKE.id,
        TERRAIN_TYPES.CORAL_REEF.id
    ]);

    const landCells = [];
    const margin = Math.max(10, Math.floor(mapScale * 0.04));
    for (let y = margin; y < h - margin; y++) {
        for (let x = margin; x < w - margin; x++) {
            const tid = grid[y * w + x];
            if (!WATER_IDS.has(tid) && tid !== TERRAIN_TYPES.MOUNTAINS.id &&
                tid !== TERRAIN_TYPES.SNOW.id && tid !== TERRAIN_TYPES.ICE.id) {
                landCells.push({ x, y });
            }
        }
    }

    if (landCells.length < numTowns * 10) return; // Not enough land

    // Step 4: Place towns spread across the map
    const towns = [];
    const minTownDist = mapScale * 0.25;

    // Start town: bottom-left quadrant
    const startCandidates = landCells.filter(c => c.x < w * 0.4 && c.y > h * 0.6);
    if (startCandidates.length > 0) {
        const si = Math.floor(hash2d(0, 300, seed) * startCandidates.length);
        towns.push({ ...startCandidates[si], isStart: true, hasGym: false, name: '' });
    }

    // Pokemon League: top or far-right area
    const leagueCandidates = landCells.filter(c => c.y < h * 0.25 || c.x > w * 0.8);
    if (leagueCandidates.length > 0) {
        let bestLeague = null;
        let bestDist = 0;
        for (let i = 0; i < Math.min(leagueCandidates.length, 50); i++) {
            const ci = Math.floor(hash2d(i, 301, seed) * leagueCandidates.length);
            const c = leagueCandidates[ci];
            if (towns.length > 0) {
                const d = dist(c.x, c.y, towns[0].x, towns[0].y);
                if (d > bestDist && d > minTownDist) {
                    bestDist = d;
                    bestLeague = c;
                }
            }
        }
        if (bestLeague) {
            towns.push({ ...bestLeague, isLeague: true, hasGym: false, name: '' });
        }
    }

    // Remaining towns: spread across the map between start and league
    for (let attempt = 0; attempt < 500 && towns.length < numTowns; attempt++) {
        const ci = Math.floor(hash2d(attempt, 310, seed) * landCells.length);
        const c = landCells[ci];

        let tooClose = false;
        for (const t of towns) {
            if (dist(c.x, c.y, t.x, t.y) < minTownDist) { tooClose = true; break; }
        }
        if (tooClose) continue;

        // Determine if this town has a gym (roughly 8 gyms total)
        const gymCount = towns.filter(t => t.hasGym).length;
        const hasGym = gymCount < 8 && hash2d(attempt, 311, seed) > 0.3;

        towns.push({ x: c.x, y: c.y, hasGym, name: '' });
    }

    // Assign procedurally generated names to towns
    const usedNames = new Set();
    for (let i = 0; i < towns.length; i++) {
        if (towns[i].isLeague) {
            towns[i].name = 'Champion League';
        } else {
            let name;
            let attempts = 0;
            do {
                name = generatePkmTownName(seed + attempts * 7, i + attempts);
                attempts++;
            } while (usedNames.has(name) && attempts < 50);
            usedNames.add(name);
            towns[i].name = name;
        }
    }

    // Step 5: Sort towns into a roughly linear sequence for route connections
    // Start from the start town, greedily connect to nearest unvisited town, end at league
    const orderedTowns = [];
    const visited = new Set();

    // Start town first
    const startIdx = towns.findIndex(t => t.isStart);
    if (startIdx >= 0) {
        orderedTowns.push(towns[startIdx]);
        visited.add(startIdx);
    } else {
        orderedTowns.push(towns[0]);
        visited.add(0);
    }

    // League town last - reserve it
    const leagueIdx = towns.findIndex(t => t.isLeague);

    while (orderedTowns.length < towns.length - (leagueIdx >= 0 ? 1 : 0)) {
        const last = orderedTowns[orderedTowns.length - 1];
        let bestIdx = -1;
        let bestDist = Infinity;

        for (let i = 0; i < towns.length; i++) {
            if (visited.has(i) || i === leagueIdx) continue;
            const d = dist(last.x, last.y, towns[i].x, towns[i].y);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }

        if (bestIdx < 0) break;
        orderedTowns.push(towns[bestIdx]);
        visited.add(bestIdx);
    }

    // Add league town at the end
    if (leagueIdx >= 0) {
        orderedTowns.push(towns[leagueIdx]);
    }

    // Step 6: Build each town ON TOP of natural terrain
    // Buildings are 5x5 blocks, towns have walkable paths between them
    // Helper: fill a 5x5 block with a terrain type, respecting water
    function placeBuilding(cx, cy, terrainId) {
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                if (WATER_IDS.has(grid[ny * w + nx])) continue;
                grid[ny * w + nx] = terrainId;
            }
        }
    }

    for (const town of orderedTowns) {
        const tx = town.x;
        const ty = town.y;

        // Town footprint: clear a large area for paths (radius ~12-16 cells)
        const townRadius = town.isLeague ? 16 : (town.hasGym ? 14 : 10 + Math.floor(hash2d(tx, ty, seed + 400) * 4));
        for (let dy = -townRadius; dy <= townRadius; dy++) {
            for (let dx = -townRadius; dx <= townRadius; dx++) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > townRadius) continue;
                const nx = tx + dx, ny = ty + dy;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                if (WATER_IDS.has(grid[ny * w + nx])) continue;
                // Only place paths on the main roads (cross pattern + ring)
                const isMainRoad = Math.abs(dx) <= 1 || Math.abs(dy) <= 1;
                const isRing = Math.abs(d - townRadius * 0.6) < 1.5;
                if (isMainRoad || isRing) {
                    grid[ny * w + nx] = TERRAIN_TYPES.ROUTE_PATH.id;
                }
            }
        }

        // Place Pokemon Center (5x5) - always present, upper-right of center
        placeBuilding(tx + 6, ty - 5, TERRAIN_TYPES.POKEMON_CENTER.id);

        // Place Gym (5x5) if applicable - upper-left of center
        if (town.hasGym) {
            placeBuilding(tx - 6, ty - 5, TERRAIN_TYPES.GYM.id);
        }

        // Place Poke Mart (5x5) - lower-right
        if (!town.isLeague && hash2d(tx, ty, seed + 401) > 0.15) {
            placeBuilding(tx + 6, ty + 5, TERRAIN_TYPES.POKE_MART.id);
        }

        // Place generic houses (5x5 each) scattered in the town
        const numHouses = town.isLeague ? 6 : (town.hasGym ? 4 : 2 + Math.floor(hash2d(tx, ty, seed + 402) * 3));
        // Building slot positions (center of each 5x5 building, spaced 7+ apart)
        const buildingSlots = [
            [-6, 5], [0, -7], [0, 7], [-7, 0], [7, 0],
            [-6, -5], [6, -5], [-6, 5], [6, 5],
            [-8, -8], [8, -8], [-8, 8], [8, 8],
            [0, -10], [0, 10], [-10, 0], [10, 0]
        ];

        let housesPlaced = 0;
        for (let hi = 0; hi < buildingSlots.length && housesPlaced < numHouses; hi++) {
            const si = Math.floor(hash2d(hi, ty + 410, seed + tx) * buildingSlots.length);
            const [bdx, bdy] = buildingSlots[si];
            const bx = tx + bdx, by = ty + bdy;
            if (bx < 3 || bx >= w - 3 || by < 3 || by >= h - 3) continue;

            // Check center isn't water or already a special building
            const ctid = grid[by * w + bx];
            if (WATER_IDS.has(ctid)) continue;
            if (ctid === TERRAIN_TYPES.POKEMON_CENTER.id ||
                ctid === TERRAIN_TYPES.GYM.id ||
                ctid === TERRAIN_TYPES.POKE_MART.id) continue;

            placeBuilding(bx, by, TERRAIN_TYPES.TOWN.id);
            housesPlaced++;
        }

        // League gets an extra large elite building
        if (town.isLeague) {
            placeBuilding(tx, ty - 8, TERRAIN_TYPES.GYM.id);
            placeBuilding(tx - 6, ty + 5, TERRAIN_TYPES.FORTRESS.id);
        }
    }

    // Step 7: Connect towns with wider, detailed routes + branching paths
    const routeLabels = [];
    const BUILDING_IDS = new Set([
        TERRAIN_TYPES.POKEMON_CENTER.id, TERRAIN_TYPES.GYM.id,
        TERRAIN_TYPES.POKE_MART.id, TERRAIN_TYPES.TOWN.id,
        TERRAIN_TYPES.FORTRESS.id
    ]);

    // Allow water crossing for island connections (empty block set = nothing blocked)
    const NO_BLOCK = new Set();

    for (let i = 0; i < orderedTowns.length - 1; i++) {
        const fromTown = orderedTowns[i];
        const toTown = orderedTowns[i + 1];

        // Try land-only path first, fall back to water-crossing path
        let path = findRoadPath(grid, elevMap, w, h, fromTown.x, fromTown.y, toTown.x, toTown.y, WATER_IDS);
        let crossesWater = false;
        if (!path) {
            path = findRoadPath(grid, elevMap, w, h, fromTown.x, fromTown.y, toTown.x, toTown.y, NO_BLOCK);
            crossesWater = true;
        }
        if (!path) continue;

        // Check if any path cells are water even on land-first paths
        if (!crossesWater) {
            for (const p of path) {
                const tid = grid[p.y * w + p.x];
                if (WATER_IDS.has(tid) || tid === TERRAIN_TYPES.RIVER.id) { crossesWater = true; break; }
            }
        }

        const routeName = `Route ${i + 1}`;
        const midIdx = Math.floor(path.length / 2);
        if (midIdx < path.length) {
            routeLabels.push({ x: path[midIdx].x, y: path[midIdx].y, name: routeName, crossesWater });
        }

        // Wide route: 3-4 cells radius
        const routeWidth = 3 + Math.floor(hash2d(i, 340, seed) * 2);

        // Track water/land transitions for port placement
        let prevWasWater = false;
        const portLocations = [];

        for (let k = 0; k < path.length; k++) {
            const px = path[k].x;
            const py = path[k].y;
            const centerTid = grid[py * w + px];
            const isWater = WATER_IDS.has(centerTid);

            // Detect shore transitions for port markers
            if (isWater !== prevWasWater && k > 0) {
                // Place port at the land side of the transition
                const portCell = isWater ? path[k - 1] : path[k];
                portLocations.push({ x: portCell.x, y: portCell.y });
            }
            prevWasWater = isWater;

            for (let dy = -routeWidth; dy <= routeWidth; dy++) {
                for (let dx = -routeWidth; dx <= routeWidth; dx++) {
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d > routeWidth) continue;
                    const nx = px + dx, ny = py + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const tid = grid[ny * w + nx];
                    if (BUILDING_IDS.has(tid)) continue;

                    if (WATER_IDS.has(tid)) {
                        // Water cells on the route: mark as CORAL_REEF for visible water path
                        if (d <= 1) {
                            grid[ny * w + nx] = TERRAIN_TYPES.CORAL_REEF.id;
                        }
                    } else {
                        grid[ny * w + nx] = TERRAIN_TYPES.ROUTE_PATH.id;
                    }
                }
            }

            // Branching side paths every ~30 cells
            if (k % 30 === 15 && hash2d(k, i + 350, seed) < 0.6) {
                const branchDir = hash2d(k, i + 351, seed) < 0.5 ? -1 : 1;
                const branchLen = 8 + Math.floor(hash2d(k, i + 352, seed) * 12);
                // Determine branch axis based on path direction
                const isVertical = (k + 1 < path.length) ?
                    Math.abs(path[Math.min(k + 1, path.length - 1)].y - py) > Math.abs(path[Math.min(k + 1, path.length - 1)].x - px) : true;

                for (let b = 0; b < branchLen; b++) {
                    const bx = isVertical ? px + branchDir * b : px + b * (hash2d(b, k + 360, seed) < 0.5 ? 1 : -1);
                    const by = isVertical ? py + b * (hash2d(b, k + 361, seed) < 0.5 ? 1 : -1) : py + branchDir * b;
                    if (bx < 0 || bx >= w || by < 0 || by >= h) break;
                    const btid = grid[by * w + bx];
                    if (WATER_IDS.has(btid) || BUILDING_IDS.has(btid)) break;
                    // Narrower branch path (2 cells wide)
                    for (let bdy = -1; bdy <= 1; bdy++) {
                        for (let bdx = -1; bdx <= 1; bdx++) {
                            const bnx = bx + bdx, bny = by + bdy;
                            if (bnx < 0 || bnx >= w || bny < 0 || bny >= h) continue;
                            if (WATER_IDS.has(grid[bny * w + bnx]) || BUILDING_IDS.has(grid[bny * w + bnx])) continue;
                            grid[bny * w + bnx] = TERRAIN_TYPES.ROUTE_PATH.id;
                        }
                    }
                }
            }
        }

        // Tall grass clusters along route sides
        for (let k = 0; k < path.length; k += 2) {
            if (hash2d(k, i + 500, seed) > 0.45) continue;
            const px = path[k].x, py = path[k].y;

            for (let gd = -8; gd <= 8; gd++) {
                for (let ge = -8; ge <= 8; ge++) {
                    const gDist = Math.sqrt(gd * gd + ge * ge);
                    if (gDist < routeWidth + 1 || gDist > routeWidth + 5) continue;
                    const gx = px + gd, gy = py + ge;
                    if (gx < 0 || gx >= w || gy < 0 || gy >= h) continue;
                    const tid = grid[gy * w + gx];
                    if (WATER_IDS.has(tid) || BUILDING_IDS.has(tid) ||
                        tid === TERRAIN_TYPES.ROUTE_PATH.id ||
                        tid === TERRAIN_TYPES.CAVE_ENTRANCE.id) continue;
                    if (hash2d(gx, gy, seed + 600) < 0.5) {
                        grid[gy * w + gx] = TERRAIN_TYPES.TALL_GRASS.id;
                    }
                }
            }
        }

        // Ridges / ledges along the route at elevation changes
        for (let k = 3; k < path.length - 3; k++) {
            const px = path[k].x, py = path[k].y;
            const prevE = elevMap[path[k - 2].y * w + path[k - 2].x];
            const currE = elevMap[py * w + px];
            if (prevE - currE > 0.03 && hash2d(k, i + 800, seed) < 0.2) {
                // Place ledge strip perpendicular to path
                const isVert = Math.abs(path[Math.min(k + 1, path.length - 1)].y - py) >
                    Math.abs(path[Math.min(k + 1, path.length - 1)].x - px);
                for (let ld = -3; ld <= 3; ld++) {
                    const lx = isVert ? px + ld : px;
                    const ly = isVert ? py : py + ld;
                    if (lx < 0 || lx >= w || ly < 0 || ly >= h) continue;
                    const tid = grid[ly * w + lx];
                    if (tid === TERRAIN_TYPES.ROUTE_PATH.id || tid === TERRAIN_TYPES.PLAINS.id) {
                        grid[ly * w + lx] = TERRAIN_TYPES.LEDGE.id;
                    }
                }
            }
        }
        // Place ports at water/land transitions
        for (const port of portLocations) {
            // Build a 3x3 port at shoreline
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = port.x + dx, ny = port.y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const tid = grid[ny * w + nx];
                        if (!WATER_IDS.has(tid) && !BUILDING_IDS.has(tid)) {
                            grid[ny * w + nx] = TERRAIN_TYPES.PORT.id;
                        }
                    }
                }
            }
        }
    }

    // Step 8: Place caves at mountain barriers (3-5)
    const numCaves = 1 + Math.floor(hash2d(0, 700, seed) * 2); // 1-2
    const caves = [];
    const usedCaveNames = new Set();

    const mountainCandidates = [];
    for (let y = 5; y < h - 5; y++) {
        for (let x = 5; x < w - 5; x++) {
            const tid = grid[y * w + x];
            if (tid !== TERRAIN_TYPES.MOUNTAINS.id && tid !== TERRAIN_TYPES.HILLS.id) continue;
            let landN = false, landS = false, landE = false, landW = false;
            for (let d = 1; d <= 8; d++) {
                if (y - d >= 0 && !WATER_IDS.has(grid[(y - d) * w + x]) &&
                    grid[(y - d) * w + x] !== TERRAIN_TYPES.MOUNTAINS.id) landN = true;
                if (y + d < h && !WATER_IDS.has(grid[(y + d) * w + x]) &&
                    grid[(y + d) * w + x] !== TERRAIN_TYPES.MOUNTAINS.id) landS = true;
                if (x - d >= 0 && !WATER_IDS.has(grid[y * w + (x - d)]) &&
                    grid[y * w + (x - d)] !== TERRAIN_TYPES.MOUNTAINS.id) landW = true;
                if (x + d < w && !WATER_IDS.has(grid[y * w + (x + d)]) &&
                    grid[y * w + (x + d)] !== TERRAIN_TYPES.MOUNTAINS.id) landE = true;
            }
            if ((landN && landS) || (landE && landW)) mountainCandidates.push({ x, y });
        }
    }

    const minCaveDist = mapScale * 0.12;
    for (let attempt = 0; attempt < mountainCandidates.length && caves.length < numCaves; attempt++) {
        const ci = Math.floor(hash2d(attempt, 710, seed) * mountainCandidates.length);
        const c = mountainCandidates[ci];
        let tooClose = false;
        for (const cv of caves) { if (dist(c.x, c.y, cv.x, cv.y) < minCaveDist) { tooClose = true; break; } }
        for (const t of orderedTowns) { if (dist(c.x, c.y, t.x, t.y) < 20) { tooClose = true; break; } }
        if (tooClose) continue;

        // Larger cave entrance (3x3)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = c.x + dx, ny = c.y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) grid[ny * w + nx] = TERRAIN_TYPES.CAVE_ENTRANCE.id;
            }
        }
        // Cave terrain ring around entrance
        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 1.5 || d > 3.5) continue;
                const nx = c.x + dx, ny = c.y + dy;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    if (grid[ny * w + nx] === TERRAIN_TYPES.MOUNTAINS.id ||
                        grid[ny * w + nx] === TERRAIN_TYPES.HILLS.id) {
                        grid[ny * w + nx] = TERRAIN_TYPES.CAVE.id;
                    }
                }
            }
        }

        let caveName, nameAttempts = 0;
        do { caveName = generatePkmCaveName(seed + nameAttempts * 11, caves.length + nameAttempts); nameAttempts++; }
        while (usedCaveNames.has(caveName) && nameAttempts < 30);
        usedCaveNames.add(caveName);
        caves.push({ x: c.x, y: c.y, name: caveName });
    }

    // Step 9: Place landmarks — towers, ruins, grottos, shrines, lore points
    const landmarks = [];
    const minLandmarkDist = mapScale * 0.07;

    const LANDMARK_DEFS = [
        { type: 'tower',  terrain: TERRAIN_TYPES.FORTRESS.id, count: 1, suffixes: [' Tower', ' Spire', ' Watchtower'],
          validTerrain: new Set([TERRAIN_TYPES.HILLS.id, TERRAIN_TYPES.MOUNTAINS.id, TERRAIN_TYPES.CLIFF.id]) },
        { type: 'ruins',  terrain: TERRAIN_TYPES.RUINS.id, count: 1, suffixes: [' Ruins', ' Remnants', ' Relics'],
          validTerrain: new Set([TERRAIN_TYPES.FOREST.id, TERRAIN_TYPES.JUNGLE.id, TERRAIN_TYPES.DESERT.id, TERRAIN_TYPES.SWAMP.id]) },
        { type: 'grotto', terrain: TERRAIN_TYPES.CAVE.id, count: 1, suffixes: [' Grotto', ' Hollow', ' Den'],
          validTerrain: new Set([TERRAIN_TYPES.FOREST.id, TERRAIN_TYPES.HILLS.id, TERRAIN_TYPES.CLIFF.id, TERRAIN_TYPES.SWAMP.id]) },
        { type: 'shrine', terrain: TERRAIN_TYPES.PORT.id, count: 1, suffixes: [' Shrine', ' Altar', ' Sanctum'],
          validTerrain: new Set([TERRAIN_TYPES.PLAINS.id, TERRAIN_TYPES.FOREST.id, TERRAIN_TYPES.HILLS.id, TERRAIN_TYPES.BEACH.id]) },
        { type: 'lore',   terrain: TERRAIN_TYPES.OASIS.id, count: 1, suffixes: [' Spring', ' Oasis', ' Glade'],
          validTerrain: new Set([TERRAIN_TYPES.PLAINS.id, TERRAIN_TYPES.DESERT.id, TERRAIN_TYPES.SAVANNA.id, TERRAIN_TYPES.FOREST.id]) }
    ];

    for (const def of LANDMARK_DEFS) {
        const targetCount = def.count + Math.floor(hash2d(def.type.charCodeAt(0), 900, seed) * 1.5);
        for (let attempt = 0; attempt < 400 && landmarks.filter(l => l.type === def.type).length < targetCount; attempt++) {
            const x = Math.floor(hash2d(attempt, 910 + def.type.charCodeAt(0), seed) * w);
            const y = Math.floor(hash2d(attempt, 911 + def.type.charCodeAt(0), seed) * h);
            if (x < 8 || x >= w - 8 || y < 8 || y >= h - 8) continue;
            if (!def.validTerrain.has(grid[y * w + x])) continue;

            let tooClose = false;
            for (const l of landmarks) { if (dist(x, y, l.x, l.y) < minLandmarkDist) { tooClose = true; break; } }
            for (const t of orderedTowns) { if (dist(x, y, t.x, t.y) < 25) { tooClose = true; break; } }
            for (const cv of caves) { if (dist(x, y, cv.x, cv.y) < 15) { tooClose = true; break; } }
            if (tooClose) continue;

            // Place 3x3 landmark
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) grid[ny * w + nx] = def.terrain;
                }
            }

            const prefix = PKM_CAVE_PREFIXES[Math.floor(hash2d(attempt, 912 + def.type.charCodeAt(0), seed) * PKM_CAVE_PREFIXES.length)];
            const suffix = def.suffixes[Math.floor(hash2d(attempt, 913 + def.type.charCodeAt(0), seed) * def.suffixes.length)];
            landmarks.push({ x, y, type: def.type, name: prefix + suffix });
        }
    }

    // Step 9b: Build paths from the nearest route to each landmark and cave
    const allPOIs = [...caves.map(c => ({ x: c.x, y: c.y })), ...landmarks.map(l => ({ x: l.x, y: l.y }))];

    // Collect all route path cells for fast nearest-route lookup
    const routeCells = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y * w + x] === TERRAIN_TYPES.ROUTE_PATH.id) routeCells.push({ x, y });
        }
    }

    for (const poi of allPOIs) {
        // Find nearest route cell
        let nearestRoute = null;
        let nearestDist = Infinity;
        // Sample every 5th route cell for speed
        for (let ri = 0; ri < routeCells.length; ri += 5) {
            const rc = routeCells[ri];
            const d = dist(poi.x, poi.y, rc.x, rc.y);
            if (d < nearestDist && d > 3) { // must be at least 3 cells away
                nearestDist = d;
                nearestRoute = rc;
            }
        }

        if (!nearestRoute || nearestDist > mapScale * 0.3) continue; // too far, skip

        // A* path from route to POI
        const poiPath = findRoadPath(grid, elevMap, w, h, nearestRoute.x, nearestRoute.y, poi.x, poi.y, WATER_IDS);
        if (!poiPath) continue;

        // Lay down a narrow trail (2 cells wide)
        for (let k = 1; k < poiPath.length - 2; k++) {
            const px = poiPath[k].x, py = poiPath[k].y;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) > 1) continue; // cross pattern, not full 3x3
                    const nx = px + dx, ny = py + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    const tid = grid[ny * w + nx];
                    if (WATER_IDS.has(tid) || BUILDING_IDS.has(tid) ||
                        tid === TERRAIN_TYPES.CAVE_ENTRANCE.id ||
                        tid === TERRAIN_TYPES.RUINS.id ||
                        tid === TERRAIN_TYPES.FORTRESS.id) continue;
                    grid[ny * w + nx] = TERRAIN_TYPES.ROUTE_PATH.id;
                }
            }
        }
    }

    // Step 10: Generate labels for all locations
    if (labelManager) {
        const existing = labelManager.getAll().slice();
        for (const l of existing) labelManager.removeLabel(l.id);

        // Town labels
        for (const town of orderedTowns) {
            let fontSize = town.isLeague ? 30 : (town.hasGym ? 24 : 20);
            const labelId = labelManager.addLabel(town.x, town.y - townRadius(town, seed) - 3, town.name, 'city', 'none');
            labelManager.updateLabel(labelId, { fontSize, color: '#111111' });
        }

        // Route labels — water routes get anchor marker and blue tint
        for (const route of routeLabels) {
            const routeText = route.crossesWater ? route.name + ' (Sea)' : route.name;
            const marker = route.crossesWater ? 'anchor' : 'none';
            const labelId = labelManager.addLabel(route.x, route.y, routeText, 'custom', marker);
            labelManager.updateLabel(labelId, { fontSize: 18, color: route.crossesWater ? '#1a4a7a' : '#111111' });
        }

        // Cave labels
        for (const cave of caves) {
            const labelId = labelManager.addLabel(cave.x, cave.y - 5, cave.name, 'mountain', 'none');
            labelManager.updateLabel(labelId, { fontSize: 18, color: '#111111' });
        }

        // Landmark labels (towers, ruins, grottos, shrines, lore points)
        for (const lm of landmarks) {
            const labelId = labelManager.addLabel(lm.x, lm.y - 4, lm.name, 'mountain', 'none');
            labelManager.updateLabel(labelId, { fontSize: 16, color: '#111111' });
        }

        // Terrain labels — only label the biggest forest, desert, and mountain clusters
        const terrainLabels = [
            { id: TERRAIN_TYPES.FOREST.id, names: ['Whispering Woods', 'Emerald Thicket', 'Ancient Grove'] },
            { id: TERRAIN_TYPES.DESERT.id, names: ['Scorched Expanse', 'Amber Dunes', 'Golden Sands'] },
            { id: TERRAIN_TYPES.MOUNTAINS.id, names: ['Jagged Peaks', 'Iron Spine', 'Granite Heights'] }
        ];

        const step = Math.max(15, Math.floor(mapScale / 15));
        for (const tl of terrainLabels) {
            let bestX = -1, bestY = -1, bestCount = 0;
            for (let sy = step; sy < h - step; sy += step) {
                for (let sx = step; sx < w - step; sx += step) {
                    let count = 0;
                    for (let dy = -step; dy <= step; dy++) {
                        for (let dx = -step; dx <= step; dx++) {
                            const nx = sx + dx, ny = sy + dy;
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h && grid[ny * w + nx] === tl.id) count++;
                        }
                    }
                    if (count > bestCount && count > step * 4) { // higher threshold
                        bestCount = count;
                        bestX = sx;
                        bestY = sy;
                    }
                }
            }
            if (bestX >= 0) {
                const nameIdx = Math.floor(hash2d(tl.id, 950, seed) * tl.names.length);
                const labelId = labelManager.addLabel(bestX, bestY, tl.names[nameIdx], 'region', 'none');
                labelManager.updateLabel(labelId, { fontSize: 16, color: '#111111' });
            }
        }
    }

    // Helper for town radius lookup
    function townRadius(town, s) {
        return town.isLeague ? 16 : (town.hasGym ? 14 : 10 + Math.floor(hash2d(town.x, town.y, s + 400) * 4));
    }

    // Step 11: Generate biome-themed regions (replaces nations)
    if (nationManager) {
        generatePokemonRegions(grid, elevMap, w, h, seed, nationManager, orderedTowns, labelManager);
    }
}

// ==================== Pokemon Region (Biome) Generation ====================

const PKM_REGION_NAMES = [
    'Verdant Basin', 'Crimson Highlands', 'Azure Coast', 'Frost Peaks',
    'Golden Steppe', 'Ember Wastes', 'Shadow Marsh', 'Crystal Valley',
    'Storm Ridge', 'Coral Shore', 'Iron Range', 'Mist Hollows',
    'Thunder Plains', 'Jade Forest', 'Obsidian Crags', 'Silver Tundra',
    'Amber Savanna', 'Dusk Wetlands', 'Solar Plateau', 'Lunar Depths'
];

function generatePokemonRegions(grid, elevMap, w, h, seed, nationManager, towns, labelManager) {
    nationManager.clear();

    // Count land cells
    let landCount = 0;
    for (let i = 0; i < w * h; i++) {
        const t = TERRAIN_BY_ID[grid[i]];
        if (t && (t.category === 'land' || t.category === 'structure')) landCount++;
    }
    if (landCount < 20) return;

    // 3-5 regions based on map size
    const regionCount = Math.max(3, Math.min(5, Math.floor(landCount / 3000) + 3));

    // Use towns as region seeds - pick spread-out towns as capitals
    const capitals = [];
    const minCapDist = Math.min(w, h) * 0.2;

    for (let i = 0; i < towns.length && capitals.length < regionCount; i++) {
        const t = towns[i];
        let tooClose = false;
        for (const c of capitals) {
            if (dist(t.x, t.y, c.x, c.y) < minCapDist) { tooClose = true; break; }
        }
        if (!tooClose) capitals.push(t);
    }

    // Fill remaining with random land cells
    if (capitals.length < regionCount) {
        for (let attempt = 0; attempt < 500 && capitals.length < regionCount; attempt++) {
            const x = Math.floor(hash2d(attempt, 9100, seed) * w);
            const y = Math.floor(hash2d(attempt, 9101, seed) * h);
            const t = TERRAIN_BY_ID[grid[y * w + x]];
            if (!t || t.category === 'water') continue;
            let tooClose = false;
            for (const c of capitals) {
                if (dist(x, y, c.x, c.y) < minCapDist) { tooClose = true; break; }
            }
            if (!tooClose) capitals.push({ x, y });
        }
    }

    // Softer region colors (Pokemon-style pastels)
    const regionColors = [
        '#6abd6a', '#d47a7a', '#7a9ed4', '#d4c97a',
        '#b47ad4', '#7ad4c9', '#d4a67a', '#7ad47a'
    ];

    // Assign region names
    const usedRegionNames = new Set();
    const regionIds = [];
    for (let i = 0; i < capitals.length; i++) {
        let nameIdx;
        let attempts = 0;
        do {
            nameIdx = Math.floor(hash2d(i + attempts * 7, 9200, seed) * PKM_REGION_NAMES.length);
            attempts++;
        } while (usedRegionNames.has(nameIdx) && attempts < 40);
        usedRegionNames.add(nameIdx);

        const name = PKM_REGION_NAMES[nameIdx];
        const color = regionColors[i % regionColors.length];
        const nation = nationManager.addNation(name, color);
        regionIds.push(nation.id);
    }

    // BFS expand from capitals to fill land
    const claimed = new Int8Array(w * h).fill(-1);
    const distMap = new Float32Array(w * h).fill(Infinity);
    let frontier = [];

    for (let i = 0; i < capitals.length; i++) {
        const cap = capitals[i];
        const idx = cap.y * w + cap.x;
        claimed[idx] = i;
        distMap[idx] = 0;
        nationManager.assignCell(regionIds[i], cap.x, cap.y);
        frontier.push({ x: cap.x, y: cap.y, ni: i, d: 0 });
    }
    frontier.sort((a, b) => a.d - b.d);

    const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];

    while (frontier.length > 0) {
        const { x, y, ni, d: curD } = frontier.shift();
        for (const [dx, dy] of dirs4) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nIdx = ny * w + nx;
            const tid = grid[nIdx];
            const t = TERRAIN_BY_ID[tid];
            if (WATER_NATION_IDS.has(tid)) continue;

            let cost = 1;
            if (t) {
                if (t.category === 'water') cost = 3;
                if (tid === TERRAIN_TYPES.MOUNTAINS.id) cost = 2;
            }

            const newDist = curD + cost;
            if (newDist < distMap[nIdx]) {
                distMap[nIdx] = newDist;
                claimed[nIdx] = ni;
                if (t && (t.category === 'land' || t.category === 'structure')) {
                    nationManager.unassignCell(nx, ny);
                    nationManager.assignCell(regionIds[ni], nx, ny);
                }
                let insertIdx = frontier.length;
                for (let fi = frontier.length - 1; fi >= 0; fi--) {
                    if (frontier[fi].d <= newDist) { insertIdx = fi + 1; break; }
                    if (fi === 0) insertIdx = 0;
                }
                frontier.splice(insertIdx, 0, { x: nx, y: ny, ni, d: newDist });
            }
        }
    }

    // Add region name labels at capital positions
    if (labelManager) {
        for (let i = 0; i < capitals.length; i++) {
            const cap = capitals[i];
            const nation = nationManager.getNation(regionIds[i]);
            if (!nation) continue;
            const labelId = labelManager.addLabel(cap.x, cap.y + 4, nation.name, 'region', 'none');
            labelManager.updateLabel(labelId, {
                fontSize: 16,
                color: '#111111'
            });
        }
    }
}

// ==================== Main Export ====================

/**
 * Generate a procedural map.
 * @param {Uint8Array} grid - The grid to fill (mapWidth * mapHeight)
 * @param {number} mapWidth
 * @param {number} mapHeight
 * @param {'pangea'|'continents'|'islands'|'pokemon'} mode
 * @param {number} seed - Numeric seed for reproducibility
 * @param {NationManager} [nationManager] - Optional nation manager for auto-generation
 * @param {LabelManager} [labelManager] - Optional label manager for settlement names
 */
export function generateMap(grid, mapWidth, mapHeight, mode, seed, nationManager, labelManager) {
    seed = Math.abs(Math.floor(seed)) || 1;
    const totalCells = mapWidth * mapHeight;
    const elevMap = new Float32Array(totalCells);

    // Pokemon mode: use dedicated generator and skip standard pipeline
    if (mode === 'pokemon') {
        generatePokemonRegion(grid, elevMap, mapWidth, mapHeight, seed, nationManager, labelManager);
        return;
    }

    // Step 1: Generate elevation map based on mode
    switch (mode) {
        case 'pangea':
            generatePangea(elevMap, mapWidth, mapHeight, seed);
            break;
        case 'continents':
            generateContinents(elevMap, mapWidth, mapHeight, seed);
            break;
        case 'islands':
            generateIslands(elevMap, mapWidth, mapHeight, seed);
            break;
        default:
            generateContinents(elevMap, mapWidth, mapHeight, seed);
    }

    // Step 2: Refine shorelines with fine-grained detail
    refineShorelines(elevMap, mapWidth, mapHeight, seed);

    // Step 3: Assign terrain types based on elevation, latitude, moisture
    assignTerrain(grid, elevMap, mapWidth, mapHeight, seed);

    // Step 4: Post-processing - rivers
    const numRivers = mode === 'islands' ? 2 + Math.floor(hash2d(100, 100, seed) * 3)
        : 3 + Math.floor(hash2d(100, 100, seed) * 6);
    generateRivers(grid, elevMap, mapWidth, mapHeight, seed, numRivers);

    // Step 5: Lakes
    placeLakes(grid, elevMap, mapWidth, mapHeight, seed);

    // Step 6: Volcanic features
    placeVolcanics(grid, elevMap, mapWidth, mapHeight, seed, mode);

    // Step 7: Settlements and ruins
    const settlements = placeSettlements(grid, elevMap, mapWidth, mapHeight, seed);

    // Step 8: Generate roads connecting settlements
    generateRoads(grid, elevMap, mapWidth, mapHeight, seed, settlements);

    // Step 9: Generate settlement name labels
    if (labelManager) {
        // Clear existing labels before generating new ones
        const existing = labelManager.getAll().slice();
        for (const l of existing) labelManager.removeLabel(l.id);
        generateSettlementLabels(settlements, seed, labelManager);
    }

    // Step 10: Auto-generate nations if a NationManager is provided
    if (nationManager) {
        generateNations(grid, elevMap, mapWidth, mapHeight, seed, nationManager, settlements, labelManager);
    }
}

// ==================== Nation Generation ====================

const WATER_NATION_IDS = new Set([
    TERRAIN_TYPES.DEEP_OCEAN.id,
    TERRAIN_TYPES.SHALLOW_WATER.id
]);

/**
 * Auto-generate nations that fill the land area of the map.
 * Uses a multi-seed BFS expansion from capital cities spread across the land.
 * Fewer nations (2-4), each with a labeled capital city.
 */
function generateNations(grid, elevMap, w, h, seed, nationManager, settlements, labelManager) {
    nationManager.clear();

    // Count total land cells to determine number of nations
    let landCount = 0;
    for (let i = 0; i < w * h; i++) {
        const t = TERRAIN_BY_ID[grid[i]];
        if (t && (t.category === 'land' || t.category === 'structure')) {
            landCount++;
        }
    }

    if (landCount < 20) return; // Too little land for nations

    // Fewer nations: 2-4 based on land area
    const nationCount = Math.max(2, Math.min(4, Math.floor(landCount / 4000) + 2));

    // Find candidate capital locations: prefer city settlements, then towns
    const citySettlements = settlements ? settlements.filter(s => s.type === 'city') : [];
    const townSettlements = settlements ? settlements.filter(s => s.type === 'town') : [];
    const allSettlements = [...citySettlements, ...townSettlements];

    const landCells = [];
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const t = TERRAIN_BY_ID[grid[y * w + x]];
            if (t && (t.category === 'land' || t.category === 'structure')) {
                landCells.push({ x, y });
            }
        }
    }

    // Pick capital positions spread apart
    const capitals = [];
    const minCapDist = Math.min(w, h) * 0.2; // Bigger spacing for fewer nations

    // First try to use existing city/town settlements as capitals
    const sortedSettlements = allSettlements.slice().sort((a, b) =>
        hash2d(a.x, a.y, seed + 8000) - hash2d(b.x, b.y, seed + 8000)
    );
    for (const c of sortedSettlements) {
        if (capitals.length >= nationCount) break;
        let tooClose = false;
        for (const cap of capitals) {
            if (dist(c.x, c.y, cap.x, cap.y) < minCapDist) { tooClose = true; break; }
        }
        if (!tooClose) capitals.push(c);
    }

    // Fill remaining capital slots with random land cells
    if (capitals.length < nationCount && landCells.length > 0) {
        for (let attempt = 0; attempt < 500 && capitals.length < nationCount; attempt++) {
            const idx = Math.floor(hash2d(attempt, 9000, seed) * landCells.length);
            const c = landCells[idx];
            let tooClose = false;
            for (const cap of capitals) {
                if (dist(c.x, c.y, cap.x, cap.y) < minCapDist) { tooClose = true; break; }
            }
            if (!tooClose) capitals.push({ x: c.x, y: c.y, type: 'city' });
        }
    }

    if (capitals.length === 0) return;

    // Create nations and label capitals
    const nationIds = [];
    for (let i = 0; i < capitals.length; i++) {
        const name = generateNationName(seed + i * 7 + 100);
        const color = NATION_COLORS[i % NATION_COLORS.length];
        const nation = nationManager.addNation(name, color);
        nationIds.push(nation.id);

        // Ensure the capital cell is a city on the grid
        const cap = capitals[i];
        const tid = grid[cap.y * w + cap.x];
        if (tid !== TERRAIN_TYPES.CITY.id) {
            grid[cap.y * w + cap.x] = TERRAIN_TYPES.CITY.id;
        }

        // Add a capital label with crown marker
        if (labelManager) {
            const capitalName = generateSettlementName(seed + i * 31 + 500, 'city');
            const labelId = labelManager.addLabel(cap.x, cap.y, capitalName, 'city', 'star');
            labelManager.updateLabel(labelId, { fontSize: 18, color });
        }
    }

    // Multi-seed weighted BFS: expand all nations simultaneously
    // Each entry: { x, y, nationIdx, distance }
    // Use a priority queue approximation via bucket queues
    const claimed = new Int8Array(w * h).fill(-1); // -1 = unclaimed
    const distMap = new Float32Array(w * h).fill(Infinity);

    // Simple array-based priority queue (distance-sorted)
    let frontier = [];

    // Seed the frontier with capitals
    for (let i = 0; i < capitals.length; i++) {
        const cap = capitals[i];
        const idx = cap.y * w + cap.x;
        claimed[idx] = i;
        distMap[idx] = 0;
        nationManager.assignCell(nationIds[i], cap.x, cap.y);
        frontier.push({ x: cap.x, y: cap.y, ni: i, d: 0 });
    }

    // Sort by distance ascending
    frontier.sort((a, b) => a.d - b.d);

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];

    while (frontier.length > 0) {
        const { x, y, ni, d } = frontier.shift();

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

            const nIdx = ny * w + nx;
            const tid = grid[nIdx];
            const t = TERRAIN_BY_ID[tid];

            // Skip deep ocean and shallow water - they are natural borders
            if (WATER_NATION_IDS.has(tid)) continue;

            // Allow rivers and lakes to be crossed but with a cost penalty
            let cost = 1;
            if (t) {
                if (t.category === 'water') cost = 3; // rivers/lakes add cost but can be crossed
                if (tid === TERRAIN_TYPES.MOUNTAINS.id) cost = 2; // mountains slow expansion
            }

            const newDist = d + cost;
            if (newDist < distMap[nIdx]) {
                distMap[nIdx] = newDist;
                claimed[nIdx] = ni;

                // Only assign land/structure cells to nations (not river/lake terrain)
                if (t && (t.category === 'land' || t.category === 'structure')) {
                    // Remove from previous nation if reassigned
                    nationManager.unassignCell(nx, ny);
                    nationManager.assignCell(nationIds[ni], nx, ny);
                }

                // Insert into frontier maintaining sort order (insertion sort for small shifts)
                let insertIdx = frontier.length;
                for (let fi = frontier.length - 1; fi >= 0; fi--) {
                    if (frontier[fi].d <= newDist) {
                        insertIdx = fi + 1;
                        break;
                    }
                    if (fi === 0) insertIdx = 0;
                }
                frontier.splice(insertIdx, 0, { x: nx, y: ny, ni, d: newDist });
            }
        }
    }

    // Assign small islands to nearest mainland nation
    // Find any unclaimed land cells and assign to nearest claimed neighbor's nation
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const t = TERRAIN_BY_ID[grid[idx]];
            if (!t || t.category === 'water') continue;
            if (nationManager.getNationAt(x, y) !== null) continue;

            // BFS outward to find nearest nation
            let found = false;
            const searchQueue = [{ x, y }];
            const visited = new Set([`${x},${y}`]);
            let nearestNationId = null;

            while (searchQueue.length > 0 && !found) {
                const { x: sx, y: sy } = searchQueue.shift();
                for (const [dx, dy] of dirs) {
                    const nx = sx + dx;
                    const ny = sy + dy;
                    const key = `${nx},${ny}`;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    if (visited.has(key)) continue;
                    visited.add(key);

                    const nid = nationManager.getNationAt(nx, ny);
                    if (nid !== null) {
                        nearestNationId = nid;
                        found = true;
                        break;
                    }
                    searchQueue.push({ x: nx, y: ny });

                    // Limit search radius
                    if (visited.size > 500) { found = true; break; }
                }
            }

            if (nearestNationId !== null) {
                nationManager.assignCell(nearestNationId, x, y);
            }
        }
    }
}
