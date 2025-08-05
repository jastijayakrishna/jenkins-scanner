// lib/gitlab-lint.ts
export interface LintResult {
  status: 'valid' | 'invalid'
  errors: string[]
  warnings?: string[]
}

export interface GitLabLintResponse {
  status: string
  errors: string[]
  warnings?: string[]
  valid?: boolean
}

/**
 * Lint GitLab CI YAML content using GitLab's public CI Lint API
 * @param content - The YAML content to validate
 * @param baseUrl - GitLab instance base URL (defaults to gitlab.com)
 * @returns Promise<LintResult>
 */
export async function lintCi(
  content: string, 
  baseUrl: string = 'https://gitlab.com'
): Promise<LintResult> {
  try {
    // Validate input
    if (!content || content.trim().length === 0) {
      return {
        status: 'invalid',
        errors: ['YAML content is empty']
      }
    }

    // Prepare the API endpoint
    const apiUrl = `${baseUrl}/api/v4/ci/lint`
    
    // Prepare the payload - GitLab expects base64 encoded content for some endpoints
    // But the /ci/lint endpoint accepts plain text in the 'content' field
    const payload = {
      content: content,
      include_merged_yaml: true // Include any included files in validation
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 429) {
        return {
          status: 'invalid',
          errors: ['Rate limit exceeded. Please try again later.']
        }
      }
      
      if (response.status >= 500) {
        return {
          status: 'invalid',
          errors: ['GitLab server error. Please try again later.']
        }
      }

      return {
        status: 'invalid',
        errors: [`HTTP ${response.status}: ${response.statusText}`]
      }
    }

    const data: GitLabLintResponse = await response.json()
    
    // Handle the response based on GitLab's API format
    const isValid = data.status === 'valid' || data.valid === true
    const errors = data.errors || []
    const warnings = data.warnings || []

    return {
      status: isValid ? 'valid' : 'invalid',
      errors: errors,
      warnings: warnings
    }

  } catch (error) {
    // Handle network errors, JSON parsing errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return {
      status: 'invalid',
      errors: [`Lint validation failed: ${errorMessage}`]
    }
  }
}

/**
 * Check if GitLab instance is reachable
 * @param baseUrl - GitLab instance URL
 * @returns Promise<boolean>
 */
export async function checkGitLabConnection(baseUrl: string = 'https://gitlab.com'): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/v4/version`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Extract line numbers from GitLab lint error messages
 * @param error - Error message from GitLab
 * @returns Line number if found, null otherwise
 */
export function extractLineNumber(error: string): number | null {
  // Common patterns in GitLab lint errors:
  // "(<unknown>): line 15: found character that cannot start any token"
  // "jobs:build config should implement a script: or a trigger: keyword"
  
  const lineMatch = error.match(/line (\d+)/)
  if (lineMatch) {
    return parseInt(lineMatch[1], 10)
  }
  
  return null
}

/**
 * Categorize lint errors by type
 * @param errors - Array of error messages
 * @returns Categorized errors
 */
export function categorizeErrors(errors: string[]): {
  syntax: string[]
  configuration: string[]
  other: string[]
} {
  const syntax: string[] = []
  const configuration: string[] = []
  const other: string[] = []
  
  errors.forEach(error => {
    const lowerError = error.toLowerCase()
    
    if (lowerError.includes('yaml') || lowerError.includes('syntax') || lowerError.includes('character')) {
      syntax.push(error)
    } else if (lowerError.includes('job') || lowerError.includes('stage') || lowerError.includes('script')) {
      configuration.push(error)
    } else {
      other.push(error)
    }
  })
  
  return { syntax, configuration, other }
}