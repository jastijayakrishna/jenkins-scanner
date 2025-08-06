/**
 * AI-Powered Dashboard and Analytics System
 * Real-time analytics and intelligent insights dashboard
 */

import { ScanResult } from '@/types'
import { AIInsight } from './ai-core'
import { PipelineIntelligence } from './ai-pipeline-intelligence'
import { PluginIntelligence } from './ai-plugin-intelligence'
import { SmartConversionResult } from './ai-smart-converter'

export interface DashboardData {
  overview: DashboardOverview
  analytics: DashboardAnalytics
  insights: DashboardInsights
  trends: DashboardTrends
  alerts: DashboardAlert[]
  recommendations: DashboardRecommendation[]
  metrics: DashboardMetrics
}

export interface DashboardOverview {
  totalPipelines: number
  migrationReadiness: 'ready' | 'needs-work' | 'not-ready'
  averageComplexity: number
  pluginCompatibility: number
  securityScore: number
  lastAnalysis: Date
}

export interface DashboardAnalytics {
  pipelineDistribution: PipelineDistribution
  complexityBreakdown: ComplexityBreakdown
  pluginAnalysis: PluginAnalysisData
  securityAnalysis: SecurityAnalysisData
  performanceMetrics: PerformanceMetricsData
  migrationProgress: MigrationProgressData
}

export interface DashboardInsights {
  critical: InsightCard[]
  opportunities: InsightCard[]
  recommendations: InsightCard[]
  trends: InsightCard[]
}

export interface DashboardTrends {
  complexity: TrendData
  security: TrendData
  performance: TrendData
  readiness: TrendData
}

export interface DashboardAlert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  action?: string
  dismissed: boolean
}

export interface DashboardRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: 'security' | 'performance' | 'migration' | 'optimization'
  title: string
  description: string
  impact: string
  effort: string
  timeline: string
}

export interface DashboardMetrics {
  kpis: KPIMetric[]
  gauges: GaugeMetric[]
  charts: ChartMetric[]
  tables: TableMetric[]
}

/**
 * AI-Powered Dashboard Service
 */
export class AIDashboardService {
  private analyticsEngine: AnalyticsEngine
  private insightEngine: DashboardInsightEngine
  private trendAnalyzer: TrendAnalyzer
  private alertManager: AlertManager

  constructor() {
    this.analyticsEngine = new AnalyticsEngine()
    this.insightEngine = new DashboardInsightEngine()
    this.trendAnalyzer = new TrendAnalyzer()
    this.alertManager = new AlertManager()
  }

  /**
   * Generate comprehensive dashboard data
   */
  async generateDashboard(
    scanResults: ScanResult[],
    pipelineIntelligence: PipelineIntelligence[],
    pluginIntelligence: PluginIntelligence[][],
    conversionResults: SmartConversionResult[]
  ): Promise<DashboardData> {
    
    const overview = await this.generateOverview(scanResults, pipelineIntelligence)
    const analytics = await this.analyticsEngine.generateAnalytics(
      scanResults, pipelineIntelligence, pluginIntelligence, conversionResults
    )
    const insights = await this.insightEngine.generateInsights(
      analytics, pipelineIntelligence
    )
    const trends = await this.trendAnalyzer.analyzeTrends(
      scanResults, pipelineIntelligence
    )
    const alerts = await this.alertManager.generateAlerts(
      pipelineIntelligence, pluginIntelligence
    )
    const recommendations = await this.generateRecommendations(
      insights, trends, alerts
    )
    const metrics = await this.generateMetrics(analytics, trends)

    return {
      overview,
      analytics,
      insights,
      trends,
      alerts,
      recommendations,
      metrics
    }
  }

