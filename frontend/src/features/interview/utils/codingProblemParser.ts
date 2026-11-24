/**
 * Utility to parse, normalize, and format interview coding problem descriptions.
 * Handles messy AI-generated question text, continuous single-paragraph strings,
 * non-string testcase inputs/outputs, and extracts problem description, examples,
 * constraints, and schemas into clean structured sections.
 */

export interface ParsedExample {
  title: string
  input: string
  output: string
  explanation?: string
}

export interface ParsedCodingProblem {
  title: string
  descriptionParagraphs: string[]
  examples: ParsedExample[]
  constraints: string[]
  schemas?: { title: string; content: string }[]
  followUp?: string
}

/**
 * Safely converts any value (string, number, boolean, array, object, null, undefined)
 * into a clean string without throwing runtime TypeErrors like .trim is not a function.
 */
export function safeString(val: unknown, nullAsLiteral = false): string {
  if (val === null || val === undefined) {
    return nullAsLiteral ? 'null' : ''
  }
  if (typeof val === 'string') {
    return val.trim()
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val)
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      return String(val)
    }
  }
  return String(val).trim()
}

/**
 * Format inline code formatting into clean readable tokens
 */
export function formatInlineText(text: string): string {
  return safeString(text)
}

/**
 * Smart parser for coding interview question text
 */
