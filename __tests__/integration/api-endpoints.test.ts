/**
 * Integration Tests for API Endpoints
 * Ensures all API endpoints work correctly and handle errors properly
 */

import { createMocks } from 'node-mocks-http'
import convertHandler from '@/pages/api/convert'
import simpleConvertHandler from '@/pages/api/simple-convert'
import pluginAnalysisHandler from '@/pages/api/plugin-analysis'
import dryRunHandler from '@/pages/api/dry-run'

describe('API Endpoints Integration Tests', () => {
  const sampleJenkinsfile = `
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
    }
    
    environment {
        APP_NAME = 'test-app'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
                publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
            }
        }
        
        stage('Docker Build') {
            steps {
                script {
                    def image = docker.build("test-app:latest")
                    withCredentials([string(credentialsId: 'docker-token', variable: 'DOCKER_TOKEN')]) {
                        image.push()
                    }
                }
            }
        }
    }
    
    post {
        success {
            slackSend channel: '#ci-results', message: "Build successful"
        }
    }
}`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/convert', () => {
    test('should convert Jenkins pipeline to GitLab CI YAML', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: sampleJenkinsfile
        }
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.yaml).toBeDefined()
      expect(typeof data.yaml).toBe('string')
      expect(data.yaml.length).toBeGreaterThan(500)
      
      // Verify GitLab CI structure
      expect(data.yaml).toContain('stages:')
      expect(data.yaml).toContain('script:')
      expect(data.yaml).not.toContain('pipeline {')
    })

    test('should reject empty content', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: ''
        }
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toContain('Content is required')
    })

    test('should reject non-POST methods', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(405)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Method not allowed')
    })

    test('should handle malicious content', async () => {
      const maliciousContent = sampleJenkinsfile + '\n<script>alert("xss")</script>'
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: maliciousContent
        }
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Invalid content')
    })

    test('should handle large content appropriately', async () => {
      const largeContent = 'a'.repeat(2 * 1024 * 1024) // 2MB
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: largeContent
        }
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('size limit')
    })

    test('should include CORS headers', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toContain('POST')
    })
  })

  describe('/api/simple-convert', () => {
    test('should provide simplified conversion', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile
        }
      })

      await simpleConvertHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.yaml).toBeDefined()
      expect(data.stages).toBeDefined()
      expect(Array.isArray(data.stages)).toBe(true)
      expect(data.stages.length).toBeGreaterThan(0)
      expect(data.stages).toContain('build')
    })

    test('should extract stages correctly', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile
        }
      })

      await simpleConvertHandler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.stages).toContain('build')
      expect(data.stages).toContain('test')
      expect(data.stages).toContain('deploy')
    })

    test('should handle missing jenkinsContent field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await simpleConvertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('jenkinsContent is required')
    })
  })

  describe('/api/plugin-analysis', () => {
    test('should analyze Jenkins plugins successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          projectId: 'test-plugin-analysis'
        }
      })

      await pluginAnalysisHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.total_plugins).toBeGreaterThanOrEqual(0)
      expect(data.data.plugins).toBeInstanceOf(Array)
      expect(data.data.scanned_at).toBeDefined()
    }, 30000)

    test('should detect specific plugins', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          projectId: 'test-specific-plugins'
        }
      })

      await pluginAnalysisHandler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.data.total_plugins).toBeGreaterThan(0)
      
      const pluginNames = data.data.plugins.map((p: any) => p.plugin_name)
      expect(pluginNames).toContain('credentials-binding')
      expect(pluginNames).toContain('docker-workflow')
      expect(pluginNames).toContain('slack')
    }, 30000)

    test('should provide plugin compatibility information', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          projectId: 'test-compatibility-info'
        }
      })

      await pluginAnalysisHandler(req, res)

      const data = JSON.parse(res._getData())
      
      if (data.data.plugins.length > 0) {
        const plugin = data.data.plugins[0]
        expect(plugin.plugin_name).toBeDefined()
        expect(plugin.compatibility_status).toBeDefined()
        expect(['compatible', 'partial', 'unsupported', 'unknown']).toContain(plugin.compatibility_status)
        expect(plugin.migration_notes).toBeDefined()
        expect(typeof plugin.is_blocking).toBe('boolean')
      }
    }, 30000)

    test('should require jenkinsContent field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          projectId: 'test-missing-content'
        }
      })

      await pluginAnalysisHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('jenkinsContent is required')
    })

    test('should handle empty Jenkins content gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: '',
          projectId: 'test-empty-content'
        }
      })

      await pluginAnalysisHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data.total_plugins).toBe(0)
    })
  })

  describe('/api/dry-run', () => {
    const sampleGitLabYaml = `
stages:
  - build
  - test

build-job:
  stage: build
  script:
    - echo "Building..."
    - make build

test-job:
  stage: test
  script:
    - echo "Testing..."
    - make test
`

    test('should execute dry-run successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          gitlabYaml: sampleGitLabYaml,
          projectId: 'test-dry-run'
        }
      })

      await dryRunHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.id).toBeDefined()
      expect(data.data.status).toBeDefined()
      expect(['success', 'failed', 'running']).toContain(data.data.status)
      expect(data.data.total_jobs).toBeGreaterThan(0)
      expect(data.data.logs).toBeInstanceOf(Array)
    }, 35000)

    test('should provide detailed dry-run results', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          gitlabYaml: sampleGitLabYaml,
          projectId: 'test-detailed-results'
        }
      })

      await dryRunHandler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.data.passed_jobs + data.data.failed_jobs).toBe(data.data.total_jobs)
      expect(data.data.warnings).toBeInstanceOf(Array)
      expect(data.data.manual_steps).toBeInstanceOf(Array)
      expect(data.data.summary).toBeDefined()
      expect(data.data.summary.success_rate).toBeGreaterThanOrEqual(0)
      expect(data.data.summary.success_rate).toBeLessThanOrEqual(100)
    }, 35000)

    test('should require both jenkinsContent and gitlabYaml', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile
          // Missing gitlabYaml
        }
      })

      await dryRunHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('gitlabYaml are required')
    })

    test('should validate GitLab YAML structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          gitlabYaml: 'invalid: yaml: structure',
          projectId: 'test-invalid-yaml'
        }
      })

      await dryRunHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('Invalid GitLab CI YAML')
    })

    test('should handle content size limits', async () => {
      const largeContent = 'a'.repeat(1.5 * 1024 * 1024) // 1.5MB
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: largeContent,
          gitlabYaml: sampleGitLabYaml,
          projectId: 'test-large-content'
        }
      })

      await dryRunHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      
      const data = JSON.parse(res._getData())
      expect(data.error).toContain('exceeds maximum size limit')
    })

    test('should support GET requests for status checking', async () => {
      // First create a dry-run
      const { req: postReq, res: postRes } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile,
          gitlabYaml: sampleGitLabYaml,
          projectId: 'test-status-check'
        }
      })

      await dryRunHandler(postReq, postRes)
      const postData = JSON.parse(postRes._getData())
      
      // Then check status
      const { req: getReq, res: getRes } = createMocks({
        method: 'GET',
        query: {
          projectId: 'test-status-check'
        }
      })

      await dryRunHandler(getReq, getRes)

      expect(getRes._getStatusCode()).toBe(200)
      
      const getData = JSON.parse(getRes._getData())
      expect(getData.success).toBe(true)
      expect(getData.data).toBeDefined()
      expect(getData.data.status).toBeDefined()
    }, 35000)
  })

  describe('Error Handling and Security', () => {
    test('should handle malformed JSON requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      })

      // Simulate malformed JSON by not providing body
      req.body = undefined

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    test('should validate content-type headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'text/plain'
        },
        body: 'plain text content' as any
      })

      await convertHandler(req, res)

      // Should handle or reject non-JSON content appropriately
      expect([200, 400, 415]).toContain(res._getStatusCode())
    })

    test('should handle concurrent API requests', async () => {
      const requests = Array(5).fill(null).map(() => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            content: sampleJenkinsfile
          }
        })
        return convertHandler(req, res).then(() => res)
      })

      const responses = await Promise.all(requests)
      
      responses.forEach((res: any) => {
        expect(res._getStatusCode()).toBe(200)
        const data = JSON.parse(res._getData())
        expect(data.success).toBe(true)
      })
    })

    test('should prevent injection attacks in content', async () => {
      const maliciousJenkinsfile = `
        pipeline {
          agent any
          stages {
            stage('Build') {
              steps {
                sh 'echo "\${java:runtime}" && rm -rf /'
                sh 'cat /etc/passwd'
              }
            }
          }
        }`

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: maliciousJenkinsfile
        }
      })

      await convertHandler(req, res)

      // Should either reject or sanitize the malicious content
      expect([200, 400]).toContain(res._getStatusCode())
      
      if (res._getStatusCode() === 200) {
        const data = JSON.parse(res._getData())
        // Generated YAML should not contain dangerous commands
        expect(data.yaml).not.toContain('rm -rf /')
        expect(data.yaml).not.toContain('/etc/passwd')
      }
    })

    test('should handle timeout scenarios gracefully', async () => {
      // Mock a slow operation
      jest.setTimeout(15000)
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          jenkinsContent: sampleJenkinsfile.repeat(20), // Large content to potentially cause timeout
          projectId: 'test-timeout'
        }
      })

      await pluginAnalysisHandler(req, res)

      // Should complete within reasonable time or handle timeout gracefully
      expect([200, 408, 500]).toContain(res._getStatusCode())
    }, 20000)
  })

  describe('Response Format Validation', () => {
    test('should return consistent response format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: sampleJenkinsfile
        }
      })

      await convertHandler(req, res)

      const data = JSON.parse(res._getData())
      
      // All API responses should have success field
      expect(typeof data.success).toBe('boolean')
      
      if (data.success) {
        expect(data.yaml).toBeDefined()
      } else {
        expect(data.error).toBeDefined()
        expect(typeof data.error).toBe('string')
      }
    })

    test('should include proper HTTP headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          content: sampleJenkinsfile
        }
      })

      await convertHandler(req, res)

      expect(res.getHeader('Content-Type')).toContain('application/json')
      expect(res.getHeader('Access-Control-Allow-Origin')).toBeDefined()
    })

    test('should handle missing request bodies', async () => {
      const { req, res } = createMocks({
        method: 'POST'
        // No body provided
      })

      await convertHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })
})