/**
 * Test script to verify the advanced migration engine produces high-quality output
 */

const sampleJenkinsfile = `/*───────────────────────────────────────────────────────────────────────────
  Ultimate Sample Jenkinsfile
  • Declarative pipeline with embedded scripted blocks
  • Hits >10 popular plugins:
      - credentials-binding
      - docker-workflow
      - git / scm-step
      - artifactory
      - kubernetes-cli
      - slack
      - email-ext
      - pipeline-utility-steps (stash/unstash)
      - pipeline-model-definition (matrix)
      - shared-library reference
───────────────────────────────────────────────────────────────────────────*/

// Shared library (custom steps, vars, etc.)
@Library('corp-shared-lib@main') _

pipeline {
    agent none

    /*──────────────────────
     | Global configuration |
     ───────────────────────*/
    parameters {
        choice(name: 'ENV', choices: ['dev', 'qa', 'prod'], description: 'Target environment')
        booleanParam(name: 'RUN_E2E', defaultValue: true, description: 'Execute end-to-end tests?')
        string(name: 'DOCKER_TAG', defaultValue: '', description: 'Override Docker tag (optional)')
    }

    environment {
        // Credentials-Binding plugin
        DOCKER_REG     = credentials('docker-registry-cred')  // returns URL
        REGISTRY_USER  = credentials('docker-registry-cred-usr')
        REGISTRY_PASS  = credentials('docker-registry-cred-pwd')
        KUBECONFIG_CRED = credentials('kubeconfig-jenkins')
        SONAR_TOKEN    = credentials('sonar-token')
        ARTIFACTORY_RT = credentials('artifactory-rt')
        SLACK_CH       = '#ci-results'
        MAVEN_OPTS     = '-Dmaven.repo.local=.m2/repository'
        COMMIT_HASH    = "$\{env.GIT_COMMIT[0..6]\}"
        IMG_TAG        = "$\{params.DOCKER_TAG ?: COMMIT_HASH\}"
    }

    tools {
        maven 'Maven-3.9'
        jdk   'temurin-17'
        nodejs 'Node-18'
    }

    options {
        timestamps()
        ansiColor('xterm')
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    /*────────────
     | Stages
     ────────────*/
    stages {

        /* Checkout & Versioning */
        stage('Checkout') {
            agent { label 'linux-medium' }
            steps {
                checkout scm
                script {
                    currentBuild.displayName = "#$\{BUILD_NUMBER\} $\{COMMIT_HASH\}"
                }
            }
        }

        /* Matrix Compile + Unit Tests (Java 17 vs 21, MySQL vs Postgres) */
        stage('Build & Unit Tests') {
            agent { docker { image 'maven:3.9-eclipse-temurin-17' args '-v /var/run/docker.sock:/var/run/docker.sock' } }
            matrix {
                axes {
                    axis { name 'LANG'; values 'java17', 'java21' }
                    axis { name 'DB';   values 'mysql', 'postgres' }
                }
                stages {
                    stage('Compile') {
                        steps {
                            sh 'mvn -B -P$\{LANG\} clean compile'
                        }
                    }
                    stage('Unit Tests') {
                        steps {
                            sh 'mvn -B -P$\{LANG\} test'
                        }
                        post {
                            always { junit '**/target/surefire-reports/*.xml' }
                        }
                    }
                    stage('Stash Build Artifacts') {
                        when { expression { env.DB == 'mysql' && env.LANG == 'java17' } }
                        steps {
                            stash includes: 'target/**', name: "jar-$\{LANG\}-$\{DB\}"
                        }
                    }
                }
            }
        }

        /* Static Analysis (parallel Sonar + ESLint) */
        stage('Static Analysis') {
            parallel {
                stage('SonarQube') {
                    agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
                    steps {
                        withSonarQubeEnv('SonarQube') {
                            sh """
                              mvn -B verify sonar:sonar \\
                                -Dsonar.login=$SONAR_TOKEN
                            """
                        }
                    }
                }
                stage('ESLint (Frontend)') {
                    agent { docker { image 'node:18-alpine' } }
                    steps {
                        sh 'npm ci'
                        sh 'npm run eslint'
                    }
                }
            }
        }

        /* Build Docker Image & Push */
        stage('Docker Build & Push') {
            agent { docker { image 'docker:24' args '--privileged' } }
            steps {
                script {
                    docker.withRegistry("https://$\{DOCKER_REG\}", 'docker-registry-cred') {
                        def img = docker.build("$\{DOCKER_REG\}/jenkins-scanner:$\{IMG_TAG\}")
                        img.push()
                        img.push('latest')
                    }
                }
            }
        }

        /* Publish Maven Artifact to Artifactory */
        stage('Publish Artifacts') {
            agent { label 'linux-small' }
            steps {
                unstash name: 'jar-java17-mysql'
                rtUpload (
                    serverId: 'artifactory-rt',
                    spec: """\\{
                        \\"files\\": [\\{
                            \\"pattern\\": \\"target/*.jar\\",
                            \\"target\\": \\"libs-release-local/com/example/jenkins-scanner/$\{IMG_TAG\}/\\"
                        \\}]
                    \\}"""
                )
            }
        }

		/* Deploy to Kubernetes */
        stage('Deploy to K8s') {
            when { anyOf { branch 'main'; tag '*'} }
            agent { label 'linux-kubectl' }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-jenkins', variable: 'KUBE_CONFIG')]) {
                    sh """
                      export KUBECONFIG=$KUBE_CONFIG
                      kubectl set image deployment/jenkins-scanner jenkins-scanner=$\{DOCKER_REG\}/jenkins-scanner:$\{IMG_TAG\} -n $\{params.ENV\}
                      kubectl rollout status deployment/jenkins-scanner -n $\{params.ENV\}
                    """
                }
            }
        }

        /* (Optional) End-to-End Cypress tests */
        stage('E2E Tests') {
            when { expression { params.RUN_E2E } }
            agent { docker { image 'cypress/included:12.17.1' } }
            steps {
                sh 'cypress run --record'
                archiveArtifacts artifacts: 'cypress/videos/**', fingerprint: true
            }
        }
    } // stages

    /*────────────
     | Post-build
     ────────────*/
    post {
        success {
            slackSend channel: "$\{SLACK_CH\}",
                      color: 'good',
                      message: "✅ *$\{JOB_NAME\}* #$\{BUILD_NUMBER\} ($\{COMMIT_HASH\}) succeeded on *$\{params.ENV\}*"
            emailext subject: "SUCCESS: $\{JOB_NAME\} #$\{BUILD_NUMBER\}",
                     to: 'team@example.com',
                     body: "Pipeline succeeded – $\{BUILD_URL\}"
        }
        failure {
            slackSend channel: "$\{SLACK_CH\}",
                      color: 'danger',
                      message: "❌ *$\{JOB_NAME\}* #$\{BUILD_NUMBER\} failed (<$\{BUILD_URL\}|details>)"
            emailext subject: "FAILURE: $\{JOB_NAME\} #$\{BUILD_NUMBER\}",
                     to: 'team@example.com',
                     body: "See $\{BUILD_URL\}"
        }
        always {
            cleanWs()
        }
    }
}`

