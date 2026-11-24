import { api } from '@/services/authService'

import type {
  ResumeFile,
  JobMatchInput,
  ResumeDetails,
  ResumeEvaluation,
  JobMatchStatusResponse,
  ChatMessage,
  UploadResumeResponse,
} from '../types/resume.types'

/**
 * Convert backend resume status into the frontend status model.
 */
function normalizeResumeStatus(
  rawStatus: unknown
): 'ready' | 'processing' | 'failed' {
  const status = String(rawStatus || '').toUpperCase().trim()

  if (
    [
      'FAILED',
      'ERROR',
      'FAILED_PARSING',
      'FAILED_ANALYSIS',
      'INVALID',
    ].includes(status)
  ) {
    return 'failed'
  }

  if (
    [
      'READY',
      'COMPLETED',
      'SUCCESS',
    ].includes(status)
  ) {
    return 'ready'
  }

  if (
    [
      'UPLOADING',
      'PROCESSING',
      'IN_PROGRESS',
      'PENDING',
    ].includes(status)
  ) {
    return 'processing'
  }

  // Never treat unknown or missing status as ready
  return status ? 'processing' : 'failed'
}


/**
 * Convert the backend resume metadata response into the
 * frontend ResumeFile structure.
 */
function normalizeResumeRecord(raw: any): ResumeFile {
  const canonicalId = raw?.id || raw?.resumeId || ''
  return {
    id: canonicalId,

    fileName:
      raw?.resumeName ||
      raw?.fileName ||
      raw?.originalFilename ||
      'Resume.pdf',

    fileSize:
      raw?.fileSize ??
      raw?.size ??
      0,

    fileType:
      raw?.fileType ||
      raw?.mimeType ||
      (
        raw?.resumeName?.toLowerCase().endsWith('.docx')
          ? 'DOCX'
          : 'PDF'
      ),

    uploadedAt:
      raw?.createdAt ||
      raw?.uploadedAt ||
      new Date().toISOString(),

    status: normalizeResumeStatus(raw?.status),
    rawStatus: String(raw?.status || ''),
    active: Boolean(raw?.active),
    version: raw?.version,
  }
}


