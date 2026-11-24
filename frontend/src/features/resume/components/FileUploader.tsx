import { useCallback, useState } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function FileUploader({ onFileSelect, isUploading, uploadProgress = 0, className }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF or DOCX file.'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large. Maximum size is 10MB (your file: ${formatSize(file.size)}).`
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setFileError(error)
      setSelectedFile(null)
      return
    }
    setFileError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // reset for re-select
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-6 sm:p-7 flex flex-col items-center gap-3.5 transition-all cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border bg-card hover:border-primary/50 hover:bg-secondary-bg/30'
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
              isDragOver ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
            )}
          >
            <Upload className="w-5.5 h-5.5" />
          </div>

          <div className="text-center">
            <p className="font-heading font-bold text-foreground text-sm sm:text-base mb-0.5">
              {isDragOver ? 'Drop your resume here' : 'Drop your resume here'}
            </p>
            <p className="text-muted-foreground text-xs mb-3">or click below to browse your files</p>

            <label
              htmlFor="resume-upload-input"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs h-8"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Browse Files</span>
              <input
                id="resume-upload-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={handleInputChange}
                className="sr-only"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              PDF, DOCX
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Max 10 MB</span>
          </div>

          {fileError && (
            <div className="flex items-center gap-2 p-2.5 bg-danger/5 border border-danger/20 rounded-lg w-full">
              <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
              <p className="text-xs text-danger">{fileError}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-card p-4">
          {/* File info row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-foreground truncate leading-tight">{selectedFile.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{formatSize(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <button
                onClick={clearFile}
                className="p-1 rounded-lg hover:bg-secondary-bg text-muted-foreground hover:text-danger transition-colors cursor-pointer"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isUploading && uploadProgress >= 100 && (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{uploadProgress >= 100 ? 'Upload complete!' : 'Uploading...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-secondary-bg rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    uploadProgress >= 100 ? 'bg-success' : 'bg-primary'
                  )}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
