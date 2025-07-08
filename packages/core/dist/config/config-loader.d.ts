/**
 * Configuration loader for Critical Claude MCP
 * Loads and validates configuration from config.toml
 */
export interface CriticalClaudeConfig {
    web_search?: {
        enabled: boolean;
        exa_api_key?: string;
        search_depth: string;
        fact_checking?: boolean;
        vulnerability_scanning?: boolean;
    };
    general: {
        log_level: string;
        max_files: number;
        max_file_size_mb: number;
        max_files_per_type: number;
        max_directory_depth: number;
    };
    security: {
        allowed_paths: string[];
        blocked_paths: string[];
    };
    brutal_plan: {
        base_multipliers: Record<string, number>;
        complexity_factors: Record<string, number>;
        efficiency_factors: Record<string, number>;
        team_adjustments: {
            solo_dev_multiplier: number;
            deadline_pressure_multiplier: number;
        };
        phases: {
            research_percent: number;
            implementation_percent: number;
            hardening_percent: number;
        };
    };
    critique: {
        severity_thresholds: Record<string, {
            security_threshold: string;
            performance_threshold: string;
            over_engineering_alert: boolean;
        }>;
        code_smells: {
            max_function_lines: number;
            max_file_lines: number;
            max_cyclomatic_complexity: number;
            max_nesting_depth: number;
            min_test_coverage: number;
        };
    };
    architecture: {
        patterns: Record<string, string[]>;
        anti_patterns: {
            small_app_microservices_threshold: number;
            large_app_no_structure_threshold: number;
            too_many_dependencies_threshold: number;
        };
    };
    monitoring: {
        performance: {
            slow_operation_threshold_ms: number;
            memory_limit_mb: number;
            cpu_threshold_percent: number;
        };
    };
}
declare class ConfigLoader {
    private static instance;
    private config;
    private configPath;
    private constructor();
    private findConfigPath;
    static getInstance(): ConfigLoader;
    loadConfig(): Promise<CriticalClaudeConfig>;
    private validateConfig;
    private getDefaultConfig;
    getConfig(): CriticalClaudeConfig | null;
    reloadConfig(): Promise<CriticalClaudeConfig>;
    private isValidHomeDirectory;
    private isValidConfigPath;
}
export declare const configLoader: ConfigLoader;
export declare function getConfig(): Promise<CriticalClaudeConfig>;
export {};
//# sourceMappingURL=config-loader.d.ts.map