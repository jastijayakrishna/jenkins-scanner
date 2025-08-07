// Jest setup file for integration tests
// Global test configuration and mocks

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.ANTHROPIC_API_KEY = 'test-key-mock'

// Global test utilities
global.fetch = jest.fn()

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}

// Setup test timeout
jest.setTimeout(30000)
