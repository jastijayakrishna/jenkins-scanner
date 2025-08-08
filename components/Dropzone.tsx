
import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { scan, scoreVersion } from '@/lib/score';
import { cn } from '@/components/ui/utils';

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
    <Card
      {...getRootProps()}
      className={cn(
        "group relative mx-auto flex max-w-xl flex-col items-center",
        "justify-center border-2 border-dashed p-12 text-center",
        "transition-all duration-300 cursor-pointer focus-within:outline-none",
        "hover:bg-accent/5 hover:border-accent",
        isDragActive && "border-primary bg-primary/5",
        isDragAccept && "border-green-500 bg-green-50/10",
        isDragReject && "border-destructive bg-destructive/5"
      )}
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

      {/* Animated gradient effect */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-lg opacity-0",
          "blur-2xl transition-opacity duration-300",
          "group-hover:opacity-20",
          isDragActive && "opacity-30",
          "bg-gradient-to-r from-primary/20 to-accent/20"
        )}
      />

      {/* Icon */}
      <div className="mb-6 rounded-full bg-primary/10 p-4 text-primary transition-all duration-300 group-hover:scale-105" 
           aria-hidden="true">
        {fileMeta ? (
          <FileText className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <UploadCloud className="h-10 w-10 animate-pulse-fast transition-transform duration-300 group-hover:scale-110" />
        )}
      </div>

      {/* Content */}
      {fileMeta ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {fileMeta.name}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">
              {(fileMeta.size / 1024).toFixed(1)} KB
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Drag a new file to replace
          </p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground">
            Drag & drop your <span className="text-primary">Jenkinsfile</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            …or click anywhere to browse (max 2 MB)
          </p>
          <Button onClick={handleBrowseClick} className="mt-4" variant="default">
            Browse Files
          </Button>
        </>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
