/**
 * Integration Tests for GitLab CI YAML Conversion
 * Ensures Jenkins to GitLab CI conversion works correctly and produces valid YAML
 */

import { enterpriseAIMigrationSystem } from '@/lib/ai-migration-system-simple'
import { scan } from '@/lib/score'

describe('GitLab CI YAML Conversion Integration Tests', () => {
  const sampleJenkinsfile = `
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
        nodejs 'NodeJS-18'
    }
    
    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME = 'test-app'
        VERSION = '\${BUILD_NUMBER}'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/example/repo.git'
            }
        }
        
        stage('Build') {
            parallel {
                stage('Maven Build') {
                    steps {
                        sh 'mvn clean compile'
                        sh 'mvn package -DskipTests'
                    }
                }
                stage('Frontend Build') {
                    steps {
                        sh 'npm install'
                        sh 'npm run build'
                        sh 'npm run lint'
                    }
                }
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
                sh 'npm run test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'target/site/jacoco',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh 'mvn sonar:sonar -Dsonar.token=\$SONAR_TOKEN'
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("\$DOCKER_REGISTRY/\$APP_NAME:\$VERSION")
                    docker.withRegistry('https://registry.example.com', 'docker-registry-creds') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withCredentials([kubeconfigFile(credentialsId: 'k8s-config', variable: 'KUBECONFIG')]) {
                        sh 'kubectl apply -f k8s/'
                        sh 'kubectl rollout status deployment/\$APP_NAME'
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend channel: '#ci-results', message: "✅ Build successful: \$BUILD_URL"
        }
        failure {
            slackSend channel: '#ci-results', message: "❌ Build failed: \$BUILD_URL"
        }
    }
}`

  const simpleJenkinsfile = `
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'echo "Building..."'
                sh 'make build'
            }
        }
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
    }
}`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('YAML Generation and Structure', () => {
    test('should generate valid GitLab CI YAML structure', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      expect(result.success).toBe(true)
      expect(result.gitlabYaml).toBeDefined()
      expect(typeof result.gitlabYaml).toBe('string')
      expect(result.gitlabYaml.length).toBeGreaterThan(1000)

      // Check for essential GitLab CI elements
      expect(result.gitlabYaml).toContain('stages:')
      expect(result.gitlabYaml).toContain('script:')
      expect(result.gitlabYaml).toContain('variables:')
      expect(result.gitlabYaml).toContain('include:')

      // Ensure no Jenkins-specific syntax remains
      expect(result.gitlabYaml).not.toContain('pipeline {')
      expect(result.gitlabYaml).not.toContain('agent any')
      expect(result.gitlabYaml).not.toContain('Jenkinsfile')
    })

    test('should include comprehensive GitLab CI features', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      const yaml = result.gitlabYaml

      // Check for enterprise features
      expect(yaml).toContain('Security/')
      expect(yaml).toContain('docker:')
      expect(yaml).toContain('artifacts:')
      expect(yaml).toContain('coverage:')
      expect(yaml).toContain('parallel:')
      expect(yaml).toContain('rules:')

      // Check for security scanning templates
      expect(yaml).toContain('Container-Scanning')
      expect(yaml).toContain('Dependency-Scanning')
      expect(yaml).toContain('SAST')
      expect(yaml).toContain('Secret-Detection')

      // Check for workflow configuration
      expect(yaml).toContain('workflow:')
      expect(yaml).toContain('MergeRequest-Pipelines')
    })

    test('should handle simple Jenkins pipelines correctly', async () => {
      const scanResult = scan(simpleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: simpleJenkinsfile,
        scanResult
      })

      expect(result.success).toBe(true)
      expect(result.gitlabYaml).toBeDefined()
      expect(result.gitlabYaml).toContain('stages:')
      expect(result.gitlabYaml).toContain('build')
      expect(result.gitlabYaml).toContain('test')
    })

    test('should generate immutable Docker image references', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      const yaml = result.gitlabYaml

      // Check for SHA256 digest references (immutable images)
      const sha256Pattern = /@sha256:[a-f0-9]{64}/g
      const sha256Matches = yaml.match(sha256Pattern)
      expect(sha256Matches).toBeTruthy()
      expect(sha256Matches!.length).toBeGreaterThan(5)

      // Ensure no latest tags without digests in production sections
      const latestWithoutDigest = /image:.*:latest(?!@sha256)/g
      expect(yaml.match(latestWithoutDigest)).toBeFalsy()
    })
  })

  describe('Migration Intelligence and Metadata', () => {
    test('should provide comprehensive migration intelligence', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      expect(result.intelligence).toBeDefined()
      expect(result.intelligence.summary).toBeDefined()
      expect(result.intelligence.summary.originalComplexity).toBe(scanResult.tier)
      expect(result.intelligence.summary.targetComplexity).toBe('enterprise')
      expect(result.intelligence.summary.confidenceScore).toBe(100)

      expect(result.intelligence.optimizations).toBeDefined()
      expect(Array.isArray(result.intelligence.optimizations)).toBe(true)
      expect(result.intelligence.optimizations.length).toBeGreaterThan(0)

      expect(result.intelligence.recommendations).toBeDefined()
      expect(Array.isArray(result.intelligence.recommendations)).toBe(true)
    })

    test('should track performance metrics', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const startTime = Date.now()
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })
      const endTime = Date.now()

      expect(result.performanceMetrics).toBeDefined()
      expect(result.performanceMetrics.totalTime).toBeGreaterThan(0)
      expect(result.performanceMetrics.totalTime).toBeLessThan(endTime - startTime + 100)
      expect(result.performanceMetrics.optimizationsApplied).toBeGreaterThanOrEqual(0)
    })

    test('should provide docker validation results', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      expect(result.dockerValidation).toBeDefined()
      expect(Array.isArray(result.dockerValidation)).toBe(true)
      
      if (result.dockerValidation.length > 0) {
        const validation = result.dockerValidation[0]
        expect(validation.image).toBeDefined()
        expect(validation.is_valid).toBeDefined()
        expect(validation.security_score).toBeDefined()
        expect(validation.vulnerabilities).toBeDefined()
      }
    })
  })

  describe('YAML Validity and Syntax', () => {
    test('should generate syntactically valid YAML', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })

      const yaml = result.gitlabYaml

      // Basic YAML syntax checks
      expect(yaml).not.toContain('\t') // No tabs, should use spaces
      expect(yaml.split('\n').filter(line => line.trim().length > 0).length).toBeGreaterThan(50)

      // Check proper indentation patterns
      const lines = yaml.split('\n')
      let inScriptBlock = false
      
      for (const line of lines) {
        if (line.includes('script:')) inScriptBlock = true
        if (inScriptBlock && line.trim().startsWith('- ')) {
          // Script array items should be properly indented
          expect(line.match(/^\s+- /)).toBeTruthy()
        }
      }
    })

    test('should escape special characters properly', async () => {
      const jenkinsWithSpecialChars = `
pipeline {
    agent any
    environment {
        MESSAGE = 'Build \$BUILD_NUMBER with "quotes" and \${variables}'
        REGEX = '/test.*pattern/'
    }
    stages {
        stage('Build') {
            steps {
                sh 'echo "\$MESSAGE"'
                sh "echo 'Single quotes test'"
            }
        }
    }
}`

      const scanResult = scan(jenkinsWithSpecialChars)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: jenkinsWithSpecialChars,
        scanResult
      })

      const yaml = result.gitlabYaml
      
      // Should not contain unescaped special sequences that break YAML
      expect(yaml).not.toMatch(/[^\\]\${BUILD_NUMBER}/)
      // Check that variables are properly formatted for GitLab CI
      expect(yaml).toMatch(/\$\{?CI_|variables:/)
    })

    test('should handle multiline scripts correctly', async () => {
      const jenkinsWithMultiline = `
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh '''
                    echo "Line 1"
                    echo "Line 2"
                    if [ -f pom.xml ]; then
                        echo "Maven project"
                    fi
                '''
            }
        }
    }
}`

      const scanResult = scan(jenkinsWithMultiline)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: jenkinsWithMultiline,
        scanResult
      })

      const yaml = result.gitlabYaml
      expect(yaml).toContain('script:')
      expect(yaml).toContain('echo')
    })
  })

  describe('Performance and Consistency', () => {
    test('should complete conversion within reasonable time', async () => {
      const scanResult = scan(sampleJenkinsfile)
      
      const startTime = Date.now()
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: sampleJenkinsfile,
        scanResult
      })
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    test('should be deterministic for the same input', async () => {
      const scanResult = scan(simpleJenkinsfile)
      
      const [result1, result2, result3] = await Promise.all([
        enterpriseAIMigrationSystem.migrate({ jenkinsfile: simpleJenkinsfile, scanResult }),
        enterpriseAIMigrationSystem.migrate({ jenkinsfile: simpleJenkinsfile, scanResult }),
        enterpriseAIMigrationSystem.migrate({ jenkinsfile: simpleJenkinsfile, scanResult })
      ])

      // Results should be identical for same input
      expect(result1.success).toBe(result2.success)
      expect(result1.success).toBe(result3.success)
      
      // YAML structure should be consistent (allowing for timestamp differences)
      const yaml1Lines = result1.gitlabYaml.split('\n').filter(line => !line.includes('Converted:'))
      const yaml2Lines = result2.gitlabYaml.split('\n').filter(line => !line.includes('Converted:'))
      const yaml3Lines = result3.gitlabYaml.split('\n').filter(line => !line.includes('Converted:'))
      
      expect(yaml1Lines.length).toBe(yaml2Lines.length)
      expect(yaml2Lines.length).toBe(yaml3Lines.length)
    })

    test('should handle large Jenkins files efficiently', async () => {
      const largeJenkinsfile = sampleJenkinsfile.repeat(5) // Create a large pipeline
      const scanResult = scan(largeJenkinsfile)
      
      const startTime = Date.now()
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: largeJenkinsfile,
        scanResult
      })
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(result.gitlabYaml).toBeDefined()
      expect(duration).toBeLessThan(15000) // Should handle large files within 15 seconds
    }, 20000)
  })

  describe('Error Handling', () => {
    test('should handle empty Jenkins content', async () => {
      const scanResult = scan('')
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: '',
        scanResult
      })

      expect(result.success).toBe(true)
      expect(result.gitlabYaml).toBeDefined()
      expect(result.gitlabYaml).toContain('stages:')
    })

    test('should handle malformed Jenkins content', async () => {
      const malformedJenkinsfile = `
        pipeline {
          agent any
          stages {
            stage('Build' {
              // Missing closing brace and syntax errors
              steps {
                sh 'echo "test"
        `
      
      const scanResult = scan(malformedJenkinsfile)
      
      const result = await enterpriseAIMigrationSystem.migrate({
        jenkinsfile: malformedJenkinsfile,
        scanResult
      })

      // Should not throw error, should provide some output
      expect(result.success).toBe(true)
      expect(result.gitlabYaml).toBeDefined()
      expect(result.gitlabYaml.length).toBeGreaterThan(100)
    })
  })
})