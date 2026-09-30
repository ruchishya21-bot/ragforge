pipeline {
    agent any

    environment {
        IMAGE_NAME = 'ragforge-api'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Python Setup') {
            steps {
                bat 'python --version'
                bat 'pip --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'python -m pip install --upgrade pip'
                bat 'pip install -r requirements.txt'
            }
        }

        stage('Compile Check') {
            steps {
                bat 'python -m compileall backend'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %IMAGE_NAME%:%BUILD_NUMBER% .'
                bat 'docker tag %IMAGE_NAME%:%BUILD_NUMBER% %IMAGE_NAME%:latest'
            }
        }
    }

    post {
        success {
            echo 'RAGForge CI pipeline completed successfully.'
        }

        failure {
            echo 'RAGForge CI pipeline failed.'
        }
    }
}
