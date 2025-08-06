/**
 * Advanced Jenkins to GitLab Migration API
 * Produces high-quality output matching the exact standard provided
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { productionMigrationEngine } from '../../lib/production-migration-engine'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Starting advanced Jenkins to GitLab conversion...')
    const startTime = Date.now()

    const { 
      jenkinsfile, 
      target_engine = 'gitlab',
      plugin_mappings = []
    } = req.body

    if (!jenkinsfile) {
      return res.status(400).json({ 
        error: 'Missing required field: jenkinsfile' 
      })
    }

    // Convert using the production-grade migration engine
    const result = await productionMigrationEngine.migrate({
      jenkinsfile,
      scanResult: { 
        pluginHits: plugin_mappings, 
        tier: 'medium', 
        pluginCount: plugin_mappings.length, 
        lineCount: jenkinsfile.split('\n').length,
        scripted: jenkinsfile.includes('node {'),
        declarative: jenkinsfile.includes('pipeline {'),
        warnings: [],
        timestamp: Date.now()
      },
      options: {
        includeSecurityScan: true,
        replaceDigests: false, // Keep placeholders for user to replace
        generateVariablesFile: true,
        strict: true
      }
    })

    const totalTime = Date.now() - startTime
    console.log(`✅ Advanced conversion completed in ${totalTime}ms`)

    // Return enhanced production-grade format
    const response = {
      yaml: result.gitlabYaml,
      variables_yaml: result.variablesYaml,
      deployment_checklist: result.deploymentChecklist,
      metadata: {
        confidence: result.confidence,
        security_report: result.securityReport,
        jenkins_features: result.metadata.jenkinsfeatures,
        generated_at: result.metadata.generatedAt,
        total_plugins: result.metadata.totalPlugins
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('❌ Advanced conversion failed:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}