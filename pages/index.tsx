/**
 * Enterprise Migration Dashboard - Main Page
 * 
 * Modern landing page for the Jenkins to GitLab CI migration platform
 * with enterprise dashboard integration and real-time analysis.
 */

import { useState } from 'react'
import Head from 'next/head'
import Dropzone from '@/components/Dropzone'
import EnterpriseDashboard from '@/components/EnterpriseDashboard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScanResult } from '@/types'
import { 
  Activity, 
  Brain, 
  GitBranch, 
  Shield, 
  Play, 
  Zap, 
  CheckCircle,
  BarChart3,
  TrendingUp,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  const [jenkinsContent, setJenkinsContent] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(false)

  const handleScan = async (scanResult: ScanResult, content: string) => {
    setJenkinsContent(content)
    setShowDashboard(true)
  }

  const handleCloseDashboard = () => {
    setShowDashboard(false)
    setJenkinsContent('')
  }

  if (showDashboard && jenkinsContent) {
    return (
      <ErrorBoundary>
        <EnterpriseDashboard 
          jenkinsContent={jenkinsContent}
          onClose={handleCloseDashboard}
        />
      </ErrorBoundary>
    )
  }

  return (
    <>
      <Head>
        <title>Enterprise Jenkins → GitLab Migration Platform</title>
        <meta name="description" content="Enterprise-grade Jenkins to GitLab CI/CD migration with real-time plugin analysis and dry-run testing" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      <main className="relative min-h-screen bg-white overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30" />
          
          {/* Animated blobs */}
          <div className="blob blob-blue top-20 left-20 animate-blob" />
          <div className="blob blob-purple top-40 right-20 animate-blob animate-delay-2000" />
          <div className="blob blob-cyan bottom-20 left-40 animate-blob animate-delay-4000" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 py-24 md:py-32">
            
            {/* Header */}
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Activity className="w-4 h-4" />
                Enterprise Migration Platform
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.022em',
                lineHeight: 1.05
              }}>
                Jenkins
                <span className="mx-4 text-blue-600">
                  <ArrowRight className="inline w-12 h-12 md:w-16 md:h-16" />
                </span>
                GitLab
                <br />
                <span className="text-blue-600">Migration Dashboard</span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8" style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.022em',
                lineHeight: 1.5
              }}>
                Enterprise-grade Jenkins to GitLab CI/CD migration with real-time plugin compatibility analysis, 
                AI-powered dry-run testing, and comprehensive migration reporting.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
                <Brain className="w-5 h-5" />
                <span>Powered by AI Intelligence</span>
                <Brain className="w-5 h-5" />
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 shadow-xl">
                <ErrorBoundary>
                  <Dropzone onScan={handleScan} />
                </ErrorBoundary>
              </div>
            </div>

          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Enterprise Features
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Built for enterprise DevOps teams with reliability, security, and scalability in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Plugin Compatibility Dashboard */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Real-time Plugin Analysis
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Comprehensive plugin compatibility assessment with AI-powered mapping, 
                  blocking issue detection, and migration guidance.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    AI-powered compatibility scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Real-time blocking issue alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    GitLab equivalent recommendations
                  </li>
                </ul>
              </div>

              {/* Dry-Run Testing */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  GitLab Dry-Run Testing
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Execute your converted GitLab CI pipelines in secure sandbox environments 
                  with comprehensive logging and AI analysis.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Secure sandbox execution
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Real-time pipeline monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Detailed job logs and warnings
                  </li>
                </ul>
              </div>

              {/* AI Intelligence */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  AI-Powered Analysis
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Advanced AI analysis for plugin mapping, log interpretation, 
                  and intelligent migration recommendations.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Intelligent plugin mapping
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Smart error analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Migration readiness assessment
                  </li>
                </ul>
              </div>

              {/* Enterprise Security */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Enterprise Security
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Built with enterprise security in mind including audit trails, 
                  access controls, and secure sandbox environments.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Complete audit trail
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Secure API access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Isolated testing environments
                  </li>
                </ul>
              </div>

              {/* Real-time Monitoring */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Real-time Dashboard
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Live monitoring of plugin analysis and dry-run executions 
                  with comprehensive reporting and filtering capabilities.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Live status updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Advanced filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Export capabilities
                  </li>
                </ul>
              </div>

              {/* Performance Analytics */}
              <div className="glass-card p-8 group hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Performance Analytics
                </h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Detailed performance metrics and analytics to track 
                  migration success rates and optimization opportunities.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Migration success metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Performance benchmarking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Optimization recommendations
                  </li>
                </ul>
              </div>

            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 py-20">
            <div className="glass-card p-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Ready to Migrate Your Jenkins Pipelines?
              </h2>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                Upload your Jenkinsfile to start with enterprise-grade plugin analysis 
                and dry-run testing powered by AI intelligence.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Free Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Instant Results</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Enterprise Ready</span>
                </div>
              </div>
            </div>
          </section>

        </div>

      </main>
    </>
  )
}