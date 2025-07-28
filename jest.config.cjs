module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/shared/__tests__/simple-working.test.ts',
    '<rootDir>/shared/__tests__/error-handling.test.ts',
    '<rootDir>/shared/__tests__/input-sanitizer.test.ts',
    '<rootDir>/shared/__tests__/simple-cache.test.ts',
    '<rootDir>/shared/__tests__/simple-observability-minimal.test.ts',
    '<rootDir>/tests/integration/critical-claude-cli.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext'
      }
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**'
  ],
  coverageReporters: ['text'],
  testTimeout: 10000
};