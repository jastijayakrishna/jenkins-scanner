// __tests__/gitlab-lint.test.ts
import { lintCi, checkGitLabConnection, extractLineNumber, categorizeErrors } from '@/lib/gitlab-lint'

// Mock fetch globally
global.fetch = jest.fn()

describe('GitLab Lint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('lintCi', () => {
    it('should return valid status for valid YAML', async () => {
      const mockResponse = {
        status: 'valid',
        errors: [],
        warnings: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await lintCi('stages:\n  - build\n\nbuild:job:\n  stage: build\n  script:\n    - echo "test"')

      expect(result.status).toBe('valid')
      expect(result.errors).toEqual([])
    })

    it('should return invalid status for invalid YAML', async () => {
      const mockResponse = {
        status: 'invalid',
        errors: ['jobs:build config should implement a script: or a trigger: keyword'],
        warnings: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await lintCi('stages:\n  - build\n\nbuild:job:\n  stage: build')

      expect(result.status).toBe('invalid')
      expect(result.errors).toContain('jobs:build config should implement a script: or a trigger: keyword')
    })

    it('should handle empty content', async () => {
      const result = await lintCi('')

      expect(result.status).toBe('invalid')
      expect(result.errors).toContain('YAML content is empty')
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await lintCi('test: yaml')

      expect(result.status).toBe('invalid')
      expect(result.errors[0]).toContain('Network error')
    })

    it('should handle HTTP errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const result = await lintCi('test: yaml')

      expect(result.status).toBe('invalid')
      expect(result.errors).toContain('GitLab server error. Please try again later.')
    })

    it('should handle rate limiting', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      const result = await lintCi('test: yaml')

      expect(result.status).toBe('invalid')
      expect(result.errors).toContain('Rate limit exceeded. Please try again later.')
    })

    it('should use custom base URL', async () => {
      const mockResponse = {
        status: 'valid',
        errors: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await lintCi('test: yaml', 'https://custom-gitlab.com')

      expect(fetch).toHaveBeenCalledWith(
        'https://custom-gitlab.com/api/v4/ci/lint',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      )
    })

    it('should handle warnings', async () => {
      const mockResponse = {
        status: 'valid',
        errors: [],
        warnings: ['job may allow failure']
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await lintCi('test: yaml')

      expect(result.status).toBe('valid')
      expect(result.warnings).toContain('job may allow failure')
    })
  })

  describe('checkGitLabConnection', () => {
    it('should return true for successful connection', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      const result = await checkGitLabConnection()

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith('https://gitlab.com/api/v4/version', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
    })

    it('should return false for failed connection', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await checkGitLabConnection()

      expect(result).toBe(false)
    })

    it('should use custom base URL', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      })

      await checkGitLabConnection('https://custom-gitlab.com')

      expect(fetch).toHaveBeenCalledWith('https://custom-gitlab.com/api/v4/version', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
    })
  })

  describe('extractLineNumber', () => {
    it('should extract line number from error message', () => {
      const error = '(<unknown>): line 15: found character that cannot start any token'
      const lineNumber = extractLineNumber(error)
      expect(lineNumber).toBe(15)
    })

    it('should return null for error without line number', () => {
      const error = 'jobs:build config should implement a script: or a trigger: keyword'
      const lineNumber = extractLineNumber(error)
      expect(lineNumber).toBe(null)
    })

    it('should handle multiple line numbers and return first', () => {
      const error = 'Error at line 10: invalid syntax found at line 15'
      const lineNumber = extractLineNumber(error)
      expect(lineNumber).toBe(10)
    })
  })

  describe('categorizeErrors', () => {
    it('should categorize syntax errors', () => {
      const errors = [
        'YAML syntax error: found character that cannot start any token',
        'Invalid character found'
      ]

      const categorized = categorizeErrors(errors)

      expect(categorized.syntax).toHaveLength(2) // Both contain "character"
      expect(categorized.syntax[0]).toContain('YAML syntax error')
      expect(categorized.configuration).toHaveLength(0)
      expect(categorized.other).toHaveLength(0)
    })

    it('should categorize configuration errors', () => {
      const errors = [
        'jobs:build config should implement a script: or a trigger: keyword',
        'stage "invalid-stage" is not defined'
      ]

      const categorized = categorizeErrors(errors)

      expect(categorized.configuration).toHaveLength(2) // Both contain "job" or "stage"
      expect(categorized.configuration[0]).toContain('jobs:build config')
      expect(categorized.configuration[1]).toContain('stage "invalid-stage"')
      expect(categorized.syntax).toHaveLength(0)
      expect(categorized.other).toHaveLength(0) // Both are configuration errors
    })

    it('should handle mixed error types', () => {
      const errors = [
        'YAML syntax error',
        'jobs:test missing script',
        'Unknown error occurred'
      ]

      const categorized = categorizeErrors(errors)

      expect(categorized.syntax).toHaveLength(1)
      expect(categorized.configuration).toHaveLength(1)
      expect(categorized.other).toHaveLength(1)
    })

    it('should handle empty errors array', () => {
      const categorized = categorizeErrors([])

      expect(categorized.syntax).toHaveLength(0)
      expect(categorized.configuration).toHaveLength(0)
      expect(categorized.other).toHaveLength(0)
    })
  })
})