import type {
  ResumeBuilderData,
  ResumeSectionKey,
  WorkExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  CertificationItem,
  AchievementItem,
  CustomSectionItem,
} from '../types/builder.types'

/**
 * Production PDF exporter.
 *
 * This intentionally does NOT use html2canvas. The previous canvas-based
 * pipeline rasterised the resume and was responsible for poor word spacing,
 * fragile CSS parsing (oklab/oklch), and awkward page breaks.
 *
 * This exporter writes a real PDF text document directly from ResumeBuilderData.
 * That gives us predictable typography, real selectable text, natural wrapping,
 * and clean one/two-page pagination without touching the live UI DOM.
 */

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

// Page margins. Keep the physical right margin balanced with the left margin.
const MARGIN_X = 42
const RIGHT_MARGIN = 54
const TOP_MARGIN = 38
const BOTTOM_MARGIN = 38

// The PDF uses built-in Helvetica, so text width is estimated rather than
// measured from an embedded font. Keep a small safety inset for wrapping so
// long lines do not visually run toward the right page edge.
const TEXT_WRAP_SAFETY = 14
const CONTENT_RIGHT = PAGE_WIDTH - RIGHT_MARGIN
const CONTENT_WIDTH = CONTENT_RIGHT - MARGIN_X - TEXT_WRAP_SAFETY

const COLORS = {
  text: '#172033',
  muted: '#5F6B7A',
  light: '#8B95A3',
  line: '#D9DEE6',
  accent: '#2563EB',
} as const

type FontName = 'F1' | 'F2' | 'F3'

interface PdfPage {
  commands: string[]
}

interface PdfDocumentState {
  pages: PdfPage[]
  page: PdfPage
  cursorY: number
}

interface TextStyle {
  font: FontName
  size: number
  color: string
  lineHeight?: number
  letterSpacing?: number
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = clean.length === 3
    ? clean.split('').map((char) => `${char}${char}`).join('')
    : clean

  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ]
}

function pdfNumber(value: number): string {
  return value.toFixed(4).replace(/\.?(0+)$/, '')
}

function colorCommand(hex: string, stroke = false): string {
  const [r, g, b] = hexToRgb(hex)
  return `${pdfNumber(r)} ${pdfNumber(g)} ${pdfNumber(b)} ${stroke ? 'RG' : 'rg'}`
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

/** Convert common Unicode punctuation into WinAnsi-safe characters. */
function normalizeText(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2026/g, '...')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u202F/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textWidth(text: string, size: number, font: FontName): number {
  const normalized = normalizeText(text)
  let width = 0

  for (const char of normalized) {
    if (char === ' ') {
      width += size * 0.30
    } else if ('ilIjtfr'.includes(char)) {
      width += size * 0.31
    } else if ('mwMW@%'.includes(char)) {
      width += size * 0.92
    } else if ('ABCDEFGHKNOPQRTUVXYZ'.includes(char)) {
      width += size * (font === 'F2' ? 0.71 : 0.68)
    } else if ('.,:;!|'.includes(char)) {
      width += size * 0.30
    } else if ('-_/()[]{}+'.includes(char)) {
      width += size * 0.38
    } else {
      width += size * 0.58
    }
  }

  // Built-in Helvetica metrics are approximated above. A small safety factor
  // makes wrapping conservative enough to keep text away from the right edge.
  return width * 1.035
}

function wrapText(
  value: string,
  maxWidth: number,
  size: number,
  font: FontName,
): string[] {
  const text = normalizeText(value)
  if (!text) return []

  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word

    if (textWidth(candidate, size, font) <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
    }

    if (textWidth(word, size, font) <= maxWidth) {
      current = word
      continue
    }

    // Extremely long token: split it rather than overflowing the page.
    let chunk = ''
    for (const char of word) {
      const next = `${chunk}${char}`
      if (textWidth(next, size, font) <= maxWidth) {
        chunk = next
      } else {
        if (chunk) lines.push(chunk)
        chunk = char
      }
    }
    current = chunk
  }

  if (current) lines.push(current)
  return lines
}

function createPage(): PdfPage {
  return {
    commands: [],
  }
}

