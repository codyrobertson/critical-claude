/**
 * Web Search Tool for Research Agents - Migrated from legacy tools/web-search.ts
 * Provides search capabilities using multiple search providers
 */
export interface SearchOptions {
    maxResults?: number;
    includeSnippets?: boolean;
    domains?: string[];
    language?: string;
}
export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    domain: string;
    relevanceScore?: number;
}
export declare class WebSearch {
    private apiKey?;
    constructor();
    search(query: string, options?: SearchOptions): Promise<string>;
    searchStructured(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    private realSearch;
    private realSearchStructured;
    private searchWithSerpApi;
    private searchStructuredWithSerpApi;
    private searchWithGoogleApi;
    private searchStructuredWithGoogleApi;
    private formatSearchResults;
    private simulateSearch;
    private simulateSearchStructured;
    batchSearch(queries: string[], options?: SearchOptions): Promise<Map<string, SearchResult[]>>;
    private delay;
}
//# sourceMappingURL=WebSearch.d.ts.map