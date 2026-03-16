# World Builder - Fantasy Map Maker

A browser-based fantasy map editor and procedural world generator. Paint terrain, place labels and markers, define nations, and generate entire worlds from seed — all with vanilla JavaScript and HTML5 Canvas.

## Features

- **Procedural World Generation** — Four generation modes (Pangea, Continents, Islands, Pokemon) with seed-based reproducibility and tectonic plate simulation
- **35 Terrain Types** — Water, land, and structure terrains including oceans, forests, mountains, deserts, cities, ruins, roads, and more
- **8 Editing Tools** — Brush, Fill, Eraser, Line, Rectangle, Label, Measure, and Nation tools
- **Label & Marker System** — 16 marker icons (castles, flags, skulls, dragons, etc.) with customizable text labels for cities, regions, water features, and mountains
- **Nation Territories** — Create nations, assign territory with a lasso tool, and toggle colored overlays
- **Layer Visibility** — Toggle water, land, and structure layers independently
- **Undo/Redo** — 50-step history with `Ctrl+Z` / `Ctrl+Y`
- **Save/Load** — RLE-compressed JSON format preserves terrain, labels, and nations
- **PNG Export** — Export full map as a PNG image
- **Minimap** — Clickable overview for fast navigation
- **Dark UI Theme** — Responsive layout with collapsible sidebar on mobile

## Quick Start

### Docker (recommended)

```bash
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080).

### Static Files

Serve the project root with any HTTP server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

## Controls

### Navigation

| Input | Action |
|---|---|
| Mouse Wheel | Zoom in/out |
| Middle Mouse Drag | Pan |
| Space + Left Drag | Pan |
| Click Minimap | Jump to location |

### Tool Shortcuts

| Key | Tool |
|---|---|
| `B` | Brush |
| `F` | Fill |
| `E` | Eraser |
| `L` | Line |
| `R` | Rectangle |
| `T` | Label |
| `D` | Measure |
| `N` | Nation |

### Other Shortcuts

| Key | Action |
|---|---|
| `G` | Toggle grid |
| `1`–`0` | Select terrain (first 10) |
| `[` / `]` | Decrease / increase brush size |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Delete` | Delete selected label |
| `Escape` | Close editor / deselect |
| Right-click on canvas | Eyedropper (sample terrain) |

## World Generation

Click **Generate** in the toolbar to open the generation dialog.

| Mode | Description |
|---|---|
| **Pangea** | Single supercontinent with fjords and peninsulas |
| **Continents** | Multiple landmasses spread across the map (default) |
| **Islands** | Many small islands and archipelagos |
| **Pokemon** | Pokemon-style region with towns, routes, gyms, caves, and tall grass (requires 500x500+ map) |

Each mode uses a configurable seed value — the same seed always produces the same map. Generation uses tectonic plate simulation with elevation, moisture, and temperature noise to determine biomes. Cities and landmarks are auto-placed with generated fantasy names.

## Editing Workflow

1. **Create or Generate** — Use **New** for a blank canvas or **Generate** for a procedural world
2. **Paint Terrain** — Select a terrain from the palette and paint with the Brush tool. Adjust size, opacity, and soft edge in Brush Settings
3. **Add Labels** — Switch to the Label tool (`T`), click the map to place a label, then customize text, marker icon, font size, and color
4. **Define Nations** — Add nations in the sidebar, select the Nation tool (`N`), and draw a lasso around territory to assign it. Toggle the overlay with the Nations button
5. **Save Your Work** — **Save** exports a `.json` file. **Export** renders a `.png` image

## Brush Settings

- **Size** (1–20) — Brush radius in cells
- **Opacity** (10–100%) — Dithered application for partial coverage
- **Soft Edge** — Feathered edges that fade based on distance from center

## Labels & Markers

The label editor supports five label types with different default styles:

- **City** — Bold white text with city dot marker
- **Region** — Large italic text, semi-transparent
- **Water** — Blue italic text for rivers and seas
- **Mountain** — Gray bold text
- **Custom** — Fully user-defined

16 marker icons are available: city dot, town dot, castle, star, skull, flag, anchor, crossed swords, question mark, camp, mine, tower, temple, dragon, and treasure.

## File Format

Maps save as JSON with:

- Map name and dimensions
- RLE-compressed terrain grid
- Label array (position, text, type, marker, color, font size)
- Nation array (ID, name, color, cell assignments)

## Project Structure

```
world-builder/
  index.html          # App shell
  css/style.css       # Dark theme styles
  js/
    app.js            # Main init, state, input handling
    canvas.js         # Chunk-based canvas renderer
    terrain.js        # Terrain definitions and rendering
    tools.js          # Brush, fill, line, rectangle algorithms
    labels.js         # Label/marker management and editor
    nations.js        # Nation territories and overlay
    markers.js        # 16 marker icon renderers
    generator.js      # Procedural world generation
    history.js        # Undo/redo system
    export.js         # Save/load/PNG export
    ui.js             # Dialogs and UI components
  Dockerfile          # Nginx Alpine container
  docker-compose.yml  # Docker Compose config
```

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas with chunk-based rendering
- No external dependencies
- Nginx Alpine for production serving

## License

MIT
