/**
 * AI Service Metrics API
 * 
 * Exposes real-time metrics from the Enterprise AI Service
 * for monitoring, debugging, and performance analysis.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { EnterpriseAIService } from '@/lib/ai-service'

interface AIMetricsResponse {
  success: boolean
  data?: {
    metrics: any
    health: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      circuitBreaker: string
      rateLimitRemaining: number
      cacheSize: number
    }
    performance: {
      averageResponseTime: number
      successRate: number
      cacheHitRate: number
      totalTokensUsed: number
    }
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIMetricsResponse>
) {
  // CORS headers for enterprise security
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }
  
  try {
    // Get AI service metrics
    const metrics = EnterpriseAIService.getMetrics()
    
    // Calculate health status
    const healthStatus = calculateHealthStatus(metrics)
    
    // Calculate performance metrics
    const performance = calculatePerformanceMetrics(metrics)
    
    return res.status(200).json({
      success: true,
      data: {
        metrics,
        health: {
          status: healthStatus,
          circuitBreaker: metrics.circuitBreakerState,
          rateLimitRemaining: metrics.rateLimitRemaining,
          cacheSize: metrics.cacheSize
        },
        performance
      }
    })
    
  } catch (error) {
    console.error('Failed to get AI metrics:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI metrics'
    })
  }
}

/**
 * Calculate health status based on metrics
 */
function calculateHealthStatus(metrics: any): 'healthy' | 'degraded' | 'unhealthy' {
  // Check circuit breaker
  if (metrics.circuitBreakerState === 'OPEN') {
    return 'unhealthy'
  }
  
  // Check success rate
  const successRate = metrics.totalRequests > 0 
    ? metrics.successfulRequests / metrics.totalRequests 
    : 1
  
  if (successRate < 0.5) {
    return 'unhealthy'
  } else if (successRate < 0.8) {
    return 'degraded'
  }
  
  // Check rate limiting
  if (metrics.rateLimitRemaining === 0) {
    return 'degraded'
  }
  
  return 'healthy'
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(metrics: any) {
  const successRate = metrics.totalRequests > 0 
    ? (metrics.successfulRequests / metrics.totalRequests) * 100 
    : 100
  
  const cacheHitRate = (metrics.cacheHits + metrics.cacheMisses) > 0
    ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
    : 0
  
  return {
    averageResponseTime: Math.round(metrics.averageResponseTime),
    successRate: Math.round(successRate * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
    totalTokensUsed: metrics.totalTokensUsed
  }
} 