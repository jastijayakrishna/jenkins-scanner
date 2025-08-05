import Head from 'next/head'
import { AlertCircle } from 'lucide-react'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | Jenkins Scanner</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
          
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
          >
            Go back home
          </a>
        </div>
      </div>
    </>
  )
}
