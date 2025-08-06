/**
 * Real-time AI Suggestions System
 * Provides intelligent, contextual suggestions as users interact with the system
 */

import { ScanResult } from '@/types'
import { AIInsight } from './ai-core'

export interface RealTimeSuggestion {
  id: string
  type: 'optimization' | 'security' | 'best-practice' | 'warning' | 'tip'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  context: SuggestionContext
  action: SuggestionAction
  confidence: number
  relevanceScore: number
  timing: SuggestionTiming
  dismissible: boolean
  learnFromDismissal: boolean
}

export interface SuggestionContext {
  trigger: 'file-upload' | 'analysis-complete' | 'user-action' | 'time-based' | 'pattern-detected'
  scope: 'global' | 'pipeline' | 'plugin' | 'configuration' | 'security'
  relatedEntities: string[]
  userProfile: UserProfile
  sessionContext: SessionContext
}

export interface SuggestionAction {
  type: 'navigate' | 'configure' | 'optimize' | 'learn' | 'dismiss'
  label: string
  description: string
  url?: string
  callback?: string
  parameters?: Record<string, any>
  autoApply?: boolean
  requiresConfirmation?: boolean
}

export interface SuggestionTiming {
  showAfter?: number // milliseconds
  hideAfter?: number // milliseconds
  maxShownCount?: number
  cooldownPeriod?: number
  showOncePerSession?: boolean
}

export interface UserProfile {
  experience: 'beginner' | 'intermediate' | 'advanced'
  preferences: UserPreferences
  history: UserAction[]
  dismissedSuggestions: string[]
  completedActions: string[]
}

export interface UserPreferences {
  showOptimizationTips: boolean
  showSecurityWarnings: boolean
  showBestPractices: boolean
  suggestionFrequency: 'minimal' | 'normal' | 'frequent'
  autoApplyOptimizations: boolean
}

export interface SessionContext {
  startTime: Date
  currentPage: string
  actionsPerformed: string[]
  analysisResults?: ScanResult
  timeSpent: number
  interactionCount: number
}

export interface UserAction {
  type: string
  timestamp: Date
  context: string
  success: boolean
}

/**
 * Real-time AI Suggestions Engine
 */
export class RealTimeSuggestionsEngine {
  private suggestionRules: Map<string, SuggestionRule> = new Map()
  private activeSuggestions: Map<string, RealTimeSuggestion> = new Map()
  private userProfiles: Map<string, UserProfile> = new Map()
  private learningEngine: SuggestionLearningEngine
  private contextTracker: ContextTracker

  constructor() {
    this.learningEngine = new SuggestionLearningEngine()
    this.contextTracker = new ContextTracker()
    this.initializeSuggestionRules()
  }

  /**
   * Generate real-time suggestions based on current context
   */
  async generateSuggestions(
    userId: string,
    context: SuggestionContext,
    data?: any
  ): Promise<RealTimeSuggestion[]> {
    
    const userProfile = this.getUserProfile(userId)
    const applicableRules = this.getApplicableRules(context, userProfile)
    const suggestions: RealTimeSuggestion[] = []

    for (const rule of applicableRules) {
      if (await this.shouldTriggerRule(rule, context, userProfile, data)) {
        const suggestion = await this.createSuggestion(rule, context, userProfile, data)
        if (suggestion && this.isRelevant(suggestion, userProfile)) {
          suggestions.push(suggestion)
        }
      }
    }

    // Rank suggestions by relevance and priority
    const rankedSuggestions = this.rankSuggestions(suggestions, userProfile)
    
    // Apply learning and filtering
    const filteredSuggestions = await this.learningEngine.filterSuggestions(
      rankedSuggestions, userProfile
    )

    // Update active suggestions
    filteredSuggestions.forEach(suggestion => {
      this.activeSuggestions.set(suggestion.id, suggestion)
    })

    return filteredSuggestions
  }

