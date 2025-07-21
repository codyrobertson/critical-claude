/**
 * Event Emitter Bus Implementation
 * Uses Node.js EventEmitter for event handling
 */

import { EventEmitter } from 'events';
import { IEventBus, EventHandler } from '../../application/ports/IEventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { ILogger } from '../../application/ports/ILogger';

export class EventEmitterBus implements IEventBus {
  private emitter: EventEmitter;
  private allHandlers: Set<EventHandler<DomainEvent>> = new Set();

  constructor(private logger: ILogger) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Increase limit for many subscribers
  }

  async publish(event: DomainEvent): Promise<void> {
    this.logger.debug('Publishing event', {
      type: event.type,
      aggregateId: event.aggregateId
    });

    try {
      // Emit specific event type
      this.emitter.emit(event.type, event);
      
      // Emit to all handlers
      for (const handler of this.allHandlers) {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error('All-handler error', error as Error, { event });
        }
      }
    } catch (error) {
      this.logger.error('Failed to publish event', error as Error, { event });
      throw error;
    }
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    this.logger.debug('Subscribing to event', { eventType });

    const wrappedHandler = async (event: T) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error('Event handler error', error as Error, {
          eventType,
          event
        });
      }
    };

    this.emitter.on(eventType, wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.logger.debug('Unsubscribing from event', { eventType });
      this.emitter.off(eventType, wrappedHandler);
    };
  }

  subscribeAll(handler: EventHandler<DomainEvent>): () => void {
    this.logger.debug('Subscribing to all events');
    
    this.allHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.logger.debug('Unsubscribing from all events');
      this.allHandlers.delete(handler);
    };
  }

  // Additional utility methods

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.emitter.removeAllListeners(eventType);
    } else {
      this.emitter.removeAllListeners();
      this.allHandlers.clear();
    }
  }

  getEventNames(): string[] {
    return this.emitter.eventNames() as string[];
  }

  listenerCount(eventType: string): number {
    return this.emitter.listenerCount(eventType);
  }
}