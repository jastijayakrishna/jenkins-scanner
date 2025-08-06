// Updated to test AI Plugin Intelligence System
import { AIPluginIntelligenceService } from '@/lib/ai-plugin-intelligence'
import { PluginVerdict } from '@/lib/plugin-mapper'
import type { PluginMatch } from '@/types'

describe('AI Plugin Intelligence', () => {
  let pluginIntelligence: AIPluginIntelligenceService

  beforeEach(() => {
    pluginIntelligence = new AIPluginIntelligenceService()
  })

  describe('analyzePlugin', () => {
    it('should analyze plugin compatibility and provide recommendations', async () => {
      const plugin: PluginMatch = {
        key: 'docker-workflow',
        name: 'Docker Pipeline',
        regex: /docker\./,
        category: 'build'
      }

      const result = await pluginIntelligence.analyzePlugin(plugin)
      
      expect(result).toBeDefined()
      expect(result.plugin).toEqual(plugin)
      expect(result.compatibility).toBeDefined()
      expect(result.alternatives).toBeDefined()
      expect(result.risks).toBeDefined()
      expect(result.migrationPath).toBeDefined()
      expect(result.aiRecommendations).toBeDefined()
    })

    it('should provide different recommendations for deprecated plugins', async () => {
      const deprecatedPlugin: PluginMatch = {
        key: 'deprecated-plugin',
        name: 'Deprecated Plugin',
        regex: /deprecated/,
        category: 'legacy'
      }

      const result = await pluginIntelligence.analyzePlugin(deprecatedPlugin)
      
      expect(result.compatibility.status).toBe('deprecated')
      expect(result.aiRecommendations).toBeDefined()
      expect(result.aiRecommendations.length).toBeGreaterThan(0)
    })

    it('should identify security risks for security-related plugins', async () => {
      const securityPlugin: PluginMatch = {
        key: 'credentials-binding',
        name: 'Credentials Binding',
        regex: /credentials/,
        category: 'security'
      }

      const result = await pluginIntelligence.analyzePlugin(securityPlugin)
      
      expect(result.risks).toBeDefined()
      const securityRisks = result.risks.filter(risk => risk.type === 'security')
      expect(securityRisks.length).toBeGreaterThan(0)
    })
  })

  describe('generateSmartRecommendations', () => {
    it('should generate recommendations based on plugin ecosystem', async () => {
      const plugins: PluginMatch[] = [
        { key: 'maven', name: 'Maven', regex: /maven/, category: 'build' },
        { key: 'sonarqube', name: 'SonarQube', regex: /sonar/, category: 'security' },
        { key: 'docker', name: 'Docker', regex: /docker/, category: 'deploy' }
      ]

      const recommendations = await pluginIntelligence.generateSmartRecommendations(plugins)
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should prioritize high-impact recommendations', async () => {
      const plugins: PluginMatch[] = [
        { key: 'high-risk-plugin', name: 'High Risk Plugin', regex: /risky/, category: 'legacy' }
      ]

      const recommendations = await pluginIntelligence.generateSmartRecommendations(plugins)
      
      const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high')
      expect(highPriorityRecs.length).toBeGreaterThan(0)
    })
  })

  describe('assessPluginCompatibility', () => {
    it('should assess compatibility for well-known plugins', async () => {
      const mavenPlugin: PluginMatch = {
        key: 'maven-integration',
        name: 'Maven Integration',
        regex: /maven/,
        category: 'build'
      }

      const compatibility = await pluginIntelligence.assessCompatibility(mavenPlugin)
      
      expect(compatibility).toBeDefined()
      expect(['active', 'maintenance', 'deprecated', 'abandoned']).toContain(compatibility.status)
      expect(compatibility.gitlabEquivalent).toBeDefined()
    })

    it('should handle unknown plugins gracefully', async () => {
      const unknownPlugin: PluginMatch = {
        key: 'unknown-plugin',
        name: 'Unknown Plugin',
        regex: /unknown/,
        category: 'unknown'
      }

      const compatibility = await pluginIntelligence.assessCompatibility(unknownPlugin)
      
      expect(compatibility).toBeDefined()
      expect(compatibility.status).toBeDefined()
    })
  })
})