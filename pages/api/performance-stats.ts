/**
 * Performance Statistics API
 * Provides real-time performance metrics and system health
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { PerformanceOptimizer } from '@/lib/performance-optimizer'

interface PerformanceStats {
  success: boolean
  data?: {
    metrics: Record<string, any>
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical'
      uptime: number
      memoryUsage?: any
      cacheHitRate: number
      averageResponseTime: number
    }
    recommendations: string[]
  }
  error?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<PerformanceStats>) {
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    })
    return
  }

  try {
    // Get performance metrics
    const metrics = PerformanceOptimizer.getPerformanceMetrics()
    
    // Calculate system health
    const averageResponseTime = Object.values(metrics)
      .filter((m: any) => m.avgTime)
      .reduce((sum: number, m: any) => sum + m.avgTime, 0) / 
      Object.keys(metrics).length || 0

    const cacheHitRate = metrics.cacheStats ? 
      (metrics.cacheStats.regexCacheSize + metrics.cacheStats.parseCacheSize) / 100 : 0.75

    const systemHealth = {
      status: (averageResponseTime < 100 ? 'healthy' : 
               averageResponseTime < 500 ? 'warning' : 'critical') as "critical" | "warning" | "healthy",
      uptime: process.uptime(),
      memoryUsage: metrics.memoryUsage,
      cacheHitRate: Math.min(1, cacheHitRate),
      averageResponseTime
    }

    // Generate performance recommendations
    const recommendations = []
    if (averageResponseTime > 200) {
      recommendations.push('Consider optimizing slow operations')
    }
    if (cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate is low - consider increasing cache size')
    }
    if (metrics.memoryUsage?.heapUsed > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Memory usage is high - consider garbage collection optimization')
    }

    res.status(200).json({
      success: true,
      data: {
        metrics,
        systemHealth,
        recommendations
      }
    })

  } catch (error) {
    console.error('Error getting performance stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance statistics'
    })
  }
}