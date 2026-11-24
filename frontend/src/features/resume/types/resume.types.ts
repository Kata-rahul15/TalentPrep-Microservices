// ─── Core Resume DTOs ────────────────────────────────────────────────────────

export interface ResumeFile {
  id: string
  fileName: string
  fileSize: number // bytes
  fileType: string
  uploadedAt: string // ISO 8601
  status: 'processing' | 'ready' | 'failed'
  rawStatus?: string
  active?: boolean
  version?: number
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string | null // null = present
  description: string[]
  technologies: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  highlights: string[]
  repoUrl?: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startYear: number
  endYear: number | null
  gpa?: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
}

export interface ProjectResponse {
  name: string | null
  description: string | null
  technologies: string[] | null
  highlights: string[] | null
}

export interface ResumeDetails {
  resumeId: string

  resumeName: string
  originalFilename: string

  fileSize: number | null
  mimeType: string | null

  status: string
  version: number | null
  active: boolean | null

  createdAt: string
  updatedAt: string

  summary: string | null
  education: string | null
  experience: string | null
  projects: ProjectResponse[] | null
  skills: string | null
  certifications: string | null
  achievements: string | null
  languages: string | null
  contactInformation: string | null
}

// ─── Evaluation DTOs ─────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  atsScore: number
  keywordMatch: number
  formattingScore: number
  technicalSkillsScore: number
  experienceScore: number
  educationScore: number
  overallScore: number
}

export interface ResumeSuggestion {
  section: string
  priority: 'high' | 'medium' | 'low'
  message: string
}

export interface ResumeEvaluation {
  resumeId: string
  evaluatedAt: string
  scores: ScoreBreakdown
  strengths: string[]
  weaknesses: string[]
  suggestions: ResumeSuggestion[]
  missingKeywords: string[]
}

// ─── Job Match DTOs ──────────────────────────────────────────────────────────

export interface JobMatchInput {
  title?: string
  companyName?: string
  location?: string
  employmentType?: string
  workMode?: string
  experienceLevel?: string
  department?: string

  description?: string
  responsibilities?: string
  requiredQualifications?: string
  preferredQualifications?: string

  requiredSkills?: string[]
  preferredSkills?: string[]

  experienceRequired?: string
  educationRequirements?: string
  certifications?: string

  salary?: string
  benefits?: string

  additionalRequirements?: string
}
export interface JobMatchRequest {
  jobDescription: string
}

export interface SkillMatch {
  skill: string
  matched: boolean
}

export type JobMatchStatus =
  | 'QUEUED'
  | 'ANALYZING_JOB'
  | 'RETRIEVING_EVIDENCE'
  | 'EVALUATING_MATCH'
  | 'CALCULATING_SCORE'
  | 'COMPLETED'
  | 'FAILED'

export interface JobMatchStatusResponse {
  matchId: string
  resumeId: string
  jobDescriptionId: string
  status: JobMatchStatus

  overallMatch: number | null
  matchedSkills: string[]
  missingSkills: string[]
  missingKeywords: string[]
  recommendations: string[]
  summary?: string | null
  evidence?: unknown[]
  errorMessage?: string | null
}

export interface JobMatchResult {
  overallMatch: number
  matchedSkills: string[]
  missingSkills: string[]
  missingKeywords: string[]
  recommendations: string[]
}

// ─── Chat DTOs ───────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

export interface ChatRequest {
  question: string
}

export interface ChatResponse {
  answer: string
  sources?: ChatSource[]
  toolTrace?: string[]
}

export interface ChatSource {
  section: string
  chunkIndex: number
  score: number
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  sources?: ChatSource[]
  toolTrace?: string[]
}
// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface UploadResumeResponse {
  id: string
  userId?: string
  resumeName?: string
  originalFilename?: string
  fileSize?: number
  mimeType?: string
  status: string
  version?: number
  active?: boolean
  createdAt?: string
  updatedAt?: string
  // Legacy aliases if any code references them
  resumeId?: string
  fileName?: string
  uploadedAt?: string
}
