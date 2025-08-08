import Head from 'next/head'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | Jenkins Scanner</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-white/80 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            The page you’re looking for doesn’t exist. It might have been moved or deleted.
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 text-base font-medium text-black bg-white rounded-md hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
          >
            Go back home
          </Link>
        </div>
      </div>
    </>
  )
}