function createDocument(): PdfDocumentState {
  const page = createPage()
  return {
    pages: [page],
    page,
    cursorY: PAGE_HEIGHT - TOP_MARGIN,
  }
}

function newPage(state: PdfDocumentState): void {
  const page = createPage()
  state.pages.push(page)
  state.page = page
  state.cursorY = PAGE_HEIGHT - TOP_MARGIN
}

function ensureSpace(state: PdfDocumentState, requiredHeight: number): void {
  if (state.cursorY - requiredHeight < BOTTOM_MARGIN) {
    newPage(state)
  }
}

function addText(
  state: PdfDocumentState,
  text: string,
  x: number,
  y: number,
  style: TextStyle,
): void {
  const safe = normalizeText(text)
  if (!safe) return

  const letterSpacing = style.letterSpacing ?? 0
  const spacingCommand = letterSpacing
    ? `${pdfNumber(letterSpacing)} Tc`
    : ''

  state.page.commands.push(
    'BT',
    `/${style.font} ${pdfNumber(style.size)} Tf`,
    colorCommand(style.color),
    spacingCommand,
    `1 0 0 1 ${pdfNumber(x)} ${pdfNumber(y)} Tm`,
    `(${escapePdfText(safe)}) Tj`,
    'ET',
  )
}

function addRule(
  state: PdfDocumentState,
  x1: number,
  y: number,
  x2: number,
  color: string,
  width = 0.6,
): void {
  state.page.commands.push(
    colorCommand(color, true),
    `${pdfNumber(width)} w`,
    `${pdfNumber(x1)} ${pdfNumber(y)} m`,
    `${pdfNumber(x2)} ${pdfNumber(y)} l`,
    'S',
  )
}

function addParagraph(
  state: PdfDocumentState,
  value: string,
  options: {
    x?: number
    width?: number
    font?: FontName
    size?: number
    color?: string
    lineHeight?: number
    spaceAfter?: number
    indent?: number
  } = {},
): number {
  const x = options.x ?? MARGIN_X
  const width = options.width ?? CONTENT_WIDTH
  const font = options.font ?? 'F1'
  const size = options.size ?? 8.8
  const color = options.color ?? COLORS.text
  const lineHeight = options.lineHeight ?? size * 1.32
  const spaceAfter = options.spaceAfter ?? 5
  const indent = options.indent ?? 0

  const lines = wrapText(value, width - indent, size, font)
  if (lines.length === 0) return 0

  ensureSpace(state, lines.length * lineHeight + spaceAfter)

  lines.forEach((line) => {
    addText(state, line, x + indent, state.cursorY - size, {
      font,
      size,
      color,
    })
    state.cursorY -= lineHeight
  })

  state.cursorY -= spaceAfter
  return lines.length * lineHeight + spaceAfter
}

function addBulletList(
  state: PdfDocumentState,
  items: string[],
  options: {
    x?: number
    width?: number
    size?: number
    color?: string
    lineHeight?: number
    spaceAfter?: number
  } = {},
): void {
  const x = options.x ?? MARGIN_X
  const width = options.width ?? CONTENT_WIDTH
  const size = options.size ?? 8.7
  const color = options.color ?? COLORS.text
  const lineHeight = options.lineHeight ?? size * 1.32
  const bulletWidth = 10

  for (const item of items.filter(Boolean)) {
    const lines = wrapText(item, width - bulletWidth, size, 'F1')
    if (!lines.length) continue

    ensureSpace(state, lines.length * lineHeight + 1.5)

    lines.forEach((line, index) => {
      if (index === 0) {
        addText(state, '-', x, state.cursorY - size, {
          font: 'F2',
          size,
          color,
        })
      }

      addText(state, line, x + bulletWidth, state.cursorY - size, {
        font: 'F1',
        size,
        color,
      })

      state.cursorY -= lineHeight
    })

    state.cursorY -= 1.5
  }
}

