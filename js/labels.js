// labels.js - Label/Marker data management for map annotations

export const LABEL_TYPES = {
    city:     { font: 'bold',   baseFontSize: 14, color: '#e0e0e0', letterSpacing: 0,  italic: false, markerDefault: 'city_dot' },
    region:   { font: 'normal', baseFontSize: 28, color: 'rgba(220,200,170,0.55)', letterSpacing: 8, italic: true,  markerDefault: 'none' },
    water:    { font: 'normal', baseFontSize: 16, color: '#5cacee', letterSpacing: 2,  italic: true,  markerDefault: 'none' },
    mountain: { font: 'bold',   baseFontSize: 12, color: '#a0a0a0', letterSpacing: 0,  italic: false, markerDefault: 'none' },
    custom:   { font: 'bold',   baseFontSize: 14, color: '#e0e0e0', letterSpacing: 0,  italic: false, markerDefault: 'none' }
};

export class LabelManager {
    constructor() {
        this.labels = []; // Array of label objects
        this.nextId = 1;
    }

    /**
     * Add a new label at grid coordinates (x, y).
     * x, y are floats (not snapped to grid).
     * Returns the new label's id.
     */
    addLabel(x, y, text, type = 'city', marker = null) {
        const defaults = LABEL_TYPES[type] || LABEL_TYPES.custom;
        const label = {
            id: this.nextId++,
            x,
            y,
            text: text || 'Label',
            type,
            marker: marker !== null ? marker : defaults.markerDefault,
            fontSize: defaults.baseFontSize,
            color: defaults.color,
            rotation: 0
        };
        this.labels.push(label);
        return label.id;
    }

    /**
     * Remove a label by id.
     */
    removeLabel(id) {
        const idx = this.labels.findIndex(l => l.id === id);
        if (idx !== -1) {
            this.labels.splice(idx, 1);
            return true;
        }
        return false;
    }

    /**
     * Find a label near grid point (gx, gy) within a given radius.
     * Returns the label object or null.
     */
    findLabelAt(gx, gy, radius = 2) {
        let closest = null;
        let closestDist = Infinity;
        for (const label of this.labels) {
            const dx = label.x - gx;
            const dy = label.y - gy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius && dist < closestDist) {
                closest = label;
                closestDist = dist;
            }
        }
        return closest;
    }

    /**
     * Update label properties by id.
     * props is an object with keys to update (e.g. { text, type, fontSize, color }).
     */
    updateLabel(id, props) {
        const label = this.labels.find(l => l.id === id);
        if (!label) return false;
        for (const key of Object.keys(props)) {
            if (key !== 'id' && props[key] !== undefined) {
                label[key] = props[key];
            }
        }
        return true;
    }

    /**
     * Get a label by id.
     */
    getLabel(id) {
        return this.labels.find(l => l.id === id) || null;
    }

    /**
     * Return all labels.
     */
    getAll() {
        return this.labels;
    }

    /**
     * Serialize labels to a plain array for JSON save.
     */
    serialize() {
        return this.labels.map(l => ({ ...l }));
    }

    /**
     * Deserialize labels from saved data.
     */
    deserialize(data) {
        if (!Array.isArray(data)) return;
        this.labels = data.map(l => ({ ...l }));
        // Update nextId to be higher than any existing id
        let maxId = 0;
        for (const l of this.labels) {
            if (l.id > maxId) maxId = l.id;
        }
        this.nextId = maxId + 1;
    }
}
