// markers.js - Map pin/marker icons drawn with canvas primitives

export const MARKER_TYPES = [
    { id: 'none',          label: 'None' },
    { id: 'city_dot',      label: 'City' },
    { id: 'town_dot',      label: 'Town' },
    { id: 'castle',        label: 'Castle' },
    { id: 'star',          label: 'Star' },
    { id: 'skull',         label: 'Skull' },
    { id: 'flag',          label: 'Flag' },
    { id: 'anchor',        label: 'Anchor' },
    { id: 'crossed_swords',label: 'Swords' },
    { id: 'question',      label: 'Unknown' },
    { id: 'camp',          label: 'Camp' },
    { id: 'mine',          label: 'Mine' },
    { id: 'tower',         label: 'Tower' },
    { id: 'temple',        label: 'Temple' },
    { id: 'dragon',        label: 'Dragon' },
    { id: 'treasure',      label: 'Treasure' }
];

/**
 * Draw a marker icon centered at (x, y) with given size.
 * color is optional; defaults to white.
 */
export function drawMarker(ctx, x, y, size, type, color = '#ffffff') {
    const fn = MARKER_DRAW[type];
    if (fn) fn(ctx, x, y, size, color);
}

const MARKER_DRAW = {
    city_dot(ctx, x, y, s, color) {
        // Filled circle with outer ring
        const r = s * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, r + s * 0.1, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    },

    town_dot(ctx, x, y, s, color) {
        // Smaller filled circle
        const r = s * 0.22;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    },

    castle(ctx, x, y, s, color) {
        // Crenellated square
        const half = s * 0.35;
        const cren = s * 0.12;
        ctx.fillStyle = color;
        // Base rectangle
        ctx.fillRect(x - half, y - half + cren, half * 2, half * 2 - cren);
        // Three merlons along top
        const mw = half * 0.45;
        ctx.fillRect(x - half, y - half, mw, cren);
        ctx.fillRect(x - mw * 0.5, y - half, mw, cren);
        ctx.fillRect(x + half - mw, y - half, mw, cren);
    },

    star(ctx, x, y, s, color) {
        // 5-pointed star
        const outer = s * 0.4;
        const inner = s * 0.18;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    skull(ctx, x, y, s, color) {
        // Circle head + X eyes + jaw
        const r = s * 0.3;
        ctx.beginPath();
        ctx.arc(x, y - s * 0.05, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.stroke();
        // X eyes
        const ey = y - s * 0.1;
        const ex = s * 0.1;
        const es = s * 0.07;
        ctx.beginPath();
        ctx.moveTo(x - ex - es, ey - es); ctx.lineTo(x - ex + es, ey + es);
        ctx.moveTo(x - ex + es, ey - es); ctx.lineTo(x - ex - es, ey + es);
        ctx.moveTo(x + ex - es, ey - es); ctx.lineTo(x + ex + es, ey + es);
        ctx.moveTo(x + ex + es, ey - es); ctx.lineTo(x + ex - es, ey + es);
        ctx.stroke();
        // Jaw line
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y + r * 0.6);
        ctx.lineTo(x + r * 0.5, y + r * 0.6);
        ctx.stroke();
    },

    flag(ctx, x, y, s, color) {
        // Pole + triangular flag
        const poleH = s * 0.7;
        const flagW = s * 0.4;
        const flagH = s * 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.07);
        // Pole
        ctx.beginPath();
        ctx.moveTo(x, y + poleH * 0.3);
        ctx.lineTo(x, y - poleH * 0.5);
        ctx.stroke();
        // Flag
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - poleH * 0.5);
        ctx.lineTo(x + flagW, y - poleH * 0.5 + flagH * 0.5);
        ctx.lineTo(x, y - poleH * 0.5 + flagH);
        ctx.closePath();
        ctx.fill();
    },

    anchor(ctx, x, y, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        const r = s * 0.12;
        // Ring at top
        ctx.beginPath();
        ctx.arc(x, y - s * 0.25, r, 0, Math.PI * 2);
        ctx.stroke();
        // Vertical shank
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.25 + r);
        ctx.lineTo(x, y + s * 0.2);
        ctx.stroke();
        // Cross bar
        ctx.beginPath();
        ctx.moveTo(x - s * 0.18, y - s * 0.1);
        ctx.lineTo(x + s * 0.18, y - s * 0.1);
        ctx.stroke();
        // Curved arms at bottom
        ctx.beginPath();
        ctx.arc(x, y + s * 0.2, s * 0.22, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
    },

    crossed_swords(ctx, x, y, s, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        const len = s * 0.35;
        // Sword 1: top-left to bottom-right
        ctx.beginPath();
        ctx.moveTo(x - len, y - len);
        ctx.lineTo(x + len, y + len);
        ctx.stroke();
        // Sword 2: top-right to bottom-left
        ctx.beginPath();
        ctx.moveTo(x + len, y - len);
        ctx.lineTo(x - len, y + len);
        ctx.stroke();
        // Guards (small perpendicular lines near center)
        const gOff = s * 0.08;
        const gLen = s * 0.1;
        // Guard 1
        ctx.beginPath();
        ctx.moveTo(x - gOff - gLen * 0.7, y - gOff + gLen * 0.7);
        ctx.lineTo(x - gOff + gLen * 0.7, y - gOff - gLen * 0.7);
        ctx.stroke();
        // Guard 2
        ctx.beginPath();
        ctx.moveTo(x + gOff - gLen * 0.7, y - gOff - gLen * 0.7);
        ctx.lineTo(x + gOff + gLen * 0.7, y - gOff + gLen * 0.7);
        ctx.stroke();
    },

    question(ctx, x, y, s, color) {
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.round(s * 0.7)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
    },

    camp(ctx, x, y, s, color) {
        // Small tent triangle
        const half = s * 0.35;
        const h = s * 0.45;
        ctx.beginPath();
        ctx.moveTo(x, y - h * 0.5);
        ctx.lineTo(x - half, y + h * 0.5);
        ctx.lineTo(x + half, y + h * 0.5);
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.stroke();
        // Door
        ctx.beginPath();
        ctx.moveTo(x, y - h * 0.5);
        ctx.lineTo(x, y + h * 0.5);
        ctx.stroke();
    },

    mine(ctx, x, y, s, color) {
        // Pickaxe shape
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.08);
        // Handle (diagonal)
        ctx.beginPath();
        ctx.moveTo(x - s * 0.25, y + s * 0.3);
        ctx.lineTo(x + s * 0.15, y - s * 0.2);
        ctx.stroke();
        // Pick head (curved)
        ctx.beginPath();
        ctx.moveTo(x - s * 0.1, y - s * 0.3);
        ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.2, x + s * 0.3, y - s * 0.05);
        ctx.stroke();
    },

    tower(ctx, x, y, s, color) {
        // Narrow tall rectangle with pointed top
        const w = s * 0.22;
        const h = s * 0.65;
        ctx.fillStyle = color;
        // Body
        ctx.fillRect(x - w, y - h * 0.3, w * 2, h * 0.7);
        // Pointed top
        ctx.beginPath();
        ctx.moveTo(x - w - s * 0.05, y - h * 0.3);
        ctx.lineTo(x, y - h * 0.6);
        ctx.lineTo(x + w + s * 0.05, y - h * 0.3);
        ctx.closePath();
        ctx.fill();
    },

    temple(ctx, x, y, s, color) {
        // Triangle pediment on columns
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.07);
        const bw = s * 0.4;
        const bh = s * 0.35;
        const top = y - s * 0.25;
        // Pediment triangle
        ctx.beginPath();
        ctx.moveTo(x - bw, top + s * 0.2);
        ctx.lineTo(x, top - s * 0.15);
        ctx.lineTo(x + bw, top + s * 0.2);
        ctx.closePath();
        ctx.stroke();
        // Two columns
        const colW = s * 0.06;
        const colTop = top + s * 0.2;
        const colBot = y + s * 0.35;
        ctx.fillRect(x - bw * 0.7 - colW, colTop, colW * 2, colBot - colTop);
        ctx.fillRect(x + bw * 0.7 - colW, colTop, colW * 2, colBot - colTop);
        // Base line
        ctx.beginPath();
        ctx.moveTo(x - bw, colBot);
        ctx.lineTo(x + bw, colBot);
        ctx.stroke();
    },

    dragon(ctx, x, y, s, color) {
        // Stylized dragon silhouette: a curved body with wings
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.07);
        // Body arc
        ctx.beginPath();
        ctx.arc(x, y, s * 0.2, 0.3, Math.PI - 0.3);
        ctx.stroke();
        // Left wing
        ctx.beginPath();
        ctx.moveTo(x - s * 0.1, y - s * 0.1);
        ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.4, x - s * 0.3, y);
        ctx.stroke();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(x + s * 0.1, y - s * 0.1);
        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.4, x + s * 0.3, y);
        ctx.stroke();
        // Head dot
        ctx.beginPath();
        ctx.arc(x, y - s * 0.2, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.18);
        ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.35, x + s * 0.3, y + s * 0.25);
        ctx.stroke();
    },

    treasure(ctx, x, y, s, color) {
        // Chest: rectangle with curved top
        const w = s * 0.35;
        const h = s * 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, s * 0.07);
        // Bottom box
        ctx.strokeRect(x - w, y, w * 2, h);
        // Curved lid
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.quadraticCurveTo(x, y - h * 1.2, x + w, y);
        ctx.stroke();
        // Lock circle
        ctx.beginPath();
        ctx.arc(x, y + h * 0.4, s * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
};

/**
 * Draw a marker onto a small canvas and return it as an image data URL.
 * Used for the marker selector UI thumbnails.
 */
export function renderMarkerThumbnail(type, size = 28, color = '#e0e0e0') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (type === 'none') {
        // Draw an X for "none"
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(size * 0.3, size * 0.3);
        ctx.lineTo(size * 0.7, size * 0.7);
        ctx.moveTo(size * 0.7, size * 0.3);
        ctx.lineTo(size * 0.3, size * 0.7);
        ctx.stroke();
    } else {
        drawMarker(ctx, size / 2, size / 2, size * 0.85, type, color);
    }
    return canvas.toDataURL();
}
