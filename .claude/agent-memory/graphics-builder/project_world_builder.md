---
name: world-builder-project
description: Fantasy map builder web app - vanilla JS with canvas rendering, chunk-based caching, procedural generation
type: project
---

World Builder is a browser-based fantasy map editor at `/home/bigsamich/Workspace/world-builder/`.

**Architecture:** Vanilla JS ES modules, no build system. Files: app.js (main controller), canvas.js (chunk-cached rendering engine), terrain.js (28 terrain types with procedural sprites), tools.js (brush/fill/line/rect/measure/label), ui.js (sidebar, toolbar, dialogs, layer panel), generator.js (procedural map generation), labels.js (label manager), markers.js (marker rendering), history.js (undo/redo), export.js (save/load/PNG export).

**Why:** Personal project for building fantasy world maps in the browser.

**How to apply:** The codebase uses a dark theme (CSS custom properties), chunk-based rendering for performance, and all rendering goes through canvas.js. External modifications may add features (labels, markers) concurrently -- watch for file modifications during editing.
