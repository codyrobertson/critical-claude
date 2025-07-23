/**
 * Event Bus Port Interface
 * Defines contract for event publishing and subscription
 */
import { DomainEvent } from '../../domain/events/DomainEvent.js';
export type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void;
export interface IEventBus {
    publish(event: DomainEvent): Promise<void>;
    publishMany(events: DomainEvent[]): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void;
    subscribeAll(handler: EventHandler<DomainEvent>): () => void;
}
//# sourceMappingURL=IEventBus.d.ts.map