function addSectionHeading(
  state: PdfDocumentState,
  title: string,
  accent: string,
): void {
  const required = 21
  ensureSpace(state, required)

  state.cursorY -= 3

  const heading = title.toUpperCase()
  const headingWidth = textWidth(heading, 8.2, 'F2') + 12

  addText(state, heading, MARGIN_X, state.cursorY - 8, {
    font: 'F2',
    size: 8.2,
    color: accent,
    letterSpacing: 0.65,
  })

  addRule(
    state,
    Math.min(MARGIN_X + headingWidth, PAGE_WIDTH - RIGHT_MARGIN - 40),
    state.cursorY - 6,
    PAGE_WIDTH - RIGHT_MARGIN,
    COLORS.line,
    0.55,
  )

  state.cursorY -= 18
}

function addRightAlignedText(
  state: PdfDocumentState,
  value: string,
  rightX: number,
  y: number,
  style: TextStyle,
): void {
  const width = textWidth(value, style.size, style.font)
  addText(state, value, rightX - width, y, style)
}

function addHeader(
  state: PdfDocumentState,
  data: ResumeBuilderData,
  accent: string,
): void {
  const { personalInfo } = data
  const name = personalInfo.fullName || 'Your Full Name'
  const title = personalInfo.jobTitle

  addText(state, name, MARGIN_X, state.cursorY - 22, {
    font: 'F2',
    size: 22,
    color: COLORS.text,
  })

  if (title) {
    addRightAlignedText(
      state,
      title,
      PAGE_WIDTH - RIGHT_MARGIN,
      state.cursorY - 18,
      {
        font: 'F2',
        size: 9.5,
        color: accent,
      },
    )
  }

  state.cursorY -= 30

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github,
    personalInfo.portfolio,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value))

  const contact = contactParts.join('  |  ')
  const contactLines = wrapText(contact, CONTENT_WIDTH, 7.6, 'F1')

  contactLines.slice(0, 2).forEach((line) => {
    addText(state, line, MARGIN_X, state.cursorY - 7.6, {
      font: 'F1',
      size: 7.6,
      color: COLORS.muted,
    })
    state.cursorY -= 10
  })

  state.cursorY -= 4

  addRule(
    state,
    MARGIN_X,
    state.cursorY,
    PAGE_WIDTH - RIGHT_MARGIN,
    accent,
    1.35,
  )

  state.cursorY -= 12
}

function addExperience(
  state: PdfDocumentState,
  item: WorkExperienceItem,
): void {
  const date = `${item.startDate || ''}${item.startDate || item.endDate || item.isCurrent ? ' - ' : ''}${item.isCurrent ? 'Present' : item.endDate || ''}`.trim()

  ensureSpace(state, 42)

  addText(state, item.role || 'Role', MARGIN_X, state.cursorY - 8.8, {
    font: 'F2',
    size: 9.2,
    color: COLORS.text,
  })

  if (date) {
    addRightAlignedText(state, date, PAGE_WIDTH - RIGHT_MARGIN, state.cursorY - 8.8, {
      font: 'F1',
      size: 7.7,
      color: COLORS.muted,
    })
  }

  state.cursorY -= 11.5

  const company = [item.company, item.location].filter(Boolean).join(' | ')
  if (company) {
    addText(state, company, MARGIN_X, state.cursorY - 7.8, {
      font: 'F1',
      size: 7.8,
      color: COLORS.accent,
    })
    state.cursorY -= 10
  }

  addBulletList(state, item.highlights, {
    size: 8.45,
    lineHeight: 10.8,
  })

  state.cursorY -= 3
}

function addSkills(
  state: PdfDocumentState,
  skills: SkillCategory[],
): void {
  for (const category of skills.filter((item) => item.skills.length > 0)) {
    const value = `${category.categoryName}: ${category.skills.join(', ')}`
    addParagraph(state, value, {
      size: 8.2,
      lineHeight: 10.2,
      spaceAfter: 2.5,
      font: 'F1',
    })
  }

  state.cursorY -= 2
}

