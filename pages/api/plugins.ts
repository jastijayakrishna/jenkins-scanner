// pages/api/plugins.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { scanJenkinsFile, mapPlugins, generatePluginSummary, generateMigrationChecklist, PluginVerdict, PluginScanSummary } from '@/lib/plugin-mapper'

export interface PluginAnalysisResponse {
  verdicts: PluginVerdict[]
  summary: PluginScanSummary
  migrationChecklist: string
  success: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PluginAnalysisResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      verdicts: [],
      summary: {
        totalPlugins: 0,
        nativeSupport: 0,
        templateAvailable: 0,
        unsupported: 0,
        limited: 0,
        migrationScore: 0
      },
      migrationChecklist: '',
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { jenkinsfile } = req.body

    // Validate required fields
    if (!jenkinsfile) {
      return res.status(400).json({
        verdicts: [],
        summary: {
          totalPlugins: 0,
          nativeSupport: 0,
          templateAvailable: 0,
          unsupported: 0,
          limited: 0,
          migrationScore: 0
        },
        migrationChecklist: '',
        success: false,
        error: 'Missing required field: jenkinsfile'
      })
    }

    // Validate jenkinsfile is a string
    if (typeof jenkinsfile !== 'string') {
      return res.status(400).json({
        verdicts: [],
        summary: {
          totalPlugins: 0,
          nativeSupport: 0,
          templateAvailable: 0,
          unsupported: 0,
          limited: 0,
          migrationScore: 0
        },
        migrationChecklist: '',
        success: false,
        error: 'Jenkinsfile must be a string'
      })
    }

    // Validate content length (prevent abuse)
    if (jenkinsfile.length > 500000) { // 500KB limit
      return res.status(400).json({
        verdicts: [],
        summary: {
          totalPlugins: 0,
          nativeSupport: 0,
          templateAvailable: 0,
          unsupported: 0,
          limited: 0,
          migrationScore: 0
        },
        migrationChecklist: '',
        success: false,
        error: 'Jenkinsfile too large. Maximum size is 500KB.'
      })
    }

    // Scan for plugins
    const pluginHits = scanJenkinsFile(jenkinsfile)
    
    // Map plugins to GitLab CI equivalents
    const verdicts = mapPlugins(pluginHits)
    
    // Generate summary statistics
    const summary = generatePluginSummary(verdicts)
    
    // Generate migration checklist
    const migrationChecklist = generateMigrationChecklist(verdicts)
    
    // Add response headers for caching
    res.setHeader('Cache-Control', 'private, max-age=300') // Cache for 5 minutes
    res.setHeader('Content-Type', 'application/json')
    
    return res.status(200).json({
      verdicts,
      summary,
      migrationChecklist,
      success: true
    })

  } catch (error) {
    console.error('Plugin Analysis API Error:', error)
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment && error instanceof Error 
      ? error.message 
      : 'Internal server error during plugin analysis'

    return res.status(500).json({
      verdicts: [],
      summary: {
        totalPlugins: 0,
        nativeSupport: 0,
        templateAvailable: 0,
        unsupported: 0,
        limited: 0,
        migrationScore: 0
      },
      migrationChecklist: '',
      success: false,
      error: errorMessage
    })
  }
}

// Add request size limit for security
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}