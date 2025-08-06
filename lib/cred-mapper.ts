// lib/cred-mapper.ts
/**
 * Jenkins to GitLab Credential Mapper
 * Maps Jenkins credential references to GitLab CI/CD variables
 */

import { CredentialHit } from './cred-scanner'

export interface GitLabVarSpec {
  /** Original Jenkins credential ID */
  originalId: string
  /** Proposed GitLab variable key */
  proposedKey: string
  /** Type of GitLab variable */
  type: 'variable' | 'file'
  /** Whether the variable should be masked */
  masked: boolean
  /** Whether the variable should be protected */
  protected: boolean
  /** Environment scope (e.g., production, staging, *) */
  environment_scope: string
  /** Description/notes about the credential */
  description: string
  /** Additional variables (e.g., for username/password splits) */
  additionalVars?: GitLabVarSpec[]
  /** Shell script snippet for creating this variable */
  curlSnippet: string
}

/**
 * Credential type definitions based on Jenkins credential types
 */
interface CredentialTypeDefinition {
  pattern: RegExp
  type: 'variable' | 'file'
  masked: boolean
  protected: boolean
  description: string
  generateKey: (id: string) => string
  additionalVars?: (id: string) => Array<{key: string, description: string}>
}

/**
 * Known credential type patterns and their mappings
 */
const CREDENTIAL_TYPE_MAPPINGS: CredentialTypeDefinition[] = [
  // Username/Password credentials
  {
    pattern: /.*(?:user|username|usr|login|account).*(?:pass|password|pwd).*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'Username/Password credential pair',
    generateKey: (id) => sanitizeVarName(id).replace(/_?(USER|USR|LOGIN|ACCOUNT)_?(PASS|PASSWORD|PWD)?/i, ''),
    additionalVars: (id) => [
      { key: sanitizeVarName(id) + '_USER', description: 'Username part' },
      { key: sanitizeVarName(id) + '_PASS', description: 'Password part' }
    ]
  },
  
  // Docker registry credentials
  {
    pattern: /.*\b(?:docker|registry|repo|harbor|ecr|gcr)\b.*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'Docker registry credentials',
    generateKey: (id) => sanitizeVarName(id).replace(/_?(DOCKER|REGISTRY|REPO)_?/i, 'REGISTRY_'),
    additionalVars: (id) => [
      { key: sanitizeVarName(id) + '_USER', description: 'Registry username' },
      { key: sanitizeVarName(id) + '_PASS', description: 'Registry password' }
    ]
  },
  
  // API tokens and keys
  {
    pattern: /.*(?:token|key|api|secret|auth).*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'API token or secret key',
    generateKey: (id) => sanitizeVarName(id)
  },
  
  // File credentials (certificates, keys, configs)
  {
    pattern: /.*(?:cert|certificate|pem|p12|pfx|jks|keystore|config|kubeconfig|ssh|rsa|key).*file.*/i,
    type: 'file',
    masked: false,
    protected: true,
    description: 'File credential (certificate, key, or config)',
    generateKey: (id) => sanitizeVarName(id)
  },
  
  // SSH credentials
  {
    pattern: /.*(?:ssh|rsa|private.*key|pub.*key).*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'SSH private key',
    generateKey: (id) => sanitizeVarName(id).replace(/_?(SSH|RSA|KEY)_?/i, 'SSH_')
  },
  
  // Database credentials
  {
    pattern: /.*(?:db|database|mysql|postgres|oracle|sql|mongo).*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'Database credentials',
    generateKey: (id) => sanitizeVarName(id).replace(/_?(DB|DATABASE)_?/i, 'DB_'),
    additionalVars: (id) => [
      { key: sanitizeVarName(id) + '_USER', description: 'Database username' },
      { key: sanitizeVarName(id) + '_PASS', description: 'Database password' },
      { key: sanitizeVarName(id) + '_HOST', description: 'Database host' },
      { key: sanitizeVarName(id) + '_NAME', description: 'Database name' }
    ]
  },
  
  // Cloud provider credentials
  {
    pattern: /.*(?:aws|azure|gcp|google|cloud).*/i,
    type: 'variable',
    masked: true,
    protected: true,
    description: 'Cloud provider credentials',
    generateKey: (id) => sanitizeVarName(id)
  }
]

