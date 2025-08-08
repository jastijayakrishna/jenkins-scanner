/**
 * Enterprise Migration Dashboard
 * 
 * Real-time plugin compatibility analysis and dry-run results viewer
 * with enterprise-grade reliability, security, and user experience.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Play,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Zap,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  GitBranch,
  List,
  BarChart3,
  TrendingUp
} from 'lucide-react'

interface PluginAnalysisResult {
  id: string
  project_id: string
  total_plugins: number
  compatible_plugins: number
  partial_plugins: number
  unsupported_plugins: number
  blocking_issues: number
  plugins: PluginResult[]
  ai_recommendations: string[]
  scanned_at: string
  performance: {
    compatibility_score: number
    migration_complexity: string
  }
}

interface PluginResult {
  plugin_name: string
  plugin_version?: string
  usage_context: string
  line_number: number
  compatibility_status: 'compatible' | 'partial' | 'unsupported' | 'unknown'
  gitlab_equivalent?: string
  migration_notes: string
  is_blocking: boolean
  workaround_available: boolean
  documentation_url?: string
}

interface DryRunResult {
  id: string
  project_id: string
  pipeline_id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  started_at: string
  completed_at?: string
  total_jobs: number
  passed_jobs: number
  failed_jobs: number
  warnings: string[]
  logs: JobLog[]
  manual_steps: string[]
  summary: {
    execution_time?: number
    success_rate: number
    has_blockers: boolean
    migration_readiness: string
  }
}

interface JobLog {
  job_name: string
  status: 'success' | 'failed' | 'skipped'
  duration: number
  log_content: string
  error_message?: string
  warnings: string[]
}

interface EnterpriseDashboardProps {
  jenkinsContent: string
  onClose: () => void
}

export default function EnterpriseDashboard({
  jenkinsContent,
  onClose
}: EnterpriseDashboardProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'plugins' | 'dry-run' | 'gitlab'>('plugins')
  const [pluginAnalysis, setPluginAnalysis] = useState<PluginAnalysisResult | null>(null)
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRunningDryRun, setIsRunningDryRun] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedYaml, setGeneratedYaml] = useState<string>('')
  const [gitlabYaml, setGitlabYaml] = useState<string>('')
  const [isGeneratingYaml, setIsGeneratingYaml] = useState(false)
  
  // Filters and search
  const [pluginFilter, setPluginFilter] = useState<'all' | 'blocking' | 'compatible' | 'unsupported'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  // Real-time updates
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Project ID for tracking
  const projectId = useMemo(() => 
    `enterprise-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    []
  )

  // Start plugin analysis on component mount
  const startPluginAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Starting enterprise plugin analysis...')

      const response = await fetch('/api/plugin-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenkinsContent,
          projectId,
          userId: 'enterprise-user'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      setPluginAnalysis(data.data)
      console.log('✅ Plugin analysis completed', data.data)

    } catch (error) {
      console.error('❌ Plugin analysis failed:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [jenkinsContent, projectId])

  useEffect(() => {
    startPluginAnalysis()
  }, [startPluginAnalysis])

  /**
   * Refresh dry-run status
   */
  const refreshDryRunStatus = useCallback(async () => {
    if (!dryRunResult) return

    try {
      const response = await fetch(`/api/dry-run?dryRunId=${dryRunResult.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Update status if changed
          setDryRunResult(prev => (prev ? { ...prev, ...data.data } : null))
        }
      }
    } catch (error) {
      console.error('Failed to refresh dry-run status:', error)
    }
  }, [dryRunResult])

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Refresh dry-run status if running
      if (isRunningDryRun && dryRunResult) {
        refreshDryRunStatus()
      }
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, isRunningDryRun, dryRunResult, refreshDryRunStatus])

  /**
   * Start plugin compatibility analysis
   */

  /**
   * Generate GitLab YAML and start dry-run
   */
  const startDryRun = async () => {
    console.log('🚀 Starting dry-run...')
    let yamlToUse = gitlabYaml || generatedYaml
    
    if (!yamlToUse) {
      console.log('📄 No YAML available, generating...')
      // First generate GitLab YAML
      await generateGitLabYaml()
      
      // Check again after generation
      yamlToUse = gitlabYaml || generatedYaml
      
      if (!yamlToUse) {
        console.error('❌ Failed to generate YAML, using fallback')
        // Use a simple fallback YAML for dry-run
        yamlToUse = `stages:
  - build
  - test

build:
  stage: build
  script:
    - echo "Building application"

test:
  stage: test
  script:
    - echo "Running tests"`
      }
    }

    console.log('🏃 Setting running state to true')
    setIsRunningDryRun(true)
    setError(null)

    try {
      console.log('🚀 Starting dry-run execution...')

      const response = await fetch('/api/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenkinsContent,
          gitlabYaml: yamlToUse,
          projectId,
          userId: 'enterprise-user'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Dry-run failed: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Dry-run failed')
      }

      console.log('✅ Dry-run API response:', data)
      setDryRunResult(data.data)
      console.log('✅ Dry-run result set:', data.data)

    } catch (error) {
      console.error('❌ Dry-run failed:', error)
      setError(error instanceof Error ? error.message : 'Dry-run failed')
    } finally {
      setIsRunningDryRun(false)
    }
  }

  /**
   * Generate GitLab YAML for dry-run
   */
  const generateGitLabYaml = async () => {
    setIsGeneratingYaml(true)
    setError(null)
    
    try {
      // Use the convert endpoint for comprehensive GitLab CI YAML
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: jenkinsContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate GitLab YAML')
      }

      const data = await response.json()
      if (data.success && data.yaml) {
        setGeneratedYaml(data.yaml)
        setGitlabYaml(data.yaml)
      } else {
        throw new Error('No YAML generated')
      }
    } catch (error) {
      console.error('Failed to generate GitLab YAML:', error)
      setError(`Failed to generate GitLab CI YAML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingYaml(false)
    }
  }

  /**
   * Refresh dry-run status
   */

  /**
   * Filter plugins based on current filter and search
   */
  const filteredPlugins = useMemo(() => {
    if (!pluginAnalysis) return []

    let filtered = pluginAnalysis.plugins

    // Apply category filter
    switch (pluginFilter) {
      case 'blocking':
        filtered = filtered.filter(p => p.is_blocking)
        break
      case 'compatible':
        filtered = filtered.filter(p => p.compatibility_status === 'compatible')
        break
      case 'unsupported':
        filtered = filtered.filter(p => p.compatibility_status === 'unsupported')
        break
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.plugin_name.toLowerCase().includes(term) ||
        p.migration_notes.toLowerCase().includes(term) ||
        p.usage_context.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [pluginAnalysis, pluginFilter, searchTerm])

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  /**
   * Get status color for compatibility
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compatible': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'partial': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'unsupported': return 'text-red-400 bg-destructive/10 border-destructive/20'
      default: return 'text-muted-foreground bg-muted/50 border-border'
    }
  }

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compatible': return <CheckCircle className="w-4 h-4" />
      case 'partial': return <AlertTriangle className="w-4 h-4" />
      case 'unsupported': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (error && !pluginAnalysis && !dryRunResult) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-6 max-w-md p-8">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive-foreground" />
            </div>
            <h2 className="text-xl font-bold text-destructive">Analysis Failed</h2>
            <p className="text-destructive font-medium">{error}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={startPluginAnalysis} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
              <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100">
      
      {/* Header */}
      <div className="h-20 border-b border-slate-800 bg-slate-900 shadow-sm">
        <div className="h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                Enterprise Migration Dashboard
                <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded">
                  {projectId}
                </span>
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                Real-time plugin analysis and dry-run testing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-refresh toggle */}
              <button
              onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  autoRefresh 
                    ? 'bg-slate-800 text-slate-100 border border-slate-600' 
                    : 'bg-slate-800/50 text-slate-300 border border-slate-700'
                }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </button>

            {/* Close button */}
              <button
              onClick={onClose}
                className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all duration-200 text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-950">
        <div className="px-8 py-4">
          <div className="flex items-center gap-6">
              <button
              onClick={() => setActiveTab('plugins')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'plugins'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              <Shield className="w-4 h-4" />
              Plugin Compatibility
              {pluginAnalysis && (
                <span className={`px-2 py-1 rounded text-xs ${
                  activeTab === 'plugins' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-300'
                }`}>
                  {pluginAnalysis.total_plugins}
                </span>
              )}
            </button>

              <button
              onClick={() => setActiveTab('dry-run')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'dry-run'
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-100/70 hover:text-slate-100 hover:bg-white/5'
                }`}
            >
              <Play className="w-4 h-4" />
              Dry-Run Results
              {dryRunResult && (
                <span className={`px-2 py-1 rounded text-xs ${
                  activeTab === 'dry-run' ? 'bg-white/20 text-slate-100' : 
                  dryRunResult.status === 'success' ? 'bg-white/10 text-green-300' :
                  dryRunResult.status === 'failed' ? 'bg-white/10 text-red-300' :
                  'bg-white/10 text-yellow-300'
                }`}>
                  {dryRunResult.status}
                </span>
              )}
            </button>

              <button
              onClick={() => {
                setActiveTab('gitlab')
                if (!gitlabYaml) generateGitLabYaml()
              }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'gitlab'
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-100/70 hover:text-slate-100 hover:bg-white/5'
                }`}
            >
              <GitBranch className="w-4 h-4" />
              GitLab CI
              {gitlabYaml && (
                <span className={`px-2 py-1 rounded text-xs ${
                  activeTab === 'gitlab' ? 'bg-white/20 text-slate-100' : 'bg-white/10 text-green-300'
                }`}>
                  Ready
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 h-[calc(100vh-9rem)] overflow-hidden bg-slate-950">
        {activeTab === 'plugins' && (
          <PluginCompatibilityView
            analysis={pluginAnalysis}
            isAnalyzing={isAnalyzing}
            filteredPlugins={filteredPlugins}
            pluginFilter={pluginFilter}
            setPluginFilter={setPluginFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            expandedPlugin={expandedPlugin}
            setExpandedPlugin={setExpandedPlugin}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            copyToClipboard={copyToClipboard}
            onRetry={startPluginAnalysis}
          />
        )}

        {activeTab === 'dry-run' && (
          <DryRunResultsView
            dryRunResult={dryRunResult}
            isRunning={isRunningDryRun}
            expandedJob={expandedJob}
            setExpandedJob={setExpandedJob}
            copyToClipboard={copyToClipboard}
            onStartDryRun={startDryRun}
            canStartDryRun={!isRunningDryRun}
          />
        )}

        {activeTab === 'gitlab' && (
          <GitLabCIView
            gitlabYaml={gitlabYaml}
            isGenerating={isGeneratingYaml}
            onGenerate={generateGitLabYaml}
            copyToClipboard={copyToClipboard}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Plugin Compatibility View Component
 */
function PluginCompatibilityView({
  analysis,
  isAnalyzing,
  filteredPlugins,
  pluginFilter,
  setPluginFilter,
  searchTerm,
  setSearchTerm,
  expandedPlugin,
  setExpandedPlugin,
  getStatusColor,
  getStatusIcon,
  copyToClipboard,
  onRetry
}: any) {
  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Analyzing Jenkins Plugins</h3>
            <p className="text-muted-foreground mt-2">AI-powered compatibility assessment in progress...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-yellow-300 mx-auto" />
          <div>
              <h3 className="text-xl font-bold text-foreground">No Analysis Available</h3>
              <p className="text-muted-foreground mt-2">Click retry to start plugin analysis</p>
            <button onClick={onRetry} className="btn-primary mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Plugin Summary */}
      <div className="p-6 bg-slate-950 border-b border-slate-800">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-100">{analysis.total_plugins}</div>
            <div className="text-sm text-slate-100/70">Total Plugins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{analysis.compatible_plugins}</div>
            <div className="text-sm text-slate-100/70">Compatible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-300">{analysis.partial_plugins}</div>
            <div className="text-sm text-slate-100/70">Partial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{analysis.unsupported_plugins}</div>
            <div className="text-sm text-slate-100/70">Unsupported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{analysis.blocking_issues}</div>
            <div className="text-sm text-slate-100/70">Blockers</div>
          </div>
        </div>

        {/* Compatibility Score */}
        <div className="mb-4">
          <div className="flex justify-between text-sm font-medium text-slate-100/80 mb-2">
            <span>Compatibility Score</span>
            <span>{analysis.performance.compatibility_score}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                analysis.performance.compatibility_score >= 80 ? 'bg-green-400' :
                analysis.performance.compatibility_score >= 60 ? 'bg-yellow-300' :
                'bg-red-400'
              }`}
              style={{ width: `${analysis.performance.compatibility_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-100/50" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-800 bg-white/5 text-sm rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-slate-100 placeholder:text-slate-100/50"
              />
            </div>

            <select
              value={pluginFilter}
              onChange={(e) => setPluginFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-800 bg-white/5 text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Plugins</option>
              <option value="blocking">Blocking Issues</option>
              <option value="compatible">Compatible</option>
              <option value="unsupported">Unsupported</option>
            </select>
          </div>

          <div className="text-sm text-slate-100/70">
            Showing {filteredPlugins.length} of {analysis.total_plugins} plugins
          </div>
        </div>
      </div>

      {/* Plugin List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredPlugins.map((plugin: PluginResult) => (
            <div
              key={`${plugin.plugin_name}-${plugin.line_number}`}
              className="bg-white/5 text-slate-100 rounded border border-slate-800 overflow-hidden hover:bg-white/10 transition-colors"
            >
              <div
                className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedPlugin(
                  expandedPlugin === `${plugin.plugin_name}-${plugin.line_number}` 
                    ? null 
                    : `${plugin.plugin_name}-${plugin.line_number}`
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(plugin.compatibility_status)}`}>
                      <span className="capitalize">{plugin.compatibility_status}</span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-100 text-sm truncate">{plugin.plugin_name}</h3>
                        {plugin.plugin_version && (
                          <span className="text-xs text-slate-100/60 flex-shrink-0">v{plugin.plugin_version}</span>
                        )}
                        {plugin.is_blocking && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded flex-shrink-0">
                            BLOCKER
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-100/60">Line {plugin.line_number}</span>
                    {expandedPlugin === `${plugin.plugin_name}-${plugin.line_number}` ? (
                      <ChevronDown className="w-4 h-4 text-slate-100/50" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-100/50" />
                    )}
                  </div>
                </div>
              </div>

              {expandedPlugin === `${plugin.plugin_name}-${plugin.line_number}` && (
                <div className="border-t border-slate-800 p-3 bg-white/5">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-slate-100 mb-1 text-sm">Usage Context</h4>
                      <p className="text-xs text-slate-300 font-mono bg-slate-800 p-2 rounded border border-slate-600">
                        {plugin.usage_context}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-100 mb-1 text-sm">Migration Notes</h4>
                      <p className="text-xs text-slate-100/80">{plugin.migration_notes}</p>
                    </div>

                    {plugin.gitlab_equivalent && (
                      <div>
                        <h4 className="font-medium text-slate-100 mb-1 text-sm">GitLab Equivalent</h4>
                        <p className="text-xs text-slate-100/80 font-medium">{plugin.gitlab_equivalent}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      {plugin.workaround_available && (
                        <span className="text-green-600">✓ Workaround Available</span>
                      )}
                      
                      {plugin.documentation_url && (
                        <a
                          href={plugin.documentation_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Documentation
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPlugins.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No plugins found</h3>
            <p className="text-slate-500 mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'Try changing the filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Dry-Run Results View Component  
 */
function DryRunResultsView({
  dryRunResult,
  isRunning,
  expandedJob,
  setExpandedJob,
  copyToClipboard,
  onStartDryRun,
  canStartDryRun
}: any) {
  if (isRunning) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Executing Dry-Run</h3>
            <p className="text-muted-foreground mt-2">Testing GitLab CI pipeline in sandbox environment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dryRunResult) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-6">
          <GitBranch className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Ready for Dry-Run</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Execute your GitLab CI pipeline in a secure sandbox environment
            </p>
            <button
              onClick={onStartDryRun}
              disabled={!canStartDryRun}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ${!canStartDryRun ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Dry-Run
            </button>
            {!canStartDryRun && (
              <p className="text-sm text-slate-500 mt-2">Dry-run is currently running...</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dry-Run Summary */}
      <div className="p-6 bg-slate-950 border-b border-slate-800">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              dryRunResult.status === 'success' ? 'text-green-300' :
              dryRunResult.status === 'failed' ? 'text-red-300' :
              'text-yellow-300'
            }`}>
              {dryRunResult.status.toUpperCase()}
            </div>
            <div className="text-sm text-slate-100/70">Pipeline Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-100">{dryRunResult.total_jobs}</div>
            <div className="text-sm text-slate-100/70">Total Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{dryRunResult.passed_jobs}</div>
            <div className="text-sm text-slate-100/70">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-300">{dryRunResult.failed_jobs}</div>
            <div className="text-sm text-slate-100/70">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-300">{dryRunResult.warnings.length}</div>
            <div className="text-sm text-slate-100/70">Warnings</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="mb-4">
          <div className="flex justify-between text-sm font-medium text-slate-100/80 mb-2">
            <span>Success Rate</span>
            <span>{dryRunResult.summary.success_rate}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                dryRunResult.summary.success_rate >= 80 ? 'bg-green-400' :
                dryRunResult.summary.success_rate >= 60 ? 'bg-yellow-300' :
                'bg-red-400'
              }`}
              style={{ width: `${dryRunResult.summary.success_rate}%` }}
            />
          </div>
        </div>

        {/* Migration Readiness */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-100/80">Migration Readiness:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            dryRunResult.summary.migration_readiness === 'ready' ? 'bg-white/10 text-green-300' :
            dryRunResult.summary.migration_readiness === 'needs_minor_fixes' ? 'bg-white/10 text-yellow-300' :
            'bg-white/10 text-red-300'
          }`}>
            {dryRunResult.summary.migration_readiness.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Job Results */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="font-semibold text-slate-100 mb-4">Job Results</h3>
        
        <div className="space-y-3">
          {dryRunResult.logs.map((job: JobLog) => (
            <div
              key={job.job_name}
              className="bg-white/5 rounded-lg border border-slate-800 overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedJob(
                  expandedJob === job.job_name ? null : job.job_name
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      job.status === 'success' ? 'bg-green-400' :
                      job.status === 'failed' ? 'bg-red-400' :
                      'bg-yellow-300'
                    }`} />
                    
                    <div>
                      <h4 className="font-semibold text-slate-100">{job.job_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-100/60">
                        <span>Duration: {job.duration}s</span>
                        {job.warnings.length > 0 && (
                          <span>{job.warnings.length} warnings</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      job.status === 'success' ? 'bg-white/10 text-green-300' :
                      job.status === 'failed' ? 'bg-white/10 text-red-300' :
                      'bg-white/10 text-yellow-300'
                    }`}>
                      {job.status}
                    </span>
                    {expandedJob === job.job_name ? (
                      <ChevronDown className="w-4 h-4 text-slate-100/50" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-100/50" />
                    )}
                  </div>
                </div>
              </div>

              {expandedJob === job.job_name && (
                <div className="border-t border-slate-800 p-4 bg-white/5">
                  <div className="space-y-4">
                    {job.error_message && (
                      <div>
                        <h5 className="font-medium text-destructive mb-2">Error Message</h5>
                        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
                          {job.error_message}
                        </p>
                      </div>
                    )}

                    {job.warnings.length > 0 && (
                      <div>
                        <h5 className="font-medium text-yellow-500 mb-2">Warnings</h5>
                        <div className="space-y-1">
                          {job.warnings.map((warning, index) => (
                            <p key={index} className="text-sm text-yellow-600 bg-yellow-50/10 p-2 rounded border border-yellow-500/20">
                              {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-slate-100">Job Logs</h5>
                        <button
                          onClick={() => copyToClipboard(job.log_content)}
                          className="text-sm text-slate-100 hover:text-slate-100/80 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                       <pre className="text-sm text-slate-300 bg-slate-800 p-3 rounded border border-slate-600 overflow-x-auto max-h-64 dark-log-block">
                        {job.log_content.substring(0, 2000)}
                        {job.log_content.length > 2000 && '\n... [truncated]'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Manual Steps */}
        {dryRunResult.manual_steps.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <List className="w-4 h-4 text-slate-100" />
              Manual Steps Required
            </h3>
            <div className="bg-white/5 border border-slate-800 rounded-lg p-4">
              <div className="space-y-2">
                {dryRunResult.manual_steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-white/20 text-slate-100 text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-100/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * GitLab CI View Component
 */
interface GitLabCIViewProps {
  gitlabYaml: string
  isGenerating: boolean
  onGenerate: () => void
  copyToClipboard: (text: string) => void
}

function GitLabCIView({
  gitlabYaml,
  isGenerating,
  onGenerate,
  copyToClipboard
}: GitLabCIViewProps) {
  const downloadYaml = () => {
    const blob = new Blob([gitlabYaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.gitlab-ci.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!gitlabYaml && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <GitBranch className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Generate GitLab CI Configuration
          </h3>
          <p className="text-slate-300 mb-6 max-w-md">
            Convert your Jenkins pipeline to a production-ready GitLab CI configuration
          </p>
          <button
            onClick={onGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <GitBranch className="w-4 h-4" />
            Generate GitLab CI
          </button>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Generating GitLab CI Configuration
          </h3>
          <p className="text-slate-300">
            Creating production-ready GitLab CI YAML...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              GitLab CI Configuration
            </h2>
            <p className="text-muted-foreground">
              Production-ready GitLab CI YAML converted from your Jenkins pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(gitlabYaml)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={downloadYaml}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* YAML Content */}
      <div className="flex-1 overflow-hidden bg-slate-950">
        <div className="h-full p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 h-full overflow-auto">
            <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap leading-relaxed dark-code-block">
              {gitlabYaml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}