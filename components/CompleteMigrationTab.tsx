/**
 * Complete Migration Tab Component
 * Full Jenkins to GitLab migration with AI assistance and real-time progress
 */

import React, { useState, useEffect } from 'react'
import { 
  Download, 
  GitBranch, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  FileText, 
  Copy, 
  ExternalLink,
  Brain,
  Loader2,
  ArrowRight,
  Settings,
  Play
} from 'lucide-react'

interface CompleteMigrationTabProps {
  jenkinsContent: string
  scanResult: any
}

interface MigrationResult {
  gitlabYaml: string
  conversionReport: {
    totalPlugins: number
    convertedPlugins: number
    aiAssistedConversions: number
    manualReviewRequired: number
    conversionDetails: PluginConversion[]
    performanceOptimizations: string[]
    securityEnhancements: string[]
  }
  migrationInstructions: string[]
  warnings: string[]
  requiresManualReview: string[]
  estimatedEffort: string
  success: boolean
}

interface PluginConversion {
  jenkinsPlugin: string
  gitlabEquivalent: string
  conversionType: 'direct' | 'mapped' | 'complex' | 'manual'
  aiAssisted: boolean
  confidence: number
  warnings?: string[]
}

export default function CompleteMigrationTab({ jenkinsContent, scanResult }: CompleteMigrationTabProps) {
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [migrationOptions, setMigrationOptions] = useState({
    preserveStructure: true,
    optimizeForGitLab: true,
    includeDocumentation: true,
    validateOutput: true,
    useAIForComplexCases: true
  })

  const startCompleteMigration = async () => {
    if (!jenkinsContent) return

    setIsLoading(true)
    setError(null)
    setProgress(0)
    setCurrentStep('Initializing migration...')

    // Simulate progress for better UX
    const progressSteps = [
      { step: 'Analyzing pipeline structure...', progress: 15 },
      { step: 'Converting plugins with AI assistance...', progress: 35 },
      { step: 'Transforming pipeline stages...', progress: 55 },
      { step: 'Generating GitLab CI YAML...', progress: 75 },
      { step: 'Optimizing for GitLab best practices...', progress: 90 },
      { step: 'Finalizing migration...', progress: 100 }
    ]

    const progressInterval = setInterval(() => {
      const currentProgressStep = progressSteps.find(p => p.progress > progress)
      if (currentProgressStep) {
        setProgress(currentProgressStep.progress)
        setCurrentStep(currentProgressStep.step)
      }
    }, 800)

    try {
      const response = await fetch('/api/complete-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jenkinsfile: jenkinsContent,
          scanResult,
          options: migrationOptions
        })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setMigrationResult(data.data)
        setProgress(100)
        setCurrentStep('Migration completed successfully!')
      } else {
        throw new Error(data.error || 'Migration failed')
      }
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Migration Error:', err)
      setError(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadGitLabYAML = () => {
    if (!migrationResult?.gitlabYaml) return

    const blob = new Blob([migrationResult.gitlabYaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.gitlab-ci.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getConversionTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'text-green-600 bg-green-50'
      case 'mapped': return 'text-blue-600 bg-blue-50'
      case 'complex': return 'text-purple-600 bg-purple-50'
      case 'manual': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Migration Controls */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Complete Jenkins to GitLab Migration</h3>
              <p className="opacity-90">AI-powered conversion with 500+ plugin mappings</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Options
          </button>
        </div>

        {showAdvancedOptions && (
          <div className="bg-white/10 rounded-lg p-4 mb-4 space-y-3">
            <h4 className="font-medium">Migration Options</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(migrationOptions).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setMigrationOptions(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startCompleteMigration}
          disabled={isLoading || !jenkinsContent}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-gray-50 
                   disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all
                   hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Complete Migration
            </>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      {isLoading && (
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Migration in Progress</h4>
              <p className="text-sm text-gray-600">{currentStep}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{progress}% complete</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Migration Failed</p>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={startCompleteMigration}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Results */}
      {migrationResult && (
        <div className="space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="text-lg font-bold text-green-900">Migration Completed Successfully!</h4>
                <p className="text-green-700">Your Jenkins pipeline has been converted to GitLab CI/CD</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{migrationResult.conversionReport.convertedPlugins}</div>
                <div className="text-sm text-green-600">Plugins Converted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-800">{migrationResult.conversionReport.aiAssistedConversions}</div>
                <div className="text-sm text-purple-600">AI Assisted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{migrationResult.conversionReport.performanceOptimizations.length}</div>
                <div className="text-sm text-blue-600">Optimizations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-800">{migrationResult.conversionReport.manualReviewRequired}</div>
                <div className="text-sm text-amber-600">Manual Review</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadGitLabYAML}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                         text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download .gitlab-ci.yml
              </button>
              
              <button
                onClick={() => copyToClipboard(migrationResult.gitlabYaml)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 
                         text-white rounded-lg font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy YAML
              </button>
            </div>
          </div>

          {/* Plugin Conversion Details */}
          <div className="bg-white rounded-xl border p-6">
            <h4 className="text-lg font-semibold mb-4">Plugin Conversion Details</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {migrationResult.conversionReport.conversionDetails.map((conversion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{conversion.jenkinsPlugin}</div>
                      <div className="text-sm text-gray-600">→ {conversion.gitlabEquivalent}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {conversion.aiAssisted && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Brain className="w-4 h-4" />
                          <span className="text-xs">AI</span>
                        </div>
                      )}
                      
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getConversionTypeColor(conversion.conversionType)}`}>
                        {conversion.conversionType}
                      </span>
                      
                      <div className="text-xs text-gray-500">
                        {Math.round(conversion.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Optimizations */}
          {migrationResult.conversionReport.performanceOptimizations.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-4">
                <Zap className="w-5 h-5" />
                Performance Optimizations Applied
              </h4>
              <ul className="space-y-2">
                {migrationResult.conversionReport.performanceOptimizations.map((optimization, index) => (
                  <li key={index} className="flex items-start gap-2 text-blue-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{optimization}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Enhancements */}
          {migrationResult.conversionReport.securityEnhancements.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-purple-900 mb-4">
                <CheckCircle className="w-5 h-5" />
                Security Enhancements Added
              </h4>
              <ul className="space-y-2">
                {migrationResult.conversionReport.securityEnhancements.map((enhancement, index) => (
                  <li key={index} className="flex items-start gap-2 text-purple-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{enhancement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Migration Instructions */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <FileText className="w-5 h-5" />
              Next Steps
            </h4>
            <div className="space-y-3">
              {migrationResult.migrationInstructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings and Manual Review Items */}
          {(migrationResult.warnings.length > 0 || migrationResult.requiresManualReview.length > 0) && (
            <div className="bg-amber-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-amber-900 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Items Requiring Attention
              </h4>
              
              {migrationResult.warnings.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-amber-800 mb-2">Warnings:</h5>
                  <ul className="space-y-1">
                    {migrationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-amber-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {migrationResult.requiresManualReview.length > 0 && (
                <div>
                  <h5 className="font-medium text-amber-800 mb-2">Manual Review Required:</h5>
                  <ul className="space-y-1">
                    {migrationResult.requiresManualReview.map((item, index) => (
                      <li key={index} className="text-sm text-amber-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Estimated Effort */}
          <div className="bg-white border rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Estimated Migration Effort</h4>
            <p className="text-2xl font-bold text-blue-600">{migrationResult.estimatedEffort}</p>
            <p className="text-sm text-gray-600">Based on complexity analysis and team experience</p>
          </div>
        </div>
      )}

      {/* Call to Action when no results yet */}
      {!migrationResult && !isLoading && !error && (
        <div className="text-center py-12 text-gray-500">
          <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Ready to migrate your Jenkins pipeline?</p>
          <p className="text-sm">Click "Start Complete Migration" to begin the AI-powered conversion process</p>
        </div>
      )}
    </div>
  )
}