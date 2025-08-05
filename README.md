# Jenkins to GitLab Migration Scanner

**The most comprehensive Jenkins-to-GitLab CI/CD converter available!** 

A powerful web application that analyzes Jenkins pipeline files and automatically converts them to GitLab CI/CD configurations with complete feature parity.

![Jenkins to GitLab](https://img.shields.io/badge/Jenkins-GitLab-orange?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)

## 🚀 Complete Feature Support

### ✅ Jenkins Features Fully Converted

| Jenkins Feature | GitLab Equivalent | Status |
|----------------|-------------------|--------|
| **Parameters** | CI/CD Variables + Workflow Rules | ✅ Complete |
| **Matrix Builds** | Parallel Matrix | ✅ Complete |
| **Timeout** | Job Timeout | ✅ Complete |
| **Retry Logic** | Retry with conditions | ✅ Complete |
| **When Conditions** | Rules with expressions | ✅ Complete |
| **Parallel Stages** | Parallel jobs with needs[] | ✅ Complete |
| **withCredentials** | CI/CD Variables (masked) | ✅ Complete |
| **withVault** | HashiCorp Vault integration | ✅ Complete |
| **Post Actions** | After scripts + Integrations | ✅ Complete |
| **Build Discarder** | Artifact expiration | ✅ Complete |
| **Docker Registry** | Container Registry auth | ✅ Complete |
| **Notifications** | Slack/Email integrations | ✅ Complete |

### 🎯 Advanced Conversion Examples

#### Matrix Build Conversion
**Jenkins:**
```groovy
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
}
```

**GitLab Output:**
```yaml
test:matrix:
  parallel:
    matrix:
      - LANG: ["java17", "java21"]
        DB: ["mysql", "postgres"]
  script:
    - echo "Testing with $LANG and $DB"
```

#### Parallel Security Scans
**Jenkins:**
```groovy
parallel {
    stage('SonarQube') { ... }
    stage('Trivy') { ... }
}
```

**GitLab Output:**
```yaml
sonar:scan:
  stage: security
  needs: []  # Run immediately in parallel
  
trivy:scan:
  stage: security
  needs: []  # Run immediately in parallel
```

## 🚀 Features

### Core Functionality
- **📊 Pipeline Analysis**: Instant complexity assessment of Jenkins pipelines
- **🔍 Plugin Detection**: Identifies 20+ Jenkins plugins and their GitLab equivalents
- **🎯 Complexity Scoring**: Categorizes pipelines as Simple, Medium, or Complex
- **⚡ Real-time Conversion**: AI-powered conversion from Jenkinsfile to .gitlab-ci.yml
- **✅ Validation**: Built-in GitLab CI/CD syntax validation

### Supported Jenkins Features
- **Build Tools**: Maven, Gradle, NPM, Node.js
- **Testing**: JUnit, SonarQube
- **Security**: Credentials, Vault, Trivy
- **Deployment**: Docker, Kubernetes, Helm
- **Notifications**: Slack, Email
- **Pipeline Features**: Parallel execution, Matrix builds, Retry logic

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with modern glassmorphism design
- **UI Components**: Radix UI, Lucide Icons
- **File Handling**: React Dropzone
- **Testing**: Jest, React Testing Library

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jenkins-scanner.git
cd jenkins-scanner
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

1. **Upload Your Jenkinsfile**: Drag and drop or click to browse
2. **View Analysis Results**: See complexity, plugin usage, and warnings
3. **Convert to GitLab**: Click the conversion button to generate .gitlab-ci.yml
4. **Download or Copy**: Get your GitLab CI/CD configuration instantly

## 🔄 Conversion Examples

### Simple Maven Project
**Jenkins Input:**
```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                withMaven(maven: 'maven-3') {
                    sh 'mvn clean compile'
                }
            }
        }
    }
}
```

**GitLab Output:**
```yaml
default:
  image: maven:3.8-openjdk-11
  cache:
    paths:
      - .m2/repository/

stages:
  - build
  - test

build:app:
  stage: build
  script:
    - mvn clean compile
```

## 🏗️ Architecture

```
jenkins-scanner/
├── components/          # React components
│   ├── Dropzone.tsx    # File upload interface
│   └── GitLabConverter.tsx # Conversion UI
├── lib/                # Core logic
│   ├── score.ts        # Analysis engine
│   ├── plugins.ts      # Plugin definitions
│   └── gitlab-converter.ts # Conversion logic
├── pages/              # Next.js pages
│   ├── api/           # API endpoints
│   └── index.tsx      # Main application
└── types/             # TypeScript definitions
```

## 🔧 API Endpoints

### POST /api/parse
Analyzes a Jenkins pipeline file
```json
{
  "content": "pipeline { ... }"
}
```

### POST /api/convert
Converts Jenkins pipeline to GitLab CI/CD
```json
{
  "content": "pipeline { ... }"
}
```

## 🎨 Features in Development

- [ ] Bulk file conversion
- [ ] Jenkins instance integration
- [ ] Custom plugin mapping rules
- [ ] Migration progress tracking
- [ ] Team collaboration features
- [ ] Cost estimation calculator

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Jenkins and GitLab communities
- Contributors and testers
- Open source libraries used in this project

---

**Built with ❤️ for the DevOps community**
