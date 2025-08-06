// Updated to test AI Pipeline Intelligence System
import { AIPipelineIntelligenceService } from '@/lib/ai-pipeline-intelligence'
import { ScanResult } from '@/types'

describe('AI Pipeline Intelligence', () => {
  let pipelineIntelligence: AIPipelineIntelligenceService
  
  const mockScanResult: ScanResult = {
    pluginHits: [
      { key: 'maven', name: 'Maven', category: 'build' },
      { key: 'docker', name: 'Docker', category: 'deploy' },
      { key: 'sonarqube', name: 'SonarQube', category: 'security' }
    ],
    pluginCount: 3,
    scripted: false,
    declarative: true,
    tier: 'complex',
    lineCount: 150,
    warnings: ['Complex pipeline structure detected'],
    timestamp: Date.now()
  }

  beforeEach(() => {
    pipelineIntelligence = new AIPipelineIntelligenceService()
  })

  describe('analyzePipeline', () => {
    const complexJenkinsfile = `
pipeline {
    agent any
    environment {
        MAVEN_OPTS = '-Xmx1024m'
        DOCKER_REGISTRY = 'registry.example.com'
    }
    stages {
        stage('Build') {
            parallel {
                stage('Maven Build') {
                    steps {
                        withMaven(maven: 'maven-3') {
                            sh 'mvn clean compile'
                        }
                    }
                }
                stage('Static Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh 'mvn sonar:sonar'
                        }
                    }
                }
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
                junit 'target/surefire-reports/*.xml'
            }
        }
        stage('Package') {
            steps {
                sh 'mvn package'
                archiveArtifacts artifacts: 'target/*.jar'
            }
        }
        stage('Docker') {
            steps {
                script {
                    def image = docker.build("myapp:${env.BUILD_ID}")
                    docker.withRegistry('https://registry.example.com', 'docker-hub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
        failure {
            emailext body: 'Build failed', subject: 'Build Failure', to: 'team@example.com'
        }
    }
}
`

    it('should analyze complex pipeline structure', async () => {
      const result = await pipelineIntelligence.analyzePipeline(complexJenkinsfile, mockScanResult)
      
      expect(result).toBeDefined()
      expect(result.pipelineType).toBeDefined()
      expect(result.complexity).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(result.insights).toBeDefined()
    })

    it('should identify parallel execution patterns', async () => {
      const result = await pipelineIntelligence.analyzePipeline(complexJenkinsfile, mockScanResult)
      
      expect(result.features.parallelExecution).toBe(true)
      expect(result.complexity.parallelStages).toBeGreaterThan(0)
    })

    it('should detect advanced features like matrix builds', async () => {
      const matrixJenkinsfile = `
pipeline {
    agent none
    stages {
        stage('Test') {
            matrix {
                axes {
                    axis {
                        name 'PLATFORM'
                        values 'linux', 'mac', 'windows'
                    }
                }
                stages {
                    stage('Build & Test') {
                        agent { label "${PLATFORM}" }
                        steps {
                            sh 'make test'
                        }
                    }
                }
            }
        }
    }
}
`
      const result = await pipelineIntelligence.analyzePipeline(matrixJenkinsfile, mockScanResult)
      
      expect(result.features.matrixBuilds).toBe(true)
      expect(result.complexity.overallScore).toBeGreaterThan(0.7)
    })

    it('should provide recommendations for optimization', async () => {
      const result = await pipelineIntelligence.analyzePipeline(complexJenkinsfile, mockScanResult)
      
      expect(result.recommendations).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
      
      const optimizationRecs = result.recommendations.filter(
        rec => rec.category === 'performance'
      )
      expect(optimizationRecs.length).toBeGreaterThan(0)
    })

    it('should identify security considerations', async () => {
      const result = await pipelineIntelligence.analyzePipeline(complexJenkinsfile, mockScanResult)
      
      const securityRecs = result.recommendations.filter(
        rec => rec.category === 'security'
      )
      expect(securityRecs.length).toBeGreaterThan(0)
    })
  })

  describe('estimateMigrationComplexity', () => {
    it('should provide complexity estimation', async () => {
      const jenkinsfile = `
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
}
`
      const result = await pipelineIntelligence.analyzePipeline(jenkinsfile, {
        ...mockScanResult,
        tier: 'simple'
      })
      
      expect(result.complexity).toBeDefined()
      expect(result.complexity.overallScore).toBeLessThan(0.5)
      expect(result.estimatedEffort).toBeDefined()
    })
  })
})