/**
 * Sanitizes a credential ID for use as a GitLab variable name
 */
function sanitizeVarName(credentialId: string): string {
  return credentialId
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, 'VAR_$1') // Can't start with number
    .replace(/^CI_/, 'APP_CI_') // Avoid CI_ prefix conflicts
}

/**
 * Determines the credential type based on ID and context
 */
function inferCredentialType(hit: CredentialHit): CredentialTypeDefinition {
  const id = hit.id.toLowerCase()
  
  // Try to match against known patterns
  for (const mapping of CREDENTIAL_TYPE_MAPPINGS) {
    if (mapping.pattern.test(id)) {
      return mapping
    }
  }
  
  // Default based on Jenkins credential kind
  switch (hit.kind) {
    case 'file':
    case 'sshUserPrivateKey':
      return {
        pattern: /.*/,
        type: 'file',
        masked: false,
        protected: true,
        description: 'File credential',
        generateKey: (id) => sanitizeVarName(id)
      }
    
    case 'usernamePassword':
      return {
        pattern: /.*/,
        type: 'variable',
        masked: true,
        protected: true,
        description: 'Username/Password credential',
        generateKey: (id) => sanitizeVarName(id),
        additionalVars: (id) => [
          { key: sanitizeVarName(id) + '_USER', description: 'Username' },
          { key: sanitizeVarName(id) + '_PASS', description: 'Password' }
        ]
      }
    
    default:
      return {
        pattern: /.*/,
        type: 'variable',
        masked: true,
        protected: true,
        description: 'Secret credential',
        generateKey: (id) => sanitizeVarName(id)
      }
  }
}

/**
 * Generates a curl snippet for creating a GitLab variable
 */
function generateCurlSnippet(spec: GitLabVarSpec, projectId?: string): string {
  const projectVar = projectId ? `"${projectId}"` : '${CI_PROJECT_ID}'
  const apiUrl = '${CI_API_V4_URL:-https://gitlab.com/api/v4}'
  
  const curlData = [
    `"key=${spec.proposedKey}"`,
    `"value=<🔑 ADD_VALUE>"`,
    spec.masked ? `"masked=true"` : `"masked=false"`,
    spec.protected ? `"protected=true"` : `"protected=false"`,
    `"environment_scope=${spec.environment_scope}"`
  ]
  
  if (spec.type === 'file') {
    curlData[1] = `"value=<🔑 BASE64_FILE_CONTENT>"`
  }
  
  return `curl --header "PRIVATE-TOKEN:\${GITLAB_TOKEN}" \\
     --request POST \\
     --data ${curlData.join(' \\\n           --data ')} \\
     "${apiUrl}/projects/${projectVar}/variables"`
}

/**
 * Maps Jenkins credential hits to GitLab variable specifications
 */
