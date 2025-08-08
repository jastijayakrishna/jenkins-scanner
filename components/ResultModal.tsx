import React from 'react'
import { X, AlertTriangle, CheckCircle, Info, Brain, Sparkles, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScanResult } from '@/types'
import { cn } from '@/components/ui/utils'

interface ResultModalProps {
  result: ScanResult
  jenkinsContent?: string
  onClose: () => void
  onViewSmartAnalysis?: () => void
}

const tierMeta = {
  simple: {
    variant: 'default' as const,
    icon: <CheckCircle className="h-4 w-4" />,
    text: 'Simple',
    color: 'text-green-600',
  },
  medium: {
    variant: 'secondary' as const,
    icon: <Info className="h-4 w-4" />,
    text: 'Medium',
    color: 'text-blue-600',
  },
  complex: {
    variant: 'destructive' as const,
    icon: <AlertTriangle className="h-4 w-4" />,
    text: 'Complex',
    color: 'text-orange-600',
  },
} as const

export default function ResultModal({ 
  result, 
  jenkinsContent = '',
  onClose, 
  onViewSmartAnalysis
}: ResultModalProps) {
  const meta = tierMeta[result.tier as keyof typeof tierMeta] ?? tierMeta.simple;
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">

          <div className="flex flex-col items-center gap-3 text-center">
            <Badge variant={meta.variant} className="flex items-center gap-2 px-4 py-2">
              {meta.icon}
              {meta.text} Complexity
            </Badge>

            <DialogDescription className="text-center">
              <span className={meta.color}>{result.scripted ? 'Scripted' : 'Declarative'}</span> pipeline • 
              <span className="font-semibold">{result.pluginCount} plugins</span> • {result.lineCount} lines
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Plugins', value: result.pluginCount },
              { label: 'Lines', value: result.lineCount },
              { label: 'Warnings', value: result.warnings.length },
            ].map(stat => (
              <Card key={stat.label} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detected Plugins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary-foreground" />
                </div>
                Detected Jenkins Plugins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.pluginHits && result.pluginHits.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-4">
                    {result.pluginHits.map((plugin, index) => (
                      <Badge key={index} variant="outline" className="justify-center p-2">
                        <span className="truncate">{plugin.key}</span>
                      </Badge>
                    ))}
                  </div>
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Found {result.pluginHits.length} Jenkins plugins that will need GitLab CI/CD equivalents
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium text-sm text-muted-foreground">No specific plugins detected</p>
                  <p className="text-xs text-muted-foreground mt-1">This might be a simple pipeline or use built-in Jenkins features</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-destructive rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
                  </div>
                  Migration Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {result.warnings.map((warning, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription className="text-xs">{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smart Analysis CTA */}
          {onViewSmartAnalysis && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-1">
                    Ready for AI-Powered Analysis?
                    <span>🚀</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get intelligent migration insights, auto-generate your GitLab CI configuration, and receive detailed security recommendations
                  </p>
                  <Button onClick={onViewSmartAnalysis} className="group inline-flex items-center gap-2">
                    <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    Start Smart AI Analysis
                    <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}