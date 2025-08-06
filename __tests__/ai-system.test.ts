/**
 * Comprehensive AI System Tests
 * Tests for all AI components and their integration
 */

import { aiService } from '../lib/ai-core'
import { pluginIntelligenceService } from '../lib/ai-plugin-intelligence'
import { pipelineIntelligenceService } from '../lib/ai-pipeline-intelligence'
import { smartConversionEngine } from '../lib/ai-smart-converter'
import { intelligentReportingService } from '../lib/ai-intelligent-reporting'
import { aiDashboardService } from '../lib/ai-dashboard-analytics'
import { realTimeSuggestionsEngine } from '../lib/ai-realtime-suggestions'
import { aiTrainingDataManager } from '../lib/ai-training-data'

// Mock data for testing
const mockJenkinsfile = `
pipeline {
  agent any
  environment {
    API_KEY = credentials('api-key')
    DATABASE_URL = 'postgresql://localhost:5432/test'
  }
  stages {
    stage('Build') {
      steps {
        script {
          sh 'mvn clean compile'
        }
      }
    }
    stage('Test') {
      steps {
        sh 'mvn test'
        publishTestResults testResultsPattern: 'target/test-results.xml'
      }
    }
    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sh 'mvn deploy'
        dockerBuild(image: 'myapp:latest')
      }
    }
  }
  post {
    always {
      cleanWs()
    }
  }
}
`

const mockScanResult = {
  type: 'declarative' as const,
  complexity: 'moderate' as const,
  linesOfCode: 150,
  plugins: [
    { name: 'maven-integration', version: '3.8.1', usage: 'build' },
    { name: 'docker-workflow', version: '1.25', usage: 'deploy' },
    { name: 'junit', version: '1.48', usage: 'test' }
  ],
  credentials: [
    { id: 'api-key', type: 'secret', usage: ['environment'] }
  ],
  stages: [
    { name: 'Build', type: 'build', complexity: 'simple' },
    { name: 'Test', type: 'test', complexity: 'simple' },
    { name: 'Deploy', type: 'deploy', complexity: 'moderate' }
  ]
}

describe('AI Core Service', () => {
  it('should analyze Jenkins pipeline comprehensively', async () => {
    const context = {
      jenkinsfile: mockJenkinsfile,
      scanResult: mockScanResult,
      plugins: mockScanResult.plugins,
      credentials: mockScanResult.credentials
    }

    const analysis = await aiService.analyzeJenkinsPipeline(context)
    
    expect(analysis).toHaveProperty('insights')
    expect(analysis).toHaveProperty('complexity')
    expect(analysis).toHaveProperty('recommendations')
    expect(analysis).toHaveProperty('riskAssessment')
    expect(analysis).toHaveProperty('migrationPath')
    
    expect(analysis.insights).toBeInstanceOf(Array)
    expect(analysis.recommendations).toBeInstanceOf(Array)
    expect(analysis.complexity.score).toBeGreaterThan(0)
    expect(analysis.complexity.score).toBeLessThanOrEqual(100)
  })

  it('should generate meaningful insights', async () => {
    const context = {
      jenkinsfile: mockJenkinsfile,
      scanResult: mockScanResult,
      plugins: mockScanResult.plugins,
      credentials: mockScanResult.credentials
    }

    const analysis = await aiService.analyzeJenkinsPipeline(context)
    
    expect(analysis.insights.length).toBeGreaterThan(0)
    
    const securityInsights = analysis.insights.filter(i => i.category === 'security')
    const performanceInsights = analysis.insights.filter(i => i.category === 'performance')
    
    expect(securityInsights.length + performanceInsights.length).toBeGreaterThan(0)
  })

  it('should assess migration complexity accurately', async () => {
    const context = {
      jenkinsfile: mockJenkinsfile,
      scanResult: mockScanResult,
      plugins: mockScanResult.plugins,
      credentials: mockScanResult.credentials
    }

    const analysis = await aiService.analyzeJenkinsPipeline(context)
    
    expect(analysis.complexity).toHaveProperty('overall')
    expect(analysis.complexity).toHaveProperty('factors')
    expect(analysis.complexity).toHaveProperty('estimatedEffort')
    
    expect(['simple', 'moderate', 'complex', 'enterprise']).toContain(analysis.complexity.overall)
  })
})

