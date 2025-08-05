// lib/gitlab-converter.ts
import { ScanResult } from '@/types'
import { extractAllFeatures, JenkinsParameter } from './jenkins-parser'

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
  coverage?: string
  before_script?: string[]
  after_script?: string[]
  environment?: any
  rules?: any[]
  variables?: Record<string, any>
}

interface GitLabPipeline {
  stages?: string[]
  variables?: Record<string, string>
  default?: Partial<GitLabJob>
  workflow?: {
    rules?: Array<{
      if?: string
      when?: string
      variables?: Record<string, string>
    }>
  }
  [key: string]: any
}

// Convert Jenkins parameters to GitLab variables
function convertParametersToVariables(params: JenkinsParameter[]): Record<string, string> {
  const variables: Record<string, string> = {}
  
  params.forEach(param => {
    // For choice parameters, use the first choice as default if no default specified
    if (param.type === 'choice' && !param.defaultValue && param.choices?.length) {
      variables[param.name] = param.choices[0]
    } else {
      variables[param.name] = param.defaultValue || ''
    }
  })
  
  return variables
}

// Plugin mapping from Jenkins to GitLab
const PLUGIN_MAPPINGS: Record<string, (pipeline: GitLabPipeline) => void> = {
  maven: (pipeline) => {
    pipeline.default = pipeline.default || {}
    // Use Java 17 compatible Maven image
    pipeline.default.image = 'maven:3.9-eclipse-temurin-17'
    pipeline.variables = { 
      ...pipeline.variables, 
      MAVEN_OPTS: '-Dmaven.repo.local=.m2/repository',
      MAVEN_CLI_OPTS: '--batch-mode --errors --fail-at-end --show-version'
    }
    pipeline.default.cache = {
      key: '${CI_COMMIT_REF_SLUG}',
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
    // Only set Docker image if no build tool image has been set
    if (!pipeline.default.image || pipeline.default.image === 'docker:latest') {
      pipeline.default.image = 'docker:24'
      pipeline.default.services = ['docker:dind']
    }
    pipeline.variables = { 
      ...pipeline.variables, 
      DOCKER_DRIVER: 'overlay2',
      DOCKER_TLS_CERTDIR: '/certs',
      DOCKER_HOST: 'tcp://docker:2376',
      DOCKER_TLS_VERIFY: '1'
    }
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
      SONAR_TOKEN: '${SONAR_TOKEN}',
      SONAR_USER_HOME: '${CI_PROJECT_DIR}/.sonar'
    }
  }
}

// Convert complexity tier to appropriate GitLab structure
const getStagesForComplexity = (tier: string, isScripted: boolean, pluginHits: Array<{key: string}>): string[] => {
  let stages: string[] = ['prepare']  // Always start with prepare stage
  
  if (tier === 'simple') {
    stages.push('build', 'test')
  } else if (tier === 'medium') {
    stages.push('build', 'test', 'quality')
  } else {
    stages.push('build', 'test', 'quality')
  }
  
  // Add package stage if Docker is detected
  if (pluginHits.find(p => p.key === 'docker')) {
    stages.push('package')
  }
  
  // Always add deploy stage for medium and complex
  if (tier !== 'simple') {
    stages.push('deploy')
  }
  
  // Add cleanup for complex
  if (tier === 'complex') {
    stages.push('cleanup')
  }
  
  return stages
}

