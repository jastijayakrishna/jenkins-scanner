import type { NextApiRequest, NextApiResponse } from 'next'
import { scan } from '@/lib/score'
import { ConversionResult } from '@/types'
import { enterpriseAIMigrationSystem } from '@/lib/ai-migration-system-simple'

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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ConversionResult | { error: string; details?: string }>
) {
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
      return res.status(400).json({ error: validation.error || 'Invalid input' })
    }
    
    // Scan the Jenkins file
    let scanResult
    try {
      scanResult = scan(content)
    } catch (scanError) {
      console.error('Scan error during conversion:', scanError)
      return res.status(500).json({ 
        error: 'Failed to analyze Jenkins file',
        details: process.env.NODE_ENV === 'development' ? (scanError as Error).message : undefined
      })
    }
    
    // Use AI migration system for conversion
    const migrationResult = await enterpriseAIMigrationSystem.migrate({
      jenkinsfile: content,
      scanResult,
      options: {
        targetComplexity: 'balanced',
        optimizeForSpeed: true,
        includeSecurityScanning: true,
        enableParallelization: true,
        generateDocumentation: false
      }
    })
    
    const conversionResult: ConversionResult = {
      yaml: migrationResult.gitlabYaml,
      scanResult,
      validationErrors: migrationResult.success ? [] : ['Migration failed'],
      success: migrationResult.success
    }
    
    // Log successful conversion (for monitoring)
    console.log(`[CONVERT] Success - IP: ${getRateLimitKey(req)}, Complexity: ${scanResult.tier}, Valid: ${migrationResult.success}`)
    
    res.status(200).json(conversionResult)
  } catch (error) {
    console.error('Unexpected error in convert endpoint:', error)
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