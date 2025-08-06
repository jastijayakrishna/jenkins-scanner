// pages/api/creds.ts
/**
 * API endpoint for Jenkins credential analysis and GitLab variable mapping
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { scanCredentials, analyzeCredentialUsage } from '@/lib/cred-scanner'
import { 
  mapCredentialsToGitLab, 
  generateEnvFile, 
  generateGitLabVarsScript,
  validateGitLabVarSpecs,
  type GitLabVarSpec 
} from '@/lib/cred-mapper'

interface CredsRequestBody {
  jenkinsfile: string
  projectId?: string
  environmentScope?: string
  forceProtected?: boolean
  customMappings?: Record<string, Partial<GitLabVarSpec>>
  options?: {
    generateEnv?: boolean
    generateScript?: boolean
    dryRun?: boolean
    batchSize?: number
  }
}

interface CredsResponse {
  success: boolean
  error?: string
  data?: {
    credentials: ReturnType<typeof scanCredentials>
    analysis: ReturnType<typeof analyzeCredentialUsage>
    variables: GitLabVarSpec[]
    validation: ReturnType<typeof validateGitLabVarSpecs>
    envFile?: string
    script?: string
    summary: {
      totalCredentials: number
      totalVariables: number
      fileVariables: number
      protectedVariables: number
      maskedVariables: number
    }
  }
}

/**
 * Validates the request body
 */
function validateRequest(body: any): { valid: boolean; error?: string; data?: CredsRequestBody } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' }
  }
  
  if (!body.jenkinsfile || typeof body.jenkinsfile !== 'string') {
    return { valid: false, error: 'jenkinsfile field is required and must be a string' }
  }
  
  if (body.jenkinsfile.trim().length === 0) {
    return { valid: false, error: 'jenkinsfile cannot be empty' }
  }
  
  if (body.jenkinsfile.length > 1024 * 1024) { // 1MB limit
    return { valid: false, error: 'jenkinsfile is too large (max 1MB)' }
  }
  
  // Validate optional fields
  const validatedBody: CredsRequestBody = {
    jenkinsfile: body.jenkinsfile,
    projectId: typeof body.projectId === 'string' ? body.projectId : undefined,
    environmentScope: typeof body.environmentScope === 'string' ? body.environmentScope : '*',
    forceProtected: typeof body.forceProtected === 'boolean' ? body.forceProtected : true,
    customMappings: typeof body.customMappings === 'object' ? body.customMappings : {},
    options: {
      generateEnv: body.options?.generateEnv !== false,
      generateScript: body.options?.generateScript !== false,
      dryRun: body.options?.dryRun === true,
      batchSize: typeof body.options?.batchSize === 'number' && body.options.batchSize > 0 
        ? Math.min(body.options.batchSize, 50) 
        : 10
    }
  }
  
  return { valid: true, data: validatedBody }
}

/**
 * Main API handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CredsResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Use POST.`
    })
    return
  }
  
  try {
    // Validate request
    const validation = validateRequest(req.body)
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error
      })
      return
    }
    
    const {
      jenkinsfile,
      projectId,
      environmentScope,
      forceProtected,
      customMappings,
      options
    } = validation.data!
    
    // Scan for credentials
    console.log('Scanning Jenkinsfile for credentials...')
    const credentialHits = scanCredentials(jenkinsfile)
    
    if (credentialHits.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          credentials: [],
          analysis: {
            totalCredentials: 0,
            byKind: {},
            potentialSecrets: [],
            recommendations: ['No credentials found in the Jenkinsfile.']
          },
          variables: [],
          validation: { valid: true, errors: [], warnings: [] },
          envFile: options?.generateEnv ? '# No credentials found\n' : undefined,
          script: options?.generateScript ? '#!/bin/bash\necho "No credentials to migrate"\n' : undefined,
          summary: {
            totalCredentials: 0,
            totalVariables: 0,
            fileVariables: 0,
            protectedVariables: 0,
            maskedVariables: 0
          }
        }
      })
      return
    }
    
    // Analyze credential usage
    console.log(`Found ${credentialHits.length} credentials, analyzing...`)
    const analysis = analyzeCredentialUsage(credentialHits)
    
    // Map to GitLab variables
    console.log('Mapping credentials to GitLab variables...')
    const variables = mapCredentialsToGitLab(credentialHits, {
      projectId,
      environmentScope,
      forceProtected,
      customMappings
    })
    
    // Validate variable specifications
    const varValidation = validateGitLabVarSpecs(variables)
    
    // Generate artifacts if requested
    let envFile: string | undefined
    let script: string | undefined
    
    if (options?.generateEnv) {
      console.log('Generating .env file...')
      envFile = generateEnvFile(variables)
    }
    
    if (options?.generateScript) {
      console.log('Generating GitLab variables script...')
      script = generateGitLabVarsScript(variables, {
        projectId,
        dryRun: options.dryRun,
        batchSize: options.batchSize
      })
    }
    
    // Calculate summary statistics
    const summary = {
      totalCredentials: credentialHits.length,
      totalVariables: variables.length,
      fileVariables: variables.filter(v => v.type === 'file').length,
      protectedVariables: variables.filter(v => v.protected).length,
      maskedVariables: variables.filter(v => v.masked).length
    }
    
    console.log('Credential analysis completed:', summary)
    
    res.status(200).json({
      success: true,
      data: {
        credentials: credentialHits,
        analysis,
        variables,
        validation: varValidation,
        envFile,
        script,
        summary
      }
    })
    
  } catch (error) {
    console.error('Error processing credentials:', error)
    
    res.status(500).json({
      success: false,
      error: error instanceof Error 
        ? `Internal server error: ${error.message}` 
        : 'Internal server error'
    })
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}