// lib/jenkins-parser.ts
// Jenkins pipeline parsing with metadata tracking and fallback tokenizer

// Enhanced metadata tracking for traceability
export interface ParseMetadata {
  source_file?: string
  line_numbers: {
    pipeline?: number
    stages: Record<string, number>
    plugins: Record<string, number>
  }
  parsing_method: 'tree-sitter' | 'fallback-regex' | 'hybrid'
  confidence_score: number // 0-1, how confident we are in the parsing
  unparsed_blocks: Array<{
    content: string
    line_start: number
    line_end: number
    reason: string
  }>
}

export interface JenkinsParameter {
  name: string
  type: 'string' | 'boolean' | 'choice' | 'text' | 'password'
  defaultValue?: string
  description?: string
  choices?: string[]
}

export interface JenkinsMatrix {
  axes: Record<string, string[]>
}

export interface JenkinsTimeout {
  time: number
  unit: 'SECONDS' | 'MINUTES' | 'HOURS'
}

export interface JenkinsPostActions {
  success?: string[]
  failure?: string[]
  always?: string[]
  unstable?: string[]
  aborted?: string[]
}

export interface JenkinsFeatures {
  parameters: JenkinsParameter[]
  matrix: JenkinsMatrix | null
  timeout: JenkinsTimeout | null
  retry: number | null
  postActions: JenkinsPostActions
  buildDiscarder: {
    daysToKeep?: number
    numToKeep?: number
    artifactDaysToKeep?: number
    artifactNumToKeep?: number
  } | null
  environment: Record<string, string>
  credentials: Array<{
    id: string
    type: string
    variables: Record<string, string>
  }>
  when: Array<{
    condition: string
    expression?: string
  }>
  parallelStages: string[]
  // Enhanced with metadata
  metadata?: ParseMetadata
}

