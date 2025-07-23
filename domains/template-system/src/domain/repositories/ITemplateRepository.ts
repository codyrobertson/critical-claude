/**
 * Template Repository Interface
 * Repository for template persistence and retrieval
 */

import { Template, TemplateId } from '../entities/Template.js';

export interface ITemplateRepository {
  findById(id: string): Promise<Template | null>;
  findAll(): Promise<Template[]>;
  findByName(name: string): Promise<Template | null>;
  save(template: Template): Promise<void>;
  delete(id: string): Promise<boolean>;
  
  // Template-specific methods
  findByTag(tag: string): Promise<Template[]>;
  findBuiltIn(): Promise<Template[]>;
  findUserCreated(): Promise<Template[]>;
}