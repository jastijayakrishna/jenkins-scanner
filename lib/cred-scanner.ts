// lib/cred-scanner.ts
/**
 * Jenkins Credential Scanner
 * Detects credential references in Jenkinsfiles and categorizes them
 */

export interface CredentialHit {
  /** Credential ID as referenced in Jenkins */
  id: string
  /** Line number where the credential was found */
  line: number
  /** Type of credential reference */
  kind: 'env' | 'step' | 'withCredentials' | 'usernamePassword' | 'string' | 'file' | 'sshUserPrivateKey'
  /** Raw matched text for context */
  rawMatch: string
  /** Additional context about the credential usage */
  context?: string
}

/**
 * Regex patterns for detecting different types of credential references
 */
const CREDENTIAL_PATTERNS = [
  // credentials('credential-id') - basic credential function
  {
    pattern: /credentials\(['"]([^'"]+)['"]\)/g,
    kind: 'step' as const,
    description: 'Basic credentials() function'
  },
  
  // withCredentials block with credentialsId
  {
    pattern: /withCredentials\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'withCredentials' as const,
    description: 'withCredentials block'
  },
  
  // usernamePassword credential binding
  {
    pattern: /usernamePassword\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'usernamePassword' as const,
    description: 'Username/password credential binding'
  },
  
  // string credential binding
  {
    pattern: /string\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'string' as const,
    description: 'Secret text credential binding'
  },
  
  // file credential binding
  {
    pattern: /file\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'file' as const,
    description: 'File credential binding'
  },
  
  // SSH private key credential binding
  {
    pattern: /sshUserPrivateKey\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'sshUserPrivateKey' as const,
    description: 'SSH private key credential binding'
  },
  
  // Environment variables that look like secrets
  {
    pattern: /env\.([A-Z0-9_]+(?:_KEY|_TOKEN|_PASS|_PASSWORD|_SECRET|_CERT|_PEM|_PRIVATE|_PUBLIC))/g,
    kind: 'env' as const,
    description: 'Environment variable (potential secret)'
  },
  
  // Dollar sign environment variables
  {
    pattern: /\$\{?([A-Z0-9_]+(?:_KEY|_TOKEN|_PASS|_PASSWORD|_SECRET|_CERT|_PEM|_PRIVATE|_PUBLIC))\}?/g,
    kind: 'env' as const,
    description: 'Environment variable reference (potential secret)'
  }
]

/**
 * Additional patterns for specific Jenkins plugins
 */
const PLUGIN_CREDENTIAL_PATTERNS = [
  // Docker registry credentials
  {
    pattern: /docker\.withRegistry\([^,]*,\s*['"]([^'"]+)['"]\)/g,
    kind: 'step' as const,
    description: 'Docker registry credentials'
  },
  
  // Kubernetes config
  {
    pattern: /kubeconfigFile\([^)]*credentialsId:\s*['"]([^'"]+)['"]/g,
    kind: 'file' as const,
    description: 'Kubernetes config file'
  },
  
  // AWS credentials
  {
    pattern: /withAWS\([^)]*credentials:\s*['"]([^'"]+)['"]/g,
    kind: 'step' as const,
    description: 'AWS credentials'
  },
  
  // Generic credential variable
  {
    pattern: /\$\{credentials\(['"]([^'"]+)['"]\)\}/g,
    kind: 'step' as const,
    description: 'Credential variable interpolation'
  }
]

/**
 * Scans a Jenkinsfile content for credential references
 */
