/**
 * Event Emitter Bus Implementation
 * Uses Node.js EventEmitter for event handling
 */
import { EventEmitter } from 'events';
export class EventEmitterBus {
    logger;
    emitter;
    allHandlers = new Set();
    constructor(logger) {
        this.logger = logger;
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100); // Increase limit for many subscribers
    }
    async publish(event) {
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
                }
                catch (error) {
                    this.logger.error('All-handler error', error, { event });
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to publish event', error, { event });
            throw error;
        }
    }
    async publishMany(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    subscribe(eventType, handler) {
        this.logger.debug('Subscribing to event', { eventType });
        const wrappedHandler = async (event) => {
            try {
                await handler(event);
            }
            catch (error) {
                this.logger.error('Event handler error', error, {
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
    subscribeAll(handler) {
        this.logger.debug('Subscribing to all events');
        this.allHandlers.add(handler);
        // Return unsubscribe function
        return () => {
            this.logger.debug('Unsubscribing from all events');
            this.allHandlers.delete(handler);
        };
    }
    // Additional utility methods
    removeAllListeners(eventType) {
        if (eventType) {
            this.emitter.removeAllListeners(eventType);
        }
        else {
            this.emitter.removeAllListeners();
            this.allHandlers.clear();
        }
    }
    getEventNames() {
        return this.emitter.eventNames();
    }
    listenerCount(eventType) {
        return this.emitter.listenerCount(eventType);
    }
}
//# sourceMappingURL=EventEmitterBus.js.map