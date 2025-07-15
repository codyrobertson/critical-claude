/**
 * Configuration loader for Critical Claude MCP
 * Loads and validates configuration from config.toml
 */
import fs from 'fs/promises';
import path from 'path';
import toml from '@iarna/toml';
import { logger } from '../logger/logger.js';
class ConfigLoader {
    static instance;
    config = null;
    configPath;
    constructor() {
        // Default to cwd
        this.configPath = path.join(process.cwd(), 'config.toml');
    }
    async findConfigPath() {
        // Look for config in multiple locations with security validation
        const possiblePaths = [
            path.resolve(process.cwd(), 'config.toml'),
            path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'config.toml'),
        ];
        // Only include home directory if it's safe
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir && this.isValidHomeDirectory(homeDir)) {
            possiblePaths.push(path.resolve(homeDir, '.critical-claude', 'config.toml'));
        }
        for (const configPath of possiblePaths) {
            try {
                // Validate path is safe before accessing
                if (!this.isValidConfigPath(configPath)) {
                    logger.warn('Invalid config path rejected', { path: configPath });
                    continue;
                }
                await fs.access(configPath, fs.constants.R_OK);
                this.configPath = configPath;
                break;
            }
            catch {
                // Continue to next path
            }
        }
    }
    static getInstance() {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }
    async loadConfig() {
        if (this.config) {
            return this.config;
        }
        // Find config file
        await this.findConfigPath();
        try {
            const configContent = await fs.readFile(this.configPath, 'utf-8');
            const parsed = toml.parse(configContent);
            // Validate required sections exist
            this.validateConfig(parsed);
            this.config = parsed;
            logger.info('Configuration loaded successfully', { path: this.configPath });
            return this.config;
        }
        catch (error) {
            logger.error('Failed to load configuration', { path: this.configPath }, error);
            // Return default configuration
            return this.getDefaultConfig();
        }
    }
    validateConfig(config) {
        const requiredSections = [
            'general',
            'security',
            'brutal_plan',
            'critique',
            'architecture',
            'monitoring',
        ];
        for (const section of requiredSections) {
            if (!config[section]) {
                throw new Error(`Missing required config section: ${section}`);
            }
        }
        // Validate phase percentages sum to 100
        const phases = config.brutal_plan?.phases;
        if (phases) {
            const sum = phases.research_percent + phases.implementation_percent + phases.hardening_percent;
            if (sum !== 100) {
                throw new Error(`Phase percentages must sum to 100, got ${sum}`);
            }
        }
    }
    getDefaultConfig() {
        return {
            general: {
                log_level: 'info',
                max_files: 50000,
                max_file_size_mb: 10,
                max_files_per_type: 1000,
                max_directory_depth: 20,
            },
            security: {
                allowed_paths: ['~/code/**', '~/projects/**', '/tmp/**'],
                blocked_paths: ['/etc/**', '/System/**', '**/.ssh/**'],
            },
            brutal_plan: {
                base_multipliers: {
                    auth: 3.5,
                    payment: 5.0,
                    search: 3.0,
                    upload: 4.0,
                    realtime: 4.5,
                    migration: 6.0,
                    api: 3.0,
                    dashboard: 3.5,
                    integration: 4.0,
                    notification: 3.5,
                    crud: 2.0,
                    reporting: 3.5,
                    admin: 3.0,
                    default: 2.5,
                },
                complexity_factors: {
                    legacy_integration: 1.5,
                    distributed: 1.4,
                    high_scale: 1.3,
                    realtime_sync: 1.3,
                    multi_tenant: 1.4,
                    offline_support: 1.3,
                    pci_compliance: 1.5,
                    hipaa_compliance: 1.6,
                    gdpr_compliance: 1.3,
                    sox_compliance: 1.4,
                    security_critical: 1.4,
                    multiple_apis: 1.3,
                    unstable_apis: 1.5,
                    custom_protocol: 1.4,
                    first_time_tech: 1.4,
                    remote_team: 1.2,
                    multiple_timezones: 1.3,
                    junior_heavy: 1.5,
                    no_qa: 1.4,
                    vague_requirements: 1.5,
                    changing_requirements: 1.4,
                    multiple_stakeholders: 1.3,
                    ui_heavy: 1.3,
                    algorithm_heavy: 1.4,
                },
                efficiency_factors: {
                    existing_codebase: 0.8,
                    well_documented_api: 0.9,
                    experienced_team: 0.85,
                    simple_ui: 0.9,
                    internal_only: 0.9,
                    prototype_quality: 0.7,
                    no_migration: 0.85,
                },
                team_adjustments: {
                    solo_dev_multiplier: 1.3,
                    deadline_pressure_multiplier: 1.2,
                },
                phases: {
                    research_percent: 20,
                    implementation_percent: 50,
                    hardening_percent: 30,
                },
            },
            critique: {
                severity_thresholds: {
                    cli: {
                        security_threshold: 'medium',
                        performance_threshold: 'low',
                        over_engineering_alert: true,
                    },
                    web_small: {
                        security_threshold: 'high',
                        performance_threshold: 'medium',
                        over_engineering_alert: true,
                    },
                    web_large: {
                        security_threshold: 'critical',
                        performance_threshold: 'high',
                        over_engineering_alert: false,
                    },
                    enterprise: {
                        security_threshold: 'critical',
                        performance_threshold: 'high',
                        over_engineering_alert: false,
                    },
                },
                code_smells: {
                    max_function_lines: 50,
                    max_file_lines: 500,
                    max_cyclomatic_complexity: 10,
                    max_nesting_depth: 4,
                    min_test_coverage: 80,
                },
            },
            architecture: {
                patterns: {
                    mvc: ['controllers', 'models', 'views'],
                    ddd: ['domain', 'services', 'repositories', 'aggregates'],
                    hexagonal: ['adapters', 'ports', 'application', 'domain'],
                    microservices: ['api-gateway', 'service-', 'docker-compose'],
                    monolith: ['src', 'app', 'lib'],
                },
                anti_patterns: {
                    small_app_microservices_threshold: 100,
                    large_app_no_structure_threshold: 1000,
                    too_many_dependencies_threshold: 50,
                },
            },
            monitoring: {
                performance: {
                    slow_operation_threshold_ms: 1000,
                    memory_limit_mb: 512,
                    cpu_threshold_percent: 80,
                },
            },
        };
    }
    getConfig() {
        return this.config;
    }
    async reloadConfig() {
        this.config = null;
        return this.loadConfig();
    }
    isValidHomeDirectory(homeDir) {
        // Ensure home directory is absolute and exists
        if (!path.isAbsolute(homeDir))
            return false;
        // Check against common injection patterns
        const suspicious = ['..', '/etc', '/root', '/var', '/usr', '/bin', '/sbin'];
        if (suspicious.some(pattern => homeDir.includes(pattern))) {
            logger.warn('Suspicious home directory blocked', { homeDir });
            return false;
        }
        return true;
    }
    isValidConfigPath(configPath) {
        const normalizedPath = path.normalize(configPath);
        // Must be absolute path
        if (!path.isAbsolute(normalizedPath))
            return false;
        // Must end with config.toml
        if (!normalizedPath.endsWith('config.toml'))
            return false;
        // Must not contain path traversal
        if (normalizedPath.includes('..'))
            return false;
        // Must be in allowed directories
        const allowedParents = [
            path.resolve(process.cwd()),
            path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'),
            process.env.HOME ? path.resolve(process.env.HOME, '.critical-claude') : null
        ].filter(Boolean);
        return allowedParents.some(parent => normalizedPath.startsWith(parent));
    }
}
// Export singleton instance
export const configLoader = ConfigLoader.getInstance();
// Export convenience function
export async function getConfig() {
    return configLoader.loadConfig();
}
//# sourceMappingURL=config-loader.js.map