// Generate job templates based on detected plugins
const generateJobs = (scanResult: ScanResult, stages: string[], features?: any): Record<string, GitLabJob> => {
  const jobs: Record<string, GitLabJob> = {}
  
  // Helper function to add timeout if available
  const addTimeout = (job: GitLabJob) => {
    if (features?.timeout) {
      const timeoutUnit = features.timeout.unit === 'MINUTES' ? 'm' : 
                         features.timeout.unit === 'HOURS' ? 'h' : 's'
      ;(job as any).timeout = `${features.timeout.time}${timeoutUnit}`
    }
    return job
  }
  
  // Build stage
  jobs['build:app'] = addTimeout({
    stage: 'build',
    script: [
      'echo "Building application..."',
      scanResult.pluginHits.find(p => p.key === 'maven') ? 'mvn clean compile package -DskipTests' :
      scanResult.pluginHits.find(p => p.key === 'gradle') ? 'gradle build -x test' :
      scanResult.pluginHits.find(p => p.key === 'npm') ? 'npm ci && npm run build' :
      'echo "Add your build commands here"'
    ],
    artifacts: {
      paths: scanResult.pluginHits.find(p => p.key === 'maven') ? ['target/*.jar', 'target/*.war'] :
             scanResult.pluginHits.find(p => p.key === 'gradle') ? ['build/libs/*.jar'] :
             scanResult.pluginHits.find(p => p.key === 'npm') ? ['dist/', 'build/'] :
             ['build/'],
      expire_in: '1 hour'
    },
    cache: {
      key: '${CI_COMMIT_REF_SLUG}',
      paths: scanResult.pluginHits.find(p => p.key === 'maven') ? ['.m2/repository'] :
             scanResult.pluginHits.find(p => p.key === 'gradle') ? ['.gradle', 'build/tmp'] :
             scanResult.pluginHits.find(p => p.key === 'npm') ? ['node_modules/', '.npm'] :
             []
    }
  })
  
  // Test stage
  if (stages.includes('test')) {
    jobs['test:unit'] = addTimeout({
      stage: 'test',
      script: [
        'echo "Running unit tests..."',
        scanResult.pluginHits.find(p => p.key === 'maven') ? 'mvn test' :
        scanResult.pluginHits.find(p => p.key === 'gradle') ? 'gradle test' :
        scanResult.pluginHits.find(p => p.key === 'npm') ? 'npm test -- --coverage' :
        'echo "Add your test commands here"'
      ],
      dependencies: ['build:app'],
      coverage: '/Coverage: \\d+\\.\\d+%/',
      artifacts: {
        when: 'always',
        reports: {
          junit: scanResult.pluginHits.find(p => p.key === 'maven') ? ['target/surefire-reports/TEST-*.xml'] :
                 scanResult.pluginHits.find(p => p.key === 'gradle') ? ['build/test-results/test/TEST-*.xml'] :
                 ['coverage/junit.xml'],
          coverage_report: {
            coverage_format: 'cobertura',
            path: scanResult.pluginHits.find(p => p.key === 'maven') ? 'target/site/cobertura/coverage.xml' :
                  scanResult.pluginHits.find(p => p.key === 'gradle') ? 'build/reports/jacoco/test/jacocoTestReport.xml' :
                  'coverage/cobertura-coverage.xml'
          }
        },
        paths: ['coverage/'],
        expire_in: '30 days'
      }
    })
  }
  
  // Quality stage
  if (stages.includes('quality') && scanResult.pluginHits.find(p => p.key === 'sonarqube')) {
    jobs['quality:sonar'] = addTimeout({
      stage: 'quality',
      script: [
        'echo "Running SonarQube analysis..."',
        scanResult.pluginHits.find(p => p.key === 'maven') ? 
          'mvn sonar:sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN' :
          'sonar-scanner -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN'
      ],
      needs: ['build:app'],
      cache: {
        key: 'sonar-${CI_COMMIT_REF_SLUG}',
        paths: ['.sonar/cache']
      },
      artifacts: {
        reports: {
          junit: ['target/surefire-reports/TEST-*.xml']
        }
      }
    })
  }
  
  // Package stage (Docker)
  if (stages.includes('package') && scanResult.pluginHits.find(p => p.key === 'docker')) {
    jobs['package:docker'] = addTimeout({
      stage: 'package',
      image: 'docker:24',
      services: ['docker:dind'],
      variables: {
        DOCKER_HOST: 'tcp://docker:2375',
        DOCKER_TLS_CERTDIR: ''
      },
      before_script: [
        'echo "Logging into GitLab Container Registry..."',
        'docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"'
      ],
      script: [
        'echo "Building Docker image..."',
        'docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .',
        'docker build -t "$CI_REGISTRY_IMAGE:latest" .',
        'echo "Pushing Docker images..."',
        'docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"',
        'docker push "$CI_REGISTRY_IMAGE:latest"'
      ],
      needs: ['build:app']
    })
  }
  
  // Deploy stage
  if (stages.includes('deploy')) {
    jobs['deploy:staging'] = addTimeout({
      stage: 'deploy',
      script: [
        'echo "Deploying to staging environment..."',
        scanResult.pluginHits.find(p => p.key === 'kubernetes') ? 
          'kubectl apply -f k8s/staging/' :
        scanResult.pluginHits.find(p => p.key === 'helm') ?
          'helm upgrade --install app-staging ./chart --set image.tag=$CI_COMMIT_SHA' :
        scanResult.pluginHits.find(p => p.key === 'docker') ?
          'docker run -d --name staging-app -p 8080:8080 $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA' :
          'echo "Add your deployment commands here"'
      ],
      environment: {
        name: 'staging',
        url: 'https://staging.example.com'
      },
      dependencies: ['package:docker'],
      rules: [
        {
          if: '$CI_COMMIT_BRANCH == "main"',
          when: 'manual'
        },
        {
          if: '$CI_COMMIT_BRANCH == "develop"'
        }
      ],
      after_script: [
        'echo "Deployment completed"',
        'echo "Cleaning up temporary files..."'
      ]
    })
  }
  
  // Add lint job if we have supported languages
  if (stages.includes('prepare') || stages.length > 2) {
    jobs['lint:yaml'] = {
      stage: 'prepare',
      image: 'alpine:latest',
      before_script: ['apk add --no-cache yamllint'],
      script: [
        'echo "Linting YAML files..."',
        'find . -name "*.yml" -o -name "*.yaml" | xargs yamllint -d relaxed || true'
      ],
      allow_failure: true
    }
  }

  // Add cleanup job
  jobs['cleanup:cache'] = {
    stage: 'cleanup',
    image: 'alpine:latest',
    script: [
      'echo "Cleaning up build cache and temporary files..."',
      'rm -rf .m2/repository || true',
      'docker system prune -f || true'
    ],
    when: 'always',
    allow_failure: true
  }

  // Add parallel execution if detected
  if (scanResult.pluginHits.find(p => p.key === 'parallel')) {
    jobs['test:integration'] = addTimeout({
      stage: 'test',
      script: ['echo "Running integration tests..."'],
      dependencies: ['build:app']
    })
    jobs['test:security'] = addTimeout({
      stage: 'test', 
      script: ['echo "Running security tests..."'],
      dependencies: ['build:app']
    })
  }
  
  return jobs
}

