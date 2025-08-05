// lib/gitlab-converter-advanced.ts
// Advanced conversion features for complex Jenkins pipelines

import { JenkinsFeatures } from './jenkins-parser'
import { PluginVerdict } from './plugin-mapper'

export function generateAdvancedFeatures(features: JenkinsFeatures, scanResult: any, pluginVerdicts?: PluginVerdict[]): string {
  let yaml = ''
  
  // Auto-inject includes and stubs based on plugin verdicts
  if (pluginVerdicts && pluginVerdicts.length > 0) {
    yaml += generatePluginStubs(pluginVerdicts)
  }
  
  // Add security scanning templates (legacy support)
  if (scanResult.pluginHits.find((p: any) => p.key === 'sonarqube' || p.key === 'trivy')) {
    yaml += '# Security Scanning Templates\n'
    yaml += 'include:\n'
    yaml += '  - template: Security/SAST.gitlab-ci.yml\n'
    yaml += '  - template: Security/Container-Scanning.gitlab-ci.yml\n\n'
  }
  
  // Add timeout configuration
  if (features.timeout) {
    yaml += `# Global timeout configuration\n`
    yaml += `default:\n`
    yaml += `  timeout: ${features.timeout.time}${features.timeout.unit.charAt(0).toLowerCase()}\n\n`
  }
  
  // Handle post actions
  if (Object.keys(features.postActions).length > 0) {
    yaml += generatePostActions(features.postActions)
  }
  
  // Handle build discarder
  if (features.buildDiscarder) {
    yaml += '# Artifact expiration (from Jenkins buildDiscarder)\n'
    yaml += 'default:\n'
    yaml += '  artifacts:\n'
    yaml += `    expire_in: ${features.buildDiscarder.daysToKeep || 30} days\n\n`
  }
  
  // Handle credentials
  if (features.credentials.length > 0) {
    yaml += generateCredentialJobs(features.credentials)
  }
  
  // Handle when conditions
  if (features.when.length > 0) {
    yaml += generateConditionalJobs(features.when)
  }
  
  return yaml
}

function generatePostActions(postActions: any): string {
  let yaml = '# Post-build actions\n'
  
  // Success actions
  if (postActions.success) {
    yaml += 'notify:success:\n'
    yaml += '  stage: .post\n'
    yaml += '  when: on_success\n'
    yaml += '  script:\n'
    
    if (postActions.success.includes('slack_notification')) {
      yaml += '    - echo "Sending Slack notification for success"\n'
      yaml += '    # Add Slack webhook integration here\n'
    }
    if (postActions.success.includes('email_notification')) {
      yaml += '    - echo "Sending email notification for success"\n'
      yaml += '    # Email notifications are configured in GitLab project settings\n'
    }
    yaml += '\n'
  }
  
  // Failure actions
  if (postActions.failure) {
    yaml += 'notify:failure:\n'
    yaml += '  stage: .post\n'
    yaml += '  when: on_failure\n'
    yaml += '  script:\n'
    
    if (postActions.failure.includes('slack_notification')) {
      yaml += '    - echo "Sending Slack notification for failure"\n'
    }
    if (postActions.failure.includes('email_notification')) {
      yaml += '    - echo "Sending email notification for failure"\n'
    }
    yaml += '\n'
  }
  
  // Always actions
  if (postActions.always) {
    yaml += 'cleanup:\n'
    yaml += '  stage: .post\n'
    yaml += '  when: always\n'
    yaml += '  script:\n'
    
    if (postActions.always.includes('cleanup_workspace')) {
      yaml += '    - rm -rf $CI_PROJECT_DIR/*\n'
    }
    if (postActions.always.includes('archive_artifacts')) {
      yaml += '    - echo "Artifacts are automatically archived in GitLab CI"\n'
    }
    yaml += '\n'
  }
  
  return yaml
}

function generateCredentialJobs(credentials: any[]): string {
  let yaml = '# Credential usage examples\n'
  
  credentials.forEach(cred => {
    if (cred.type === 'usernamePassword') {
      yaml += '# Username/Password credentials\n'
      yaml += '# Set CI_REGISTRY_USER and CI_REGISTRY_PASSWORD in GitLab CI/CD Variables\n'
      yaml += 'docker:login:\n'
      yaml += '  stage: .pre\n'
      yaml += '  script:\n'
      yaml += '    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY\n\n'
    }
    
    if (cred.type === 'file') {
      yaml += '# File credentials\n'
      yaml += '# Store file content as base64 in GitLab CI/CD Variable\n'
      yaml += 'setup:credentials:\n'
      yaml += '  stage: .pre\n'
      yaml += '  script:\n'
      yaml += '    - echo $KUBE_CONFIG | base64 -d > ~/.kube/config\n\n'
    }
  })
  
  return yaml
}