  /**
   * Process user interaction with suggestions
   */
  async processSuggestionInteraction(
    userId: string,
    suggestionId: string,
    action: 'viewed' | 'clicked' | 'dismissed' | 'applied'
  ): Promise<void> {
    
    const userProfile = this.getUserProfile(userId)
    const suggestion = this.activeSuggestions.get(suggestionId)

    if (!suggestion) return

    // Record interaction
    userProfile.history.push({
      type: `suggestion-${action}`,
      timestamp: new Date(),
      context: suggestionId,
      success: action === 'applied'
    })

    // Handle dismissal
    if (action === 'dismissed' && suggestion.learnFromDismissal) {
      userProfile.dismissedSuggestions.push(suggestionId)
      await this.learningEngine.learnFromDismissal(suggestion, userProfile)
    }

    // Handle application
    if (action === 'applied') {
      userProfile.completedActions.push(suggestionId)
      await this.learningEngine.learnFromApplication(suggestion, userProfile)
    }

    // Update user profile
    this.updateUserProfile(userId, userProfile)
  }

  /**
   * Initialize suggestion rules
   */
  private initializeSuggestionRules(): void {
    // File upload suggestions
    this.suggestionRules.set('upload-optimization', {
      id: 'upload-optimization',
      name: 'Upload Optimization Tips',
      trigger: 'file-upload',
      conditions: [
        { field: 'fileSize', operator: '>', value: 50000 },
        { field: 'userExperience', operator: '=', value: 'beginner' }
      ],
      suggestion: {
        type: 'tip',
        priority: 'low',
        title: 'Optimize Your Jenkinsfile',
        description: 'Large Jenkinsfiles can be complex to analyze. Consider breaking them into smaller, reusable components.',
        actionType: 'learn',
        confidence: 0.8
      },
      timing: { showAfter: 2000, maxShownCount: 3 }
    })

    // Security suggestions
    this.suggestionRules.set('security-hardcoded-secrets', {
      id: 'security-hardcoded-secrets',
      name: 'Hardcoded Secrets Detection',
      trigger: 'pattern-detected',
      conditions: [
        { field: 'patternType', operator: '=', value: 'hardcoded-secret' }
      ],
      suggestion: {
        type: 'security',
        priority: 'critical',
        title: 'Hardcoded Secrets Detected',
        description: 'Your pipeline contains hardcoded secrets. This poses a serious security risk.',
        actionType: 'optimize',
        confidence: 0.95
      },
      timing: { showAfter: 0, hideAfter: 30000 }
    })

    // Performance optimization suggestions
    this.suggestionRules.set('performance-parallelization', {
      id: 'performance-parallelization',
      name: 'Parallelization Opportunities',
      trigger: 'analysis-complete',
      conditions: [
        { field: 'parallelizableStages', operator: '>', value: 2 },
        { field: 'currentParallelization', operator: '=', value: false }
      ],
      suggestion: {
        type: 'optimization',
        priority: 'medium',
        title: 'Speed Up Your Pipeline',
        description: 'Your pipeline has stages that can run in parallel, potentially reducing build time by 30-50%.',
        actionType: 'optimize',
        confidence: 0.85
      },
      timing: { showAfter: 1000, cooldownPeriod: 3600000 } // 1 hour cooldown
    })

    // Best practice suggestions
    this.suggestionRules.set('best-practice-documentation', {
      id: 'best-practice-documentation',
      name: 'Pipeline Documentation',
      trigger: 'analysis-complete',
      conditions: [
        { field: 'hasDocumentation', operator: '=', value: false },
        { field: 'pipelineComplexity', operator: '>', value: 'moderate' }
      ],
      suggestion: {
        type: 'best-practice',
        priority: 'low',
        title: 'Add Pipeline Documentation',
        description: 'Complex pipelines benefit from inline documentation for better maintainability.',
        actionType: 'configure',
        confidence: 0.7
      },
      timing: { showAfter: 5000, maxShownCount: 2 }
    })

    // Migration readiness suggestions
    this.suggestionRules.set('migration-preparation', {
      id: 'migration-preparation',
      name: 'Migration Preparation',
      trigger: 'analysis-complete',
      conditions: [
        { field: 'migrationReadiness', operator: '=', value: 'needs-preparation' }
      ],
      suggestion: {
        type: 'optimization',
        priority: 'high',
        title: 'Prepare for Migration',
        description: 'Your pipeline needs some preparation before migration. Would you like to see specific recommendations?',
        actionType: 'navigate',
        confidence: 0.9
      },
      timing: { showAfter: 2000 }
    })

    // Plugin compatibility suggestions
    this.suggestionRules.set('plugin-alternatives', {
      id: 'plugin-alternatives',
      name: 'Plugin Alternatives',
      trigger: 'analysis-complete',
      conditions: [
        { field: 'deprecatedPlugins', operator: '>', value: 0 }
      ],
      suggestion: {
        type: 'warning',
        priority: 'high',
        title: 'Deprecated Plugins Found',
        description: 'Some of your plugins are deprecated. View modern alternatives for better security and performance.',
        actionType: 'navigate',
        confidence: 0.9
      },
      timing: { showAfter: 1500 }
    })

    // User experience suggestions
    this.suggestionRules.set('feature-discovery', {
      id: 'feature-discovery',
      name: 'Feature Discovery',
      trigger: 'time-based',
      conditions: [
        { field: 'sessionTime', operator: '>', value: 300000 }, // 5 minutes
        { field: 'userExperience', operator: '=', value: 'beginner' },
        { field: 'featuresUsed', operator: '<', value: 3 }
      ],
      suggestion: {
        type: 'tip',
        priority: 'low',
        title: 'Discover More Features',
        description: 'Did you know you can generate GitLab CI/CD configuration automatically? Try the conversion feature.',
        actionType: 'learn',
        confidence: 0.6
      },
      timing: { showAfter: 0, showOncePerSession: true }
    })
  }

