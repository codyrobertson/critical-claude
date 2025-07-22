
/**
 * Domain Path Resolver
 * Provides standardized path resolution for DDD domains
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(__filename, '../..');

export class DomainPathResolver {
  static getDomainRoot(domain: string): string {
    return path.join(rootDir, 'domains', domain);
  }
  
  static getDomainSrc(domain: string): string {
    return path.join(this.getDomainRoot(domain), 'src');
  }
  
  static getDomainDist(domain: string): string {
    return path.join(this.getDomainRoot(domain), 'dist');
  }
  
  static getEntity(domain: string, entity: string): string {
    return path.join(this.getDomainSrc(domain), 'domain', 'entities', entity);
  }
  
  static getUseCase(domain: string, useCase: string): string {
    return path.join(this.getDomainSrc(domain), 'application', 'use-cases', useCase);
  }
  
  static getRepository(domain: string, repo: string): string {
    return path.join(this.getDomainSrc(domain), 'domain', 'repositories', repo);
  }
  
  static getInfrastructure(component: string): string {
    return path.join(rootDir, 'infrastructure', component);
  }
  
  static getSharedKernel(): string {
    return path.join(rootDir, 'infrastructure', 'shared-kernel');
  }
}

// Domain registry for dependency injection
export const DOMAIN_REGISTRY = {
  'task-management': 'task-management',
  'project-management': 'project-management',
  'research-intelligence': 'research-intelligence',
  'template-system': 'template-system',
  'integration-layer': 'integration-layer',
  'user-interface': 'user-interface'
};

export const INFRASTRUCTURE_REGISTRY = {
  'shared-kernel': 'shared-kernel',
  'infrastructure': 'infrastructure'
};