function addProject(
  state: PdfDocumentState,
  item: ProjectItem,
): void {
  ensureSpace(state, 35)

  addText(state, item.name || 'Project', MARGIN_X, state.cursorY - 8.8, {
    font: 'F2',
    size: 9.2,
    color: COLORS.text,
  })

  state.cursorY -= 11.5

  if (item.technologies.length > 0) {
    addParagraph(state, `Tech: ${item.technologies.join(', ')}`, {
      size: 7.7,
      lineHeight: 9.5,
      color: COLORS.muted,
      spaceAfter: 2,
    })
  }

  if (item.description) {
    addParagraph(state, item.description, {
      size: 8.35,
      lineHeight: 10.5,
      spaceAfter: 2,
    })
  }

  addBulletList(state, item.highlights, {
    size: 8.35,
    lineHeight: 10.5,
  })

  const links = [item.repoUrl, item.liveUrl].filter(Boolean)
  if (links.length > 0) {
    addParagraph(state, links.join(' | '), {
      size: 7.1,
      lineHeight: 8.8,
      color: COLORS.accent,
      spaceAfter: 3,
    })
  }

  state.cursorY -= 2
}

function addEducation(
  state: PdfDocumentState,
  item: EducationItem,
): void {
  ensureSpace(state, 35)

  addText(state, item.degree || 'Education', MARGIN_X, state.cursorY - 8.8, {
    font: 'F2',
    size: 8.9,
    color: COLORS.text,
  })

  const years = `${item.startYear || ''}${item.startYear || item.graduationYear ? ' - ' : ''}${item.graduationYear || ''}`
  if (years.trim()) {
    addRightAlignedText(state, years, PAGE_WIDTH - RIGHT_MARGIN, state.cursorY - 8.8, {
      font: 'F1',
      size: 7.6,
      color: COLORS.muted,
    })
  }

  state.cursorY -= 11

  const institution = [item.institution, item.field].filter(Boolean).join(' | ')
  if (institution) {
    addParagraph(state, institution, {
      size: 7.9,
      lineHeight: 9.8,
      color: COLORS.muted,
      spaceAfter: 1.5,
    })
  }

  if (item.gpa) {
    addParagraph(state, `GPA: ${item.gpa}`, {
      size: 7.8,
      lineHeight: 9.6,
      spaceAfter: 1.5,
    })
  }

  if (item.coursework) {
    addParagraph(state, `Coursework: ${item.coursework}`, {
      size: 7.6,
      lineHeight: 9.5,
      color: COLORS.muted,
      spaceAfter: 2,
    })
  }
}

function addCertification(
  state: PdfDocumentState,
  item: CertificationItem,
): void {
  addParagraph(state, `${item.name}${item.issuer ? ` - ${item.issuer}` : ''}${item.issueDate ? ` (${item.issueDate})` : ''}`, {
    size: 8,
    lineHeight: 10,
    spaceAfter: 2,
  })
}

function addAchievement(
  state: PdfDocumentState,
  item: AchievementItem,
): void {
  const value = item.description
    ? `${item.title}: ${item.description}`
    : item.title
  addBulletList(state, [value], {
    size: 8.25,
    lineHeight: 10.3,
  })
}

function addCustomSection(
  state: PdfDocumentState,
  item: CustomSectionItem,
): void {
  addSectionHeading(state, item.title, COLORS.accent)
  addBulletList(state, item.items, {
    size: 8.2,
    lineHeight: 10.3,
  })
}

function renderSection(
  state: PdfDocumentState,
  key: ResumeSectionKey,
  data: ResumeBuilderData,
  accent: string,
): void {
  if (!data.sectionVisibility[key]) return

  switch (key) {
    case 'personal':
      // Personal info is rendered as the document header.
      return

    case 'summary':
      if (data.summary) {
        addSectionHeading(state, 'Professional Summary', accent)
        addParagraph(state, data.summary, {
          size: 8.65,
          lineHeight: 11,
          spaceAfter: 3,
        })
      }
      return

    case 'experience':
      if (data.experience.length > 0) {
        addSectionHeading(state, 'Work Experience', accent)
        data.experience.forEach((item) => addExperience(state, item))
      }
      return

    case 'skills':
      if (data.skills.some((item) => item.skills.length > 0)) {
        addSectionHeading(state, 'Technical Skills', accent)
        addSkills(state, data.skills)
      }
      return

    case 'projects':
      if (data.projects.length > 0) {
        addSectionHeading(state, 'Projects', accent)
        data.projects.forEach((item) => addProject(state, item))
      }
      return

    case 'education':
      if (data.education.length > 0) {
        addSectionHeading(state, 'Education', accent)
        data.education.forEach((item) => addEducation(state, item))
      }
      return

    case 'certifications':
      if (data.certifications.length > 0) {
        addSectionHeading(state, 'Certifications', accent)
        data.certifications.forEach((item) => addCertification(state, item))
      }
      return

    case 'achievements':
      if (data.achievements.length > 0) {
        addSectionHeading(state, 'Achievements', accent)
        data.achievements.forEach((item) => addAchievement(state, item))
      }
      return

    case 'custom':
      data.customSections.forEach((item) => addCustomSection(state, item))
      return

    default:
      return
  }
}

