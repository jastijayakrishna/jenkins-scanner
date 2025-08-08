/**
 * Plugin Analysis API
 * 
 * Enterprise plugin compatibility analysis endpoint with real-time results,
 * AI-powered mapping, and comprehensive reporting.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { EnterprisePluginAnalyzer } from '@/lib/enterprise-plugin-analyzer'
import { DatabaseService, PluginScanResult } from '@/lib/database'

interface PluginAnalysisRequest {
  jenkinsContent: string
  projectId?: string
  userId?: string
}

interface PluginAnalysisResponse {
  success: boolean
  data?: PluginScanResult
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PluginAnalysisResponse>
) {
  // CORS headers for enterprise security
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
  
  try {
    const { jenkinsContent, projectId, userId } = (req.body || {}) as PluginAnalysisRequest
    
    // Validate required fields
    if (jenkinsContent === undefined) {
      return res.status(400).json({ success: false, error: 'jenkinsContent is required' })
    }
    
    // Generate unique project ID if not provided
    const finalProjectId = projectId || `project-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const finalUserId = userId || 'anonymous'
    
    // Validate Jenkins content
    // For empty content, return a valid empty analysis instead of 400
    if (jenkinsContent.length < 1) {
      const emptyResult: PluginScanResult = {
        id: '',
        project_id: projectId || `project-${Date.now()}`,
        jenkins_content: jenkinsContent,
        scanned_at: new Date(),
        total_plugins: 0,
        compatible_plugins: 0,
        partial_plugins: 0,
        unsupported_plugins: 0,
        blocking_issues: 0,
        plugins: [],
        ai_recommendations: [],
        created_by: userId || 'anonymous'
      }
      return res.status(200).json({ success: true, data: emptyResult })
    }
    
    if (jenkinsContent.length > 1000000) { // 1MB limit
      return res.status(400).json({
        success: false,
        error: 'Jenkins content exceeds maximum size limit (1MB)'
      })
    }
    
    console.log(`🔍 Starting plugin analysis for project: ${finalProjectId}`)
    console.log(`📝 Content length: ${jenkinsContent.length} characters`)
    
    // Perform enterprise plugin analysis
    const analysisResult = await EnterprisePluginAnalyzer.analyzePlugins(
      jenkinsContent,
      finalProjectId,
      finalUserId
    )
    
    console.log(`✅ Plugin analysis completed:`)
    console.log(`   - Total plugins: ${analysisResult.total_plugins}`)
    console.log(`   - Compatible: ${analysisResult.compatible_plugins}`)
    console.log(`   - Partial: ${analysisResult.partial_plugins}`)
    console.log(`   - Unsupported: ${analysisResult.unsupported_plugins}`)
    console.log(`   - Blocking issues: ${analysisResult.blocking_issues}`)
    
    // Add performance metrics
    const responseWithMetrics = {
      ...analysisResult,
      performance: {
        analysis_time: new Date().toISOString(),
        compatibility_score: analysisResult.total_plugins > 0 
          ? Math.round((analysisResult.compatible_plugins / analysisResult.total_plugins) * 100)
          : 100,
        migration_complexity: analysisResult.blocking_issues > 0 ? 'high' 
          : analysisResult.partial_plugins > 2 ? 'medium' 
          : 'low'
      }
    }
    
    return res.status(200).json({
      success: true,
      data: responseWithMetrics as PluginScanResult
    })
    
  } catch (error) {
    console.error('❌ Plugin analysis error:', error)
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available'
    
    // Log error details for monitoring
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    })
    
    return res.status(500).json({
      success: false,
      error: `Plugin analysis failed: ${errorMessage}`
    })
  }
}

/**
 * Get historical plugin scan results
 */
export async function getPluginScanHistory(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
  
  try {
    const { projectId, limit } = req.query
    
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      })
    }
    
    const limitNum = limit ? parseInt(limit as string, 10) : 10
    if (limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 100'
      })
    }
    
    const scanResults = await DatabaseService.getPluginScanResults(projectId, limitNum)
    
    return res.status(200).json({
      success: true,
      data: {
        project_id: projectId,
        scan_history: scanResults,
        total_scans: scanResults.length
      }
    })
    
  } catch (error) {
    console.error('Failed to get plugin scan history:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history'
    })
  }
}