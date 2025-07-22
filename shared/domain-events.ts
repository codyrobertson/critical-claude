/**
 * Simple Events - No overcomplicated event sourcing
 * Basic event system for loose coupling
 */

// Simple event interface
export interface SimpleEvent {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}

// Simple event emitter
export class EventEmitter {
  private listeners = new Map<string, Function[]>();

  emit(event: SimpleEvent): void {
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
      }
    });
  }

  on(eventType: string, handler: Function): void {
    const handlers = this.listeners.get(eventType) || [];
    handlers.push(handler);
    this.listeners.set(eventType, handlers);
  }

  off(eventType: string, handler: Function): void {
    const handlers = this.listeners.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}

// Global event bus
export const eventBus = new EventEmitter();