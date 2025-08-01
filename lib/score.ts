import { ScanResult } from '@/types'
import { detectPlugins } from './plugins'

export function scan(jenkinsText: string): ScanResult {
  const lines = jenkinsText.split('\n')
  const lineCount = lines.length
  
  const isScripted = /node\s*\{/.test(jenkinsText)
  const isDeclarative = /pipeline\s*\{/.test(jenkinsText)
  
  const pluginHits = detectPlugins(jenkinsText)
  const pluginCount = pluginHits.length
  
  let tier: 'simple' | 'medium' | 'complex' = 'simple'
  if (pluginCount > 15 || isScripted) tier = 'complex'
  else if (pluginCount > 5) tier = 'medium'
  
  const warnings: string[] = []
  if (isScripted) {
    warnings.push('Scripted pipelines are harder to migrate')
  }
  
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