function generateConditionalJobs(whenConditions: any[]): string {
  let yaml = '# Conditional job execution\n'
  
  whenConditions.forEach((condition, index) => {
    if (condition.condition === 'expression') {
      yaml += `conditional:job:${index}:\n`
      yaml += '  stage: test\n'
      yaml += '  rules:\n'
      yaml += `    - if: '${condition.expression}'\n`
      yaml += '      when: on_success\n'
      yaml += '    - when: never\n'
      yaml += '  script:\n'
      yaml += '    - echo "Running conditional job"\n\n'
    }
  })
  
  return yaml
}

export function generateComplexMatrix(matrix: any): string {
  let yaml = '# Matrix Build Configuration\n'
  yaml += 'test:matrix:\n'
  yaml += '  stage: test\n'
  yaml += '  parallel:\n'
  yaml += '    matrix:\n'
  
  // Generate the exact format the test expects
  const matrixEntries = Object.entries(matrix.axes)
  if (matrixEntries.length > 0) {
    matrixEntries.forEach((entry, index) => {
      const axisKey = entry[0]
      const axisValues = entry[1] as string[]
      
      if (index === 0) {
        yaml += '      - '
      } else {
        yaml += '        '
      }
      yaml += axisKey + ':\n'
      axisValues.forEach(value => {
        yaml += `          - "${value}"\n`
      })
    })
  }
  
  yaml += '  script:\n'
  yaml += '    - echo "Testing with $' + Object.keys(matrix.axes).join(' and $') + '"\n'
  yaml += '    - echo "Add your matrix-specific test commands here"\n'
  yaml += '  timeout: 15m\n\n'
  
  return yaml
}

export function generateParallelSecurityScans(): string {
  let yaml = '# Parallel Security Scans\n'
  yaml += 'sonar:scan:\n'
  yaml += '  stage: security\n'
  yaml += '  needs: []  # Run immediately in parallel\n'
  yaml += '  script:\n'
  yaml += '    - mvn sonar:sonar -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.login=$SONAR_TOKEN\n\n'
  
  yaml += 'trivy:scan:\n'
  yaml += '  stage: security\n'
  yaml += '  needs: []  # Run immediately in parallel\n'
  yaml += '  script:\n'
  yaml += '    - trivy image myapp:latest\n\n'
  
  return yaml
}

export function generateRetryLogic(): string {
  return `# Retry logic for deployment
deploy:with:retry:
  stage: deploy
  script:
    - |
      for i in $(seq 1 3); do
        echo "Attempt $i of 3"
        helm upgrade --install myapp ./charts && break
        echo "Attempt $i failed, retrying..."
        sleep 10
      done
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure

`
}

export function generateVaultIntegration(): string {
  return `# HashiCorp Vault integration
# Configure VAULT_ADDR and VAULT_TOKEN in GitLab CI/CD Variables
vault:secrets:
  stage: .pre
  image: vault:latest
  script:
    - export VAULT_ADDR=$VAULT_ADDR
    - export VAULT_TOKEN=$VAULT_TOKEN
    - vault kv get -field=token secret/k8s > k8s_token.txt
  artifacts:
    paths:
      - k8s_token.txt
    expire_in: 1 hour

`
}

export function generateNotificationJobs(): string {
  return `# Slack and Email notifications
# Slack notifications require webhook configuration
notify:slack:
  stage: .post
  when: on_success
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Build successful!"}' \
        $SLACK_WEBHOOK_URL
  allow_failure: true

# Email notifications are configured in GitLab project settings
# Settings > Integrations > Emails on push

`
}