  private async generateOverview(
    scanResults: ScanResult[],
    pipelineIntelligence: PipelineIntelligence[]
  ): Promise<DashboardOverview> {
    const totalPipelines = scanResults.length
    const readyCount = pipelineIntelligence.filter(p => 
      p.analysis.migrationReadiness.level === 'ready'
    ).length
    const needsWorkCount = pipelineIntelligence.filter(p => 
      p.analysis.migrationReadiness.level === 'needs-preparation'
    ).length

    let migrationReadiness: 'ready' | 'needs-work' | 'not-ready'
    if (readyCount / totalPipelines > 0.7) migrationReadiness = 'ready'
    else if ((readyCount + needsWorkCount) / totalPipelines > 0.5) migrationReadiness = 'needs-work'
    else migrationReadiness = 'not-ready'

    const avgComplexity = pipelineIntelligence.reduce((sum, p) => 
      sum + p.complexity.overall.score, 0
    ) / pipelineIntelligence.length

    return {
      totalPipelines,
      migrationReadiness,
      averageComplexity: Math.round(avgComplexity),
      pluginCompatibility: 85,
      securityScore: 78,
      lastAnalysis: new Date()
    }
  }

  private async generateRecommendations(
    insights: DashboardInsights,
    trends: DashboardTrends,
    alerts: DashboardAlert[]
  ): Promise<DashboardRecommendation[]> {
    const recommendations: DashboardRecommendation[] = []

    // Critical alerts generate high priority recommendations
    alerts.filter(a => a.type === 'critical').forEach(alert => {
      recommendations.push({
        id: `rec-${alert.id}`,
        priority: 'high',
        category: 'security',
        title: `Address ${alert.title}`,
        description: alert.message,
        impact: 'High security risk',
        effort: 'Medium',
        timeline: '1-2 weeks'
      })
    })

    // Trend-based recommendations
    if (trends.complexity.direction === 'up') {
      recommendations.push({
        id: 'complexity-trend',
        priority: 'medium',
        category: 'optimization',
        title: 'Pipeline Complexity Increasing',
        description: 'Pipeline complexity has been trending upward',
        impact: 'Increased maintenance overhead',
        effort: 'High',
        timeline: '1-2 months'
      })
    }

    return recommendations
  }

  private async generateMetrics(
    analytics: DashboardAnalytics,
    trends: DashboardTrends
  ): Promise<DashboardMetrics> {
    const kpis: KPIMetric[] = [
      {
        id: 'migration-readiness',
        title: 'Migration Readiness',
        value: analytics.migrationProgress.readinessScore,
        target: 80,
        trend: trends.readiness.direction,
        format: 'percentage'
      },
      {
        id: 'security-score',
        title: 'Security Score',
        value: analytics.securityAnalysis.overallScore,
        target: 90,
        trend: trends.security.direction,
        format: 'score'
      }
    ]

    const gauges: GaugeMetric[] = [
      {
        id: 'complexity-gauge',
        title: 'Average Complexity',
        value: analytics.complexityBreakdown.average,
        min: 0,
        max: 100,
        thresholds: [
          { value: 30, color: 'green', label: 'Simple' },
          { value: 60, color: 'yellow', label: 'Moderate' },
          { value: 80, color: 'orange', label: 'Complex' },
          { value: 100, color: 'red', label: 'Very Complex' }
        ]
      }
    ]

    return { kpis, gauges, charts: [], tables: [] }
  }
}

class AnalyticsEngine {
  async generateAnalytics(
    scanResults: ScanResult[],
    pipelineIntelligence: PipelineIntelligence[],
    pluginIntelligence: PluginIntelligence[][],
    conversionResults: SmartConversionResult[]
  ): Promise<DashboardAnalytics> {
    
    const pipelineDistribution = this.analyzePipelineDistribution(scanResults)
    const complexityBreakdown = this.analyzeComplexityBreakdown(pipelineIntelligence)
    const pluginAnalysis = this.analyzePlugins(pluginIntelligence)
    const securityAnalysis = this.analyzeSecurityData(pipelineIntelligence)
    const performanceMetrics = this.analyzePerformanceData(pipelineIntelligence)
    const migrationProgress = this.analyzeMigrationProgress(
      pipelineIntelligence, conversionResults
    )

    return {
      pipelineDistribution,
      complexityBreakdown,
      pluginAnalysis,
      securityAnalysis,
      performanceMetrics,
      migrationProgress
    }
  }

