/**
 * Fuzzy Search Utilities
 * Advanced fuzzy search implementation for task searching
 */
export class FuzzySearch {
    options;
    constructor(options) {
        this.options = {
            threshold: 0.6,
            ignoreCase: true,
            ignoreWhitespace: true,
            minMatchLength: 1,
            ...options
        };
    }
    search(items, query, fields) {
        const normalizedQuery = this.normalize(query);
        if (normalizedQuery.length < this.options.minMatchLength) {
            return [];
        }
        const results = [];
        for (const item of items) {
            const matches = [];
            let totalScore = 0;
            for (const field of fields) {
                const fieldName = typeof field === 'function' ? 'custom' : String(field);
                const fieldValue = typeof field === 'function'
                    ? field(item)
                    : String(item[field]);
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
    fuzzyMatch(query, text) {
        const indices = [];
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
            }
            else {
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
    normalize(text) {
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
export function levenshteinDistance(a, b) {
    const matrix = [];
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
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
// Similarity score based on Levenshtein distance
export function similarity(a, b) {
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
}
// N-gram based search
export class NGramSearch {
    ngramSize;
    constructor(ngramSize = 3) {
        this.ngramSize = ngramSize;
    }
    generateNGrams(text) {
        const ngrams = new Set();
        const padded = ' '.repeat(this.ngramSize - 1) + text + ' '.repeat(this.ngramSize - 1);
        for (let i = 0; i < padded.length - this.ngramSize + 1; i++) {
            ngrams.add(padded.slice(i, i + this.ngramSize));
        }
        return ngrams;
    }
    similarity(text1, text2) {
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
//# sourceMappingURL=fuzzy-search.js.map