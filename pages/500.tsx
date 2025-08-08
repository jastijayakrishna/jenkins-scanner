import Head from 'next/head'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function Custom500() {
  return (
    <>
      <Head>
        <title>500 - Server Error | Jenkins Scanner</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Server Error
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Something went wrong on our servers. We’re working to fix the issue. Please try again later.
          </p>
          
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
