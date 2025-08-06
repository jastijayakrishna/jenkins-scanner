/**
 * AI-Powered Pipeline Intelligence Analyzer
 * Provides intelligent analysis of Jenkins pipelines with recommendations
 */

import { ScanResult } from '@/types'
import { AIInsight, AIRecommendation } from './ai-core'

export interface PipelineIntelligence {
  analysis: PipelineAnalysis
  performance: PerformanceAnalysis
  security: SecurityAnalysis
  maintainability: MaintainabilityAnalysis
  complexity: ComplexityAnalysis
  recommendations: PipelineRecommendation[]
  optimizations: OptimizationSuggestion[]
  riskAssessment: PipelineRiskAssessment
}

export interface PipelineAnalysis {
  structure: PipelineStructure
  patterns: DetectedPattern[]
  antiPatterns: DetectedAntiPattern[]
  bestPractices: BestPracticeCheck[]
  migrationReadiness: MigrationReadiness
}

export interface PipelineStructure {
  type: 'declarative' | 'scripted' | 'mixed'
  stages: StageAnalysis[]
  parallelism: ParallelismAnalysis
  conditionals: ConditionalAnalysis[]
  errorHandling: ErrorHandlingAnalysis
  artifacts: ArtifactAnalysis[]
}

export interface StageAnalysis {
  name: string
  type: 'build' | 'test' | 'deploy' | 'quality' | 'notification' | 'custom'
  complexity: 'simple' | 'moderate' | 'complex'
  dependencies: string[]
  duration: EstimatedDuration
  parallelizable: boolean
  optimization: StageOptimization[]
}

export interface PerformanceAnalysis {
  bottlenecks: PerformanceBottleneck[]
  parallelizationOpportunities: ParallelizationOpportunity[]
  cachingOpportunities: CachingOpportunity[]
  resourceOptimization: ResourceOptimization[]
  estimatedImprovements: PerformanceImprovement[]
}

export interface SecurityAnalysis {
  vulnerabilities: SecurityVulnerability[]
  credentialUsage: CredentialSecurityAnalysis[]
  networkSecurity: NetworkSecurityIssue[]
  secretsExposure: SecretsExposureRisk[]
  complianceChecks: ComplianceCheck[]
}

export interface MaintainabilityAnalysis {
  codeQuality: CodeQualityMetrics
  documentation: DocumentationAnalysis
  testability: TestabilityAnalysis
  modularity: ModularityAnalysis
  technicalDebt: TechnicalDebtAnalysis[]
}

export interface ComplexityAnalysis {
  overall: ComplexityScore
  cognitive: CognitiveComplexity
  cyclomatic: CyclomaticComplexity
  structural: StructuralComplexity
  migrationComplexity: MigrationComplexityScore
}

export interface PipelineRecommendation {
  id: string
  title: string
  description: string
  category: 'performance' | 'security' | 'maintainability' | 'migration' | 'cost'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: 'minor' | 'moderate' | 'significant' | 'major'
  effort: 'minimal' | 'low' | 'medium' | 'high'
  implementation: ImplementationGuide
  expectedBenefits: string[]
  risks: string[]
  timeline: string
}

export interface OptimizationSuggestion {
  id: string
  type: 'performance' | 'cost' | 'reliability' | 'security'
  title: string
  description: string
  currentState: string
  proposedState: string
  expectedImpact: ImpactMetrics
  implementationSteps: string[]
  automatable: boolean
  prerequisites: string[]
}

/**
 * AI-Powered Pipeline Intelligence Service
 */
export class PipelineIntelligenceService {
  private patterns: Map<string, PatternDefinition> = new Map()
  private antiPatterns: Map<string, AntiPatternDefinition> = new Map()
  private bestPractices: Map<string, BestPracticeDefinition> = new Map()

  constructor() {
    this.initializePatterns()
    this.initializeAntiPatterns()
    this.initializeBestPractices()
  }

  /**
   * Perform comprehensive pipeline intelligence analysis
   */
  async analyzePipeline(jenkinsfile: string, scanResult?: ScanResult): Promise<PipelineIntelligence> {
    const analysis = await this.performStructuralAnalysis(jenkinsfile)
    const performance = await this.analyzePerformance(jenkinsfile, analysis)
    const security = await this.analyzeSecurity(jenkinsfile, scanResult)
    const maintainability = await this.analyzeMaintainability(jenkinsfile, analysis)
    const complexity = await this.analyzeComplexity(jenkinsfile, analysis)
    
    const recommendations = await this.generateRecommendations(
      jenkinsfile, analysis, performance, security, maintainability, complexity
    )
    
    const optimizations = await this.generateOptimizations(
      analysis, performance, security
    )
    
    const riskAssessment = await this.assessRisks(
      analysis, security, complexity
    )

    return {
      analysis,
      performance,
      security,
      maintainability,
      complexity,
      recommendations,
      optimizations,
      riskAssessment
    }
  }

  /**
   * Perform structural analysis of pipeline
   */
  private async performStructuralAnalysis(jenkinsfile: string): Promise<PipelineAnalysis> {
    const structure = this.analyzeStructure(jenkinsfile)
    const patterns = this.detectPatterns(jenkinsfile)
    const antiPatterns = this.detectAntiPatterns(jenkinsfile)
    const bestPractices = this.checkBestPractices(jenkinsfile, structure)
    const migrationReadiness = this.assessMigrationReadiness(structure, patterns, antiPatterns)

    return {
      structure,
      patterns,
      antiPatterns,
      bestPractices,
      migrationReadiness
    }
  }

  /**
   * Analyze pipeline structure
   */
  private analyzeStructure(jenkinsfile: string): PipelineStructure {
    const type = this.determinePipelineType(jenkinsfile)
    const stages = this.analyzeStages(jenkinsfile)
    const parallelism = this.analyzeParallelism(jenkinsfile)
    const conditionals = this.analyzeConditionals(jenkinsfile)
    const errorHandling = this.analyzeErrorHandling(jenkinsfile)
    const artifacts = this.analyzeArtifacts(jenkinsfile)

    return {
      type,
      stages,
      parallelism,
      conditionals,
      errorHandling,
      artifacts
    }
  }

  /**
   * Analyze performance characteristics
   */
  private async analyzePerformance(jenkinsfile: string, analysis: PipelineAnalysis): Promise<PerformanceAnalysis> {
    const bottlenecks = this.identifyBottlenecks(jenkinsfile, analysis)
    const parallelizationOpportunities = this.identifyParallelizationOpportunities(analysis)
    const cachingOpportunities = this.identifyCachingOpportunities(jenkinsfile)
    const resourceOptimization = this.analyzeResourceUsage(jenkinsfile)
    const estimatedImprovements = this.calculatePerformanceImprovements(
      bottlenecks, parallelizationOpportunities, cachingOpportunities
    )

    return {
      bottlenecks,
      parallelizationOpportunities,
      cachingOpportunities,
      resourceOptimization,
      estimatedImprovements
    }
  }

