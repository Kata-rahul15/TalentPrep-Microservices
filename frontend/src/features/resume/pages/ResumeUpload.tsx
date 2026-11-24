import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import FileUploader from '../components/FileUploader'
import { useResumeContext } from '../context/ResumeContext'
import { Button } from '../components/ResumeUI'

export default function ResumeUpload() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { startUpload, activeUpload } = useResumeContext()

  const isUploadingOrProcessing =
    activeUpload.status === 'uploading' || activeUpload.status === 'processing'

  const handleUpload = async () => {
    if (!selectedFile || isUploadingOrProcessing) return
    try {
      await startUpload(selectedFile)
    } catch {
      // Error handled by modal
    }
  }

  return (
    <div className="max-w-xl mx-auto py-2 space-y-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-black text-lg sm:text-xl text-foreground mb-0.5 leading-tight">
          Upload Resume
        </h1>
        <p className="text-xs text-muted-foreground leading-tight">
          Upload your PDF or DOCX resume. We'll parse, analyze, and evaluate it using AI.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
      >
        <FileUploader
          onFileSelect={setSelectedFile}
          isUploading={isUploadingOrProcessing}
          uploadProgress={activeUpload.uploadProgress}
        />

        {activeUpload.status === 'failed' && activeUpload.error && (
          <div className="p-2.5 bg-danger/5 border border-danger/20 rounded-lg text-xs text-danger">
            {activeUpload.error}
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploadingOrProcessing}
            loading={isUploadingOrProcessing}
            size="md"
            className="flex-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploadingOrProcessing ? 'Processing Resume...' : 'Upload Resume'}</span>
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/resume')}
            disabled={isUploadingOrProcessing}
          >
            Cancel
          </Button>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2"
      >
        <h3 className="font-semibold text-xs text-primary">Tips for a better ATS score</h3>
        <ul className="space-y-1 text-xs text-secondary-foreground">
          {[
            'Use a single-column layout — multi-column resumes confuse most ATS parsers.',
            'Avoid headers, footers, tables, and text boxes — use simple sections.',
            'Include full job title keywords matching the roles you\'re applying for.',
            'Keep file names clean: FirstName_LastName_Resume.pdf works best.',
            'Ensure your contact details (email, phone, LinkedIn) are at the top.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-[11px] leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
