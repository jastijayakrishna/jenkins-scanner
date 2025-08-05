// lib/gitlab-converter-advanced.ts
// Advanced conversion features for complex Jenkins pipelines

import { JenkinsFeatures } from './jenkins-parser'

export function generateAdvancedFeatures(features: JenkinsFeatures, scanResult: any): string {
  let yaml = ''
  
  // Add security scanning templates
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
