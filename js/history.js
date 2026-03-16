// history.js - Undo/redo system using snapshots of changed cells

const MAX_HISTORY = 50;

export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this._pendingChanges = null; // Map of "x,y" -> { oldVal, newVal }
        this.onStateChange = null;   // callback for UI updates
    }

    /**
     * Begin recording a batch of changes (one paint stroke = one undo step).
     */
    beginAction() {
        this._pendingChanges = new Map();
    }

    /**
     * Record a single cell change within the current action.
     * Only records the first old value per cell per action.
     */
    recordCell(x, y, oldVal, newVal) {
        if (!this._pendingChanges) return;
        const key = `${x},${y}`;
        if (!this._pendingChanges.has(key)) {
            this._pendingChanges.set(key, { x, y, oldVal, newVal });
        } else {
            // Update the newVal but keep the original oldVal
            this._pendingChanges.get(key).newVal = newVal;
        }
    }

    /**
     * Commit the current action to the undo stack.
     */
    commitAction() {
        if (!this._pendingChanges || this._pendingChanges.size === 0) {
            this._pendingChanges = null;
            return;
        }

        // Filter out no-ops
        const changes = [];
        for (const entry of this._pendingChanges.values()) {
            if (entry.oldVal !== entry.newVal) {
                changes.push(entry);
            }
        }

        if (changes.length === 0) {
            this._pendingChanges = null;
            return;
        }

        this.undoStack.push(changes);
        if (this.undoStack.length > MAX_HISTORY) {
            this.undoStack.shift();
        }
        // Any new action clears the redo stack
        this.redoStack = [];
        this._pendingChanges = null;
        this._notify();
    }

    /**
     * Undo the last action. Returns array of {x, y, val} to apply, or null.
     */
    undo() {
        if (this.undoStack.length === 0) return null;
        const changes = this.undoStack.pop();
        this.redoStack.push(changes);
        this._notify();
        return changes.map(c => ({ x: c.x, y: c.y, val: c.oldVal }));
    }

    /**
     * Redo the last undone action.
     */
    redo() {
        if (this.redoStack.length === 0) return null;
        const changes = this.redoStack.pop();
        this.undoStack.push(changes);
        this._notify();
        return changes.map(c => ({ x: c.x, y: c.y, val: c.newVal }));
    }

    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this._pendingChanges = null;
        this._notify();
    }

    _notify() {
        if (this.onStateChange) this.onStateChange();
    }
}