export function mapCredentialsToGitLab(
  hits: CredentialHit[],
  options: {
    projectId?: string
    environmentScope?: string
    forceProtected?: boolean
    customMappings?: Record<string, Partial<GitLabVarSpec>>
  } = {}
): GitLabVarSpec[] {
  const {
    projectId,
    environmentScope = '*',
    forceProtected = true,
    customMappings = {}
  } = options
  
  const specs: GitLabVarSpec[] = []
  
  for (const hit of hits) {
    // Check for custom mapping first
    const customMapping = customMappings[hit.id]
    if (customMapping) {
      const spec: GitLabVarSpec = {
        originalId: hit.id,
        proposedKey: customMapping.proposedKey || sanitizeVarName(hit.id),
        type: customMapping.type || 'variable',
        masked: customMapping.masked ?? true,
        protected: customMapping.protected ?? forceProtected,
        environment_scope: customMapping.environment_scope || environmentScope,
        description: customMapping.description || `Custom mapping for ${hit.id}`,
        curlSnippet: generateCurlSnippet({
          ...customMapping,
          originalId: hit.id,
          proposedKey: customMapping.proposedKey || sanitizeVarName(hit.id),
          type: customMapping.type || 'variable',
          masked: customMapping.masked ?? true,
          protected: customMapping.protected ?? forceProtected,
          environment_scope: customMapping.environment_scope || environmentScope,
          description: customMapping.description || `Custom mapping for ${hit.id}`,
          curlSnippet: ''
        }, projectId)
      }
      specs.push(spec)
      continue
    }
    
    // Infer credential type
    const credType = inferCredentialType(hit)
    const baseKey = credType.generateKey(hit.id)
    
    const baseSpec: GitLabVarSpec = {
      originalId: hit.id,
      proposedKey: baseKey,
      type: credType.type,
      masked: credType.masked,
      protected: forceProtected || credType.protected,
      environment_scope: environmentScope,
      description: `${credType.description} (from Jenkins: ${hit.id})`,
      curlSnippet: ''
    }
    
    // Generate curl snippet
    baseSpec.curlSnippet = generateCurlSnippet(baseSpec, projectId)
    
    // Handle additional variables (e.g., username/password splits)
    if (credType.additionalVars) {
      const additionalVars = credType.additionalVars(hit.id).map(additionalVar => {
        const additionalSpec: GitLabVarSpec = {
          originalId: hit.id,
          proposedKey: additionalVar.key,
          type: 'variable',
          masked: credType.masked,
          protected: forceProtected || credType.protected,
          environment_scope: environmentScope,
          description: `${additionalVar.description} (from Jenkins: ${hit.id})`,
          curlSnippet: generateCurlSnippet({
            originalId: hit.id,
            proposedKey: additionalVar.key,
            type: 'variable',
            masked: credType.masked,
            protected: forceProtected || credType.protected,
            environment_scope: environmentScope,
            description: `${additionalVar.description} (from Jenkins: ${hit.id})`,
            curlSnippet: ''
          }, projectId)
        }
        return additionalSpec
      })
      
      baseSpec.additionalVars = additionalVars
      specs.push(...additionalVars)
    } else {
      specs.push(baseSpec)
    }
  }
  
  // Remove duplicates based on proposedKey
  const uniqueSpecs = specs.reduce((acc: GitLabVarSpec[], spec) => {
    const existing = acc.find(s => s.proposedKey === spec.proposedKey)
    if (!existing) {
      acc.push(spec)
    }
    return acc
  }, [])
  
  return uniqueSpecs.sort((a, b) => a.proposedKey.localeCompare(b.proposedKey))
}

/**
 * Generates environment file content for local development
 */
