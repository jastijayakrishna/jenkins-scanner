import { convertToGitLabCI } from '@/lib/gitlab-converter'
import { ScanResult } from '@/types'

describe('Parameter Extraction Feature', () => {
  it('should extract and convert Jenkins parameters to GitLab variables with workflow rules', () => {
    const jenkinsContent = `
pipeline {
    agent any
    
    parameters {
        string(name: 'DEPLOY_ENV', defaultValue: 'staging', description: 'Target deployment environment')
        booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Execute test suite')
        choice(name: 'BUILD_TYPE', choices: ['Debug', 'Release', 'Profile'], description: 'Build configuration type')
        text(name: 'RELEASE_NOTES', defaultValue: '', description: 'Release notes for this build')
    }
    
    environment {
        APP_NAME = 'my-app'
        VERSION = '1.0.0'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
    }
}
`

    const scanResult: ScanResult = {
      pluginHits: [
        { key: 'maven', name: 'Maven', category: 'build' },
        { key: 'parameters', name: 'Parameters', category: 'other' }
      ],
      pluginCount: 2,
      scripted: false,
      declarative: true,
      tier: 'simple',
      lineCount: 25,
      warnings: [],
      timestamp: Date.now()
    }

    const yaml = convertToGitLabCI(scanResult, jenkinsContent)
    
    console.log('Generated YAML with parameters:')
    console.log('=====================================')
    console.log(yaml)
    console.log('=====================================')
    
    // Check workflow rules are added
    expect(yaml).toContain('workflow:')
    expect(yaml).toContain('rules:')
    expect(yaml).toContain('$CI_PIPELINE_SOURCE == "web"')
    expect(yaml).toContain('$CI_PIPELINE_SOURCE == "api"')
    
    // Check parameters are converted to variables
    expect(yaml).toContain('variables:')
    expect(yaml).toContain('DEPLOY_ENV: "staging"')
    expect(yaml).toContain('RUN_TESTS: "true"')
    expect(yaml).toContain('BUILD_TYPE: "Debug"')  // First choice as default
    expect(yaml).toContain('RELEASE_NOTES: ""')
    
    // Check parameter descriptions are included as comments
    expect(yaml).toContain('# Target deployment environment')
    expect(yaml).toContain('# Execute test suite')
    expect(yaml).toContain('# Build configuration type')
    expect(yaml).toContain('# Release notes for this build')
    
    // Check choice options are documented
    expect(yaml).toContain('# Options: Debug, Release, Profile')
    
    // Check environment variables are also included
    expect(yaml).toContain('APP_NAME: "my-app"')
    expect(yaml).toContain('VERSION: "1.0.0"')
    
    // Check that parameters appear in workflow rules
    expect(yaml).toMatch(/variables:\s+DEPLOY_ENV: "staging"/)
  })
})