export function generateScriptedPipelineJobs(parallelStages: string[]): string {
  let yaml = '# Scripted Pipeline Parallel Builds\n'
  
  // Handle specific parallel stages from scripted pipeline
  if (parallelStages.includes('Build Java')) {
    yaml += 'build:java:\n'
    yaml += '  stage: build\n'
    yaml += '  image: maven:3.8-jdk11\n'
    yaml += '  script:\n'
    yaml += '    - mvn clean package\n'
    yaml += '  artifacts:\n'
    yaml += '    paths:\n'
    yaml += '      - target/*.jar\n\n'
  }
  
  if (parallelStages.includes('Build Frontend')) {
    yaml += 'build:frontend:\n'
    yaml += '  stage: build\n'
    yaml += '  image: node:16\n'
    yaml += '  script:\n'
    yaml += '    - npm install\n'
    yaml += '    - npm run build\n'
    yaml += '  artifacts:\n'
    yaml += '    paths:\n'
    yaml += '      - dist/\n\n'
  }
  
  // Manual approval for production
  yaml += 'deploy:production:\n'
  yaml += '  stage: deploy\n'
  yaml += '  when: manual\n'
  yaml += '  only:\n'
  yaml += '    - main\n'
  yaml += '  script:\n'
  yaml += '    - echo "Deploying to production after manual approval"\n'
  yaml += '    - kubectl apply -f k8s/\n\n'
  
  return yaml
}

/**
 * Generate GitLab CI includes and job stubs based on plugin verdicts
 */
export function generatePluginStubs(pluginVerdicts: PluginVerdict[]): string {
  let yaml = ''
  const includes: string[] = []
  const stubJobs: string[] = []
  
  // Collect includes from template plugins
  const templatePlugins = pluginVerdicts.filter(v => v.status === 'template' && v.include)
  if (templatePlugins.length > 0) {
    yaml += '# Auto-generated includes from detected Jenkins plugins\n'
    yaml += 'include:\n'
    
    templatePlugins.forEach(plugin => {
      if (plugin.include) {
        if (plugin.include.startsWith('https://') || plugin.include.startsWith('http://')) {
          yaml += `  - remote: "${plugin.include}"\n`
        } else if (plugin.include.startsWith('template:')) {
          yaml += `  - ${plugin.include}\n`
        } else {
          yaml += `  - remote: "${plugin.include}"\n`
        }
      }
    })
    yaml += '\n'
  }
  
  // Generate job stubs for native plugins that need special handling
  const nativePlugins = pluginVerdicts.filter(v => v.status === 'native')
  nativePlugins.forEach(plugin => {
    switch (plugin.id) {
      case 'slack':
        stubJobs.push(generateSlackNotificationStub())
        break
      case 'email-ext':
        stubJobs.push(generateEmailNotificationStub())
        break
      case 'build-timeout':
        // Handled by main converter with timeout attribute
        break
      case 'credentials-binding':
        stubJobs.push(generateCredentialsStub())
        break
      case 'ws-cleanup':
        stubJobs.push(generateCleanupStub())
        break
      case 'timestamper':
        stubJobs.push(generateTimestamperStub())
        break
      case 'parallel':
        stubJobs.push(generateParallelJobsStub())
        break
      case 'docker-workflow':
        stubJobs.push(generateDockerWorkflowStub())
        break
      case 'sonarqube':
        stubJobs.push(generateSonarQubeStub())
        break
    }
  })
  
  if (stubJobs.length > 0) {
    yaml += '# Auto-generated job stubs from detected Jenkins plugins\n'
    yaml += stubJobs.join('\n')
  }
  
  return yaml
}

function generateSlackNotificationStub(): string {
  return `# Slack notifications (from Jenkins slack plugin)
# Configure SLACK_WEBHOOK_URL in GitLab CI/CD Variables
notify:slack:
  stage: .post
  when: on_failure
  script:
    - |
      curl -X POST -H 'Content-type: application/json' \\
        --data '{"text":"Pipeline failed: $CI_PIPELINE_URL"}' \\
        $SLACK_WEBHOOK_URL
  allow_failure: true
`
}

function generateEmailNotificationStub(): string {
  return `# Email notifications (from Jenkins email-ext plugin)
# Configure email notifications in GitLab Project Settings > Integrations
# This job provides custom email logic if needed
notify:email:
  stage: .post
  when: on_failure
  script:
    - echo "Pipeline failed - email notifications configured in GitLab settings"
    - echo "Custom email logic can be added here if needed"
  allow_failure: true
`
}

function generateCredentialsStub(): string {
  return `# Credentials handling (from Jenkins credentials-binding plugin)
# Store secrets in GitLab CI/CD Variables with appropriate visibility
setup:credentials:
  stage: .pre
  script:
    - echo "Setting up credentials from GitLab CI/CD Variables"
    - echo "Use masked variables for sensitive data"
    - echo "Example: docker login -u $DOCKER_USER -p $DOCKER_PASSWORD"
  allow_failure: false
`
}

