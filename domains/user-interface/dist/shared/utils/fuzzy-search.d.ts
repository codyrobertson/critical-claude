/**
 * Fuzzy Search Utilities
 * Advanced fuzzy search implementation for task searching
 */
export interface FuzzySearchOptions {
    threshold: number;
    ignoreCase: boolean;
    ignoreWhitespace: boolean;
    minMatchLength: number;
}
export interface FuzzySearchResult<T> {
    item: T;
    score: number;
    matches: FuzzyMatch[];
}
export interface FuzzyMatch {
    field: string;
    value: string;
    indices: Array<[number, number]>;
}
export declare class FuzzySearch<T> {
    private options;
    constructor(options?: Partial<FuzzySearchOptions>);
    search(items: T[], query: string, fields: Array<keyof T | ((item: T) => string)>): FuzzySearchResult<T>[];
    private fuzzyMatch;
    private normalize;
}
export declare function levenshteinDistance(a: string, b: string): number;
export declare function similarity(a: string, b: string): number;
export declare class NGramSearch {
    private ngramSize;
    constructor(ngramSize?: number);
    generateNGrams(text: string): Set<string>;
    similarity(text1: string, text2: string): number;
}
//# sourceMappingURL=fuzzy-search.d.ts.map