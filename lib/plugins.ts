import type { PluginMatch } from '@/types'

export const plugins: PluginMatch[] = [
  // Build Tools
  { key: 'maven', name: 'Maven', regex: /withMaven|mvn\s/i, category: 'build' },
  { key: 'gradle', name: 'Gradle', regex: /gradle[w]?|withGradle/i, category: 'build' },
  { key: 'npm', name: 'NPM', regex: /npm\s+(install|run|test)/i, category: 'build' },
  { key: 'nodejs', name: 'Node.js', regex: /nodejs\s*\(|node\s+/i, category: 'build' },
  
  // Testing
  { key: 'junit', name: 'JUnit', regex: /junit/i, category: 'test' },
  { key: 'sonarqube', name: 'SonarQube', regex: /withSonarQubeEnv|sonar:/i, category: 'security' },
  
  // Security
  { key: 'credentials', name: 'Credentials', regex: /withCredentials|credentials\s*\(/i, category: 'security' },
  { key: 'vault', name: 'Vault', regex: /withVault/i, category: 'security' },
  { key: 'trivy', name: 'Trivy', regex: /trivy/i, category: 'security' },
  
  // Deployment
  { key: 'docker', name: 'Docker', regex: /docker\.|docker\s+build/i, category: 'deploy' },
  { key: 'kubernetes', name: 'Kubernetes', regex: /kubectl|kubernetes/i, category: 'deploy' },
  { key: 'helm', name: 'Helm', regex: /helm\s+(install|upgrade)/i, category: 'deploy' },
  
  // Notifications
  { key: 'slack', name: 'Slack', regex: /slackSend/i, category: 'notification' },
  { key: 'email', name: 'Email', regex: /emailext/i, category: 'notification' },
  
  // Pipeline Features
  { key: 'parallel', name: 'Parallel', regex: /parallel\s*\{/i, category: 'other' },
  { key: 'matrix', name: 'Matrix', regex: /matrix\s*\{/i, category: 'other' },
  { key: 'retry', name: 'Retry', regex: /retry\s*\(/i, category: 'other' },
  { key: 'timeout', name: 'Timeout', regex: /timeout\s*\(/i, category: 'other' },
  { key: 'parameters', name: 'Parameters', regex: /parameters\s*\{/i, category: 'other' },
  { key: 'buildDiscarder', name: 'Build Discarder', regex: /buildDiscarder/i, category: 'other' }
]

export function detectPlugins(jenkinsText: string): PluginMatch[] {
  return plugins.filter(plugin => plugin.regex.test(jenkinsText))
}