describe('Plugin Intelligence Service', () => {
  it('should analyze plugin compatibility', async () => {
    const plugin = mockScanResult.plugins[0]
    const intelligence = await pluginIntelligenceService.analyzePlugin(plugin)
    
    expect(intelligence).toHaveProperty('plugin')
    expect(intelligence).toHaveProperty('compatibility')
    expect(intelligence).toHaveProperty('alternatives')
    expect(intelligence).toHaveProperty('risks')
    expect(intelligence).toHaveProperty('migrationPath')
    
    expect(intelligence.compatibility.compatibilityScore).toBeGreaterThanOrEqual(0)
    expect(intelligence.compatibility.compatibilityScore).toBeLessThanOrEqual(100)
    expect(intelligence.alternatives).toBeInstanceOf(Array)
  })

  it('should provide plugin alternatives', async () => {
    const plugin = { name: 'findbugs', version: '1.0.0', usage: 'quality' }
    const intelligence = await pluginIntelligenceService.analyzePlugin(plugin)
    
    expect(intelligence.alternatives.length).toBeGreaterThan(0)
    expect(intelligence.alternatives[0]).toHaveProperty('name')
    expect(intelligence.alternatives[0]).toHaveProperty('compatibility')
    expect(intelligence.alternatives[0]).toHaveProperty('recommendation')
  })

  it('should assess plugin migration complexity', async () => {
    const plugin = mockScanResult.plugins[0]
    const intelligence = await pluginIntelligenceService.analyzePlugin(plugin)
    
    expect(intelligence.migrationPath).toHaveProperty('steps')
    expect(intelligence.migrationPath).toHaveProperty('estimatedTime')
    expect(intelligence.migrationPath).toHaveProperty('complexity')
    
    expect(intelligence.migrationPath.steps.length).toBeGreaterThan(0)
    expect(['simple', 'moderate', 'complex', 'enterprise']).toContain(intelligence.migrationPath.complexity)
  })

  it('should batch analyze multiple plugins', async () => {
    const result = await pluginIntelligenceService.analyzePlugins(mockScanResult.plugins)
    
    expect(result).toHaveProperty('intelligence')
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('migrationStrategy')
    
    expect(result.intelligence).toBeInstanceOf(Array)
    expect(result.intelligence).toHaveLength(mockScanResult.plugins.length)
    expect(result.summary).toHaveProperty('total')
    expect(result.summary).toHaveProperty('breakdown')
  })
})

