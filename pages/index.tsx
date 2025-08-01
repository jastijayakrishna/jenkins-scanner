import { useState } from 'react'
import Head from 'next/head'
import { ScanResult } from '@/types'
import Dropzone from '@/components/Dropzone'

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null)

  return (
    <>
      <Head>
        <title>Jenkins to GitLab Scanner</title>
      </Head>
      
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            Jenkins to GitLab Migration Scanner
          </h1>
          
          <Dropzone onScan={setResult} />
          
          {result && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">
                Complexity: {result.tier}
              </h2>
              <p>Detected {result.pluginCount} plugins</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
