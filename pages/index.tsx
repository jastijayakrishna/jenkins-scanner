// pages/index.tsx
import { useState } from 'react'
import Head from 'next/head'
import Dropzone from '@/components/Dropzone'
import { ScanResult } from '@/types'

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null)

  return (
    <>
      <Head>
        <title>Jenkins → GitLab Scanner</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>

      {/* ---------- Background & blobs ---------- */}
      <main className="relative min-h-screen overflow-hidden
                       bg-gradient-to-br from-brand-50 via-white to-brand-100
                       dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
                       selection:bg-brand-300">

        {/* animated blobs (pointer-events-none so they never block clicks) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob bg-brand-300 top-[-8rem] left-[-8rem]" />
          <div className="blob bg-brand-500 bottom-[-7rem] left-1/2 animate-delay-2000" />
          <div className="blob bg-brand-400 top-[-5rem] right-[-6rem] animate-delay-4000" />
        </div>

        {/* ---------- Content ---------- */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 md:py-32">

          {/* Title */}
          <header className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Jenkins&nbsp;<span className="text-brand-600">→</span>&nbsp;GitLab
              <br className="hidden sm:block" />
              <span className="text-brand-600">Migration&nbsp;Scanner</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Upload your&nbsp;Jenkinsfile &nbsp;•&nbsp; Get instant complexity analysis
            </p>
          </header>

          {/* frosted-glass card */}
          <div className="mx-auto max-w-3xl rounded-3xl bg-white/40
                          backdrop-blur-xs ring-1 ring-white/30
                          dark:bg-slate-800/40 dark:ring-slate-600/30
                          p-8 shadow-xl shadow-brand-900/5">

            <Dropzone onScan={setResult} />

            {result && (
              <div className="mt-10 animate-slide-up space-y-4 text-sm sm:text-base">
                <h2 className="text-2xl font-semibold text-brand-700 dark:text-brand-300">
                  Analysis Results
                </h2>

                <ul className="grid gap-2 sm:grid-cols-2">
                  <li><b>Complexity:</b> {result.tier}</li>
                  <li><b>Type:</b> {result.declarative ? 'Declarative' :
                                     result.scripted ? 'Scripted' : 'Unknown'}</li>
                  <li><b>Lines:</b> {result.lineCount}</li>
                  <li><b>Plugins:</b> {result.pluginCount}</li>
                </ul>

                {result.pluginHits.length > 0 && (
                  <details open className="pt-2">
                    <summary className="cursor-pointer select-none font-medium">
                      Found ({result.pluginHits.length})
                    </summary>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {result.pluginHits.map(p => (
                        <li key={p.key}
                            className="rounded-full bg-brand-100 px-3 py-1 text-xs
                                       text-brand-800 dark:bg-brand-700/30
                                       dark:text-brand-200">
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>

        </section>
      </main>
    </>
  )
}
