// pages/index.tsx
import { useState } from 'react'
import Head from 'next/head'
import Dropzone from '@/components/Dropzone'
import GitLabConverter from '@/components/GitLabConverter'
import { ScanResult, ConversionResult } from '@/types'
import { convertToGitLabCI, validateGitLabCI } from '@/lib/gitlab-converter'
import { GitBranch, ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [jenkinsContent, setJenkinsContent] = useState<string>('')
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null)
  const [showConverter, setShowConverter] = useState(false)

  const handleScan = (scanResult: ScanResult, content: string) => {
    setResult(scanResult)
    setJenkinsContent(content)
  }

  const handleConvert = () => {
    if (!result || !jenkinsContent) return

    const yaml = convertToGitLabCI(result, jenkinsContent)
    const validation = validateGitLabCI(yaml)
    
    setConversionResult({
      yaml,
      scanResult: result,
      validationErrors: validation.errors,
      success: validation.valid
    })
    setShowConverter(true)
  }

  return (
    <>
      <Head>
        <title>Jenkins → GitLab Scanner</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      {/* ---------- Background & blobs ---------- */}
      <main className="relative min-h-screen overflow-hidden
                       bg-dark-950 
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
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Jenkins&nbsp;<span className="text-brand-400">→</span>&nbsp;GitLab
              <br className="hidden sm:block" />
              <span className="text-brand-400">Migration&nbsp;Scanner</span>
            </h1>
            <p className="mt-4 text-xl text-gray-300">
              Upload your&nbsp;Jenkinsfile &nbsp;•&nbsp; Get instant complexity analysis
              <br />
              <span className="text-brand-400 font-semibold flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-5 h-5" />
                NEW: AI-Powered GitLab CI/CD Conversion
                <Sparkles className="w-5 h-5" />
              </span>
            </p>
          </header>

          {/* frosted-glass card */}
          <div className="glass-card mx-auto max-w-3xl p-8 shadow-dark-lg">

            <Dropzone onScan={handleScan} />

            {result && (
              <div className="mt-10 animate-slide-up space-y-6">
                <div className="space-y-4 text-sm sm:text-base text-gray-100">
                  <h2 className="text-2xl font-semibold text-brand-300">
                    Analysis Results
                  </h2>

                  <ul className="grid gap-2 sm:grid-cols-2">
                    <li><b className="text-white">Complexity:</b> {result.tier}</li>
                    <li><b className="text-white">Type:</b> {result.declarative ? 'Declarative' :
                                       result.scripted ? 'Scripted' : 'Unknown'}</li>
                    <li><b className="text-white">Lines:</b> {result.lineCount}</li>
                    <li><b className="text-white">Plugins:</b> {result.pluginCount}</li>
                  </ul>

                  {result.pluginHits.length > 0 && (
                    <details open className="pt-2">
                      <summary className="cursor-pointer select-none font-medium">
                        Found ({result.pluginHits.length})
                      </summary>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {result.pluginHits.map(p => (
                          <li key={p.key}
                              className="rounded-full bg-brand-100 px-3 py-1 text-xs
                                         text-brand-800 dark:bg-brand-700/30
                                         dark:text-brand-200">
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <h3 className="font-medium text-yellow-300 mb-2">
                        Migration Warnings
                      </h3>
                      <ul className="space-y-1">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx} className="text-sm text-yellow-200">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Convert to GitLab Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleConvert}
                    className="btn-primary group animate-glow"
                  >
                    <GitBranch className="w-5 h-5" />
                    Convert to GitLab CI/CD
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-white/30 dark:ring-slate-600/30">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg 
                            flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Instant Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get immediate insights into your Jenkins pipeline complexity and plugin usage
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-white/30 dark:ring-slate-600/30">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg 
                            flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI-Powered Conversion
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Automatically convert Jenkins pipelines to GitLab CI/CD with intelligent mapping
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 
                          ring-1 ring-white/30 dark:ring-slate-600/30">
              <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-lg 
                            flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Production Ready
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate valid GitLab CI/CD configurations with best practices built-in
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* GitLab Converter Modal */}
      {showConverter && conversionResult && (
        <GitLabConverter 
          result={conversionResult} 
          onClose={() => setShowConverter(false)} 
        />
      )}
    </>
  )
}
