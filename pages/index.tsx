// pages/index.tsx
import { useState } from 'react'
import Head from 'next/head'
import Dropzone from '@/components/Dropzone'
import ResultModal from '@/components/ResultModal'
import SmartMigrationTab from '@/components/SmartMigrationTab'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScanResult } from '@/types'
import { GitBranch, Sparkles, BarChart3, Brain } from 'lucide-react'

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [jenkinsContent, setJenkinsContent] = useState<string>('')
  const [showResults, setShowResults] = useState(false)
  const [showSmartAnalysis, setShowSmartAnalysis] = useState(false)

  const handleScan = async (scanResult: ScanResult, content: string) => {
    setResult(scanResult)
    setJenkinsContent(content)
    setShowResults(true)
  }

  const handleSmartAnalysis = () => {
    setShowSmartAnalysis(true)
    setShowResults(false)
  }

  return (
    <>
      <Head>
        <title>Jenkins → GitLab Scanner</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      {/* Clean modern background */}
      <main className="relative min-h-screen bg-white">

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30" />

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
              Upload your&nbsp;Jenkinsfile &nbsp;•&nbsp; Get instant AI-powered analysis & conversion
              <br />
              <span className="text-brand-600 font-semibold flex items-center justify-center gap-2 mt-2">
                <Brain className="w-5 h-5" />
                AI-Powered Smart Migration Analysis
                <Brain className="w-5 h-5" />
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
                    View Smart AI Analysis
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
                <Brain className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart AI Analysis
              </h3>
              <p className="text-sm text-gray-600">
                Get intelligent insights into your Jenkins pipeline with AI-powered migration recommendations
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-gray-200/50 shadow-lg">
              <div className="w-12 h-12 bg-brand-100 rounded-lg 
                            flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant GitLab CI Generation
              </h3>
              <p className="text-sm text-gray-600">
                Automatically convert Jenkins pipelines to GitLab CI/CD with TODO comments and confidence scores
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
                Generate valid GitLab CI/CD configurations with security scanning and best practices
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Basic Result Modal */}
      {showResults && result && !showSmartAnalysis && (
        <ErrorBoundary>
          <ResultModal 
            result={result} 
            jenkinsContent={jenkinsContent}
            onClose={() => setShowResults(false)}
            onViewSmartAnalysis={handleSmartAnalysis}
          />
        </ErrorBoundary>
      )}

      {/* Smart AI Analysis with GitLab CI Integration */}
      {showSmartAnalysis && result && (
        <ErrorBoundary>
          <SmartMigrationTab
            jenkinsContent={jenkinsContent}
            scanResult={result}
            onClose={() => {
              setShowSmartAnalysis(false)
              setShowResults(true)
            }}
          />
        </ErrorBoundary>
      )}
    </>
  )
}