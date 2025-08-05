// __tests__/plugin-mapper.test.ts
import { 
  scanJenkinsFile, 
  mapPlugins, 
  generatePluginSummary, 
  generateMigrationChecklist,
  PluginHit,
  PluginVerdict 
} from '@/lib/plugin-mapper'

describe('Plugin Mapper', () => {
  describe('scanJenkinsFile', () => {
    it('should detect common Jenkins plugins', () => {
      const jenkinsfile = `
        pipeline {
          agent any
          stages {
            stage('Build') {
              steps {
                sh('echo "Building"')
                slackSend(channel: '#builds', message: 'Build complete')
              }
            }
          }
          post {
            always {
              junit('target/surefire-reports/*.xml')
              archiveArtifacts(artifacts: 'target/*.jar')
            }
          }
        }
      `
      
      const hits = scanJenkinsFile(jenkinsfile)
      
      expect(hits.length).toBeGreaterThan(0)
      // Note: 'sh' is now correctly filtered out as it's a shell command, not a plugin
      expect(hits.some(hit => hit.id === 'slack')).toBe(true)
      expect(hits.some(hit => hit.id === 'junit')).toBe(true)
      expect(hits.some(hit => hit.id === 'archive-artifacts')).toBe(true)
    })

    it('should detect plugins in scripted pipelines', () => {
      const jenkinsfile = `
        node {
          stage('Checkout') {
            checkout scm
          }
          stage('Build') {
            sh('mvn clean package')
            junit('target/surefire-reports/*.xml')
          }
          stage('Deploy') {
            timeout(time: 5, unit: 'MINUTES') {
              sh('kubectl apply -f deployment.yaml')
            }
          }
        }
      `
      
      const hits = scanJenkinsFile(jenkinsfile)
      
      expect(hits.some(hit => hit.id === 'junit')).toBe(true)
      expect(hits.some(hit => hit.id === 'build-timeout')).toBe(true)
    })

    it('should capture line numbers and context', () => {
      const jenkinsfile = `pipeline {
  agent any
  stages {
    stage('Test') {
      steps {
        sh 'npm test'
        slackSend(channel: '#test', message: 'Test done')
      }
    }
  }
}`
      
      const hits = scanJenkinsFile(jenkinsfile)
      const slackHit = hits.find(hit => hit.id === 'slack')
      
      expect(slackHit).toBeDefined()
      expect(slackHit?.line).toBe(7)
      expect(slackHit?.context).toContain('slackSend(channel: \'#test\'')
    })

    it('should handle empty or invalid content', () => {
      expect(scanJenkinsFile('')).toEqual([])
      expect(scanJenkinsFile('not a jenkinsfile')).toEqual([])
      expect(scanJenkinsFile('// just a comment')).toEqual([])
    })
  })

  describe('mapPlugins', () => {
    it('should map plugins to GitLab CI equivalents', () => {
      const hits: PluginHit[] = [
        { id: 'slack', line: 10, context: 'slackSend channel: "#test"', confidence: 'high' },
        { id: 'junit', line: 15, context: 'junit "*.xml"', confidence: 'high' },
        { id: 'docker-workflow', line: 20, context: 'docker.build("app")', confidence: 'high' }
      ]
      
      const verdicts = mapPlugins(hits)
      
      expect(verdicts).toHaveLength(3)
      
      const slackVerdict = verdicts.find(v => v.id === 'slack')
      expect(slackVerdict?.status).toBe('native')
      expect(slackVerdict?.gitlab).toContain('notifications:slack')
      
      const junitVerdict = verdicts.find(v => v.id === 'junit')
      expect(junitVerdict?.status).toBe('native')
      expect(junitVerdict?.gitlab).toContain('artifacts:reports:junit')
      
      const dockerVerdict = verdicts.find(v => v.id === 'docker-workflow')
      expect(dockerVerdict?.status).toBe('template')
      expect(dockerVerdict?.include).toContain('Docker.gitlab-ci.yml')
    })

    it('should handle unknown plugins', () => {
      const hits: PluginHit[] = [
        { id: 'unknown-plugin', line: 5, context: 'unknownPlugin()', confidence: 'low' }
      ]
      
      const verdicts = mapPlugins(hits)
      
      expect(verdicts).toHaveLength(1)
      expect(verdicts[0].status).toBe('unsupported')
      expect(verdicts[0].migrationComplexity).toBe('hard')
    })

    it('should merge multiple hits for same plugin', () => {
      const hits: PluginHit[] = [
        { id: 'slack', line: 10, context: 'slackSend channel: "#test"', confidence: 'high' },
        { id: 'slack', line: 25, context: 'slackSend message: "Done"', confidence: 'high' }
      ]
      
      const verdicts = mapPlugins(hits)
      
      expect(verdicts).toHaveLength(1)
      expect(verdicts[0].hits).toHaveLength(2)
      expect(verdicts[0].hits[0].line).toBe(10)
      expect(verdicts[0].hits[1].line).toBe(25)
    })
  })

  describe('generatePluginSummary', () => {
    it('should calculate correct summary statistics', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'slack',
          status: 'native',
          gitlab: 'notifications:slack',
          migrationComplexity: 'easy',
          note: 'Native support',
          hits: [{ id: 'slack', line: 10, context: 'test', confidence: 'high' }]
        },
        {
          id: 'docker-workflow',
          status: 'template',
          include: 'Docker.gitlab-ci.yml',
          migrationComplexity: 'medium',
          note: 'Use template',
          hits: [{ id: 'docker-workflow', line: 15, context: 'test', confidence: 'high' }]
        },
        {
          id: 'custom-plugin',
          status: 'unsupported',
          migrationComplexity: 'hard',
          note: 'Manual implementation needed',
          hits: [{ id: 'custom-plugin', line: 20, context: 'test', confidence: 'low' }]
        }
      ]
      
      const summary = generatePluginSummary(verdicts)
      
      expect(summary.totalPlugins).toBe(3)
      expect(summary.nativeSupport).toBe(1)
      expect(summary.templateAvailable).toBe(1)
      expect(summary.unsupported).toBe(1)
      expect(summary.limited).toBe(0)
      expect(summary.migrationScore).toBe(62) // (1*100 + 1*85 + 1*0) / (3*100) = 185/300 = 61.67, rounded to 62
    })

    it('should handle empty verdicts', () => {
      const summary = generatePluginSummary([])
      
      expect(summary.totalPlugins).toBe(0)
      expect(summary.nativeSupport).toBe(0)
      expect(summary.templateAvailable).toBe(0)
      expect(summary.unsupported).toBe(0)
      expect(summary.limited).toBe(0)
      expect(summary.migrationScore).toBe(100) // Default score when no plugins
    })
  })

  describe('generateMigrationChecklist', () => {
    it('should generate comprehensive checklist', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'slack',
          status: 'native',
          gitlab: 'notifications:slack',
          migrationComplexity: 'easy',
          note: 'Configure Slack webhook',
          hits: [{ id: 'slack', line: 10, context: 'test', confidence: 'high' }]
        },
        {
          id: 'sonarqube',
          status: 'template',
          include: 'SAST.gitlab-ci.yml',
          migrationComplexity: 'medium', 
          note: 'Use GitLab SAST template',
          hits: [{ id: 'sonarqube', line: 15, context: 'test', confidence: 'high' }]
        }
      ]
      
      const checklist = generateMigrationChecklist(verdicts)
      
      expect(checklist).toContain('# Jenkins to GitLab CI Migration Checklist')
      expect(checklist).toContain('## Summary')
      expect(checklist).toContain('- **Total Plugins:** 2')
      expect(checklist).toContain('## ✅ Native Support (Easy Migration)')
      expect(checklist).toContain('## ⚠️ Template Available (Medium Migration)')
      expect(checklist).toContain('- [ ] **slack**')
      expect(checklist).toContain('- [ ] **sonarqube**')
    })

    it('should handle different plugin statuses', () => {
      const verdicts: PluginVerdict[] = [
        {
          id: 'custom-plugin',
          status: 'unsupported',
          migrationComplexity: 'hard',
          note: 'Requires custom implementation',
          hits: [{ id: 'custom-plugin', line: 10, context: 'test', confidence: 'low' }]
        }
      ]
      
      const checklist = generateMigrationChecklist(verdicts)
      
      expect(checklist).toContain('## ❌ Unsupported (Hard Migration)')
      expect(checklist).toContain('- [ ] **custom-plugin**')
      expect(checklist).toContain('Requires custom implementation')
    })
  })

  describe('Integration Tests', () => {
    it('should process complete Jenkins pipeline end-to-end', () => {
      const jenkinsfile = `
        pipeline {
          agent any
          options {
            timeout(time: 1, unit: 'HOURS')
            buildDiscarder(logRotator(numToKeepStr: '10'))
          }
          stages {
            stage('Build') {
              steps {
                sh 'mvn clean package'
                junit 'target/surefire-reports/*.xml'
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
            stage('Deploy') {
              steps {
                script {
                  docker.build('myapp:latest')
                  docker.image('myapp:latest').push()
                }
                slackSend(
                  channel: '#deployments',
                  message: 'Deployment complete!'
                )
              }
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'target/*.jar'
              cleanWs()
            }
          }
        }
      `
      
      // Scan for plugins
      const hits = scanJenkinsFile(jenkinsfile)
      expect(hits.length).toBeGreaterThan(0)
      
      // Map to GitLab equivalents
      const verdicts = mapPlugins(hits)
      expect(verdicts.length).toBeGreaterThan(0)
      
      // Generate summary
      const summary = generatePluginSummary(verdicts)
      expect(summary.totalPlugins).toBeGreaterThan(0)
      expect(summary.migrationScore).toBeGreaterThan(0)
      
      // Generate checklist
      const checklist = generateMigrationChecklist(verdicts)
      expect(checklist).toContain('# Jenkins to GitLab CI Migration Checklist')
      expect(checklist.length).toBeGreaterThan(100) // Should be substantial
    })
  })
})