import React, { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, Info, ArrowRight, Loader2, BarChart3, Key, Shield, Brain, Zap, TrendingUp, GitBranch } from 'lucide-react'
import { ScanResult } from '@/types'
import SecretsTab from './SecretsTab'
import SmartMigrationTab from './SmartMigrationTab'

interface ResultModalProps {
  result: ScanResult
  jenkinsContent?: string
  onClose: () => void
  onViewPluginAnalysis?: () => void
  isAnalyzing?: boolean
  analysisError?: string | null
  hasPluginAnalysis?: boolean
}

const tierMeta = {
  simple: {
    colors: 'from-emerald-500 to-emerald-600',
    icon: <CheckCircle className="h-6 w-6" />,
    text: 'Simple',
  },
  medium: {
    colors: 'from-amber-500 to-amber-600',
    icon: <Info className="h-6 w-6" />,
    text: 'Medium',
  },
  complex: {
    colors: 'from-rose-500 to-rose-600',
    icon: <AlertTriangle className="h-6 w-6" />,
    text: 'Complex',
  },
} as const

export default function ResultModal({ 
  result, 
  jenkinsContent = '',
  onClose, 
  onViewPluginAnalysis,
  isAnalyzing = false,
  analysisError = null,
  hasPluginAnalysis = false
}: ResultModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'secrets' | 'smart-migration'>('overview')
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [gitlabToken, setGitlabToken] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  
  const meta = tierMeta[result.tier as keyof typeof tierMeta] ?? tierMeta.simple;
  
  const handleTokenRequest = () => {
    setShowTokenDialog(true)
  }

  const loadAIAnalysis = async () => {
    if (!jenkinsContent || aiAnalysis) return
    
    setIsLoadingAI(true)
    setAiError(null)
    
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jenkinsfile: jenkinsContent,
          scanResult: result,
          options: {
            includeConversion: true,
            includeReport: true,
            includeDashboard: true,
            includeSuggestions: true,
            reportType: 'comprehensive',
            userId: 'demo-user'
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setAiAnalysis(data.data)
      } else {
        throw new Error(data.error || 'AI analysis failed')
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to load AI analysis')
    } finally {
      setIsLoadingAI(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'smart-migration' && jenkinsContent) {
      loadAIAnalysis()
    }
  }, [activeTab, jenkinsContent])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* ✦ glowing banner */}
        <div className={`h-3 w-full bg-gradient-to-r ${meta.colors}`} />

        {/* close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={`flex items-center gap-3 rounded-full bg-gradient-to-r ${meta.colors} px-4 py-1
                          text-sm font-semibold uppercase tracking-wide text-white shadow-lg`}
            >
              {meta.icon}
              {meta.text} Complexity
            </div>

            <p className="text-base text-slate-600">
              {result.scripted ? 'Scripted' : 'Declarative'} pipeline &bull;{' '}
              {result.pluginCount} plugins &bull; {result.lineCount} lines
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('secrets')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'secrets'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Secrets
              </div>
            </button>
            <button
              onClick={() => setActiveTab('smart-migration')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'smart-migration'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <GitBranch className="w-4 h-4" />
                Smart Migration
                {isLoadingAI && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* stats grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Plugins', value: result.pluginCount },
                  { label: 'Lines', value: result.lineCount },
                  { label: 'Warnings', value: result.warnings.length },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-slate-50 px-4 py-6 shadow-sm"
                  >
                    <div className="text-3xl font-extrabold text-slate-900">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* warnings */}
              {result.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings
                  </h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    {result.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* plugin pills */}
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Detected Plugins
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(result.pluginHits ?? []).map(p => (
                    <span
                      key={p.key}
                      className={`rounded-full bg-gradient-to-r ${meta.colors}/10 px-3 py-1 text-xs font-medium text-slate-700`}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Plugin Analysis CTA */}
              <div className="space-y-4">
                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Analyzing Jenkins plugins...
                      </p>
                      <p className="text-xs text-blue-700">
                        Identifying GitLab CI/CD equivalents and migration complexity
                      </p>
                    </div>
                  </div>
                )}
                
                {analysisError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Plugin Analysis Failed
                      </p>
                      <p className="text-xs text-red-700">
                        {analysisError}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Main CTA */}
                <div className={`rounded-xl bg-gradient-to-r ${meta.colors} p-6 shadow-lg`}>
                  <div className="text-center text-white">
                    <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-90" />
                    <h3 className="text-lg font-semibold mb-2">
                      Get Detailed Migration Analysis
                    </h3>
                    <p className="text-sm opacity-90 mb-4">
                      View plugin compatibility, migration complexity, and step-by-step conversion guide
                    </p>
                    
                    {hasPluginAnalysis && onViewPluginAnalysis ? (
                      <button
                        onClick={onViewPluginAnalysis}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 
                                 backdrop-blur-sm rounded-lg font-medium transition-all
                                 hover:scale-105 active:scale-95"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Plugin Analysis
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-sm opacity-75">
                        {isAnalyzing ? 'Analysis in progress...' : 'Analysis will appear here'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'secrets' && (
            <SecretsTab 
              jenkinsContent={jenkinsContent}
              projectId={projectId}
              gitlabToken={gitlabToken}
              onTokenRequest={handleTokenRequest}
            />
          )}

          {activeTab === 'smart-migration' && (
            <SmartMigrationTab
              jenkinsContent={jenkinsContent}
              scanResult={result}
              aiAnalysis={aiAnalysis}
              onLoadAI={loadAIAnalysis}
              isLoadingAI={isLoadingAI}
              aiError={aiError}
            />
          )}
        </div>

        {/* GitLab Token Dialog */}
        {showTokenDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                GitLab Configuration
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                To check variable status, provide your GitLab project details and access token.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="12345 or username/project-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitLab Access Token
                  </label>
                  <input
                    type="password"
                    value={gitlabToken}
                    onChange={(e) => setGitlabToken(e.target.value)}
                    placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Create at: GitLab → Preferences → Access Tokens
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTokenDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowTokenDialog(false)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
