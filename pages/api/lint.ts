// pages/api/lint.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { lintCi, LintResult } from '@/lib/gitlab-lint'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LintResult | { error: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { content, baseUrl } = req.body

    // Validate required fields
    if (!content) {
      return res.status(400).json({ 
        error: 'Missing required field: content' 
      })
    }

    // Validate content is a string
    if (typeof content !== 'string') {
      return res.status(400).json({ 
        error: 'Content must be a string' 
      })
    }

    // Validate content length (prevent abuse)
    if (content.length > 100000) { // 100KB limit
      return res.status(400).json({ 
        error: 'Content too large. Maximum size is 100KB.' 
      })
    }

    // Validate baseUrl if provided
    let gitlabBaseUrl = 'https://gitlab.com'
    if (baseUrl) {
      if (typeof baseUrl !== 'string') {
        return res.status(400).json({ 
          error: 'baseUrl must be a string' 
        })
      }
      
      // Basic URL validation
      try {
        new URL(baseUrl)
        gitlabBaseUrl = baseUrl
      } catch {
        return res.status(400).json({ 
          error: 'Invalid baseUrl format' 
        })
      }
    }

    // Call the lint function
    const result = await lintCi(content, gitlabBaseUrl)
    
    // Add response headers for caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    return res.status(200).json(result)

  } catch (error) {
    console.error('GitLab CI Lint API Error:', error)
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment && error instanceof Error 
      ? error.message 
      : 'Internal server error'

    return res.status(500).json({ 
      error: errorMessage 
    })
  }
}

// Add request size limit for security
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}