export function scanCredentials(jenkinsfileContent: string): CredentialHit[] {
  const hits: CredentialHit[] = []
  const lines = jenkinsfileContent.split('\n')
  
  // Combine all patterns
  const allPatterns = [...CREDENTIAL_PATTERNS, ...PLUGIN_CREDENTIAL_PATTERNS]
  
  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1
    
    allPatterns.forEach(({ pattern, kind, description }) => {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0
      
      let match
      while ((match = pattern.exec(line)) !== null) {
        const credentialId = match[1]
        
        // Skip if we already found this credential on this line
        const existingHit = hits.find(h => 
          h.id === credentialId && 
          h.line === lineNumber && 
          h.kind === kind
        )
        
        if (!existingHit && credentialId) {
          hits.push({
            id: credentialId,
            line: lineNumber,
            kind,
            rawMatch: match[0],
            context: description
          })
        }
      }
    })
  })
  
  // Deduplicate hits by id, keeping the first occurrence
  const uniqueHits = hits.reduce((acc: CredentialHit[], hit) => {
    const existing = acc.find(h => h.id === hit.id)
    if (!existing) {
      acc.push(hit)
    }
    return acc
  }, [])
  
  return uniqueHits.sort((a, b) => a.line - b.line)
}

/**
 * Analyzes credential usage patterns to provide insights
 */
export function analyzeCredentialUsage(hits: CredentialHit[]): {
  totalCredentials: number
  byKind: Record<string, number>
  potentialSecrets: CredentialHit[]
  recommendations: string[]
} {
  const byKind = hits.reduce((acc, hit) => {
    acc[hit.kind] = (acc[hit.kind] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const potentialSecrets = hits.filter(hit => 
    hit.kind === 'env' || 
    hit.id.toLowerCase().includes('secret') ||
    hit.id.toLowerCase().includes('password') ||
    hit.id.toLowerCase().includes('token') ||
    hit.id.toLowerCase().includes('key')
  )
  
  const recommendations: string[] = []
  
  if (byKind.env > 0) {
    recommendations.push(`Found ${byKind.env} environment variables that may contain secrets. Consider using GitLab CI/CD variables instead.`)
  }
  
  if (byKind.file > 0) {
    recommendations.push(`Found ${byKind.file} file credentials. These should be migrated to GitLab file variables.`)
  }
  
  if (byKind.usernamePassword > 0) {
    recommendations.push(`Found ${byKind.usernamePassword} username/password credentials. Split these into separate GitLab variables.`)
  }
  
  if (potentialSecrets.length > hits.length * 0.5) {
    recommendations.push('High proportion of secret-like credentials detected. Ensure all are properly masked in GitLab.')
  }
  
  return {
    totalCredentials: hits.length,
    byKind,
    potentialSecrets,
    recommendations
  }
}

/**
 * Validates that a credential ID is valid for GitLab variable naming
 */
export function validateCredentialId(credentialId: string): {
  valid: boolean
  issues: string[]
  suggestedName?: string
} {
  const issues: string[] = []
  
  // GitLab variable naming rules
  if (!/^[A-Z_][A-Z0-9_]*$/.test(credentialId.toUpperCase())) {
    issues.push('Variable name must contain only uppercase letters, numbers, and underscores')
  }
  
  if (credentialId.length > 255) {
    issues.push('Variable name must be 255 characters or less')
  }
  
  if (/^CI_/.test(credentialId.toUpperCase())) {
    issues.push('Variable name cannot start with CI_ (reserved prefix)')
  }
  
  // Generate suggested name
  let suggestedName = credentialId
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  if (suggestedName.startsWith('CI_')) {
    suggestedName = 'APP_' + suggestedName
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestedName: issues.length > 0 ? suggestedName : undefined
  }
}

/**
 * Extracts credential context from surrounding lines
 */
export function extractCredentialContext(
  jenkinsfileContent: string, 
  hit: CredentialHit, 
  contextLines: number = 2
): string[] {
  const lines = jenkinsfileContent.split('\n')
  const startLine = Math.max(0, hit.line - 1 - contextLines)
  const endLine = Math.min(lines.length, hit.line + contextLines)
  
  return lines.slice(startLine, endLine).map((line, index) => {
    const lineNumber = startLine + index + 1
    const isHitLine = lineNumber === hit.line
    return `${lineNumber.toString().padStart(3, ' ')}${isHitLine ? '>' : ' '} ${line}`
  })
}