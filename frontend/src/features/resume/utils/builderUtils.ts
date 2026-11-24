import type { ResumeDetails, ProjectResponse } from '../types/resume.types'
import type {
  ResumeBuilderData,
  WorkExperienceItem,
  EducationItem,
  ProjectItem,
  CertificationItem,
  AchievementItem,
  CustomSectionItem,
} from '../types/builder.types'
import { DEFAULT_EMPTY_RESUME } from '../types/builder.types'
import { distributeSkills } from './skillTaxonomy'

export function generateId(prefix = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
}

/**
 * Checks if a builder object contains actual user-filled content.
 */
export function hasBuilderContent(data: any): boolean {
  if (!data || typeof data !== 'object') return false

  const hasPersonal = Boolean(
    data.personalInfo?.fullName?.trim() ||
    data.personalInfo?.email?.trim() ||
    data.personalInfo?.phone?.trim()
  )
  const hasSummary = Boolean(data.summary?.trim())
  const hasExp = Array.isArray(data.experience) && data.experience.length > 0 &&
    data.experience.some((e: any) => e.company?.trim() || e.role?.trim() || (e.highlights && e.highlights.length > 0))
  const hasEdu = Array.isArray(data.education) && data.education.length > 0 &&
    data.education.some((e: any) => e.institution?.trim() || e.degree?.trim())
  const hasSkills = Array.isArray(data.skills) && data.skills.length > 0 &&
    data.skills.some((c: any) => Array.isArray(c.skills) && c.skills.length > 0)
  const hasProj = Array.isArray(data.projects) && data.projects.length > 0 &&
    data.projects.some((p: any) => p.name?.trim() || p.description?.trim())
  const hasCerts = Array.isArray(data.certifications) && data.certifications.length > 0 &&
    data.certifications.some((c: any) => c.name?.trim())
  const hasAch = Array.isArray(data.achievements) && data.achievements.length > 0 &&
    data.achievements.some((a: any) => a.title?.trim())

  return Boolean(hasPersonal || hasSummary || hasExp || hasEdu || hasSkills || hasProj || hasCerts || hasAch)
}

/**
 * Parses raw text and structured data from backend ResumeDetails into editable builder data.
 */
