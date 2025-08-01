@Library('shared-library') _

pipeline {
    agent none
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'prod'])
        booleanParam(name: 'RUN_TESTS', defaultValue: true)
    }
    
    stages {
        stage('Build') {
            parallel {
                stage('Frontend') {
                    agent { docker 'node:18' }
                    steps {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
                stage('Backend') {
                    agent { docker 'maven:3.8' }
                    steps {
                        withMaven(maven: 'Maven-3.8') {
                            sh 'mvn clean package'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            when { expression { params.RUN_TESTS } }
            steps {
                sh 'npm test'
                junit '**/target/surefire-reports/*.xml'
            }
        }
        
        stage('Security Scan') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar'
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'api-key', variable: 'API_KEY')]) {
                    kubernetesDeploy(
                        configs: 'k8s/*.yaml',
                        kubeconfigId: 'kubeconfig'
                    )
                }
            }
        }
    }
    
    post {
        success {
            slackSend(color: 'good', message: "Deployment successful!")
        }
        failure {
            emailext(
                subject: "Build Failed",
                body: "Check console output",
                to: 'team@example.com'
            )
        }
    }
}
