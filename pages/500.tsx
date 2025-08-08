import Head from 'next/head'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error | Jenkins Scanner</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-white/80 mb-4">
            Server Error
          </h2>
          
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Something went wrong on our servers. We’re working to fix the issue. Please try again later.
          </p>
          
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-black bg-white rounded-md hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-black bg-white rounded-md hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
