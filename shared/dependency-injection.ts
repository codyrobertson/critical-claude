
/**
 * Simple Service Registry
 * Basic service registry without complex DI
 */

// Simple service registry - no overcomplicated DI framework
export class ServiceRegistry {
  private services = new Map<string, any>();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

// Factory function to create service registry instances
export const createServiceRegistry = (): ServiceRegistry => new ServiceRegistry();
