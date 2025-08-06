/**
 * Core AI Service for Jenkins Scanner
 * Provides intelligent analysis, recommendations, and insights
 */

import { ScanResult } from '@/types'
import { CredentialHit } from './cred-scanner'
import { plugins } from './plugins'
import type { PluginMatch } from '@/types'

// AI Analysis Types
export interface AIAnalysisContext {
  jenkinsfile: string
  scanResult: ScanResult
  plugins: PluginMatch[]
  credentials: CredentialHit[]
  projectContext?: {
    language?: string
    framework?: string
    size?: 'small' | 'medium' | 'large' | 'enterprise'
    industry?: string
  }
}

export interface AIInsight {
  id: string
  type: 'warning' | 'error' | 'info' | 'success' | 'optimization'
  category: 'security' | 'performance' | 'maintainability' | 'compatibility' | 'cost'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-1
  recommendation: string
  actions?: AIAction[]
  relatedInsights?: string[]
}

export interface AIAction {
  id: string
  title: string
  description: string
  type: 'code_change' | 'configuration' | 'documentation' | 'manual'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  priority: number
  code?: {
    file: string
    changes: Array<{
      line: number
      old: string
      new: string
    }>
  }
}

export interface MigrationComplexity {
  overall: 'simple' | 'moderate' | 'complex' | 'enterprise'
  score: number // 0-100
  factors: {
    pluginCount: number
    customPlugins: number
    pipelineComplexity: number
    credentialComplexity: number
    integrationComplexity: number
  }
  estimatedEffort: {
    hours: number
    days: number
    confidence: number
  }
}

export interface AIRecommendation {
  id: string
  title: string
  description: string
  category: 'migration' | 'optimization' | 'security' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: string
  implementation: string
  resources: string[]
  risks: string[]
  benefits: string[]
}

/**
 * Core AI Service Class
 */
export class AIService {
  private knowledgeBase: Map<string, any> = new Map()
  private patterns: Map<string, RegExp> = new Map()
  private rules: AIRule[] = []

  constructor() {
    this.initializeKnowledgeBase()
    this.initializePatterns()
    this.initializeRules()
  }

  /**
   * Perform comprehensive AI analysis
   */
  async analyzeJenkinsPipeline(context: AIAnalysisContext): Promise<{
    insights: AIInsight[]
    complexity: MigrationComplexity
    recommendations: AIRecommendation[]
    riskAssessment: RiskAssessment
    migrationPath: MigrationPath
  }> {
    const insights = await this.generateInsights(context)
    const complexity = this.assessComplexity(context)
    const recommendations = this.generateRecommendations(context, insights)
    const riskAssessment = this.assessRisks(context, insights)
    const migrationPath = this.generateMigrationPath(context, complexity, recommendations)

    return {
      insights,
      complexity,
      recommendations,
      riskAssessment,
      migrationPath
    }
  }

  /**
   * Generate AI-powered insights
   */
  private async generateInsights(context: AIAnalysisContext): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Security insights
    insights.push(...this.analyzeSecurityPatterns(context))
    
    // Performance insights
    insights.push(...this.analyzePerformancePatterns(context))
    
    // Compatibility insights
    insights.push(...this.analyzeCompatibilityIssues(context))
    
    // Maintainability insights
    insights.push(...this.analyzeMaintainabilityIssues(context))
    
    // Cost optimization insights
    insights.push(...this.analyzeCostOptimizations(context))

