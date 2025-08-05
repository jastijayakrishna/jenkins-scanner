// lib/plugin-mapper.ts
import pluginMappingData from './plugins-mapping.json'

export interface PluginHit {
  id: string
  line: number
  context?: string
  confidence: 'high' | 'medium' | 'low'
}

export interface PluginMapping {
  status: 'native' | 'template' | 'unsupported' | 'limited'
  gitlab?: string
  include?: string
  note: string
  documentation?: string
  alternative?: string
}

export interface PluginVerdict {
  id: string
  status: 'native' | 'template' | 'unsupported' | 'limited'
  gitlab?: string
  include?: string
  note: string
  documentation?: string
  alternative?: string
  hits: PluginHit[]
  migrationComplexity: 'easy' | 'medium' | 'hard'
}

export interface PluginScanSummary {
  totalPlugins: number
  nativeSupport: number
  templateAvailable: number
  unsupported: number
  limited: number
  migrationScore: number // 0-100, higher is better
}

// Common Jenkins plugin detection patterns
const PLUGIN_PATTERNS = [
  // Library imports (shared libraries)
  { pattern: /@Library\(['"]([^'"]+)['"]/, group: 'shared-library', confidence: 'high' as const },
  
  // Docker Workflow Plugin (specific patterns)
  { pattern: /docker\s*\.\s*(build|image|withRegistry|withDockerRegistry|withDockerServer)/, group: 'docker-workflow', confidence: 'high' as const },
  { pattern: /docker\s*\.\s*image\s*\([^)]+\)\s*\.\s*(inside|withRun|run)/, group: 'docker-workflow', confidence: 'high' as const },
  
  // Credentials Binding Plugin
  { pattern: /\bwithCredentials\s*\(/, group: 'credentials-binding', confidence: 'high' as const },
  { pattern: /\busernamePassword\s*\(/, group: 'credentials-binding', confidence: 'high' as const },
  { pattern: /\bstring\s*\(\s*credentialsId/, group: 'credentials-binding', confidence: 'high' as const },
  { pattern: /\bfile\s*\(\s*credentialsId/, group: 'credentials-binding', confidence: 'high' as const },
  
  // Test Publishers
  { pattern: /\bjunit\s*\(/, group: 'junit', confidence: 'high' as const },
  { pattern: /\bpublishTestResults\s*\(/, group: 'junit', confidence: 'high' as const },
  { pattern: /\bpublishHTML\s*\(/, group: 'publishhtml', confidence: 'high' as const },
  
  // Artifact Management
  { pattern: /\barchiveArtifacts\s*\(/, group: 'archive-artifacts', confidence: 'high' as const },
  { pattern: /\bartifacts\s*:/, group: 'archive-artifacts', confidence: 'medium' as const },
  
  // Notifications
  { pattern: /\bslackSend\s*\(/, group: 'slack', confidence: 'high' as const },
  { pattern: /\bemailext\s*\(/, group: 'email-ext', confidence: 'high' as const },
  { pattern: /\bmail\s*\(/, group: 'email-ext', confidence: 'medium' as const },
  
  // Build Control
  { pattern: /\btimeout\s*\(/, group: 'build-timeout', confidence: 'high' as const },
  { pattern: /\bretry\s*\(/, group: 'retry', confidence: 'high' as const },
  
  // Workspace Management
  { pattern: /\bcleanWs\s*\(/, group: 'ws-cleanup', confidence: 'high' as const },
  { pattern: /\bdeleteDir\s*\(/, group: 'ws-cleanup', confidence: 'high' as const },
  
  // Tool integrations
  { pattern: /\b(withSonarQubeEnv|sonarqube)\s*[\(\{]/, group: 'sonarqube', confidence: 'high' as const },
  { pattern: /\b(withMaven|mvn)\s*[\(\{]/, group: 'maven-invoker', confidence: 'medium' as const },
  { pattern: /\b(nodejs|npm|yarn)\s*[\(\{]/, group: 'nodejs', confidence: 'medium' as const },
  { pattern: /\b(gradle|gradlew)\s*[\(\{]/, group: 'gradle', confidence: 'medium' as const },
  { pattern: /\b(python|pip)\s*[\(\{]/, group: 'python', confidence: 'medium' as const },
  { pattern: /\b(terraform|tf)\s*[\(\{]/, group: 'terraform', confidence: 'medium' as const },
  { pattern: /\b(ansible|ansible-playbook)\s*[\(\{]/, group: 'ansible', confidence: 'medium' as const },
  { pattern: /\b(helm|kubectl)\s*[\(\{]/, group: 'kubernetes-cd', confidence: 'medium' as const },
  
  // Security scanning
  { pattern: /\b(checkmarx|cx)\s*[\(\{]/, group: 'checkmarx', confidence: 'high' as const },
  { pattern: /\b(dependencyCheck|owasp)\s*[\(\{]/, group: 'dependency-check', confidence: 'high' as const },
  
  // Testing frameworks
  { pattern: /\b(selenium|webdriver)\s*[\(\{]/, group: 'selenium', confidence: 'medium' as const },
  { pattern: /\b(cypress|cy\.)\s*[\(\{]/, group: 'cypress', confidence: 'high' as const },
  { pattern: /\b(gatling|jmeter)\s*[\(\{]/, group: 'performance', confidence: 'medium' as const },
  
  // Cloud integrations
  { pattern: /\b(s3Upload|aws)\s*[\(\{]/, group: 's3', confidence: 'high' as const },
  { pattern: /\b(azureUpload|azure)\s*[\(\{]/, group: 'azure-storage', confidence: 'high' as const },
  { pattern: /\b(googleStorageUpload|gcs)\s*[\(\{]/, group: 'google-cloud-storage', confidence: 'high' as const },
  
  // Build tools and environments
  { pattern: /\b(xcodebuild|xcode)\s*[\(\{]/, group: 'xcode', confidence: 'high' as const },
  { pattern: /\b(androidEmulator|android)\s*[\(\{]/, group: 'android-emulator', confidence: 'medium' as const },
  { pattern: /\b(dotnet|msbuild)\s*[\(\{]/, group: 'dotnet', confidence: 'medium' as const },
  
  // Generic plugin detection
  { pattern: /\b([a-zA-Z][a-zA-Z0-9-_]*)\s*\{/, group: 1, confidence: 'low' as const },
]

/**
 * Scan Jenkins pipeline content for plugin usage
 */
export function scanJenkinsFile(content: string): PluginHit[] {
  const hits: PluginHit[] = []
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const trimmedLine = line.trim()
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || !trimmedLine) {
      return
    }
    
    PLUGIN_PATTERNS.forEach(({ pattern, group, confidence }) => {
      const match = line.match(pattern)
      if (match) {
        const pluginId = typeof group === 'string' ? group : match[group] || match[1]
        
        // Filter out common false positives
        if (shouldIncludePlugin(pluginId, line)) {
          hits.push({
            id: pluginId.toLowerCase(),
            line: lineNumber,
            context: trimmedLine,
            confidence
          })
        }
      }
    })
  })
  
  // Deduplicate hits by plugin ID, keeping the first occurrence
  const uniqueHits = new Map<string, PluginHit>()
  hits.forEach(hit => {
    if (!uniqueHits.has(hit.id)) {
      uniqueHits.set(hit.id, hit)
    }
  })
  
  return Array.from(uniqueHits.values()).sort((a, b) => a.line - b.line)
}

/**
 * Filter out false positives and common keywords
 */
function shouldIncludePlugin(pluginId: string, context: string): boolean {
  const excludeList = [
    // Programming keywords
    'if', 'else', 'for', 'while', 'try', 'catch', 'finally',
    'def', 'var', 'let', 'const', 'function', 'return',
    'true', 'false', 'null', 'undefined', 'string', 'number',
    'echo', 'print', 'log', 'error', 'warn', 'info', 'debug',
    
    // Jenkins pipeline structure keywords (NOT plugins)
    'stage', 'steps', 'post', 'always', 'success', 'failure', 'unstable', 'aborted',
    'agent', 'node', 'pipeline', 'properties', 'parameters',
    'when', 'not', 'branch', 'environment', 'tools', 'options',
    
    // Jenkins Declarative syntax keywords (FALSE POSITIVES)
    'stages', 'script', 'matrix', 'axes', 'axis', 'exclude', 'excludes',
    'parallel', 'expression', 'allof', 'anyof', 'changerequest',
    
    // Common build commands (not plugins)
    'sh', 'bat', 'powershell', 'cmd', 'python', 'node', 'npm', 'mvn',
    'gradle', 'make', 'cmake', 'docker', 'kubectl', 'helm',
    
    // Common file/directory names
    'src', 'test', 'build', 'target', 'dist', 'bin', 'lib', 'config'
  ]
  
  if (excludeList.includes(pluginId.toLowerCase())) {
    return false
  }
  
  // Must have reasonable length
  if (pluginId.length < 2 || pluginId.length > 50) {
    return false
  }
  
  // Avoid single characters and numbers
  if (/^[0-9]$/.test(pluginId) || /^[a-zA-Z]$/.test(pluginId)) {
    return false
  }
  
  return true
}

// Plugin aliases - multiple names that map to the same plugin
const PLUGIN_ALIASES: Record<string, string> = {
  // Docker variants
  'docker': 'docker-workflow',
  'docker-build-step': 'docker-workflow',
  'docker-build': 'docker-workflow',
  
  // Credential variants
  'withCredentials': 'credentials-binding',
  'usernamePassword': 'credentials-binding',
  'string': 'credentials-binding',
  'file': 'credentials-binding',
  
  // Test result variants
  'publishTestResults': 'junit',
  'testResults': 'junit',
  
  // Artifact variants  
  'archiveArtifacts': 'archive-artifacts',
  'artifacts': 'archive-artifacts',
  
  // Notification variants
  'slackSend': 'slack',
  'emailext': 'email-ext',
  'mail': 'email-ext',
  
  // Cleanup variants
  'cleanWs': 'ws-cleanup',
  'deleteDir': 'ws-cleanup',
  
  // Build tool variants
  'withMaven': 'maven-invoker',
  'mvn': 'maven-invoker',
  'withSonarQubeEnv': 'sonarqube',
  
  // Library imports
  '@Library': 'shared-library'
}

/**
 * Resolve plugin alias to canonical plugin ID
 */
function resolvePluginAlias(pluginId: string): string {
  return PLUGIN_ALIASES[pluginId] || pluginId
}

/**
 * Map detected plugins to GitLab CI equivalents
 */
export function mapPlugins(hits: PluginHit[]): PluginVerdict[] {
  const verdicts: PluginVerdict[] = []
  const mappingDB = pluginMappingData as Record<string, PluginMapping>
  
  // Group hits by plugin ID (with alias resolution)
  const hitsByPlugin = new Map<string, PluginHit[]>()
  hits.forEach(hit => {
    const canonicalId = resolvePluginAlias(hit.id)
    const existing = hitsByPlugin.get(canonicalId) || []
    existing.push({...hit, id: canonicalId}) // Update hit with canonical ID
    hitsByPlugin.set(canonicalId, existing)
  })
  
  hitsByPlugin.forEach((pluginHits, pluginId) => {
    const mapping = mappingDB[pluginId]
    
    if (mapping) {
      // Known plugin with mapping
      verdicts.push({
        id: pluginId,
        status: mapping.status,
        gitlab: mapping.gitlab,
        include: mapping.include,
        note: mapping.note,
        documentation: mapping.documentation,
        alternative: mapping.alternative,
        hits: pluginHits,
        migrationComplexity: getMigrationComplexity(mapping.status)
      })
    } else {
      // Unknown plugin - mark as unsupported but with potential for research
      verdicts.push({
        id: pluginId,
        status: 'unsupported',
        note: 'Unknown plugin - requires manual research and implementation',
        hits: pluginHits,
        migrationComplexity: 'hard'
      })
    }
  })
  
  return verdicts.sort((a, b) => {
    // Sort by status priority, then by plugin name
    const statusPriority = { native: 1, template: 2, limited: 3, unsupported: 4 }
    const aPriority = statusPriority[a.status] || 5
    const bPriority = statusPriority[b.status] || 5
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    return a.id.localeCompare(b.id)
  })
}

/**
 * Determine migration complexity based on plugin status
 */
function getMigrationComplexity(status: string): 'easy' | 'medium' | 'hard' {
  switch (status) {
    case 'native':
      return 'easy'
    case 'template':
      return 'medium'
    case 'limited':
      return 'medium'
    case 'unsupported':
    default:
      return 'hard'
  }
}

/**
 * Generate summary statistics from plugin verdicts
 */
export function generatePluginSummary(verdicts: PluginVerdict[]): PluginScanSummary {
  const totalPlugins = verdicts.length
  const nativeSupport = verdicts.filter(v => v.status === 'native').length
  const templateAvailable = verdicts.filter(v => v.status === 'template').length
  const limited = verdicts.filter(v => v.status === 'limited').length
  const unsupported = verdicts.filter(v => v.status === 'unsupported').length
  
  // Calculate migration score (0-100) - weighted scoring
  // Native plugins: 100 points each (perfect compatibility)
  // Template plugins: 85 points each (high compatibility with templates)
  // Limited plugins: 60 points each (partial compatibility)
  // Unsupported plugins: 0 points each (no compatibility)
  const maxScore = totalPlugins * 100
  const actualScore = (nativeSupport * 100) + (templateAvailable * 85) + (limited * 60)
  const migrationScore = totalPlugins > 0 ? Math.round((actualScore / maxScore) * 100) : 100
  
  return {
    totalPlugins,
    nativeSupport,
    templateAvailable,
    unsupported,
    limited,
    migrationScore
  }
}

/**
 * Generate markdown checklist for migration planning
 */
export function generateMigrationChecklist(verdicts: PluginVerdict[]): string {
  const summary = generatePluginSummary(verdicts)
  
  let markdown = `# Jenkins to GitLab CI Migration Checklist\n\n`
  markdown += `## Summary\n\n`
  markdown += `- **Total Plugins:** ${summary.totalPlugins}\n`
  markdown += `- **Migration Score:** ${summary.migrationScore}/100\n`
  markdown += `- **Native Support:** ${summary.nativeSupport} plugins\n`
  markdown += `- **Template Available:** ${summary.templateAvailable} plugins\n`
  markdown += `- **Limited Support:** ${summary.limited} plugins\n`
  markdown += `- **Unsupported:** ${summary.unsupported} plugins\n\n`
  
  // Group by status
  const byStatus = {
    native: verdicts.filter(v => v.status === 'native'),
    template: verdicts.filter(v => v.status === 'template'),
    limited: verdicts.filter(v => v.status === 'limited'),
    unsupported: verdicts.filter(v => v.status === 'unsupported')
  }
  
  if (byStatus.native.length > 0) {
    markdown += `## ✅ Native Support (Easy Migration)\n\n`
    byStatus.native.forEach(verdict => {
      markdown += `- [ ] **${verdict.id}** → ${verdict.gitlab || 'Built-in'}\n`
      markdown += `  - ${verdict.note}\n`
      if (verdict.documentation) {
        markdown += `  - [Documentation](${verdict.documentation})\n`
      }
      markdown += `\n`
    })
  }
  
  if (byStatus.template.length > 0) {
    markdown += `## ⚠️ Template Available (Medium Migration)\n\n`
    byStatus.template.forEach(verdict => {
      markdown += `- [ ] **${verdict.id}**\n`
      markdown += `  - ${verdict.note}\n`
      if (verdict.include) {
        markdown += `  - Include: \`${verdict.include}\`\n`
      }
      markdown += `\n`
    })
  }
  
  if (byStatus.limited.length > 0) {
    markdown += `## ⚠️ Limited Support (Medium Migration)\n\n`
    byStatus.limited.forEach(verdict => {
      markdown += `- [ ] **${verdict.id}**\n`
      markdown += `  - ${verdict.note}\n`
      if (verdict.alternative) {
        markdown += `  - Alternative: ${verdict.alternative}\n`
      }
      markdown += `\n`
    })
  }
  
  if (byStatus.unsupported.length > 0) {
    markdown += `## ❌ Unsupported (Hard Migration)\n\n`
    byStatus.unsupported.forEach(verdict => {
      markdown += `- [ ] **${verdict.id}**\n`
      markdown += `  - ${verdict.note}\n`
      if (verdict.alternative) {
        markdown += `  - Alternative: ${verdict.alternative}\n`
      }
      markdown += `  - Research required for custom implementation\n`
      markdown += `\n`
    })
  }
  
  markdown += `## Migration Notes\n\n`
  markdown += `1. Start with native support plugins (✅) - these require minimal changes\n`
  markdown += `2. Add template includes (⚠️) - may require configuration adjustments\n`
  markdown += `3. Research alternatives for limited/unsupported plugins (❌)\n`
  markdown += `4. Test each plugin conversion in a development environment\n`
  markdown += `5. Update CI/CD variables and secrets as needed\n\n`
  markdown += `Generated by Jenkins Scanner on ${new Date().toISOString()}\n`
  
  return markdown
}