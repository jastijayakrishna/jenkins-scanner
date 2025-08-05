import React from 'react'
import { Download, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { ConversionResult } from '@/types'

interface GitLabConverterProps {
  result: ConversionResult
  onClose: () => void
}

export default function GitLabConverter({ result, onClose }: GitLabConverterProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.yaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result.yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.gitlab-ci.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                GitLab CI/CD Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Auto-generated from your Jenkins pipeline
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Validation Status */}
          {result.validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Validation Warnings
                  </h3>
                  <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                    {result.validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Migration Summary */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
              <div className="text-sm text-brand-600 dark:text-brand-400">Complexity</div>
              <div className="text-xl font-semibold text-brand-700 dark:text-brand-300">
                {result.scanResult.tier.toUpperCase()}
              </div>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
              <div className="text-sm text-brand-600 dark:text-brand-400">Pipeline Type</div>
              <div className="text-xl font-semibold text-brand-700 dark:text-brand-300">
                {result.scanResult.declarative ? 'Declarative' : result.scanResult.scripted ? 'Scripted' : 'Unknown'}
              </div>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
              <div className="text-sm text-brand-600 dark:text-brand-400">Plugins Mapped</div>
              <div className="text-xl font-semibold text-brand-700 dark:text-brand-300">
                {result.scanResult.pluginCount}
              </div>
            </div>
          </div>

          {/* YAML Preview */}
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                         flex items-center gap-2 text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                {result.yaml}
              </code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
              Ready for GitLab CI/CD
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 
                         dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                         flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download .gitlab-ci.yml
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
