/**
 * Enterprise GitLab CI Template Generator
 * 
 * Uses AI to generate production-ready, enterprise-grade GitLab CI templates
 * from Jenkins pipelines with advanced DevOps best practices.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

interface SimpleConversionRequest {
  jenkinsContent: string
  scanResult?: any
}

interface SimpleConversionResponse {
  success: boolean
  yaml?: string
  stages?: string[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimpleConversionResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { jenkinsContent, scanResult } = req.body as SimpleConversionRequest

    if (!jenkinsContent) {
      return res.status(400).json({ success: false, error: 'Jenkins content is required' })
    }

    // Generate enterprise GitLab CI template using AI
    const gitlabYaml = await generateEnterpriseTemplate(jenkinsContent, scanResult)
    const stages = ['validate', 'build', 'test', 'analyze', 'package', 'deploy', 'verify', 'notify', 'docs']

    return res.status(200).json({
      success: true,
      yaml: gitlabYaml,
      stages
    })

  } catch (error) {
    console.error('Enterprise template generation error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate enterprise template'
    })
  }
}

async function generateEnterpriseTemplate(jenkinsContent: string, scanResult?: any): Promise<string> {
  const enterprisePrompt = `You are an expert DevOps engineer and CI/CD migration architect.
Given a Jenkins pipeline, transform it into a **production-ready, enterprise-grade .gitlab-ci.yml** that matches the following standards:

**Requirements:**

1. **Full Pipeline Structure**
   * Use clearly separated stages: validate, build, test, analyze, package, deploy, verify, notify, docs.
   * Implement workflow: and rules: for controlling MR, main, and tag pipelines.

2. **Advanced Features**
   * Use matrix/parallel builds (e.g., for Java versions, DBs) where possible.
   * Implement caching for dependencies (Maven/npm/node_modules).
   * Enable artifact/report sharing between jobs (coverage, JUnit, etc).
   * Pin all Docker images using SHA256 digests where critical.

3. **Security & Compliance**
   * Integrate security scanning jobs (SAST, Dependency-Scanning, Container-Scanning, Secret-Detection).
   * Add SBOM (Software Bill of Materials) generation where applicable.
   * Use environment variables for all credentials/secrets.

4. **Reusable Templates**
   * Reference shared GitLab include templates for common patterns.
   * Use YAML anchors and extends for reusability.

5. **Kubernetes & Docker**
   * Add stages for Docker build/push with multi-platform support if applicable.
   * Include deployment stages with proper environment management.
   * Add cleanup jobs for review environments.

6. **Notifications & Observability**
   * Use GitLab's native notification system.
   * Provide comprehensive reporting via artifacts and coverage reports.

7. **Documentation**
   * Use clear section headers, YAML anchors, and meaningful job names.
   * Add inline comments for customization points.

8. **Validation**
   * Add pipeline validation and linting where appropriate.

**Input Jenkins Pipeline:**
\`\`\`groovy
${jenkinsContent}
\`\`\`

${scanResult ? `**Scan Analysis:**
${JSON.stringify(scanResult, null, 2)}
` : ''}

**Output:**
Generate a single, complete, production-ready .gitlab-ci.yml using current GitLab best practices. Use real-world variable and job names, and maintain extensibility for enterprise use.

**Important:** 
- Do NOT remove any important features from the input Jenkins pipeline
- If something can't be directly mapped, leave a clear TODO comment
- Focus on enterprise-grade patterns, not basic syntax
- Use GitLab 17.x+ features and best practices`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: enterprisePrompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid AI API response format')
    }

    let gitlabYaml = data.content[0].text.trim()
    
    // Extract YAML content if wrapped in code blocks
    const yamlMatch = gitlabYaml.match(/```(?:yaml|yml)?\n([\s\S]*?)\n```/)
    if (yamlMatch) {
      gitlabYaml = yamlMatch[1]
    }

    return gitlabYaml

  } catch (error) {
    console.error('AI template generation failed:', error)
    // Fallback to a basic enterprise template if AI fails
    return generateFallbackEnterpriseTemplate(jenkinsContent)
  }
}

function generateFallbackEnterpriseTemplate(jenkinsContent: string): string {
  // Basic pattern detection for fallback
  const hasGradle = /gradlew|gradle/.test(jenkinsContent)
  const hasDocker = /docker|Docker/.test(jenkinsContent)
  const hasTests = /test|junit|TestNG/.test(jenkinsContent)

  return `# Enterprise GitLab CI Pipeline
# Generated with fallback template - consider manual review

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Container-Scanning.gitlab-ci.yml

stages:
  - validate
  - build
  - test
  - analyze
  - package
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
  GRADLE_OPTS: "-Dorg.gradle.daemon=false"
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

# Validation Stage
validate:pipeline:
  stage: validate
  image: registry.gitlab.com/gitlab-org/cli:latest
  script:
    - echo "Validating pipeline configuration"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

# Build Stage
build:application:
  stage: build
  image: ${hasGradle ? 'gradle:8-jdk17' : 'maven:3.9-openjdk-17'}
  cache:
    paths:
      - ${hasGradle ? '.gradle/wrapper' : '.m2/repository/'}
      - ${hasGradle ? '.gradle/caches' : ''}
  script:
    - ${hasGradle ? './gradlew clean build -x test' : 'mvn clean compile -DskipTests'}
  artifacts:
    paths:
      - ${hasGradle ? 'build/libs/*.jar' : 'target/*.jar'}
    expire_in: 1 hour

# Test Stage
${hasTests ? `test:unit:
  stage: test
  image: ${hasGradle ? 'gradle:8-jdk17' : 'maven:3.9-openjdk-17'}
  cache:
    paths:
      - ${hasGradle ? '.gradle/wrapper' : '.m2/repository/'}
  script:
    - ${hasGradle ? './gradlew test' : 'mvn test'}
  artifacts:
    when: always
    reports:
      junit:
        - ${hasGradle ? 'build/test-results/test/**/TEST-*.xml' : 'target/surefire-reports/TEST-*.xml'}
    paths:
      - ${hasGradle ? 'build/reports/tests/' : 'target/site/jacoco/'}
    expire_in: 1 week
  coverage: '/Total.*?([0-9]{1,3})%/'
` : ''}

# Security Analysis (uses included templates)
sast:
  stage: analyze

dependency_scanning:
  stage: analyze

${hasDocker ? `# Container Security
container_scanning:
  stage: analyze
  variables:
    CS_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# Package Stage
build:docker:
  stage: package
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
` : ''}

# Deploy Stage
deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "Deploying to staging environment"
    - echo "kubectl apply -f k8s/staging/"
  environment:
    name: staging
    url: https://staging.example.com
  rules:
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "Deploying to production environment"
    - echo "kubectl apply -f k8s/production/"
  environment:
    name: production
    url: https://production.example.com
  rules:
    - if: '$CI_COMMIT_TAG'
  when: manual

# TODO: Customize this template based on your specific Jenkins pipeline requirements
# TODO: Add environment-specific variables and secrets
# TODO: Configure notification integrations (Slack, email, etc.)
# TODO: Add performance testing and smoke tests
# TODO: Configure rollback procedures`
}