// Generate parallel jobs
function generateParallelJobs(parallelStages: string[]): string {
  let yaml = '# Parallel Jobs Configuration\n'
  
  parallelStages.forEach(stage => {
    yaml += `parallel:${stage.toLowerCase().replace(/\s+/g, '_')}:\n`
    yaml += '  stage: test\n'
    yaml += '  script:\n'
    yaml += `    - echo "Running ${stage} in parallel"\n`
    yaml += '    - echo "Add your parallel job commands here"\n'
    yaml += '  needs: []  # Run immediately in parallel\n\n'
  })
  
  return yaml
}

// Main conversion function
export function convertToGitLabCI(scanResult: ScanResult, jenkinsContent: string): string {
  const pipeline: GitLabPipeline = {}
  
  // Extract all Jenkins features
  const features = extractAllFeatures(jenkinsContent)
  
  // Set up stages based on complexity
  const stages = getStagesForComplexity(scanResult.tier, scanResult.scripted, scanResult.pluginHits)
  pipeline.stages = stages
  
  // Convert parameters to variables
  if (features.parameters.length > 0) {
    pipeline.variables = {
      ...pipeline.variables,
      ...convertParametersToVariables(features.parameters)
    }
    
    // Add workflow rules for parameterized builds
    pipeline.workflow = {
      rules: [
        {
          if: '$CI_PIPELINE_SOURCE == "web"',
          variables: convertParametersToVariables(features.parameters)
        },
        {
          if: '$CI_PIPELINE_SOURCE == "api"',
          variables: convertParametersToVariables(features.parameters)
        },
        {
          if: '$CI_PIPELINE_SOURCE == "schedule"'
        },
        {
          when: 'always'
        }
      ]
    }
  }
  
  // Add environment variables
  if (Object.keys(features.environment).length > 0) {
    pipeline.variables = {
      ...pipeline.variables,
      ...features.environment
    }
  }
  
  // Apply plugin-specific configurations
  // Apply in priority order - Maven/Gradle should take precedence over Docker for base image
  const pluginPriority = ['maven', 'gradle', 'nodejs', 'docker', 'sonarqube']
  pluginPriority.forEach(pluginKey => {
    const plugin = scanResult.pluginHits.find(p => p.key === pluginKey)
    if (plugin && PLUGIN_MAPPINGS[pluginKey]) {
      PLUGIN_MAPPINGS[pluginKey](pipeline)
    }
  })
  
  // Add common variables
  pipeline.variables = {
    ...pipeline.variables,
    GIT_STRATEGY: 'clone',
    GIT_DEPTH: '50'
  }
  
  // Generate jobs
  const jobs = generateJobs(scanResult, stages, features)
  
  // Combine everything
  const fullPipeline = {
    ...pipeline,
    ...jobs
  }
  
  // Convert to YAML format
  return generateYAML(fullPipeline, scanResult, jenkinsContent, features)
}

