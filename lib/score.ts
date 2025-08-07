// lib/score.ts  (very top)
export const scoreVersion = 'v' + Date.now();
console.log('🟢 NEW SCORE MODULE LOADED', scoreVersion);

console.log('🟢 NEW SCORE MODULE LOADED', Date.now())
import { ScanResult } from '@/types'

interface PluginHit {
  key: string
  name: string
  category?: string
}

function detectPlugins(jenkinsText: string): PluginHit[] {
  const plugins: PluginHit[] = []
  
  // Common plugin patterns
  const patterns = [
    { pattern: /withMaven\s*\(/g, key: 'maven', name: 'Maven Plugin', category: 'build' },
    { pattern: /withGradle\s*\(/g, key: 'gradle', name: 'Gradle Plugin', category: 'build' },
    { pattern: /withCredentials\s*\(/g, key: 'credentials', name: 'Credentials Plugin', category: 'security' },
    { pattern: /docker\s*\./g, key: 'docker', name: 'Docker Plugin', category: 'deployment' },
    { pattern: /git\s+url:/g, key: 'git', name: 'Git Plugin', category: 'scm' },
    { pattern: /slackSend\s*\(/g, key: 'slack', name: 'Slack Plugin', category: 'notification' },
    { pattern: /junit\s*\(/g, key: 'junit', name: 'JUnit Plugin', category: 'testing' },
    { pattern: /archiveArtifacts\s*\(/g, key: 'artifacts', name: 'Archive Artifacts', category: 'build' },
    { pattern: /publishTestResults\s*\(/g, key: 'test-results', name: 'Test Results Publisher', category: 'testing' },
    { pattern: /sonarqube\s*\(/g, key: 'sonar', name: 'SonarQube Plugin', category: 'quality' }
  ]
  
  for (const { pattern, key, name, category } of patterns) {
    if (pattern.test(jenkinsText)) {
      plugins.push({ key, name, category })
    }
  }
  
  return plugins
}

export function scan(jenkinsText: string): ScanResult {
  const lines = jenkinsText.split('\n')
  const lineCount = lines.length
  
  const isScripted = /node\s*\{/.test(jenkinsText)
  const isDeclarative = /pipeline\s*\{/.test(jenkinsText)
  
  const pluginHits = detectPlugins(jenkinsText)
  const pluginCount = pluginHits.length
  
  // Simple tier calculation
  let tier: 'simple' | 'medium' | 'complex' = 'simple'
  
  // If scripted, it's at least medium
  if (isScripted) {
    tier = 'medium'
  }
  
  // Plugin-based tiers
  if (pluginCount > 10 || (isScripted && pluginCount > 5)) {
    tier = 'complex'
  } else if (pluginCount > 5) {
    tier = 'medium'
  }
  
  // Line count can bump it up
  if (lineCount > 100 && tier === 'simple') {
    tier = 'medium'
  }
  if (lineCount > 200 || (lineCount > 100 && pluginCount > 8)) {
    tier = 'complex'
  }
  
  const warnings: string[] = []
  if (isScripted) {
    warnings.push('Scripted pipelines are harder to migrate than declarative pipelines')
  }
  if (pluginCount > 15) {
    warnings.push('High plugin count may indicate overly complex pipeline')
  }
  
  console.log('Debug:', { pluginCount, lineCount, isScripted, tier, plugins: pluginHits.map(p => p.name) })
  
  return {
    pluginHits: pluginHits.map(p => ({
      key: p.key,
      name: p.name,
      category: p.category || 'other'
    })),
    pluginCount,
    scripted: isScripted,
    declarative: isDeclarative,
    tier,
    lineCount,
    warnings,
    timestamp: Date.now()
  }
}
