// components/SecretsTab.tsx
/**
 * Secrets tab component for displaying Jenkins credential migration to GitLab
 */

import React, { useState, useEffect } from 'react'
import { 
  Key, 
  Download, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Terminal,
  Shield,
  ShieldCheck,
  Clock,
  HelpCircle
} from 'lucide-react'
import { GitLabVarSpec } from '@/lib/cred-mapper'

interface SecretsTabProps {
  jenkinsContent: string
  projectId?: string
  gitlabToken?: string
  onTokenRequest?: () => void
}

interface CredentialAnalysisData {
  credentials: Array<{
    id: string
    line: number
    kind: string
    rawMatch: string
    context?: string
  }>
  analysis: {
    totalCredentials: number
    byKind: Record<string, number>
    potentialSecrets: any[]
    recommendations: string[]
  }
  variables: GitLabVarSpec[]
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
  envFile?: string
  script?: string
  summary: {
    totalCredentials: number
    totalVariables: number
    fileVariables: number
    protectedVariables: number
    maskedVariables: number
  }
}

interface VariableStatus {
  exists: boolean
  masked?: boolean
  protected?: boolean
  environment_scope?: string
  last_checked?: string
  error?: string
}

export default function SecretsTab({ 
  jenkinsContent, 
  projectId, 
  gitlabToken,
  onTokenRequest 
}: SecretsTabProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CredentialAnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [variableStatuses, setVariableStatuses] = useState<Record<string, VariableStatus>>({})
  const [checkingStatuses, setCheckingStatuses] = useState(false)
  const [showEnvFile, setShowEnvFile] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [expandedCredentials, setExpandedCredentials] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'variable' | 'file'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'exists' | 'missing' | 'unknown'>('all')
  
  // Load credential analysis on mount
  useEffect(() => {
    if (jenkinsContent) {
      analyzeCredentials()
    }
  }, [jenkinsContent])
  
  const analyzeCredentials = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/creds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jenkinsfile: jenkinsContent,
          projectId,
          options: {
            generateEnv: true,
            generateScript: true,
            dryRun: false
          }
        }),
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze credentials')
      }
      
      setData(result.data)
      
      // Auto-check statuses if we have a token
      if (gitlabToken && projectId && result.data.variables.length > 0) {
        checkVariableStatuses(result.data.variables)
      }
      
    } catch (err) {
      console.error('Error analyzing credentials:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze credentials')
    } finally {
      setLoading(false)
    }
  }
  
  const checkVariableStatuses = async (variables: GitLabVarSpec[]) => {
    if (!gitlabToken || !projectId) {
      if (onTokenRequest) {
        onTokenRequest()
      }
      return
    }
    
    setCheckingStatuses(true)
    const statuses: Record<string, VariableStatus> = {}
    
    // Check each variable
    for (const variable of variables) {
      try {
        const response = await fetch(
          `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/variables/${encodeURIComponent(variable.proposedKey)}`,
          {
            headers: {
              'PRIVATE-TOKEN': gitlabToken,
            },
          }
        )
        
        if (response.ok) {
          const varData = await response.json()
          statuses[variable.proposedKey] = {
            exists: true,
            masked: varData.masked,
            protected: varData.protected,
            environment_scope: varData.environment_scope,
            last_checked: new Date().toISOString()
          }
        } else if (response.status === 404) {
          statuses[variable.proposedKey] = {
            exists: false,
            last_checked: new Date().toISOString()
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err) {
        statuses[variable.proposedKey] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          last_checked: new Date().toISOString()
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setVariableStatuses(statuses)
    setCheckingStatuses(false)
  }
  
  const copyToClipboard = async (text: string, type: 'env' | 'script') => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback: create a temporary textarea
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }
  
  const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const toggleCredentialExpansion = (credentialId: string) => {
    const newExpanded = new Set(expandedCredentials)
    if (newExpanded.has(credentialId)) {
      newExpanded.delete(credentialId)
    } else {
      newExpanded.add(credentialId)
    }
    setExpandedCredentials(newExpanded)
  }
  
  const getStatusIcon = (variable: GitLabVarSpec) => {
    const status = variableStatuses[variable.proposedKey]
    if (!status) {
      return (
        <div title="Status unknown">
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>
      )
    }
    if (status.error) {
      return (
        <div title={`Error: ${status.error}`}>
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
      )
    }
    if (status.exists) {
      return (
        <div title="Variable exists in GitLab">
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
      )
    }
    return (
      <div title="Variable missing in GitLab">
        <XCircle className="w-4 h-4 text-red-500" />
      </div>
    )
  }
  
  const getFilteredVariables = () => {
    if (!data) return []
    
    let filtered = data.variables
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(v => v.type === filterType)
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => {
        const status = variableStatuses[v.proposedKey]
        switch (filterStatus) {
          case 'exists':
            return status?.exists === true
          case 'missing':
            return status?.exists === false
          case 'unknown':
            return !status || status.error
          default:
            return true
        }
      })
    }
    
    return filtered
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          <span className="text-gray-600">Analyzing credentials...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={analyzeCredentials}
          className="btn-primary"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Analysis
        </button>
      </div>
    )
  }
  
  if (!data || data.summary.totalCredentials === 0) {
    return (
      <div className="p-6 text-center">
        <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credentials Found</h3>
        <p className="text-gray-600">
          No Jenkins credentials were detected in your pipeline. 
          This is great for security!
        </p>
      </div>
    )
  }
  
  const filteredVariables = getFilteredVariables()
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-900">Credentials</span>
          </div>
          <div className="text-2xl font-bold text-brand-700">{data.summary.totalCredentials}</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Variables</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.summary.totalVariables}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Protected</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{data.summary.protectedVariables}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Files</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">{data.summary.fileVariables}</div>
        </div>
      </div>
      
      {/* Validation Issues */}
      {(!data.validation.valid || data.validation.warnings.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-2">Validation Issues</h4>
              {data.validation.errors.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {data.validation.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.validation.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {data.validation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => checkVariableStatuses(data.variables)}
          disabled={checkingStatuses || !gitlabToken || !projectId}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${checkingStatuses ? 'animate-spin' : ''}`} />
          {checkingStatuses ? 'Checking...' : 'Check Status'}
        </button>
        
        {data.envFile && (
          <button
            onClick={() => setShowEnvFile(!showEnvFile)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {showEnvFile ? 'Hide' : 'Show'} .env File
          </button>
        )}
        
        {data.script && (
          <button
            onClick={() => setShowScript(!showScript)}
            className="btn-secondary flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            {showScript ? 'Hide' : 'Show'} Script
          </button>
        )}
        
        {data.envFile && (
          <button
            onClick={() => downloadFile(data.envFile!, '.env.gitlab', 'text/plain')}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download .env
          </button>
        )}
        
        {data.script && (
          <button
            onClick={() => downloadFile(data.script!, 'create_gitlab_vars.sh', 'text/x-shellscript')}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Script
          </button>
        )}
      </div>
      
      {/* Show .env file content */}
      {showEnvFile && data.envFile && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">.env.gitlab</h4>
            <button
              onClick={() => copyToClipboard(data.envFile!, 'env')}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto">
            <code>{data.envFile}</code>
          </pre>
        </div>
      )}
      
      {/* Show script content */}
      {showScript && data.script && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">create_gitlab_vars.sh</h4>
            <button
              onClick={() => copyToClipboard(data.script!, 'script')}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto max-h-64">
            <code>{data.script}</code>
          </pre>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white border rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Types</option>
            <option value="variable">Variables</option>
            <option value="file">Files</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Status</option>
            <option value="exists">Exists</option>
            <option value="missing">Missing</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredVariables.length} of {data.variables.length} variables
        </div>
      </div>
      
      {/* Variables Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Jenkins Credential
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  GitLab Variable
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                  Properties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVariables.map((variable, index) => (
                <tr key={`${variable.originalId}-${variable.proposedKey}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {variable.originalId}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-brand-600">
                        {variable.proposedKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(variable.proposedKey, 'env')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy variable name"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {variable.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      variable.type === 'file' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {variable.type === 'file' ? <FileText className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
                      {variable.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(variable)}
                      <span className="text-sm text-gray-600">
                        {variableStatuses[variable.proposedKey]?.exists ? 'Exists' : 
                         variableStatuses[variable.proposedKey]?.exists === false ? 'Missing' : 
                         'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {variable.protected && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Shield className="w-3 h-3" />
                          Protected
                        </span>
                      )}
                      {variable.masked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <EyeOff className="w-3 h-3" />
                          Masked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendations */}
      {data.analysis.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                {data.analysis.recommendations.map((recommendation, idx) => (
                  <li key={idx}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}