import { motion } from 'framer-motion'
import {
  User,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  Code2,
  Mail,
  FileText,
  CheckCircle2,
  HardDrive,
  FileType,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useResume, useResumeDetails } from '../hooks/useResume'
import { useResumeContext } from '../context/ResumeContext'
import { PageError } from '../components/ResumeUI'
import { SkeletonResumeDetails } from '../components/ResumeSkeletons'
import ExpandableCard from '../components/ExpandableCard'
import SkillBadge from '../components/SkillBadge'

function parseSkills(skills: string | null): string[] {
  if (!skills) return []
  return skills
    .split(/[,|\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function ResumeDetails() {
  const { selectedResumeId } = useResumeContext()
  const { data: resumeFile } = useResume(selectedResumeId)
  const { data: resume, isLoading, isError, refetch } = useResumeDetails(selectedResumeId)

  if (resumeFile?.status === 'processing') {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="font-heading font-bold text-base sm:text-lg text-foreground">Processing Resume Content...</h2>
        <p className="text-xs text-muted-foreground">
          We are extracting and structuring content for your resume. Details will appear once analysis completes.
        </p>
      </div>
    )
  }

  if (isLoading) return <SkeletonResumeDetails />
  if (isError || !resume)
    return <PageError message="Could not load resume details." onRetry={refetch} />

  const filename = resume.resumeName || resume.originalFilename || 'Uploaded Resume'
  const parsedSkills = parseSkills(resume.skills)
  const isProjectsArray = Array.isArray(resume.projects)
  const projectsList = (isProjectsArray && resume.projects ? resume.projects : []) as import('../types/resume.types').ProjectResponse[]
  const hasProjectsList = projectsList.length > 0

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading font-black text-lg sm:text-xl text-foreground leading-tight">Resume Details</h1>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
          Extracted and structured content from your uploaded resume
        </p>
      </motion.div>

      {/* Metadata Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-start gap-3.5 shadow-2xs"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <FileText className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h2 className="font-heading font-bold text-base sm:text-lg text-foreground truncate max-w-md leading-tight">
              {filename}
            </h2>
            {resume.status && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {resume.status}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-primary/70" />
              {formatFileSize(resume.fileSize)}
            </span>
            <span className="flex items-center gap-1">
              <FileType className="w-3 h-3 text-primary/70" />
              {resume.mimeType || 'application/pdf'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-primary/70" />
              Uploaded {formatDate(resume.createdAt)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      {Boolean(resume.contactInformation?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <ExpandableCard title="Contact Information" icon={<Mail className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.contactInformation}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Professional Summary */}
      {Boolean(resume.summary?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <ExpandableCard title="Professional Summary" icon={<User className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.summary}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Technical Skills */}
      {parsedSkills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ExpandableCard
            title="Technical Skills"
            subtitle={`${parsedSkills.length} skills identified`}
            icon={<Code2 className="w-3.5 h-3.5" />}
            badge={<span className="text-[11px] font-semibold text-muted-foreground">{parsedSkills.length}</span>}
            defaultOpen
          >
            <div className="flex flex-wrap gap-1.5">
              {parsedSkills.map((skill, index) => (
                <SkillBadge key={`${skill}-${index}`} label={skill} variant="primary" />
              ))}
            </div>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Work Experience */}
      {Boolean(resume.experience?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <ExpandableCard title="Work Experience" icon={<Briefcase className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.experience}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Projects */}
      {(hasProjectsList || (typeof resume.projects === 'string' && Boolean(resume.projects))) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <ExpandableCard
            title="Projects"
            subtitle={hasProjectsList ? `${projectsList.length} projects` : undefined}
            icon={<FolderGit2 className="w-3.5 h-3.5" />}
            badge={
              hasProjectsList ? (
                <span className="text-[11px] font-semibold text-muted-foreground">{projectsList.length}</span>
              ) : undefined
            }
            defaultOpen
          >
            {hasProjectsList ? (
              <div className="space-y-3">
                {projectsList.map((project, idx) => (
                  <div key={idx} className="bg-secondary-bg/30 rounded-lg border border-border p-3">
                    {project.name && (
                      <h4 className="font-semibold text-xs sm:text-sm text-foreground mb-1">{project.name}</h4>
                    )}
                    {project.description && (
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed whitespace-pre-line">
                        {project.description}
                      </p>
                    )}
                    {project.highlights && project.highlights.length > 0 && (
                      <ul className="space-y-1 mb-2">
                        {project.highlights.map((highlight, i) => (
                          <li key={i} className="text-xs text-secondary-foreground flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-1.5 flex-shrink-0" />
                            <span className="leading-relaxed">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {project.technologies.map((tech, i) => (
                          <SkillBadge key={i} label={tech} size="sm" variant="primary" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
                {String(resume.projects)}
              </p>
            )}
          </ExpandableCard>
        </motion.div>
      )}

      {/* Education */}
      {Boolean(resume.education?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <ExpandableCard title="Education" icon={<GraduationCap className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.education}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Certifications */}
      {Boolean(resume.certifications?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <ExpandableCard title="Certifications" icon={<Award className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.certifications}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Achievements */}
      {Boolean(resume.achievements?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ExpandableCard title="Achievements" icon={<Award className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.achievements}
            </p>
          </ExpandableCard>
        </motion.div>
      )}

      {/* Languages */}
      {Boolean(resume.languages?.trim()) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <ExpandableCard title="Languages" icon={<User className="w-3.5 h-3.5" />} defaultOpen>
            <p className="text-xs sm:text-[13px] text-secondary-foreground leading-relaxed whitespace-pre-line">
              {resume.languages}
            </p>
          </ExpandableCard>
        </motion.div>
      )}
    </div>
  )
}
