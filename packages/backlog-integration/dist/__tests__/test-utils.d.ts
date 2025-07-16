/**
 * Test utilities and helpers
 */
/**
 * Create a mock BacklogManager for testing
 */
export declare function createMockBacklogManager(): any;
/**
 * Create mock file system operations
 */
export declare function mockFileSystem(): {
    access: import("jest-mock").SpiedClass<any>;
    mkdir: import("jest-mock").SpiedClass<any>;
    readdir: import("jest-mock").SpiedClass<any>;
    readFile: import("jest-mock").SpiedClass<any>;
    writeFile: import("jest-mock").SpiedClass<any>;
    unlink: import("jest-mock").SpiedClass<any>;
};
/**
 * Create mock child process operations
 */
export declare function mockChildProcess(): import("jest-mock").SpiedClass<any>;
/**
 * Mock console methods with optional capture
 */
export declare function mockConsole(): {
    log: import("jest-mock").SpiedFunction<{
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    }>;
    error: import("jest-mock").SpiedFunction<{
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    }>;
    warn: import("jest-mock").SpiedFunction<{
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    }>;
    info: import("jest-mock").SpiedFunction<{
        (...data: any[]): void;
        (message?: any, ...optionalParams: any[]): void;
    }>;
    clear: import("jest-mock").SpiedFunction<{
        (): void;
        (): void;
    }>;
};
/**
 * Mock process.stdout for testing terminal output
 */
export declare function mockProcessStdout(): import("jest-mock").SpiedFunction<{
    (buffer: Uint8Array | string, cb?: (err?: Error | null) => void): boolean;
    (str: Uint8Array | string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;
}>;
/**
 * Create a test task with realistic data
 */
export declare function createTestTask(overrides?: any): any;
/**
 * Create a test Claude Code todo
 */
export declare function createTestClaudeCodeTodo(overrides?: any): any;
/**
 * Wait for async operations to complete
 */
export declare function waitForAsync(ms?: number): Promise<unknown>;
/**
 * Test helper for natural language parsing
 */
export declare const naturalLanguageTestCases: {
    priorities: {
        text: string;
        expected: string;
    }[];
    labels: {
        text: string;
        expected: string[];
    }[];
    storyPoints: {
        text: string;
        expected: number;
    }[];
    assignees: ({
        text: string;
        expected: string;
    } | {
        text: string;
        expected: undefined;
    })[];
};
/**
 * Performance testing helper
 */
export declare function measurePerformance<T>(operation: () => Promise<T>, maxDurationMs?: number): Promise<{
    result: T;
    duration: number;
    withinLimit: boolean;
}>;
/**
 * Mock environment setup for different test scenarios
 */
export declare function setupTestEnvironment(scenario: 'development' | 'production' | 'ci'): () => void;
//# sourceMappingURL=test-utils.d.ts.map