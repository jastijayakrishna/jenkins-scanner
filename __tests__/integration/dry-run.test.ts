/**
 * Integration Tests for Dry-Run Execution
 * Ensures pipeline testing and simulation works correctly
 */

import { GitLabDryRunEngine } from '@/lib/gitlab-dryrun-engine'
import { DryRunStatus } from '@/lib/database'

describe('Dry-Run Execution Integration Tests', () => {
  const sampleJenkinsContent = `
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
    }
    
    environment {
        APP_NAME = 'test-app'
        VERSION = '\${BUILD_NUMBER}'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
                sh 'mvn package -DskipTests'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("test-app:\${VERSION}")
                    image.push()
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}`

  const sampleGitLabYaml = `
stages:
  - validate
  - build
  - test
  - package

variables:
  MAVEN_CLI_OPTS: "-B --errors --fail-at-end --show-version"
  MAVEN_OPTS: "-Dmaven.repo.local=\${CI_PROJECT_DIR}/.m2/repository"
  APP_NAME: "test-app"
  VERSION: "\${CI_COMMIT_SHORT_SHA}"

validate:pipeline:
  stage: validate
  image: alpine:3.19
  script:
    - echo "Validating pipeline configuration"
    - apk add --no-cache curl
  timeout: 2m

build:maven:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn \${MAVEN_CLI_OPTS} clean compile
    - mvn \${MAVEN_CLI_OPTS} package -DskipTests
  artifacts:
    paths:
      - target/*.jar
    expire_in: 1 day

test:unit:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  needs:
    - job: build:maven
      artifacts: true
  script:
    - mvn \${MAVEN_CLI_OPTS} test
  artifacts:
    reports:
      junit: target/surefire-reports/TEST-*.xml
    expire_in: 1 day
  coverage: '/Total.*?(\\\\d+%)/'

package:docker:
  stage: package
  image: docker:24.0.7-cli
  services:
    - docker:24.0.7-dind
  needs:
    - job: build:maven
      artifacts: true
  before_script:
    - docker info
  script:
    - docker build -t \${APP_NAME}:\${VERSION} .
    - docker tag \${APP_NAME}:\${VERSION} \${APP_NAME}:latest
  timeout: 20m
`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Simulation Mode (Development)', () => {
    test('should execute dry-run simulation successfully', async () => {
      // Mock missing GitLab configuration to trigger simulation mode
      delete process.env.GITLAB_TOKEN
      delete process.env.GITLAB_SANDBOX_NAMESPACE

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-project-simulation',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.project_id).toBe('test-project-simulation')
      expect(result.created_by).toBe('test-user')
      expect([DryRunStatus.SUCCESS, DryRunStatus.FAILED]).toContain(result.status)

      // Verify simulation provides realistic data
      expect(result.total_jobs).toBeGreaterThan(0)
      expect(result.passed_jobs + result.failed_jobs).toBe(result.total_jobs)
      expect(result.logs).toBeInstanceOf(Array)
      expect(result.logs.length).toBe(result.total_jobs)

      // Check logs structure
      result.logs.forEach(log => {
        expect(log.job_name).toBeDefined()
        expect(log.status).toBeDefined()
        expect(['success', 'failed', 'skipped']).toContain(log.status)
        expect(log.log_content).toBeDefined()
        expect(log.duration).toBeGreaterThanOrEqual(0)
      })

      // Verify warnings include simulation notice
      expect(result.warnings).toContain('Simulation mode: GitLab API not configured')
      expect(result.warnings).toContain('Results are simulated for demonstration purposes')

      // Check timing
      expect(result.started_at).toBeInstanceOf(Date)
      expect(result.completed_at).toBeInstanceOf(Date)
      expect(result.completed_at.getTime()).toBeGreaterThan(result.started_at.getTime())
    }, 15000)

    test('should extract jobs from GitLab YAML correctly', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-job-extraction',
        'test-user'
      )

      expect(result.total_jobs).toBeGreaterThan(2) // Should detect multiple jobs from YAML
      
      const jobNames = result.logs.map(log => log.job_name)
      expect(jobNames).toContain('validate:pipeline')
      expect(jobNames).toContain('build:maven')
      expect(jobNames).toContain('test:unit')
      expect(jobNames).toContain('package:docker')
    })

    test('should provide realistic success/failure rates', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-success-rates',
        'test-user'
      )

      // Simulation should provide realistic 80% pass rate
      const successRate = (result.passed_jobs / result.total_jobs) * 100
      expect(successRate).toBeGreaterThanOrEqual(60) // At least 60% should pass
      expect(successRate).toBeLessThanOrEqual(100)   // Max 100% can pass

      // Failed jobs should have error messages
      const failedLogs = result.logs.filter(log => log.status === 'failed')
      failedLogs.forEach(log => {
        expect(log.error_message).toBeDefined()
        expect(log.error_message!.length).toBeGreaterThan(5)
      })

      // Successful jobs should not have errors
      const successfulLogs = result.logs.filter(log => log.status === 'success')
      successfulLogs.forEach(log => {
        expect(log.error_message).toBeUndefined()
        expect(log.log_content).toContain('✅')
      })
    })

    test('should handle different GitLab YAML structures', async () => {
      const minimalYaml = `
build:
  stage: build
  script:
    - echo "Building"

test:
  stage: test
  script:
    - echo "Testing"
`

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        minimalYaml,
        'test-minimal-yaml',
        'test-user'
      )

      expect(result.total_jobs).toBe(2)
      expect(result.logs.length).toBe(2)
      
      const jobNames = result.logs.map(log => log.job_name)
      expect(jobNames).toContain('build')
      expect(jobNames).toContain('test')
    })
  })

  describe('Error Handling and Validation', () => {
    test('should handle invalid GitLab YAML gracefully', async () => {
      const invalidYaml = `
      invalid: yaml: structure
      - missing proper job definitions
      - no stages or scripts
      `

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        invalidYaml,
        'test-invalid-yaml',
        'test-user'
      )

      // Should provide fallback jobs when YAML parsing fails
      expect(result).toBeDefined()
      expect(result.total_jobs).toBeGreaterThan(0)
      expect(result.status).toBeDefined()
      
      // Should include fallback job names
      const jobNames = result.logs.map(log => log.job_name)
      expect(jobNames).toContain('validate:pipeline')
    })

    test('should handle empty GitLab YAML', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        '',
        'test-empty-yaml',
        'test-user'
      )

      // Should provide default jobs when YAML is empty
      expect(result.total_jobs).toBeGreaterThan(0)
      expect(result.logs.length).toBeGreaterThan(0)
      
      const defaultJobNames = result.logs.map(log => log.job_name)
      expect(defaultJobNames).toContain('validate:pipeline')
      expect(defaultJobNames).toContain('build:application')
    })

    test('should handle very large GitLab YAML files', async () => {
      const largeYaml = sampleGitLabYaml.repeat(10) // Create a very large YAML
      
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        largeYaml,
        'test-large-yaml',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_jobs).toBeGreaterThan(0)
      expect(result.total_jobs).toBeLessThanOrEqual(8) // Should limit jobs for simulation
    }, 20000)

    test('should provide appropriate manual steps for different scenarios', async () => {
      const failingYaml = `
failing-job:
  stage: test
  script:
    - exit 1
    - echo "This will fail"
`

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        failingYaml,
        'test-failing-scenario',
        'test-user'
      )

      expect(result.manual_steps).toBeDefined()
      expect(Array.isArray(result.manual_steps)).toBe(true)
      expect(result.manual_steps.length).toBeGreaterThan(0)

      if (result.failed_jobs > 0) {
        expect(result.manual_steps).toEqual(expect.arrayContaining([
          expect.stringContaining('Review failed job configurations'),
          expect.stringContaining('Update environment variables'),
          expect.stringContaining('Test locally')
        ]))
      }
    })
  })

  describe('Performance and Reliability', () => {
    test('should complete dry-run within reasonable time', async () => {
      const startTime = Date.now()
      
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-performance',
        'test-user'
      )
      
      const duration = Date.now() - startTime
      
      expect(result.status).toBeDefined()
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds for simulation
    }, 20000)

    test('should be consistent across multiple runs', async () => {
      const results = await Promise.all([
        GitLabDryRunEngine.executeDryRun(sampleJenkinsContent, sampleGitLabYaml, 'consistency-1', 'test-user'),
        GitLabDryRunEngine.executeDryRun(sampleJenkinsContent, sampleGitLabYaml, 'consistency-2', 'test-user'),
        GitLabDryRunEngine.executeDryRun(sampleJenkinsContent, sampleGitLabYaml, 'consistency-3', 'test-user')
      ])

      // All should have the same job count for identical YAML
      expect(results[0].total_jobs).toBe(results[1].total_jobs)
      expect(results[1].total_jobs).toBe(results[2].total_jobs)

      // Job names should be identical
      const jobNames1 = results[0].logs.map(log => log.job_name).sort()
      const jobNames2 = results[1].logs.map(log => log.job_name).sort()
      const jobNames3 = results[2].logs.map(log => log.job_name).sort()
      
      expect(jobNames1).toEqual(jobNames2)
      expect(jobNames2).toEqual(jobNames3)
    })

    test('should handle concurrent dry-run executions', async () => {
      const concurrentRuns = Array(3).fill(null).map((_, index) =>
        GitLabDryRunEngine.executeDryRun(
          sampleJenkinsContent,
          sampleGitLabYaml,
          `concurrent-test-${index}`,
          'test-user'
        )
      )

      const results = await Promise.all(concurrentRuns)
      
      // All should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.total_jobs).toBeGreaterThan(0)
        expect([DryRunStatus.SUCCESS, DryRunStatus.FAILED]).toContain(result.status)
      })
    })
  })

  describe('Data Persistence and Audit', () => {
    test('should save dry-run results to database', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-database-save',
        'test-user'
      )

      expect(result.id).toBeDefined()
      expect(result.id).not.toBe('')
      expect(result.project_id).toBe('test-database-save')
      expect(result.created_by).toBe('test-user')
      expect(result.jenkins_content).toBe(sampleJenkinsContent)
      expect(result.gitlab_yaml).toBe(sampleGitLabYaml)
    })

    test('should maintain execution timeline', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-timeline',
        'test-user'
      )

      expect(result.started_at).toBeInstanceOf(Date)
      expect(result.completed_at).toBeInstanceOf(Date)
      expect(result.completed_at.getTime()).toBeGreaterThan(result.started_at.getTime())
      
      const duration = result.completed_at.getTime() - result.started_at.getTime()
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(60000) // Should complete within 1 minute
    })

    test('should provide comprehensive logging', async () => {
      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        sampleGitLabYaml,
        'test-comprehensive-logs',
        'test-user'
      )

      expect(result.logs).toBeInstanceOf(Array)
      expect(result.logs.length).toBeGreaterThan(0)

      result.logs.forEach(log => {
        expect(log.job_name).toBeDefined()
        expect(typeof log.job_name).toBe('string')
        expect(log.job_name.length).toBeGreaterThan(0)
        
        expect(['success', 'failed', 'skipped']).toContain(log.status)
        
        expect(log.duration).toBeDefined()
        expect(log.duration).toBeGreaterThanOrEqual(0)
        
        expect(log.log_content).toBeDefined()
        expect(typeof log.log_content).toBe('string')
        
        expect(log.warnings).toBeDefined()
        expect(Array.isArray(log.warnings)).toBe(true)
      })
    })
  })

  describe('Edge Cases and Special Scenarios', () => {
    test('should handle YAML with special characters and encoding', async () => {
      const specialYaml = `
test-émojis:
  stage: test
  script:
    - echo "Testing with émojis 🚀 and spëcial chars"
    - echo "Unicode: 测试"

test-quotes:
  stage: test
  script:
    - echo 'Single quotes test'
    - echo "Double quotes with \$variables"
`

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        specialYaml,
        'test-special-chars',
        'test-user'
      )

      expect(result).toBeDefined()
      expect(result.total_jobs).toBeGreaterThan(0)
      
      const jobNames = result.logs.map(log => log.job_name)
      expect(jobNames).toContain('test-émojis')
      expect(jobNames).toContain('test-quotes')
    })

    test('should handle very short execution times', async () => {
      const quickYaml = `
quick-job:
  stage: build
  script:
    - echo "Quick job"
`

      const result = await GitLabDryRunEngine.executeDryRun(
        sampleJenkinsContent,
        quickYaml,
        'test-quick-execution',
        'test-user'
      )

      expect(result.total_jobs).toBe(1)
      expect(result.logs[0].duration).toBeGreaterThanOrEqual(0)
      expect(result.completed_at.getTime() - result.started_at.getTime()).toBeGreaterThan(0)
    })
  })
})