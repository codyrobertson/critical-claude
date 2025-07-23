/**
 * View Interface
 * Base interface for all views in the presentation layer
 */
export class BaseView {
    state = {
        isVisible: false,
        isFocused: false,
        needsRedraw: true
    };
    position = { x: 0, y: 0 };
    dimensions = { width: 0, height: 0 };
    dispose() {
        // Default implementation - override if needed
    }
    getState() {
        return { ...this.state };
    }
    show() {
        this.state.isVisible = true;
        this.invalidate();
    }
    hide() {
        this.state.isVisible = false;
        this.state.isFocused = false;
    }
    focus() {
        this.state.isFocused = true;
        this.invalidate();
    }
    blur() {
        this.state.isFocused = false;
        this.invalidate();
    }
    setPosition(position) {
        this.position = { ...position };
        this.invalidate();
    }
    setDimensions(dimensions) {
        this.dimensions = { ...dimensions };
        this.invalidate();
    }
    getPosition() {
        return { ...this.position };
    }
    getDimensions() {
        return { ...this.dimensions };
    }
    onResize(dimensions) {
        this.setDimensions(dimensions);
    }
    invalidate() {
        this.state.needsRedraw = true;
    }
    update(deltaTime) {
        // Default implementation - override for animations
    }
    markAsDrawn() {
        this.state.needsRedraw = false;
    }
}
//# sourceMappingURL=IView.js.map