// components/PluginReport.tsx
import React, { useState, useMemo, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock, Copy, Download, ExternalLink, Info, TrendingUp, Award, Target } from 'lucide-react'
import { PluginVerdict, PluginScanSummary } from '@/lib/plugin-mapper'

interface PluginReportProps {
  verdicts: PluginVerdict[]
  summary: PluginScanSummary
  migrationChecklist: string
}

const PluginReport = React.memo(({ verdicts, summary, migrationChecklist }: PluginReportProps) => {
  const [copiedChecklist, setCopiedChecklist] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<PluginVerdict | null>(null)
  const [filter, setFilter] = useState<'all' | 'native' | 'template' | 'limited' | 'unsupported'>('all')

  // Memoize filtered verdicts for performance
  const filteredVerdicts = useMemo(() => {
    if (filter === 'all') return verdicts
    return verdicts.filter(verdict => verdict.status === filter)
  }, [verdicts, filter])

  const handleCopyChecklist = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(migrationChecklist)
      setCopiedChecklist(true)
      setTimeout(() => setCopiedChecklist(false), 2000)
    } catch (error) {
      console.error('Failed to copy checklist:', error)
    }
  }, [migrationChecklist])

  const handleDownloadChecklist = useCallback(() => {
    const blob = new Blob([migrationChecklist], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jenkins-migration-checklist.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [migrationChecklist])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'native':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'template':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'limited':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'unsupported':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'native':
        return 'bg-green-100 text-green-800'
      case 'template':
        return 'bg-yellow-100 text-yellow-800'
      case 'limited':
        return 'bg-orange-100 text-orange-800'
      case 'unsupported':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'hard':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getMigrationScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }


  if (verdicts.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Jenkins Plugins Detected
        </h3>
        <p className="text-gray-500">
          No recognizable Jenkins plugins were found in the uploaded pipeline.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Migration Score Hero */}
      <div className="relative bg-gradient-to-br from-brand-50 via-blue-50 to-indigo-50 rounded-2xl p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-brand-600" />
              <h3 className="text-2xl font-bold text-gray-900">
                Migration Readiness Score
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Based on plugin compatibility and migration complexity analysis
            </p>
            <div className={`text-5xl font-black ${getMigrationScoreColor(summary.migrationScore)} mb-2`}>
              {summary.migrationScore}<span className="text-2xl">/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  summary.migrationScore >= 80 ? 'bg-green-500' :
                  summary.migrationScore >= 60 ? 'bg-yellow-500' :
                  summary.migrationScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${summary.migrationScore}%` }}
              ></div>
            </div>
          </div>
          <div className="hidden md:block">
            <TrendingUp className="w-24 h-24 text-brand-200" />
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {summary.totalPlugins}
          </div>
          <div className="text-sm text-gray-500">
            Plugins Detected
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Ready
            </span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {summary.nativeSupport}
          </div>
          <div className="text-sm text-green-600">
            Native Support
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
              Templates
            </span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {summary.templateAvailable}
          </div>
          <div className="text-sm text-yellow-600">
            Available
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Issues
            </span>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {summary.limited + summary.unsupported}
          </div>
          <div className="text-sm text-red-600">
            Need Attention
          </div>
        </div>
      </div>

      {/* Migration Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Migration Tools
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Get your personalized migration checklist and implementation guide
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopyChecklist}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 
                     text-white rounded-lg transition-all hover:scale-105 active:scale-95
                     shadow-sm hover:shadow-md"
          >
            {copiedChecklist ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Migration Checklist
              </>
            )}
          </button>

          <button
            onClick={handleDownloadChecklist}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 
                     text-white rounded-lg transition-all hover:scale-105 active:scale-95
                     shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Download as Markdown
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'all', label: 'All', count: verdicts.length, color: 'brand' },
            { key: 'native', label: 'Native', count: summary.nativeSupport, color: 'green' },
            { key: 'template', label: 'Template', count: summary.templateAvailable, color: 'yellow' },
            { key: 'limited', label: 'Limited', count: summary.limited, color: 'orange' },
            { key: 'unsupported', label: 'Unsupported', count: summary.unsupported, color: 'red' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none ${
                filter === tab.key
                  ? tab.key === 'all' ? 'bg-brand-100 text-brand-700 shadow-sm' :
                    tab.key === 'native' ? 'bg-green-100 text-green-700 shadow-sm' :
                    tab.key === 'template' ? 'bg-yellow-100 text-yellow-700 shadow-sm' :
                    tab.key === 'limited' ? 'bg-orange-100 text-orange-700 shadow-sm' :
                    'bg-red-100 text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                filter === tab.key 
                  ? tab.key === 'all' ? 'bg-brand-200 text-brand-800' :
                    tab.key === 'native' ? 'bg-green-200 text-green-800' :
                    tab.key === 'template' ? 'bg-yellow-200 text-yellow-800' :
                    tab.key === 'limited' ? 'bg-orange-200 text-orange-800' :
                    'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Plugins Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Plugin Compatibility Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Detailed breakdown of each Jenkins plugin and its GitLab CI/CD equivalent
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                  Plugin
                </th>
                <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                  Status
                </th>
                <th className="hidden sm:table-cell text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  GitLab Equivalent
                </th>
                <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                  Complexity
                </th>
                <th className="text-left py-4 px-3 sm:px-6 font-semibold text-gray-900 text-xs sm:text-sm uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVerdicts.map((verdict, index) => (
                <tr
                  key={`${verdict.id}-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(verdict.status)}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {verdict.id}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {verdict.hits.length} line{verdict.hits.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-3 sm:px-6">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(verdict.status)}`}>
                      <span className="hidden sm:inline">{verdict.status}</span>
                      <span className="sm:hidden">{verdict.status.slice(0, 3)}</span>
                    </span>
                  </td>
                  
                  <td className="hidden sm:table-cell py-4 px-6">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate block">
                        {verdict.gitlab || verdict.include || verdict.alternative || 'Manual implementation required'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-3 sm:px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${getComplexityColor(verdict.migrationComplexity)} bg-current bg-opacity-10`}>
                      {verdict.migrationComplexity}
                    </span>
                  </td>
                  
                  <td className="py-4 px-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPlugin(verdict)}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {verdict.documentation && (
                      <a
                        href={verdict.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(selectedPlugin.status)}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPlugin.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPlugin.status)}`}>
                    {selectedPlugin.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPlugin(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Migration Notes
                  </h4>
                  <p className="text-gray-700">
                    {selectedPlugin.note}
                  </p>
                </div>

                {selectedPlugin.gitlab && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      GitLab CI Equivalent
                    </h4>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {selectedPlugin.gitlab}
                    </code>
                  </div>
                )}

                {selectedPlugin.include && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Include Template
                    </h4>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all">
                      {selectedPlugin.include}
                    </code>
                  </div>
                )}

                {selectedPlugin.alternative && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Alternative Solution
                    </h4>
                    <p className="text-gray-700">
                      {selectedPlugin.alternative}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Found in Pipeline
                  </h4>
                  <div className="space-y-2">
                    {selectedPlugin.hits.map((hit, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="text-sm font-medium text-gray-900">
                          Line {hit.line}
                        </div>
                        <code className="text-xs text-gray-600 break-all">
                          {hit.context}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPlugin.documentation && (
                  <div>
                    <a
                      href={selectedPlugin.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Documentation
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

PluginReport.displayName = 'PluginReport'

export default PluginReport