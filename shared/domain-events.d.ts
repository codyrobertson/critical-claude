/**
 * Simple Events - No overcomplicated event sourcing
 * Basic event system for loose coupling
 */
export interface SimpleEvent {
    type: string;
    data: Record<string, any>;
    timestamp: Date;
}
export declare class EventEmitter {
    private listeners;
    emit(event: SimpleEvent): void;
    on(eventType: string, handler: Function): void;
    off(eventType: string, handler: Function): void;
}
export declare const eventBus: EventEmitter;
//# sourceMappingURL=domain-events.d.ts.map