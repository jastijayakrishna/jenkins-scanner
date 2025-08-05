// Example Jenkins pipeline with parameters
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
                echo "Building ${params.BUILD_TYPE} for ${params.DEPLOY_ENV}"
                sh 'mvn clean package'
            }
        }
        
        stage('Test') {
            when {
                expression { params.RUN_TESTS == true }
            }
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Deploy') {
            steps {
                echo "Deploying to ${params.DEPLOY_ENV}"
                echo "Release notes: ${params.RELEASE_NOTES}"
            }
        }
    }
}
