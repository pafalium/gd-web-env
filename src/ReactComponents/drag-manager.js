
/**
  @param {MouseDownEvent} mouseDown The mousedown event that starts the drag
  @param {Object} drag
  @param {Function} drag.onMove
  @param {Function} drag.onUp
*/
export function start(mouseDown, drag) {
  currentDrag = drag;
}

function onMouseMove(mouseMove) {
  currentDrag 
    && currentDrag.onMove 
    && currentDrag.onMove(mouseMove);
}

function onMouseUp(mouseUp) {
  currentDrag
    && currentDrag.onUp
    && currentDrag.onUp(mouseUp);
  currentDrag = null;
}

// Initialization.
let currentDrag = null;

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);
