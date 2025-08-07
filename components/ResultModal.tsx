import React from 'react'
import { X, AlertTriangle, CheckCircle, Info, Brain, Sparkles, BarChart3 } from 'lucide-react'
import { ScanResult } from '@/types'

interface ResultModalProps {
  result: ScanResult
  jenkinsContent?: string
  onClose: () => void
  onViewSmartAnalysis?: () => void
}

const tierMeta = {
  simple: {
    colors: 'from-blue-500 to-blue-600',
    bgColors: 'from-blue-50 to-blue-100',
    textColors: 'text-blue-800',
    icon: <CheckCircle className="h-6 w-6" />,
    text: 'Simple',
  },
  medium: {
    colors: 'from-blue-600 to-blue-700',
    bgColors: 'from-blue-100 to-blue-200',
    textColors: 'text-blue-900',
    icon: <Info className="h-6 w-6" />,
    text: 'Medium',
  },
  complex: {
    colors: 'from-blue-700 to-blue-800',
    bgColors: 'from-blue-200 to-blue-300',
    textColors: 'text-blue-950',
    icon: <AlertTriangle className="h-6 w-6" />,
    text: 'Complex',
  },
} as const

export default function ResultModal({ 
  result, 
  jenkinsContent = '',
  onClose, 
  onViewSmartAnalysis
}: ResultModalProps) {
  const meta = tierMeta[result.tier as keyof typeof tierMeta] ?? tierMeta.simple;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-blue-200 flex flex-col">
        {/* ✦ glowing banner */}
        <div className={`h-4 w-full bg-gradient-to-r ${meta.colors} shadow-inner`} />

        {/* close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-6 rounded-full p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-6 border-b border-blue-200 bg-gradient-to-r from-blue-50/50 to-blue-100/50 flex-shrink-0">
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={`flex items-center gap-2 rounded-full bg-gradient-to-r ${meta.colors} px-4 py-2
                          text-sm font-bold uppercase tracking-wide text-white shadow-lg`}
            >
              {meta.icon}
              {meta.text} Complexity
            </div>

            <p className="text-base text-slate-700 font-medium">
              {result.scripted ? 'Scripted' : 'Declarative'} pipeline • {' '}
              <span className="text-blue-700 font-semibold">{result.pluginCount} plugins</span> • {result.lineCount} lines
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* stats grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Plugins', value: result.pluginCount, color: 'from-blue-500 to-blue-600' },
                { label: 'Lines', value: result.lineCount, color: 'from-blue-600 to-blue-700' },
                { label: 'Warnings', value: result.warnings.length, color: 'from-blue-700 to-blue-800' },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-xl glass-card p-4 hover:scale-105 transition-transform duration-200 border border-blue-200"
                >
                  <div className={`text-2xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Detected Plugins - Enhanced */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900" style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 590,
                  letterSpacing: '-0.022em'
                }}>Detected Jenkins Plugins</h3>
              </div>
              
              {result.pluginHits && result.pluginHits.length > 0 ? (
                <div className="glass-card p-4 border border-blue-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {result.pluginHits.map((plugin, index) => (
                      <div 
                        key={index} 
                        className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-3 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div className="relative flex items-center justify-between">
                          <span className="font-medium text-xs truncate pr-1">{plugin.key}</span>
                          <div className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse flex-shrink-0" />
                        </div>
                        <div className="relative mt-0.5 text-[10px] text-blue-100 font-medium">
                          Jenkins Plugin
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      <span>Found {result.pluginHits.length} Jenkins plugins that will need GitLab CI/CD equivalents</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-4 border border-blue-200 text-center">
                  <div className="text-slate-500 mb-2">
                    <BarChart3 className="w-8 h-8 mx-auto text-blue-300" />
                  </div>
                  <p className="text-slate-600 font-medium text-sm">No specific plugins detected in this pipeline</p>
                  <p className="text-xs text-slate-500 mt-1">This might be a simple pipeline or use built-in Jenkins features</p>
                </div>
              )}
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    fontWeight: 590,
                    letterSpacing: '-0.022em'
                  }}>Migration Warnings</h3>
                </div>
                <div className="glass-card border border-blue-300 p-4 max-h-32 overflow-y-auto">
                  <div className="space-y-2">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900 font-medium">{warning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Analysis CTA - Enhanced */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-blue-700/10 p-4 border border-blue-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/30" />
              <div className="relative text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-1" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    fontWeight: 590,
                    letterSpacing: '-0.022em'
                  }}>
                    Ready for AI-Powered Analysis?
                    <span className="text-blue-600">🚀</span>
                  </h3>
                  <p className="text-sm text-slate-700 mb-4 font-medium" style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.022em',
                    lineHeight: 1.47058823529,
                    color: 'var(--text-secondary)'
                  }}>
                    Get intelligent migration insights, auto-generate your GitLab CI configuration, and receive detailed security recommendations
                  </p>
                  {onViewSmartAnalysis && (
                    <button
                      onClick={onViewSmartAnalysis}
                      className="group inline-flex items-center gap-2 btn-primary"
                    >
                      <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      Start Smart AI Analysis
                      <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}