  /**
   * Get user profile with defaults
   */
  private getUserProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        experience: 'intermediate',
        preferences: {
          showOptimizationTips: true,
          showSecurityWarnings: true,
          showBestPractices: true,
          suggestionFrequency: 'normal',
          autoApplyOptimizations: false
        },
        history: [],
        dismissedSuggestions: [],
        completedActions: []
      })
    }
    return this.userProfiles.get(userId)!
  }

  /**
   * Get applicable rules based on context and user profile
   */
  private getApplicableRules(
    context: SuggestionContext,
    userProfile: UserProfile
  ): SuggestionRule[] {
    const rules: SuggestionRule[] = []

    for (const rule of this.suggestionRules.values()) {
      if (rule.trigger === context.trigger) {
        // Check user preferences
        if (this.matchesUserPreferences(rule, userProfile)) {
          rules.push(rule)
        }
      }
    }

    return rules
  }

  /**
   * Check if rule matches user preferences
   */
  private matchesUserPreferences(rule: SuggestionRule, userProfile: UserProfile): boolean {
    const { preferences } = userProfile

    switch (rule.suggestion.type) {
      case 'optimization':
        return preferences.showOptimizationTips
      case 'security':
        return preferences.showSecurityWarnings
      case 'best-practice':
        return preferences.showBestPractices
      default:
        return true
    }
  }

  /**
   * Check if rule should be triggered
   */
  private async shouldTriggerRule(
    rule: SuggestionRule,
    context: SuggestionContext,
    userProfile: UserProfile,
    data?: any
  ): Promise<boolean> {
    // Check if suggestion was recently dismissed
    if (userProfile.dismissedSuggestions.includes(rule.id)) {
      return false
    }

    // Check cooldown period
    if (rule.timing.cooldownPeriod) {
      const lastShown = this.getLastShownTime(rule.id, userProfile)
      if (lastShown && Date.now() - lastShown < rule.timing.cooldownPeriod) {
        return false
      }
    }

    // Check max shown count
    if (rule.timing.maxShownCount) {
      const shownCount = this.getShownCount(rule.id, userProfile)
      if (shownCount >= rule.timing.maxShownCount) {
        return false
      }
    }

    // Check conditions
    return this.evaluateConditions(rule.conditions, context, data)
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(
    conditions: RuleCondition[],
    context: SuggestionContext,
    data?: any
  ): boolean {
    return conditions.every(condition => {
      const value = this.getContextValue(condition.field, context, data)
      return this.evaluateCondition(value, condition.operator, condition.value)
    })
  }

  /**
   * Get context value for condition evaluation
   */
  private getContextValue(field: string, context: SuggestionContext, data?: any): any {
    switch (field) {
      case 'fileSize':
        return data?.fileSize || 0
      case 'userExperience':
        return context.userProfile.experience
      case 'parallelizableStages':
        return data?.parallelizableStages || 0
      case 'currentParallelization':
        return data?.hasParallelization || false
      case 'hasDocumentation':
        return data?.hasDocumentation || false
      case 'pipelineComplexity':
        return data?.complexity || 'simple'
      case 'migrationReadiness':
        return data?.migrationReadiness || 'unknown'
      case 'deprecatedPlugins':
        return data?.deprecatedPlugins || 0
      case 'sessionTime':
        return context.sessionContext.timeSpent
      case 'featuresUsed':
        return context.sessionContext.interactionCount
      case 'patternType':
        return data?.patternType
      default:
        return undefined
    }
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '=':
        return value === expected
      case '!=':
        return value !== expected
      case '>':
        return value > expected
      case '<':
        return value < expected
      case '>=':
        return value >= expected
      case '<=':
        return value <= expected
      case 'contains':
        return Array.isArray(value) && value.includes(expected)
      default:
        return false
    }
  }

  /**
   * Create suggestion from rule
   */
  private async createSuggestion(
    rule: SuggestionRule,
    context: SuggestionContext,
    userProfile: UserProfile,
    data?: any
  ): Promise<RealTimeSuggestion | null> {
    
    const relevanceScore = await this.calculateRelevanceScore(rule, context, userProfile, data)
    
    if (relevanceScore < 0.3) {
      return null // Too low relevance
    }

    return {
      id: `${rule.id}-${Date.now()}`,
      type: rule.suggestion.type,
      priority: rule.suggestion.priority,
      title: rule.suggestion.title,
      description: this.personalizeDescription(rule.suggestion.description, userProfile, data),
      context,
      action: {
        type: rule.suggestion.actionType,
        label: this.getActionLabel(rule.suggestion.actionType),
        description: 'Take action on this suggestion',
        autoApply: rule.suggestion.actionType === 'optimize' && userProfile.preferences.autoApplyOptimizations,
        requiresConfirmation: rule.suggestion.priority === 'critical'
      },
      confidence: rule.suggestion.confidence,
      relevanceScore,
      timing: rule.timing,
      dismissible: rule.suggestion.priority !== 'critical',
      learnFromDismissal: true
    }
  }

  /**
   * Calculate relevance score
   */
  private async calculateRelevanceScore(
    rule: SuggestionRule,
    context: SuggestionContext,
    userProfile: UserProfile,
    data?: any
  ): Promise<number> {
    let score = rule.suggestion.confidence

    // Adjust based on user experience
    if (rule.suggestion.type === 'tip' && userProfile.experience === 'advanced') {
      score *= 0.5 // Advanced users need fewer tips
    }

    // Adjust based on context relevance
    if (context.scope === rule.suggestion.type) {
      score *= 1.2 // Higher relevance for matching scope
    }

    // Adjust based on timing
    if (context.sessionContext.timeSpent > 600000) { // 10 minutes
      score *= 0.8 // Lower priority for long sessions
    }

    return Math.min(1, Math.max(0, score))
  }

  /**
   * Check if suggestion is relevant to user
   */
  private isRelevant(suggestion: RealTimeSuggestion, userProfile: UserProfile): boolean {
    // Check suggestion frequency preference
    const frequency = userProfile.preferences.suggestionFrequency
    
    switch (frequency) {
      case 'minimal':
        return suggestion.priority === 'critical' || suggestion.priority === 'high'
      case 'normal':
        return suggestion.priority !== 'low' || suggestion.relevanceScore > 0.7
      case 'frequent':
        return suggestion.relevanceScore > 0.3
      default:
        return true
    }
  }

  /**
   * Rank suggestions by priority and relevance
   */
  private rankSuggestions(
    suggestions: RealTimeSuggestion[],
    userProfile: UserProfile
  ): RealTimeSuggestion[] {
    return suggestions.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      
      const scoreA = priorityWeight[a.priority] * a.relevanceScore * a.confidence
      const scoreB = priorityWeight[b.priority] * b.relevanceScore * b.confidence
      
      return scoreB - scoreA
    })
  }

  /**
   * Personalize suggestion description
   */
  private personalizeDescription(
    description: string,
    userProfile: UserProfile,
    data?: any
  ): string {
    let personalized = description

    // Add specific values where available
    if (data?.parallelizableStages && description.includes('stages')) {
      personalized = personalized.replace('stages', `${data.parallelizableStages} stages`)
    }

    if (data?.deprecatedPlugins && description.includes('plugins')) {
      personalized = personalized.replace('plugins', `${data.deprecatedPlugins} plugins`)
    }

    // Adjust tone based on user experience
    if (userProfile.experience === 'beginner') {
      personalized += ' (This is a common optimization that can significantly improve your pipeline.)'
    }

    return personalized
  }

  /**
   * Get action label
   */
  private getActionLabel(actionType: string): string {
    const labels = {
      navigate: 'View Details',
      configure: 'Configure',
      optimize: 'Apply Optimization',
      learn: 'Learn More',
      dismiss: 'Dismiss'
    }
    return labels[actionType as keyof typeof labels] || 'Take Action'
  }

  private getLastShownTime(ruleId: string, userProfile: UserProfile): number | null {
    const lastAction = userProfile.history
      .filter(h => h.context === ruleId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    return lastAction ? lastAction.timestamp.getTime() : null
  }

  private getShownCount(ruleId: string, userProfile: UserProfile): number {
    return userProfile.history.filter(h => h.context === ruleId).length
  }

  private updateUserProfile(userId: string, profile: UserProfile): void {
    this.userProfiles.set(userId, profile)
  }
}

