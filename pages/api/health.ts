import type { NextApiRequest, NextApiResponse } from 'next'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  checks: {
    memory: {
      status: 'ok' | 'warning' | 'error'
      used: number
      total: number
      percentage: number
    }
    // Add more checks as needed
  }
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus | { error: string }>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const memoryUsage = process.memoryUsage()
    const totalMemory = process.memoryUsage().rss
    const usedMemory = memoryUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100
    
    let memoryStatus: 'ok' | 'warning' | 'error' = 'ok'
    if (memoryPercentage > 90) {
      memoryStatus = 'error'
    } else if (memoryPercentage > 70) {
      memoryStatus = 'warning'
    }
    
    const healthStatus: HealthStatus = {
      status: memoryStatus === 'error' ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        memory: {
          status: memoryStatus,
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage)
        }
      }
    }
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(healthStatus)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(503).json({ error: 'Health check failed' })
  }
}
