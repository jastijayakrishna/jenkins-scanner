// Sample complex Jenkinsfile showcasing all features
// This demonstrates the full capabilities of the converter

pipeline {
    agent any
    
    properties {
        parameters {
            string(name: 'ENV', defaultValue: 'staging', description: 'Target deployment environment')
            booleanParam(name: 'RUN_TESTS', defaultValue: true, description: 'Execute test suite')
            choice(name: 'REGION', choices: ['us-east-1', 'eu-west-1', 'ap-south-1'], description: 'AWS Region')
        }
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '10'))
    }
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        APP_NAME = 'jenkins-migrator'
    }
    
    stages {
        stage('Build & Test Matrix') {
            matrix {
                axes {
                    axis {
                        name 'LANG'
                        values 'java17', 'java21'
                    }
                    axis {
                        name 'DB'
                        values 'mysql', 'postgres'
                    }
                }
                stages {
                    stage('Compile') {
                        steps {
                            timeout(time: 15, unit: 'MINUTES') {
                                echo "Building with ${LANG} and ${DB}"
                                withMaven(maven: 'maven-3.9', jdk: "${LANG}") {
                                    sh 'mvn clean compile -P${LANG}'
                                }
                            }
                        }
                    }
                    stage('Unit Tests') {
                        when {
                            expression { params.RUN_TESTS == true }
                        }
                        steps {
                            sh 'mvn test -Ddb=${DB}'
                            junit '**/target/surefire-reports/TEST-*.xml'
                        }
                    }
                }
            }
        }
        
        stage('Security Scans') {
            parallel {
                stage('SonarQube Analysis') {
                    steps {
                        withSonarQubeEnv('SonarQube-Server') {
                            withMaven(maven: 'maven-3.9') {
                                sh 'mvn sonar:sonar -Dsonar.projectKey=${APP_NAME}'
                            }
                        }
                    }
                }
                stage('Trivy Security Scan') {
                    steps {
                        sh 'trivy fs --severity HIGH,CRITICAL --exit-code 1 .'
                    }
                }
                stage('OWASP Dependency Check') {
                    steps {
                        sh 'mvn org.owasp:dependency-check-maven:check'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        def app = docker.build("${APP_NAME}:${BUILD_NUMBER}")
                        app.push()
                        app.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            when {
                branch pattern: "^(main|master|release/.*)$", comparator: "REGEXP"
            }
            steps {
                withVault(configuration: [
                    timeout: 60,
                    vaultUrl: 'https://vault.company.com',
                    vaultCredentialId: 'vault-token'
                ], vaultSecrets: [
                    [path: 'secret/kubernetes', secretValues: [
                        [vaultKey: 'config', envVar: 'KUBECONFIG'],
                        [vaultKey: 'namespace', envVar: 'K8S_NAMESPACE']
                    ]]
                ]) {
                    retry(3) {
                        sh """
                            helm upgrade --install ${APP_NAME} ./charts/${APP_NAME} \
                                --namespace \${K8S_NAMESPACE} \
                                --set image.tag=${BUILD_NUMBER} \
                                --set environment=${params.ENV} \
                                --wait --timeout 5m
                        """
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                expression { params.ENV != 'prod' }
            }
            steps {
                sh 'npm run test:integration'
            }
        }
    }
    
    post {
        success {
            slackSend(
                channel: '#ci-cd',
                color: 'good',
                message: "✅ Pipeline Success: ${JOB_NAME} - ${BUILD_NUMBER} (<${BUILD_URL}|Open>)"
            )
            emailext(
                to: 'devops@company.com',
                subject: "Build Success: ${JOB_NAME} - ${BUILD_NUMBER}",
                body: "The build completed successfully. View details at ${BUILD_URL}"
            )
        }
        failure {
            slackSend(
                channel: '#ci-cd',
                color: 'danger',
                message: "❌ Pipeline Failed: ${JOB_NAME} - ${BUILD_NUMBER} (<${BUILD_URL}|Open>)"
            )
        }
        always {
            archiveArtifacts artifacts: '**/target/*.jar', fingerprint: true
            cleanWs()
        }
    }
}