// Fallback Tokenizer for malformed Jenkinsfiles
export class FallbackTokenizer {
  private static readonly STAGE_REGEX = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\{([\s\S]*?)(?=\n\s*stage\s*\(|\n\s*post\s*\{|\n\s*}\s*$)/gi
  private static readonly STEPS_REGEX = /steps\s*\{([\s\S]*?)\n\s*}/gi
  private static readonly ENVIRONMENT_REGEX = /environment\s*\{([\s\S]*?)\n\s*}/gi
  private static readonly PLUGIN_REGEX = /(withSonarQubeEnv|withCredentials|withMaven|docker\.|junit|publishHTML|archiveArtifacts|emailext|sh\s+)/gi

  static parseWithFallback(content: string, fileName?: string): { features: JenkinsFeatures, metadata: ParseMetadata } {
    const lines = content.split('\n')
    const metadata: ParseMetadata = {
      source_file: fileName,
      line_numbers: {
        stages: {},
        plugins: {}
      },
      parsing_method: 'fallback-regex',
      confidence_score: 0.7, // Lower confidence for regex parsing
      unparsed_blocks: []
    }

    const features: JenkinsFeatures = {
      parameters: [],
      matrix: null,
      timeout: null,
      retry: null,
      postActions: {},
      buildDiscarder: null,
      environment: {},
      credentials: [],
      when: [],
      parallelStages: [],
      metadata
    }

    // Extract stages with line numbers
    let stageMatch
    this.STAGE_REGEX.lastIndex = 0 // Reset regex
    while ((stageMatch = this.STAGE_REGEX.exec(content)) !== null) {
      const stageName = stageMatch[1]
      const stageContent = stageMatch[2]
      const lineNumber = content.substring(0, stageMatch.index).split('\n').length
      
      metadata.line_numbers.stages[stageName] = lineNumber
      
      // Extract plugins from this stage
      let pluginMatch
      this.PLUGIN_REGEX.lastIndex = 0
      while ((pluginMatch = this.PLUGIN_REGEX.exec(stageContent)) !== null) {
        const plugin = pluginMatch[1].trim()
        const pluginLineNumber = lineNumber + stageContent.substring(0, pluginMatch.index).split('\n').length
        metadata.line_numbers.plugins[plugin] = pluginLineNumber
      }
    }

    // Extract environment variables
    let envMatch
    this.ENVIRONMENT_REGEX.lastIndex = 0
    while ((envMatch = this.ENVIRONMENT_REGEX.exec(content)) !== null) {
      const envContent = envMatch[1]
      const envVars = envContent.match(/(\w+)\s*=\s*['"]([^'"]+)['"]/g) || []
      
      envVars.forEach(envVar => {
        const [, key, value] = envVar.match(/(\w+)\s*=\s*['"]([^'"]+)['"]/) || []
        if (key && value) {
          features.environment[key] = value
        }
      })
    }

    // Mark unparsed complex blocks
    const complexBlocks = content.match(/script\s*\{[\s\S]*?\}/gi) || []
    complexBlocks.forEach((block, index) => {
      const blockIndex = content.indexOf(block)
      const lineStart = content.substring(0, blockIndex).split('\n').length
      const lineEnd = lineStart + block.split('\n').length - 1
      
      metadata.unparsed_blocks.push({
        content: block,
        line_start: lineStart,
        line_end: lineEnd,
        reason: 'Complex Groovy script block - requires manual review'
      })
    })

    // Adjust confidence based on how much we parsed successfully
    const totalLines = lines.length
    const parsedLines = Object.keys(metadata.line_numbers.stages).length * 5 // Estimate 5 lines per stage
    metadata.confidence_score = Math.min(0.9, parsedLines / totalLines + 0.4)

    return { features, metadata }
  }
}

// Extract all parameters from Jenkins pipeline
export function extractParameters(jenkinsContent: string): JenkinsParameter[] {
  const params: JenkinsParameter[] = []
  
  // Match string parameters
  const stringParams = jenkinsContent.matchAll(
    /string\s*\(\s*name:\s*['"](\w+)['"]\s*(?:,\s*defaultValue:\s*['"]([^'"]*)['"]\s*)?(?:,\s*description:\s*['"]([^'"]*)['"]\s*)?\)/g
  )
  for (const match of stringParams) {
    params.push({
      name: match[1],
      type: 'string',
      defaultValue: match[2] || '',
      description: match[3]
    })
  }
  
  // Match boolean parameters
  const boolParams = jenkinsContent.matchAll(
    /booleanParam\s*\(\s*name:\s*['"](\w+)['"]\s*(?:,\s*defaultValue:\s*(true|false)\s*)?(?:,\s*description:\s*['"]([^'"]*)['"]\s*)?\)/g
  )
  for (const match of boolParams) {
    params.push({
      name: match[1],
      type: 'boolean',
      defaultValue: match[2] || 'false',
      description: match[3]
    })
  }
  
  // Match choice parameters
  const choiceParams = jenkinsContent.matchAll(
    /choice\s*\(\s*name:\s*['"](\w+)['"]\s*,\s*choices:\s*\[([^\]]+)\]\s*(?:,\s*description:\s*['"]([^'"]*)['"]\s*)?\)/g
  )
  for (const match of choiceParams) {
    const choicesStr = match[2]
    const choices = choicesStr.match(/['"]([^'"]+)['"]/g)?.map(c => c.replace(/['"]/g, '')) || []
    params.push({
      name: match[1],
      type: 'choice',
      defaultValue: choices[0] || '',
      choices,
      description: match[3]
    })
  }
  
  // Match text parameters
  const textParams = jenkinsContent.matchAll(
    /text\s*\(\s*name:\s*['"](\w+)['"]\s*(?:,\s*defaultValue:\s*['"]([^'"]*)['"]\s*)?(?:,\s*description:\s*['"]([^'"]*)['"]\s*)?\)/g
  )
  for (const match of textParams) {
    params.push({
      name: match[1],
      type: 'text',
      defaultValue: match[2] || '',
      description: match[3]
    })
  }
  
  // Match password parameters
  const passwordParams = jenkinsContent.matchAll(
    /password\s*\(\s*name:\s*['"](\w+)['"]\s*(?:,\s*defaultValue:\s*['"]([^'"]*)['"]\s*)?(?:,\s*description:\s*['"]([^'"]*)['"]\s*)?\)/g
  )
  for (const match of passwordParams) {
    params.push({
      name: match[1],
      type: 'password',
      defaultValue: match[2] || '',
      description: match[3]
    })
  }
  
  return params
}

// Extract environment variables
export function extractEnvironment(jenkinsContent: string): Record<string, string> {
  const env: Record<string, string> = {}
  
  // Match environment block
  const envMatch = jenkinsContent.match(/environment\s*\{([\s\S]*?)\}/)
  if (envMatch) {
    const envContent = envMatch[1]
    // Match KEY = 'value' or KEY = "value" patterns
    const envVars = envContent.matchAll(/(\w+)\s*=\s*['"]([^'"]*)['"]/g)
    for (const match of envVars) {
      env[match[1]] = match[2]
    }
  }
  
  return env
}

// Extract all advanced Jenkins features
export function extractAllFeatures(jenkinsContent: string): JenkinsFeatures {
  return {
    parameters: extractParameters(jenkinsContent),
    matrix: extractMatrix(jenkinsContent),
    timeout: extractTimeout(jenkinsContent),
    retry: extractRetry(jenkinsContent),
    postActions: extractPostActions(jenkinsContent),
    buildDiscarder: extractBuildDiscarder(jenkinsContent),
    environment: extractEnvironment(jenkinsContent),
    credentials: extractCredentials(jenkinsContent),
    when: extractWhenConditions(jenkinsContent),
    parallelStages: extractParallelStages(jenkinsContent)
  }
}

// Helper functions for other features (to be implemented)
function extractMatrix(jenkinsContent: string): JenkinsMatrix | null {
  const matrixMatch = jenkinsContent.match(/matrix\s*\{[\s\S]*?axes\s*\{([\s\S]*?)\}\s*\}/m)
  if (!matrixMatch) return null
  
  const axes: Record<string, string[]> = {}
  
  // Split by axis blocks and process each one
  const axesContent = matrixMatch[1]
  const axisBlocks = axesContent.split(/(?=axis\s*\{)/).filter(block => block.trim().startsWith('axis'))
  
  for (const block of axisBlocks) {
    const nameMatch = block.match(/name\s+['"](\w+)['"]/)
    const valuesText = block.match(/values\s+([^}]+)/)
    
    if (nameMatch && valuesText) {
      const name = nameMatch[1]
      const values = valuesText[1].match(/['"]([^'"]+)['"]/g)?.map(v => v.replace(/['"]/g, '')) || []
      if (values.length > 0) {
        axes[name] = values
      }
    }
  }
  
  return Object.keys(axes).length > 0 ? { axes } : null
}

function extractTimeout(jenkinsContent: string): JenkinsTimeout | null {
  const timeoutMatch = jenkinsContent.match(/timeout\s*\(\s*time:\s*(\d+)(?:,\s*unit:\s*['"](\w+)['"]\s*)?\)/)
  if (!timeoutMatch) return null
  
  return {
    time: parseInt(timeoutMatch[1]),
    unit: (timeoutMatch[2] as JenkinsTimeout['unit']) || 'MINUTES'
  }
}

function extractRetry(jenkinsContent: string): number | null {
  const retryMatch = jenkinsContent.match(/retry\s*\(\s*(\d+)\s*\)/)
  return retryMatch ? parseInt(retryMatch[1]) : null
}

function extractPostActions(jenkinsContent: string): JenkinsPostActions {
  const actions: JenkinsPostActions = {}
  const postMatch = jenkinsContent.match(/post\s*\{([\s\S]*?)\n\s*\}/)
  
  if (postMatch) {
    const postContent = postMatch[1]
    
    // Extract each post condition
    const conditions = ['success', 'failure', 'always', 'unstable', 'aborted'] as const
    
    conditions.forEach(condition => {
      const conditionMatch = postContent.match(new RegExp(`${condition}\\s*\\{([\\s\\S]*?)\\}`, 'm'))
      if (conditionMatch) {
        const content = conditionMatch[1]
        const actions: string[] = []
        
        // Extract actions
        if (content.includes('slackSend')) {
          actions.push('slack_notification')
        }
        if (content.includes('emailext') || content.includes('mail ')) {
          actions.push('email_notification')
        }
        if (content.includes('cleanWs')) {
          actions.push('cleanup_workspace')
        }
        if (content.includes('archiveArtifacts')) {
          actions.push('archive_artifacts')
        }
        
        if (actions.length > 0) {
          ;(actions as any)[condition] = actions
        }
      }
    })
  }
  
  return actions
}

function extractBuildDiscarder(jenkinsContent: string): JenkinsFeatures['buildDiscarder'] {
  const match = jenkinsContent.match(
    /buildDiscarder\s*\(\s*logRotator\s*\(([\s\S]*?)\)\s*\)/
  )
  
  if (!match) return null
  
  const content = match[1]
  const config: NonNullable<JenkinsFeatures['buildDiscarder']> = {}
  
  const daysMatch = content.match(/daysToKeepStr:\s*['"](\d+)['"]/)
  if (daysMatch) config.daysToKeep = parseInt(daysMatch[1])
  
  const numMatch = content.match(/numToKeepStr:\s*['"](\d+)['"]/)
  if (numMatch) config.numToKeep = parseInt(numMatch[1])
  
  const artifactDaysMatch = content.match(/artifactDaysToKeepStr:\s*['"](\d+)['"]/)
  if (artifactDaysMatch) config.artifactDaysToKeep = parseInt(artifactDaysMatch[1])
  
  const artifactNumMatch = content.match(/artifactNumToKeepStr:\s*['"](\d+)['"]/)
  if (artifactNumMatch) config.artifactNumToKeep = parseInt(artifactNumMatch[1])
  
  return Object.keys(config).length > 0 ? config : null
}

function extractCredentials(jenkinsContent: string): JenkinsFeatures['credentials'] {
  const creds: JenkinsFeatures['credentials'] = []
  
  // Match withCredentials blocks
  const credMatches = jenkinsContent.matchAll(
    /withCredentials\s*\(\s*\[([^\]]+)\]\s*\)\s*\{/g
  )
  
  for (const match of credMatches) {
    const credContent = match[1]
    
    // Username/password credentials
    const userPassMatch = credContent.match(
      /usernamePassword\s*\(\s*credentialsId:\s*['"]([^'"]+)['"]\s*,\s*usernameVariable:\s*['"](\w+)['"]\s*,\s*passwordVariable:\s*['"](\w+)['"]\s*\)/
    )
    if (userPassMatch) {
      creds.push({
        id: userPassMatch[1],
        type: 'usernamePassword',
        variables: {
          username: userPassMatch[2],
          password: userPassMatch[3]
        }
      })
    }
    
    // File credentials
    const fileMatch = credContent.match(
      /file\s*\(\s*credentialsId:\s*['"]([^'"]+)['"]\s*,\s*variable:\s*['"](\w+)['"]\s*\)/
    )
    if (fileMatch) {
      creds.push({
        id: fileMatch[1],
        type: 'file',
        variables: {
          file: fileMatch[2]
        }
      })
    }
    
    // String/secret text credentials
    const stringMatch = credContent.match(
      /string\s*\(\s*credentialsId:\s*['"]([^'"]+)['"]\s*,\s*variable:\s*['"](\w+)['"]\s*\)/
    )
    if (stringMatch) {
      creds.push({
        id: stringMatch[1],
        type: 'string',
        variables: {
          secret: stringMatch[2]
        }
      })
    }
  }
  
  return creds
}

function extractWhenConditions(jenkinsContent: string): JenkinsFeatures['when'] {
  const conditions: JenkinsFeatures['when'] = []
  
  // Match when blocks
  const whenMatches = jenkinsContent.matchAll(/when\s*\{([\s\S]*?)\}/g)
  
  for (const match of whenMatches) {
    const whenContent = match[1]
    
    // Expression conditions
    const exprMatch = whenContent.match(/expression\s*\{\s*([^}]+)\s*\}/)
    if (exprMatch) {
      conditions.push({
        condition: 'expression',
        expression: exprMatch[1].trim()
      })
    }
    
    // Branch conditions
    const branchMatch = whenContent.match(/branch\s+['"]([^'"]+)['"]/)
    if (branchMatch) {
      conditions.push({
        condition: 'branch',
        expression: branchMatch[1]
      })
    }
  }
  
  return conditions
}

function extractParallelStages(jenkinsContent: string): string[] {
  const stages: string[] = []
  const parallelMatch = jenkinsContent.match(/parallel\s*\{([\s\S]*?)\n\s*\}/m)
  
  if (parallelMatch) {
    const stageMatches = parallelMatch[1].matchAll(/stage\s*\(\s*['"]([^'"]+)['"]/g)
    for (const match of stageMatches) {
      stages.push(match[1])
    }
  }
  
  return stages
}