describe('Pipeline Intelligence Service', () => {
  it('should analyze pipeline structure', async () => {
    const intelligence = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    
    expect(intelligence).toHaveProperty('analysis')
    expect(intelligence).toHaveProperty('performance')
    expect(intelligence).toHaveProperty('security')
    expect(intelligence).toHaveProperty('maintainability')
    expect(intelligence).toHaveProperty('complexity')
    
    expect(intelligence.analysis.structure).toHaveProperty('type')
    expect(intelligence.analysis.structure).toHaveProperty('stages')
    expect(['declarative', 'scripted', 'mixed']).toContain(intelligence.analysis.structure.type)
  })

  it('should identify performance bottlenecks', async () => {
    const intelligence = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    
    expect(intelligence.performance).toHaveProperty('bottlenecks')
    expect(intelligence.performance).toHaveProperty('parallelizationOpportunities')
    expect(intelligence.performance).toHaveProperty('cachingOpportunities')
    
    expect(intelligence.performance.bottlenecks).toBeInstanceOf(Array)
    expect(intelligence.performance.parallelizationOpportunities).toBeInstanceOf(Array)
  })

  it('should detect security vulnerabilities', async () => {
    const jenkinsfileWithSecrets = `
    pipeline {
      agent any
      environment {
        PASSWORD = "hardcoded-password"
        API_KEY = "abc123def456"
      }
      stages {
        stage('Build') {
          steps {
            sh 'curl --insecure https://api.example.com'
          }
        }
      }
    }
    `
    
    const intelligence = await pipelineIntelligenceService.analyzePipeline(jenkinsfileWithSecrets, mockScanResult)
    
    expect(intelligence.security.vulnerabilities.length).toBeGreaterThan(0)
    
    const criticalVulns = intelligence.security.vulnerabilities.filter(v => v.severity === 'critical')
    expect(criticalVulns.length).toBeGreaterThan(0)
  })

  it('should assess maintainability', async () => {
    const intelligence = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    
    expect(intelligence.maintainability).toHaveProperty('codeQuality')
    expect(intelligence.maintainability).toHaveProperty('documentation')
    expect(intelligence.maintainability).toHaveProperty('testability')
    expect(intelligence.maintainability).toHaveProperty('modularity')
    
    expect(intelligence.maintainability.codeQuality).toHaveProperty('linesOfCode')
    expect(intelligence.maintainability.codeQuality).toHaveProperty('commentRatio')
  })

  it('should calculate complexity metrics', async () => {
    const intelligence = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    
    expect(intelligence.complexity).toHaveProperty('overall')
    expect(intelligence.complexity).toHaveProperty('cognitive')
    expect(intelligence.complexity).toHaveProperty('cyclomatic')
    expect(intelligence.complexity).toHaveProperty('structural')
    
    expect(intelligence.complexity.overall.score).toBeGreaterThanOrEqual(0)
    expect(intelligence.complexity.overall.score).toBeLessThanOrEqual(100)
  })
})

describe('Smart Conversion Engine', () => {
  it('should convert Jenkins pipeline to GitLab CI/CD', async () => {
    const result = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)
    
    expect(result).toHaveProperty('gitlabYaml')
    expect(result).toHaveProperty('conversionAnalysis')
    expect(result).toHaveProperty('optimizations')
    expect(result).toHaveProperty('aiInsights')
    expect(result).toHaveProperty('migrationPlan')
    
    expect(result.gitlabYaml).toContain('stages:')
    expect(result.gitlabYaml).toContain('variables:')
    expect(result.conversionAnalysis).toHaveProperty('coverage')
    expect(result.optimizations).toBeInstanceOf(Array)
  })

  it('should apply intelligent optimizations', async () => {
    const result = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult, {
      optimizationLevel: 'aggressive',
      performanceOptimization: true,
      includeAdvancedFeatures: true
    })
    
    expect(result.optimizations.length).toBeGreaterThan(0)
    
    const performanceOptimizations = result.optimizations.filter(o => o.type === 'performance')
    expect(performanceOptimizations.length).toBeGreaterThan(0)
  })

  it('should generate comprehensive migration plan', async () => {
    const result = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)
    
    expect(result.migrationPlan).toHaveProperty('phases')
    expect(result.migrationPlan).toHaveProperty('timeline')
    expect(result.migrationPlan).toHaveProperty('resources')
    expect(result.migrationPlan).toHaveProperty('risks')
    
    expect(result.migrationPlan.phases).toBeInstanceOf(Array)
    expect(result.migrationPlan.phases.length).toBeGreaterThan(0)
  })

  it('should calculate quality metrics', async () => {
    const result = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)
    
    expect(result.qualityMetrics).toHaveProperty('overall')
    expect(result.qualityMetrics).toHaveProperty('dimensions')
    expect(result.qualityMetrics).toHaveProperty('benchmarks')
    
    expect(result.qualityMetrics.overall).toBeGreaterThanOrEqual(0)
    expect(result.qualityMetrics.overall).toBeLessThanOrEqual(100)
    
    expect(result.qualityMetrics.dimensions).toHaveProperty('correctness')
    expect(result.qualityMetrics.dimensions).toHaveProperty('completeness')
    expect(result.qualityMetrics.dimensions).toHaveProperty('security')
  })
})

