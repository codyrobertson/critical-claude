export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  // Separate test configurations for different test types
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true
        }
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/*.test.ts'],
      testTimeout: 10000,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
    },
    {
      displayName: 'integration',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true
        }
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/*.test.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      globals: {
        'ts-jest': {
          useESM: true
        }
      },
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/e2e/*.test.ts'], 
      testTimeout: 60000,
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
    }
  ]
};