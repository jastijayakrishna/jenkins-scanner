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
            <h1 className="text-5xl font-bold text-gray-900" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.022em',
              lineHeight: 1.05
            }}>
              Jenkins&nbsp;<span style={{ color: 'var(--accent-primary)' }}>→</span>&nbsp;GitLab
              <br className="hidden sm:block" />
              <span style={{ color: 'var(--accent-primary)' }}>Migration&nbsp;Scanner</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
              fontWeight: 400,
              letterSpacing: '-0.022em',
              lineHeight: 1.381,
              color: 'var(--text-secondary)'
            }}>
              Upload your&nbsp;Jenkinsfile &nbsp;•&nbsp; Get instant AI-powered analysis & conversion
              <br />
              <span style={{ 
                color: 'var(--accent-primary)', 
                fontWeight: 590,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }} className="flex items-center justify-center gap-2 mt-3">
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
                    className="btn-primary group animate-glow flex items-center gap-3"
                  >
                    <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    View Smart AI Analysis
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" 
                   style={{ background: 'var(--system-blue-light)' }}>
                <Brain className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 590,
                color: 'var(--text-primary)',
                letterSpacing: '-0.022em'
              }}>
                Smart AI Analysis
              </h3>
              <p className="text-base leading-relaxed" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                color: 'var(--text-secondary)',
                lineHeight: 1.47058823529
              }}>
                Get intelligent insights into your Jenkins pipeline with AI-powered migration recommendations
              </p>
            </div>

            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" 
                   style={{ background: 'var(--system-blue-light)' }}>
                <Sparkles className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 590,
                color: 'var(--text-primary)',
                letterSpacing: '-0.022em'
              }}>
                Instant GitLab CI Generation
              </h3>
              <p className="text-base leading-relaxed" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                color: 'var(--text-secondary)',
                lineHeight: 1.47058823529
              }}>
                Automatically convert Jenkins pipelines to GitLab CI/CD with TODO comments and confidence scores
              </p>
            </div>

            <div className="glass-card p-8 card-hover">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" 
                   style={{ background: 'var(--system-blue-light)' }}>
                <GitBranch className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 590,
                color: 'var(--text-primary)',
                letterSpacing: '-0.022em'
              }}>
                Production Ready
              </h3>
              <p className="text-base leading-relaxed" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                color: 'var(--text-secondary)',
                lineHeight: 1.47058823529
              }}>
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