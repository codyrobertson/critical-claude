/**
 * Simple Service Registry
 * Basic service registry without complex DI
 */
// Simple service registry - no overcomplicated DI framework
export class ServiceRegistry {
    services = new Map();
    register(name, service) {
        this.services.set(name, service);
    }
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service;
    }
    has(name) {
        return this.services.has(name);
    }
}
// Global registry instance
export const services = new ServiceRegistry();
//# sourceMappingURL=dependency-injection.js.map