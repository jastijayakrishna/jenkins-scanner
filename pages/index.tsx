// pages/index.tsx
import { useState } from 'react'
import Head from 'next/head'
import Dropzone from '@/components/Dropzone'
import GitLabConverter from '@/components/GitLabConverter'
import ResultModal from '@/components/ResultModal'
import PluginReport from '@/components/PluginReport'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScanResult, ConversionResult } from '@/types'
// Using unified AI migration system via API endpoints
import { PluginVerdict, PluginScanSummary } from '@/lib/plugin-mapper'
import { GitBranch, ArrowRight, Sparkles, BarChart3, Loader2, AlertCircle } from 'lucide-react'

interface PluginAnalysisResult {
  verdicts: PluginVerdict[]
  summary: PluginScanSummary
  migrationChecklist: string
}

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [jenkinsContent, setJenkinsContent] = useState<string>('')
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [pluginAnalysis, setPluginAnalysis] = useState<PluginAnalysisResult | null>(null)
  const [showConverter, setShowConverter] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showPluginAnalysis, setShowPluginAnalysis] = useState(false)
  const [showSplitView, setShowSplitView] = useState(false)
  const [activePanel, setActivePanel] = useState<'analysis' | 'config'>('analysis')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleScan = async (scanResult: ScanResult, content: string) => {
    setResult(scanResult)
    setJenkinsContent(content)
    setShowResults(true)
    
    // Perform plugin analysis
    await performPluginAnalysis(content)
  }

  const performPluginAnalysis = async (content: string) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    
    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jenkinsfile: content
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const analysisResult = await response.json()
      if (analysisResult.success) {
        setPluginAnalysis({
          verdicts: analysisResult.verdicts,
          summary: analysisResult.summary,
          migrationChecklist: analysisResult.migrationChecklist
        })
      } else {
        throw new Error(analysisResult.error || 'Plugin analysis failed')
      }
      
    } catch (error) {
      console.error('Plugin analysis error:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze plugins')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConvert = async () => {
    if (!result || !jenkinsContent) return

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: jenkinsContent
        })
      })

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`)
      }

      const conversionData = await response.json()
      
      setConversionResult({
        yaml: conversionData.yaml,
        scanResult: conversionData.scanResult,
        validationErrors: conversionData.validationErrors || [],
        success: conversionData.success
      })
      
      // Show split view instead of separate modals
      setShowSplitView(true)
      setShowResults(false)
      setShowPluginAnalysis(false)
      setShowConverter(false)
    } catch (error) {
      console.error('Conversion error:', error)
      // Could add error state here if needed
    }
  }

  return (
    <>
      <Head>
        <title>Jenkins → GitLab Scanner</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      {/* ---------- Background & blobs ---------- */}
      <main className="relative min-h-screen overflow-hidden
                       bg-gradient-to-br from-gray-50 to-blue-50 
                       selection:bg-brand-500/20">

        {/* animated blobs (pointer-events-none so they never block clicks) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob blob-blue top-[-8rem] left-[-8rem]" />
          <div className="blob blob-purple bottom-[-7rem] left-1/2 animate-delay-2000" />
          <div className="blob blob-cyan top-[-5rem] right-[-6rem] animate-delay-4000" />
        </div>

        {/* ---------- Content ---------- */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 md:py-32">

          {/* Title */}
          <header className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900">
              Jenkins&nbsp;<span className="text-brand-600">→</span>&nbsp;GitLab
              <br className="hidden sm:block" />
              <span className="text-brand-600">Migration&nbsp;Scanner</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Upload your&nbsp;Jenkinsfile &nbsp;•&nbsp; Get instant complexity analysis
              <br />
              <span className="text-brand-600 font-semibold flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-5 h-5" />
                NEW: AI-Powered GitLab CI/CD Conversion
                <Sparkles className="w-5 h-5" />
              </span>
            </p>
          </header>

          {/* frosted-glass card */}
          <div className="glass-card mx-auto max-w-3xl p-8 shadow-dark-lg">

            <Dropzone onScan={handleScan} />

            {result && !showResults && (
              <div className="mt-10 animate-slide-up space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-brand-600 mb-4">
                    Analysis Complete!
                  </h2>
                  <button
                    onClick={() => setShowResults(true)}
                    className="btn-primary group animate-glow"
                  >
                    <BarChart3 className="w-5 h-5" />
                    View Detailed Results
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-gray-200/50 shadow-lg">
              <div className="w-12 h-12 bg-brand-100 rounded-lg 
                            flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Analysis
              </h3>
              <p className="text-sm text-gray-600">
                Get immediate insights into your Jenkins pipeline complexity and plugin usage
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-gray-200/50 shadow-lg">
              <div className="w-12 h-12 bg-brand-100 rounded-lg 
                            flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Conversion
              </h3>
              <p className="text-sm text-gray-600">
                Automatically convert Jenkins pipelines to GitLab CI/CD with intelligent mapping
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-gray-200/50 shadow-lg">
              <div className="w-12 h-12 bg-brand-100 rounded-lg 
                            flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Production Ready
              </h3>
              <p className="text-sm text-gray-600">
                Generate valid GitLab CI/CD configurations with best practices built-in
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Standalone GitLab Converter Modal - Only show when not in split view */}
      {showConverter && conversionResult && !showSplitView && (
        <GitLabConverter 
          result={conversionResult} 
          onClose={() => setShowConverter(false)} 
        />
      )}

      {/* Basic Result Modal - Only show when not in split view */}
      {showResults && result && !showSplitView && (
        <ErrorBoundary>
          <ResultModal 
            result={result} 
            jenkinsContent={jenkinsContent}
            onClose={() => setShowResults(false)}
            onViewPluginAnalysis={() => setShowPluginAnalysis(true)}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            hasPluginAnalysis={!!pluginAnalysis}
          />
        </ErrorBoundary>
      )}

      {/* Plugin Analysis Modal - Only show when not in split view */}
      {showPluginAnalysis && pluginAnalysis && !showSplitView && (
        <ErrorBoundary>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Jenkins Plugin Analysis
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Detailed migration roadmap and compatibility assessment
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleConvert}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                               flex items-center gap-2 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Convert to GitLab CI
                    </button>
                    <button
                      onClick={() => {
                        setShowPluginAnalysis(false)
                        setShowResults(false)
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <PluginReport
                  verdicts={pluginAnalysis.verdicts}
                  summary={pluginAnalysis.summary}
                  migrationChecklist={pluginAnalysis.migrationChecklist}
                />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Split View - Plugin Analysis + GitLab CI Conversion */}
      {showSplitView && pluginAnalysis && conversionResult && (
        <ErrorBoundary>
          <div className="fixed inset-0 z-50 bg-white animate-fade-in">
            {/* Header */}
            <div className="h-16 px-4 lg:px-6 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-blue-50 flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                  Jenkins to GitLab CI Migration
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">
                  Plugin Analysis & Generated Configuration
                </p>
              </div>

              {/* Mobile Panel Toggle */}
              <div className="flex lg:hidden items-center gap-2 mr-4">
                <button
                  onClick={() => setActivePanel('analysis')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activePanel === 'analysis'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/50 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setActivePanel('config')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activePanel === 'config'
                      ? 'bg-brand-600 text-white'
                      : 'bg-white/50 text-gray-600 hover:bg-white/80'
                  }`}
                >
                  Config
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSplitView(false)
                  setShowResults(true)
                }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white/50"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Split Content - Responsive */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
              {/* Left Panel - Plugin Analysis */}
              <div className={`w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col min-h-0 transition-all duration-300 ${
                activePanel === 'analysis' ? 'lg:flex' : 'hidden lg:flex'
              }`}>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 lg:block hidden flex-shrink-0">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-brand-600" />
                    <span className="hidden sm:inline">Plugin Compatibility Analysis</span>
                    <span className="sm:hidden">Plugin Analysis</span>
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 lg:p-4 min-h-0">
                  <PluginReport
                    verdicts={pluginAnalysis.verdicts}
                    summary={pluginAnalysis.summary}
                    migrationChecklist={pluginAnalysis.migrationChecklist}
                  />
                </div>
              </div>

              {/* Right Panel - GitLab CI Configuration */}
              <div className={`w-full lg:w-1/2 flex flex-col min-h-0 ${
                activePanel === 'config' ? 'lg:flex' : 'hidden lg:flex'
              }`}>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 lg:block hidden flex-shrink-0">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 lg:w-5 lg:h-5 text-brand-600" />
                    <span className="hidden sm:inline">Generated GitLab CI Configuration</span>
                    <span className="sm:hidden">GitLab CI Config</span>
                  </h2>
                </div>
                <div className="flex-1 min-h-0">
                  <GitLabConverter 
                    result={conversionResult} 
                    onClose={() => setShowSplitView(false)}
                    isEmbedded={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}
    </>
  )
}
