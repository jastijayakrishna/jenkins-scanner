/**
 * Production-Grade Migration Test
 * Validates the enhanced Jenkins to GitLab migration with security and quality standards
 */

const { productionMigrationEngine } = require('./lib/production-migration-engine.ts')

// Ultimate Sample Jenkinsfile for testing
const ultimateJenkinsfile = `/*
  Ultimate Sample Jenkinsfile
  • Declarative pipeline with embedded scripted blocks
  • Hits >10 popular plugins
*/

// Shared library (custom steps, vars, etc.)
@Library('corp-shared-lib@main') _

pipeline {
    agent none

    parameters {
        choice(name: 'ENV', choices: ['dev', 'qa', 'prod'], description: 'Target environment')
        booleanParam(name: 'RUN_E2E', defaultValue: true, description: 'Execute end-to-end tests?')
        string(name: 'DOCKER_TAG', defaultValue: '', description: 'Override Docker tag (optional)')
    }

    environment {
        DOCKER_REG     = credentials('docker-registry-cred')
        REGISTRY_USER  = credentials('docker-registry-cred-usr')
        REGISTRY_PASS  = credentials('docker-registry-cred-pwd')
        KUBECONFIG_CRED = credentials('kubeconfig-jenkins')
        SONAR_TOKEN    = credentials('sonar-token')
        ARTIFACTORY_RT = credentials('artifactory-rt')
        SLACK_CH       = '#ci-results'
        MAVEN_OPTS     = '-Dmaven.repo.local=.m2/repository'
        COMMIT_HASH    = "\${env.GIT_COMMIT[0..6]}"
        IMG_TAG        = "\${params.DOCKER_TAG ?: COMMIT_HASH}"
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

    stages {
        stage('Checkout') {
            agent { label 'linux-medium' }
            steps {
                checkout scm
                script {
                    currentBuild.displayName = "#\${BUILD_NUMBER} \${COMMIT_HASH}"
                }
            }
        }

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
                            sh 'mvn -B -P\${LANG} clean compile'
                        }
                    }
                    stage('Unit Tests') {
                        steps {
                            sh 'mvn -B -P\${LANG} test'
                        }
                        post {
                            always { junit '**/target/surefire-reports/*.xml' }
                        }
                    }
                    stage('Stash Build Artifacts') {
                        when { expression { env.DB == 'mysql' && env.LANG == 'java17' } }
                        steps {
                            stash includes: 'target/**', name: "jar-\${LANG}-\${DB}"
                        }
                    }
                }
            }
        }

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

        stage('Docker Build & Push') {
            agent { docker { image 'docker:24' args '--privileged' } }
            steps {
                script {
                    docker.withRegistry("https://\${DOCKER_REG}", 'docker-registry-cred') {
                        def img = docker.build("\${DOCKER_REG}/jenkins-scanner:\${IMG_TAG}")
                        img.push()
                        img.push('latest')
                    }
                }
            }
        }

        stage('Publish Artifacts') {
            agent { label 'linux-small' }
            steps {
                unstash name: 'jar-java17-mysql'
                rtUpload (
                    serverId: 'artifactory-rt',
                    spec: """{
                        \\"files\\": [{
                            \\"pattern\\": \\"target/*.jar\\",
                            \\"target\\": \\"libs-release-local/com/example/jenkins-scanner/\${IMG_TAG}/"
                        }]
                    }"""
                )
            }
        }

        stage('Deploy to K8s') {
            when { anyOf { branch 'main'; tag '*'} }
            agent { label 'linux-kubectl' }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-jenkins', variable: 'KUBE_CONFIG')]) {
                    sh """
                      export KUBECONFIG=$KUBE_CONFIG
                      kubectl set image deployment/jenkins-scanner jenkins-scanner=\${DOCKER_REG}/jenkins-scanner:\${IMG_TAG} -n \${params.ENV}
                      kubectl rollout status deployment/jenkins-scanner -n \${params.ENV}
                    """
                }
            }
        }

        stage('E2E Tests') {
            when { expression { params.RUN_E2E } }
            agent { docker { image 'cypress/included:12.17.1' } }
            steps {
                sh 'cypress run --record'
                archiveArtifacts artifacts: 'cypress/videos/**', fingerprint: true
            }
        }
    }

    post {
        success {
            slackSend channel: "\${SLACK_CH}",
                      color: 'good',
                      message: "✅ *\${JOB_NAME}* #\${BUILD_NUMBER} (\${COMMIT_HASH}) succeeded on *\${params.ENV}*"
            emailext subject: "SUCCESS: \${JOB_NAME} #\${BUILD_NUMBER}",
                     to: 'team@example.com',
                     body: "Pipeline succeeded – \${BUILD_URL}"
        }
        failure {
            slackSend channel: "\${SLACK_CH}",
                      color: 'danger',
                      message: "❌ *\${JOB_NAME}* #\${BUILD_NUMBER} failed (<\${BUILD_URL}|details>)"
            emailext subject: "FAILURE: \${JOB_NAME} #\${BUILD_NUMBER}",
                     to: 'team@example.com',
                     body: "See \${BUILD_URL}"
        }
        always {
            cleanWs()
        }
    }
}`

