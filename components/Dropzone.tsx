import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText } from 'lucide-react'
import { scan, scoreVersion } from '@/lib/score'

console.log('Dropzone bundle uses', scoreVersion)

interface DropzoneProps {
  onScan: (result: ReturnType<typeof scan>, jenkinsContent: string) => void
}

export default function Dropzone({ onScan }: DropzoneProps) {
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      setFileMeta({ name: file.name, size: file.size })

      const reader = new FileReader()
      reader.onload = e => {
        const text = e.target?.result as string
        const result = scan(text)
        onScan(result, text)
      }
      reader.readAsText(file)
    },
    [onScan],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.jenkinsfile', '.txt'],
      'application/x-groovy': ['.groovy'],
    },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        group relative mx-auto flex max-w-xl flex-col items-center
        justify-center rounded-3xl border-2 border-dashed p-12 text-center
        transition-all duration-300
        ${isDragActive
          ? 'dropzone-active'
          : 'dropzone-idle'}
      `}
    >
      <input {...getInputProps()} />

      {/* animated gradient halo (hidden until drag-over) */}
      <div
        className={`
          pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-0
          blur-2xl transition-opacity duration-300
          group-hover:opacity-70
          ${isDragActive ? 'animate-fade-in-slow opacity-90' : ''}
          before:absolute before:inset-0 before:rounded-3xl
          before:bg-gradient-to-r before:from-brand-400 before:to-brand-600
        `}
      />

      {/* icon */}
      <div className="mb-6 rounded-full bg-brand-500/20 p-4 text-brand-400">
        {fileMeta ? (
          <FileText className="h-10 w-10" />
        ) : (
          <UploadCloud className="h-10 w-10 animate-pulse-fast" />
        )}
      </div>

      {/* instructions or file meta */}
      {fileMeta ? (
        <div className="space-y-1">
          <p className="text-lg font-medium text-white">
            {fileMeta.name}
          </p>
          <p className="text-sm text-gray-300">
            {(fileMeta.size / 1024).toFixed(1)} KB — drag a new file to replace
          </p>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium text-white">
            Drag & drop your&nbsp;<span className="text-brand-400">Jenkinsfile</span>
          </p>
          <p className="mt-1 text-sm text-gray-300">
            …or&nbsp;click to browse (max 2 MB)
          </p>
        </>
      )}
    </div>
  )
}
