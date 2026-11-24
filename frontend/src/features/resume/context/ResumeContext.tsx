import React, { createContext, useContext, useState, useCallback } from 'react'
import { resumeApi } from '../api/resumeApi'
import type { UploadResumeResponse } from '../types/resume.types'

const STORAGE_KEY = 'talentprep_selected_resume_id'

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'extracting'
  | 'analyzing'
  | 'preparing'
  | 'ready'
  | 'failed'

export interface ActiveUploadState {
  file: File | null
  resumeId: string | null
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'failed'
  uploadProgress: number
  stage: ProcessingStage
  error: string | null
}

interface ResumeContextType {
  selectedResumeId: string | null
  setSelectedResumeId: (id: string | null) => void
  activeUpload: ActiveUploadState
  startUpload: (file: File) => Promise<string | null>
  resetUpload: () => void
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  updateUploadState: (partial: Partial<ActiveUploadState>) => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [selectedResumeId, setSelectedResumeIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY)
  })

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [activeUpload, setActiveUpload] = useState<ActiveUploadState>({
    file: null,
    resumeId: null,
    status: 'idle',
    uploadProgress: 0,
    stage: 'idle',
    error: null,
  })

  const setSelectedResumeId = useCallback((id: string | null) => {
    setSelectedResumeIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const updateUploadState = useCallback((partial: Partial<ActiveUploadState>) => {
    setActiveUpload((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetUpload = useCallback(() => {
    setActiveUpload({
      file: null,
      resumeId: null,
      status: 'idle',
      uploadProgress: 0,
      stage: 'idle',
      error: null,
    })
    setIsModalOpen(false)
  }, [])

  const startUpload = useCallback(async (file: File): Promise<string | null> => {
    setActiveUpload({
      file,
      resumeId: null,
      status: 'uploading',
      uploadProgress: 0,
      stage: 'uploading',
      error: null,
    })
    setIsModalOpen(true)

    try {
      const response: UploadResumeResponse = await resumeApi.uploadResume(
        file,
        file.name,
        (progress) => {
          setActiveUpload((prev) => ({
            ...prev,
            uploadProgress: progress,
          }))
        }
      )

      // Exact backend canonical ID returned as id
      const canonicalId = response.id || (response as any).data?.id || response.resumeId

      if (!canonicalId) {
        throw new Error('Upload succeeded, but no resume ID was returned by the server.')
      }

      console.log('[ResumeContext] Canonical upload ID:', canonicalId)

      // Save canonical ID immediately
      setSelectedResumeId(canonicalId)

      setActiveUpload({
        file,
        resumeId: canonicalId,
        status: 'processing',
        uploadProgress: 100,
        stage: 'uploaded',
        error: null,
      })

      return canonicalId
    } catch (err: any) {
      console.error('[ResumeContext] Upload failed:', err)
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload resume. Please check your network and try again.'

      setActiveUpload((prev) => ({
        ...prev,
        status: 'failed',
        stage: 'failed',
        error: errorMsg,
      }))

      return null
    }
  }, [setSelectedResumeId])

  return (
    <ResumeContext.Provider
      value={{
        selectedResumeId,
        setSelectedResumeId,
        activeUpload,
        startUpload,
        resetUpload,
        isModalOpen,
        setIsModalOpen,
        updateUploadState,
      }}
    >
      {children}
    </ResumeContext.Provider>
  )
}

export function useResumeContext() {
  const context = useContext(ResumeContext)
  if (!context) {
    throw new Error('useResumeContext must be used within a ResumeProvider')
  }
  return context
}