  /**
   * Analyze security aspects
   */
  private async analyzeSecurity(jenkinsfile: string, scanResult?: ScanResult): Promise<SecurityAnalysis> {
    const vulnerabilities = this.identifySecurityVulnerabilities(jenkinsfile)
    const credentialUsage = this.analyzeCredentialSecurity(jenkinsfile)
    const networkSecurity = this.analyzeNetworkSecurity(jenkinsfile)
    const secretsExposure = this.analyzeSecretsExposure(jenkinsfile)
    const complianceChecks = this.performComplianceChecks(jenkinsfile)

    return {
      vulnerabilities,
      credentialUsage,
      networkSecurity,
      secretsExposure,
      complianceChecks
    }
  }

  /**
   * Analyze maintainability aspects
   */
  private async analyzeMaintainability(jenkinsfile: string, analysis: PipelineAnalysis): Promise<MaintainabilityAnalysis> {
    const codeQuality = this.analyzeCodeQuality(jenkinsfile)
    const documentation = this.analyzeDocumentation(jenkinsfile)
    const testability = this.analyzeTestability(jenkinsfile, analysis)
    const modularity = this.analyzeModularity(jenkinsfile, analysis)
    const technicalDebt = this.identifyTechnicalDebt(jenkinsfile, analysis)

    return {
      codeQuality,
      documentation,
      testability,
      modularity,
      technicalDebt
    }
  }

  /**
   * Analyze complexity
   */
  private async analyzeComplexity(jenkinsfile: string, analysis: PipelineAnalysis): Promise<ComplexityAnalysis> {
    const overall = this.calculateOverallComplexity(jenkinsfile, analysis)
    const cognitive = this.calculateCognitiveComplexity(jenkinsfile)
    const cyclomatic = this.calculateCyclomaticComplexity(jenkinsfile)
    const structural = this.calculateStructuralComplexity(analysis)
    const migrationComplexity = this.calculateMigrationComplexity(overall, analysis)

    return {
      overall,
      cognitive,
      cyclomatic,
      structural,
      migrationComplexity
    }
  }

  /**
   * Initialize pattern definitions
   */
  private initializePatterns(): void {
    this.patterns.set('parallel-stages', {
      name: 'Parallel Stage Execution',
      description: 'Pipeline uses parallel execution for independent stages',
      pattern: /parallel\s*\{[\s\S]*?\}/g,
      category: 'performance',
      benefits: ['Reduced execution time', 'Better resource utilization'],
      confidence: 0.9
    })

    this.patterns.set('conditional-execution', {
      name: 'Conditional Execution',
      description: 'Pipeline uses conditional logic for stage execution',
      pattern: /when\s*\{[\s\S]*?\}/g,
      category: 'flexibility',
      benefits: ['Dynamic pipeline behavior', 'Resource optimization'],
      confidence: 0.8
    })

    this.patterns.set('artifact-management', {
      name: 'Artifact Management',
      description: 'Pipeline properly manages build artifacts',
      pattern: /(archiveArtifacts|stash|unstash)/g,
      category: 'reliability',
      benefits: ['Reliable artifact handling', 'Build reproducibility'],
      confidence: 0.85
    })
  }

  /**
   * Initialize anti-pattern definitions
   */
  private initializeAntiPatterns(): void {
    this.antiPatterns.set('hardcoded-values', {
      name: 'Hardcoded Values',
      description: 'Pipeline contains hardcoded values that should be parameterized',
      pattern: /(password|token|key)\s*=\s*["'][^"']+["']/gi,
      category: 'security',
      risks: ['Security vulnerabilities', 'Maintenance issues'],
      severity: 'high',
      remediation: 'Use environment variables or parameter store'
    })

    this.antiPatterns.set('long-stages', {
      name: 'Monolithic Stages',
      description: 'Stages are too long and should be broken down',
      pattern: /stage\s*\([^)]+\)\s*\{[\s\S]{500,}\}/g,
      category: 'maintainability',
      risks: ['Poor maintainability', 'Difficult debugging'],
      severity: 'medium',
      remediation: 'Break down into smaller, focused stages'
    })