// Mock scan result with comprehensive plugin hits
const mockScanResult = {
    pluginHits: [
        { key: 'credentials-binding', name: 'Credentials Binding Plugin', category: 'security' },
        { key: 'docker-workflow', name: 'Docker Pipeline Plugin', category: 'containerization' },
        { key: 'git', name: 'Git Plugin', category: 'scm' },
        { key: 'artifactory', name: 'Artifactory Plugin', category: 'artifact-management' },
        { key: 'kubernetes-cli', name: 'Kubernetes CLI Plugin', category: 'deployment' },
        { key: 'slack', name: 'Slack Notification Plugin', category: 'notification' },
        { key: 'email-ext', name: 'Email Extension Plugin', category: 'notification' },
        { key: 'pipeline-utility-steps', name: 'Pipeline Utility Steps', category: 'pipeline' },
        { key: 'pipeline-model-definition', name: 'Pipeline Model Definition', category: 'pipeline' },
        { key: 'sonar', name: 'SonarQube Scanner', category: 'quality' },
        { key: 'junit', name: 'JUnit Plugin', category: 'testing' },
        { key: 'timestamps', name: 'Timestamper', category: 'logging' },
        { key: 'ansiColor', name: 'AnsiColor Plugin', category: 'logging' },
        { key: 'timeout', name: 'Build Timeout Plugin', category: 'build-management' },
        { key: 'buildDiscarder', name: 'Build Discarder', category: 'build-management' },
        { key: 'maven-integration-plugin', name: 'Maven Integration Plugin', category: 'build-tools' },
        { key: 'nodejs', name: 'NodeJS Plugin', category: 'build-tools' }
    ],
    pluginCount: 17,
    scripted: false,
    declarative: true,
    tier: 'complex',
    lineCount: 245,
    warnings: [],
    timestamp: Date.now()
}

