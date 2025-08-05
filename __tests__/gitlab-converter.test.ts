import { convertToGitLabCI, validateGitLabCI } from '@/lib/gitlab-converter'
import { ScanResult } from '@/types'

describe('GitLab Converter', () => {
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

  describe('convertToGitLabCI', () => {
    it('should convert a simple Jenkins pipeline to GitLab CI', () => {
      const yaml = convertToGitLabCI(mockScanResult, mockJenkinsContent)
      
      expect(yaml).toContain('stages:')
      expect(yaml).toContain('build')
      expect(yaml).toContain('test')
      expect(yaml).toContain('quality')
      expect(yaml).toContain('deploy')
    })

    it('should include appropriate Docker configuration when Docker plugin is detected', () => {
      const yaml = convertToGitLabCI(mockScanResult, mockJenkinsContent)
      
      // When Maven is present, it takes precedence for the default image
      // But Docker configuration should still be present for the package stage
      expect(yaml).toContain('DOCKER_DRIVER')
      expect(yaml).toContain('package:docker')
      expect(yaml).toContain('docker build')
      expect(yaml).toContain('docker push')
    })

    it('should include Maven configuration when Maven plugin is detected', () => {
      const yaml = convertToGitLabCI(mockScanResult, mockJenkinsContent)
      
      expect(yaml).toContain('maven:3.8-openjdk-11')
      expect(yaml).toContain('MAVEN_OPTS')
      expect(yaml).toContain('.m2/repository')
    })

    it('should include SonarQube configuration when SonarQube plugin is detected', () => {
      const yaml = convertToGitLabCI(mockScanResult, mockJenkinsContent)
      
      expect(yaml).toContain('SONAR_HOST_URL')
      expect(yaml).toContain('SONAR_TOKEN')
      expect(yaml).toContain('sonar:sonar')
    })

    it('should generate different stages based on complexity', () => {
      const simpleResult = { ...mockScanResult, tier: 'simple' as const }
      const simpleYaml = convertToGitLabCI(simpleResult, mockJenkinsContent)
      
      const complexResult = { ...mockScanResult, tier: 'complex' as const }
      const complexYaml = convertToGitLabCI(complexResult, mockJenkinsContent)
      
      // Simple should have fewer stages
      expect(simpleYaml.match(/- \w+/g)?.length).toBeLessThan(
        complexYaml.match(/- \w+/g)?.length || 0
      )
    })

    it('should include warnings for scripted pipelines', () => {
      const scriptedResult = { ...mockScanResult, scripted: true, declarative: false }
      const yaml = convertToGitLabCI(scriptedResult, mockJenkinsContent)
      
      expect(yaml).toContain('Scripted Jenkins pipeline')
      expect(yaml).toContain('manual adjustment')
    })
  })

  describe('validateGitLabCI', () => {
    it('should validate a correct GitLab CI YAML', () => {
      const yaml = convertToGitLabCI(mockScanResult, mockJenkinsContent)
      const validation = validateGitLabCI(yaml)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing stages', () => {
      const invalidYaml = `
variables:
  TEST: "value"

build:
  script:
    - echo "test"
`
      const validation = validateGitLabCI(invalidYaml)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('No stages defined')
    })

    it('should detect missing jobs', () => {
      const invalidYaml = `
stages:
  - build
  - test
`
      const validation = validateGitLabCI(invalidYaml)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('No jobs defined')
    })
  })
})