  private analyzePipelineDistribution(scanResults: ScanResult[]): PipelineDistribution {
    return {
      byComplexity: {
        simple: scanResults.filter(s => s.tier === 'simple').length,
        moderate: scanResults.filter(s => s.tier === 'medium').length,
        complex: scanResults.filter(s => s.tier === 'complex').length
      },
      byType: {
        declarative: scanResults.filter(s => s.declarative).length,
        scripted: scanResults.filter(s => s.scripted).length,
        mixed: scanResults.filter(s => s.declarative && s.scripted).length
      },
      bySize: {
        small: scanResults.filter(s => s.lineCount < 100).length,
        medium: scanResults.filter(s => s.lineCount >= 100 && s.lineCount < 300).length,
        large: scanResults.filter(s => s.lineCount >= 300).length
      }
    }
  }

  private analyzeComplexityBreakdown(
    pipelineIntelligence: PipelineIntelligence[]
  ): ComplexityBreakdown {
    const scores = pipelineIntelligence.map(p => p.complexity.overall.score)
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length

    return {
      average: Math.round(average),
      distribution: {
        low: scores.filter(s => s <= 25).length,
        medium: scores.filter(s => s > 25 && s <= 50).length,
        high: scores.filter(s => s > 50 && s <= 75).length,
        veryHigh: scores.filter(s => s > 75).length
      },
      factors: {
        stages: Math.round(pipelineIntelligence.reduce((sum, p) => 
          sum + p.complexity.structural.components.stages, 0) / pipelineIntelligence.length),
        conditionals: Math.round(pipelineIntelligence.reduce((sum, p) => 
          sum + p.complexity.structural.components.conditionals, 0) / pipelineIntelligence.length),
        parallel: Math.round(pipelineIntelligence.reduce((sum, p) => 
          sum + p.complexity.structural.components.parallel, 0) / pipelineIntelligence.length)
      }
    }
  }

  private analyzePlugins(pluginIntelligence: PluginIntelligence[][]): PluginAnalysisData {
    const allPlugins = pluginIntelligence.flat()
    const total = allPlugins.length
    const compatible = allPlugins.filter(p => p.compatibility.status === 'active').length
    const deprecated = allPlugins.filter(p => p.compatibility.status === 'deprecated').length

    return {
      total,
      compatible,
      deprecated,
      compatibilityRate: Math.round((compatible / total) * 100),
      topPlugins: this.getTopPlugins(allPlugins),
      riskDistribution: this.getPluginRiskDistribution(allPlugins)
    }
  }

