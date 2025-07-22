/**
 * Template Service
 * Simplified template service that delegates to legacy implementation
 */
import { Result } from '../../shared/types.js';
export interface TemplateRequest {
    templateName: string;
    outputDir?: string;
    variables?: Record<string, string>;
}
export interface TemplateResponse extends Result<string> {
    outputPath?: string;
}
export declare class TemplateService {
    executeTemplate(request: TemplateRequest): Promise<TemplateResponse>;
    listTemplates(): Promise<Result<string[]>>;
}
//# sourceMappingURL=TemplateService.d.ts.map