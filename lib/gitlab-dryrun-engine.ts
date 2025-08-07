/**
 * GitLab Dry-Run Engine
 * 
 * Enterprise-grade dry-run testing system for GitLab CI pipelines
 * with real-time monitoring, comprehensive logging, and AI-powered analysis.
 */

import { DryRunResult, DryRunStatus, JobLog, DatabaseService } from './database'

interface GitLabProject {
  id: string
  name: string
  namespace: string
  webUrl: string
  defaultBranch: string
}

interface GitLabPipeline {
  id: number
  status: string
  ref: string
  sha: string
  webUrl: string
  createdAt: string
  updatedAt: string
  duration: number
}

interface GitLabJob {
  id: number
  name: string
  status: string
  stage: string
  createdAt: string
  startedAt?: string
  finishedAt?: string
  duration?: number
  webUrl: string
  allowFailure: boolean
}

/**
 * Enterprise GitLab Dry-Run Engine
 * Manages sandbox environments and comprehensive pipeline testing
 */
export class GitLabDryRunEngine {
  private static readonly GITLAB_API_BASE = process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4'
  private static readonly GITLAB_TOKEN = process.env.GITLAB_TOKEN || ''
  private static readonly SANDBOX_NAMESPACE = process.env.GITLAB_SANDBOX_NAMESPACE || 'migration-sandbox'
  
