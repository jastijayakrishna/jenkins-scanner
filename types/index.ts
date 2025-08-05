export type ComplexityTier = 'simple' | 'medium' | 'complex'

export interface PluginMatch {
  key: string
  name: string
  regex: RegExp
  category?: string
}

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

export interface ConversionResult {
  yaml: string
  scanResult: ScanResult
  validationErrors: string[]
  success: boolean
}
