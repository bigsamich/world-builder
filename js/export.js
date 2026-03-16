// export.js - Save/load (JSON) and export (PNG) functionality

/**
 * Serialize the map state to a JSON string.
 */
export function serializeMap(state) {
    const { grid, mapWidth, mapHeight, mapName } = state;

    // RLE-compress the grid for smaller file size
    const rle = [];
    let current = grid[0];
    let count = 1;
    for (let i = 1; i < grid.length; i++) {
        if (grid[i] === current) {
            count++;
        } else {
            rle.push([current, count]);
            current = grid[i];
            count = 1;
        }
    }
    rle.push([current, count]);

    const result = {
        version: 2,
        name: mapName,
        width: mapWidth,
        height: mapHeight,
        grid: rle
    };

    // Include labels if a labelManager is provided on state
    if (state.labelManager) {
        result.labels = state.labelManager.serialize();
    }

    // Include nations if a nationManager is provided on state
    if (state.nationManager) {
        result.nations = state.nationManager.serialize();
    }

    return JSON.stringify(result);
}

/**
 * Deserialize a JSON string back into map state.
 * Returns { mapName, mapWidth, mapHeight, grid } or throws.
 */
export function deserializeMap(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (!data.version || !data.width || !data.height || !data.grid) {
        throw new Error('Invalid map file format');
    }

    const mapWidth = data.width;
    const mapHeight = data.height;
    const grid = new Uint8Array(mapWidth * mapHeight);

    // Decode RLE
    let idx = 0;
    for (const [val, count] of data.grid) {
        for (let i = 0; i < count; i++) {
            if (idx < grid.length) {
                grid[idx++] = val;
            }
        }
    }

    return {
        mapName: data.name || 'Untitled Map',
        mapWidth,
        mapHeight,
        grid,
        labels: data.labels || null,
        nations: data.nations || null
    };
}

/**
 * Trigger a file download with given content.
 */
export function downloadFile(filename, content, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Prompt user to select a JSON file and return its text content.
 */
export function loadFileDialog() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.worldmap';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) { reject(new Error('No file selected')); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        };
        input.click();
    });
}

/**
 * Export the canvas as a PNG download.
 */
export function exportCanvasAsPNG(canvas, filename) {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
