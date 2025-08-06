// __tests__/cred-mapper.test.ts
/**
 * Tests for the Jenkins to GitLab credential mapper
 */

import { 
  mapCredentialsToGitLab, 
  generateEnvFile, 
  generateGitLabVarsScript,
  validateGitLabVarSpecs 
} from '../lib/cred-mapper'
import { CredentialHit } from '../lib/cred-scanner'

describe('mapCredentialsToGitLab', () => {
  it('should map basic credentials to GitLab variables', () => {
    const hits: CredentialHit[] = [
      { id: 'api-token', line: 1, kind: 'string', rawMatch: '', context: '' },
      { id: 'database-config', line: 2, kind: 'file', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    expect(specs.length).toBeGreaterThanOrEqual(2) // May create additional variables for database credentials
    
    const apiToken = specs.find(s => s.originalId === 'api-token')
    expect(apiToken).toBeDefined()
    expect(apiToken?.type).toBe('variable')
    expect(apiToken?.masked).toBe(true)
    expect(apiToken?.protected).toBe(true)
    expect(apiToken?.proposedKey).toBe('API_TOKEN')
    
    // Database config may be detected as database credential type and split into multiple vars
    const dbSpecs = specs.filter(s => s.originalId === 'database-config')
    expect(dbSpecs.length).toBeGreaterThan(0)
  })

  it('should handle username/password credentials', () => {
    const hits: CredentialHit[] = [
      { id: 'docker-hub-user-pass', line: 1, kind: 'usernamePassword', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    expect(specs).toHaveLength(2) // Should split into username and password
    
    const userVar = specs.find(s => s.proposedKey.includes('USER'))
    const passVar = specs.find(s => s.proposedKey.includes('PASS'))
    
    expect(userVar).toBeDefined()
    expect(passVar).toBeDefined()
    expect(userVar?.masked).toBe(true)
    expect(passVar?.masked).toBe(true)
  })

  it('should detect Docker registry credentials', () => {
    const hits: CredentialHit[] = [
      { id: 'docker-registry-cred', line: 1, kind: 'step', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    expect(specs).toHaveLength(2) // Should create USER and PASS variables
    expect(specs.some(s => s.proposedKey.includes('REGISTRY'))).toBe(true)
  })

  it('should handle SSH credentials', () => {
    const hits: CredentialHit[] = [
      { id: 'deploy-ssh-key', line: 1, kind: 'sshUserPrivateKey', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    expect(specs).toHaveLength(1)
    expect(specs[0].type).toBe('variable')
    expect(specs[0].masked).toBe(true)
    expect(specs[0].proposedKey).toContain('SSH')
  })

  it('should sanitize variable names', () => {
    const hits: CredentialHit[] = [
      { id: 'my-secret-key!@#', line: 1, kind: 'string', rawMatch: '', context: '' },
      { id: '123-invalid-start', line: 2, kind: 'string', rawMatch: '', context: '' },
      { id: 'CI_RESERVED_NAME', line: 3, kind: 'string', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    // Find the specific credentials by original ID
    const secretKey = specs.find(s => s.originalId === 'my-secret-key!@#')
    const invalidStart = specs.find(s => s.originalId === '123-invalid-start')
    const reserved = specs.find(s => s.originalId === 'CI_RESERVED_NAME')
    
    expect(secretKey?.proposedKey).toBe('MY_SECRET_KEY')
    expect(invalidStart?.proposedKey).toBe('VAR_123_INVALID_START')
    expect(reserved?.proposedKey).toBe('APP_CI_RESERVED_NAME')
  })

  it('should respect custom mappings', () => {
    const hits: CredentialHit[] = [
      { id: 'custom-cred', line: 1, kind: 'string', rawMatch: '', context: '' }
    ]
    
    const customMappings = {
      'custom-cred': {
        proposedKey: 'CUSTOM_VAR_NAME',
        type: 'file' as const,
        masked: false,
        description: 'Custom mapped credential'
      }
    }
    
    const specs = mapCredentialsToGitLab(hits, { customMappings })
    
    expect(specs).toHaveLength(1)
    expect(specs[0].proposedKey).toBe('CUSTOM_VAR_NAME')
    expect(specs[0].type).toBe('file')
    expect(specs[0].masked).toBe(false)
    expect(specs[0].description).toContain('Custom mapped credential')
  })

  it('should handle environment scope and protection settings', () => {
    const hits: CredentialHit[] = [
      { id: 'test-cred', line: 1, kind: 'string', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits, {
      environmentScope: 'production',
      forceProtected: false
    })
    
    expect(specs[0].environment_scope).toBe('production')
    expect(specs[0].protected).toBe(true) // Should still be protected due to credential type
  })

  it('should remove duplicate variable keys', () => {
    const hits: CredentialHit[] = [
      { id: 'duplicate-name', line: 1, kind: 'string', rawMatch: '', context: '' },
      { id: 'duplicate_name', line: 2, kind: 'string', rawMatch: '', context: '' } // Same after sanitization
    ]
    
    const specs = mapCredentialsToGitLab(hits)
    
    expect(specs).toHaveLength(1) // Should deduplicate
    expect(specs[0].proposedKey).toBe('DUPLICATE_NAME')
  })

  it('should generate curl snippets', () => {
    const hits: CredentialHit[] = [
      { id: 'test-cred', line: 1, kind: 'string', rawMatch: '', context: '' }
    ]
    
    const specs = mapCredentialsToGitLab(hits, { projectId: '12345' })
    
    expect(specs[0].curlSnippet).toContain('curl')
    expect(specs[0].curlSnippet).toContain('PRIVATE-TOKEN')
    expect(specs[0].curlSnippet).toContain('projects/"12345"/variables')
    expect(specs[0].curlSnippet).toContain(specs[0].proposedKey)
  })
})

describe('generateEnvFile', () => {
  it('should generate a valid .env file', () => {
    const specs = [
      {
        originalId: 'api-token',
        proposedKey: 'API_TOKEN',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'API token for external service',
        curlSnippet: ''
      },
      {
        originalId: 'config-file',
        proposedKey: 'CONFIG_FILE',
        type: 'file' as const,
        masked: false,
        protected: true,
        environment_scope: '*',
        description: 'Configuration file',
        curlSnippet: ''
      }
    ]
    
    const envFile = generateEnvFile(specs)
    
    expect(envFile).toContain('# GitLab CI/CD Variables for Local Development')
    expect(envFile).toContain('API_TOKEN=<🔑 ADD_VALUE>')
    expect(envFile).toContain('CONFIG_FILE=<🔑 BASE64_FILE_CONTENT>')
    expect(envFile).toContain('# API token for external service')
    expect(envFile).toContain('# Configuration file')
  })

  it('should handle empty specs', () => {
    const envFile = generateEnvFile([])
    
    expect(envFile).toContain('# GitLab CI/CD Variables for Local Development')
    expect(envFile.split('\n').length).toBeGreaterThan(1)
  })
})

describe('generateGitLabVarsScript', () => {
  it('should generate a valid shell script', () => {
    const specs = [
      {
        originalId: 'api-token',
        proposedKey: 'API_TOKEN',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'API token',
        curlSnippet: ''
      }
    ]
    
    const script = generateGitLabVarsScript(specs, { projectId: '12345' })
    
    expect(script).toContain('#!/bin/bash')
    expect(script).toContain('GitLab CI/CD Variables Creation Script')
    expect(script).toContain('create_variable')
    expect(script).toContain('API_TOKEN')
    expect(script).toContain('set -euo pipefail')
    expect(script).toContain('GITLAB_TOKEN')
    expect(script).toContain('PROJECT_ID')
  })

  it('should support dry run mode', () => {
    const specs = [
      {
        originalId: 'test-cred',
        proposedKey: 'TEST_CRED',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'Test credential',
        curlSnippet: ''
      }
    ]
    
    const script = generateGitLabVarsScript(specs, { dryRun: true })
    
    expect(script).toContain('DRY RUN MODE')
    expect(script).toContain('[DRY RUN] Would create')
  })

  it('should handle batching', () => {
    const specs = Array.from({ length: 25 }, (_, i) => ({
      originalId: `cred-${i}`,
      proposedKey: `CRED_${i}`,
      type: 'variable' as const,
      masked: true,
      protected: true,
      environment_scope: '*',
      description: `Credential ${i}`,
      curlSnippet: ''
    }))
    
    const script = generateGitLabVarsScript(specs, { batchSize: 10 })
    
    expect(script).toContain('# Batch 1')
    expect(script).toContain('# Batch 2')
    expect(script).toContain('# Batch 3')
    expect(script).toContain('sleep 1') // Delay between batches
  })

  it('should include validation and error handling', () => {
    const script = generateGitLabVarsScript([])
    
    expect(script).toContain('if [[ -z "$GITLAB_TOKEN" ]]')
    expect(script).toContain('if [[ -z "$PROJECT_ID" ]]')
    expect(script).toContain('echo "Error:')
    expect(script).toContain('exit 1')
  })
})

describe('validateGitLabVarSpecs', () => {
  it('should validate correct specifications', () => {
    const specs = [
      {
        originalId: 'api-token',
        proposedKey: 'API_TOKEN',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'API token',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.warnings).toEqual([])
  })

  it('should detect duplicate keys', () => {
    const specs = [
      {
        originalId: 'cred1',
        proposedKey: 'DUPLICATE_KEY',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'First credential',
        curlSnippet: ''
      },
      {
        originalId: 'cred2',
        proposedKey: 'DUPLICATE_KEY',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'Second credential',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain('Duplicate variable key: DUPLICATE_KEY')
  })

  it('should warn about CI_ prefixed variables', () => {
    const specs = [
      {
        originalId: 'ci-token',
        proposedKey: 'CI_TOKEN',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'CI token',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.warnings).toContain('Variable CI_TOKEN starts with CI_ (GitLab reserved prefix)')
  })

  it('should detect invalid key formats', () => {
    const specs = [
      {
        originalId: 'invalid',
        proposedKey: 'invalid-key-name',
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'Invalid key',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain('Invalid variable key format: invalid-key-name')
  })

  it('should warn about file variables being masked', () => {
    const specs = [
      {
        originalId: 'config-file',
        proposedKey: 'CONFIG_FILE',
        type: 'file' as const,
        masked: true, // This should trigger a warning
        protected: true,
        environment_scope: '*',
        description: 'Config file',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.warnings).toContain('File variable CONFIG_FILE cannot be masked')
  })

  it('should warn about very long keys', () => {
    const longKey = 'A'.repeat(150)
    const specs = [
      {
        originalId: 'long-key',
        proposedKey: longKey,
        type: 'variable' as const,
        masked: true,
        protected: true,
        environment_scope: '*',
        description: 'Very long key',
        curlSnippet: ''
      }
    ]
    
    const validation = validateGitLabVarSpecs(specs)
    
    expect(validation.warnings).toContain(`Variable key is very long: ${longKey}`)
  })
})