export function convertResumeDetailsToBuilderData(
  details: ResumeDetails,
  fallbackName = 'My Uploaded Resume'
): ResumeBuilderData {
  const result: ResumeBuilderData = JSON.parse(JSON.stringify(DEFAULT_EMPTY_RESUME))
  const canonicalId = details.resumeId || (details as any).id || generateId('builder')

  result.id = canonicalId
  result.title = details.resumeName || details.originalFilename || fallbackName
  result.lastModified = details.updatedAt || details.createdAt || new Date().toISOString()

  // ── 1. Personal Information Parsing ─────────────────────────
  if (details.contactInformation) {
    const rawContact = details.contactInformation

    // Extract Email
    const emailMatch = rawContact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) {
      result.personalInfo.email = emailMatch[0].trim()
    }

    // Extract Phone
    const phoneMatch = rawContact.match(/(?:(?:Phone|Mobile|Tel|Cell):\s*)?(\+?\d{1,4}[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5})/i)
    if (phoneMatch && phoneMatch[1]) {
      result.personalInfo.phone = phoneMatch[1].trim()
    }

    // Extract LinkedIn
    const linkedinMatch = rawContact.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i) ||
      rawContact.match(/(?:LinkedIn|Linkedin):\s*([^|,\n]+)/i)
    if (linkedinMatch) {
      result.personalInfo.linkedin = linkedinMatch[0].replace(/^(?:LinkedIn|Linkedin):\s*/i, '').trim()
    }

    // Extract GitHub
    const githubMatch = rawContact.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i) ||
      rawContact.match(/(?:GitHub|Github):\s*([^|,\n]+)/i)
    if (githubMatch) {
      result.personalInfo.github = githubMatch[0].replace(/^(?:GitHub|Github):\s*/i, '').trim()
    }

    // Extract Portfolio / Website
    const portfolioMatch = rawContact.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|io|dev|app|me|net|tech|co|in))(?:\/[^\s|,]*)?/i)
    if (portfolioMatch && !portfolioMatch[0].includes('linkedin.com') && !portfolioMatch[0].includes('github.com')) {
      result.personalInfo.portfolio = portfolioMatch[0].trim()
    }

    // Extract Location
    const locMatch = rawContact.match(/(?:Location|Address|City):\s*([^|,\n]+)/i)
    if (locMatch && locMatch[1]) {
      result.personalInfo.location = locMatch[1].trim()
    }

    // Extract Name if labeled
    const nameMatch = rawContact.match(/(?:Name|Full Name):\s*([^|,\n]+)/i)
    if (nameMatch && nameMatch[1]) {
      result.personalInfo.fullName = nameMatch[1].trim()
    }

    // If still missing fields, parse pipe / newline / comma tokens
    const tokens = rawContact.split(/[\n|•]+/).map((t) => t.trim()).filter(Boolean)
    tokens.forEach((token) => {
      const lower = token.toLowerCase()
      if (lower.startsWith('email:') && !result.personalInfo.email) {
        result.personalInfo.email = token.replace(/^email:\s*/i, '').trim()
      } else if ((lower.startsWith('phone:') || lower.startsWith('mobile:')) && !result.personalInfo.phone) {
        result.personalInfo.phone = token.replace(/^(?:phone|mobile|tel):\s*/i, '').trim()
      } else if (lower.startsWith('location:') && !result.personalInfo.location) {
        result.personalInfo.location = token.replace(/^location:\s*/i, '').trim()
      } else if (!result.personalInfo.location && /^[A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}(?:\s*,\s*[A-Z][a-zA-Z\s]+)?$/.test(token)) {
        result.personalInfo.location = token
      } else if (!result.personalInfo.fullName && !token.includes('@') && !token.includes('http') && !/\d{4}/.test(token) && token.split(/\s+/).length >= 2 && token.split(/\s+/).length <= 4) {
        if (!lower.startsWith('email') && !lower.startsWith('phone') && !lower.startsWith('location')) {
          result.personalInfo.fullName = token
        }
      }
    })
  }

  // Derive fullName from filename if not extracted
  if (!result.personalInfo.fullName) {
    const raw = details.resumeName || details.originalFilename || ''
    const clean = raw
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/\s*\(\d+\)/g, '') // remove " (1)"
      .replace(/[-_]/g, ' ')
      .replace(/resume/gi, '')
      .replace(/cv/gi, '')
      .trim()
    result.personalInfo.fullName = clean || 'Professional Candidate'
  }

  // Derive initial Job Title from summary or resumeName
  if (!result.personalInfo.jobTitle) {
    if (details.summary) {
      const titleMatch = details.summary.match(/^(?:A |An |Experienced |Results-driven |Senior |Lead )?([A-Z][A-Za-z0-9\s/]+(?:Developer|Engineer|Architect|Manager|Designer|Analyst|Consultant|Scientist|Specialist))/i)
      if (titleMatch && titleMatch[1]) {
        result.personalInfo.jobTitle = titleMatch[1].trim()
      }
    }
  }

  // ── 2. Summary ──────────────────────────────────────────────
  if (details.summary) {
    result.summary = details.summary.trim()
  }

  // ── 3. Work Experience Parsing ──────────────────────────────
  if (details.experience) {
    const rawExp = details.experience.trim()
    const blocks = rawExp.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean)

    if (blocks.length > 0) {
      result.experience = blocks.map((block, idx): WorkExperienceItem => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const header = lines[0] || ''
        const subsequentLines = lines.slice(1)

        let role = header
        let company = 'Company'
        let location = ''
        let startDate = ''
        let endDate = ''
        let isCurrent = false

        // Extract dates e.g. (2022 - Present) or Jan 2021 – Mar 2023 or 2020-2022
        const dateMatch = header.match(/\(([^)]*(?:\d{4}|Present|Current)[^)]*)\)/i) ||
          header.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\d{4}\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?(?:\d{4}|Present|Current)/i)

        let cleanedHeader = header
        if (dateMatch) {
          const dateStr = dateMatch[1] || dateMatch[0]
          cleanedHeader = header.replace(dateMatch[0], '').replace(/[()]/g, '').trim()

          const dateParts = dateStr.split(/[-–—to]+/).map((d) => d.trim())
          startDate = dateParts[0] || ''
          endDate = dateParts[1] || ''
          if (!endDate || /present|current|now/i.test(endDate) || /present|current|now/i.test(dateStr)) {
            isCurrent = true
            endDate = ''
          }
        }

        // Split cleaned header by "at", "—", "-", "|"
        if (cleanedHeader.includes(' at ')) {
          const parts = cleanedHeader.split(' at ')
          role = parts[0]?.trim() || header
          company = parts[1]?.trim() || 'Company'
        } else if (cleanedHeader.includes(' — ')) {
          const parts = cleanedHeader.split(' — ')
          company = parts[0]?.trim() || 'Company'
          role = parts[1]?.trim() || header
        } else if (cleanedHeader.includes(' - ')) {
          const parts = cleanedHeader.split(' - ')
          role = parts[0]?.trim() || header
          company = parts[1]?.trim() || 'Company'
        } else if (cleanedHeader.includes('|')) {
          const parts = cleanedHeader.split('|').map((p) => p.trim())
          role = parts[0] || header
          company = parts[1] || 'Company'
          if (parts[2] && !location) location = parts[2]
        }

        // Clean up role / company
        role = role.replace(/^[•\-*]\s*/, '').trim()
        company = company.replace(/^[•\-*]\s*/, '').trim()

        const bullets = subsequentLines
          .map((l) => l.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean)

        return {
          id: generateId(`exp-${idx}`),
          company: company || 'Organization',
          role: role || 'Professional Role',
          location,
          startDate,
          endDate,
          isCurrent,
          highlights: bullets.length > 0 ? bullets : ['Led key engineering initiatives and delivered core product features.'],
        }
      })
    }
  }

  // ── 4. Education Parsing ────────────────────────────────────
  if (details.education) {
    const rawEdu = details.education.trim()
    const blocks = rawEdu.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean)

    result.education = blocks.map((block, idx): EducationItem => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      const primaryLine = lines[0] || 'Bachelor of Science'

      let degree = primaryLine
      let institution = lines[1] || 'University / College'
      let field = 'Computer Science & Engineering'
      let gpa = ''
      let startYear = ''
      let graduationYear = ''

      // Extract GPA / CGPA
      const gpaMatch = block.match(/(?:CGPA|GPA|Grade):\s*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i)
      if (gpaMatch && gpaMatch[1]) {
        gpa = gpaMatch[1].trim()
      }

      // Extract Years
      const yearMatch = block.match(/(\d{4})\s*[-–—to]+\s*(\d{4}|Present|Current)?/i)
      if (yearMatch) {
        startYear = yearMatch[1] || ''
        graduationYear = yearMatch[2] || ''
      }

      // Parse degree vs field from "B.Tech in Computer Science and Engineering"
      if (primaryLine.includes(' in ')) {
        const parts = primaryLine.split(' in ')
        degree = parts[0]?.trim() || primaryLine
        field = parts[1]?.split('|')[0]?.trim() || field
      } else if (primaryLine.includes('|')) {
        const parts = primaryLine.split('|').map((p) => p.trim())
        degree = parts[0] || primaryLine
        if (parts[1] && !gpa && (parts[1].toLowerCase().includes('cgpa') || parts[1].toLowerCase().includes('gpa'))) {
          gpa = parts[1]
        }
      }

      const coursework = lines.slice(2).join(', ')

      return {
        id: generateId(`edu-${idx}`),
        institution,
        degree,
        field,
        location: '',
        startYear,
        graduationYear,
        gpa,
        coursework,
      }
    })
  }

  // ── 5. Skills Parsing ───────────────────────────────────────
  if (details.skills) {
    const rawSkills = details.skills.trim()
    const lines = rawSkills.split('\n').map((l) => l.trim()).filter(Boolean)

    // Keep the user's/backend's explicit categories when they are clearly labeled,
    // but map each skill into TalentPrep's standard frontend taxonomy.
    const allSkills: string[] = []
    lines.forEach((line) => {
      const parts = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line
      parts
        .split(/[,:\n•|]+/)
        .map((skill) => skill.trim().replace(/^[-*]\s*/, ''))
        .filter((skill) => skill.length > 1)
        .forEach((skill) => allSkills.push(skill))
    })

    if (allSkills.length > 0) {
      result.skills = distributeSkills(Array.from(new Set(allSkills)))
    }
  }

  // ── 6. Projects Parsing ─────────────────────────────────────
  if (details.projects) {
    if (Array.isArray(details.projects) && details.projects.length > 0) {
      result.projects = details.projects.map((p: ProjectResponse, idx: number): ProjectItem => {
        const technologies = Array.isArray(p.technologies)
          ? p.technologies
          : typeof p.technologies === 'string'
          ? (p.technologies as string).split(/[,\n•|]+/).map((t) => t.trim()).filter(Boolean)
          : []

        const highlights = Array.isArray(p.highlights)
          ? p.highlights
          : typeof p.highlights === 'string'
          ? (p.highlights as string).split('\n').map((h) => h.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
          : []

        return {
          id: generateId(`proj-${idx}`),
          name: p.name || `Project ${idx + 1}`,
          description: p.description || '',
          technologies,
          highlights,
        }
      })
    } else if (typeof (details.projects as unknown) === 'string' && (details.projects as unknown as string).trim()) {
      const projBlocks = (details.projects as unknown as string).split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean)
      result.projects = projBlocks.map((block, idx): ProjectItem => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const name = lines[0] || `Project ${idx + 1}`
        const description = lines[1] || ''
        const highlights = lines.slice(2).map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)

        return {
          id: generateId(`proj-${idx}`),
          name,
          description,
          technologies: [],
          highlights,
        }
      })
    }
  }

  // ── 7. Certifications Parsing ───────────────────────────────
  if (details.certifications) {
    const certLines = details.certifications
      .split(/[,\n|]+/)
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean)

    if (certLines.length > 0) {
      result.certifications = certLines.map((c, idx): CertificationItem => {
        let name = c
        let issuer = 'Accredited Issuer'

        if (c.includes(' - ')) {
          const parts = c.split(' - ')
          issuer = parts[0]?.trim() || issuer
          name = parts[1]?.trim() || c
        } else if (c.includes(': ')) {
          const parts = c.split(': ')
          issuer = parts[0]?.trim() || issuer
          name = parts[1]?.trim() || c
        }

        return {
          id: generateId(`cert-${idx}`),
          name,
          issuer,
          issueDate: '',
        }
      })
    }
  }

  // ── 8. Achievements Parsing ─────────────────────────────────
  if (details.achievements) {
    const achLines = details.achievements
      .split(/\n|•/)
      .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean)

    if (achLines.length > 0) {
      result.achievements = achLines.map((a, idx): AchievementItem => ({
        id: generateId(`ach-${idx}`),
        title: a,
        description: '',
      }))
    }
  }

  // ── 9. Languages as Custom Section ──────────────────────────
  if (details.languages) {
    const langList = details.languages
      .split(/[,\n|•]+/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (langList.length > 0) {
      const customItem: CustomSectionItem = {
        id: generateId('cust-lang'),
        title: 'Languages',
        items: langList,
      }
      result.customSections = [customItem]
    }
  }

  return result
}

/**
 * Calculates overall completeness score (0 - 100)
 */
export function calculateResumeCompleteness(data: ResumeBuilderData): {
  overall: number
  sectionScores: Record<string, boolean>
} {
  const sectionScores: Record<string, boolean> = {
    personal: Boolean(data.personalInfo.fullName && data.personalInfo.email),
    summary: Boolean(data.summary && data.summary.trim().length > 30),
    experience: data.experience.length > 0,
    education: data.education.length > 0,
    skills: data.skills.some((c) => c.skills.length > 0),
    projects: data.projects.length > 0,
    certifications: data.certifications.length > 0,
    achievements: data.achievements.length > 0,
  }

  const weights: Record<string, number> = {
    personal: 20,
    summary: 15,
    experience: 25,
    education: 15,
    skills: 15,
    projects: 10,
  }

  let totalScore = 0
  let maxPossible = 0

  Object.entries(weights).forEach(([key, weight]) => {
    maxPossible += weight
    if (sectionScores[key]) {
      totalScore += weight
    }
  })

  return {
    overall: Math.min(100, Math.round((totalScore / maxPossible) * 100)),
    sectionScores,
  }
}