class SuggestionLearningEngine {
  async filterSuggestions(
    suggestions: RealTimeSuggestion[],
    userProfile: UserProfile
  ): Promise<RealTimeSuggestion[]> {
    // Apply machine learning-based filtering
    return suggestions.filter(suggestion => {
      // Don't show suggestions that were frequently dismissed
      const dismissalRate = this.calculateDismissalRate(suggestion.type, userProfile)
      if (dismissalRate > 0.8) {
        return false
      }

      return true
    })
  }

  async learnFromDismissal(suggestion: RealTimeSuggestion, userProfile: UserProfile): Promise<void> {
    // Learn from user dismissals to improve future suggestions
    // This would connect to a ML model in production
    console.log('Learning from dismissal:', suggestion.type, userProfile.experience)
  }

  async learnFromApplication(suggestion: RealTimeSuggestion, userProfile: UserProfile): Promise<void> {
    // Learn from successful applications
    console.log('Learning from application:', suggestion.type, userProfile.experience)
  }

  private calculateDismissalRate(suggestionType: string, userProfile: UserProfile): number {
    const relevant = userProfile.history.filter(h => h.type.includes(suggestionType))
    const dismissed = relevant.filter(h => h.type.includes('dismissed'))
    
    return relevant.length > 0 ? dismissed.length / relevant.length : 0
  }
}

class ContextTracker {
  private contexts: Map<string, SessionContext> = new Map()

  trackContext(userId: string, page: string, action?: string): SessionContext {
    let context = this.contexts.get(userId)
    
    if (!context) {
      context = {
        startTime: new Date(),
        currentPage: page,
        actionsPerformed: [],
        timeSpent: 0,
        interactionCount: 0
      }
    }

    context.currentPage = page
    context.timeSpent = Date.now() - context.startTime.getTime()
    
    if (action) {
      context.actionsPerformed.push(action)
      context.interactionCount++
    }

    this.contexts.set(userId, context)
    return context
  }

  getContext(userId: string): SessionContext | undefined {
    return this.contexts.get(userId)
  }
}

// Supporting interfaces
interface SuggestionRule {
  id: string
  name: string
  trigger: SuggestionContext['trigger']
  conditions: RuleCondition[]
  suggestion: {
    type: RealTimeSuggestion['type']
    priority: RealTimeSuggestion['priority']
    title: string
    description: string
    actionType: SuggestionAction['type']
    confidence: number
  }
  timing: SuggestionTiming
}

interface RuleCondition {
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains'
  value: any
}

// Export singleton instance
export const realTimeSuggestionsEngine = new RealTimeSuggestionsEngine()