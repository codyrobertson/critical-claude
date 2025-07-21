/**
 * Event Emitter Bus Implementation
 * Uses Node.js EventEmitter for event handling
 */
import { IEventBus, EventHandler } from '../../application/ports/IEventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { ILogger } from '../../application/ports/ILogger';
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