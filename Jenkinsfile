pipeline {
    agent any

    environment {
        IMAGE_NAME = 'ragforge-api'
        PYTHON = 'C:\\Users\\ruchi\\AppData\\Local\\Programs\\Python\\Python314\\python.exe'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Python Setup') {
            steps {
                bat '"%PYTHON%" --version'
                bat '"%PYTHON%" -m pip --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '"%PYTHON%" -m pip install --upgrade pip'
                bat '"%PYTHON%" -m pip install -r requirements.txt'
            }
        }

        stage('Compile Check') {
            steps {
                bat '"%PYTHON%" -m compileall backend'
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