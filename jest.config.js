const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverageFrom: [
    'pages/api/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/?(*.)+(spec|test).(ts|tsx)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