    return insights.sort((a, b) => b.confidence * this.getPriorityWeight(b.impact) - 
                                   a.confidence * this.getPriorityWeight(a.impact))
  }

  /**
   * Assess migration complexity using AI
   */
  private assessComplexity(context: AIAnalysisContext): MigrationComplexity {
    const factors = {
      pluginCount: this.calculatePluginComplexity(context.plugins),
      customPlugins: this.calculateCustomPluginComplexity(context.plugins),
      pipelineComplexity: this.calculatePipelineComplexity(context.jenkinsfile),
      credentialComplexity: this.calculateCredentialComplexity(context.credentials),
      integrationComplexity: this.calculateIntegrationComplexity(context)
    }

    const score = this.calculateComplexityScore(factors)
    const overall = this.determineComplexityLevel(score)
    const estimatedEffort = this.estimateEffort(score, factors)

    return {
      overall,
      score,
      factors,
      estimatedEffort
    }
  }

  /**
   * Generate intelligent recommendations
   */
  private generateRecommendations(context: AIAnalysisContext, insights: AIInsight[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    // Migration strategy recommendations
    recommendations.push(...this.generateMigrationRecommendations(context))
    
    // Security recommendations
    recommendations.push(...this.generateSecurityRecommendations(context, insights))
    
    // Performance recommendations
    recommendations.push(...this.generatePerformanceRecommendations(context, insights))
    
    // Maintenance recommendations
    recommendations.push(...this.generateMaintenanceRecommendations(context))

    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
  }

  /**
   * Security pattern analysis
   */
  private analyzeSecurityPatterns(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = []

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']+["']/gi,
      /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
      /token\s*[:=]\s*["'][^"']+["']/gi,
      /secret\s*[:=]\s*["'][^"']+["']/gi
    ]

    for (const pattern of secretPatterns) {
      const matches = context.jenkinsfile.match(pattern)
      if (matches) {
        insights.push({
          id: `security-hardcoded-${Date.now()}`,
          type: 'error',
          category: 'security',
          title: 'Hardcoded Secrets Detected',
          description: `Found ${matches.length} potential hardcoded secret(s) in pipeline`,
          impact: 'critical',
          confidence: 0.85,
          recommendation: 'Replace hardcoded secrets with GitLab CI/CD variables or vault integration',
          actions: [{
            id: 'replace-secrets',
            title: 'Replace with Variables',
            description: 'Convert hardcoded secrets to GitLab variables',
            type: 'configuration',
            difficulty: 'medium',
            estimatedTime: '30-60 minutes',
            priority: 1
          }]
        })
      }
    }

    // Check for insecure practices
    if (context.jenkinsfile.includes('--insecure') || context.jenkinsfile.includes('-k')) {
      insights.push({
        id: 'security-insecure-ssl',
        type: 'warning',
        category: 'security',
        title: 'Insecure SSL Configuration',
        description: 'Pipeline uses insecure SSL settings that bypass certificate validation',
        impact: 'high',
        confidence: 0.9,
        recommendation: 'Remove insecure SSL flags and properly configure certificate validation'
      })
    }

    return insights
  }

  /**
   * Performance pattern analysis
   */
  private analyzePerformancePatterns(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = []

    // Check for parallel execution opportunities
    const stageCount = (context.jenkinsfile.match(/stage\s*\(/g) || []).length
    const parallelCount = (context.jenkinsfile.match(/parallel\s*\{/g) || []).length
    
    if (stageCount > 3 && parallelCount === 0) {
      insights.push({
        id: 'performance-parallel-opportunity',
        type: 'optimization',
        category: 'performance',
        title: 'Parallel Execution Opportunity',
        description: `Pipeline has ${stageCount} stages that could potentially run in parallel`,
        impact: 'medium',
        confidence: 0.7,
        recommendation: 'Consider parallelizing independent stages to reduce build time'
      })
    }

    // Check for caching opportunities
    const buildTools = ['maven', 'gradle', 'npm', 'yarn', 'pip']
    const foundTools = buildTools.filter(tool => context.jenkinsfile.toLowerCase().includes(tool))
    
    if (foundTools.length > 0 && !context.jenkinsfile.includes('cache')) {
      insights.push({
        id: 'performance-caching-opportunity',
        type: 'optimization',
        category: 'performance',
        title: 'Dependency Caching Opportunity',
        description: `Build tools detected (${foundTools.join(', ')}) but no caching configured`,
        impact: 'medium',
        confidence: 0.8,
        recommendation: 'Add dependency caching to speed up builds and reduce network usage'
      })
    }

    return insights
  }

  /**
   * Compatibility analysis
   */
  private analyzeCompatibilityIssues(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = []

    // Check for deprecated plugins
    const deprecatedPlugins = context.plugins.filter(p => 
      this.knowledgeBase.get('deprecatedPlugins')?.includes(p.name)
    )

    if (deprecatedPlugins.length > 0) {
      insights.push({
        id: 'compatibility-deprecated-plugins',
        type: 'warning',
        category: 'compatibility',
        title: 'Deprecated Plugins Detected',
        description: `Found ${deprecatedPlugins.length} deprecated plugin(s): ${deprecatedPlugins.map(p => p.name).join(', ')}`,
        impact: 'high',
        confidence: 0.95,
        recommendation: 'Update to supported alternatives before migration'
      })
    }

    return insights
  }

  /**
   * Initialize AI knowledge base
   */
  private initializeKnowledgeBase(): void {
    // Plugin compatibility database
    this.knowledgeBase.set('deprecatedPlugins', [
      'findbugs', 'pmd', 'checkstyle', 'cobertura', 'emma'
    ])

    this.knowledgeBase.set('pluginAlternatives', {
      'findbugs': 'spotbugs',
      'cobertura': 'jacoco',
      'emma': 'jacoco'
    })

    // Security patterns
    this.knowledgeBase.set('securityPatterns', {
      secrets: [
        'password', 'passwd', 'pwd', 'secret', 'key', 'token',
        'api_key', 'apikey', 'access_key', 'private_key'
      ],
      vulnerableCommands: [
        'curl --insecure', 'wget --no-check-certificate',
        'git clone http://', 'pip install --trusted-host'
      ]
    })

    // Performance optimizations
    this.knowledgeBase.set('performancePatterns', {
      parallelizable: ['test', 'lint', 'security-scan', 'build'],
      cacheable: ['node_modules', '.m2', '.gradle', 'pip-cache', 'go-cache']
    })
  }

  /**
   * Initialize pattern matching
   */
  private initializePatterns(): void {
    this.patterns.set('dockerCommands', /docker\s+(build|run|push|pull)/gi)
    this.patterns.set('testCommands', /(npm test|mvn test|gradle test|pytest)/gi)
    this.patterns.set('buildCommands', /(npm build|mvn compile|gradle build)/gi)
  }

  /**
   * Initialize AI rules
   */
  private initializeRules(): void {
    this.rules = [
      {
        id: 'parallel-stages',
        condition: (context) => this.hasIndependentStages(context),
        insight: {
          type: 'optimization',
          category: 'performance',
          title: 'Parallel Execution Recommended',
          impact: 'medium'
        }
      }
    ]
  }

  // Helper methods
  private getPriorityWeight(priority: string): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 }
    return weights[priority as keyof typeof weights] || 1
  }

  private calculatePluginComplexity(plugins: PluginMatch[]): number {
    return Math.min(plugins.length * 2, 50)
  }

  private calculateCustomPluginComplexity(plugins: PluginMatch[]): number {
    const customPlugins = plugins.filter(p => !this.knowledgeBase.get('standardPlugins')?.includes(p.name))
    return customPlugins.length * 10
  }

  private calculatePipelineComplexity(jenkinsfile: string): number {
    const stageCount = (jenkinsfile.match(/stage\s*\(/g) || []).length
    const stepCount = (jenkinsfile.match(/steps\s*\{/g) || []).length
    const conditionalCount = (jenkinsfile.match(/when\s*\{/g) || []).length
    
    return Math.min((stageCount * 5) + (stepCount * 2) + (conditionalCount * 8), 100)
  }

  private calculateCredentialComplexity(credentials: CredentialHit[]): number {
    return Math.min(credentials.length * 5, 30)
  }

  private calculateIntegrationComplexity(context: AIAnalysisContext): number {
    const integrations = this.detectIntegrations(context.jenkinsfile)
    return Math.min(integrations.length * 8, 40)
  }

  private calculateComplexityScore(factors: any): number {
    return Math.min(
      factors.pluginCount + 
      factors.customPlugins + 
      factors.pipelineComplexity + 
      factors.credentialComplexity + 
      factors.integrationComplexity,
      100
    )
  }

  private determineComplexityLevel(score: number): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    if (score <= 25) return 'simple'
    if (score <= 50) return 'moderate'
    if (score <= 75) return 'complex'
    return 'enterprise'
  }

  private estimateEffort(score: number, factors: any): { hours: number, days: number, confidence: number } {
    const baseHours = Math.max(8, score * 0.8)
    const complexityMultiplier = factors.customPlugins > 0 ? 1.5 : 1.0
    const totalHours = baseHours * complexityMultiplier
    
    return {
      hours: Math.round(totalHours),
      days: Math.round(totalHours / 8),
      confidence: Math.max(0.6, 1 - (score / 200))
    }
  }

  private generateMigrationRecommendations(context: AIAnalysisContext): AIRecommendation[] {
    return [{
      id: 'migration-strategy',
      title: 'Phased Migration Approach',
      description: 'Implement migration in phases to minimize risk and validate each step',
      category: 'migration',
      priority: 'high',
      impact: 'Reduces migration risk and allows for iterative improvements',
      implementation: 'Start with simple pipelines, then gradually migrate complex ones',
      resources: ['GitLab documentation', 'Migration checklist', 'Rollback procedures'],
      risks: ['Temporary maintenance of two systems'],
      benefits: ['Lower risk', 'Easier rollback', 'Learning opportunity']
    }]
  }

  private generateSecurityRecommendations(context: AIAnalysisContext, insights: AIInsight[]): AIRecommendation[] {
    const securityInsights = insights.filter(i => i.category === 'security')
    if (securityInsights.length === 0) return []

    return [{
      id: 'security-audit',
      title: 'Security Audit and Hardening',
      description: 'Comprehensive security review of migration configuration',
      category: 'security',
      priority: 'critical',
      impact: 'Ensures secure migration and ongoing operations',
      implementation: 'Review all credentials, network configurations, and access controls',
      resources: ['Security checklist', 'Vulnerability scanner', 'Security team review'],
      risks: ['Security vulnerabilities in migrated pipelines'],
      benefits: ['Enhanced security posture', 'Compliance readiness']
    }]
  }

  private generatePerformanceRecommendations(context: AIAnalysisContext, insights: AIInsight[]): AIRecommendation[] {
    return [{
      id: 'performance-optimization',
      title: 'Pipeline Performance Optimization',
      description: 'Optimize pipeline execution time and resource usage',
      category: 'optimization',
      priority: 'medium',
      impact: 'Reduces build times and infrastructure costs',
      implementation: 'Implement caching, parallelization, and resource optimization',
      resources: ['Performance monitoring', 'Caching strategies', 'Parallel execution patterns'],
      risks: ['Initial configuration complexity'],
      benefits: ['Faster builds', 'Lower costs', 'Better developer experience']
    }]
  }

  private generateMaintenanceRecommendations(context: AIAnalysisContext): AIRecommendation[] {
    return [{
      id: 'maintenance-strategy',
      title: 'Ongoing Maintenance and Monitoring',
      description: 'Establish monitoring and maintenance procedures for migrated pipelines',
      category: 'maintenance',
      priority: 'medium',
      impact: 'Ensures long-term success and reliability of migrated pipelines',
      implementation: 'Set up monitoring, alerting, and regular review processes',
      resources: ['Monitoring tools', 'Alerting systems', 'Maintenance runbooks'],
      risks: ['Technical debt accumulation without proper maintenance'],
      benefits: ['Proactive issue detection', 'Continuous improvement', 'Operational excellence']
    }]
  }

  private hasIndependentStages(context: AIAnalysisContext): boolean {
    const stageCount = (context.jenkinsfile.match(/stage\s*\(/g) || []).length
    return stageCount > 2
  }

  private detectIntegrations(jenkinsfile: string): string[] {
    const integrations = []
    const patterns = {
      'Docker': /docker/i,
      'Kubernetes': /kubectl|k8s/i,
      'AWS': /aws|s3|ec2|lambda/i,
      'SonarQube': /sonar/i,
      'Slack': /slack/i,
      'JIRA': /jira/i
    }

    for (const [name, pattern] of Object.entries(patterns)) {
      if (pattern.test(jenkinsfile)) {
        integrations.push(name)
      }
    }

    return integrations
  }

  private analyzeMaintainabilityIssues(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = []

    // Check for pipeline length
    const lineCount = context.jenkinsfile.split('\n').length
    if (lineCount > 500) {
      insights.push({
        id: 'maintainability-long-pipeline',
        type: 'warning',
        category: 'maintainability',
        title: 'Long Pipeline File',
        description: `Pipeline file has ${lineCount} lines, which may be difficult to maintain`,
        impact: 'medium',
        confidence: 0.8,
        recommendation: 'Consider splitting into smaller, reusable components'
      })
    }

    return insights
  }

  private analyzeCostOptimizations(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = []

    // Check for resource inefficiencies
    if (context.jenkinsfile.includes('node(') && !context.jenkinsfile.includes('node(\'')) {
      insights.push({
        id: 'cost-resource-optimization',
        type: 'optimization',
        category: 'cost',
        title: 'Resource Optimization Opportunity',
        description: 'Using generic nodes may lead to resource inefficiency',
        impact: 'medium',
        confidence: 0.7,
        recommendation: 'Use specific node labels to optimize resource allocation'
      })
    }

    return insights
  }

  private assessRisks(context: AIAnalysisContext, insights: AIInsight[]): RiskAssessment {
    const criticalIssues = insights.filter(i => i.impact === 'critical').length
    const highIssues = insights.filter(i => i.impact === 'high').length
    const securityIssues = insights.filter(i => i.category === 'security').length

    const riskScore = (criticalIssues * 25) + (highIssues * 15) + (securityIssues * 10)
    const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low'

    return {
      overall: riskLevel,
      score: riskScore,
      categories: {
        security: securityIssues,
        compatibility: insights.filter(i => i.category === 'compatibility').length,
        performance: insights.filter(i => i.category === 'performance').length,
        maintainability: insights.filter(i => i.category === 'maintainability').length
      },
      mitigationStrategies: this.generateMitigationStrategies(insights)
    }
  }

  private generateMigrationPath(context: AIAnalysisContext, complexity: MigrationComplexity, recommendations: AIRecommendation[]): MigrationPath {
    const phases = []
    
    // Phase 1: Preparation
    phases.push({
      name: 'Preparation',
      duration: Math.ceil(complexity.estimatedEffort.days * 0.2),
      tasks: [
        'Environment setup',
        'Credential migration',
        'Initial pipeline conversion'
      ]
    })

    // Phase 2: Core Migration
    phases.push({
      name: 'Core Migration',
      duration: Math.ceil(complexity.estimatedEffort.days * 0.5),
      tasks: [
        'Plugin replacement',
        'Pipeline logic conversion',
        'Integration updates'
      ]
    })

    // Phase 3: Testing & Optimization
    phases.push({
      name: 'Testing & Optimization',
      duration: Math.ceil(complexity.estimatedEffort.days * 0.3),
      tasks: [
        'Comprehensive testing',
        'Performance optimization',
        'Security validation'
      ]
    })

    return {
      phases,
      totalDuration: complexity.estimatedEffort.days,
      criticalPath: ['Credential migration', 'Plugin replacement', 'Integration testing'],
      dependencies: this.identifyDependencies(context),
      rollbackPlan: this.generateRollbackPlan()
    }
  }

  private generateMitigationStrategies(insights: AIInsight[]): string[] {
    const strategies = new Set<string>()
    
    insights.forEach(insight => {
      switch (insight.category) {
        case 'security':
          strategies.add('Implement comprehensive security review process')
          strategies.add('Use GitLab security scanning features')
          break
        case 'performance':
          strategies.add('Implement performance monitoring and optimization')
          break
        case 'compatibility':
          strategies.add('Establish plugin compatibility testing')
          break
      }
    })

    return Array.from(strategies)
  }

  private identifyDependencies(context: AIAnalysisContext): string[] {
    const dependencies = []
    
    if (context.credentials.length > 0) {
      dependencies.push('GitLab credentials configuration')
    }
    
    if (context.plugins.some(p => p.name.includes('docker'))) {
      dependencies.push('GitLab Container Registry setup')
    }

    return dependencies
  }

  private generateRollbackPlan(): string[] {
    return [
      'Maintain Jenkins pipeline backups',
      'Document all configuration changes',
      'Prepare quick rollback procedures',
      'Test rollback process in staging environment'
    ]
  }
}

// Supporting interfaces
interface AIRule {
  id: string
  condition: (context: AIAnalysisContext) => boolean
  insight: Partial<AIInsight>
}

export interface RiskAssessment {
  overall: 'low' | 'medium' | 'high'
  score: number
  categories: {
    security: number
    compatibility: number
    performance: number
    maintainability: number
  }
  mitigationStrategies: string[]
}

export interface MigrationPath {
  phases: Array<{
    name: string
    duration: number
    tasks: string[]
  }>
  totalDuration: number
  criticalPath: string[]
  dependencies: string[]
  rollbackPlan: string[]
}

// Export singleton instance
export const aiService = new AIService()