describe('Intelligent Reporting Service', () => {
  it('should generate comprehensive reports', async () => {
    const pipelineIntel = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    const pluginIntel = await Promise.all(
      mockScanResult.plugins.map(p => pluginIntelligenceService.analyzePlugin(p))
    )
    
    const reportData = {
      scanResult: mockScanResult,
      pipelineIntelligence: pipelineIntel,
      pluginIntelligence: pluginIntel
    }
    
    const report = await intelligentReportingService.generateReport(reportData, 'comprehensive')
    
    expect(report).toHaveProperty('id')
    expect(report).toHaveProperty('title')
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('sections')
    expect(report).toHaveProperty('insights')
    expect(report).toHaveProperty('recommendations')
    
    expect(report.sections).toBeInstanceOf(Array)
    expect(report.sections.length).toBeGreaterThan(0)
  })

  it('should generate executive summary', async () => {
    const reportData = {
      scanResult: mockScanResult,
      pipelineIntelligence: await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    }
    
    const report = await intelligentReportingService.generateReport(reportData, 'executive-summary')
    
    expect(report.summary).toHaveProperty('overview')
    expect(report.summary).toHaveProperty('keyFindings')
    expect(report.summary).toHaveProperty('criticalIssues')
    expect(report.summary).toHaveProperty('recommendedActions')
    expect(report.summary).toHaveProperty('migrationReadiness')
    
    expect(report.summary.keyFindings).toBeInstanceOf(Array)
    expect(report.summary.recommendedActions).toBeInstanceOf(Array)
  })

  it('should include visualizations', async () => {
    const reportData = {
      scanResult: mockScanResult,
      pipelineIntelligence: await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    }
    
    const report = await intelligentReportingService.generateReport(reportData)
    
    expect(report.visualizations).toBeInstanceOf(Array)
    expect(report.visualizations.length).toBeGreaterThan(0)
    
    const complexityChart = report.visualizations.find(v => v.id === 'complexity-chart')
    expect(complexityChart).toBeDefined()
    expect(complexityChart).toHaveProperty('data')
    expect(complexityChart).toHaveProperty('configuration')
  })
})

describe('AI Dashboard Service', () => {
  it('should generate dashboard data', async () => {
    const scanResults = [mockScanResult]
    const pipelineIntel = [await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)]
    const pluginIntel = [await Promise.all(mockScanResult.plugins.map(p => pluginIntelligenceService.analyzePlugin(p)))]
    const conversionResults = [await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)]
    
    const dashboard = await aiDashboardService.generateDashboard(
      scanResults,
      pipelineIntel,
      pluginIntel,
      conversionResults
    )
    
    expect(dashboard).toHaveProperty('overview')
    expect(dashboard).toHaveProperty('analytics')
    expect(dashboard).toHaveProperty('insights')
    expect(dashboard).toHaveProperty('trends')
    expect(dashboard).toHaveProperty('alerts')
    expect(dashboard).toHaveProperty('recommendations')
    expect(dashboard).toHaveProperty('metrics')
  })

  it('should provide meaningful insights', async () => {
    const scanResults = [mockScanResult]
    const pipelineIntel = [await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)]
    const pluginIntel = [await Promise.all(mockScanResult.plugins.map(p => pluginIntelligenceService.analyzePlugin(p)))]
    const conversionResults = [await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)]
    
    const dashboard = await aiDashboardService.generateDashboard(
      scanResults,
      pipelineIntel,
      pluginIntel,
      conversionResults
    )
    
    expect(dashboard.insights).toHaveProperty('critical')
    expect(dashboard.insights).toHaveProperty('opportunities')
    expect(dashboard.insights).toHaveProperty('recommendations')
    expect(dashboard.insights).toHaveProperty('trends')
    
    const allInsights = [
      ...dashboard.insights.critical,
      ...dashboard.insights.opportunities,
      ...dashboard.insights.recommendations,
      ...dashboard.insights.trends
    ]
    
    expect(allInsights.length).toBeGreaterThan(0)
  })

  it('should track trends', async () => {
    const scanResults = [mockScanResult]
    const pipelineIntel = [await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)]
    
    const dashboard = await aiDashboardService.generateDashboard(scanResults, pipelineIntel, [], [])
    
    expect(dashboard.trends).toHaveProperty('complexity')
    expect(dashboard.trends).toHaveProperty('security')
    expect(dashboard.trends).toHaveProperty('performance')
    expect(dashboard.trends).toHaveProperty('readiness')
    
    Object.values(dashboard.trends).forEach(trend => {
      expect(trend).toHaveProperty('current')
      expect(trend).toHaveProperty('previous')
      expect(trend).toHaveProperty('direction')
      expect(['up', 'down', 'stable']).toContain(trend.direction)
    })
  })
})