function getAccent(template: ResumeBuilderData['selectedTemplate']): string {
  switch (template) {
    case 'minimal':
      return '#334155'
    case 'classic':
      return '#475569'
    case 'executive':
      return '#1E3A8A'
    case 'technical':
      return '#0284C7'
    case 'contemporary':
      return '#4F46E5'
    case 'modern':
    default:
      return '#2563EB'
  }
}

function renderPdf(data: ResumeBuilderData): Uint8Array {
  const state = createDocument()
  const accent = getAccent(data.selectedTemplate)

  addHeader(state, data, accent)

  const orderedSections = data.sectionOrder.filter(
    (key, index, array) => array.indexOf(key) === index,
  )

  orderedSections.forEach((key) => {
    renderSection(state, key, data, accent)
  })

  // Footer page numbers. This is intentionally subtle and appears only on
  // documents that span multiple pages.
  if (state.pages.length > 1) {
    state.pages.forEach((page, index) => {
      const label = `TalentPrep Resume  |  ${index + 1}`
      const width = textWidth(label, 6.5, 'F1')
      addText(
        { ...state, page },
        label,
        PAGE_WIDTH - RIGHT_MARGIN - width,
        18,
        {
          font: 'F1',
          size: 6.5,
          color: COLORS.light,
        },
      )
    })
  }

  return buildPdfBytes(state.pages)
}

function buildPdfBytes(pages: PdfPage[]): Uint8Array {
  const objects: string[] = []

  // 1 = catalog, 2 = pages, 3.. = fonts/resources/pages/content.
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')

  const pageObjectIds: number[] = []
  const fontHelvetica = 3
  const fontHelveticaBold = 4
  const fontHelveticaOblique = 5

  objects.push('') // pages object placeholder
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>')

  pages.forEach((page) => {
    const content = page.commands.join('\n')
    const contentObjectId = objects.length + 1
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)

    const pageObjectId = objects.length + 1
    pageObjectIds.push(pageObjectId)

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontHelvetica} 0 R /F2 ${fontHelveticaBold} 0 R /F3 ${fontHelveticaOblique} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    )
  })

  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ')
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`

  const chunks: string[] = ['%PDF-1.4\n% TalentPrep Resume\n']
  const offsets: number[] = [0]
  let offset = chunks[0].length

  objects.forEach((object, index) => {
    const objectId = index + 1
    const serialized = `${objectId} 0 obj\n${object}\nendobj\n`
    offsets.push(offset)
    chunks.push(serialized)
    offset += serialized.length
  })

  const xrefOffset = offset
  chunks.push(`xref\n0 ${objects.length + 1}\n`)
  chunks.push('0000000000 65535 f \n')

  for (let i = 1; i <= objects.length; i += 1) {
    chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }

  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  )

  const encoded = new TextEncoder().encode(chunks.join(''))
  return encoded
}

export async function downloadResumePdf(
  data: ResumeBuilderData,
  filename: string,
): Promise<void> {
  console.info('[PDF] Starting production PDF export')

  const bytes = renderPdf(data)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })

  if (blob.size === 0) {
    throw new Error('Generated PDF is empty.')
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = (filename || 'TalentPrep Resume')
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'TalentPrep Resume'

  anchor.href = url
  anchor.download = `${safeName}.pdf`
  anchor.style.display = 'none'
  anchor.rel = 'noopener'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)

  console.info('[PDF] Production PDF downloaded', {
    bytes: blob.size,
  })
}
