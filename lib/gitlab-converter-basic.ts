// lib/gitlab-converter.ts
import { ScanResult } from '@/types'

interface GitLabJob {
  stage?: string
  script: string[]
  image?: string
  extends?: string
  services?: string[]
  artifacts?: any
  cache?: any
  only?: string[]
  except?: string[]
  when?: string
  allow_failure?: boolean
  dependencies?: string[]
  needs?: string[]
  parallel?: any
}

interface GitLabPipeline {
  stages?: string[]
  variables?: Record<string, string>
  default?: Partial<GitLabJob>
  [key: string]: any
}

// Plugin mapping from Jenkins to GitLab
const PLUGIN_MAPPINGS: Record<string, (pipeline: GitLabPipeline) => void> = {
  maven: (pipeline) => {
    pipeline.default = pipeline.default || {}
    pipeline.default.image = 'maven:3.8-openjdk-11'
    pipeline.variables = { ...pipeline.variables, MAVEN_OPTS: '-Dmaven.repo.local=.m2/repository' }
    pipeline.default.cache = {
      paths: ['.m2/repository/']
    }
  },
  gradle: (pipeline) => {
    pipeline.default = pipeline.default || {}
    pipeline.default.image = 'gradle:7-jdk11'
    pipeline.default.cache = {
      paths: ['build/', '.gradle/']
    }
  },
  docker: (pipeline) => {
    pipeline.default = pipeline.default || {}
    pipeline.default.image = 'docker:latest'
    pipeline.default.services = ['docker:dind']
    pipeline.variables = { ...pipeline.variables, DOCKER_DRIVER: 'overlay2' }
  },
  nodejs: (pipeline) => {
    pipeline.default = pipeline.default || {}
    pipeline.default.image = 'node:16'
    pipeline.default.cache = {
      paths: ['node_modules/']
    }
  },
  sonarqube: (pipeline) => {
    pipeline.variables = { 
      ...pipeline.variables, 
      SONAR_HOST_URL: '${SONAR_HOST_URL}',
      SONAR_TOKEN: '${SONAR_TOKEN}'
    }
  }
}

// Convert complexity tier to appropriate GitLab structure
const getStagesForComplexity = (tier: string, isScripted: boolean): string[] => {
  if (tier === 'simple') {
    return ['build', 'test']
  } else if (tier === 'medium') {
    return ['build', 'test', 'quality', 'deploy']
  } else {
    return ['prepare', 'build', 'test', 'quality', 'package', 'deploy', 'cleanup']
  }
}

// Generate job templates based on detected plugins
const generateJobs = (scanResult: ScanResult, stages: string[]): Record<string, GitLabJob> => {
  const jobs: Record<string, GitLabJob> = {}
  
  // Build stage
  jobs['build:app'] = {
    stage: 'build',
    script: [
      'echo "Building application..."',
      scanResult.pluginHits.find(p => p.key === 'maven') ? 'mvn clean compile' :
      scanResult.pluginHits.find(p => p.key === 'gradle') ? 'gradle build' :
      scanResult.pluginHits.find(p => p.key === 'npm') ? 'npm install && npm run build' :
      'echo "Add your build commands here"'
    ]
  }
  
  // Test stage
  if (stages.includes('test')) {
    jobs['test:unit'] = {
      stage: 'test',
      script: [
        'echo "Running tests..."',
        scanResult.pluginHits.find(p => p.key === 'maven') ? 'mvn test' :
        scanResult.pluginHits.find(p => p.key === 'gradle') ? 'gradle test' :
        scanResult.pluginHits.find(p => p.key === 'npm') ? 'npm test' :
        'echo "Add your test commands here"'
      ]
    }
    
    if (scanResult.pluginHits.find(p => p.key === 'junit')) {
      jobs['test:unit'].artifacts = {
        reports: {
          junit: ['**/target/surefire-reports/TEST-*.xml', '**/build/test-results/test/TEST-*.xml']
        }
      }
    }
  }
  
  // Quality stage
  if (stages.includes('quality') && scanResult.pluginHits.find(p => p.key === 'sonarqube')) {
    jobs['quality:sonar'] = {
      stage: 'quality',
      script: [
        'echo "Running SonarQube analysis..."',
        scanResult.pluginHits.find(p => p.key === 'maven') ? 
          'mvn sonar:sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN' :
          'sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN'
      ]
    }
  }
  
  // Package stage (Docker)
  if (stages.includes('package') && scanResult.pluginHits.find(p => p.key === 'docker')) {
    jobs['package:docker'] = {
      stage: 'package',
      script: [
        'docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .',
        'docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA',
        'docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest',
        'docker push $CI_REGISTRY_IMAGE:latest'
      ]
    }
  }
  
  // Deploy stage
  if (stages.includes('deploy')) {
    jobs['deploy:staging'] = {
      stage: 'deploy',
      script: [
        'echo "Deploying to staging..."',
        scanResult.pluginHits.find(p => p.key === 'kubernetes') ? 
          'kubectl apply -f k8s/staging/' :
        scanResult.pluginHits.find(p => p.key === 'helm') ?
          'helm upgrade --install app-staging ./chart' :
          'echo "Add your deployment commands here"'
      ],
      only: ['develop', 'main']
    }
  }
  
  // Add parallel execution if detected
  if (scanResult.pluginHits.find(p => p.key === 'parallel')) {
    jobs['test:integration'] = {
      stage: 'test',
      script: ['echo "Running integration tests..."'],
      needs: ['build:app']
    }
    jobs['test:security'] = {
      stage: 'test', 
      script: ['echo "Running security tests..."'],
      needs: ['build:app']
    }
  }
  
  return jobs
}