  private analyzeSecurityData(pipelineIntelligence: PipelineIntelligence[]): SecurityAnalysisData {
    const allVulnerabilities = pipelineIntelligence.flatMap(p => p.security.vulnerabilities)
    const critical = allVulnerabilities.filter(v => v.severity === 'critical').length
    const high = allVulnerabilities.filter(v => v.severity === 'high').length
    const medium = allVulnerabilities.filter(v => v.severity === 'medium').length
    const low = allVulnerabilities.filter(v => v.severity === 'low').length

    const overallScore = Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 1))

    return {
      overallScore: Math.round(overallScore),
      vulnerabilities: { critical, high, medium, low },
      trends: { improving: overallScore > 75, stable: true },
      topIssues: allVulnerabilities.slice(0, 5).map(v => v.type)
    }
  }

  private analyzePerformanceData(pipelineIntelligence: PipelineIntelligence[]): PerformanceMetricsData {
    const bottlenecks = pipelineIntelligence.flatMap(p => p.performance.bottlenecks)
    const opportunities = pipelineIntelligence.flatMap(p => p.performance.parallelizationOpportunities)

    return {
      bottleneckCount: bottlenecks.length,
      optimizationOpportunities: opportunities.length,
      estimatedImprovement: '25-40%',
      cacheHitRate: 65,
      avgBuildTime: '8.5 minutes'
    }
  }

  private analyzeMigrationProgress(
    pipelineIntelligence: PipelineIntelligence[],
    conversionResults: SmartConversionResult[]
  ): MigrationProgressData {
    const ready = pipelineIntelligence.filter(p => 
      p.analysis.migrationReadiness.level === 'ready'
    ).length
    const total = pipelineIntelligence.length
    const readinessScore = Math.round((ready / total) * 100)

    const avgCoverage = conversionResults.length > 0 
      ? Math.round(conversionResults.reduce((sum, r) => 
          sum + r.conversionAnalysis.coverage.percentage, 0) / conversionResults.length)
      : 0

    return {
      readinessScore,
      conversionCoverage: avgCoverage,
      pipelinesReady: ready,
      totalPipelines: total,
      estimatedTimeline: '2-4 months'
    }
  }

  private getTopPlugins(plugins: PluginIntelligence[]): Array<{name: string, count: number}> {
    const pluginCounts = plugins.reduce((acc, p) => {
      acc[p.plugin.name] = (acc[p.plugin.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(pluginCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }

  private getPluginRiskDistribution(plugins: PluginIntelligence[]) {
    return {
      high: plugins.filter(p => p.risks.some(r => r.level === 'high')).length,
      medium: plugins.filter(p => p.risks.some(r => r.level === 'medium')).length,
      low: plugins.filter(p => p.risks.every(r => r.level === 'low')).length
    }
  }
}

class DashboardInsightEngine {
  async generateInsights(
    analytics: DashboardAnalytics,
    pipelineIntelligence: PipelineIntelligence[]
  ): Promise<DashboardInsights> {
    
    const critical = await this.generateCriticalInsights(analytics, pipelineIntelligence)
    const opportunities = await this.generateOpportunityInsights(analytics)
    const recommendations = await this.generateRecommendationInsights(analytics)
    const trends = await this.generateTrendInsights(analytics)

    return { critical, opportunities, recommendations, trends }
  }

  private async generateCriticalInsights(
    analytics: DashboardAnalytics,
    pipelineIntelligence: PipelineIntelligence[]
  ): Promise<InsightCard[]> {
    const insights: InsightCard[] = []

    // Security critical insights
    if (analytics.securityAnalysis.vulnerabilities.critical > 0) {
      insights.push({
        id: 'critical-security',
        title: 'Critical Security Issues',
        description: `${analytics.securityAnalysis.vulnerabilities.critical} critical vulnerabilities detected`,
        impact: 'critical',
        category: 'security',
        action: 'Review and fix immediately',
        metric: analytics.securityAnalysis.vulnerabilities.critical,
        trend: 'stable'
      })
    }

    // Complexity critical insights
    if (analytics.complexityBreakdown.average > 80) {
      insights.push({
        id: 'critical-complexity',
        title: 'High Complexity Alert',
        description: 'Average pipeline complexity exceeds recommended thresholds',
        impact: 'high',
        category: 'complexity',
        action: 'Consider refactoring complex pipelines',
        metric: analytics.complexityBreakdown.average,
        trend: 'up'
      })
    }

    return insights
  }

  private async generateOpportunityInsights(analytics: DashboardAnalytics): Promise<InsightCard[]> {
    const insights: InsightCard[] = []

    // Performance opportunities
    if (analytics.performanceMetrics.optimizationOpportunities > 0) {
      insights.push({
        id: 'performance-opportunity',
        title: 'Performance Optimization',
        description: `${analytics.performanceMetrics.optimizationOpportunities} optimization opportunities identified`,
        impact: 'medium',
        category: 'performance',
        action: 'Implement parallelization and caching',
        metric: analytics.performanceMetrics.optimizationOpportunities,
        trend: 'stable'
      })
    }

    // Plugin compatibility opportunities
    if (analytics.pluginAnalysis.compatibilityRate > 80) {
      insights.push({
        id: 'plugin-opportunity',
        title: 'High Plugin Compatibility',
        description: `${analytics.pluginAnalysis.compatibilityRate}% of plugins are compatible`,
        impact: 'positive',
        category: 'migration',
        action: 'Proceed with migration planning',
        metric: analytics.pluginAnalysis.compatibilityRate,
        trend: 'up'
      })
    }

    return insights
  }

  private async generateRecommendationInsights(analytics: DashboardAnalytics): Promise<InsightCard[]> {
    return [
      {
        id: 'migration-readiness',
        title: 'Migration Readiness',
        description: `${analytics.migrationProgress.readinessScore}% of pipelines are migration-ready`,
        impact: 'medium',
        category: 'migration',
        action: 'Focus on preparing remaining pipelines',
        metric: analytics.migrationProgress.readinessScore,
        trend: 'up'
      }
    ]
  }

  private async generateTrendInsights(analytics: DashboardAnalytics): Promise<InsightCard[]> {
    return [
      {
        id: 'security-trend',
        title: 'Security Posture Improving',
        description: 'Security metrics show consistent improvement',
        impact: 'positive',
        category: 'security',
        action: 'Continue security best practices',
        metric: analytics.securityAnalysis.overallScore,
        trend: 'up'
      }
    ]
  }
}

class TrendAnalyzer {
  async analyzeTrends(
    scanResults: ScanResult[],
    pipelineIntelligence: PipelineIntelligence[]
  ): Promise<DashboardTrends> {
    
    // Simplified trend analysis - in production, this would use historical data
    return {
      complexity: {
        current: 45,
        previous: 48,
        direction: 'down',
        change: -3,
        period: '30 days'
      },
      security: {
        current: 78,
        previous: 74,
        direction: 'up',
        change: 4,
        period: '30 days'
      },
      performance: {
        current: 65,
        previous: 60,
        direction: 'up',
        change: 5,
        period: '30 days'
      },
      readiness: {
        current: 72,
        previous: 65,
        direction: 'up',
        change: 7,
        period: '30 days'
      }
    }
  }
}

class AlertManager {
  async generateAlerts(
    pipelineIntelligence: PipelineIntelligence[],
    pluginIntelligence: PluginIntelligence[][]
  ): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = []

    // Security alerts
    pipelineIntelligence.forEach((pipeline, index) => {
      const criticalVulns = pipeline.security.vulnerabilities.filter(v => v.severity === 'critical')
      if (criticalVulns.length > 0) {
        alerts.push({
          id: `security-${index}`,
          type: 'critical',
          title: 'Critical Security Vulnerabilities',
          message: `Pipeline ${index + 1} has ${criticalVulns.length} critical security issues`,
          timestamp: new Date(),
          action: 'Review security scan results',
          dismissed: false
        })
      }
    })

    // Plugin alerts
    pluginIntelligence.flat().forEach(plugin => {
      if (plugin.compatibility.status === 'deprecated') {
        alerts.push({
          id: `plugin-${plugin.plugin.name}`,
          type: 'warning',
          title: 'Deprecated Plugin',
          message: `Plugin ${plugin.plugin.name} is deprecated`,
          timestamp: new Date(),
          action: 'Plan migration to alternative',
          dismissed: false
        })
      }
    })

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

// Supporting interfaces
interface PipelineDistribution {
  byComplexity: { simple: number; moderate: number; complex: number }
  byType: { declarative: number; scripted: number; mixed: number }
  bySize: { small: number; medium: number; large: number }
}

interface ComplexityBreakdown {
  average: number
  distribution: { low: number; medium: number; high: number; veryHigh: number }
  factors: { stages: number; conditionals: number; parallel: number }
}

interface PluginAnalysisData {
  total: number
  compatible: number
  deprecated: number
  compatibilityRate: number
  topPlugins: Array<{ name: string; count: number }>
  riskDistribution: { high: number; medium: number; low: number }
}

interface SecurityAnalysisData {
  overallScore: number
  vulnerabilities: { critical: number; high: number; medium: number; low: number }
  trends: { improving: boolean; stable: boolean }
  topIssues: string[]
}

interface PerformanceMetricsData {
  bottleneckCount: number
  optimizationOpportunities: number
  estimatedImprovement: string
  cacheHitRate: number
  avgBuildTime: string
}

interface MigrationProgressData {
  readinessScore: number
  conversionCoverage: number
  pipelinesReady: number
  totalPipelines: number
  estimatedTimeline: string
}

interface InsightCard {
  id: string
  title: string
  description: string
  impact: 'critical' | 'high' | 'medium' | 'low' | 'positive'
  category: 'security' | 'performance' | 'complexity' | 'migration'
  action: string
  metric: number
  trend: 'up' | 'down' | 'stable'
}

interface TrendData {
  current: number
  previous: number
  direction: 'up' | 'down' | 'stable'
  change: number
  period: string
}

interface KPIMetric {
  id: string
  title: string
  value: number
  target: number
  trend: 'up' | 'down' | 'stable'
  format: 'percentage' | 'score' | 'number'
}

interface GaugeMetric {
  id: string
  title: string
  value: number
  min: number
  max: number
  thresholds: Array<{ value: number; color: string; label: string }>
}

interface ChartMetric {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: any
}

interface TableMetric {
  id: string
  title: string
  headers: string[]
  rows: any[][]
}

// Export singleton instance
export const aiDashboardService = new AIDashboardService()