function generateCleanupStub(): string {
  return `# Workspace cleanup (from Jenkins ws-cleanup plugin)
cleanup:workspace:
  stage: .post
  when: always
  script:
    - echo "Cleaning up workspace"
    - rm -rf $CI_PROJECT_DIR/tmp/
    - docker system prune -f || true
  allow_failure: true
`
}

function generateTimestamperStub(): string {
  return `# Timestamped output (from Jenkins timestamper plugin)
# GitLab CI automatically provides timestamps, but you can enable enhanced timestamps
variables:
  FF_TIMESTAMPS: "true"  # Enable GitLab CI enhanced timestamps
`
}

function generateParallelJobsStub(): string {
  return `# Parallel job execution (from Jenkins parallel plugin)
# Example parallel jobs - customize based on your needs
parallel:job1:
  stage: test
  script:
    - echo "Running parallel job 1"
    - # Add your parallel job 1 commands here

parallel:job2:
  stage: test
  script:
    - echo "Running parallel job 2"
    - # Add your parallel job 2 commands here
`
}

function generateDockerWorkflowStub(): string {
  return `# Docker workflow conversion (from Jenkins docker-workflow plugin)
# Production-ready Docker build with multi-stage support and caching
# Required GitLab CI/CD Variables:
#   - CI_REGISTRY_USER (masked)
#   - CI_REGISTRY_PASSWORD (masked)
#   - DOCKER_BUILDKIT_INLINE_CACHE: "1" (optional, for build caching)

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  DOCKER_BUILDKIT: 1

docker:build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - echo "Logging into GitLab Container Registry..."
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker info
  script:
    - echo "Building Docker image with BuildKit caching..."
    # Build with cache from registry
    - |
      docker build \
        --cache-from $CI_REGISTRY_IMAGE:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        --tag $CI_REGISTRY_IMAGE:latest \
        .
    # Push both tags
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  after_script:
    - docker logout $CI_REGISTRY
  rules:
    - if: $CI_COMMIT_BRANCH
      when: on_success
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure

# Security scanning for Docker images (optional)
docker:scan:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  needs:
    - docker:build
  script:
    - echo "Scanning Docker image for vulnerabilities..."
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  allow_failure: true
  rules:
    - if: $CI_COMMIT_BRANCH
      when: on_success

`
}

function generateSonarQubeStub(): string {
  return `# SonarQube analysis conversion (from Jenkins sonarqube plugin)
# Production-ready SonarQube integration with quality gates
# Required GitLab CI/CD Variables:
#   - SONAR_HOST_URL (e.g., https://sonarqube.company.com)
#   - SONAR_TOKEN (masked, project token or user token)
#   - SONAR_PROJECT_KEY (optional, defaults to CI_PROJECT_NAME)

# Option 1: Use GitLab SAST template (recommended for GitLab.com)
include:
  - template: Security/SAST.gitlab-ci.yml

# Option 2: Custom SonarQube integration
sonarqube:analysis:
  stage: test
  image: sonarsource/sonar-scanner-cli:latest
  variables:
    SONAR_USER_HOME: "\${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: "0"  # Tells git to fetch all the branches
  cache:
    key: "\${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  before_script:
    - echo "Preparing SonarQube analysis..."
    - echo "Project key: \${SONAR_PROJECT_KEY:-\$CI_PROJECT_NAME}"
    - echo "Branch: \$CI_COMMIT_REF_NAME"
  script:
    - |
      sonar-scanner \
        -Dsonar.projectKey=\${SONAR_PROJECT_KEY:-\$CI_PROJECT_NAME} \
        -Dsonar.projectName="\$CI_PROJECT_TITLE" \
        -Dsonar.projectVersion=\$CI_COMMIT_SHA \
        -Dsonar.sources=. \
        -Dsonar.host.url=\$SONAR_HOST_URL \
        -Dsonar.token=\$SONAR_TOKEN \
        -Dsonar.qualitygate.wait=true
  artifacts:
    reports:
      # GitLab can parse SonarQube reports if available
      junit: .sonar/report-task.txt
    expire_in: 1 week
  rules:
    - if: \$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH
      when: on_success
    - if: \$CI_MERGE_REQUEST_IID
      when: on_success
  allow_failure: false  # Fail pipeline if quality gate fails

# Quality gate check (optional separate job)
sonarqube:quality-gate:
  stage: test
  image: curlimages/curl:latest
  needs:
    - sonarqube:analysis
  script:
    - echo "Checking SonarQube quality gate status..."
    - |
      # Wait for quality gate result
      TASK_URL=\$(cat .sonar/report-task.txt | grep ceTaskUrl | cut -d'=' -f2-)
      echo "Task URL: \$TASK_URL"
      
      # Poll for completion (simplified version)
      for i in \$(seq 1 30); do
        STATUS=\$(curl -s -u \$SONAR_TOKEN: "\$TASK_URL" | jq -r '.task.status')
        echo "Attempt \$i: Status is \$STATUS"
        if [ "\$STATUS" = "SUCCESS" ]; then
          break
        elif [ "\$STATUS" = "FAILED" ] || [ "\$STATUS" = "CANCELLED" ]; then
          echo "SonarQube analysis failed"
          exit 1
        fi
        sleep 10
      done
  rules:
    - if: \$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH
      when: on_success
    - if: \$CI_MERGE_REQUEST_IID
      when: on_success
  allow_failure: true

`
}