// Main conversion function
export function convertToGitLabCI(scanResult: ScanResult, jenkinsContent: string): string {
  const pipeline: GitLabPipeline = {}
  
  // Set up stages based on complexity
  const stages = getStagesForComplexity(scanResult.tier, scanResult.scripted)
  pipeline.stages = stages
  
  // Apply plugin-specific configurations
  scanResult.pluginHits.forEach(plugin => {
    if (PLUGIN_MAPPINGS[plugin.key]) {
      PLUGIN_MAPPINGS[plugin.key](pipeline)
    }
  })
  
  // Add common variables
  pipeline.variables = {
    ...pipeline.variables,
    GIT_STRATEGY: 'clone',
    GIT_DEPTH: '50'
  }
  
  // Generate jobs
  const jobs = generateJobs(scanResult, stages)
  
  // Combine everything
  const fullPipeline = {
    ...pipeline,
    ...jobs
  }
  
  // Convert to YAML format
  return generateYAML(fullPipeline, scanResult, jenkinsContent)
}

// Generate YAML with comments and formatting
function generateYAML(pipeline: GitLabPipeline, scanResult: ScanResult, jenkinsContent: string): string {
  let yaml = `# GitLab CI/CD Pipeline
# Auto-generated from Jenkins pipeline (${scanResult.declarative ? 'Declarative' : scanResult.scripted ? 'Scripted' : 'Unknown'})
# Complexity: ${scanResult.tier.toUpperCase()} | Lines: ${scanResult.lineCount} | Plugins: ${scanResult.pluginCount}
# Generated on: ${new Date().toISOString()}

`

  // Add warnings as comments
  if (scanResult.warnings.length > 0) {
    yaml += '# ⚠️  Migration Warnings:\n'
    scanResult.warnings.forEach(warning => {
      yaml += `#   - ${warning}\n`
    })
    yaml += '\n'
  }

  // Add variables
  if (pipeline.variables && Object.keys(pipeline.variables).length > 0) {
    yaml += 'variables:\n'
    Object.entries(pipeline.variables).forEach(([key, value]) => {
      yaml += `  ${key}: "${value}"\n`
    })
    yaml += '\n'
  }

  // Add default configuration
  if (pipeline.default) {
    yaml += 'default:\n'
    if (pipeline.default.image) yaml += `  image: ${pipeline.default.image}\n`
    if (pipeline.default.services) {
      yaml += '  services:\n'
      pipeline.default.services.forEach((service: string) => {
        yaml += `    - ${service}\n`
      })
    }
    if (pipeline.default.cache) {
      yaml += '  cache:\n'
      yaml += '    paths:\n'
      pipeline.default.cache.paths.forEach((path: string) => {
        yaml += `      - ${path}\n`
      })
    }
    yaml += '\n'
  }

  // Add stages
  if (pipeline.stages) {
    yaml += 'stages:\n'
    pipeline.stages.forEach(stage => {
      yaml += `  - ${stage}\n`
    })
    yaml += '\n'
  }

  // Add jobs
  const jobs = { ...pipeline }
  delete jobs.stages
  delete jobs.variables
  delete jobs.default

  Object.entries(jobs).forEach(([jobName, job]) => {
    if (typeof job === 'object' && job !== null) {
      yaml += `${jobName}:\n`
      const gitlabJob = job as GitLabJob
      
      if (gitlabJob.stage) yaml += `  stage: ${gitlabJob.stage}\n`
      if (gitlabJob.image) yaml += `  image: ${gitlabJob.image}\n`
      
      if (gitlabJob.script) {
        yaml += '  script:\n'
        gitlabJob.script.forEach(cmd => {
          yaml += `    - ${cmd}\n`
        })
      }
      
      if (gitlabJob.artifacts) {
        yaml += '  artifacts:\n'
        if (gitlabJob.artifacts.reports?.junit) {
          yaml += '    reports:\n'
          yaml += '      junit:\n'
          gitlabJob.artifacts.reports.junit.forEach((pattern: string) => {
            yaml += `        - ${pattern}\n`
          })
        }
      }
      
      if (gitlabJob.only) {
        yaml += '  only:\n'
        gitlabJob.only.forEach(branch => {
          yaml += `    - ${branch}\n`
        })
      }
      
      if (gitlabJob.needs) {
        yaml += '  needs:\n'
        gitlabJob.needs.forEach(need => {
          yaml += `    - ${need}\n`
        })
      }
      
      yaml += '\n'
    }
  })

  // Add migration notes
  yaml += `# Migration Notes:
# 1. Update image names and versions according to your requirements
# 2. Replace placeholder variables with actual values in GitLab CI/CD settings
# 3. Review and adjust job scripts based on your specific build requirements
# 4. Configure GitLab runners with appropriate tags if needed
# 5. Set up GitLab Container Registry if using Docker builds
`

  if (scanResult.scripted) {
    yaml += `#
# ⚠️  IMPORTANT: This pipeline was converted from a Scripted Jenkins pipeline.
# Scripted pipelines often contain complex logic that may need manual adjustment.
# Please review carefully and test thoroughly before using in production.
`
  }

  return yaml
}

// Export additional utility functions
export function validateGitLabCI(yaml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic validation
  if (!yaml.includes('stages:')) {
    errors.push('No stages defined')
  }
  
  // Check for at least one job
  const jobPattern = /^[a-zA-Z0-9_-]+:$/gm
  const jobs = yaml.match(jobPattern)
  if (!jobs || jobs.length === 0) {
    errors.push('No jobs defined')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
