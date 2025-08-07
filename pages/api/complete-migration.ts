/**
 * Complete Migration API Endpoint
 * Handles full Jenkins to GitLab migration with strategic AI usage
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { enterpriseAIMigrationSystem, MigrationContext, MigrationResult } from '@/lib/ai-migration-system-simple'
import { productionMigrationEngine } from '@/lib/production-migration-engine'
import { ScanResult } from '@/types'

interface MigrationRequest {
  jenkinsfile: string
  scanResult: ScanResult
  options?: {
    targetComplexity?: 'simple' | 'balanced' | 'advanced'
    optimizeForSpeed?: boolean
    includeSecurityScanning?: boolean
    enableParallelization?: boolean
    generateDocumentation?: boolean
    useAdvancedEngine?: boolean
  }
}

interface MigrationResponse {
  success: boolean
  error?: string
  data?: MigrationResult
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MigrationResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
    return
  }

  const startTime = Date.now()

  try {
    const { jenkinsfile, scanResult, options = {} }: MigrationRequest = req.body

    // Validation
    if (!jenkinsfile || typeof jenkinsfile !== 'string') {
      res.status(400).json({
        success: false,
        error: 'jenkinsfile is required and must be a string'
      })
      return
    }

    if (!scanResult || typeof scanResult !== 'object') {
      res.status(400).json({
        success: false,
        error: 'scanResult is required and must be an object'
      })
      return
    }

    console.log('🚀 Starting complete Jenkins to GitLab migration...')
    console.log(`Pipeline has ${scanResult.pluginCount} plugins, ${scanResult.lineCount} lines`)

    // Set default options for optimal performance and features
    const migrationContext: MigrationContext = {
      jenkinsfile,
      scanResult,
      options: {
        targetComplexity: 'balanced',
        optimizeForSpeed: true,
        includeSecurityScanning: true,
        enableParallelization: true,
        generateDocumentation: true,
        ...options
      }
    }

    // Perform complete migration using either advanced engine or AI system
    let migrationResult: MigrationResult
    
    if (options?.useAdvancedEngine) {
      console.log('🚀 Using production-grade migration engine with enhanced standards...')
      const advancedResult = await productionMigrationEngine.migrate({
        jenkinsfile,
        scanResult,
        options: {
          includeSecurityScan: true,
          replaceDigests: false,
          generateVariablesFile: true,
          strict: true
        }
      })
      
      // Convert production result to MigrationResult format
      migrationResult = {
        gitlabYaml: advancedResult.gitlabYaml,
        intelligence: {
          summary: {
            originalComplexity: scanResult.tier,
            targetComplexity: 'advanced',
            migrationStrategy: 'production-grade-engine',
            aiDecisions: 0,
            automaticConversions: advancedResult.confidence.highConfidencePlugins,
            confidenceScore: Math.round(advancedResult.confidence.overall * 100)
          },
          plugins: [],
          pipeline: {
            structure: {
              type: 'declarative',
              stages: [],
              parallelization: { opportunities: [], potential: 0, recommendations: [] },
              complexity: { overall: { score: 50, level: 'medium' }, factors: {} }
            },
            migration: {
              strategy: 'production-grade-conversion',
              phases: ['Generate secure YAML', 'Configure variables', 'Deploy with checklist'],
              risks: advancedResult.deploymentChecklist.slice(0, 3),
              timeline: '2-4 hours with checklist completion'
            }
          },
          optimizations: [],
          recommendations: advancedResult.deploymentChecklist,
          estimatedEffort: '2-4 hours'
        },
        performanceMetrics: { totalTime: 0, aiDecisions: 0, cacheHits: 0, optimizationsApplied: advancedResult.confidence.highConfidencePlugins },
        dockerValidation: advancedResult.securityReport,
        success: true
      }
    } else {
      migrationResult = await enterpriseAIMigrationSystem.migrate(migrationContext)
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ Complete migration finished in ${totalTime}ms`)
    console.log(`📊 AI made ${migrationResult.intelligence.summary.aiDecisions} intelligent decisions`)
    console.log(`🚀 Confidence score: ${migrationResult.intelligence.summary.confidenceScore}%`)

    // Transform to expected format for backward compatibility
    const responseData = {
      gitlabYaml: migrationResult.gitlabYaml,
      conversionReport: {
        totalPlugins: migrationResult.intelligence.plugins.length,
        convertedPlugins: migrationResult.intelligence.plugins.filter((p: any) => p.conversionType !== 'manual').length,
        aiAssistedConversions: migrationResult.intelligence.summary.aiDecisions,
        manualReviewRequired: migrationResult.intelligence.plugins.filter((p: any) => p.conversionType === 'manual').length,
        conversionDetails: migrationResult.intelligence.plugins,
        performanceOptimizations: migrationResult.intelligence.optimizations.filter((o: any) => o.type === 'performance').map((o: any) => o.description),
        securityEnhancements: migrationResult.intelligence.optimizations.filter((o: any) => o.type === 'security').map((o: any) => o.description)
      },
      migrationInstructions: [
        'Copy the generated .gitlab-ci.yml to your repository root',
        'Configure GitLab CI/CD variables in Settings > CI/CD > Variables',
        'Review any manual items flagged by the AI analysis',
        'Test the pipeline in a feature branch first',
        'Monitor the first few pipeline runs for optimization opportunities'
      ],
      warnings: migrationResult.intelligence.pipeline.migration.risks,
      requiresManualReview: migrationResult.intelligence.plugins.filter((p: any) => p.conversionType === 'manual').map((p: any) => p.original),
      estimatedEffort: migrationResult.intelligence.estimatedEffort,
      intelligence: migrationResult.intelligence,
      performanceMetrics: migrationResult.performanceMetrics || {},
      dockerValidation: migrationResult.dockerValidation || [],
      success: migrationResult.success
    }

    res.status(200).json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    })
  }
}