// Generate YAML with comments and formatting
function generateYAML(pipeline: GitLabPipeline, scanResult: ScanResult, jenkinsContent: string, features: any): string {
  let yaml = `# GitLab CI/CD Pipeline
# Auto-generated from Jenkins pipeline (${scanResult.declarative ? 'Declarative' : scanResult.scripted ? 'Scripted' : 'Unknown'})
# Complexity: ${scanResult.tier.toUpperCase()} | Lines: ${scanResult.lineCount} | Plugins: ${scanResult.pluginCount}
# Generated on: ${new Date().toISOString()}

# Include GitLab CI templates for enhanced functionality
include:`

  // Add includes based on detected plugins
  const hasDocker = scanResult.pluginHits.find(p => p.key === 'docker')
  const hasSonar = scanResult.pluginHits.find(p => p.key === 'sonarqube')
  
  if (hasDocker) {
    yaml += `
  - remote: "https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Docker.gitlab-ci.yml"`
  }
  
  if (hasSonar) {
    yaml += `
  - remote: "https://gitlab.com/gitlab-org/gitlab/-/raw/master/lib/gitlab/ci/templates/Security/SAST.gitlab-ci.yml"`
  }
  
  // Always include basic security scanning
  yaml += `
  - template: Security/Secret-Detection.gitlab-ci.yml

# ⚙️  Required CI/CD Variables (add these in GitLab project settings):
# CI_REGISTRY_USER      - GitLab Container Registry username (usually $CI_REGISTRY_USER)
# CI_REGISTRY_PASSWORD  - GitLab Container Registry password (usually $CI_REGISTRY_PASSWORD)${hasSonar ? `
# SONAR_HOST_URL        - SonarQube server URL (e.g., https://sonarcloud.io)
# SONAR_TOKEN           - SonarQube authentication token (masked, protected)` : ''}

`

  // Add warnings as comments
  if (scanResult.warnings.length > 0 || scanResult.scripted) {
    yaml += '# ⚠️  Migration Warnings:\n'
    
    // Add scripted pipeline specific warnings
    if (scanResult.scripted) {
      yaml += '#   - Scripted Jenkins pipeline may need manual adjustment\n'
      yaml += '#   - Complex Groovy logic requires review\n'
    }
    
    scanResult.warnings.forEach(warning => {
      yaml += `#   - ${warning}\n`
    })
    yaml += '\n'
  }

  // Add workflow rules if present
  if (pipeline.workflow) {
    yaml += '# Workflow rules for parameterized builds\n'
    yaml += 'workflow:\n'
    yaml += '  rules:\n'
    pipeline.workflow.rules?.forEach(rule => {
      yaml += '    - '
      if (rule.if) {
        yaml += `if: ${rule.if}\n`
      } else if (rule.when) {
        yaml += `when: ${rule.when}\n`
      }
      if (rule.variables) {
        yaml += '      variables:\n'
        Object.entries(rule.variables).forEach(([k, v]) => {
          yaml += `        ${k}: "${v}"\n`
        })
      }
    })
    yaml += '\n'
  }

  // Add variables
  if (pipeline.variables && Object.keys(pipeline.variables).length > 0) {
    yaml += 'variables:\n'
    
    // Add parameter descriptions as comments if we have parameter info
    if (features.parameters.length > 0) {
      yaml += '  # Pipeline Parameters (use these when triggering manually)\n'
      features.parameters.forEach((param: any) => {
        if (param.description) {
          yaml += `  # ${param.description}\n`
        }
        if (param.type === 'choice' && param.choices) {
          yaml += `  # Options: ${param.choices.join(', ')}\n`
        }
        yaml += `  ${param.name}: "${pipeline.variables![param.name] || ''}"\n`
      })
      yaml += '\n'
      
      // Add other variables that aren't parameters
      const paramNames = features.parameters.map((p: any) => p.name)
      const otherVars = Object.entries(pipeline.variables).filter(([k]) => !paramNames.includes(k))
      if (otherVars.length > 0) {
        yaml += '  # Environment Variables\n'
        otherVars.forEach(([key, value]) => {
          yaml += `  ${key}: "${value}"\n`
        })
      }
    } else {
      // No parameters, just add all variables
      Object.entries(pipeline.variables).forEach(([key, value]) => {
        yaml += `  ${key}: "${value}"\n`
      })
    }
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

  // Handle Matrix builds
  if (features.matrix && Object.keys(features.matrix.axes).length > 0) {
    yaml += generateMatrixJobs(features.matrix, scanResult)
  }
  
  // Handle parallel stages
  if (features.parallelStages.length > 0) {
    yaml += generateParallelJobs(features.parallelStages)
  }
  
  // Add jobs
  const jobs = { ...pipeline }
  delete jobs.stages
  delete jobs.variables
  delete jobs.default
  delete jobs.workflow

  Object.entries(jobs).forEach(([jobName, job]) => {
    if (typeof job === 'object' && job !== null) {
      yaml += `${jobName}:\n`
      const gitlabJob = job as GitLabJob
      
      if (gitlabJob.extends) yaml += `  extends: ${gitlabJob.extends}\n`
      if (gitlabJob.stage) yaml += `  stage: ${gitlabJob.stage}\n`
      if (gitlabJob.image) yaml += `  image: ${gitlabJob.image}\n`
      if ((gitlabJob as any).timeout) yaml += `  timeout: ${(gitlabJob as any).timeout}\n`
      if (gitlabJob.services) {
        yaml += '  services:\n'
        gitlabJob.services.forEach(service => {
          yaml += `    - ${service}\n`
        })
      }
      
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
# ⚠️  IMPORTANT: This pipeline was converted from a SCRIPTED PIPELINE.
# Scripted pipelines often contain complex Groovy logic that may need manual adjustment.
# Please review carefully and test thoroughly before using in production.
`
  }

  return yaml
}

// Generate matrix jobs
function generateMatrixJobs(matrix: any, scanResult: ScanResult): string {
  let yaml = '# Matrix Build Configuration\n'
  yaml += 'test:matrix:\n'
  yaml += '  stage: test\n'
  yaml += '  parallel:\n'
  yaml += '    matrix:\n'
  
  const axisEntries = Object.entries(matrix.axes)
  if (axisEntries.length > 0) {
    yaml += '      - \n'
    axisEntries.forEach(([axisKey, axisValues]) => {
      yaml += `        ${axisKey}:\n`
      const valueArray = axisValues as string[]
      valueArray.forEach(value => {
        yaml += `          - "${value}"\n`
      })
    })
  }
  
  yaml += '  script:\n'
  yaml += '    - echo "Testing with $' + Object.keys(matrix.axes).join(' and $') + '"\n'
  yaml += '    - echo "Add your matrix-specific test commands here"\n\n'
  
  return yaml
}

// Export additional utility functions  
export function validateGitLabCI(yaml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic validation
  if (!yaml.includes('stages:')) {
    errors.push('No stages defined')
  }
  
  // Check for at least one job - jobs have format "jobname:" at start of line
  const jobPattern = /^[a-zA-Z0-9_-]+:$/gm
  const lines = yaml.split('\n')
  const jobLines = lines.filter(line => {
    const trimmed = line.trim()
    return trimmed.match(/^[a-zA-Z0-9_-]+:$/) && 
           !trimmed.startsWith('stages:') && 
           !trimmed.startsWith('variables:') &&
           !trimmed.startsWith('default:') &&
           !trimmed.startsWith('include:')
  })
  
  if (jobLines.length === 0) {
    errors.push('No jobs defined')
  }
  
  // Check for undefined variables
  const variableUsages = yaml.match(/\$[A-Z_]+/g) || []
  const definedVars = new Set<string>()
  
  // Extract defined variables
  const varSection = yaml.match(/variables:\n((?:  .*\n)*)/m)
  if (varSection) {
    const varLines = varSection[1].split('\n')
    varLines.forEach(line => {
      const match = line.match(/^\s*([A-Z_]+):/)
      if (match) {
        definedVars.add('$' + match[1])
      }
    })
  }
  
  // Check for undefined variables
  variableUsages.forEach(varUsage => {
    if (!definedVars.has(varUsage) && !varUsage.startsWith('$CI_')) {
      errors.push(`Variable ${varUsage} used but not defined`)
    }
  })
  
  // Check for Docker-in-Docker issues
  if (yaml.includes('docker:dind') && !yaml.includes('DOCKER_HOST')) {
    errors.push('Docker-in-Docker service used but DOCKER_HOST not configured')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
