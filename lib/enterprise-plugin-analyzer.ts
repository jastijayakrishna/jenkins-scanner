/**
 * Enterprise Plugin Analyzer
 * 
 * AI-powered Jenkins plugin analysis with real-time compatibility assessment,
 * intelligent mapping, and enterprise-grade reliability.
 */

import { PluginCompatibilityStatus, PluginScanResult, ScannedPlugin, DatabaseService } from './database'

interface JenkinsPluginUsage {
  pluginName: string
  version?: string
  usageContext: string
  lineNumber: number
  stepName?: string
  parameters?: Record<string, any>
}

interface PluginAnalysisContext {
  jenkinsContent: string
  projectType?: 'maven' | 'gradle' | 'nodejs' | 'dotnet' | 'python' | 'other'
  detectedFeatures: string[]
  complexityLevel: 'simple' | 'medium' | 'complex'
}

/**
 * Enterprise Jenkins Plugin Analyzer
 * Uses AI and rule-based analysis for comprehensive plugin compatibility assessment
 */
export class EnterprisePluginAnalyzer {
  private static readonly CRITICAL_PLUGINS = [
    'pipeline-stage-step',
    'workflow-aggregator',
    'pipeline-build-step',
    'credentials-binding',
    'git',
    'subversion'
  ]
  
