// lib/score.ts  (very top)
export const scoreVersion = 'v' + Date.now();
console.log('🟢 NEW SCORE MODULE LOADED', scoreVersion);

console.log('🟢 NEW SCORE MODULE LOADED', Date.now())
import { ScanResult } from '@/types'
import { detectPlugins } from './plugins'

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
