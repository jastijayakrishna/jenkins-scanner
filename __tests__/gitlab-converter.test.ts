// Updated to test the unified AI migration system
import { UnifiedAIMigrationSystem } from '@/lib/ai-migration-system'
import { ScanResult } from '@/types'

describe('Unified AI Migration System', () => {
  const mockScanResult: ScanResult = {
    pluginHits: [
      { key: 'maven', name: 'Maven', category: 'build' },
      { key: 'docker', name: 'Docker', category: 'deploy' },
      { key: 'sonarqube', name: 'SonarQube', category: 'security' }
    ],
    pluginCount: 3,
    scripted: false,
    declarative: true,
    tier: 'medium',
    lineCount: 50,
    warnings: [],
    timestamp: Date.now()
  }

  const mockJenkinsContent = `
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                withMaven(maven: 'maven-3') {
                    sh 'mvn clean compile'
                }
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        stage('Docker') {
            steps {
                sh 'docker build -t myapp .'
            }
        }
    }
}
`

  describe('migrate', () => {
    let migrationSystem: UnifiedAIMigrationSystem

    beforeEach(() => {
      migrationSystem = new UnifiedAIMigrationSystem()
    })

    it('should migrate a Jenkins pipeline to GitLab CI', async () => {
      const result = await migrationSystem.migrate({
        jenkinsfile: mockJenkinsContent,
        scanResult: mockScanResult,
        options: { useAI: true }
      })
      
      expect(result.success).toBe(true)
      expect(result.yaml).toContain('stages:')
      expect(result.yaml).toContain('build')
      expect(result.insights).toBeDefined()
    })

    it('should include AI-powered optimizations', async () => {
      const result = await migrationSystem.migrate({
        jenkinsfile: mockJenkinsContent,
        scanResult: mockScanResult,
        options: { useAI: true, aiOptimizations: true }
      })
      
      expect(result.success).toBe(true)
      expect(result.optimizations).toBeDefined()
      expect(result.optimizations.length).toBeGreaterThan(0)
    })

    it('should handle complex pipelines with AI assistance', async () => {
      const complexResult = { ...mockScanResult, tier: 'complex' as const }
      
      const result = await migrationSystem.migrate({
        jenkinsfile: mockJenkinsContent,
        scanResult: complexResult,
        options: { useAI: true }
      })
      
      expect(result.success).toBe(true)
      expect(result.yaml).toBeTruthy()
      expect(result.analysisReport).toBeDefined()
    })

    it('should fallback to direct conversion for simple cases', async () => {
      const simpleResult = { ...mockScanResult, tier: 'simple' as const }
      
      const result = await migrationSystem.migrate({
        jenkinsfile: mockJenkinsContent,
        scanResult: simpleResult,
        options: { useAI: false }
      })
      
      expect(result.success).toBe(true)
      expect(result.yaml).toBeTruthy()
    })

    it('should provide meaningful error messages on failure', async () => {
      const result = await migrationSystem.migrate({
        jenkinsfile: 'invalid jenkins content',
        scanResult: mockScanResult,
        options: {}
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateMigrationResult', () => {
    let migrationSystem: UnifiedAIMigrationSystem

    beforeEach(() => {
      migrationSystem = new UnifiedAIMigrationSystem()
    })

    it('should validate generated GitLab CI configuration', async () => {
      const result = await migrationSystem.migrate({
        jenkinsfile: mockJenkinsContent,
        scanResult: mockScanResult,
        options: { useAI: true }
      })
      
      expect(result.success).toBe(true)
      expect(result.validationErrors).toHaveLength(0)
    })
  })
})