describe('Real-time Suggestions Engine', () => {
  it('should generate contextual suggestions', async () => {
    const context = {
      trigger: 'analysis-complete' as const,
      scope: 'pipeline' as const,
      relatedEntities: ['jenkins-pipeline'],
      userProfile: {
        experience: 'intermediate' as const,
        preferences: {
          showOptimizationTips: true,
          showSecurityWarnings: true,
          showBestPractices: true,
          suggestionFrequency: 'normal' as const,
          autoApplyOptimizations: false
        },
        history: [],
        dismissedSuggestions: [],
        completedActions: []
      },
      sessionContext: {
        startTime: new Date(),
        currentPage: 'analysis',
        actionsPerformed: ['file-upload', 'analysis'],
        timeSpent: 120000,
        interactionCount: 3
      }
    }
    
    const data = {
      parallelizableStages: 2,
      hasParallelization: false,
      migrationReadiness: 'needs-preparation',
      deprecatedPlugins: 0
    }
    
    const suggestions = await realTimeSuggestionsEngine.generateSuggestions('test-user', context, data)
    
    expect(suggestions).toBeInstanceOf(Array)
    expect(suggestions.length).toBeGreaterThan(0)
    
    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('id')
      expect(suggestion).toHaveProperty('type')
      expect(suggestion).toHaveProperty('title')
      expect(suggestion).toHaveProperty('description')
      expect(suggestion).toHaveProperty('confidence')
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
      expect(suggestion.confidence).toBeLessThanOrEqual(1)
    })
  })

  it('should handle user interactions', async () => {
    const context = {
      trigger: 'analysis-complete' as const,
      scope: 'pipeline' as const,
      relatedEntities: [],
      userProfile: {
        experience: 'beginner' as const,
        preferences: {
          showOptimizationTips: true,
          showSecurityWarnings: true,
          showBestPractices: true,
          suggestionFrequency: 'normal' as const,
          autoApplyOptimizations: false
        },
        history: [],
        dismissedSuggestions: [],
        completedActions: []
      },
      sessionContext: {
        startTime: new Date(),
        currentPage: 'analysis',
        actionsPerformed: [],
        timeSpent: 60000,
        interactionCount: 1
      }
    }
    
    const suggestions = await realTimeSuggestionsEngine.generateSuggestions('test-user', context, {})
    
    if (suggestions.length > 0) {
      await expect(
        realTimeSuggestionsEngine.processSuggestionInteraction('test-user', suggestions[0].id, 'dismissed')
      ).resolves.not.toThrow()
      
      await expect(
        realTimeSuggestionsEngine.processSuggestionInteraction('test-user', suggestions[0].id, 'applied')
      ).resolves.not.toThrow()
    }
  })

  it('should filter suggestions based on user preferences', async () => {
    const contextMinimal = {
      trigger: 'analysis-complete' as const,
      scope: 'pipeline' as const,
      relatedEntities: [],
      userProfile: {
        experience: 'advanced' as const,
        preferences: {
          showOptimizationTips: false,
          showSecurityWarnings: true,
          showBestPractices: false,
          suggestionFrequency: 'minimal' as const,
          autoApplyOptimizations: false
        },
        history: [],
        dismissedSuggestions: [],
        completedActions: []
      },
      sessionContext: {
        startTime: new Date(),
        currentPage: 'analysis',
        actionsPerformed: [],
        timeSpent: 30000,
        interactionCount: 1
      }
    }
    
    const contextFrequent = {
      ...contextMinimal,
      userProfile: {
        ...contextMinimal.userProfile,
        preferences: {
          ...contextMinimal.userProfile.preferences,
          showOptimizationTips: true,
          showBestPractices: true,
          suggestionFrequency: 'frequent' as const
        }
      }
    }
    
    const minimalSuggestions = await realTimeSuggestionsEngine.generateSuggestions('user-minimal', contextMinimal)
    const frequentSuggestions = await realTimeSuggestionsEngine.generateSuggestions('user-frequent', contextFrequent)
    
    expect(frequentSuggestions.length).toBeGreaterThanOrEqual(minimalSuggestions.length)
  })
})

