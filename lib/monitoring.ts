// lib/monitoring.ts
// Monitoring and analytics utilities

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  tags?: Record<string, string>
}

interface ErrorMetric {
  error: Error
  context?: Record<string, any>
  userId?: string
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorMetric[] = []
  
  // Track performance metrics
  trackPerformance(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    } as any)
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to DataDog, New Relic, etc.
      console.log('Performance metric:', metric)
    }
  }
  
  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    const errorMetric: ErrorMetric = {
      error,
      context,
      userId: context?.userId
    }
    
    this.errors.push(errorMetric)
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry, Rollbar, etc.
      console.error('Error tracked:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context
      })
    }
  }
  
  // Track API request
  trackApiRequest(endpoint: string, method: string, statusCode: number, duration: number) {
    this.trackPerformance({
      name: 'api_request',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        method,
        status: statusCode.toString()
      }
    })
  }
  
  // Track conversion metrics
  trackConversion(complexity: string, success: boolean, duration: number) {
    this.trackPerformance({
      name: 'jenkins_conversion',
      value: duration,
      unit: 'ms',
      tags: {
        complexity,
        success: success.toString()
      }
    })
  }
  
  // Get metrics summary
  getMetricsSummary() {
    return {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      metrics: this.metrics.slice(-100), // Last 100 metrics
      errors: this.errors.slice(-50) // Last 50 errors
    }
  }
  
  // Clear old metrics (run periodically)
  clearOldMetrics() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    this.metrics = this.metrics.filter((m: any) => m.timestamp > oneHourAgo)
    this.errors = this.errors.slice(-100) // Keep last 100 errors
  }
}

// Singleton instance
export const monitoring = new MonitoringService()

// Middleware for Express/Next.js API routes
export function monitoringMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now()
    const originalEnd = res.end
    
    // Override res.end to capture response
    res.end = function(...args: any[]) {
      const duration = Date.now() - start
      monitoring.trackApiRequest(
        req.url,
        req.method,
        res.statusCode,
        duration
      )
      
      originalEnd.apply(res, args)
    }
    
    try {
      await handler(req, res)
    } catch (error) {
      monitoring.trackError(error as Error, {
        url: req.url,
        method: req.method,
        body: req.body
      })
      throw error
    }
  }
}

// Performance timer utility
export class PerformanceTimer {
  private startTime: number
  
  constructor(private name: string) {
    this.startTime = Date.now()
  }
  
  end(tags?: Record<string, string>) {
    const duration = Date.now() - this.startTime
    monitoring.trackPerformance({
      name: this.name,
      value: duration,
      unit: 'ms',
      tags
    })
    return duration
  }
}

// Clean up old metrics periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    monitoring.clearOldMetrics()
  }, 60 * 60 * 1000) // Every hour
}
