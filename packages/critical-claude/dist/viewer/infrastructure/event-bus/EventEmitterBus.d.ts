/**
 * Event Emitter Bus Implementation
 * Uses Node.js EventEmitter for event handling
 */
import { IEventBus, EventHandler } from '../../application/ports/IEventBus.js';
import { DomainEvent } from '../../domain/events/DomainEvent.js';
import { ILogger } from '../../application/ports/ILogger.js';
export declare class EventEmitterBus implements IEventBus {
    private logger;
    private emitter;
    private allHandlers;
    constructor(logger: ILogger);
    publish(event: DomainEvent): Promise<void>;
    publishMany(events: DomainEvent[]): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void;
    subscribeAll(handler: EventHandler<DomainEvent>): () => void;
    removeAllListeners(eventType?: string): void;
    getEventNames(): string[];
    listenerCount(eventType: string): number;
}
//# sourceMappingURL=EventEmitterBus.d.ts.map