export const resumeApi = {

  // ═══════════════════════════════════════════════════════════
  // RESUME METADATA LIST & SINGLE
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/resumes/me
   * Retrieve all uploaded resume records for the current user.
   */
  getResumesList: async (): Promise<ResumeFile[]> => {
    try {
      const response = await api.get('/api/resumes/me')
      const data = response.data
      if (!data) return []
      if (Array.isArray(data)) {
        return data.map(normalizeResumeRecord)
      }
      return [normalizeResumeRecord(data)]
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 204) {
        return []
      }
      console.error('[Resume] Error fetching resumes list', error)
      throw error
    }
  },

  /**
   * GET /api/resumes/me or GET /api/resumes/{resumeId}
   */
  getResume: async (resumeId?: string): Promise<ResumeFile | null> => {
    if (resumeId) {
      try {
        return await resumeApi.getResumeById(resumeId)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.warn('[Resume] Specified resumeId not found, falling back to /me:', resumeId)
        } else {
          throw err
        }
      }
    }

    console.log(
      '[Resume] Checking whether user has a resume'
    )

    try {

      const response =
        await api.get('/api/resumes/me')

      const data =
        response.data

      if (
        !data ||
        (
          Array.isArray(data) &&
          data.length === 0
        ) ||
        (
          typeof data === 'object' &&
          !Array.isArray(data) &&
          Object.keys(data).length === 0
        )
      ) {

        console.log(
          '[Resume] No resume found'
        )

        return null
      }


      /*
       * Backend currently returns a list from /me.
       *
       * We select the newest resume.
       */
      let item: any = null

      if (Array.isArray(data)) {

        const sorted =
          [...data].sort((a, b) => {

            const timeA =
              new Date(
                a?.createdAt ||
                a?.uploadedAt ||
                0
              ).getTime()

            const timeB =
              new Date(
                b?.createdAt ||
                b?.uploadedAt ||
                0
              ).getTime()

            return timeB - timeA
          })

        item = sorted[0]

      } else {

        item = data
      }


      if (!item) {
        return null
      }


      const normalized =
        normalizeResumeRecord(item)

      console.log(
        '[Resume] Resume found:',
        normalized
      )

      return normalized

    } catch (error: any) {

      const status =
        error?.response?.status

      if (
        status === 404 ||
        status === 204
      ) {

        console.log(
          '[Resume] No resume found'
        )

        return null
      }

      console.error(
        '[Resume] Error fetching resume metadata',
        error
      )

      throw error
    }
  },


  // ═══════════════════════════════════════════════════════════
  // RESUME UPLOAD
  // ═══════════════════════════════════════════════════════════

  /**
   * POST /api/resumes/upload
   *
   * IMPORTANT:
   *
   * This is now the main AI ingestion operation.
   *
   * Backend:
   *
   * File
   *   ↓
   * Tika
   *   ↓
   * text cleaning
   *   ↓
   * ONE ChatClient call
   *   ↓
   * complete structured resume analysis
   *   ↓
   * PostgreSQL
   *   ↓
   * embeddings → PGVector
   */
  uploadResume: async (
    file: File,
    resumeName?: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadResumeResponse> => {
    try {
      const formData = new FormData()
      formData.append('resumeName', resumeName || file.name)
      formData.append('file', file)

      const response = await api.post(
        '/api/resumes/upload',
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              onProgress(percentCompleted)
            }
          },
        }
      )

      console.log('[Resume] Upload successful:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[Resume] Error uploading resume:', error)
      throw error
    }
  },


  // ═══════════════════════════════════════════════════════════
  // RESUME DETAILS
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/resumes/{resumeId}/details
   */
  getResumeDetails: async (
    resumeId?: string
  ): Promise<ResumeDetails> => {
    try {
      const url = resumeId
        ? `/api/resumes/${resumeId}/details`
        : '/api/resumes/details'

      const response = await api.get(url)
      console.log('[Resume] Resume details loaded from backend')
      return response.data
    } catch (error: any) {
      console.error('[Resume] Error fetching resume details', error)
      throw error
    }
  },


  // ═══════════════════════════════════════════════════════════
  // RESUME OVERVIEW
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/resumes/{resumeId}/overview
   */
  getResumeOverview: async (
    resumeId?: string
  ): Promise<any> => {
    try {
      const url = resumeId
        ? `/api/resumes/${resumeId}/overview`
        : '/api/resumes/overview'

      const response = await api.get(url)
      console.log('[Resume] Overview loaded from backend')
      return response.data
    } catch (error: any) {
      console.error('[Resume] Error fetching resume overview', error)
      throw error
    }
  },


  // ═══════════════════════════════════════════════════════════
  // ATS ANALYSIS
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/resumes/{resumeId}/ats-analysis
   */
  getAtsAnalysis: async (
    resumeId?: string
  ): Promise<ResumeEvaluation> => {
    try {
      const url = resumeId
        ? `/api/resumes/${resumeId}/ats-analysis`
        : '/api/resumes/ats-analysis'

      const response = await api.get(url)
      console.log('[Resume] ATS evaluation loaded from backend')
      return response.data
    } catch (error: any) {
      console.error('[Resume] Error fetching ATS evaluation', error)
      throw error
    }
  },


  /**
   * Backward-compatible alias.
   *
   * Existing React components may still call:
   *
   * resumeApi.evaluateResume()
   *
   * We keep the method so you don't have to immediately
   * change every component.
   *
   * IMPORTANT:
   * This no longer "evaluates" anything.
   * It simply retrieves the already-generated evaluation.
   */
  evaluateResume: async (
    resumeId?: string
  ): Promise<ResumeEvaluation> => {

    return resumeApi.getAtsAnalysis(
      resumeId
    )
  },


  // ═══════════════════════════════════════════════════════════
  // JOB MATCHING
  // ═══════════════════════════════════════════════════════════

  /**
   * POST /api/resumes/job-match
   *
   * This DOES use AI.
   *
   * Reason:
   *
   * The job description changes every time.
   *
   * Resume
   *   +
   * Job Description
   *   ↓
   * AI matching
   *   ↓
   * Match result
   *//**
* Job matching flow
*
* Step 1:
* Create and persist the job description.
*
* POST /api/job-descriptions
*
* Step 2:
* Match the user's resume against the saved job description.
*
* POST /api/resumes/{resumeId}/match
*
* Authentication:
* - Frontend sends no user ID.
* - API Gateway authenticates the request.
* - API Gateway forwards the authenticated user details.
* - Resume Service validates resume ownership.
*/
  /**
   * Job matching flow
   *
   * Step 1:
   * Create and persist the job description.
   *
   * Step 2:
   * Match the selected resume against the saved job description.
   *
   * Important:
   * - resumeId comes from the currently loaded resume.
   * - Frontend does NOT send userId.
   * - API Gateway handles authentication.
   * - Missing optional JD fields are allowed.
   */
  // matchJob: async (
  //   input: JobMatchInput,
  //   resumeId: string
  // ): Promise<JobMatchResult> => {
  //   try {
  //     // ─────────────────────────────────────────────────────────────
  //     // Validate resume
  //     // ─────────────────────────────────────────────────────────────

  //     if (!resumeId?.trim()) {
  //       throw new Error('Resume ID is required for job matching.')
  //     }

  //     // ─────────────────────────────────────────────────────────────
  //     // Build a clean job description
  //     //
  //     // Only fields that actually contain information are included.
  //     // ─────────────────────────────────────────────────────────────

  //     const sections: string[] = []

  //     const addSection = (
  //       label: string,
  //       value?: string | string[]
  //     ) => {
  //       if (Array.isArray(value)) {
  //         const items = value
  //           .map((item) => item?.trim())
  //           .filter(Boolean)

  //         if (items.length > 0) {
  //           sections.push(`${label}:\n${items.join('\n')}`)
  //         }

  //         return
  //       }

  //       if (typeof value === 'string' && value.trim()) {
  //         sections.push(`${label}:\n${value.trim()}`)
  //       }
  //     }

  //     addSection('Job Title', input.title)
  //     addSection('Company', input.companyName)
  //     addSection('Location', input.location)
  //     addSection('Employment Type', input.employmentType)
  //     addSection('Work Mode', input.workMode)
  //     addSection('Experience Level', input.experienceLevel)
  //     addSection('Department', input.department)

  //     addSection('Job Description', input.description)
  //     addSection('Responsibilities', input.responsibilities)
  //     addSection(
  //       'Required Qualifications',
  //       input.requiredQualifications
  //     )
  //     addSection(
  //       'Preferred Qualifications',
  //       input.preferredQualifications
  //     )

  //     addSection('Required Skills', input.requiredSkills)
  //     addSection('Preferred Skills', input.preferredSkills)

  //     addSection(
  //       'Experience Required',
  //       input.experienceRequired
  //     )
  //     addSection(
  //       'Education Requirements',
  //       input.educationRequirements
  //     )
  //     addSection('Certifications', input.certifications)

  //     addSection('Salary', input.salary)
  //     addSection('Benefits', input.benefits)

  //     addSection(
  //       'Additional Requirements',
  //       input.additionalRequirements
  //     )

  //     const normalizedJobDescription = sections.join('\n\n')

  //     // ─────────────────────────────────────────────────────────────
  //     // Validate JD
  //     //
  //     // We allow missing individual fields.
  //     // But completely empty input should not be submitted.
  //     // ─────────────────────────────────────────────────────────────

  //     if (!normalizedJobDescription.trim()) {
  //       throw new Error(
  //         'Please provide at least some job information before matching.'
  //       )
  //     }

  //     // ─────────────────────────────────────────────────────────────
  //     // STEP 1
  //     // Create and persist the job description
  //     // ─────────────────────────────────────────────────────────────

  //     console.log('[Job Match] Creating job description')

  //     const jobDescriptionResponse = await api.post(
  //       '/api/job-descriptions',
  //       {
  //         // These are optional.
  //         title: input.title?.trim() || null,
  //         companyName: input.companyName?.trim() || null,

  //         // Complete normalized JD.
  //         description: normalizedJobDescription,
  //       }
  //     )

  //     const jobDescriptionId =
  //       jobDescriptionResponse.data?.id ||
  //       jobDescriptionResponse.data?.jobDescriptionId

  //     if (!jobDescriptionId) {
  //       console.error(
  //         '[Job Match] Job description was created but no ID was returned',
  //         jobDescriptionResponse.data
  //       )

  //       throw new Error(
  //         'Job description was created but the server did not return an ID.'
  //       )
  //     }

  //     console.log(
  //       '[Job Match] Job description created:',
  //       jobDescriptionId
  //     )

  //     // ─────────────────────────────────────────────────────────────
  //     // STEP 2
  //     // Match resume against the saved job description
  //     // ─────────────────────────────────────────────────────────────

  //     console.log('[Job Match] Starting resume-job matching:', {
  //       resumeId,
  //       jobDescriptionId,
  //     })

  //     const matchResponse = await api.post(
  //       `/api/resumes/${resumeId}/match`,
  //       {
  //         jobDescriptionId,
  //       }
  //     )

  //     console.log('[Job Match] Matching completed')

  //     return matchResponse.data
  //   } catch (error: any) {
  //     console.error('[Job Match] Job matching failed', error)

  //     throw error
  //   }
  // },
  matchJob: async (
    input: JobMatchInput,
    resumeId: string
  ): Promise<JobMatchStatusResponse> => {
    try {
      if (!resumeId?.trim()) {
        throw new Error('Resume ID is required for job matching.')
      }

      const sections: string[] = []

      const addSection = (
        label: string,
        value?: string | string[]
      ) => {
        if (Array.isArray(value)) {
          const items = value
            .map((item) => item?.trim())
            .filter(Boolean)

          if (items.length > 0) {
            sections.push(`${label}:\n${items.join('\n')}`)
          }

          return
        }

        if (typeof value === 'string' && value.trim()) {
          sections.push(`${label}:\n${value.trim()}`)
        }
      }

      addSection('Job Title', input.title)
      addSection('Company', input.companyName)
      addSection('Location', input.location)
      addSection('Employment Type', input.employmentType)
      addSection('Work Mode', input.workMode)
      addSection('Experience Level', input.experienceLevel)
      addSection('Department', input.department)

      addSection('Job Description', input.description)
      addSection('Responsibilities', input.responsibilities)

      addSection(
        'Required Qualifications',
        input.requiredQualifications
      )

      addSection(
        'Preferred Qualifications',
        input.preferredQualifications
      )

      addSection(
        'Required Skills',
        input.requiredSkills
      )

      addSection(
        'Preferred Skills',
        input.preferredSkills
      )

      addSection(
        'Experience Required',
        input.experienceRequired
      )

      addSection(
        'Education Requirements',
        input.educationRequirements
      )

      addSection(
        'Certifications',
        input.certifications
      )

      addSection('Salary', input.salary)
      addSection('Benefits', input.benefits)

      addSection(
        'Additional Requirements',
        input.additionalRequirements
      )

      const normalizedJobDescription =
        sections.join('\n\n')

      if (!normalizedJobDescription.trim()) {
        throw new Error(
          'Please provide at least some job information before matching.'
        )
      }

      // ---------------------------------------------------------
      // STEP 1
      // Create and persist job description
      // ---------------------------------------------------------

      console.log(
        '[Job Match] Creating job description'
      )

      const jobDescriptionResponse =
        await api.post(
          '/api/job-descriptions',
          {
            title:
              input.title?.trim() || null,

            companyName:
              input.companyName?.trim() || null,

            description:
              normalizedJobDescription,
          }
        )

      const jobDescriptionId =
        jobDescriptionResponse.data?.id ||
        jobDescriptionResponse.data?.jobDescriptionId

      if (!jobDescriptionId) {
        throw new Error(
          'Job description was created but the server did not return an ID.'
        )
      }

      console.log(
        '[Job Match] Job description created:',
        jobDescriptionId
      )

      // ---------------------------------------------------------
      // STEP 2
      // START async matching
      // ---------------------------------------------------------

      console.log(
        '[Job Match] Starting async matching:',
        {
          resumeId,
          jobDescriptionId,
        }
      )

      const matchResponse =
        await api.post(
          `/api/resumes/${resumeId}/match`,
          {
            jobDescriptionId,
          }
        )

      console.log(
        '[Job Match] Async matching started:',
        matchResponse.data
      )

      return matchResponse.data

    } catch (error: any) {
      console.error(
        '[Job Match] Job matching failed',
        error
      )

      throw error
    }
  },

  getJobMatchStatus: async (
    resumeId: string,
    matchId: string
  ): Promise<JobMatchStatusResponse> => {
    if (!resumeId?.trim()) {
      throw new Error(
        'Resume ID is required.'
      )
    }

    if (!matchId?.trim()) {
      throw new Error(
        'Match ID is required.'
      )
    }

    const response =
      await api.get(
        `/api/resumes/${resumeId}/match/${matchId}`
      )

    return response.data
  },
  // ═══════════════════════════════════════════════════════════
  // RAG CHAT
  // ═══════════════════════════════════════════════════════════
  chat: async (
    resumeId: string,
    question: string,
    conversationId?: string
  ): Promise<ChatMessage & { conversationId?: string }> => {
    if (!resumeId?.trim()) throw new Error('A resume is required for the AI agent.')
    if (!question?.trim()) throw new Error('Chat message cannot be empty.')

    const response = await api.post(
      `/api/resumes/${resumeId}/agent/chat`,
      { message: question.trim(), conversationId }
    )

    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.data?.reply || 'I could not produce a response.',
      timestamp: new Date().toISOString(),
      toolTrace: response.data?.toolTrace || [],
      conversationId: response.data?.conversationId,
    }
  },
  // ═══════════════════════════════════════════════════════════
  // GET SINGLE RESUME
  // ═══════════════════════════════════════════════════════════

  /**
   * GET /api/resumes/{resumeId}
   *
   * Returns resume metadata.
   *
   * NO AI CALL.
   */
  getResumeById: async (
    resumeId: string
  ): Promise<ResumeFile> => {
    const response = await api.get(`/api/resumes/${resumeId}`)
    const rawData = response.data?.data || response.data?.result || response.data
    return normalizeResumeRecord(rawData)
  },


  // ═══════════════════════════════════════════════════════════
  // UPDATE RESUME
  // ═══════════════════════════════════════════════════════════

  /**
   * PATCH /api/resumes/{resumeId}
   *
   * Updates stored resume data.
   *
   * IMPORTANT:
   *
   * If this endpoint modifies data that is also cached later,
   * the backend should invalidate/update its cache.
   */
  updateResume: async (
    resumeId: string,
    data: Partial<ResumeDetails>
  ): Promise<ResumeDetails> => {

    const response =
      await api.patch(
        `/api/resumes/${resumeId}`,
        data
      )

    return response.data
  },


  // ═══════════════════════════════════════════════════════════
  // RESUME BUILDER
  // ═══════════════════════════════════════════════════════════
  getBuilder: async (resumeId: string): Promise<any> => {
    const response = await api.get(`/api/resumes/${resumeId}/builder`)
    return response.data?.content ?? response.data
  },

  createBuilder: async (content?: any): Promise<{ resumeId: string; content: any }> => {
    const response = await api.post('/api/resumes/builder', content || {})
    return response.data
  },

  saveBuilder: async (resumeId: string, content: any): Promise<any> => {
    const response = await api.put(`/api/resumes/${resumeId}/builder`, content)
    return response.data?.content ?? response.data
  },

  searchJobs: async (
    params: { q?: string; location?: string; days?: number; limit?: number },
    signal?: AbortSignal
  ) => {
    const response = await api.get('/api/resumes/jobs/search', {
      params,
      signal,
    })
    return response.data
  },
  findJobsForMe: async (params?: {
    location?: string
    days?: number
    limit?: number
  }) => {
    const response = await api.get('/api/resumes/jobs/for-me', {
      params,
    })
    return response.data
  },
  getJobDetails: async (jobId: string) => {
    const response = await api.get(`/api/resumes/jobs/${encodeURIComponent(jobId)}`)
    return response.data
  },

  // ═══════════════════════════════════════════════════════════
  // DELETE RESUME
  // ═══════════════════════════════════════════════════════════

  /**
   * DELETE /api/resumes/{resumeId}
   *
   * Deletes the resume.
   *
   * Backend should also delete/invalidate:
   *
   * - resume sections
   * - evaluation
   * - vectors
   * - cached data
   */
  deleteResume: async (
    resumeId: string
  ): Promise<void> => {

    await api.delete(
      `/api/resumes/${resumeId}`
    )
  },
}