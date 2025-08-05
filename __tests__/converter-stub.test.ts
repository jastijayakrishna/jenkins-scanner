// __tests__/converter-stub.test.ts
import { 
  generatePluginStubs,
  generateAdvancedFeatures,
  generateComplexMatrix,
  generateParallelSecurityScans,
  generateRetryLogic,
  generateVaultIntegration,
  generateNotificationJobs
} from '@/lib/gitlab-converter-advanced'
import { PluginVerdict } from '@/lib/plugin-mapper'
import { JenkinsFeatures } from '@/lib/jenkins-parser'

describe('GitLab Converter Stubs', () => {
  describe('generatePluginStubs', () => {
    it('should generate includes for template plugins', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'docker-workflow',
          status: 'template',
          include: 'https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Docker.gitlab-ci.yml',
          migrationComplexity: 'medium',
          note: 'Use Docker template',
          hits: [{ id: 'docker-workflow', line: 10, context: 'docker.build', confidence: 'high' }]
        },
        {
          id: 'sonarqube',
          status: 'template', 
          include: 'template: Security/SAST.gitlab-ci.yml',
          migrationComplexity: 'medium',
          note: 'Use SAST template',
          hits: [{ id: 'sonarqube', line: 15, context: 'sonar scan', confidence: 'high' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      expect(yaml).toContain('# Auto-generated includes from detected Jenkins plugins')
      expect(yaml).toContain('include:')
      expect(yaml).toContain('- remote: "https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Docker.gitlab-ci.yml"')
      expect(yaml).toContain('- template: Security/SAST.gitlab-ci.yml')
    })

    it('should generate job stubs for native plugins', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'slack',
          status: 'native',
          gitlab: 'notifications:slack',
          migrationComplexity: 'easy',
          note: 'Configure webhook',
          hits: [{ id: 'slack', line: 10, context: 'slackSend', confidence: 'high' }]
        },
        {
          id: 'email-ext',
          status: 'native',
          gitlab: 'email notifications', 
          migrationComplexity: 'easy',
          note: 'Use GitLab email settings',
          hits: [{ id: 'email-ext', line: 15, context: 'emailext', confidence: 'high' }]
        },
        {
          id: 'ws-cleanup',
          status: 'native',
          gitlab: 'cleanup job',
          migrationComplexity: 'easy', 
          note: 'Use post stage cleanup',
          hits: [{ id: 'ws-cleanup', line: 20, context: 'cleanWs', confidence: 'high' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      expect(yaml).toContain('# Auto-generated job stubs from detected Jenkins plugins')
      expect(yaml).toContain('notify:slack:')
      expect(yaml).toContain('SLACK_WEBHOOK_URL')
      expect(yaml).toContain('notify:email:')
      expect(yaml).toContain('cleanup:workspace:')
      expect(yaml).toContain('stage: .post')
    })

    it('should handle credentials-binding plugin', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'credentials-binding',
          status: 'native',
          gitlab: 'CI/CD Variables',
          migrationComplexity: 'easy',
          note: 'Use GitLab CI/CD Variables', 
          hits: [{ id: 'credentials-binding', line: 10, context: 'withCredentials', confidence: 'high' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      expect(yaml).toContain('setup:credentials:')
      expect(yaml).toContain('GitLab CI/CD Variables')
      expect(yaml).toContain('masked variables')
    })

    it('should handle timestamper plugin', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'timestamper',
          status: 'native',
          gitlab: 'FF_TIMESTAMPS',
          migrationComplexity: 'easy',
          note: 'Use GitLab timestamps',
          hits: [{ id: 'timestamper', line: 10, context: 'timestamps', confidence: 'high' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      expect(yaml).toContain('variables:')
      expect(yaml).toContain('FF_TIMESTAMPS: "true"')
    })

    it('should handle parallel plugin', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'parallel',
          status: 'native',
          gitlab: 'parallel jobs',
          migrationComplexity: 'medium',
          note: 'Use parallel job syntax',
          hits: [{ id: 'parallel', line: 10, context: 'parallel', confidence: 'high' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      expect(yaml).toContain('parallel:job1:')
      expect(yaml).toContain('parallel:job2:')
      expect(yaml).toContain('stage: test')
    })

    it('should handle empty verdicts', () => {
      const yaml = generatePluginStubs([])
      expect(yaml).toBe('')
    })

    it('should handle mixed plugin types', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'docker-workflow',
          status: 'template',
          include: 'template: Docker.gitlab-ci.yml',
          migrationComplexity: 'medium',
          note: 'Use template',
          hits: [{ id: 'docker-workflow', line: 10, context: 'docker', confidence: 'high' }]
        },
        {
          id: 'slack',
          status: 'native',
          gitlab: 'notifications:slack',
          migrationComplexity: 'easy',
          note: 'Configure webhook',
          hits: [{ id: 'slack', line: 15, context: 'slackSend', confidence: 'high' }]
        },
        {
          id: 'unsupported-plugin',
          status: 'unsupported',
          migrationComplexity: 'hard',
          note: 'Manual implementation needed',
          hits: [{ id: 'unsupported-plugin', line: 20, context: 'custom', confidence: 'low' }]
        }
      ]
      
      const yaml = generatePluginStubs(verdicts)
      
      // Should include template
      expect(yaml).toContain('include:')
      expect(yaml).toContain('- template: Docker.gitlab-ci.yml')
      
      // Should include native stub  
      expect(yaml).toContain('notify:slack:')
      
      // Should not include unsupported plugins
      expect(yaml).not.toContain('unsupported-plugin')
    })
  })

  describe('generateAdvancedFeatures', () => {
    it('should integrate plugin stubs with features', () => {
      const features: JenkinsFeatures = {
        matrix: { axes: {} },
        retry: null,
        credentials: [],
        when: [],
        timeout: { time: 30, unit: 'MINUTES' },
        postActions: { always: ['cleanup_workspace'] },
        buildDiscarder: { daysToKeep: 30 },
        environment: {},
        parameters: [],
        parallelStages: ['build', 'test']
      }
      
      const scanResult = {
        pluginHits: [
          { key: 'sonarqube', name: 'SonarQube' }
        ]
      }
      
      const pluginVerdicts: PluginVerdict[] = [
        {
          id: 'slack',
          status: 'native',
          gitlab: 'notifications:slack',
          migrationComplexity: 'easy',
          note: 'Configure webhook',
          hits: [{ id: 'slack', line: 10, context: 'slackSend', confidence: 'high' }]
        }
      ]
      
      const yaml = generateAdvancedFeatures(features, scanResult, pluginVerdicts)
      
      expect(yaml).toContain('notify:slack:')
      expect(yaml).toContain('Security/SAST.gitlab-ci.yml')
      expect(yaml).toContain('timeout: 30m')
      expect(yaml).toContain('expire_in: 30 days')
      expect(yaml).toContain('cleanup:')
    })
  })

  describe('generateComplexMatrix', () => {
    it('should generate matrix build configuration', () => {
      const matrix = {
        axes: {
          'NODE_VERSION': ['14', '16', '18'],
          'OS': ['ubuntu-latest', 'windows-latest']
        }
      }
      
      const yaml = generateComplexMatrix(matrix)
      
      expect(yaml).toContain('# Matrix Build Configuration')
      expect(yaml).toContain('test:matrix:')
      expect(yaml).toContain('parallel:')
      expect(yaml).toContain('matrix:')
      expect(yaml).toContain('NODE_VERSION:')
      expect(yaml).toContain('- "14"')
      expect(yaml).toContain('- "16"') 
      expect(yaml).toContain('- "18"')
      expect(yaml).toContain('OS:')
      expect(yaml).toContain('- "ubuntu-latest"')
      expect(yaml).toContain('- "windows-latest"')
      expect(yaml).toContain('echo "Testing with $NODE_VERSION and $OS"')
    })

    it('should handle single axis matrix', () => {
      const matrix = {
        axes: {
          'VERSION': ['1.0', '2.0']
        }
      }
      
      const yaml = generateComplexMatrix(matrix)
      
      expect(yaml).toContain('VERSION:')
      expect(yaml).toContain('- "1.0"')
      expect(yaml).toContain('- "2.0"')
      expect(yaml).toContain('echo "Testing with $VERSION"')
    })
  })

  describe('generateParallelSecurityScans', () => {
    it('should create parallel security scan jobs', () => {
      const yaml = generateParallelSecurityScans()
      
      expect(yaml).toContain('# Parallel Security Scans')
      expect(yaml).toContain('sonar:scan:')
      expect(yaml).toContain('trivy:scan:')
      expect(yaml).toContain('stage: security')
      expect(yaml).toContain('needs: []')
      expect(yaml).toContain('mvn sonar:sonar')
      expect(yaml).toContain('trivy image myapp:latest')
    })
  })

  describe('generateRetryLogic', () => {
    it('should create retry configuration', () => {
      const yaml = generateRetryLogic()
      
      expect(yaml).toContain('deploy:with:retry:')
      expect(yaml).toContain('retry:')
      expect(yaml).toContain('max: 2')
      expect(yaml).toContain('runner_system_failure')
      expect(yaml).toContain('stuck_or_timeout_failure')
      expect(yaml).toContain('for i in $(seq 1 3)')
      expect(yaml).toContain('helm upgrade --install')
    })
  })

  describe('generateVaultIntegration', () => {
    it('should create Vault integration job', () => {
      const yaml = generateVaultIntegration()
      
      expect(yaml).toContain('vault:secrets:')
      expect(yaml).toContain('image: vault:latest')
      expect(yaml).toContain('VAULT_ADDR')
      expect(yaml).toContain('VAULT_TOKEN')
      expect(yaml).toContain('vault kv get')
      expect(yaml).toContain('artifacts:')
      expect(yaml).toContain('k8s_token.txt')
      expect(yaml).toContain('expire_in: 1 hour')
    })
  })

  describe('generateNotificationJobs', () => {
    it('should create notification jobs', () => {
      const yaml = generateNotificationJobs()
      
      expect(yaml).toContain('notify:slack:')
      expect(yaml).toContain('SLACK_WEBHOOK_URL')
      expect(yaml).toContain('curl -X POST')
      expect(yaml).toContain('Build successful!')
      expect(yaml).toContain('allow_failure: true')
      expect(yaml).toContain('# Email notifications are configured in GitLab project settings')
    })
  })
})