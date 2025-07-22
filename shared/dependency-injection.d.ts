/**
 * Simple Service Registry
 * Basic service registry without complex DI
 */
export declare class ServiceRegistry {
    private services;
    register<T>(name: string, service: T): void;
    get<T>(name: string): T;
    has(name: string): boolean;
}
export declare const services: ServiceRegistry;
//# sourceMappingURL=dependency-injection.d.ts.map