import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ScanResult } from '@/types'
import { scan } from '@/lib/score'

interface DropzoneProps {
  onScan: (result: ScanResult) => void
}

export default function Dropzone({ onScan }: DropzoneProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = scan(text)
        onScan(result)
      }
      
      reader.readAsText(file)
    }
  }, [onScan])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    >
      <input {...getInputProps()} />
      <p className="text-lg">
        {isDragActive 
          ? 'Drop your Jenkinsfile here...' 
          : 'Drag & drop a Jenkinsfile, or click to select'}
      </p>
    </div>
  )
}
