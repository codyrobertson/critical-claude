/**
 * Research Repository Interface
 * Repository for research project persistence and retrieval
 */
import { ResearchProject } from '../entities/ResearchProject.js';
export interface IResearchRepository {
    findById(id: string): Promise<ResearchProject | null>;
    findAll(): Promise<ResearchProject[]>;
    findByQuery(query: string): Promise<ResearchProject[]>;
    save(project: ResearchProject): Promise<void>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed'): Promise<ResearchProject[]>;
    findRecent(limit: number): Promise<ResearchProject[]>;
}
//# sourceMappingURL=IResearchRepository.d.ts.map