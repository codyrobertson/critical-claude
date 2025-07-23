/**
 * View Interface
 * Base interface for all views in the presentation layer
 */
import { Position, Dimensions } from '../../application/ports/ITerminalUI.js';
export interface ViewState {
    isVisible: boolean;
    isFocused: boolean;
    needsRedraw: boolean;
}
export interface IView {
    initialize(): Promise<void>;
    render(): void;
    dispose(): void;
    getState(): ViewState;
    show(): void;
    hide(): void;
    focus(): void;
    blur(): void;
    setPosition(position: Position): void;
    setDimensions(dimensions: Dimensions): void;
    getPosition(): Position;
    getDimensions(): Dimensions;
    onKeyPress(key: string, modifiers: KeyModifiers): boolean;
    onResize(dimensions: Dimensions): void;
    invalidate(): void;
    update(deltaTime: number): void;
}
export interface KeyModifiers {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}
export declare abstract class BaseView implements IView {
    protected state: ViewState;
    protected position: Position;
    protected dimensions: Dimensions;
    abstract initialize(): Promise<void>;
    abstract render(): void;
    abstract onKeyPress(key: string, modifiers: KeyModifiers): boolean;
    dispose(): void;
    getState(): ViewState;
    show(): void;
    hide(): void;
    focus(): void;
    blur(): void;
    setPosition(position: Position): void;
    setDimensions(dimensions: Dimensions): void;
    getPosition(): Position;
    getDimensions(): Dimensions;
    onResize(dimensions: Dimensions): void;
    invalidate(): void;
    update(deltaTime: number): void;
    protected markAsDrawn(): void;
}
//# sourceMappingURL=IView.d.ts.map