describe('AI Training Data Manager', () => {
  it('should manage training datasets', async () => {
    const sampleData = {
      input: { stages: 5, steps: 15, conditionals: 2 },
      expectedOutput: 'moderate',
      verified: true,
      source: 'expert-annotation' as const,
      tags: ['test-data']
    }
    
    await expect(
      aiTrainingDataManager.addTrainingSample('pipeline-complexity', sampleData)
    ).resolves.not.toThrow()
    
    await expect(
      aiTrainingDataManager.validateSample('pipeline-complexity', 'test-sample-id', true)
    ).rejects.toThrow() // Sample doesn't exist
  })

  it('should collect feedback for continuous learning', async () => {
    await expect(
      aiTrainingDataManager.collectFeedback(
        'test-model',
        { input: 'test' },
        { prediction: 'moderate' },
        { actual: 'complex' },
        'incorrect'
      )
    ).resolves.not.toThrow()
  })

  it('should generate synthetic training data', async () => {
    const syntheticData = await aiTrainingDataManager.generateSyntheticData(
      'pipeline-complexity',
      10,
      'augmentation'
    )
    
    expect(syntheticData).toBeInstanceOf(Array)
    expect(syntheticData).toHaveLength(10)
    
    syntheticData.forEach(sample => {
      expect(sample).toHaveProperty('input')
      expect(sample).toHaveProperty('expectedOutput')
      expect(sample).toHaveProperty('source')
      expect(sample.source).toBe('automated-generation')
      expect(sample.tags).toContain('synthetic')
    })
  })

  it('should train and evaluate models', async () => {
    const architecture = {
      framework: 'scikit-learn' as const,
      hyperparameters: {
        maxDepth: 10,
        estimators: 100
      },
      inputShape: [6], // 6 features
      outputShape: [4], // 4 complexity classes
      modelSize: 5
    }
    
    await expect(
      aiTrainingDataManager.trainModel('test-model', 'pipeline-complexity', architecture)
    ).resolves.toHaveProperty('id')
  })
})

describe('AI System Integration', () => {
  it('should integrate all AI components seamlessly', async () => {
    // End-to-end integration test
    const pipelineIntel = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    const pluginIntel = await Promise.all(
      mockScanResult.plugins.map(p => pluginIntelligenceService.analyzePlugin(p))
    )
    const conversionResult = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)
    
    // Generate comprehensive analysis
    const reportData = {
      scanResult: mockScanResult,
      pipelineIntelligence: pipelineIntel,
      pluginIntelligence: pluginIntel,
      conversionResult
    }
    
    const report = await intelligentReportingService.generateReport(reportData, 'comprehensive')
    
    // Generate dashboard
    const dashboard = await aiDashboardService.generateDashboard(
      [mockScanResult],
      [pipelineIntel],
      [pluginIntel],
      [conversionResult]
    )
    
    // Verify integration
    expect(report.metrics.overall.migrationComplexityScore).toBeDefined()
    expect(dashboard.overview.averageComplexity).toBeDefined()
    expect(conversionResult.qualityMetrics.overall).toBeGreaterThan(0)
    
    // Verify consistency across components
    expect(pipelineIntel.complexity.overall.score).toBeCloseTo(
      report.metrics.overall.migrationComplexityScore,
      0
    )
  })

  it('should provide consistent AI insights across components', async () => {
    const pipelineIntel = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    const conversionResult = await smartConversionEngine.convertPipeline(mockJenkinsfile, mockScanResult)
    
    // Check for consistent security insights
    const pipelineSecurityIssues = pipelineIntel.security.vulnerabilities.length
    const conversionSecurityOptimizations = conversionResult.optimizations.filter(o => o.type === 'security').length
    
    if (pipelineSecurityIssues > 0) {
      expect(conversionSecurityOptimizations).toBeGreaterThan(0)
    }
    
    // Check for consistent performance insights
    const pipelinePerformanceOpportunities = pipelineIntel.performance.parallelizationOpportunities.length
    const conversionPerformanceOptimizations = conversionResult.optimizations.filter(o => o.type === 'performance').length
    
    if (pipelinePerformanceOpportunities > 0) {
      expect(conversionPerformanceOptimizations).toBeGreaterThan(0)
    }
  })

  it('should maintain data quality and accuracy', async () => {
    // Test data consistency and accuracy across AI components
    const pipelineIntel = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    
    // Verify complexity calculations are within reasonable bounds
    expect(pipelineIntel.complexity.overall.score).toBeGreaterThanOrEqual(0)
    expect(pipelineIntel.complexity.overall.score).toBeLessThanOrEqual(100)
    
    // Verify confidence scores are within valid ranges
    pipelineIntel.recommendations.forEach(rec => {
      if (rec.priority === 'critical') {
        // Critical recommendations should have high confidence
        expect(rec.impact).toMatch(/high|critical|major|significant/i)
      }
    })
    
    // Verify data consistency
    expect(pipelineIntel.analysis.structure.stages.length).toBe(mockScanResult.stages.length)
  })
})

