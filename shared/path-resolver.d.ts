/**
 * Domain Path Resolver
 * Provides standardized path resolution for DDD domains
 */
export declare class DomainPathResolver {
    static getDomainRoot(domain: string): string;
    static getDomainSrc(domain: string): string;
    static getDomainDist(domain: string): string;
    static getEntity(domain: string, entity: string): string;
    static getUseCase(domain: string, useCase: string): string;
    static getRepository(domain: string, repo: string): string;
    static getInfrastructure(component: string): string;
    static getSharedKernel(): string;
}
export declare const DOMAIN_REGISTRY: {
    'task-management': string;
    'project-management': string;
    'research-intelligence': string;
    'template-system': string;
    'integration-layer': string;
    'user-interface': string;
};
export declare const INFRASTRUCTURE_REGISTRY: {
    'shared-kernel': string;
    infrastructure: string;
};
//# sourceMappingURL=path-resolver.d.ts.map