export function parseCodingQuestion(
  rawText: unknown,
  category?: string | null,
  providedTestCases?: Array<{ input?: unknown; expectedOutput?: unknown; description?: unknown }>
): ParsedCodingProblem {
  const normalizedRawText = typeof rawText === 'string' ? rawText : safeString(rawText)

  if (!normalizedRawText) {
    return {
      title: category ? `${category} Challenge` : 'Coding Problem',
      descriptionParagraphs: ['No problem description provided.'],
      examples: [],
      constraints: [
        'Time Complexity: Target O(N) or O(N log N).',
        'Space Complexity: Target O(1) to O(N).',
      ],
    }
  }

  try {
    // Normalize newlines
    const text = normalizedRawText.replace(/\r\n/g, '\n').trim()

    let title = 'Problem Statement'
    let remainingText = text
    const schemas: { title: string; content: string }[] = []
    const constraints: string[] = []
    const examples: ParsedExample[] = []
    let followUp: string | undefined

    // 1. Check if first line looks like a title (e.g. "177. Nth Highest Salary" or "1. Two Sum" or "# Two Sum")
    const lines = text.split('\n')
    const firstLine = lines[0].trim().replace(/^[#\s]+/, '')
    if (
      firstLine.length < 80 &&
      !firstLine.toLowerCase().startsWith('given ') &&
      !firstLine.toLowerCase().startsWith('write ') &&
      !firstLine.toLowerCase().startsWith('you are ') &&
      !firstLine.toLowerCase().startsWith('design ')
    ) {
      title = firstLine.replace(/^[0-9]+[.:\s]+/, '')
      remainingText = lines.slice(1).join('\n').trim()
    } else {
      // Generate a reasonable title from category or default
      title = category ? `${category} Challenge` : 'Algorithmic Problem'
    }

    // 2. Extract Schemas / Tables (e.g. "+---------------+---------+", "Table: Employee")
    const tableRegex = /(Table:\s*[A-Za-z0-9_]+[\s\S]*?\+[-+]+\+[\s\S]*?\+[-+]+\+)/g
    let tableMatch
    while ((tableMatch = tableRegex.exec(remainingText)) !== null) {
      const tableBlock = tableMatch[1]
      const tableNameMatch = tableBlock.match(/Table:\s*([A-Za-z0-9_]+)/)
      schemas.push({
        title: tableNameMatch ? tableNameMatch[1] : 'Schema',
        content: tableBlock.trim(),
      })
      remainingText = remainingText.replace(tableBlock, '').trim()
    }

    // 3. Extract Follow-up
    const followUpMatch = remainingText.match(/(?:Follow-up|Follow up):\s*([\s\S]+?)(?=$|\n\n)/i)
    if (followUpMatch) {
      followUp = followUpMatch[1].trim()
      remainingText = remainingText.replace(followUpMatch[0], '').trim()
    }

    // 4. Extract Constraints section
    const constraintsMatch = remainingText.match(
      /(?:Constraints|Notes?|Constraints and Assumptions):\s*([\s\S]+?)(?=$|\n\s*(?:Example|Follow-up))/i
    )
    if (constraintsMatch) {
      const rawConstraints = constraintsMatch[1]
      const cLines = rawConstraints.split('\n')
      for (const cLine of cLines) {
        const cleaned = cLine.replace(/^[-*•\s]+/, '').trim()
        if (cleaned.length > 0 && !cleaned.toLowerCase().startsWith('example')) {
          constraints.push(cleaned)
        }
      }
      remainingText = remainingText.replace(constraintsMatch[0], '').trim()
    }

    // 5. Extract Examples from text
    const exampleRegex = /(?:Example\s*(\d+)?:?\s*)([\s\S]*?)(?=(?:Example\s*\d+:?|Constraints:|Follow-up:|$))/gi
    let exMatch
    while ((exMatch = exampleRegex.exec(remainingText)) !== null) {
      const exIndex = exMatch[1] || `${examples.length + 1}`
      const exContent = exMatch[2].trim()

      const inputMatch = exContent.match(/Input:\s*([\s\S]*?)(?=\n\s*(?:Output:|Explanation:)|$)/i)
      const outputMatch = exContent.match(/Output:\s*([\s\S]*?)(?=\n\s*Explanation:|$)/i)
      const explanationMatch = exContent.match(/Explanation:\s*([\s\S]*?)$/i)

      if (inputMatch || outputMatch) {
        examples.push({
          title: `Example ${exIndex}`,
          input: inputMatch ? inputMatch[1].trim() : '',
          output: outputMatch ? outputMatch[1].trim() : '',
          explanation: explanationMatch ? explanationMatch[1].trim() : undefined,
        })
      }
    }

    // Remove example blocks from remaining text if we captured them
    if (examples.length > 0) {
      remainingText = remainingText.replace(/(?:Example\s*\d*:?\s*)[\s\S]*?(?=(?:Constraints:|Follow-up:|$))/gi, '').trim()
    }

    // 6. Merge provided test cases safely without assuming types are strings
    if (providedTestCases && Array.isArray(providedTestCases) && providedTestCases.length > 0) {
      providedTestCases.forEach((tc) => {
        if (!tc) return
        const tcInput = safeString(tc.input)
        const tcOutput = safeString(tc.expectedOutput, true)
        const tcDesc = tc.description ? safeString(tc.description) : undefined

        // Check if already represented (using safe comparison)
        const exists = examples.some(
          (ex) => safeString(ex.input) === tcInput && safeString(ex.output, true) === tcOutput
        )
        if (!exists) {
          examples.push({
            title: `Example ${examples.length + 1}${tcDesc ? `: ${tcDesc}` : ''}`,
            input: tcInput,
            output: tcOutput,
            explanation: tcDesc,
          })
        }
      })
    }

    // 7. If no constraints were found in text, infer standard ones or provide fallback
    if (constraints.length === 0) {
      constraints.push('Time Complexity: Optimize for O(N) or O(N log N) where applicable.')
      constraints.push('Space Complexity: Minimize auxiliary space (target O(1) to O(N)).')
      constraints.push('Handle edge cases: empty inputs, single element, boundary limits, and duplicates.')
    }

    // 8. Break remaining text into clean paragraphs
    let rawParagraphs = remainingText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    if (rawParagraphs.length === 1 && rawParagraphs[0].length > 300) {
      const sentences = rawParagraphs[0].match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [rawParagraphs[0]]
      if (sentences.length >= 3) {
        const mid = Math.ceil(sentences.length / 2)
        rawParagraphs = [
          sentences.slice(0, mid).join('').trim(),
          sentences.slice(mid).join('').trim(),
        ]
      }
    }

    // If still empty, use fallback
    if (rawParagraphs.length === 0) {
      rawParagraphs = [text]
    }

    return {
      title,
      descriptionParagraphs: rawParagraphs,
      examples,
      constraints,
      schemas: schemas.length > 0 ? schemas : undefined,
      followUp,
    }
  } catch (err) {
    console.error('Error parsing coding question:', err)
    return {
      title: category ? `${category} Challenge` : 'Algorithmic Problem',
      descriptionParagraphs: [normalizedRawText],
      examples: Array.isArray(providedTestCases)
        ? providedTestCases.map((tc, idx) => ({
            title: `Example ${idx + 1}`,
            input: safeString(tc?.input),
            output: safeString(tc?.expectedOutput, true),
            explanation: tc?.description ? safeString(tc.description) : undefined,
          }))
        : [],
      constraints: [
        'Time Complexity: Target O(N) or O(N log N).',
        'Space Complexity: Target O(1) to O(N).',
      ],
    }
  }
}
