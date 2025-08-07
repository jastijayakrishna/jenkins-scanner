
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

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/x-groovy': ['.groovy'],
      'text/x-groovy': ['.groovy'],
      '': ['Jenkinsfile', 'jenkinsfile']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
    disabled: false,
    noClick: false,
    noKeyboard: false,
  });

  const handleBrowseClick = () => {
    console.log('Browse button clicked - triggering file input');
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`
        group relative mx-auto flex max-w-xl flex-col items-center
        justify-center rounded-3xl border-2 border-dashed p-12 text-center
        transition-all duration-300 cursor-pointer focus-within:outline-none
        ${isDragActive ? 'dropzone-active' : 'dropzone-idle'}
        ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}
      `}
      style={{
        transition: 'all var(--duration-medium) var(--easing-standard)'
      }}
      onFocus={() => console.log('Dropzone focused')}
      tabIndex={0}
      role="button"
      aria-label="Upload Jenkinsfile"
    >
      <input 
        {...getInputProps()} 
        aria-label="Jenkinsfile input" 
        ref={inputRef}
        className="sr-only focus:outline-none"
      />

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
      <div className="mb-6 rounded-full p-4 transition-all duration-300" 
           style={{
             background: 'var(--system-blue-light)',
             color: 'var(--accent-primary)'
           }}
           aria-hidden="true">
        {fileMeta ? (
          <FileText className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <UploadCloud className="h-10 w-10 animate-pulse-fast transition-transform duration-300 group-hover:scale-110" />
        )}
      </div>

      {/* instructions or file meta */}
      {fileMeta ? (
        <div className="space-y-2">
          <p className="text-lg font-medium" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 590,
            letterSpacing: '-0.022em',
            color: 'var(--text-primary)'
          }}>
            {fileMeta.name}
          </p>
          <p className="text-sm" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.022em',
            color: 'var(--text-secondary)',
            lineHeight: 1.47058823529
          }}>
            {(fileMeta.size / 1024).toFixed(1)} KB — drag a new file to replace
          </p>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 590,
            letterSpacing: '-0.022em',
            color: 'var(--text-primary)'
          }}>
            Drag & drop your&nbsp;<span style={{ color: 'var(--accent-primary)' }}>Jenkinsfile</span>
          </p>
          <p className="mt-3 text-sm" style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '-0.022em',
            color: 'var(--text-secondary)',
            lineHeight: 1.47058823529
          }}>
            …or&nbsp;click anywhere to browse (max 2 MB)
          </p>
          <button
            type="button"
            onClick={handleBrowseClick}
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
