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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

      <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/20" />

        {/* Main Content */}
        <div className="relative z-10">
          
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 py-24 md:py-32">
            
            {/* Header */}
            <div className="text-center mb-16 animate-fade-in">
              <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 mb-6">
                <Activity className="w-4 h-4" />
                Enterprise Migration Platform
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Jenkins
                <span className="mx-4 text-primary">
                  <ArrowRight className="inline w-12 h-12 md:w-16 md:h-16" />
                </span>
                GitLab
                <br />
                <span className="text-primary">Migration Dashboard</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Enterprise-grade Jenkins to GitLab CI/CD migration with real-time plugin compatibility analysis, 
                AI-powered dry-run testing, and comprehensive migration reporting.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <Brain className="w-5 h-5" />
                <span>Powered by AI Intelligence</span>
                <Brain className="w-5 h-5" />
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 shadow-lg">
                <ErrorBoundary>
                  <Dropzone onScan={handleScan} />
                </ErrorBoundary>
              </Card>
            </div>

          </section>

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 py-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                Enterprise Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built for enterprise DevOps teams with reliability, security, and scalability in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Plugin Compatibility Dashboard */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    Real-time Plugin Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Comprehensive plugin compatibility assessment with AI-powered mapping, 
                    blocking issue detection, and migration guidance.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      AI-powered compatibility scoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Real-time blocking issue alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      GitLab equivalent recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Dry-Run Testing */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    GitLab Dry-Run Testing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Execute your converted GitLab CI pipelines in secure sandbox environments 
                    with comprehensive logging and AI analysis.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Secure sandbox execution
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Real-time pipeline monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Detailed job logs and warnings
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* AI Intelligence */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    AI-Powered Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Advanced AI analysis for plugin mapping, log interpretation, 
                    and intelligent migration recommendations.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Intelligent plugin mapping
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Smart error analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Migration readiness assessment
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Enterprise Security */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    Enterprise Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Built with enterprise security in mind including audit trails, 
                    access controls, and secure sandbox environments.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Complete audit trail
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Secure API access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Isolated testing environments
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Real-time Monitoring */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    Real-time Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Live monitoring of plugin analysis and dry-run executions 
                    with comprehensive reporting and filtering capabilities.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Live status updates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Advanced filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Export capabilities
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Performance Analytics */}
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-4">
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Detailed performance metrics and analytics to track 
                    migration success rates and optimization opportunities.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Migration success metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Performance benchmarking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Optimization recommendations
                    </li>
                  </ul>
                </CardContent>
              </Card>

            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 py-20">
            <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent>
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Migrate Your Jenkins Pipelines?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Upload your Jenkinsfile to start with enterprise-grade plugin analysis 
                  and dry-run testing powered by AI intelligence.
                </p>
                <div className="flex items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">Free Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">Instant Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">Enterprise Ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>

      </main>
    </>
  )
}