/**
 * Path validation utilities to prevent security vulnerabilities
 */
export declare class PathValidator {
    private static readonly BLOCKED_PATHS;
    /**
     * Validates and normalizes a root path for codebase analysis
     * @param rootPath The path to validate
     * @returns Normalized absolute path
     * @throws Error if path is invalid or inaccessible
     */
    static validateRootPath(rootPath: string): Promise<string>;
    /**
     * Checks if a path is safe to read
     * @param filePath The file path to check
     * @param rootPath The validated root path
     * @returns true if safe to read
     */
    static isSafeToRead(filePath: string, rootPath: string): boolean;
}
//# sourceMappingURL=path-validator.d.ts.map