/**
 * Fuzzy Search Utilities
 * Advanced fuzzy search implementation for task searching
 */

export interface FuzzySearchOptions {
  threshold: number; // 0-1, lower is more strict
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
  indices: Array<[number, number]>; // Start and end indices of matches
}

export class FuzzySearch<T> {
  private options: FuzzySearchOptions;

  constructor(options?: Partial<FuzzySearchOptions>) {
    this.options = {
      threshold: 0.6,
      ignoreCase: true,
      ignoreWhitespace: true,
      minMatchLength: 1,
      ...options
    };
  }

  search(
    items: T[],
    query: string,
    fields: Array<keyof T | ((item: T) => string)>
  ): FuzzySearchResult<T>[] {
    const normalizedQuery = this.normalize(query);
    if (normalizedQuery.length < this.options.minMatchLength) {
      return [];
    }

    const results: FuzzySearchResult<T>[] = [];

    for (const item of items) {
      const matches: FuzzyMatch[] = [];
      let totalScore = 0;

      for (const field of fields) {
        const fieldName = typeof field === 'function' ? 'custom' : String(field);
        const fieldValue = typeof field === 'function' 
          ? field(item) 
          : String((item as any)[field]);
        
        const normalizedValue = this.normalize(fieldValue);
        const match = this.fuzzyMatch(normalizedQuery, normalizedValue);

        if (match.score > 0) {
          matches.push({
            field: fieldName,
            value: fieldValue,
            indices: match.indices
          });
          totalScore += match.score;
        }
      }

      if (totalScore > 0) {
        results.push({
          item,
          score: totalScore / fields.length,
          matches
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Filter by threshold
    return results.filter(r => r.score >= this.options.threshold);
  }

  private fuzzyMatch(
    query: string,
    text: string
  ): { score: number; indices: Array<[number, number]> } {
    const indices: Array<[number, number]> = [];
    let score = 0;

    // Exact match
    const exactIndex = text.indexOf(query);
    if (exactIndex !== -1) {
      indices.push([exactIndex, exactIndex + query.length - 1]);
      return { score: 1, indices };
    }

    // Fuzzy match
    let queryIndex = 0;
    let textIndex = 0;
    let matchStart = -1;
    let consecutiveMatches = 0;

    while (queryIndex < query.length && textIndex < text.length) {
      if (query[queryIndex] === text[textIndex]) {
        if (matchStart === -1) {
          matchStart = textIndex;
        }
        
        queryIndex++;
        consecutiveMatches++;
        
        if (queryIndex === query.length || 
            (textIndex + 1 < text.length && query[queryIndex] !== text[textIndex + 1])) {
          indices.push([matchStart, textIndex]);
          matchStart = -1;
        }
      } else {
        if (matchStart !== -1) {
          consecutiveMatches = 0;
        }
      }
      
      textIndex++;
    }

    // Calculate score based on various factors
    if (queryIndex === query.length) {
      const coverage = query.length / text.length;
      const consecutiveBonus = Math.pow(consecutiveMatches / query.length, 2);
      const positionBonus = 1 - (indices[0]?.[0] || 0) / text.length;
      
      score = (coverage + consecutiveBonus + positionBonus) / 3;
    }

    return { score, indices };
  }

  private normalize(text: string): string {
    let normalized = text;
    
    if (this.options.ignoreCase) {
      normalized = normalized.toLowerCase();
    }
    
    if (this.options.ignoreWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }
    
    return normalized;
  }
}

// Levenshtein distance for similarity calculation
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Similarity score based on Levenshtein distance
export function similarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// N-gram based search
export class NGramSearch {
  private ngramSize: number;

  constructor(ngramSize: number = 3) {
    this.ngramSize = ngramSize;
  }

  generateNGrams(text: string): Set<string> {
    const ngrams = new Set<string>();
    const padded = ' '.repeat(this.ngramSize - 1) + text + ' '.repeat(this.ngramSize - 1);
    
    for (let i = 0; i < padded.length - this.ngramSize + 1; i++) {
      ngrams.add(padded.slice(i, i + this.ngramSize));
    }
    
    return ngrams;
  }

  similarity(text1: string, text2: string): number {
    const ngrams1 = this.generateNGrams(text1.toLowerCase());
    const ngrams2 = this.generateNGrams(text2.toLowerCase());
    
    let intersection = 0;
    for (const ngram of ngrams1) {
      if (ngrams2.has(ngram)) {
        intersection++;
      }
    }
    
    const union = ngrams1.size + ngrams2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}