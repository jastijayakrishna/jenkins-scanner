import { convertToGitLabCI, validateGitLabCI } from '@/lib/gitlab-converter'
import { ScanResult } from '@/types'

describe('GitLab Converter - Advanced Features', () => {
  describe('Complete Jenkins Feature Conversion', () => {
    it('should convert ALL Jenkins features mentioned in the gap analysis', () => {
      // Complex Jenkins pipeline with all features
      const complexJenkinsContent = `
pipeline {
    agent any
    
    properties {
        parameters {
            string(name: 'ENV', defaultValue: 'staging', description: 'Deployment environment')
            booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Run test suite')
        }
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }
    
    stages {
        stage('Build') {
            matrix {
                axes {
                    axis {
                        name 'LANG'
                        values 'java17', 'java21'
                    }
                    axis {
                        name 'DB'
                        values 'mysql', 'postgres'
                    }
                }
                stages {
                    stage('Compile') {
                        steps {
                            timeout(time: 15, unit: 'MINUTES') {
                                withMaven(maven: 'maven-3', jdk: 'jdk17') {
                                    sh 'mvn clean compile'
                                }
                            }
                        }
                    }
                    stage('Test') {
                        when {
                            expression { params.RUN_TESTS == true }
                        }
                        steps {
                            sh 'mvn test'
                            junit '**/target/surefire-reports/*.xml'
                        }
                    }
                }
            }
        }
        
        stage('Security') {
            parallel {
                stage('SonarQube') {
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh 'mvn sonar:sonar'
                        }
                    }
                }
                stage('Trivy Scan') {
                    steps {
                        sh 'trivy image myapp:latest'
                    }
                }
            }
        }
        
        stage('Package') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh 'docker login -u $USER -p $PASS'
                    sh 'docker build -t myapp:$BUILD_NUMBER .'
                    sh 'docker push myapp:$BUILD_NUMBER'
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withVault(configuration: [timeout: 60, vaultUrl: 'https://vault.example.com'], 
                         vaultSecrets: [[path: 'secret/k8s', secretValues: [[vaultKey: 'token']]]]) {
                    retry(3) {
                        sh 'helm upgrade --install myapp ./charts'
                    }
                }
            }
        }
    }
    
    post {
        success {
            slackSend channel: '#builds', message: 'Build successful!'
            emailext to: 'team@example.com', subject: 'Build Success'
        }
        failure {
            slackSend channel: '#builds', message: 'Build failed!'
        }
        always {
            cleanWs()
        }
    }
}
`

      const scanResult: ScanResult = {
        pluginHits: [
          { key: 'maven', name: 'Maven', category: 'build' },
          { key: 'junit', name: 'JUnit', category: 'test' },
          { key: 'sonarqube', name: 'SonarQube', category: 'security' },
          { key: 'docker', name: 'Docker', category: 'deploy' },
          { key: 'credentials', name: 'Credentials', category: 'security' },
          { key: 'vault', name: 'Vault', category: 'security' },
          { key: 'helm', name: 'Helm', category: 'deploy' },
          { key: 'parallel', name: 'Parallel', category: 'other' },
          { key: 'matrix', name: 'Matrix', category: 'other' },
          { key: 'timeout', name: 'Timeout', category: 'other' },
          { key: 'retry', name: 'Retry', category: 'other' },
          { key: 'parameters', name: 'Parameters', category: 'other' },
          { key: 'buildDiscarder', name: 'Build Discarder', category: 'other' }
        ],
        pluginCount: 13,
        scripted: false,
        declarative: true,
        tier: 'complex',
        lineCount: 75,
        warnings: [],
        timestamp: Date.now()
      }

      const yaml = convertToGitLabCI(scanResult, complexJenkinsContent)
      
      // Verify all features are converted
      
      // 1. Parameters converted to variables
      expect(yaml).toContain('ENV: "staging"')
      expect(yaml).toContain('RUN_TESTS: "true"')
      
      // 2. Matrix build
      expect(yaml).toContain('parallel:')
      expect(yaml).toContain('matrix:')
      expect(yaml).toContain('LANG:')
      expect(yaml).toContain('- "java17"')
      expect(yaml).toContain('- "java21"')
      expect(yaml).toContain('DB:')
      expect(yaml).toContain('- "mysql"')
      expect(yaml).toContain('- "postgres"')
      
      // 3. Timeout
      expect(yaml).toContain('timeout: 15m')
      
      // 4. Conditional execution (when)
      expect(yaml).toContain('rules:')
      expect(yaml).toContain('if: \'$RUN_TESTS == "false"\'')
      expect(yaml).toContain('when: never')
      
      // 5. Parallel security scans
      expect(yaml).toContain('needs: []')
      expect(yaml).toContain('sonar:scan')
      expect(yaml).toContain('trivy:scan')
      
      // 6. Docker credentials
      expect(yaml).toContain('CI_REGISTRY_USER')
      expect(yaml).toContain('CI_REGISTRY_PASSWORD')
      expect(yaml).toContain('docker login')
      
      // 7. Vault integration
      expect(yaml).toContain('HashiCorp Vault integration')
      expect(yaml).toContain('VAULT_ADDR')
      expect(yaml).toContain('VAULT_TOKEN')
      
      // 8. Retry logic for helm
      expect(yaml).toContain('retry')
      expect(yaml).toContain('for i in $(seq 1 3)')
      
      // 9. Post actions
      expect(yaml).toContain('Slack notifications')
      expect(yaml).toContain('Email notifications')
      
      // 10. Build discarder
      expect(yaml).toContain('expire_in: 30 days')
      
      // 11. Workflow rules for parameterized builds
      expect(yaml).toContain('workflow:')
      expect(yaml).toContain('$CI_PIPELINE_SOURCE == "web"')
      
      // 12. Security templates
      expect(yaml).toContain('include:')
      expect(yaml).toContain('Security/SAST.gitlab-ci.yml')
      expect(yaml).toContain('Security/Container-Scanning.gitlab-ci.yml')
    })

    it('should handle Jenkins scripted pipeline with complex logic', () => {
      const scriptedJenkinsContent = `
node {
    def buildNumber = env.BUILD_NUMBER
    def workspace = pwd()
    
    parameters {
        string(name: 'BRANCH', defaultValue: 'main')
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'])
    }
    
    try {
        stage('Checkout') {
            checkout scm
        }
        
        stage('Build') {
            parallel(
                "Build Java": {
                    docker.image('maven:3.8-jdk11').inside {
                        sh 'mvn clean package'
                    }
                },
                "Build Frontend": {
                    docker.image('node:16').inside {
                        sh 'npm install && npm run build'
                    }
                }
            )
        }
        
        stage('Test') {
            timeout(time: 30, unit: 'MINUTES') {
                retry(2) {
                    sh 'mvn test'
                }
            }
        }
        
        stage('Deploy') {
            if (params.ENVIRONMENT == 'prod') {
                input message: 'Deploy to production?'
            }
            
            withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                sh 'kubectl apply -f k8s/'
            }
        }
    } catch (e) {
        currentBuild.result = 'FAILED'
        throw e
    } finally {
        junit '**/target/surefire-reports/*.xml'
        archiveArtifacts artifacts: '**/target/*.jar'
        
        if (currentBuild.result == 'FAILED') {
            mail to: 'team@example.com', subject: 'Build Failed'
        }
    }
}
`

      const scanResult: ScanResult = {
        pluginHits: [
          { key: 'docker', name: 'Docker', category: 'deploy' },
          { key: 'maven', name: 'Maven', category: 'build' },
          { key: 'nodejs', name: 'Node.js', category: 'build' },
          { key: 'parallel', name: 'Parallel', category: 'other' },
          { key: 'timeout', name: 'Timeout', category: 'other' },
          { key: 'retry', name: 'Retry', category: 'other' },
          { key: 'credentials', name: 'Credentials', category: 'security' },
          { key: 'kubernetes', name: 'Kubernetes', category: 'deploy' },
          { key: 'junit', name: 'JUnit', category: 'test' }
        ],
        pluginCount: 9,
        scripted: true,
        declarative: false,
        tier: 'complex',
        lineCount: 50,
        warnings: ['Scripted pipelines are harder to migrate than declarative pipelines'],
        timestamp: Date.now()
      }

      const yaml = convertToGitLabCI(scanResult, scriptedJenkinsContent)
      
      // Verify scripted pipeline features
      expect(yaml).toContain('SCRIPTED PIPELINE')
      expect(yaml).toContain('manual adjustment')
      expect(yaml).toContain('complex Groovy logic')
      
      // Parameters still converted
      expect(yaml).toContain('BRANCH: "main"')
      expect(yaml).toContain('ENVIRONMENT: "dev"')  // First choice should be default
      
      // Parallel builds detected
      expect(yaml).toContain('Build Java')
      expect(yaml).toContain('Build Frontend')
      
      // Conditional deployment (manual approval)
      expect(yaml).toContain('when: manual')
      
      // File credentials
      expect(yaml).toContain('KUBE_CONFIG')
    })
  })

  describe('Validation', () => {
    it('should validate a complete GitLab CI YAML', () => {
      const yaml = `
stages:
  - build
  - test
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
  DOCKER_DRIVER: "overlay2"

build:app:
  stage: build
  script:
    - mvn clean compile

test:unit:
  stage: test
  script:
    - mvn test
  artifacts:
    reports:
      junit:
        - target/surefire-reports/*.xml
    expire_in: 30 days

deploy:prod:
  stage: deploy
  script:
    - kubectl apply -f k8s/
  only:
    - main
`
      
      const validation = validateGitLabCI(yaml)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing variables', () => {
      const yaml = `
stages:
  - build

build:
  stage: build
  script:
    - echo "$UNDEFINED_VAR"
    - docker login -u "$CI_REGISTRY_USER"
`
      
      const validation = validateGitLabCI(yaml)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Variable $UNDEFINED_VAR used but not defined')
    })

    it('should detect Docker-in-Docker configuration issues', () => {
      const yaml = `
stages:
  - build

services:
  - docker:dind

build:
  stage: build
  script:
    - docker build .
`
      
      const validation = validateGitLabCI(yaml)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Docker-in-Docker service used but DOCKER_HOST not configured')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty Jenkins pipeline gracefully', () => {
      const emptyJenkinsContent = 'pipeline { agent any stages {} }'
      
      const scanResult: ScanResult = {
        pluginHits: [],
        pluginCount: 0,
        scripted: false,
        declarative: true,
        tier: 'simple',
        lineCount: 1,
        warnings: [],
        timestamp: Date.now()
      }

      const yaml = convertToGitLabCI(scanResult, emptyJenkinsContent)
      
      expect(yaml).toContain('stages:')
      expect(yaml).toContain('build')
      expect(yaml).toContain('Add your build commands here')
    })

    it('should handle matrix with single axis', () => {
      const matrixJenkinsContent = `
pipeline {
    stages {
        stage('Test') {
            matrix {
                axes {
                    axis {
                        name 'OS'
                        values 'linux', 'windows', 'mac'
                    }
                }
                stages {
                    stage('Run') {
                        steps {
                            echo "Testing on $OS"
                        }
                    }
                }
            }
        }
    }
}
`
      
      const scanResult: ScanResult = {
        pluginHits: [{ key: 'matrix', name: 'Matrix', category: 'other' }],
        pluginCount: 1,
        scripted: false,
        declarative: true,
        tier: 'medium',
        lineCount: 20,
        warnings: [],
        timestamp: Date.now()
      }

      const yaml = convertToGitLabCI(scanResult, matrixJenkinsContent)
      
      expect(yaml).toContain('OS:')
      expect(yaml).toContain('- "linux"')
      expect(yaml).toContain('- "windows"')
      expect(yaml).toContain('- "mac"')
    })
  })
})
