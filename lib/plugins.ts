import { PluginMatch } from '@/types'

export const plugins: PluginMatch[] = [
  { key: 'maven', name: 'Maven', regex: /withMaven|mvn\s/i, category: 'build' },
  { key: 'gradle', name: 'Gradle', regex: /gradle[w]?/i, category: 'build' },
  { key: 'npm', name: 'NPM', regex: /npm\s+(install|run|test)/i, category: 'build' },
  { key: 'docker', name: 'Docker', regex: /docker\.|docker\s+build/i, category: 'deploy' },
  { key: 'kubernetes', name: 'Kubernetes', regex: /kubernetesDeploy|kubectl/i, category: 'deploy' },
  { key: 'sonarqube', name: 'SonarQube', regex: /withSonarQubeEnv|sonar:/i, category: 'security' },
  { key: 'junit', name: 'JUnit', regex: /junit\s*\(/i, category: 'test' },
  { key: 'credentials', name: 'Credentials', regex: /credentials\s*\(/i, category: 'security' },
  { key: 'slack', name: 'Slack', regex: /slackSend/i, category: 'notification' },
]

export function detectPlugins(jenkinsText: string): PluginMatch[] {
  return plugins.filter(plugin => plugin.regex.test(jenkinsText))
}
