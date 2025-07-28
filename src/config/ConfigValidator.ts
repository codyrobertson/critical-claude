/**
 * Configuration Validation
 * Validates CLI configuration and fails fast on startup
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CLIConfig {
  storagePath?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  analytics?: {
    enabled?: boolean;
    retentionDays?: number;
  };
  templates?: {
    customPath?: string;
  };
  viewer?: {
    theme?: 'dark' | 'light';
    pageSize?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config: CLIConfig;
}

export class ConfigValidator {
  private static readonly DEFAULT_CONFIG: Required<CLIConfig> = {
    storagePath: path.join(os.homedir(), '.critical-claude'),
    logLevel: 'info',
    analytics: {
      enabled: true,
      retentionDays: 30
    },
    templates: {
      customPath: path.join(os.homedir(), '.critical-claude', 'templates')
    },
    viewer: {
      theme: 'dark',
      pageSize: 20
    }
  };

  private static readonly CONFIG_SCHEMA = {
    storagePath: { type: 'string', required: false },
    logLevel: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], required: false },
    analytics: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', required: false },
        retentionDays: { type: 'number', min: 1, max: 365, required: false }
      },
      required: false
    },
    templates: {
      type: 'object',
      properties: {
        customPath: { type: 'string', required: false }
      },
      required: false
    },
    viewer: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['dark', 'light'], required: false },
        pageSize: { type: 'number', min: 5, max: 100, required: false }
      },
      required: false
    }
  };

  static async loadAndValidate(configPath?: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let userConfig: Partial<CLIConfig> = {};

    // Try to load user config
    if (configPath) {
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        userConfig = JSON.parse(configContent);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          warnings.push(`Config file not found: ${configPath}, using defaults`);
        } else if (error instanceof SyntaxError) {
          errors.push(`Invalid JSON in config file: ${error.message}`);
        } else {
          errors.push(`Failed to read config file: ${error.message}`);
        }
      }
    } else {
      // Try default locations
      const defaultPaths = [
        path.join(os.homedir(), '.critical-claude', 'config.json'),
        path.join(process.cwd(), '.critical-claude.json'),
        path.join(process.cwd(), 'critical-claude.config.json')
      ];

      for (const defaultPath of defaultPaths) {
        try {
          const configContent = await fs.readFile(defaultPath, 'utf8');
          userConfig = JSON.parse(configContent);
          break;
        } catch {
          // Ignore errors for default paths
        }
      }
    }

    // Validate configuration
    this.validateConfig(userConfig, errors, warnings);

    // Merge with defaults
    const mergedConfig = this.mergeWithDefaults(userConfig);

    // Validate paths exist and are accessible
    await this.validatePaths(mergedConfig, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: mergedConfig
    };
  }

  private static validateConfig(config: any, errors: string[], warnings: string[]): void {
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be a valid object');
      return;
    }

    // Validate each property
    for (const [key, value] of Object.entries(config)) {
      const schema = (this.CONFIG_SCHEMA as any)[key];
      if (!schema) {
        warnings.push(`Unknown configuration property: ${key}`);
        continue;
      }

      this.validateProperty(key, value, schema, errors);
    }
  }

  private static validateProperty(key: string, value: any, schema: any, errors: string[]): void {
    if (value === undefined || value === null) {
      return; // Optional properties
    }

    // Type validation
    if (schema.type && typeof value !== schema.type) {
      errors.push(`${key} must be of type ${schema.type}, got ${typeof value}`);
      return;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${key} must be one of: ${schema.enum.join(', ')}, got: ${value}`);
      return;
    }

    // Number range validation
    if (schema.type === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${key} must be at least ${schema.min}, got: ${value}`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${key} must be at most ${schema.max}, got: ${value}`);
      }
    }

    // Object validation (nested)
    if (schema.type === 'object' && schema.properties) {
      for (const [propKey, propValue] of Object.entries(value)) {
        const propSchema = schema.properties[propKey];
        if (!propSchema) {
          continue; // Unknown properties in nested objects are allowed
        }
        this.validateProperty(`${key}.${propKey}`, propValue, propSchema, errors);
      }
    }
  }

  private static mergeWithDefaults(userConfig: Partial<CLIConfig>): CLIConfig {
    return {
      storagePath: userConfig.storagePath || this.DEFAULT_CONFIG.storagePath,
      logLevel: userConfig.logLevel || this.DEFAULT_CONFIG.logLevel,
      analytics: {
        enabled: userConfig.analytics?.enabled ?? this.DEFAULT_CONFIG.analytics.enabled,
        retentionDays: userConfig.analytics?.retentionDays ?? this.DEFAULT_CONFIG.analytics.retentionDays
      },
      templates: {
        customPath: userConfig.templates?.customPath || this.DEFAULT_CONFIG.templates.customPath
      },
      viewer: {
        theme: userConfig.viewer?.theme || this.DEFAULT_CONFIG.viewer.theme,
        pageSize: userConfig.viewer?.pageSize || this.DEFAULT_CONFIG.viewer.pageSize
      }
    };
  }

  private static async validatePaths(config: CLIConfig, errors: string[], warnings: string[]): Promise<void> {
    // Validate storage path
    if (config.storagePath) {
      try {
        await fs.mkdir(config.storagePath, { recursive: true });
        await fs.access(config.storagePath, fs.constants.W_OK);
      } catch (error: any) {
        errors.push(`Storage path not accessible: ${config.storagePath} - ${error.message}`);
      }
    }

    // Validate custom templates path if different from storage
    if (config.templates?.customPath && config.storagePath) {
      const defaultTemplatesPath = path.join(config.storagePath, 'templates');
      if (config.templates.customPath !== defaultTemplatesPath) {
        try {
          await fs.mkdir(config.templates.customPath, { recursive: true });
          await fs.access(config.templates.customPath, fs.constants.W_OK);
        } catch (error: any) {
          errors.push(`Custom templates path not accessible: ${config.templates.customPath} - ${error.message}`);
        }
      }
    }
  }

  static generateSampleConfig(): string {
    const sampleConfig = {
      storagePath: "~/.critical-claude",
      logLevel: "info",
      analytics: {
        enabled: true,
        retentionDays: 30
      },
      templates: {
        customPath: "~/.critical-claude/templates"
      },
      viewer: {
        theme: "dark",
        pageSize: 20
      }
    };

    return JSON.stringify(sampleConfig, null, 2);
  }
}