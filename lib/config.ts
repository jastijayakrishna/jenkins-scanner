// lib/config.ts
// Environment variable validation and configuration

export interface Config {
  nodeEnv: string
  domain: string
  resendApiKey: string | null
  allowedOrigin: string
  rateLimitRequests: number
  rateLimitWindowMs: number
  port: number
  host: string
  enableLogging: boolean
  logLevel: string
}

function validateEnv(): Config {
  const errors: string[] = []
  
  // Required in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Warning: RESEND_API_KEY not set in production')
    }
    if (!process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGIN === '*') {
      console.warn('Warning: ALLOWED_ORIGIN should be set to a specific domain in production')
    }
  }
  
  // Parse and validate numeric values
  const port = parseInt(process.env.PORT || '3000', 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)')
  }
  
  const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS || '10', 10)
  if (isNaN(rateLimitRequests) || rateLimitRequests < 1) {
    errors.push('RATE_LIMIT_REQUESTS must be a positive number')
  }
  
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10)
  if (isNaN(rateLimitWindowMs) || rateLimitWindowMs < 1000) {
    errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000 (1 second)')
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
  
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
    resendApiKey: process.env.RESEND_API_KEY || null,
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
    rateLimitRequests,
    rateLimitWindowMs,
    port,
    host: process.env.HOST || '0.0.0.0',
    enableLogging: process.env.ENABLE_LOGGING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
}

// Validate on import
export const config = validateEnv()

// Logger utility
export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  if (!config.enableLogging) return
  
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    level,
    message,
    ...(data && { data })
  }
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logData))
      break
    case 'warn':
      console.warn(JSON.stringify(logData))
      break
    default:
      console.log(JSON.stringify(logData))
  }
}
