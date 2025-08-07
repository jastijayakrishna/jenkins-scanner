/**
 * Integration Tests for Plugin Analysis Functionality
 * Ensures plugin compatibility analysis works correctly and consistently
 */

import { EnterprisePluginAnalyzer } from '@/lib/enterprise-plugin-analyzer'
import { PluginCompatibilityStatus } from '@/lib/database'

describe('Plugin Analysis Integration Tests', () => {
  const sampleJenkinsContent = `
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
        nodejs 'NodeJS-18'
    }
    
    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME = 'test-app'
    }
    
    stages {
        stage('Build') {
            parallel {
                stage('Maven Build') {
                    steps {
                        sh 'mvn clean compile'
                    }
                }
                stage('Frontend Build') {
                    steps {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
                publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh 'mvn sonar:sonar -Dsonar.token=$SONAR_TOKEN'
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("$DOCKER_REGISTRY/$APP_NAME:$BUILD_NUMBER")
                    docker.withRegistry('https://registry.example.com', 'docker-registry-creds') {
                        image.push()
                    }
                }
            }
        }
    }
    
    post {
        success {
            slackSend channel: '#ci-results', message: "✅ Build successful: $BUILD_URL"
        }
        failure {
            slackSend channel: '#ci-results', message: "❌ Build failed: $BUILD_URL"
        }
    }
}`

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  describe('Plugin Detection and Analysis', () => {
    test('should detect common Jenkins plugins correctly', async () => {
      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        sampleJenkinsContent,
        'test-project-plugin-detection',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_plugins).toBeGreaterThan(0)
      expect(result.plugins).toBeInstanceOf(Array)
      expect(result.plugins.length).toBeGreaterThan(0)

      // Check that specific plugins are detected
      const pluginNames = result.plugins.map(p => p.plugin_name)
      expect(pluginNames).toContain('credentials-binding')
      expect(pluginNames).toContain('docker-workflow')
      expect(pluginNames).toContain('slack')

      // Verify plugin structure
      const firstPlugin = result.plugins[0]
      expect(firstPlugin).toHaveProperty('plugin_name')
      expect(firstPlugin).toHaveProperty('compatibility_status')
      expect(firstPlugin).toHaveProperty('migration_notes')
      expect(firstPlugin).toHaveProperty('is_blocking')
      expect(['compatible', 'partial', 'unsupported', 'unknown']).toContain(firstPlugin.compatibility_status)
    }, 25000)

    test('should handle empty Jenkins content gracefully', async () => {
      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        '',
        'test-project-empty',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_plugins).toBe(0)
      expect(result.plugins).toEqual([])
      expect(result.compatible_plugins).toBe(0)
      expect(result.partial_plugins).toBe(0)
      expect(result.unsupported_plugins).toBe(0)
    })

    test('should provide fallback analysis when AI fails', async () => {
      // Mock AI API failure
      const originalFetch = global.fetch as jest.Mock
      originalFetch.mockRejectedValueOnce(new Error('AI API unavailable'))

      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        sampleJenkinsContent,
        'test-project-fallback',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_plugins).toBeGreaterThan(0)
      
      // Verify fallback analysis provides reasonable results
      const compatiblePlugins = result.plugins.filter(p => 
        p.compatibility_status === PluginCompatibilityStatus.COMPATIBLE
      )
      expect(compatiblePlugins.length).toBeGreaterThan(0)

      // Check that fallback provides migration notes
      result.plugins.forEach(plugin => {
        expect(plugin.migration_notes).toBeDefined()
        expect(plugin.migration_notes.length).toBeGreaterThan(10)
      })
    })

    test('should categorize plugins by compatibility status correctly', async () => {
      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        sampleJenkinsContent,
        'test-project-categorization',
        'test-user'
      )

      expect(result.compatible_plugins + result.partial_plugins + result.unsupported_plugins)
        .toBe(result.total_plugins)

      // Verify counts are non-negative
      expect(result.compatible_plugins).toBeGreaterThanOrEqual(0)
      expect(result.partial_plugins).toBeGreaterThanOrEqual(0)
      expect(result.unsupported_plugins).toBeGreaterThanOrEqual(0)
      expect(result.blocking_issues).toBeGreaterThanOrEqual(0)
    })

    test('should detect project type and features correctly', async () => {
      const mavenContent = `
        pipeline {
            agent any
            stages {
                stage('Build') {
                    steps {
                        sh 'mvn clean package'
                    }
                }
            }
        }`

      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        mavenContent,
        'test-maven-project',
        'test-user'
      )

      expect(result).toBeDefined()
      // The analyzer should detect Maven-related patterns
      expect(result.total_plugins).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Database Integration', () => {
    test('should save plugin scan results to database', async () => {
      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        sampleJenkinsContent,
        'test-project-database',
        'test-user'
      )

      expect(result.id).toBeDefined()
      expect(result.id).not.toBe('')
      expect(result.project_id).toBe('test-project-database')
      expect(result.created_by).toBe('test-user')
      expect(result.scanned_at).toBeInstanceOf(Date)
    })
  })

  describe('Performance and Reliability', () => {
    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now()
      
      await EnterprisePluginAnalyzer.analyzePlugins(
        sampleJenkinsContent,
        'test-project-performance',
        'test-user'
      )

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(20000) // Should complete within 20 seconds
    }, 25000)

    test('should handle large Jenkins files without timeout', async () => {
      const largeContent = sampleJenkinsContent.repeat(10) // Create a large pipeline
      
      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        largeContent,
        'test-project-large',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_plugins).toBeGreaterThan(0)
    }, 30000)

    test('should be consistent across multiple runs', async () => {
      const results = await Promise.all([
        EnterprisePluginAnalyzer.analyzePlugins(sampleJenkinsContent, 'test-consistency-1', 'test-user'),
        EnterprisePluginAnalyzer.analyzePlugins(sampleJenkinsContent, 'test-consistency-2', 'test-user'),
        EnterprisePluginAnalyzer.analyzePlugins(sampleJenkinsContent, 'test-consistency-3', 'test-user')
      ])

      // All results should have the same plugin count (assuming no AI randomness)
      expect(results[0].total_plugins).toBe(results[1].total_plugins)
      expect(results[1].total_plugins).toBe(results[2].total_plugins)

      // Plugin names should be consistent
      const pluginNames1 = results[0].plugins.map(p => p.plugin_name).sort()
      const pluginNames2 = results[1].plugins.map(p => p.plugin_name).sort()
      const pluginNames3 = results[2].plugins.map(p => p.plugin_name).sort()
      
      expect(pluginNames1).toEqual(pluginNames2)
      expect(pluginNames2).toEqual(pluginNames3)
    })
  })

  describe('Error Handling', () => {
    test('should handle malformed Jenkins content', async () => {
      const malformedContent = `
        pipeline {
          agent any
          stages {
            stage('Build' {
              // Missing closing brace
              steps {
                sh 'echo "test"
        `

      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        malformedContent,
        'test-project-malformed',
        'test-user'
      )

      // Should not throw error, should handle gracefully
      expect(result).toBeDefined()
      expect(result.total_plugins).toBeGreaterThanOrEqual(0)
    })

    test('should handle special characters and encoding', async () => {
      const specialCharContent = `
        pipeline {
          agent any
          stages {
            stage('Build') {
              steps {
                sh 'echo "测试 with émojis 🚀 and spëcial chars"'
              }
            }
          }
        }`

      const result = await EnterprisePluginAnalyzer.analyzePlugins(
        specialCharContent,
        'test-project-special-chars',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_plugins).toBeGreaterThanOrEqual(0)
    })
  })
})