  /**
   * Execute dry-run for Jenkins to GitLab CI migration
   */
  static async executeDryRun(
    jenkinsContent: string,
    gitlabYaml: string,
    projectId: string,
    userId: string
  ): Promise<DryRunResult> {
    console.log(`🚀 Starting dry-run for project ${projectId}`)
    
    // Check if GitLab API is configured
    const hasGitLabConfig = process.env.GITLAB_TOKEN && process.env.GITLAB_SANDBOX_NAMESPACE
    
    if (!hasGitLabConfig) {
      console.log('⚠️ GitLab API not configured, running simulation mode')
      return this.simulateDryRun(jenkinsContent, gitlabYaml, projectId, userId)
    }
    
    try {
      // Create or update sandbox project
      const sandboxProject = await this.setupSandboxProject(projectId)
      
      // Deploy GitLab CI configuration
      await this.deployGitLabConfig(sandboxProject.id, gitlabYaml)
      
      // Trigger pipeline
      const pipeline = await this.triggerPipeline(sandboxProject.id)
      
      // Initialize dry-run result
      const dryRunResult: DryRunResult = {
        id: '', // Will be set by database
        project_id: projectId,
        pipeline_id: pipeline.id.toString(),
        jenkins_content: jenkinsContent,
        gitlab_yaml: gitlabYaml,
        status: DryRunStatus.RUNNING,
        started_at: new Date(),
        total_jobs: 0,
        passed_jobs: 0,
        failed_jobs: 0,
        warnings: [],
        logs: [],
        manual_steps: [],
        created_by: userId
      }
      
      // Save initial result
      const dryRunId = await DatabaseService.saveDryRunResult(dryRunResult)
      dryRunResult.id = dryRunId
      
      // Monitor pipeline execution
      const finalResult = await this.monitorPipelineExecution(dryRunResult, sandboxProject.id, pipeline.id)
      
      // Analyze results with AI
      await this.enhanceResultsWithAI(finalResult)
      
      // Log audit trail
      await DatabaseService.logAuditTrail(
        'dry_run_execution',
        'dry_run_result',
        dryRunId,
        userId,
        {
          pipeline_id: pipeline.id,
          status: finalResult.status,
          duration: finalResult.completed_at ? 
            finalResult.completed_at.getTime() - finalResult.started_at.getTime() : null
        }
      )
      
      return finalResult
      
    } catch (error) {
      console.error('❌ Dry-run execution failed:', error)
      
      // Return failed result
      const failedResult: DryRunResult = {
        id: '', // Will be set by database
        project_id: projectId,
        pipeline_id: '',
        jenkins_content: jenkinsContent,
        gitlab_yaml: gitlabYaml,
        status: DryRunStatus.FAILED,
        started_at: new Date(),
        completed_at: new Date(),
        total_jobs: 0,
        passed_jobs: 0,
        failed_jobs: 0,
        warnings: [`Dry-run setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        logs: [],
        manual_steps: ['Review and fix GitLab CI configuration', 'Ensure proper GitLab permissions'],
        created_by: userId
      }
      
      const dryRunId = await DatabaseService.saveDryRunResult(failedResult)
      failedResult.id = dryRunId
      
      return failedResult
    }
  }
  
  /**
   * Setup sandbox GitLab project for testing
   */
  private static async setupSandboxProject(projectId: string): Promise<GitLabProject> {
    const projectName = `migration-test-${projectId.substring(0, 8)}`
    
    try {
      // Check if sandbox project exists
      const existingProject = await this.getProject(`${this.SANDBOX_NAMESPACE}/${projectName}`)
      if (existingProject) {
        console.log(`♻️ Using existing sandbox project: ${existingProject.name}`)
        return existingProject
      }
    } catch (error) {
      // Project doesn't exist, create new one
    }
    
    // Create new sandbox project
    console.log(`🏗️ Creating sandbox project: ${projectName}`)
    const createResponse = await fetch(`${this.GITLAB_API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.GITLAB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectName,
        namespace_id: await this.getNamespaceId(this.SANDBOX_NAMESPACE),
        description: `Migration testing sandbox for project ${projectId}`,
        visibility: 'private',
        issues_enabled: false,
        merge_requests_enabled: false,
        wiki_enabled: false,
        snippets_enabled: false,
        builds_enabled: true,
        initialize_with_readme: true
      })
    })
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create sandbox project: ${createResponse.status}`)
    }
    
    const project = await createResponse.json()
    return {
      id: project.id.toString(),
      name: project.name,
      namespace: project.namespace.full_path,
      webUrl: project.web_url,
      defaultBranch: project.default_branch || 'main'
    }
  }
  
  /**
   * Deploy GitLab CI configuration to sandbox project
   */
  private static async deployGitLabConfig(projectId: string, gitlabYaml: string): Promise<void> {
    console.log(`📝 Deploying GitLab CI config to project ${projectId}`)
    
    // Create or update .gitlab-ci.yml file
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/repository/files/.gitlab-ci.yml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.GITLAB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        branch: 'main',
        content: gitlabYaml,
        commit_message: 'Add GitLab CI configuration for migration testing',
        encoding: 'text'
      })
    })
    
    if (!response.ok) {
      // Try to update existing file
      const updateResponse = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/repository/files/.gitlab-ci.yml`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.GITLAB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branch: 'main',
          content: gitlabYaml,
          commit_message: 'Update GitLab CI configuration for migration testing',
          encoding: 'text'
        })
      })
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to deploy GitLab CI config: ${updateResponse.status}`)
      }
    }
  }
  
  /**
   * Trigger pipeline in sandbox project
   */
  private static async triggerPipeline(projectId: string): Promise<GitLabPipeline> {
    console.log(`▶️ Triggering pipeline for project ${projectId}`)
    
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.GITLAB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main'
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to trigger pipeline: ${response.status}`)
    }
    
    const pipeline = await response.json()
    return {
      id: pipeline.id,
      status: pipeline.status,
      ref: pipeline.ref,
      sha: pipeline.sha,
      webUrl: pipeline.web_url,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      duration: pipeline.duration || 0
    }
  }
  
  /**
   * Monitor pipeline execution with real-time updates
   */
  private static async monitorPipelineExecution(
    dryRunResult: DryRunResult,
    projectId: string,
    pipelineId: number
  ): Promise<DryRunResult> {
    const maxWaitTime = 30 * 60 * 1000 // 30 minutes
    const pollInterval = 10 * 1000 // 10 seconds
    const startTime = Date.now()
    
    console.log(`👀 Monitoring pipeline ${pipelineId} execution`)
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Get pipeline status
        const pipeline = await this.getPipeline(projectId, pipelineId)
        
        if (['success', 'failed', 'canceled', 'skipped'].includes(pipeline.status)) {
          // Pipeline completed, get final results
          return await this.collectFinalResults(dryRunResult, projectId, pipelineId, pipeline)
        }
        
        // Pipeline still running, wait and poll again
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
      } catch (error) {
        console.error('Pipeline monitoring error:', error)
        
        // Return current state with error
        dryRunResult.status = DryRunStatus.FAILED
        dryRunResult.completed_at = new Date()
        dryRunResult.warnings.push(`Pipeline monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return dryRunResult
      }
    }
    
    // Timeout reached
    dryRunResult.status = DryRunStatus.FAILED
    dryRunResult.completed_at = new Date()
    dryRunResult.warnings.push('Pipeline execution timeout (30 minutes exceeded)')
    return dryRunResult
  }
  
  /**
   * Collect final pipeline results and logs
   */
  private static async collectFinalResults(
    dryRunResult: DryRunResult,
    projectId: string,
    pipelineId: number,
    pipeline: GitLabPipeline
  ): Promise<DryRunResult> {
    console.log(`📊 Collecting final results for pipeline ${pipelineId}`)
    
    // Get all jobs in the pipeline
    const jobs = await this.getPipelineJobs(projectId, pipelineId)
    
    let passedJobs = 0
    let failedJobs = 0
    const jobLogs: JobLog[] = []
    const warnings: string[] = []
    const manualSteps: string[] = []
    
    for (const job of jobs) {
      // Get job trace (logs)
      const jobTrace = await this.getJobTrace(projectId, job.id)
      
      const jobLog: JobLog = {
        job_name: job.name,
        status: job.status as 'success' | 'failed' | 'skipped',
        duration: job.duration || 0,
        log_content: jobTrace.content,
        error_message: jobTrace.error,
        warnings: jobTrace.warnings
      }
      
      jobLogs.push(jobLog)
      
      // Count job results
      if (job.status === 'success') {
        passedJobs++
      } else if (job.status === 'failed') {
        failedJobs++
        if (jobTrace.error) {
          warnings.push(`Job ${job.name} failed: ${jobTrace.error}`)
        }
      }
      
      // Collect warnings and manual steps
      warnings.push(...jobTrace.warnings)
      if (jobTrace.manualSteps) {
        manualSteps.push(...jobTrace.manualSteps)
      }
    }
    
    // Update dry-run result
    dryRunResult.status = pipeline.status === 'success' ? DryRunStatus.SUCCESS : DryRunStatus.FAILED
    dryRunResult.completed_at = new Date()
    dryRunResult.total_jobs = jobs.length
    dryRunResult.passed_jobs = passedJobs
    dryRunResult.failed_jobs = failedJobs
    dryRunResult.warnings = [...dryRunResult.warnings, ...warnings]
    dryRunResult.logs = jobLogs
    dryRunResult.manual_steps = [...dryRunResult.manual_steps, ...manualSteps]
    
    return dryRunResult
  }
  
  /**
   * Enhance results with AI analysis
   */
  private static async enhanceResultsWithAI(dryRunResult: DryRunResult): Promise<void> {
    const aiPrompt = `Analyze this GitLab CI dry-run result and provide actionable insights:

**Pipeline Status:** ${dryRunResult.status}
**Jobs:** ${dryRunResult.passed_jobs}/${dryRunResult.total_jobs} passed
**Failed Jobs:** ${dryRunResult.failed_jobs}

**Warnings:**
${dryRunResult.warnings.slice(0, 5).join('\n')}

**Error Logs (sample):**
${dryRunResult.logs.filter(log => log.status === 'failed').slice(0, 2).map(log => 
  `${log.job_name}: ${log.error_message || 'No error message'}`).join('\n')}

Provide a JSON response with:
{
  "severity": "low|medium|high",
  "key_issues": ["list of main problems"],
  "recommended_actions": ["list of specific actions"],
  "migration_readiness": "ready|needs_work|blocked"
}

Focus on practical, actionable guidance for DevOps teams.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: aiPrompt
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`)
      }

      const data = await response.json()
      const aiAnalysis = JSON.parse(data.content[0].text)
      
      // Add AI insights to manual steps
      dryRunResult.manual_steps.push(
        '--- AI Analysis ---',
        `Migration Readiness: ${aiAnalysis.migration_readiness}`,
        `Severity: ${aiAnalysis.severity}`,
        ...aiAnalysis.key_issues.map((issue: string) => `⚠️ ${issue}`),
        ...aiAnalysis.recommended_actions.map((action: string) => `✅ ${action}`)
      )
      
    } catch (error) {
      console.error('AI analysis failed:', error)
      dryRunResult.manual_steps.push(
        '--- Analysis Note ---',
        'AI-powered analysis unavailable - manual review recommended'
      )
    }
  }
  
  /**
   * Helper: Get GitLab project by path
   */
  private static async getProject(projectPath: string): Promise<GitLabProject | null> {
    const encodedPath = encodeURIComponent(projectPath)
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${encodedPath}`, {
      headers: { 'Authorization': `Bearer ${this.GITLAB_TOKEN}` }
    })
    
    if (!response.ok) return null
    
    const project = await response.json()
    return {
      id: project.id.toString(),
      name: project.name,
      namespace: project.namespace.full_path,
      webUrl: project.web_url,
      defaultBranch: project.default_branch
    }
  }
  
  /**
   * Helper: Get namespace ID by path
   */
  private static async getNamespaceId(namespacePath: string): Promise<number> {
    const response = await fetch(`${this.GITLAB_API_BASE}/namespaces?search=${namespacePath}`, {
      headers: { 'Authorization': `Bearer ${this.GITLAB_TOKEN}` }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get namespace: ${response.status}`)
    }
    
    const namespaces = await response.json()
    const namespace = namespaces.find((ns: any) => ns.full_path === namespacePath)
    
    if (!namespace) {
      throw new Error(`Namespace not found: ${namespacePath}`)
    }
    
    return namespace.id
  }
  
  /**
   * Helper: Get pipeline details
   */
  private static async getPipeline(projectId: string, pipelineId: number): Promise<GitLabPipeline> {
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/pipelines/${pipelineId}`, {
      headers: { 'Authorization': `Bearer ${this.GITLAB_TOKEN}` }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get pipeline: ${response.status}`)
    }
    
    const pipeline = await response.json()
    return {
      id: pipeline.id,
      status: pipeline.status,
      ref: pipeline.ref,
      sha: pipeline.sha,
      webUrl: pipeline.web_url,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      duration: pipeline.duration || 0
    }
  }
  
  /**
   * Helper: Get pipeline jobs
   */
  private static async getPipelineJobs(projectId: string, pipelineId: number): Promise<GitLabJob[]> {
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/pipelines/${pipelineId}/jobs`, {
      headers: { 'Authorization': `Bearer ${this.GITLAB_TOKEN}` }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get pipeline jobs: ${response.status}`)
    }
    
    const jobs = await response.json()
    return jobs.map((job: any) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      stage: job.stage,
      createdAt: job.created_at,
      startedAt: job.started_at,
      finishedAt: job.finished_at,
      duration: job.duration,
      webUrl: job.web_url,
      allowFailure: job.allow_failure
    }))
  }
  
  /**
   * Helper: Get job trace with enhanced parsing
   */
  private static async getJobTrace(projectId: string, jobId: number): Promise<{
    content: string
    error?: string
    warnings: string[]
    manualSteps?: string[]
  }> {
    const response = await fetch(`${this.GITLAB_API_BASE}/projects/${projectId}/jobs/${jobId}/trace`, {
      headers: { 'Authorization': `Bearer ${this.GITLAB_TOKEN}` }
    })
    
    if (!response.ok) {
      return {
        content: 'Failed to fetch job trace',
        error: `HTTP ${response.status}`,
        warnings: ['Unable to retrieve job logs']
      }
    }
    
    const traceContent = await response.text()
    
    // Parse trace for errors and warnings
    const lines = traceContent.split('\n')
    const warnings: string[] = []
    const manualSteps: string[] = []
    let error: string | undefined
    
    for (const line of lines) {
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim() // Remove ANSI codes
      
      if (/ERROR|FAILED|FATAL/i.test(cleanLine) && !error) {
        error = cleanLine.substring(0, 200) + (cleanLine.length > 200 ? '...' : '')
      }
      
      if (/WARNING|WARN/i.test(cleanLine)) {
        warnings.push(cleanLine.substring(0, 150))
      }
      
      if (/TODO|FIXME|MANUAL/i.test(cleanLine)) {
        manualSteps.push(cleanLine)
      }
    }
    
    return {
      content: traceContent.length > 50000 ? traceContent.substring(0, 50000) + '\n... [truncated]' : traceContent,
      error,
      warnings: warnings.slice(0, 10), // Limit warnings
      manualSteps: manualSteps.slice(0, 5) // Limit manual steps
    }
  }

  /**
   * Simulate dry-run execution for development when GitLab API is not configured
   */
  private static async simulateDryRun(
    jenkinsContent: string,
    gitlabYaml: string,
    projectId: string,
    userId: string
  ): Promise<DryRunResult> {
    console.log('🧪 Running dry-run simulation')
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Analyze YAML to generate realistic simulation results
    const jobs = this.extractJobsFromYaml(gitlabYaml)
    const totalJobs = jobs.length
    const passedJobs = Math.max(1, Math.floor(totalJobs * 0.8)) // 80% pass rate
    const failedJobs = totalJobs - passedJobs
    
    const dryRunResult: DryRunResult = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      project_id: projectId,
      pipeline_id: `pipeline_${Date.now()}`,
      jenkins_content: jenkinsContent,
      gitlab_yaml: gitlabYaml,
      status: failedJobs === 0 ? DryRunStatus.SUCCESS : DryRunStatus.FAILED,
      started_at: new Date(),
      completed_at: new Date(Date.now() + 30000), // 30 seconds duration
      total_jobs: totalJobs,
      passed_jobs: passedJobs,
      failed_jobs: failedJobs,
      warnings: [
        'Simulation mode: GitLab API not configured',
        'Results are simulated for demonstration purposes',
        ...(failedJobs > 0 ? ['Some jobs failed - review configuration'] : [])
      ],
      logs: jobs.map((job, index) => ({
        job_name: job,
        status: (index < passedJobs ? 'success' : 'failed') as 'success' | 'failed' | 'skipped',
        duration: 3.0,
        log_content: index < passedJobs 
          ? `✅ Job '${job}' completed successfully\nAll tests passed\nArtifacts created`
          : `❌ Job '${job}' failed\nBuild failed with exit code 1\nCheck configuration and dependencies`,
        error_message: index < passedJobs ? undefined : 'Build failed with exit code 1',
        warnings: index < passedJobs ? [] : ['Configuration may need updates', 'Check environment variables']
      })),
      manual_steps: failedJobs > 0 ? [
        'Review failed job configurations',
        'Update environment variables and secrets',
        'Test locally before re-running'
      ] : [
        'Pipeline ready for production deployment',
        'Configure production environment variables'
      ],
      created_by: userId
    }
    
    // Save to in-memory storage
    const dryRunId = await DatabaseService.saveDryRunResult(dryRunResult)
    dryRunResult.id = dryRunId
    
    console.log(`✅ Simulation completed: ${passedJobs}/${totalJobs} jobs passed`)
    return dryRunResult
  }

  /**
   * Extract job names from GitLab YAML for simulation
   */
  private static extractJobsFromYaml(yamlContent: string): string[] {
    const jobs: string[] = []
    const lines = yamlContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Look for job definitions (lines that end with : and aren't stage definitions or variables)
      if (trimmed.endsWith(':') && 
          !trimmed.startsWith('#') &&
          !trimmed.includes('stage') &&
          !trimmed.includes('variables') &&
          !trimmed.includes('include') &&
          trimmed.length > 1) {
        const jobName = trimmed.slice(0, -1).trim()
        if (!['stages', 'variables', 'include', 'cache', 'artifacts', 'script', 'before_script', 'after_script'].includes(jobName)) {
          jobs.push(jobName)
        }
      }
    }
    
    // Default jobs if none found
    if (jobs.length === 0) {
      return ['validate:pipeline', 'build:application', 'test:unit', 'deploy:staging']
    }
    
    return jobs.slice(0, 8) // Limit to 8 jobs for simulation
  }

  /**
   * Guess the stage from job name for simulation
   */
  private static guessStageFromJobName(jobName: string): string {
    if (jobName.includes('build')) return 'build'
    if (jobName.includes('test')) return 'test'
    if (jobName.includes('deploy')) return 'deploy'
    if (jobName.includes('validate')) return 'validate'
    if (jobName.includes('package')) return 'package'
    if (jobName.includes('analyze')) return 'analyze'
    return 'build' // default
  }
}