  private static readonly COMMON_PLUGIN_PATTERNS = [
    // Build tools
    { pattern: /withMaven\s*\(/g, plugin: 'pipeline-maven', context: 'Maven build step' },
    { pattern: /withGradle\s*\(/g, plugin: 'gradle', context: 'Gradle build step' },
    { pattern: /withAnt\s*\(/g, plugin: 'ant', context: 'Ant build step' },
    
    // SCM
    { pattern: /checkout\s*scm/g, plugin: 'git', context: 'Source checkout' },
    { pattern: /git\s*url:/g, plugin: 'git', context: 'Git SCM configuration' },
    { pattern: /svn\s*url:/g, plugin: 'subversion', context: 'SVN SCM configuration' },
    
    // Credentials
    { pattern: /withCredentials\s*\(/g, plugin: 'credentials-binding', context: 'Credentials binding' },
    { pattern: /usernamePassword\s*\(/g, plugin: 'credentials-binding', context: 'Username/password credentials' },
    { pattern: /string\s*\(credentialsId:/g, plugin: 'credentials-binding', context: 'String credentials' },
    
    // Docker
    { pattern: /docker\s*\./g, plugin: 'docker-workflow', context: 'Docker pipeline steps' },
    { pattern: /docker\s*\{/g, plugin: 'docker-workflow', context: 'Docker agent' },
    
    // Notifications
    { pattern: /slackSend\s*\(/g, plugin: 'slack', context: 'Slack notifications' },
    { pattern: /emailext\s*\(/g, plugin: 'email-ext', context: 'Extended email notifications' },
    { pattern: /hipchatSend\s*\(/g, plugin: 'hipchat', context: 'HipChat notifications' },
    
    // Testing
    { pattern: /junit\s*\(/g, plugin: 'junit', context: 'JUnit test results' },
    { pattern: /publishTestResults\s*\(/g, plugin: 'junit', context: 'Test results publishing' },
    { pattern: /jacoco\s*\(/g, plugin: 'jacoco', context: 'Code coverage' },
    { pattern: /sonarqube\s*\(/g, plugin: 'sonar', context: 'SonarQube analysis' },
    
    // Artifacts
    { pattern: /archiveArtifacts\s*\(/g, plugin: 'core', context: 'Archive artifacts' },
    { pattern: /publishHTML\s*\(/g, plugin: 'htmlpublisher', context: 'HTML report publishing' },
    
    // Deployment
    { pattern: /kubernetesDeploy\s*\(/g, plugin: 'kubernetes-cd', context: 'Kubernetes deployment' },
    { pattern: /ansiblePlaybook\s*\(/g, plugin: 'ansible', context: 'Ansible playbook execution' },
    { pattern: /sshagent\s*\(/g, plugin: 'ssh-agent', context: 'SSH agent' },
    
    // Security
    { pattern: /withVault\s*\(/g, plugin: 'hashicorp-vault', context: 'HashiCorp Vault integration' },
    { pattern: /withAWSParameterStore\s*\(/g, plugin: 'aws-parameter-store', context: 'AWS Parameter Store' },
    
    // Build triggers
    { pattern: /pollSCM\s*\(/g, plugin: 'core', context: 'SCM polling trigger' },
    { pattern: /cron\s*\(/g, plugin: 'core', context: 'Cron trigger' },
    { pattern: /upstream\s*\(/g, plugin: 'core', context: 'Upstream project trigger' }
  ]
  
  /**
   * Analyze Jenkins pipeline for plugin usage and compatibility
   */
  static async analyzePlugins(
    jenkinsContent: string,
    projectId: string,
    userId: string
  ): Promise<PluginScanResult> {
    const context = this.buildAnalysisContext(jenkinsContent)
    const pluginUsages = this.extractPluginUsages(jenkinsContent)
    
    console.log(`🔍 Analyzing ${pluginUsages.length} plugins for project ${projectId}`)
    
    const scannedPlugins: ScannedPlugin[] = []
    let compatibleCount = 0
    let partialCount = 0
    let unsupportedCount = 0
    let blockingIssues = 0
    
    // Analyze each plugin with AI assistance
    for (const usage of pluginUsages) {
      const plugin = await this.analyzeIndividualPlugin(usage, context)
      scannedPlugins.push(plugin)
      
      // Count compatibility stats
      switch (plugin.compatibility_status) {
        case PluginCompatibilityStatus.COMPATIBLE:
          compatibleCount++
          break
        case PluginCompatibilityStatus.PARTIAL:
          partialCount++
          if (plugin.is_blocking) blockingIssues++
          break
        case PluginCompatibilityStatus.UNSUPPORTED:
          unsupportedCount++
          if (plugin.is_blocking) blockingIssues++
          break
      }
    }
    
    // Generate AI recommendations
    const aiRecommendations = await this.generateAIRecommendations(scannedPlugins, context)
    
    const scanResult: PluginScanResult = {
      id: '', // Will be set by database
      project_id: projectId,
      jenkins_content: jenkinsContent,
      scanned_at: new Date(),
      total_plugins: pluginUsages.length,
      compatible_plugins: compatibleCount,
      partial_plugins: partialCount,
      unsupported_plugins: unsupportedCount,
      blocking_issues: blockingIssues,
      plugins: scannedPlugins,
      ai_recommendations: aiRecommendations,
      created_by: userId
    }
    
    // Save to database
    const scanId = await DatabaseService.savePluginScanResult(scanResult)
    scanResult.id = scanId
    
    // Log audit trail
    await DatabaseService.logAuditTrail(
      'plugin_analysis',
      'plugin_scan_result',
      scanId,
      userId,
      {
        total_plugins: pluginUsages.length,
        blocking_issues: blockingIssues,
        compatibility_score: Math.round((compatibleCount / pluginUsages.length) * 100)
      }
    )
    
    return scanResult
  }
  
  /**
   * Build analysis context from Jenkins content
   */
  private static buildAnalysisContext(jenkinsContent: string): PluginAnalysisContext {
    const detectedFeatures: string[] = []
    let projectType: 'maven' | 'gradle' | 'nodejs' | 'dotnet' | 'python' | 'other' = 'other'
    let complexityLevel: 'simple' | 'medium' | 'complex' = 'simple'
    
    // Detect project type
    if (/mvn|maven|pom\.xml/i.test(jenkinsContent)) {
      projectType = 'maven'
      detectedFeatures.push('Maven build system')
    }
    if (/gradlew|gradle|build\.gradle/i.test(jenkinsContent)) {
      projectType = 'gradle'
      detectedFeatures.push('Gradle build system')
    }
    if (/npm|yarn|package\.json|node/i.test(jenkinsContent)) {
      projectType = 'nodejs'
      detectedFeatures.push('Node.js project')
    }
    if (/dotnet|msbuild|\.csproj|nuget/i.test(jenkinsContent)) {
      projectType = 'dotnet'
      detectedFeatures.push('.NET project')
    }
    if (/python|pip|pytest|setup\.py/i.test(jenkinsContent)) {
      projectType = 'python'
      detectedFeatures.push('Python project')
    }
    
    // Detect features
    if (/docker/i.test(jenkinsContent)) detectedFeatures.push('Docker integration')
    if (/kubernetes|k8s/i.test(jenkinsContent)) detectedFeatures.push('Kubernetes deployment')
    if (/sonar/i.test(jenkinsContent)) detectedFeatures.push('Code quality analysis')
    if (/junit|test/i.test(jenkinsContent)) detectedFeatures.push('Automated testing')
    if (/slack|email|notification/i.test(jenkinsContent)) detectedFeatures.push('Notifications')
    if (/matrix|parallel/i.test(jenkinsContent)) detectedFeatures.push('Parallel execution')
    
    // Determine complexity
    const lines = jenkinsContent.split('\n').length
    const stageCount = (jenkinsContent.match(/stage\s*\(/g) || []).length
    const stepCount = (jenkinsContent.match(/\s+(sh|bat|powershell|script)\s*['"]/g) || []).length
    
    if (lines > 200 || stageCount > 8 || stepCount > 15) {
      complexityLevel = 'complex'
    } else if (lines > 100 || stageCount > 4 || stepCount > 8) {
      complexityLevel = 'medium'
    }
    
    return {
      jenkinsContent,
      projectType,
      detectedFeatures,
      complexityLevel
    }
  }
  
  /**
   * Extract plugin usages from Jenkins content
   */
  private static extractPluginUsages(jenkinsContent: string): JenkinsPluginUsage[] {
    const usages: JenkinsPluginUsage[] = []
    const lines = jenkinsContent.split('\n')
    
    // Use pattern matching to find plugin usages
    for (const pattern of this.COMMON_PLUGIN_PATTERNS) {
      let match
      while ((match = pattern.pattern.exec(jenkinsContent)) !== null) {
        const lineNumber = this.getLineNumber(jenkinsContent, match.index)
        const context = this.extractUsageContext(lines, lineNumber - 1)
        
        usages.push({
          pluginName: pattern.plugin,
          usageContext: `${pattern.context}: ${context}`,
          lineNumber
        })
      }
    }
    
    // Extract plugins from @Library declarations
    const libraryMatches = jenkinsContent.match(/@Library\(['"]([^'"]+)['"]\)/g)
    if (libraryMatches) {
      libraryMatches.forEach(match => {
        const libraryName = match.match(/@Library\(['"]([^'"]+)['"]\)/)?.[1]
        if (libraryName) {
          const lineNumber = this.getLineNumber(jenkinsContent, jenkinsContent.indexOf(match))
          usages.push({
            pluginName: 'shared-library',
            usageContext: `Shared library: ${libraryName}`,
            lineNumber
          })
        }
      })
    }
    
    // Remove duplicates
    const uniqueUsages = usages.filter((usage, index, array) => 
      array.findIndex(u => u.pluginName === usage.pluginName && u.lineNumber === usage.lineNumber) === index
    )
    
    return uniqueUsages
  }
  
  /**
   * Analyze individual plugin for compatibility
   */
  private static async analyzeIndividualPlugin(
    usage: JenkinsPluginUsage,
    context: PluginAnalysisContext
  ): Promise<ScannedPlugin> {
    // Check database for known mapping
    const knownMapping = await DatabaseService.getPluginMapping(usage.pluginName, usage.version)
    
    if (knownMapping) {
      return {
        plugin_name: usage.pluginName,
        plugin_version: usage.version,
        usage_context: usage.usageContext,
        line_number: usage.lineNumber,
        compatibility_status: knownMapping.compatibility_status,
        gitlab_equivalent: knownMapping.gitlab_equivalent,
        migration_notes: knownMapping.migration_notes,
        is_blocking: knownMapping.criticality_level === 'critical' && knownMapping.compatibility_status !== PluginCompatibilityStatus.COMPATIBLE,
        workaround_available: knownMapping.workaround_required,
        documentation_url: knownMapping.documentation_url
      }
    }
    
    // Use AI to analyze unknown plugin
    return await this.analyzePluginWithAI(usage, context)
  }
  
  /**
   * Use AI to analyze plugin compatibility
   */
  private static async analyzePluginWithAI(
    usage: JenkinsPluginUsage,
    context: PluginAnalysisContext
  ): Promise<ScannedPlugin> {
    const aiPrompt = `You are an expert DevOps engineer specializing in Jenkins to GitLab CI migrations.

Analyze this Jenkins plugin for GitLab CI compatibility:

**Plugin:** ${usage.pluginName} ${usage.version || '(latest)'}
**Usage Context:** ${usage.usageContext}
**Project Type:** ${context.projectType}
**Project Features:** ${context.detectedFeatures.join(', ')}
**Complexity:** ${context.complexityLevel}

Provide analysis in this JSON format:
{
  "compatibility_status": "compatible|partial|unsupported",
  "gitlab_equivalent": "GitLab CI equivalent or null",
  "migration_notes": "Detailed migration guidance",
  "is_blocking": boolean,
  "workaround_available": boolean,
  "documentation_url": "URL to migration docs or null"
}

Focus on:
1. Direct GitLab CI equivalents
2. Required manual configuration
3. Migration complexity and blockers
4. Best practices for this plugin type`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: aiPrompt
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`)
      }

      const data = await response.json()
      const aiAnalysis = JSON.parse(data.content[0].text)

      return {
        plugin_name: usage.pluginName,
        plugin_version: usage.version,
        usage_context: usage.usageContext,
        line_number: usage.lineNumber,
        compatibility_status: aiAnalysis.compatibility_status as PluginCompatibilityStatus,
        gitlab_equivalent: aiAnalysis.gitlab_equivalent,
        migration_notes: aiAnalysis.migration_notes,
        is_blocking: aiAnalysis.is_blocking,
        workaround_available: aiAnalysis.workaround_available,
        documentation_url: aiAnalysis.documentation_url
      }
    } catch (error) {
      console.error('AI plugin analysis failed:', error)
      
      // Enhanced fallback analysis with rule-based mapping
      return this.getFallbackPluginAnalysis(usage)
    }
  }
  
  /**
   * Enhanced fallback analysis with rule-based plugin mapping
   */
  private static getFallbackPluginAnalysis(usage: JenkinsPluginUsage): ScannedPlugin {
    // Rule-based plugin compatibility mapping
    const pluginMappings: Record<string, {
      compatibility: PluginCompatibilityStatus,
      gitlabEquivalent?: string,
      notes: string,
      isBlocking: boolean
    }> = {
      'credentials-binding': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab CI/CD Variables',
        notes: 'Use GitLab CI/CD variables with masking enabled. Configure in Project Settings > CI/CD > Variables.',
        isBlocking: false
      },
      'docker-workflow': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'Docker executor & services',
        notes: 'Use Docker images in GitLab CI. Configure docker:dind service for Docker-in-Docker builds.',
        isBlocking: false
      },
      'slack': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab Slack integration',
        notes: 'Configure Slack integration in GitLab project settings or use webhook notifications.',
        isBlocking: false
      },
      'git': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'Native GitLab Git integration',
        notes: 'GitLab CI has built-in Git operations. No additional configuration needed.',
        isBlocking: false
      },
      'core': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab CI built-in features',
        notes: 'Core Jenkins features have GitLab CI equivalents. Review specific usage for exact mapping.',
        isBlocking: false
      },
      'shared-library': {
        compatibility: PluginCompatibilityStatus.PARTIAL,
        gitlabEquivalent: 'GitLab CI templates & includes',
        notes: 'Use GitLab CI templates and include statements. May require refactoring of shared library code.',
        isBlocking: false
      },
      'pipeline-stage-step': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab CI stages',
        notes: 'Directly translatable to GitLab CI stages and jobs.',
        isBlocking: false
      },
      'junit': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab test reports',
        notes: 'Use artifacts:reports:junit in GitLab CI for test result publishing.',
        isBlocking: false
      },
      'sonar': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'SonarQube integration',
        notes: 'Configure SonarQube integration in GitLab CI using sonar-scanner Docker image.',
        isBlocking: false
      },
      'email-ext': {
        compatibility: PluginCompatibilityStatus.COMPATIBLE,
        gitlabEquivalent: 'GitLab email notifications',
        notes: 'Use GitLab notification settings or custom email scripts in pipeline.',
        isBlocking: false
      }
    }

    const mapping = pluginMappings[usage.pluginName] || {
      compatibility: PluginCompatibilityStatus.PARTIAL,
      notes: `Plugin '${usage.pluginName}' requires manual review for GitLab CI compatibility. Check GitLab documentation for equivalent features.`,
      isBlocking: this.CRITICAL_PLUGINS.includes(usage.pluginName)
    }

    return {
      plugin_name: usage.pluginName,
      plugin_version: usage.version,
      usage_context: usage.usageContext,
      line_number: usage.lineNumber,
      compatibility_status: mapping.compatibility,
      gitlab_equivalent: mapping.gitlabEquivalent,
      migration_notes: mapping.notes,
      is_blocking: mapping.isBlocking,
      workaround_available: mapping.compatibility !== PluginCompatibilityStatus.UNSUPPORTED,
      documentation_url: 'https://docs.gitlab.com/ee/ci/'
    }
  }

  /**
   * Generate AI-powered recommendations for the entire plugin set
   */
  private static async generateAIRecommendations(
    plugins: ScannedPlugin[],
    context: PluginAnalysisContext
  ): Promise<string[]> {
    const blockingPlugins = plugins.filter(p => p.is_blocking)
    const unsupportedPlugins = plugins.filter(p => p.compatibility_status === PluginCompatibilityStatus.UNSUPPORTED)
    
    const aiPrompt = `As a DevOps migration expert, provide 3-5 actionable recommendations for this Jenkins to GitLab CI migration:

**Project Context:**
- Type: ${context.projectType}
- Complexity: ${context.complexityLevel}
- Features: ${context.detectedFeatures.join(', ')}

**Plugin Analysis:**
- Total plugins: ${plugins.length}
- Blocking issues: ${blockingPlugins.length}
- Unsupported plugins: ${unsupportedPlugins.length}

**Blocking Plugins:** ${blockingPlugins.map(p => p.plugin_name).join(', ')}
**Unsupported Plugins:** ${unsupportedPlugins.map(p => p.plugin_name).join(', ')}

Provide specific, actionable recommendations as a JSON array of strings. Focus on:
1. Migration priority order
2. Alternative solutions for unsupported plugins
3. GitLab CI feature advantages
4. Risk mitigation strategies`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: aiPrompt
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`)
      }

      const data = await response.json()
      return JSON.parse(data.content[0].text)
    } catch (error) {
      console.error('AI recommendations failed:', error)
      return [
        'Review all blocking plugins before migration',
        'Plan manual workarounds for unsupported features',
        'Consider GitLab CI native alternatives',
        'Test conversion in a staging environment first'
      ]
    }
  }
  
  /**
   * Helper: Get line number from string index
   */
  private static getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length
  }
  
  /**
   * Helper: Extract usage context around a line
   */
  private static extractUsageContext(lines: string[], lineIndex: number): string {
    const contextLines = lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2))
    return contextLines.join(' ').trim().substring(0, 100) + '...'
  }
}