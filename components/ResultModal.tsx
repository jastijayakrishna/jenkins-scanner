import React from 'react'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { ScanResult } from '@/types'

interface ResultModalProps {
  result: ScanResult
  onClose: () => void
}

const tierMeta = {
  simple: {
    colors: 'from-emerald-500 to-emerald-600',
    icon: <CheckCircle className="h-6 w-6" />,
    text: 'Simple',
  },
  medium: {
    colors: 'from-amber-500 to-amber-600',
    icon: <Info className="h-6 w-6" />,
    text: 'Medium',
  },
  complex: {
    colors: 'from-rose-500 to-rose-600',
    icon: <AlertTriangle className="h-6 w-6" />,
    text: 'Complex',
  },
} as const

export default function ResultModal({ result, onClose }: ResultModalProps) {
  const meta = tierMeta[result.tier]

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        {/* ✦ glowing banner */}
        <div className={`h-3 w-full bg-gradient-to-r ${meta.colors}`} />

        {/* close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* body */}
        <div className="space-y-10 px-8 py-10 sm:px-12">
          {/* complexity header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={`flex items-center gap-3 rounded-full bg-gradient-to-r ${meta.colors} px-4 py-1
                          text-sm font-semibold uppercase tracking-wide text-white shadow-lg`}
            >
              {meta.icon}
              {meta.text} Complexity
            </div>

            <p className="text-base text-slate-600 dark:text-slate-400">
              {result.scripted ? 'Scripted' : 'Declarative'} pipeline &bull;{' '}
              {result.pluginCount} plugins &bull; {result.lineCount} lines
            </p>
          </div>

          {/* stats grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Plugins', value: result.pluginCount },
              { label: 'Lines', value: result.lineCount },
              { label: 'Warnings', value: result.warnings.length },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-xl bg-slate-50 px-4 py-6 shadow-sm dark:bg-slate-800/50"
              >
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* warnings */}
          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-400/30 dark:bg-amber-400/10">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </h4>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                {result.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* plugin pills */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
              Detected Plugins
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.pluginHits.map(p => (
                <span
                  key={p.key}
                  className={`rounded-full bg-gradient-to-r ${meta.colors}/10 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* CTA stub */}
          <div
            className={`rounded-xl bg-gradient-to-r ${meta.colors} p-6 text-center shadow-lg`}
          >
            <p className="text-sm font-medium text-white">
              Need a full GitLab migration plan?&nbsp;
              <button className="underline underline-offset-2">
                Get your free PDF &rarr;
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
