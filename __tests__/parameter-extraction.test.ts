// Updated to test parameter extraction in the unified AI system
import { UnifiedAIMigrationSystem } from '@/lib/ai-migration-system'
import { ScanResult } from '@/types'

describe('Parameter Extraction in Unified AI System', () => {
  let migrationSystem: UnifiedAIMigrationSystem

  beforeEach(() => {
    migrationSystem = new UnifiedAIMigrationSystem()
  })

  const mockScanResult: ScanResult = {
    pluginHits: [
      { key: 'parameters', name: 'Parameters', category: 'build' }
    ],
    pluginCount: 1,
    scripted: false,
    declarative: true,
    tier: 'medium',
    lineCount: 40,
    warnings: [],
    timestamp: Date.now()
  }

  describe('Parameter Migration', () => {
    it('should extract and migrate string parameters', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    parameters {
        string(name: 'ENVIRONMENT', defaultValue: 'dev', description: 'Deployment environment')
        string(name: 'VERSION', defaultValue: '1.0.0', description: 'Application version')
    }
    stages {
        stage('Deploy') {
            steps {
                sh "echo Deploying version \${params.VERSION} to \${params.ENVIRONMENT}"
            }
        }
    }
}
`
      const result = await migrationSystem.migrate({
        jenkinsfile,
        scanResult: mockScanResult,
        options: { useAI: true }
      })

      expect(result.success).toBe(true)
      expect(result.yaml).toContain('variables:')
      expect(result.yaml).toContain('ENVIRONMENT')
      expect(result.yaml).toContain('VERSION')
    })

    it('should handle boolean parameters', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    parameters {
        booleanParam(name: 'DEPLOY_TO_PROD', defaultValue: false, description: 'Deploy to production?')
        booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run tests?')
    }
    stages {
        stage('Test') {
            when { params.RUN_TESTS }
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            when { params.DEPLOY_TO_PROD }
            steps {
                sh 'deploy.sh'
            }
        }
    }
}
`
      const result = await migrationSystem.migrate({
        jenkinsfile,
        scanResult: mockScanResult,
        options: { useAI: true }
      })

      expect(result.success).toBe(true)
      expect(result.yaml).toContain('variables:')
      expect(result.yaml).toContain('DEPLOY_TO_PROD')
      expect(result.yaml).toContain('RUN_TESTS')
      expect(result.yaml).toContain('rules:')
    })

    it('should migrate choice parameters to GitLab variables', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    parameters {
        choice(name: 'BUILD_TYPE', choices: ['debug', 'release', 'profile'], description: 'Build type')
    }
    stages {
        stage('Build') {
            steps {
                sh "make \${params.BUILD_TYPE}"
            }
        }
    }
}
`
      const result = await migrationSystem.migrate({
        jenkinsfile,
        scanResult: mockScanResult,
        options: { useAI: true }
      })

      expect(result.success).toBe(true)
      expect(result.yaml).toContain('variables:')
      expect(result.yaml).toContain('BUILD_TYPE')
      expect(result.analysisReport).toContain('choice parameter')
    })

    it('should handle file parameters with recommendations', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    parameters {
        file(name: 'CONFIG_FILE', description: 'Configuration file to upload')
    }
    stages {
        stage('Configure') {
            steps {
                sh 'cp \${params.CONFIG_FILE} config.yml'
            }
        }
    }
}
`
      const result = await migrationSystem.migrate({
        jenkinsfile,
        scanResult: mockScanResult,
        options: { useAI: true }
      })

      expect(result.success).toBe(true)
      expect(result.insights).toBeDefined()
      
      const fileParamInsights = result.insights?.filter(insight => 
        insight.description.toLowerCase().includes('file parameter')
      )
      expect(fileParamInsights?.length).toBeGreaterThan(0)
    })

    it('should provide migration recommendations for complex parameter usage', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch')
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'staging', 'prod'], description: 'Environment')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip tests?')
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: "\${params.BRANCH}", url: 'https://github.com/example/repo.git'
            }
        }
        stage('Test') {
            when { not { params.SKIP_TESTS } }
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh "deploy.sh --env \${params.DEPLOY_ENV}"
            }
        }
    }
}
`
      const result = await migrationSystem.migrate({
        jenkinsfile,
        scanResult: mockScanResult,
        options: { useAI: true }
      })

      expect(result.success).toBe(true)
      expect(result.yaml).toContain('variables:')
      expect(result.insights).toBeDefined()
      expect(result.recommendations).toBeDefined()
      
      const parameterRecommendations = result.recommendations?.filter(rec => 
        rec.toLowerCase().includes('parameter') || rec.toLowerCase().includes('variable')
      )
      expect(parameterRecommendations?.length).toBeGreaterThan(0)
    })
  })
})