/**
 * Smart Migration Tab - Unified AI-powered migration with analysis and conversion
 * Combines AI analysis, plugin intelligence, and complete migration in one interface
 */

import React, { useState } from 'react'
import { 
  Download, 
  GitBranch, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Copy, 
  Play,
  Brain,
  Loader2,
  TrendingUp,
  Shield,
  Settings,
  BarChart3
} from 'lucide-react'

interface SmartMigrationTabProps {
  jenkinsContent: string
  scanResult: any
  aiAnalysis?: any
  onLoadAI: () => void
  isLoadingAI: boolean
  aiError: string | null
}

export default function SmartMigrationTab({ 
  jenkinsContent, 
  scanResult, 
  aiAnalysis, 
  onLoadAI, 
  isLoadingAI, 
  aiError 
}: SmartMigrationTabProps) {
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationError, setMigrationError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [migrationOptions, setMigrationOptions] = useState({
    targetComplexity: 'balanced' as 'simple' | 'balanced' | 'advanced',
    optimizeForSpeed: true,
    includeSecurityScanning: true,
    enableParallelization: true,
    generateDocumentation: true
  })

  const startSmartMigration = async () => {
    if (!jenkinsContent) return

    setIsMigrating(true)
    setMigrationError(null)
    setProgress(0)

    const progressSteps = [
      { step: 'AI analyzing pipeline complexity...', progress: 20 },
      { step: 'Smart plugin conversion in progress...', progress: 40 },
      { step: 'Optimizing pipeline structure...', progress: 60 },
      { step: 'Applying security enhancements...', progress: 80 },
      { step: 'Finalizing intelligent migration...', progress: 100 }
    ]

    const progressInterval = setInterval(() => {
      const currentProgressStep = progressSteps.find(p => p.progress > progress)
      if (currentProgressStep) {
        setProgress(currentProgressStep.progress)
        setCurrentStep(currentProgressStep.step)
      }
    }, 1000)

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
        setCurrentStep('Smart migration completed successfully!')
      } else {
        throw new Error(data.error || 'Migration failed')
      }
    } catch (err) {
      clearInterval(progressInterval)
      console.error('Migration Error:', err)
      setMigrationError(err instanceof Error ? err.message : 'Migration failed')
    } finally {
      setIsMigrating(false)
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

  return (
    <div className="space-y-6">
      {/* Smart Migration Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <GitBranch className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">AI-Powered Smart Migration</h3>
            <p className="opacity-90">Intelligent analysis + Complete conversion in one unified system</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center bg-white/20 rounded-lg p-3">
            <Brain className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">AI Analysis</div>
          </div>
          <div className="text-center bg-white/20 rounded-lg p-3">
            <Settings className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">Smart Conversion</div>
          </div>
          <div className="text-center bg-white/20 rounded-lg p-3">
            <Shield className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">Security Enhanced</div>
          </div>
          <div className="text-center bg-white/20 rounded-lg p-3">
            <Zap className="w-6 h-6 mx-auto mb-1" />
            <div className="text-sm font-medium">Optimized</div>
          </div>
        </div>

        <div className="flex gap-3">
          {!aiAnalysis && (
            <button
              onClick={onLoadAI}
              disabled={isLoadingAI}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 
                       disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Start AI Analysis
                </>
              )}
            </button>
          )}

          <button
            onClick={startSmartMigration}
            disabled={isMigrating || !jenkinsContent}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white text-purple-600 hover:bg-gray-50 
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all
                     hover:scale-105 active:scale-95"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Smart Migration...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Smart Migration
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-900 mb-4">
            <Brain className="w-5 h-5" />
            AI Intelligence Summary
          </h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(aiAnalysis.summary.complexityScore)}</div>
              <div className="text-sm text-blue-700">Complexity Score</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{aiAnalysis.summary.compatibilityScore}%</div>
              <div className="text-sm text-green-700">Compatibility</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{aiAnalysis.summary.securityScore}%</div>
              <div className="text-sm text-purple-700">Security Score</div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-blue-800">Key AI Insights:</h5>
            <ul className="space-y-1">
              {aiAnalysis.summary.keyInsights.map((insight: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-blue-700 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Migration Progress */}
      {isMigrating && (
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Smart Migration in Progress</h4>
              <p className="text-sm text-gray-600">{currentStep}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{progress}% complete - AI is working intelligently...</p>
        </div>
      )}

      {/* Error Display */}
      {(aiError || migrationError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Operation Failed</p>
              <p className="text-sm text-red-700">{aiError || migrationError}</p>
              <button
                onClick={aiError ? onLoadAI : startSmartMigration}
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
                <h4 className="text-lg font-bold text-green-900">Smart Migration Completed! 🎉</h4>
                <p className="text-green-700">AI-powered conversion with intelligent optimizations applied</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{migrationResult.conversionReport.convertedPlugins}</div>
                <div className="text-sm text-green-600">Smart Conversions</div>
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 
                         text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                Download .gitlab-ci.yml
              </button>
              
              <button
                onClick={() => copyToClipboard(migrationResult.gitlabYaml)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 
                         text-white rounded-lg font-medium transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copy to Clipboard
              </button>
            </div>
          </div>

          {/* Intelligent Optimizations Applied */}
          {migrationResult.conversionReport.performanceOptimizations.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-purple-900 mb-4">
                <Brain className="w-5 h-5" />
                AI Applied These Optimizations
              </h4>
              <ul className="space-y-2">
                {migrationResult.conversionReport.performanceOptimizations.map((optimization: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-purple-800">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                    <span className="text-sm">{optimization}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Enhancements */}
          {migrationResult.conversionReport.securityEnhancements.length > 0 && (
            <div className="bg-red-50 rounded-xl p-6">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-red-900 mb-4">
                <Shield className="w-5 h-5" />
                Security Enhancements Applied
              </h4>
              <ul className="space-y-2">
                {migrationResult.conversionReport.securityEnhancements.map((enhancement: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-red-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                    <span className="text-sm">{enhancement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <TrendingUp className="w-5 h-5" />
              Smart Migration Complete - Next Steps
            </h4>
            <div className="space-y-3">
              {migrationResult.migrationInstructions.map((instruction: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Effort */}
          <div className="bg-white border rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">AI Estimated Migration Effort</h4>
            <p className="text-2xl font-bold text-green-600">{migrationResult.estimatedEffort}</p>
            <p className="text-sm text-gray-600">Based on intelligent complexity analysis</p>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {!migrationResult && !isMigrating && !migrationError && (
        <div className="text-center py-12 text-gray-500">
          <div className="flex justify-center gap-2 mb-4">
            <Brain className="w-16 h-16 opacity-50" />
            <GitBranch className="w-16 h-16 opacity-50" />
          </div>
          <p className="text-lg mb-2">Ready for AI-powered smart migration?</p>
          <p className="text-sm">Our unified system provides intelligent analysis + complete conversion</p>
        </div>
      )}
    </div>
  )
}