/**
 * Enterprise AI Service
 * 
 * Real Claude API integration with enterprise-grade features:
 * - Rate limiting and circuit breaker patterns
 * - Intelligent caching and retry logic
 * - Error handling and fallback strategies
 * - Performance monitoring and metrics
 */

interface AIServiceConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  maxRetries: number
  rateLimitPerMinute: number
  cacheTTL: number
}

interface AIRequest {
  prompt: string
  context?: any
  options?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
}

interface AIResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  processingTime: number
  cached: boolean
}

interface RateLimitState {
  requests: number
  resetTime: number
}

export class EnterpriseAIService {
  private static config: AIServiceConfig = {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.1,
    maxRetries: 3,
    rateLimitPerMinute: 50,
    cacheTTL: 24 * 60 * 60 * 1000 // 24 hours
  }

  private static cache = new Map<string, { response: AIResponse, expiry: number }>()
  private static rateLimitState: RateLimitState = { requests: 0, resetTime: Date.now() }
  private static circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
    threshold: process.env.NODE_ENV === 'test' ? 3 : 5,
    timeout: process.env.NODE_ENV === 'test' ? 1000 : 60000 // 1 second in tests, 1 minute in production
  }

  private static metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalTokensUsed: 0
  }

  /**
   * Initialize AI service with configuration
   */
  static initialize(config?: Partial<AIServiceConfig>): void {
    // Always re-read the API key from environment
    this.config.apiKey = process.env.ANTHROPIC_API_KEY || ''
    
    if (config) {
      this.config = { ...this.config, ...config }
    }

    if (!this.config.apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not configured - AI features will be limited')
    }

    console.log('🤖 Enterprise AI Service initialized')
  }

  /**
   * Analyze Jenkins plugin with real AI
   */
  static async analyzePlugin(
    pluginName: string,
    usageContext: string,
    projectContext: any
  ): Promise<{
    compatibility_status: 'compatible' | 'partial' | 'unsupported'
    gitlab_equivalent?: string
    migration_notes: string
    is_blocking: boolean
    workaround_available: boolean
    documentation_url?: string
    confidence: number
  }> {
    // If no API key is configured, use fallback immediately
    if (!this.config.apiKey) {
      console.log(`🔧 Using fallback analysis for plugin: ${pluginName} (no API key)`)
      return this.getFallbackPluginAnalysis(pluginName, usageContext)
    }

    const prompt = this.buildPluginAnalysisPrompt(pluginName, usageContext, projectContext)
    
    try {
      const response = await this.makeAIRequest({
        prompt,
        context: { pluginName, usageContext, projectContext },
        options: { temperature: 0.1, maxTokens: 1000 }
      })

      // Parse AI response
      const analysis = this.parsePluginAnalysisResponse(response.content)
      
      return {
        ...analysis,
        confidence: this.calculateConfidence(response, analysis)
      }

    } catch (error) {
      console.error(`❌ AI analysis failed for plugin ${pluginName}:`, error)
      
      // Return fallback analysis
      return this.getFallbackPluginAnalysis(pluginName, usageContext)
    }
  }

  /**
   * Generate migration recommendations with real AI
   */
  static async generateMigrationRecommendations(
    plugins: any[],
    projectContext: any
  ): Promise<string[]> {
    const prompt = this.buildRecommendationsPrompt(plugins, projectContext)
    
    try {
      const response = await this.makeAIRequest({
        prompt,
        context: { plugins, projectContext },
        options: { temperature: 0.2, maxTokens: 1500 }
      })

      return this.parseRecommendationsResponse(response.content)

    } catch (error) {
      console.error('❌ AI recommendations failed:', error)
      return this.getFallbackRecommendations(plugins)
    }
  }

  /**
   * Analyze GitLab CI dry-run results with real AI
   */
  static async analyzeDryRunResults(
    dryRunResult: any,
    jenkinsContent: string
  ): Promise<{
    severity: 'low' | 'medium' | 'high'
    key_issues: string[]
    recommended_actions: string[]
    migration_readiness: 'ready' | 'needs_work' | 'blocked'
    confidence: number
  }> {
    // If no API key is configured, use fallback immediately
    if (!this.config.apiKey) {
      return this.getFallbackDryRunAnalysis(dryRunResult)
    }

    const prompt = this.buildDryRunAnalysisPrompt(dryRunResult, jenkinsContent)
    
    try {
      const response = await this.makeAIRequest({
        prompt,
        context: { dryRunResult, jenkinsContent },
        options: { temperature: 0.1, maxTokens: 2000 }
      })

      const analysis = this.parseDryRunAnalysisResponse(response.content)
      
      return {
        ...analysis,
        confidence: this.calculateConfidence(response, analysis)
      }

    } catch (error) {
      console.error('❌ AI dry-run analysis failed:', error)
      return this.getFallbackDryRunAnalysis(dryRunResult)
    }
  }

  /**
   * Make AI request with enterprise features
   */
  private static async makeAIRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    this.metrics.totalRequests++

    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN - AI service temporarily unavailable')
      }
    }

    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded - please try again later')
    }

    // Check cache
    const cacheKey = this.generateCacheKey(request)
    const cachedResponse = this.getCachedResponse(cacheKey)
    if (cachedResponse) {
      this.metrics.cacheHits++
      return cachedResponse
    }

    this.metrics.cacheMisses++

    // Make API request with retry logic
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeClaudeAPIRequest(request)
        
        // Update circuit breaker on success
        if (this.circuitBreaker.state === 'HALF_OPEN') {
          this.circuitBreaker.state = 'CLOSED'
        }
        this.circuitBreaker.failures = 0

        // Cache successful response
        this.cacheResponse(cacheKey, response)

        // Update metrics
        this.metrics.successfulRequests++
        this.metrics.averageResponseTime = 
          (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + response.processingTime) / 
          this.metrics.successfulRequests
        this.metrics.totalTokensUsed += response.usage.totalTokens

        return response

      } catch (error) {
        lastError = error as Error
        console.warn(`AI request attempt ${attempt} failed:`, error)
        
        // Update circuit breaker on failure
        this.circuitBreaker.failures++
        this.circuitBreaker.lastFailureTime = Date.now()
        
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
          this.circuitBreaker.state = 'OPEN'
        }

        // Wait before retry (exponential backoff) - but not in tests
        if (attempt < this.config.maxRetries && process.env.NODE_ENV !== 'test') {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }

    this.metrics.failedRequests++
    throw lastError || new Error('AI request failed after all retries')
  }

  /**
   * Make actual Claude API request
   */
  private static async makeClaudeAPIRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()

    if (!this.config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.options?.model || this.config.model,
        max_tokens: request.options?.maxTokens || this.config.maxTokens,
        temperature: request.options?.temperature || this.config.temperature,
        messages: [{
          role: 'user',
          content: request.prompt
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Claude API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    return {
      content: data.content[0].text,
      model: data.model,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      processingTime,
      cached: false
    }
  }

  /**
   * Build plugin analysis prompt
   */
  private static buildPluginAnalysisPrompt(
    pluginName: string,
    usageContext: string,
    projectContext: any
  ): string {
    return `You are an expert DevOps engineer specializing in Jenkins to GitLab CI migrations.

Analyze this Jenkins plugin for GitLab CI compatibility:

**Plugin:** ${pluginName}
**Usage Context:** ${usageContext}
**Project Type:** ${projectContext.projectType || 'unknown'}
**Project Features:** ${projectContext.detectedFeatures?.join(', ') || 'none'}
**Complexity:** ${projectContext.complexityLevel || 'simple'}

Provide analysis in this exact JSON format:
{
  "compatibility_status": "compatible|partial|unsupported",
  "gitlab_equivalent": "GitLab CI equivalent or null",
  "migration_notes": "Detailed migration guidance",
  "is_blocking": boolean,
  "workaround_available": boolean,
  "documentation_url": "URL to migration docs or null"
}

Focus on:
1. Direct GitLab CI equivalents
2. Required manual configuration
3. Migration complexity and blockers
4. Best practices for this plugin type

Respond only with valid JSON.`
  }

  /**
   * Build recommendations prompt
   */
  private static buildRecommendationsPrompt(plugins: any[], projectContext: any): string {
    const blockingPlugins = plugins.filter(p => p.is_blocking)
    const unsupportedPlugins = plugins.filter(p => p.compatibility_status === 'unsupported')
    
    return `As a DevOps migration expert, provide 3-5 actionable recommendations for this Jenkins to GitLab CI migration:

**Project Context:**
- Type: ${projectContext.projectType || 'unknown'}
- Complexity: ${projectContext.complexityLevel || 'simple'}
- Features: ${projectContext.detectedFeatures?.join(', ') || 'none'}

**Plugin Analysis:**
- Total plugins: ${plugins.length}
- Blocking issues: ${blockingPlugins.length}
- Unsupported plugins: ${unsupportedPlugins.length}

**Blocking Plugins:** ${blockingPlugins.map(p => p.plugin_name).join(', ')}
**Unsupported Plugins:** ${unsupportedPlugins.map(p => p.plugin_name).join(', ')}

Provide specific, actionable recommendations as a JSON array of strings. Focus on:
1. Migration priority order
2. Alternative solutions for unsupported plugins
3. GitLab CI feature advantages
4. Risk mitigation strategies

Respond only with a JSON array of strings.`
  }

  /**
   * Build dry-run analysis prompt
   */
  private static buildDryRunAnalysisPrompt(dryRunResult: any, jenkinsContent: string): string {
    return `Analyze this GitLab CI dry-run result and provide actionable insights:

**Pipeline Status:** ${dryRunResult.status}
**Jobs:** ${dryRunResult.passed_jobs}/${dryRunResult.total_jobs} passed
**Failed Jobs:** ${dryRunResult.failed_jobs}

**Warnings:**
${dryRunResult.warnings?.slice(0, 5).join('\n') || 'None'}

**Error Logs (sample):**
${dryRunResult.logs?.filter((log: any) => log.status === 'failed').slice(0, 2).map((log: any) => 
  `${log.job_name}: ${log.error_message || 'No error message'}`).join('\n') || 'None'}

Provide a JSON response with:
{
  "severity": "low|medium|high",
  "key_issues": ["list of main problems"],
  "recommended_actions": ["list of specific actions"],
  "migration_readiness": "ready|needs_work|blocked"
}

Focus on practical, actionable guidance for DevOps teams.

Respond only with valid JSON.`
  }

  /**
   * Parse plugin analysis response
   */
  private static parsePluginAnalysisResponse(content: string): any {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      throw new Error('Invalid AI response format')
    }
  }

  /**
   * Parse recommendations response
   */
  private static parseRecommendationsResponse(content: string): string[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse recommendations response:', error)
      return this.getFallbackRecommendations([])
    }
  }

  /**
   * Parse dry-run analysis response
   */
  private static parseDryRunAnalysisResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Failed to parse dry-run analysis response:', error)
      return this.getFallbackDryRunAnalysis({})
    }
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(response: AIResponse, analysis: any): number {
    let confidence = 0.8 // Base confidence

    // Adjust based on response quality
    if (analysis.migration_notes && analysis.migration_notes.length > 50) {
      confidence += 0.1
    }

    if (analysis.gitlab_equivalent) {
      confidence += 0.05
    }

    if (analysis.documentation_url) {
      confidence += 0.05
    }

    // Adjust based on response time
    if (response.processingTime < 2000) {
      confidence += 0.05
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Check rate limiting
   */
  private static checkRateLimit(): boolean {
    const now = Date.now()
    
    if (now > this.rateLimitState.resetTime) {
      this.rateLimitState.requests = 0
      this.rateLimitState.resetTime = now + 60000 // 1 minute
    }

    // In tests, allow fewer requests to test rate limiting
    const maxRequests = process.env.NODE_ENV === 'test' ? 5 : this.config.rateLimitPerMinute

    if (this.rateLimitState.requests >= maxRequests) {
      return false
    }

    this.rateLimitState.requests++
    return true
  }

  /**
   * Generate cache key
   */
  private static generateCacheKey(request: AIRequest): string {
    return `ai:${request.prompt.substring(0, 100)}:${JSON.stringify(request.context || {})}`
  }

  /**
   * Get cached response
   */
  private static getCachedResponse(key: string): AIResponse | null {
    const cached = this.cache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return { ...cached.response, cached: true }
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  /**
   * Cache response
   */
  private static cacheResponse(key: string, response: AIResponse): void {
    this.cache.set(key, {
      response,
      expiry: Date.now() + this.config.cacheTTL
    })
  }

  /**
   * Get fallback plugin analysis
   */
  private static getFallbackPluginAnalysis(pluginName: string, usageContext: string): any {
    const pluginMappings: Record<string, any> = {
      'credentials-binding': {
        compatibility_status: 'compatible',
        gitlab_equivalent: 'GitLab CI/CD Variables',
        migration_notes: 'Use GitLab CI/CD variables with masking enabled. Configure in Project Settings > CI/CD > Variables.',
        is_blocking: false,
        workaround_available: true,
        documentation_url: 'https://docs.gitlab.com/ee/ci/variables/'
      },
      'docker-workflow': {
        compatibility_status: 'compatible',
        gitlab_equivalent: 'Docker executor & services',
        migration_notes: 'Use Docker images in GitLab CI. Configure docker:dind service for Docker-in-Docker builds.',
        is_blocking: false,
        workaround_available: true,
        documentation_url: 'https://docs.gitlab.com/ee/ci/docker/'
      }
    }

    const mapping = pluginMappings[pluginName] || {
      compatibility_status: 'partial',
      migration_notes: `Plugin '${pluginName}' requires manual review for GitLab CI compatibility. Check GitLab documentation for equivalent features.`,
      is_blocking: false,
      workaround_available: true,
      documentation_url: 'https://docs.gitlab.com/ee/ci/'
    }

    console.log(`🔧 Fallback analysis for '${pluginName}': ${mapping.compatibility_status}`)
    return {
      ...mapping,
      confidence: 0.6
    }
  }

  /**
   * Get fallback recommendations
   */
  private static getFallbackRecommendations(plugins: any[]): string[] {
    return [
      'Review all blocking plugins before migration',
      'Plan manual workarounds for unsupported features',
      'Consider GitLab CI native alternatives',
      'Test conversion in a staging environment first'
    ]
  }

  /**
   * Get fallback dry-run analysis
   */
  private static getFallbackDryRunAnalysis(dryRunResult: any): any {
    return {
      severity: 'medium',
      key_issues: ['Analysis unavailable - manual review recommended'],
      recommended_actions: ['Review pipeline configuration manually'],
      migration_readiness: 'needs_work',
      confidence: 0.5
    }
  }

  /**
   * Get service metrics
   */
  static getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      circuitBreakerState: this.circuitBreaker.state,
      rateLimitRemaining: Math.max(0, this.config.rateLimitPerMinute - this.rateLimitState.requests)
    }
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0
    }
  }

  /**
   * Reset service state (for testing)
   */
  static reset(): void {
    this.resetMetrics()
    this.cache.clear()
    this.rateLimitState = { requests: 0, resetTime: Date.now() }
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
      threshold: process.env.NODE_ENV === 'test' ? 3 : 5,
      timeout: process.env.NODE_ENV === 'test' ? 1000 : 60000
    }
    // Re-initialize with current environment
    this.initialize()
  }
}

// Initialize AI service
EnterpriseAIService.initialize() 