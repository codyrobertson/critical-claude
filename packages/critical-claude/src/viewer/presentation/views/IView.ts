/**
 * View Interface
 * Base interface for all views in the presentation layer
 */

import { Position, Dimensions } from '../../application/ports/ITerminalUI';

export interface ViewState {
  isVisible: boolean;
  isFocused: boolean;
  needsRedraw: boolean;
}

export interface IView {
  // Lifecycle
  initialize(): Promise<void>;
  render(): void;
  dispose(): void;

  // State management
  getState(): ViewState;
  show(): void;
  hide(): void;
  focus(): void;
  blur(): void;

  // Layout
  setPosition(position: Position): void;
  setDimensions(dimensions: Dimensions): void;
  getPosition(): Position;
  getDimensions(): Dimensions;

  // Events
  onKeyPress(key: string, modifiers: KeyModifiers): boolean; // Returns true if handled
  onResize(dimensions: Dimensions): void;

  // Update
  invalidate(): void; // Mark for redraw
  update(deltaTime: number): void; // For animations
}

export interface KeyModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export abstract class BaseView implements IView {
  protected state: ViewState = {
    isVisible: false,
    isFocused: false,
    needsRedraw: true
  };

  protected position: Position = { x: 0, y: 0 };
  protected dimensions: Dimensions = { width: 0, height: 0 };

  abstract initialize(): Promise<void>;
  abstract render(): void;
  abstract onKeyPress(key: string, modifiers: KeyModifiers): boolean;

  dispose(): void {
    // Default implementation - override if needed
  }

  getState(): ViewState {
    return { ...this.state };
  }

  show(): void {
    this.state.isVisible = true;
    this.invalidate();
  }

  hide(): void {
    this.state.isVisible = false;
    this.state.isFocused = false;
  }

  focus(): void {
    this.state.isFocused = true;
    this.invalidate();
  }

  blur(): void {
    this.state.isFocused = false;
    this.invalidate();
  }

  setPosition(position: Position): void {
    this.position = { ...position };
    this.invalidate();
  }

  setDimensions(dimensions: Dimensions): void {
    this.dimensions = { ...dimensions };
    this.invalidate();
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getDimensions(): Dimensions {
    return { ...this.dimensions };
  }

  onResize(dimensions: Dimensions): void {
    this.setDimensions(dimensions);
  }

  invalidate(): void {
    this.state.needsRedraw = true;
  }

  update(deltaTime: number): void {
    // Default implementation - override for animations
  }

  protected markAsDrawn(): void {
    this.state.needsRedraw = false;
  }
}