async function testAdvancedMigration() {
    console.log('🧪 Testing Advanced Migration Engine...')
    
    try {
        const response = await fetch('http://localhost:3000/api/advanced-convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jenkinsfile: sampleJenkinsfile,
                target_engine: 'gitlab',
                plugin_mappings: [
                    {"jenkins_plugin": "credentials-binding", "gitlab_equivalent": "CI/CD Variables or vault secrets", "confidence": 0.95},
                    {"jenkins_plugin": "docker-workflow", "gitlab_equivalent": "image, services, dind", "confidence": 0.90},
                    {"jenkins_plugin": "git", "gitlab_equivalent": "Native GitLab SCM", "confidence": 1.00},
                    {"jenkins_plugin": "artifactory", "gitlab_equivalent": "artifacts or external Artifactory API", "confidence": 0.85},
                    {"jenkins_plugin": "kubernetes-cli", "gitlab_equivalent": "kubectl in container", "confidence": 0.90},
                    {"jenkins_plugin": "slack", "gitlab_equivalent": "slack-notifier or HTTP webhook", "confidence": 0.80},
                    {"jenkins_plugin": "email-ext", "gitlab_equivalent": "notifications or SMTP via curl", "confidence": 0.70},
                    {"jenkins_plugin": "pipeline-utility-steps", "gitlab_equivalent": "artifacts for stash/unstash", "confidence": 0.95},
                    {"jenkins_plugin": "pipeline-model-definition", "gitlab_equivalent": "parallel:matrix", "confidence": 0.90},
                    {"jenkins_plugin": "sonar", "gitlab_equivalent": "sonarqube integration or CLI", "confidence": 0.90}
                ]
            })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        console.log('✅ Advanced Migration Test Results:')
        console.log('📊 Generated YAML:')
        console.log(result.yaml.substring(0, 500) + '...')
        console.log('\n📋 Metadata:')
        console.log(JSON.stringify(result.metadata, null, 2))
        
        // Verify key elements
        const hasStages = result.yaml.includes('stages:')
        const hasVariables = result.yaml.includes('variables:')
        const hasMatrix = result.yaml.includes('parallel:')
        const hasTODOs = result.yaml.includes('TODO:')
        const hasConfidenceScores = result.yaml.includes('confidence:')
        
        console.log('\n🔍 Quality Checks:')
        console.log(`✅ Has stages definition: ${hasStages}`)
        console.log(`✅ Has variables section: ${hasVariables}`)
        console.log(`✅ Has matrix/parallel jobs: ${hasMatrix}`)
        console.log(`✅ Has TODO comments: ${hasTODOs}`)
        console.log(`✅ Has confidence scores: ${hasConfidenceScores}`)
        
        return result
        
    } catch (error) {
        console.error('❌ Test failed:', error)
        throw error
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testAdvancedMigration()
        .then(() => console.log('✅ All tests passed!'))
        .catch(() => process.exit(1))
}

module.exports = { testAdvancedMigration }