export function generateEnvFile(specs: GitLabVarSpec[]): string {
  const lines = [
    '# GitLab CI/CD Variables for Local Development',
    '# Generated from Jenkins credential migration',
    '# Replace <🔑 ADD_VALUE> with actual values',
    ''
  ]
  
  for (const spec of specs) {
    lines.push(`# ${spec.description}`)
    if (spec.type === 'file') {
      lines.push(`${spec.proposedKey}=<🔑 BASE64_FILE_CONTENT>`)
    } else {
      lines.push(`${spec.proposedKey}=<🔑 ADD_VALUE>`)
    }
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Generates shell script for creating all GitLab variables
 */
export function generateGitLabVarsScript(
  specs: GitLabVarSpec[],
  options: {
    projectId?: string
    dryRun?: boolean
    batchSize?: number
  } = {}
): string {
  const { projectId, dryRun = false, batchSize = 10 } = options
  
  const lines = [
    '#!/bin/bash',
    '# GitLab CI/CD Variables Creation Script',
    '# Generated from Jenkins credential migration',
    '',
    'set -euo pipefail',
    '',
    '# Configuration',
    `PROJECT_ID=\${CI_PROJECT_ID:-${projectId || 'YOUR_PROJECT_ID'}}`,
    'GITLAB_TOKEN=${GITLAB_TOKEN:-}',
    'API_URL=${CI_API_V4_URL:-https://gitlab.com/api/v4}',
    '',
    '# Validation',
    'if [[ -z "$GITLAB_TOKEN" ]]; then',
    '  echo "Error: GITLAB_TOKEN environment variable is required"',
    '  echo "Get your token from: https://gitlab.com/-/profile/personal_access_tokens"',
    '  exit 1',
    'fi',
    '',
    'if [[ -z "$PROJECT_ID" ]]; then',
    '  echo "Error: PROJECT_ID is required"',
    '  exit 1',
    'fi',
    '',
    '# Functions',
    'create_variable() {',
    '  local key="$1"',
    '  local value="$2"', 
    '  local masked="$3"',
    '  local protected="$4"',
    '  local scope="$5"',
    '  local description="$6"',
    '',
    '  echo "Creating variable: $key"',
    dryRun ? '  echo "[DRY RUN] Would create: $key"' : '',
    dryRun ? '  return 0' : '',
    '',
    '  response=$(curl -s -w "%{http_code}" -o /tmp/gitlab_var_response \\',
    '    --header "PRIVATE-TOKEN:$GITLAB_TOKEN" \\',
    '    --request POST \\',
    '    --data "key=$key" \\',
    '    --data "value=$value" \\',
    '    --data "masked=$masked" \\',
    '    --data "protected=$protected" \\',
    '    --data "environment_scope=$scope" \\',
    '    "$API_URL/projects/$PROJECT_ID/variables")',
    '',
    '  if [[ "$response" =~ ^2[0-9][0-9]$ ]]; then',
    '    echo "✅ Created: $key"',
    '  else',
    '    echo "❌ Failed: $key (HTTP $response)"',
    '    cat /tmp/gitlab_var_response',
    '    echo',
    '  fi',
    '}',
    '',
    'echo "Creating GitLab CI/CD variables for project: $PROJECT_ID"',
    'echo "API URL: $API_URL"',
    dryRun ? 'echo "DRY RUN MODE - No variables will be created"' : '',
    'echo',
    ''
  ]
  
  // Group variables into batches
  for (let i = 0; i < specs.length; i += batchSize) {
    const batch = specs.slice(i, i + batchSize)
    
    lines.push(`# Batch ${Math.floor(i / batchSize) + 1}`)
    for (const spec of batch) {
      const value = spec.type === 'file' ? '<🔑 BASE64_FILE_CONTENT>' : '<🔑 ADD_VALUE>'
      lines.push(`create_variable "${spec.proposedKey}" "${value}" "${spec.masked}" "${spec.protected}" "${spec.environment_scope}" "${spec.description.replace(/"/g, '\\"')}"`)
    }
    lines.push('echo')
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < specs.length) {
      lines.push('sleep 1')
      lines.push('')
    }
  }
  
  lines.push(
    'echo "✅ Script completed"',
    'echo "Check your GitLab project settings to verify variables were created:"',
    'echo "https://gitlab.com/YOUR_USERNAME/YOUR_PROJECT/-/settings/ci_cd"'
  )
  
  return lines.join('\n')
}

/**
 * Validates GitLab variable specifications
 */
export function validateGitLabVarSpecs(specs: GitLabVarSpec[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  const seenKeys = new Set<string>()
  
  for (const spec of specs) {
    // Check for duplicate keys
    if (seenKeys.has(spec.proposedKey)) {
      errors.push(`Duplicate variable key: ${spec.proposedKey}`)
    }
    seenKeys.add(spec.proposedKey)
    
    // Validate key format
    if (!/^[A-Z_][A-Z0-9_]*$/.test(spec.proposedKey)) {
      errors.push(`Invalid variable key format: ${spec.proposedKey}`)
    }
    
    // Warn about CI_ prefix
    if (spec.proposedKey.startsWith('CI_')) {
      warnings.push(`Variable ${spec.proposedKey} starts with CI_ (GitLab reserved prefix)`)
    }
    
    // Warn about very long keys
    if (spec.proposedKey.length > 100) {
      warnings.push(`Variable key is very long: ${spec.proposedKey}`)
    }
    
    // Validate masked variables requirements
    if (spec.masked && spec.type === 'file') {
      warnings.push(`File variable ${spec.proposedKey} cannot be masked`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}