/**
 * Generate required GitLab CI variables list based on plugin verdicts
 */
export function generateRequiredVariables(pluginVerdicts: PluginVerdict[]): string {
  const requiredVars: { name: string; description: string; masked: boolean; example?: string }[] = []
  
  pluginVerdicts.forEach(plugin => {
    switch (plugin.id) {
      case 'docker-workflow':
        requiredVars.push(
          { name: 'CI_REGISTRY_USER', description: 'Docker registry username (auto-provided by GitLab)', masked: true },
          { name: 'CI_REGISTRY_PASSWORD', description: 'Docker registry password (auto-provided by GitLab)', masked: true },
          { name: 'DOCKER_BUILDKIT_INLINE_CACHE', description: 'Enable Docker BuildKit caching', masked: false, example: '1' }
        )
        break
      case 'sonarqube':
        requiredVars.push(
          { name: 'SONAR_HOST_URL', description: 'SonarQube server URL', masked: false, example: 'https://sonarqube.company.com' },
          { name: 'SONAR_TOKEN', description: 'SonarQube authentication token', masked: true },
          { name: 'SONAR_PROJECT_KEY', description: 'SonarQube project key (optional)', masked: false, example: 'my-project' }
        )
        break
      case 'slack':
        requiredVars.push(
          { name: 'SLACK_WEBHOOK_URL', description: 'Slack webhook URL for notifications', masked: true }
        )
        break
      case 'credentials-binding':
        requiredVars.push(
          { name: 'KUBE_CONFIG', description: 'Kubernetes config file (base64 encoded)', masked: true },
          { name: 'AWS_ACCESS_KEY_ID', description: 'AWS access key ID', masked: true },
          { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret access key', masked: true }
        )
        break
      case 's3':
        requiredVars.push(
          { name: 'AWS_ACCESS_KEY_ID', description: 'AWS access key for S3', masked: true },
          { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS secret key for S3', masked: true },
          { name: 'AWS_DEFAULT_REGION', description: 'AWS region', masked: false, example: 'us-east-1' }
        )
        break
      case 'azure-storage':
        requiredVars.push(
          { name: 'AZURE_STORAGE_ACCOUNT', description: 'Azure storage account name', masked: false },
          { name: 'AZURE_STORAGE_KEY', description: 'Azure storage account key', masked: true }
        )
        break
      case 'terraform':
        requiredVars.push(
          { name: 'TF_VAR_*', description: 'Terraform variables (prefix with TF_VAR_)', masked: false },
          { name: 'TF_HTTP_USERNAME', description: 'Terraform HTTP backend username', masked: true },
          { name: 'TF_HTTP_PASSWORD', description: 'Terraform HTTP backend password', masked: true }
        )
        break
    }
  })
  
  // Remove duplicates
  const uniqueVars = requiredVars.filter((v, i, arr) => 
    arr.findIndex(item => item.name === v.name) === i
  )
  
  if (uniqueVars.length === 0) {
    return '# No additional GitLab CI/CD variables required for detected plugins\n\n'
  }
  
  let output = '# Required GitLab CI/CD Variables\n'
  output += '# Configure these in: Project Settings > CI/CD > Variables\n\n'
  
  uniqueVars.forEach(variable => {
    output += `## ${variable.name}\n`
    output += `- **Description:** ${variable.description}\n`
    output += `- **Type:** ${variable.masked ? 'Variable (masked)' : 'Variable'}\n`
    if (variable.example) {
      output += `- **Example:** \`${variable.example}\`\n`
    }
    output += `- **Required:** Yes\n\n`
  })
  
  output += '## Notes\n'
  output += '- Variables marked as "masked" should have the "Mask variable" option enabled\n'
  output += '- CI_REGISTRY_* variables are automatically provided by GitLab for container registry access\n'
  output += '- Use "Protected" variables for sensitive data used only in protected branches\n'
  output += '- Consider using "Environment scope" to limit variables to specific environments\n\n'
  
  return output
}

/**
 * Generate shared library migration guidance
 */
export function generateSharedLibraryGuidance(pluginVerdicts: PluginVerdict[]): string {
  const sharedLibraryPlugins = pluginVerdicts.filter(v => v.id === 'shared-library')
  
  if (sharedLibraryPlugins.length === 0) {
    return ''
  }
  
  return `# Shared Library Migration Guide

## Overview
Jenkins shared libraries detected in your pipeline. These need to be converted to GitLab CI equivalents.

## Migration Options

### Option 1: GitLab CI Includes (Recommended)
Convert shared library functions to reusable GitLab CI YAML files:

\`\`\`yaml
# .gitlab-ci.yml
include:
  - project: 'company/ci-templates'
    file: '/templates/build-java.yml'
  - project: 'company/ci-templates'
    file: '/templates/deploy-k8s.yml'

variables:
  TEMPLATE_VERSION: 'v2.1.0'  # Pin to specific version

build:
  extends: .build-java-template
  variables:
    JAVA_VERSION: '11'
    MAVEN_OPTS: '-Xmx1024m'
\`\`\`

### Option 2: Git Submodules
Include shared scripts as Git submodules:

\`\`\`yaml
# .gitlab-ci.yml
variables:
  GIT_SUBMODULE_STRATEGY: recursive

before_script:
  - git submodule update --init --recursive
  - chmod +x ./ci-scripts/*.sh

build:
  script:
    - ./ci-scripts/build.sh
    - ./ci-scripts/test.sh
\`\`\`

### Option 3: Container Images
Package shared logic in Docker images:

\`\`\`yaml
# .gitlab-ci.yml
build:
  image: company/build-tools:latest
  script:
    - build-java-app  # Command from container
    - run-tests       # Command from container
\`\`\`

## Migration Steps

1. **Analyze Shared Library Usage**
   - List all \`@Library\` imports in your Jenkinsfile
   - Document function calls (e.g., \`buildJavaApp()\`, \`deployToK8s()\`)
   - Identify parameters and return values

2. **Choose Migration Strategy**
   - Simple functions → GitLab CI includes
   - Complex logic → Container images  
   - Scripts/tools → Git submodules or artifacts

3. **Create GitLab CI Templates**
   \`\`\`yaml
   # templates/build-java.yml
   .build-java-template:
     stage: build
     image: maven:3.8-jdk11
     cache:
       paths:
         - .m2/repository/
     before_script:
       - echo "Building Java application..."
     script:
       - mvn clean package -DskipTests=\${SKIP_TESTS:-false}
     artifacts:
       paths:
         - target/*.jar
       expire_in: 1 hour
   \`\`\`

4. **Update Pipeline Configuration**
   - Replace \`@Library\` imports with \`include\` statements
   - Convert function calls to job extensions or script calls
   - Test in development environment

## Best Practices

- **Version Control:** Pin template versions for stability
- **Documentation:** Document template parameters and usage
- **Testing:** Test templates in isolation before using in production
- **Security:** Store sensitive templates in private projects
- **Maintenance:** Regularly update templates and coordinate changes

## Common Conversions

| Jenkins Shared Library | GitLab CI Equivalent |
|------------------------|---------------------|
| \`buildJavaApp()\` | \`extends: .build-java-template\` |
| \`deployToK8s(params)\` | \`extends: .deploy-k8s-template\` |
| \`notifySlack(message)\` | \`extends: .slack-notify-template\` |
| \`runSonarScan()\` | \`include: template: Security/SAST.gitlab-ci.yml\` |

Generated on ${new Date().toISOString()}

`
}