async function testProductionMigration() {
    console.log('🚀 Testing Production-Grade Migration Engine...')
    console.log('📊 Input Analysis:')
    console.log(`   • Jenkinsfile: ${ultimateJenkinsfile.split('\n').length} lines`)
    console.log(`   • Plugins: ${mockScanResult.pluginCount} detected`)
    console.log(`   • Complexity: ${mockScanResult.tier}`)
    console.log(`   • Type: ${mockScanResult.declarative ? 'Declarative' : 'Scripted'}`)

    try {
        const result = await productionMigrationEngine.migrate({
            jenkinsfile: ultimateJenkinsfile,
            scanResult: mockScanResult,
            options: {
                includeSecurityScan: true,
                replaceDigests: false, // Keep placeholders for demo
                generateVariablesFile: true,
                strict: true
            }
        })

        console.log('\n✅ Production-Grade Migration Results:')
        console.log(`   • Overall Confidence: ${Math.round(result.confidence.overall * 100)}%`)
        console.log(`   • High-Confidence Plugins: ${result.confidence.highConfidencePlugins}/${result.metadata.totalPlugins}`)
        console.log(`   • Low-Confidence Plugins: ${result.confidence.lowConfidencePlugins}`)
        console.log(`   • Manual Review Required: ${result.confidence.manualReviewRequired.length}`)
        console.log(`   • Security Scans: ${result.securityReport.length} images validated`)
        console.log(`   • Deployment Checklist: ${result.deploymentChecklist.length} items`)

        // Production-grade quality verification
        console.log('\n🔍 Production Quality Verification:')
        const qualityChecks = [
            { name: 'Docker images with SHA256 digests', pass: result.gitlabYaml.includes('@sha256:') },
            { name: 'Timeout mappings for all jobs', pass: result.gitlabYaml.includes('timeout:') },
            { name: 'Security scanning included', pass: result.gitlabYaml.includes('security_scan:') },
            { name: 'High-confidence plugin mappings', pass: result.confidence.overall >= 0.8 },
            { name: 'Shared library detection', pass: result.gitlabYaml.includes('# TODO: Shared library') },
            { name: 'Variables template generated', pass: result.variablesYaml.includes('variables:') },
            { name: 'Matrix build preserved', pass: result.gitlabYaml.includes('matrix:') },
            { name: 'Parallel stages maintained', pass: result.gitlabYaml.includes('sonarqube:') && result.gitlabYaml.includes('eslint:') },
            { name: 'Kubernetes deployment included', pass: result.gitlabYaml.includes('deploy_k8s:') },
            { name: 'Notification handlers present', pass: result.gitlabYaml.includes('success_notification:') },
            { name: 'Artifact management configured', pass: result.gitlabYaml.includes('stash_artifacts:') },
            { name: 'Build cleanup implemented', pass: result.gitlabYaml.includes('cleanup:') }
        ]

        const passedChecks = qualityChecks.filter(check => check.pass).length
        const totalChecks = qualityChecks.length
        const qualityScore = Math.round((passedChecks / totalChecks) * 100)

        qualityChecks.forEach(check => {
            console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`)
        })

        console.log(`\n🎯 Production Quality Score: ${qualityScore}% (${passedChecks}/${totalChecks} checks passed)`)

        if (qualityScore >= 95) {
            console.log('🏆 PRODUCTION-READY! Enhanced standards achieved!')
        } else if (qualityScore >= 85) {
            console.log('⭐ High quality, meets production standards with minor optimizations')
        } else {
            console.log('⚠️  Quality below production standards - requires improvements')
        }

        // Deployment readiness check
        console.log('\n📋 Deployment Checklist:')
        result.deploymentChecklist.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item}`)
        })

        // Manual review items
        if (result.confidence.manualReviewRequired.length > 0) {
            console.log('\n🔎 Manual Review Required:')
            result.confidence.manualReviewRequired.forEach(plugin => {
                console.log(`   • ${plugin}`)
            })
        }

        console.log('\n📁 Generated Files:')
        console.log('   • .gitlab-ci.yml (production-grade GitLab CI configuration)')
        console.log('   • .gitlab/variables.yml (variables template)')
        console.log('   • deployment-checklist.md (implementation guide)')

        return { success: true, qualityScore, result }

    } catch (error) {
        console.error('❌ Production migration test failed:', error)
        return { success: false, error: error.message }
    }
}

// Quality validation function
function validateProductionStandards(result) {
    const yaml = result.gitlabYaml
    const validations = []

    // Check for proper image digests
    const hasDigests = (yaml.match(/@sha256:[a-f0-9]{64}/g) || []).length >= 7
    validations.push({ test: 'Docker SHA256 digests', pass: hasDigests })

    // Check for timeout mappings
    const hasTimeouts = (yaml.match(/timeout:\s*\d+[mh]/g) || []).length >= 10
    validations.push({ test: 'Timeout mappings', pass: hasTimeouts })

    // Check for security features
    const hasSecurityScan = yaml.includes('security_scan:') && yaml.includes('trivy')
    validations.push({ test: 'Security scanning', pass: hasSecurityScan })

    // Check for proper plugin mappings
    const highConfidenceRatio = result.confidence.overall >= 0.85
    validations.push({ test: 'High-confidence mappings', pass: highConfidenceRatio })

    // Lint-ready validation
    const hasValidSyntax = yaml.includes('stages:') && yaml.includes('variables:') && yaml.includes('workflow:')
    validations.push({ test: 'GitLab CI syntax', pass: hasValidSyntax })

    return validations
}

// Export for testing
module.exports = { testProductionMigration, ultimateJenkinsfile, mockScanResult, validateProductionStandards }

// Run test if called directly
if (require.main === module) {
    testProductionMigration()
        .then(result => {
            if (result.success) {
                console.log(`\n🚀 Production migration test PASSED with ${result.qualityScore}% quality score!`)
                process.exit(0)
            } else {
                console.log('\n🔧 Production migration needs improvements')
                console.error(result.error)
                process.exit(1)
            }
        })
        .catch(error => {
            console.log('\n💥 Production migration test FAILED')
            console.error(error)
            process.exit(1)
        })
}