    this.antiPatterns.set('no-error-handling', {
      name: 'Missing Error Handling',
      description: 'Pipeline lacks proper error handling mechanisms',
      pattern: /(?!.*try\s*\{)(?!.*catch\s*\()(?!.*finally\s*\{)/g,
      category: 'reliability',
      risks: ['Pipeline failures', 'Poor error visibility'],
      severity: 'medium',
      remediation: 'Implement proper try-catch-finally blocks'
    })
  }

  /**
   * Initialize best practices
   */
  private initializeBestPractices(): void {
    this.bestPractices.set('declarative-syntax', {
      name: 'Declarative Pipeline Syntax',
      description: 'Use declarative pipeline syntax for better maintainability',
      check: (jenkinsfile: string) => jenkinsfile.includes('pipeline {'),
      category: 'maintainability',
      importance: 'high',
      benefits: ['Better readability', 'Easier maintenance', 'Built-in features']
    })

    this.bestPractices.set('environment-variables', {
      name: 'Environment Variables Usage',
      description: 'Use environment variables for configuration',
      check: (jenkinsfile: string) => jenkinsfile.includes('environment {'),
      category: 'configuration',
      importance: 'medium',
      benefits: ['Configuration flexibility', 'Environment separation']
    })

    this.bestPractices.set('post-actions', {
      name: 'Post-build Actions',
      description: 'Include proper post-build actions for cleanup',
      check: (jenkinsfile: string) => jenkinsfile.includes('post {'),
      category: 'reliability',
      importance: 'high',
      benefits: ['Proper cleanup', 'Notification handling', 'Resource management']
    })
  }

  // Implementation methods for analysis components

  private determinePipelineType(jenkinsfile: string): 'declarative' | 'scripted' | 'mixed' {
    const hasDeclarative = jenkinsfile.includes('pipeline {')
    const hasScripted = jenkinsfile.includes('node {') || jenkinsfile.includes('node(')
    
    if (hasDeclarative && hasScripted) return 'mixed'
    if (hasDeclarative) return 'declarative'
    return 'scripted'
  }

  private analyzeStages(jenkinsfile: string): StageAnalysis[] {
    const stageRegex = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{([\s\S]*?)\n\s*\}/g
    const stages: StageAnalysis[] = []
    let match

    while ((match = stageRegex.exec(jenkinsfile)) !== null) {
      const [, name, content] = match
      const type = this.classifyStageType(name, content)
      const complexity = this.assessStageComplexity(content)
      const dependencies = this.identifyStageDependencies(content)
      const duration = this.estimateStageDuration(type, content)
      const parallelizable = this.assessParallelizability(content, dependencies)
      const optimization = this.identifyStageOptimizations(content)

      stages.push({
        name,
        type,
        complexity,
        dependencies,
        duration,
        parallelizable,
        optimization
      })
    }

    return stages
  }

  private analyzeParallelism(jenkinsfile: string): ParallelismAnalysis {
    const parallelBlocks = (jenkinsfile.match(/parallel\s*\{/g) || []).length
    const totalStages = (jenkinsfile.match(/stage\s*\(/g) || []).length
    const parallelizationRatio = totalStages > 0 ? parallelBlocks / totalStages : 0

    return {
      currentLevel: parallelBlocks,
      potentialLevel: this.calculatePotentialParallelism(jenkinsfile),
      efficiency: parallelizationRatio,
      opportunities: this.identifyParallelizationOpportunities({} as any)
    }
  }

  private analyzeConditionals(jenkinsfile: string): ConditionalAnalysis[] {
    const whenBlocks = jenkinsfile.match(/when\s*\{[^}]*\}/g) || []
    
    return whenBlocks.map((block, index) => ({
      id: `conditional-${index}`,
      condition: this.extractCondition(block),
      complexity: this.assessConditionalComplexity(block),
      optimization: this.suggestConditionalOptimization(block)
    }))
  }

  private analyzeErrorHandling(jenkinsfile: string): ErrorHandlingAnalysis {
    const hasTryCatch = /try\s*\{[\s\S]*?\}\s*catch\s*\(/g.test(jenkinsfile)
    const hasFinally = /finally\s*\{/g.test(jenkinsfile)
    const hasPostActions = /post\s*\{/g.test(jenkinsfile)
    
    const coverage = (
      (hasTryCatch ? 1 : 0) + 
      (hasFinally ? 1 : 0) + 
      (hasPostActions ? 1 : 0)
    ) / 3

    return {
      coverage,
      mechanisms: {
        tryCatch: hasTryCatch,
        finally: hasFinally,
        postActions: hasPostActions
      },
      recommendations: this.generateErrorHandlingRecommendations(coverage)
    }
  }

  private analyzeArtifacts(jenkinsfile: string): ArtifactAnalysis[] {
    const artifacts: ArtifactAnalysis[] = []
    const archivePattern = /archiveArtifacts\s*([^;]+)/g
    let match

    while ((match = archivePattern.exec(jenkinsfile)) !== null) {
      artifacts.push({
        type: 'archive',
        pattern: match[1].trim(),
        usage: 'storage',
        optimization: this.suggestArtifactOptimization(match[1])
      })
    }

    return artifacts
  }

  private detectPatterns(jenkinsfile: string): DetectedPattern[] {
    const detected: DetectedPattern[] = []

    for (const [id, pattern] of this.patterns) {
      const matches = jenkinsfile.match(pattern.pattern)
      if (matches) {
        detected.push({
          id,
          name: pattern.name,
          description: pattern.description,
          category: pattern.category,
          confidence: pattern.confidence,
          occurrences: matches.length,
          benefits: pattern.benefits
        })
      }
    }

    return detected
  }

  private detectAntiPatterns(jenkinsfile: string): DetectedAntiPattern[] {
    const detected: DetectedAntiPattern[] = []

    for (const [id, antiPattern] of this.antiPatterns) {
      const matches = jenkinsfile.match(antiPattern.pattern)
      if (matches) {
        detected.push({
          id,
          name: antiPattern.name,
          description: antiPattern.description,
          category: antiPattern.category,
          severity: antiPattern.severity,
          occurrences: matches.length,
          risks: antiPattern.risks,
          remediation: antiPattern.remediation
        })
      }
    }

    return detected
  }

  private checkBestPractices(jenkinsfile: string, structure: PipelineStructure): BestPracticeCheck[] {
    const checks: BestPracticeCheck[] = []

    for (const [id, practice] of this.bestPractices) {
      const compliant = practice.check(jenkinsfile)
      checks.push({
        id,
        name: practice.name,
        description: practice.description,
        category: practice.category,
        importance: practice.importance,
        compliant,
        benefits: practice.benefits,
        recommendation: compliant ? undefined : `Implement ${practice.name.toLowerCase()}`
      })
    }

    return checks
  }

  private assessMigrationReadiness(
    structure: PipelineStructure,
    patterns: DetectedPattern[],
    antiPatterns: DetectedAntiPattern[]
  ): MigrationReadiness {
    let score = 70 // Base score

    // Positive factors
    if (structure.type === 'declarative') score += 15
    score += patterns.length * 5
    score += (structure.stages || []).filter(s => s.parallelizable).length * 3

    // Negative factors
    score -= antiPatterns.filter(ap => ap.severity === 'high').length * 10
    score -= antiPatterns.filter(ap => ap.severity === 'medium').length * 5
    if (structure.type === 'scripted') score -= 10

    const readinessLevel = score >= 80 ? 'ready' : score >= 60 ? 'needs-preparation' : 'significant-work-needed'
    const blockers = antiPatterns.filter(ap => ap.severity === 'high').map(ap => ap.name)

    return {
      score: Math.max(0, Math.min(100, score)),
      level: readinessLevel,
      blockers,
      recommendations: this.generateMigrationReadinessRecommendations(readinessLevel, blockers)
    }
  }

  // Performance analysis methods
  private identifyBottlenecks(jenkinsfile: string, analysis: PipelineAnalysis): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = []

    // Sequential stages that could be parallel
    const sequentialStages = (analysis.structure.stages || []).filter(s => !s.parallelizable)
    if (sequentialStages.length > 3) {
      bottlenecks.push({
        type: 'sequential-execution',
        description: 'Multiple stages running sequentially could be parallelized',
        impact: 'high',
        stages: sequentialStages.map(s => s.name),
        estimatedImprovement: '30-50% faster execution'
      })
    }

    // Long-running stages
    const longStages = (analysis.structure.stages || []).filter(s => 
      s.duration?.estimated > 300 // 5 minutes
    )
    longStages.forEach(stage => {
      bottlenecks.push({
        type: 'long-stage',
        description: `Stage '${stage.name}' takes significant time to execute`,
        impact: 'medium',
        stages: [stage.name],
        estimatedImprovement: 'Varies based on optimization'
      })
    })

    return bottlenecks
  }

  private identifyParallelizationOpportunities(analysis: PipelineAnalysis): ParallelizationOpportunity[] {
    const opportunities: ParallelizationOpportunity[] = []
    const parallelizableStages = (analysis.structure.stages || []).filter(s => s.parallelizable)

    if (parallelizableStages.length >= 2) {
      opportunities.push({
        type: 'stage-parallelization',
        description: 'Multiple independent stages can run in parallel',
        stages: parallelizableStages.map(s => s.name),
        estimatedTimeReduction: '25-40%',
        complexity: 'low',
        prerequisites: []
      })
    }

    return opportunities
  }

  private identifyCachingOpportunities(jenkinsfile: string): CachingOpportunity[] {
    const opportunities: CachingOpportunity[] = []
    
    // Check for dependency management
    const buildTools = [
      { tool: 'maven', pattern: /mvn|maven/i, cache: '.m2/repository' },
      { tool: 'gradle', pattern: /gradle/i, cache: '.gradle' },
      { tool: 'npm', pattern: /npm\s+install/i, cache: 'node_modules' },
      { tool: 'pip', pattern: /pip\s+install/i, cache: '.pip-cache' }
    ]

    buildTools.forEach(({ tool, pattern, cache }) => {
      if (pattern.test(jenkinsfile) && !jenkinsfile.includes(cache)) {
        opportunities.push({
          type: 'dependency-cache',
          description: `${tool} dependencies can be cached for faster builds`,
          tool,
          cacheLocation: cache,
          estimatedImprovement: '20-60% faster dependency resolution',
          implementation: `Add cache configuration for ${cache}`
        })
      }
    })

    return opportunities
  }

  private analyzeResourceUsage(jenkinsfile: string): ResourceOptimization[] {
    const optimizations: ResourceOptimization[] = []

    // Check for resource allocation
    if (!jenkinsfile.includes('agent {') && !jenkinsfile.includes('node(')) {
      optimizations.push({
        type: 'agent-specification',
        description: 'Specify appropriate agents for better resource allocation',
        currentUsage: 'any',
        recommendedUsage: 'labeled agents based on requirements',
        impact: 'Better resource utilization and faster execution'
      })
    }

    return optimizations
  }

  private calculatePerformanceImprovements(
    bottlenecks: PerformanceBottleneck[],
    parallelization: ParallelizationOpportunity[],
    caching: CachingOpportunity[]
  ): PerformanceImprovement[] {
    const improvements: PerformanceImprovement[] = []

    if (parallelization.length > 0) {
      improvements.push({
        type: 'parallelization',
        description: 'Implement parallel stage execution',
        estimatedImprovement: '25-50% reduction in build time',
        effort: 'medium',
        prerequisites: ['Independent stage verification']
      })
    }

    if (caching.length > 0) {
      improvements.push({
        type: 'caching',
        description: 'Implement dependency caching',
        estimatedImprovement: '20-60% faster dependency resolution',
        effort: 'low',
        prerequisites: ['Cache storage configuration']
      })
    }

    return improvements
  }

  // Security analysis methods
  private identifySecurityVulnerabilities(jenkinsfile: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = []

    // Check for hardcoded secrets
    const secretPatterns = [
      { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-password' },
      { pattern: /token\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-token' },
      { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: 'hardcoded-api-key' }
    ]

    secretPatterns.forEach(({ pattern, type }) => {
      const matches = jenkinsfile.match(pattern)
      if (matches) {
        vulnerabilities.push({
          type,
          severity: 'critical',
          description: 'Hardcoded secrets detected in pipeline',
          location: 'Pipeline script',
          remediation: 'Use environment variables or credential store',
          cwe: 'CWE-798',
          impact: 'Credential exposure risk'
        })
      }
    })

    // Check for insecure commands
    const insecureCommands = [
      { pattern: /curl.*--insecure/gi, type: 'insecure-http' },
      { pattern: /wget.*--no-check-certificate/gi, type: 'insecure-http' }
    ]

    insecureCommands.forEach(({ pattern, type }) => {
      if (pattern.test(jenkinsfile)) {
        vulnerabilities.push({
          type,
          severity: 'high',
          description: 'Insecure HTTP/TLS configuration detected',
          location: 'Command execution',
          remediation: 'Remove insecure flags and configure proper certificates',
          cwe: 'CWE-295',
          impact: 'Man-in-the-middle attack risk'
        })
      }
    })

    return vulnerabilities
  }

  private analyzeCredentialSecurity(jenkinsfile: string): CredentialSecurityAnalysis[] {
    const analyses: CredentialSecurityAnalysis[] = []
    
    // Analyze credential usage patterns
    const credentialUsage = jenkinsfile.match(/credentials\(['"][^'"]+['"]\)/g) || []
    
    credentialUsage.forEach(usage => {
      const credentialId = usage.match(/['"]([^'"]+)['"]/)?.[1]
      if (credentialId) {
        analyses.push({
          credentialId,
          usage: 'direct-access',
          security: this.assessCredentialSecurity(credentialId, usage),
          recommendations: this.generateCredentialRecommendations(credentialId, usage)
        })
      }
    })

    return analyses
  }

  private analyzeNetworkSecurity(jenkinsfile: string): NetworkSecurityIssue[] {
    const issues: NetworkSecurityIssue[] = []

    // Check for HTTP URLs
    const httpUrls = jenkinsfile.match(/http:\/\/[^\s'"]+/g)
    if (httpUrls) {
      issues.push({
        type: 'insecure-protocol',
        description: 'HTTP URLs detected - should use HTTPS',
        urls: httpUrls,
        severity: 'medium',
        remediation: 'Replace HTTP URLs with HTTPS equivalents'
      })
    }

    return issues
  }

  private analyzeSecretsExposure(jenkinsfile: string): SecretsExposureRisk[] {
    const risks: SecretsExposureRisk[] = []

    // Check for potential secret exposure in logs
    if (jenkinsfile.includes('echo') && jenkinsfile.includes('$')) {
      risks.push({
        type: 'log-exposure',
        description: 'Potential secret exposure in console output',
        severity: 'medium',
        locations: ['Echo statements with variables'],
        mitigation: 'Review echo statements and mask sensitive variables'
      })
    }

    return risks
  }

  private performComplianceChecks(jenkinsfile: string): ComplianceCheck[] {
    const checks: ComplianceCheck[] = []

    // SOC 2 compliance checks
    checks.push({
      standard: 'SOC 2',
      requirement: 'Access Control',
      compliant: jenkinsfile.includes('credentials(') || jenkinsfile.includes('withCredentials'),
      description: 'Pipeline uses proper credential management',
      remediation: compliant => !compliant ? 'Implement proper credential management' : undefined
    })

    return checks
  }

  // Code quality analysis methods
  private analyzeCodeQuality(jenkinsfile: string): CodeQualityMetrics {
    const lines = jenkinsfile.split('\n')
    const totalLines = lines.length
    const commentLines = lines.filter(line => line.trim().startsWith('//')).length
    const emptyLines = lines.filter(line => line.trim() === '').length
    const codeLines = totalLines - commentLines - emptyLines

    return {
      linesOfCode: codeLines,
      commentRatio: commentLines / totalLines,
      complexity: this.calculateCodeComplexity(jenkinsfile),
      duplication: this.detectCodeDuplication(jenkinsfile),
      maintainabilityIndex: this.calculateMaintainabilityIndex(totalLines, commentLines)
    }
  }

  private analyzeDocumentation(jenkinsfile: string): DocumentationAnalysis {
    const hasHeader = /\/\*[\s\S]*?\*\//.test(jenkinsfile.substring(0, 500))
    const commentLines = (jenkinsfile.match(/\/\/.*$/gm) || []).length
    const totalLines = jenkinsfile.split('\n').length
    const commentRatio = commentLines / totalLines

    return {
      hasHeader,
      commentCoverage: commentRatio,
      inlineDocumentation: commentRatio > 0.1,
      quality: commentRatio > 0.15 ? 'good' : commentRatio > 0.05 ? 'fair' : 'poor',
      recommendations: this.generateDocumentationRecommendations(commentRatio, hasHeader)
    }
  }

  private analyzeTestability(jenkinsfile: string, analysis: PipelineAnalysis): TestabilityAnalysis {
    const hasTestStages = (analysis.structure.stages || []).some(s => s.type === 'test')
    const testCoverage = hasTestStages ? 'partial' : 'none'
    
    return {
      testStages: hasTestStages,
      coverage: testCoverage,
      testability: hasTestStages ? 'good' : 'poor',
      recommendations: this.generateTestabilityRecommendations(hasTestStages)
    }
  }

  private analyzeModularity(jenkinsfile: string, analysis: PipelineAnalysis): ModularityAnalysis {
    const stageCount = (analysis.structure.stages || []).length
    const avgStageSize = jenkinsfile.length / stageCount
    const hasSharedLibraries = jenkinsfile.includes('@Library')

    return {
      stageCount,
      averageStageSize: avgStageSize,
      cohesion: avgStageSize < 200 ? 'high' : avgStageSize < 500 ? 'medium' : 'low',
      coupling: hasSharedLibraries ? 'low' : 'medium',
      reusability: hasSharedLibraries ? 'high' : 'low'
    }
  }

  private identifyTechnicalDebt(jenkinsfile: string, analysis: PipelineAnalysis): TechnicalDebtAnalysis[] {
    const debt: TechnicalDebtAnalysis[] = []

    // Check for TODO/FIXME comments
    const todoComments = (jenkinsfile.match(/\/\/.*(?:TODO|FIXME|HACK)/gi) || []).length
    if (todoComments > 0) {
      debt.push({
        type: 'todo-comments',
        description: `${todoComments} TODO/FIXME comments found`,
        severity: 'low',
        impact: 'Maintenance burden',
        effort: 'low',
        recommendation: 'Address outstanding TODO items'
      })
    }

    // Check for long methods/stages
    const longStages = (analysis.structure.stages || []).filter(s => s.complexity === 'complex')
    if (longStages.length > 0) {
      debt.push({
        type: 'complex-stages',
        description: `${longStages.length} complex stages that should be refactored`,
        severity: 'medium',
        impact: 'Reduced maintainability',
        effort: 'medium',
        recommendation: 'Break down complex stages into smaller components'
      })
    }

    return debt
  }

  // Complexity calculation methods
  private calculateOverallComplexity(jenkinsfile: string, analysis: PipelineAnalysis): ComplexityScore {
    const stageComplexity = (analysis.structure.stages || []).reduce((sum, stage) => {
      return sum + (stage.complexity === 'simple' ? 1 : stage.complexity === 'moderate' ? 2 : 3)
    }, 0)

    const conditionalComplexity = analysis.structure.conditionals.length * 2
    const parallelComplexity = analysis.structure.parallelism.currentLevel * 1.5

    const rawScore = stageComplexity + conditionalComplexity + parallelComplexity
    const normalizedScore = Math.min(100, (rawScore / Math.max(1, (analysis.structure.stages || []).length)) * 10)

    return {
      score: Math.round(normalizedScore),
      level: normalizedScore <= 25 ? 'low' : normalizedScore <= 50 ? 'medium' : normalizedScore <= 75 ? 'high' : 'very-high',
      factors: {
        stages: stageComplexity,
        conditionals: conditionalComplexity,
        parallelism: parallelComplexity
      }
    }
  }

  private calculateCognitiveComplexity(jenkinsfile: string): CognitiveComplexity {
    let score = 0
    
    // Count nested structures
    const nestedStructures = [
      { pattern: /if\s*\(/g, weight: 1 },
      { pattern: /for\s*\(/g, weight: 2 },
      { pattern: /while\s*\(/g, weight: 2 },
      { pattern: /catch\s*\(/g, weight: 1 },
      { pattern: /when\s*\{/g, weight: 1 }
    ]

    nestedStructures.forEach(({ pattern, weight }) => {
      const matches = jenkinsfile.match(pattern) || []
      score += matches.length * weight
    })

    return {
      score,
      level: score <= 10 ? 'low' : score <= 20 ? 'medium' : score <= 30 ? 'high' : 'very-high',
      breakdown: this.analyzeComplexityBreakdown(jenkinsfile)
    }
  }

  private calculateCyclomaticComplexity(jenkinsfile: string): CyclomaticComplexity {
    let complexity = 1 // Base complexity

    // Count decision points
    const decisionPoints = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\?\s*:/g // Ternary operator
    ]

    decisionPoints.forEach(pattern => {
      const matches = jenkinsfile.match(pattern) || []
      complexity += matches.length
    })

    return {
      score: complexity,
      level: complexity <= 10 ? 'low' : complexity <= 20 ? 'medium' : complexity <= 30 ? 'high' : 'very-high',
      recommendations: this.generateComplexityRecommendations(complexity)
    }
  }

  private calculateStructuralComplexity(analysis: PipelineAnalysis): StructuralComplexity {
    const stageCount = (analysis.structure.stages || []).length
    const conditionalCount = analysis.structure.conditionals.length
    const parallelCount = analysis.structure.parallelism.currentLevel

    const score = (stageCount * 1) + (conditionalCount * 2) + (parallelCount * 1.5)

    return {
      score: Math.round(score),
      level: score <= 10 ? 'low' : score <= 20 ? 'medium' : score <= 30 ? 'high' : 'very-high',
      components: {
        stages: stageCount,
        conditionals: conditionalCount,
        parallel: parallelCount
      }
    }
  }

  private calculateMigrationComplexity(overall: ComplexityScore, analysis: PipelineAnalysis): MigrationComplexityScore {
    let migrationScore = overall.score * 0.7 // Base from overall complexity

    // Adjust for pipeline type
    if (analysis.structure.type === 'scripted') migrationScore += 15
    if (analysis.structure.type === 'mixed') migrationScore += 10

    // Adjust for anti-patterns
    const antiPatternPenalty = analysis.antiPatterns.reduce((penalty, ap) => {
      return penalty + (ap.severity === 'high' ? 10 : ap.severity === 'medium' ? 5 : 2)
    }, 0)

    migrationScore += antiPatternPenalty

    return {
      score: Math.min(100, Math.round(migrationScore)),
      level: migrationScore <= 25 ? 'simple' : migrationScore <= 50 ? 'moderate' : migrationScore <= 75 ? 'complex' : 'enterprise',
      factors: {
        pipelineType: analysis.structure.type,
        antiPatterns: analysis.antiPatterns.length,
        overallComplexity: overall.score
      },
      estimatedEffort: this.estimateMigrationEffort(migrationScore)
    }
  }

  // Helper methods
  private classifyStageType(name: string, content: string): StageAnalysis['type'] {
    const lowerName = name.toLowerCase()
    const lowerContent = content.toLowerCase()

    if (lowerName.includes('build') || lowerContent.includes('mvn compile') || lowerContent.includes('gradle build')) {
      return 'build'
    }
    if (lowerName.includes('test') || lowerContent.includes('mvn test') || lowerContent.includes('npm test')) {
      return 'test'
    }
    if (lowerName.includes('deploy') || lowerContent.includes('deploy') || lowerContent.includes('kubectl')) {
      return 'deploy'
    }
    if (lowerName.includes('quality') || lowerContent.includes('sonar') || lowerContent.includes('lint')) {
      return 'quality'
    }
    if (lowerContent.includes('mail') || lowerContent.includes('slack') || lowerContent.includes('notify')) {
      return 'notification'
    }

    return 'custom'
  }

  private assessStageComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const lines = content.split('\n').length
    const commands = (content.match(/^\s*(sh|bat|powershell|script)/gm) || []).length
    const conditionals = (content.match(/if\s*\(/g) || []).length

    const complexityScore = lines + (commands * 2) + (conditionals * 3)

    if (complexityScore <= 10) return 'simple'
    if (complexityScore <= 25) return 'moderate'
    return 'complex'
  }

  private identifyStageDependencies(content: string): string[] {
    const dependencies = []
    
    // Check for artifact dependencies
    if (content.includes('unstash')) {
      const unstashMatches = content.match(/unstash\s+['"]([^'"]+)['"]/g) || []
      dependencies.push(...unstashMatches.map(match => match.replace(/unstash\s+['"]([^'"]+)['"]/, '$1')))
    }

    return dependencies
  }

  private estimateStageDuration(type: StageAnalysis['type'], content: string): EstimatedDuration {
    const baseEstimates = {
      build: 300,    // 5 minutes
      test: 600,     // 10 minutes
      deploy: 180,   // 3 minutes
      quality: 900,  // 15 minutes
      notification: 30, // 30 seconds
      custom: 120    // 2 minutes
    }

    const base = baseEstimates[type]
    const complexity = this.assessStageComplexity(content)
    const multiplier = complexity === 'simple' ? 1 : complexity === 'moderate' ? 1.5 : 2.5

    return {
      estimated: Math.round(base * multiplier),
      confidence: complexity === 'simple' ? 0.8 : complexity === 'moderate' ? 0.6 : 0.4,
      factors: [type, complexity]
    }
  }

  private assessParallelizability(content: string, dependencies: string[]): boolean {
    // Stages with dependencies cannot be parallelized easily
    if (dependencies.length > 0) return false
    
    // Stages that modify shared resources are harder to parallelize
    const sharedResourcePatterns = [
      /git\s+push/,
      /deploy/i,
      /database/i
    ]

    return !sharedResourcePatterns.some(pattern => pattern.test(content))
  }

  private identifyStageOptimizations(content: string): StageOptimization[] {
    const optimizations: StageOptimization[] = []

    // Check for caching opportunities
    if ((content.includes('mvn') || content.includes('npm install')) && !content.includes('cache')) {
      optimizations.push({
        type: 'caching',
        description: 'Add dependency caching to improve build speed',
        impact: 'medium',
        effort: 'low'
      })
    }

    return optimizations
  }

  private calculatePotentialParallelism(jenkinsfile: string): number {
    const stages = (jenkinsfile.match(/stage\s*\(/g) || []).length
    const dependencies = (jenkinsfile.match(/unstash/g) || []).length
    
    // Estimate maximum parallelism based on stages and dependencies
    return Math.max(1, Math.floor((stages - dependencies) / 2))
  }

  private extractCondition(whenBlock: string): string {
    const match = whenBlock.match(/when\s*\{([^}]*)\}/)
    return match ? match[1].trim() : 'unknown'
  }

  private assessConditionalComplexity(whenBlock: string): 'simple' | 'moderate' | 'complex' {
    const conditions = (whenBlock.match(/&&|\|\|/g) || []).length
    if (conditions === 0) return 'simple'
    if (conditions <= 2) return 'moderate'
    return 'complex'
  }

  private suggestConditionalOptimization(whenBlock: string): string {
    if (whenBlock.includes('env.')) {
      return 'Consider using pipeline parameters instead of environment variables for better control'
    }
    return 'Condition appears optimized'
  }

  private generateErrorHandlingRecommendations(coverage: number): string[] {
    const recommendations = []
    
    if (coverage < 0.5) {
      recommendations.push('Implement try-catch blocks for critical operations')
      recommendations.push('Add post-build actions for cleanup and notifications')
    }
    
    if (coverage < 0.8) {
      recommendations.push('Add finally blocks for guaranteed cleanup')
    }

    return recommendations
  }

  private suggestArtifactOptimization(pattern: string): string {
    if (pattern.includes('**/*')) {
      return 'Consider more specific artifact patterns to reduce storage and transfer time'
    }
    return 'Artifact pattern appears optimized'
  }

  private generateMigrationReadinessRecommendations(level: string, blockers: string[]): string[] {
    const recommendations = []

    if (level === 'significant-work-needed') {
      recommendations.push('Address critical anti-patterns before migration')
      recommendations.push('Convert to declarative pipeline syntax')
      recommendations.push('Implement proper error handling')
    } else if (level === 'needs-preparation') {
      recommendations.push('Review and optimize pipeline structure')
      recommendations.push('Address medium-severity issues')
    }

    if (blockers.length > 0) {
      recommendations.push(`Address blocking issues: ${blockers.join(', ')}`)
    }

    return recommendations
  }

  private assessCredentialSecurity(credentialId: string, usage: string): 'secure' | 'moderate' | 'insecure' {
    // Simplified security assessment
    if (usage.includes('withCredentials')) return 'secure'
    if (credentialId.toLowerCase().includes('test')) return 'moderate'
    return 'insecure'
  }

  private generateCredentialRecommendations(credentialId: string, usage: string): string[] {
    const recommendations = []
    
    if (!usage.includes('withCredentials')) {
      recommendations.push('Use withCredentials block for secure credential access')
    }
    
    if (credentialId.toLowerCase().includes('prod')) {
      recommendations.push('Ensure production credentials are properly secured')
    }

    return recommendations
  }

  private calculateCodeComplexity(jenkinsfile: string): number {
    const lines = jenkinsfile.split('\n').length
    const branches = (jenkinsfile.match(/if|when|case/g) || []).length
    const loops = (jenkinsfile.match(/for|while/g) || []).length
    
    return Math.round((lines / 10) + (branches * 2) + (loops * 3))
  }

  private detectCodeDuplication(jenkinsfile: string): number {
    // Simplified duplication detection
    const lines = jenkinsfile.split('\n')
    const uniqueLines = new Set(lines.map(line => line.trim())).size
    
    return Math.round((1 - (uniqueLines / lines.length)) * 100)
  }

  private calculateMaintainabilityIndex(totalLines: number, commentLines: number): number {
    // Simplified maintainability index
    const commentRatio = commentLines / totalLines
    const complexity = Math.log(totalLines) * 10
    
    return Math.max(0, Math.round(100 - complexity + (commentRatio * 20)))
  }

  private generateDocumentationRecommendations(commentRatio: number, hasHeader: boolean): string[] {
    const recommendations = []
    
    if (!hasHeader) {
      recommendations.push('Add pipeline header documentation')
    }
    
    if (commentRatio < 0.1) {
      recommendations.push('Increase inline documentation coverage')
    }

    return recommendations
  }

  private generateTestabilityRecommendations(hasTestStages: boolean): string[] {
    if (!hasTestStages) {
      return ['Add dedicated test stages', 'Implement automated testing']
    }
    return ['Consider expanding test coverage']
  }

  private analyzeComplexityBreakdown(jenkinsfile: string): any {
    return {
      conditionals: (jenkinsfile.match(/if|when/g) || []).length,
      loops: (jenkinsfile.match(/for|while/g) || []).length,
      nesting: this.calculateMaxNesting(jenkinsfile)
    }
  }

  private calculateMaxNesting(jenkinsfile: string): number {
    let maxNesting = 0
    let currentNesting = 0
    
    for (const char of jenkinsfile) {
      if (char === '{') {
        currentNesting++
        maxNesting = Math.max(maxNesting, currentNesting)
      } else if (char === '}') {
        currentNesting--
      }
    }
    
    return maxNesting
  }

  private generateComplexityRecommendations(complexity: number): string[] {
    if (complexity > 20) {
      return [
        'Break down complex logic into smaller functions',
        'Reduce nesting levels',
        'Simplify conditional statements'
      ]
    }
    return ['Complexity is within acceptable range']
  }

  private estimateMigrationEffort(score: number): string {
    if (score <= 25) return '1-2 days'
    if (score <= 50) return '1-2 weeks'
    if (score <= 75) return '2-4 weeks'
    return '1-3 months'
  }

  // Generate comprehensive recommendations
  private async generateRecommendations(
    jenkinsfile: string,
    analysis: PipelineAnalysis,
    performance: PerformanceAnalysis,
    security: SecurityAnalysis,
    maintainability: MaintainabilityAnalysis,
    complexity: ComplexityAnalysis
  ): Promise<PipelineRecommendation[]> {
    const recommendations: PipelineRecommendation[] = []

    // Security recommendations
    security.vulnerabilities.forEach(vuln => {
      recommendations.push({
        id: `security-${vuln.type}`,
        title: `Address ${vuln.type}`,
        description: vuln.description,
        category: 'security',
        priority: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
        impact: 'significant',
        effort: 'medium',
        implementation: {
          steps: [vuln.remediation],
          codeChanges: [],
          configuration: [],
          testing: ['Verify security fix']
        },
        expectedBenefits: ['Improved security posture'],
        risks: ['None'],
        timeline: '1-2 days'
      })
    })

    // Performance recommendations
    performance.bottlenecks.forEach(bottleneck => {
      recommendations.push({
        id: `performance-${bottleneck.type}`,
        title: `Optimize ${bottleneck.type}`,
        description: bottleneck.description,
        category: 'performance',
        priority: bottleneck.impact === 'high' ? 'high' : 'medium',
        impact: 'moderate',
        effort: 'medium',
        implementation: {
          steps: ['Analyze current performance', 'Implement optimization', 'Measure improvement'],
          codeChanges: [],
          configuration: [],
          testing: ['Performance testing']
        },
        expectedBenefits: [bottleneck.estimatedImprovement],
        risks: ['Temporary instability during implementation'],
        timeline: '3-5 days'
      })
    })

    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    })
  }

  private async generateOptimizations(
    analysis: PipelineAnalysis,
    performance: PerformanceAnalysis,
    security: SecurityAnalysis
  ): Promise<OptimizationSuggestion[]> {
    const optimizations: OptimizationSuggestion[] = []

    // Parallelization optimizations
    performance.parallelizationOpportunities.forEach(opportunity => {
      optimizations.push({
        id: `parallel-${opportunity.type}`,
        type: 'performance',
        title: 'Implement Parallel Execution',
        description: opportunity.description,
        currentState: 'Sequential stage execution',
        proposedState: 'Parallel stage execution where possible',
        expectedImpact: {
          performance: 'High',
          cost: 'Medium reduction',
          reliability: 'Neutral'
        },
        implementationSteps: [
          'Identify independent stages',
          'Refactor pipeline to use parallel blocks',
          'Test parallel execution'
        ],
        automatable: false,
        prerequisites: ['Stage dependency analysis']
      })
    })

    return optimizations
  }

  private async assessRisks(
    analysis: PipelineAnalysis,
    security: SecurityAnalysis,
    complexity: ComplexityAnalysis
  ): Promise<PipelineRiskAssessment> {
    const risks = []

    // Security risks
    const criticalVulns = security.vulnerabilities.filter(v => v.severity === 'critical').length
    if (criticalVulns > 0) {
      risks.push({
        type: 'security',
        level: 'high',
        description: `${criticalVulns} critical security vulnerabilities`,
        impact: 'Data breach or system compromise',
        likelihood: 'medium'
      })
    }

    // Complexity risks
    if (complexity.overall.level === 'very-high') {
      risks.push({
        type: 'maintainability',
        level: 'medium',
        description: 'Very high complexity may impact maintainability',
        impact: 'Increased maintenance cost and development time',
        likelihood: 'high'
      })
    }

    // Migration risks
    if (analysis.migrationReadiness.level === 'significant-work-needed') {
      risks.push({
        type: 'migration',
        level: 'high',
        description: 'Significant work needed before migration',
        impact: 'Delayed migration timeline and increased effort',
        likelihood: 'high'
      })
    }

    const overallRisk = this.calculateOverallRisk(risks)

    return {
      overall: overallRisk,
      risks,
      mitigation: this.generateRiskMitigation(risks),
      timeline: this.estimateRiskTimeline(risks)
    }
  }

  private calculateOverallRisk(risks: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const highRisks = risks.filter(r => r.level === 'high').length
    const criticalRisks = risks.filter(r => r.level === 'critical').length

    if (criticalRisks > 0) return 'critical'
    if (highRisks > 2) return 'high'
    if (highRisks > 0) return 'medium'
    return 'low'
  }

  private generateRiskMitigation(risks: any[]): string[] {
    const mitigation = new Set<string>()

    risks.forEach(risk => {
      switch (risk.type) {
        case 'security':
          mitigation.add('Implement security scanning and validation')
          mitigation.add('Regular security audits')
          break
        case 'maintainability':
          mitigation.add('Code refactoring and simplification')
          mitigation.add('Improved documentation')
          break
        case 'migration':
          mitigation.add('Phased migration approach')
          mitigation.add('Comprehensive testing strategy')
          break
      }
    })

    return Array.from(mitigation)
  }

  private estimateRiskTimeline(risks: any[]): string {
    const highRisks = risks.filter(r => r.level === 'high' || r.level === 'critical').length
    
    if (highRisks > 3) return '2-4 weeks'
    if (highRisks > 1) return '1-2 weeks'
    return '3-5 days'
  }
}

// Supporting interfaces
interface PatternDefinition {
  name: string
  description: string
  pattern: RegExp
  category: string
  benefits: string[]
  confidence: number
}

interface AntiPatternDefinition {
  name: string
  description: string
  pattern: RegExp
  category: string
  risks: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  remediation: string
}

interface BestPracticeDefinition {
  name: string
  description: string
  check: (jenkinsfile: string) => boolean
  category: string
  importance: 'low' | 'medium' | 'high'
  benefits: string[]
}

interface DetectedPattern {
  id: string
  name: string
  description: string
  category: string
  confidence: number
  occurrences: number
  benefits: string[]
}

interface DetectedAntiPattern {
  id: string
  name: string
  description: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  occurrences: number
  risks: string[]
  remediation: string
}

interface BestPracticeCheck {
  id: string
  name: string
  description: string
  category: string
  importance: 'low' | 'medium' | 'high'
  compliant: boolean
  benefits: string[]
  recommendation?: string
}

interface MigrationReadiness {
  score: number
  level: 'ready' | 'needs-preparation' | 'significant-work-needed'
  blockers: string[]
  recommendations: string[]
}

interface ParallelismAnalysis {
  currentLevel: number
  potentialLevel: number
  efficiency: number
  opportunities: ParallelizationOpportunity[]
}

interface ConditionalAnalysis {
  id: string
  condition: string
  complexity: 'simple' | 'moderate' | 'complex'
  optimization: string
}

interface ErrorHandlingAnalysis {
  coverage: number
  mechanisms: {
    tryCatch: boolean
    finally: boolean
    postActions: boolean
  }
  recommendations: string[]
}

interface ArtifactAnalysis {
  type: string
  pattern: string
  usage: string
  optimization: string
}

interface PerformanceBottleneck {
  type: string
  description: string
  impact: 'low' | 'medium' | 'high'
  stages: string[]
  estimatedImprovement: string
}

interface ParallelizationOpportunity {
  type: string
  description: string
  stages: string[]
  estimatedTimeReduction: string
  complexity: 'low' | 'medium' | 'high'
  prerequisites: string[]
}

interface CachingOpportunity {
  type: string
  description: string
  tool: string
  cacheLocation: string
  estimatedImprovement: string
  implementation: string
}

interface ResourceOptimization {
  type: string
  description: string
  currentUsage: string
  recommendedUsage: string
  impact: string
}

interface PerformanceImprovement {
  type: string
  description: string
  estimatedImprovement: string
  effort: 'low' | 'medium' | 'high'
  prerequisites: string[]
}

interface SecurityVulnerability {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  remediation: string
  cwe: string
  impact: string
}

interface CredentialSecurityAnalysis {
  credentialId: string
  usage: string
  security: 'secure' | 'moderate' | 'insecure'
  recommendations: string[]
}

interface NetworkSecurityIssue {
  type: string
  description: string
  urls: string[]
  severity: 'low' | 'medium' | 'high'
  remediation: string
}

interface SecretsExposureRisk {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  locations: string[]
  mitigation: string
}

interface ComplianceCheck {
  standard: string
  requirement: string
  compliant: boolean
  description: string
  remediation: (compliant: boolean) => string | undefined
}

interface CodeQualityMetrics {
  linesOfCode: number
  commentRatio: number
  complexity: number
  duplication: number
  maintainabilityIndex: number
}

interface DocumentationAnalysis {
  hasHeader: boolean
  commentCoverage: number
  inlineDocumentation: boolean
  quality: 'poor' | 'fair' | 'good'
  recommendations: string[]
}

interface TestabilityAnalysis {
  testStages: boolean
  coverage: 'none' | 'partial' | 'good'
  testability: 'poor' | 'fair' | 'good'
  recommendations: string[]
}

interface ModularityAnalysis {
  stageCount: number
  averageStageSize: number
  cohesion: 'low' | 'medium' | 'high'
  coupling: 'low' | 'medium' | 'high'
  reusability: 'low' | 'medium' | 'high'
}

interface TechnicalDebtAnalysis {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  impact: string
  effort: 'low' | 'medium' | 'high'
  recommendation: string
}

interface ComplexityScore {
  score: number
  level: 'low' | 'medium' | 'high' | 'very-high'
  factors: {
    stages: number
    conditionals: number
    parallelism: number
  }
}

interface CognitiveComplexity {
  score: number
  level: 'low' | 'medium' | 'high' | 'very-high'
  breakdown: any
}

interface CyclomaticComplexity {
  score: number
  level: 'low' | 'medium' | 'high' | 'very-high'
  recommendations: string[]
}

interface StructuralComplexity {
  score: number
  level: 'low' | 'medium' | 'high' | 'very-high'
  components: {
    stages: number
    conditionals: number
    parallel: number
  }
}

interface MigrationComplexityScore {
  score: number
  level: 'simple' | 'moderate' | 'complex' | 'enterprise'
  factors: {
    pipelineType: string
    antiPatterns: number
    overallComplexity: number
  }
  estimatedEffort: string
}

interface ImplementationGuide {
  steps: string[]
  codeChanges: string[]
  configuration: string[]
  testing: string[]
}

interface ImpactMetrics {
  performance: string
  cost: string
  reliability: string
}

interface EstimatedDuration {
  estimated: number
  confidence: number
  factors: string[]
}

interface StageOptimization {
  type: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
}

interface PipelineRiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical'
  risks: any[]
  mitigation: string[]
  timeline: string
}

// Export singleton instance
export const pipelineIntelligenceService = new PipelineIntelligenceService()