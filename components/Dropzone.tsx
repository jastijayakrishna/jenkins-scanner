
import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText } from 'lucide-react';
import { scan, scoreVersion } from '@/lib/score';

/**
 * Dropzone component for uploading and scanning Jenkinsfiles.
 * @component
 * @param {DropzoneProps} props
 */

if (process.env.NODE_ENV !== 'production') {
  // Only log in development
  // eslint-disable-next-line no-console
  console.log('Dropzone bundle uses', scoreVersion);
}



interface DropzoneProps {
  /** Callback when a file is scanned */
  onScan: (result: ReturnType<typeof scan>, jenkinsContent: string) => void;
}

export default function Dropzone({ onScan }: DropzoneProps) {
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setError(null);
      
      if (rejected.length > 0) {
        const rejection = rejected[0];
        if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
          setError('File size exceeds 2MB limit.');
        } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
          setError('Please upload a text file (Jenkinsfile, .txt, .groovy).');
        } else {
          setError('File rejected. Please try a different file.');
        }
        return;
      }

      const file = accepted[0];
      if (!file) {
        setError('No file selected.');
        return;
      }
      
      setFileMeta({ name: file.name, size: file.size });

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          const result = scan(text);
          onScan(result, text);
        } catch (err) {
          setError('Failed to scan file. Please ensure it\'s a valid text file.');
        }
      };
      reader.onerror = () => {
        setError('Error reading file.');
      };
      reader.readAsText(file);
    },
    [onScan],
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } = useDropzone({
    onDrop,
    // Accept common text file types - allow all files for flexibility
    accept: undefined,
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
    disabled: false,
    noClick: false,
    noKeyboard: false,
    onDragEnter: () => console.log('Drag enter'),
    onDragLeave: () => console.log('Drag leave'),
    onDragOver: () => console.log('Drag over'),
    onDropAccepted: (files) => console.log('Files accepted:', files.length),
    onDropRejected: (rejections) => console.log('Files rejected:', rejections.length),
  });

  return (
    <div
      {...getRootProps({
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Upload Jenkinsfile',
        onClick: (e: React.MouseEvent) => {
          // Ensure click opens file dialog
          e.preventDefault();
          e.stopPropagation();
          console.log('Dropzone clicked - opening file dialog');
          open();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        },
      })}
      className={`
        group relative mx-auto flex max-w-xl flex-col items-center
        justify-center rounded-3xl border-2 border-dashed p-12 text-center
        transition-all duration-300 cursor-pointer
        ${isDragActive ? 'dropzone-active border-blue-500 bg-blue-50' : 'dropzone-idle border-gray-300 hover:border-gray-400 bg-white/50'}
        ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
      `}
      aria-disabled={false}
    >
      <input {...getInputProps()} aria-label="Jenkinsfile input" ref={inputRef} />

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
      <div className="mb-6 rounded-full bg-brand-500/20 p-4 text-brand-600" aria-hidden="true">
        {fileMeta ? (
          <FileText className="h-10 w-10" />
        ) : (
          <UploadCloud className="h-10 w-10 animate-pulse-fast" />
        )}
      </div>

      {/* instructions or file meta */}
      {fileMeta ? (
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-900">
            {fileMeta.name}
          </p>
          <p className="text-sm text-gray-600">
            {(fileMeta.size / 1024).toFixed(1)} KB — drag a new file to replace
          </p>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium text-gray-900">
            Drag & drop your&nbsp;<span className="text-brand-600">Jenkinsfile</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            …or&nbsp;click anywhere to browse (max 2 MB)
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Browse button clicked');
              open();
            }}
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg 
                     text-sm font-medium transition-colors focus:outline-none focus:ring-2 
                     focus:ring-brand-500 focus:ring-offset-2"
          >
            Browse Files
          </button>
        </>
      )}
      {error && (
        <div className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