describe('AI Performance and Scalability', () => {
  it('should handle large pipelines efficiently', async () => {
    const largePipeline = mockJenkinsfile.repeat(10) // Simulate larger pipeline
    const largeResult = { ...mockScanResult, linesOfCode: mockScanResult.linesOfCode * 10 }
    
    const startTime = Date.now()
    const intelligence = await pipelineIntelligenceService.analyzePipeline(largePipeline, largeResult)
    const endTime = Date.now()
    
    const processingTime = endTime - startTime
    expect(processingTime).toBeLessThan(10000) // Should complete within 10 seconds
    expect(intelligence).toBeDefined()
    expect(intelligence.complexity.overall.score).toBeGreaterThan(0)
  })

  it('should handle multiple concurrent analyses', async () => {
    const promises = Array(5).fill(null).map(async () => {
      return await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    })
    
    const startTime = Date.now()
    const results = await Promise.all(promises)
    const endTime = Date.now()
    
    expect(results).toHaveLength(5)
    expect(endTime - startTime).toBeLessThan(15000) // Should handle concurrent requests efficiently
    
    results.forEach(result => {
      expect(result).toBeDefined()
      expect(result.complexity.overall.score).toBeGreaterThanOrEqual(0)
    })
  })

  it('should maintain accuracy under various conditions', async () => {
    // Test with different types of pipelines
    const scriptedPipeline = `
      node {
        stage('Build') {
          sh 'make build'
        }
        stage('Test') {
          sh 'make test'
        }
      }
    `
    
    const mixedPipeline = `
      pipeline {
        agent any
        stages {
          stage('Build') {
            steps {
              script {
                node {
                  sh 'make build'
                }
              }
            }
          }
        }
      }
    `
    
    const declarativeResult = await pipelineIntelligenceService.analyzePipeline(mockJenkinsfile, mockScanResult)
    const scriptedResult = await pipelineIntelligenceService.analyzePipeline(scriptedPipeline, { ...mockScanResult, type: 'scripted' })
    const mixedResult = await pipelineIntelligenceService.analyzePipeline(mixedPipeline, { ...mockScanResult, type: 'mixed' })
    
    expect(declarativeResult.analysis.structure.type).toBe('declarative')
    expect(scriptedResult.analysis.structure.type).toBe('scripted')
    expect(mixedResult.analysis.structure.type).toBe('mixed')
    
    // Each should have appropriate complexity scores
    expect(declarativeResult.complexity.overall.score).toBeGreaterThan(0)
    expect(scriptedResult.complexity.overall.score).toBeGreaterThan(0)
    expect(mixedResult.complexity.overall.score).toBeGreaterThan(0)
  })
})