import type { NextApiRequest, NextApiResponse } from 'next'
import { scan } from '@/lib/score'
import { monitoring, PerformanceTimer } from '@/lib/monitoring'
import { PerformanceOptimizer, OptimizedPluginScanner } from '@/lib/performance-optimizer'

// Security: Max file size limit (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Security: Rate limiting (simple in-memory store for demo)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

function getRateLimitKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (forwarded as string).split(',')[0] : req.socket.remoteAddress
  return ip || 'unknown'
}

function checkRateLimit(req: NextApiRequest): boolean {
  const key = getRateLimitKey(req)
  const now = Date.now()
  const record = requestCounts.get(key)
  
  if (!record || record.resetTime < now) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

// Input validation and sanitization
function validateInput(content: any): { valid: boolean; error?: string } {
  if (!content) {
    return { valid: false, error: 'No content provided' }
  }
  
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' }
  }
  
  if (content.length > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 2MB limit' }
  }
  
  // Basic sanitization - remove any potential script tags
  if (content.includes('<script') || content.includes('javascript:')) {
    return { valid: false, error: 'Invalid content detected' }
  }
  
  return { valid: true }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // CORS headers for security
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  
  try {
    // Rate limiting
    if (!checkRateLimit(req)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }
    
    const { content } = req.body
    
    // Input validation
    const validation = validateInput(content)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }
    
    // Perform optimized scan with intelligent caching and monitoring
    let result
    const timer = new PerformanceTimer('jenkins_scan')
    try {
      // Use optimized parsing and scanning
      const parsedData = PerformanceOptimizer.parseJenkinsfile(content)
      const optimizedPlugins = OptimizedPluginScanner.scanPlugins(content)
      
      // Enhance the original scan with optimized data
      result = scan(content)
      
      // Add performance insights
      ;(result as any).performanceMetrics = PerformanceOptimizer.getPerformanceMetrics()
      ;(result as any).optimizedPluginCount = optimizedPlugins.length
      
      timer.end({ complexity: result.tier, optimized: 'true' })
    } catch (scanError) {
      monitoring.trackError(scanError as Error, { endpoint: 'parse', content_length: content.length })
      console.error('Scan error:', scanError)
      return res.status(500).json({ 
        error: 'Failed to analyze Jenkins file',
        details: process.env.NODE_ENV === 'development' ? (scanError as Error).message : undefined
      })
    }
    
    // Log successful request (for monitoring)
    console.log(`[PARSE] Success - IP: ${getRateLimitKey(req)}, Size: ${content.length} bytes`)
    
    res.status(200).json(result)
  } catch (error) {
    console.error('Unexpected error in parse endpoint:', error)
    res.status(500).json({ 
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}

// Export config to limit body size
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}
