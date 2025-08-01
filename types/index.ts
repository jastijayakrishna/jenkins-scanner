export interface PluginMatch {
  key: string
  name: string
  regex: RegExp
  category?: 'build' | 'test' | 'deploy' | 'security' | 'notification' | 'other'
}

export type ComplexityTier = 'simple' | 'medium' | 'complex'

export interface ScanResult {
  pluginHits: Array<{
    key: string
    name: string
    category?: string
  }>
  pluginCount: number
  scripted: boolean
  declarative: boolean
  tier: ComplexityTier
  lineCount: number
  warnings: string[]
  timestamp: number
}
