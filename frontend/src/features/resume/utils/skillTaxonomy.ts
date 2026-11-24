import type { SkillCategory } from '../types/builder.types'

export const PREDEFINED_SKILL_CATEGORIES = [
  { key: 'languages', name: 'Languages' },
  { key: 'frontend', name: 'Frontend' },
  { key: 'backend', name: 'Backend' },
  { key: 'databases', name: 'Databases & Caching' },
  { key: 'cloud', name: 'Cloud & DevOps' },
  { key: 'ai', name: 'AI / ML' },
  { key: 'tools', name: 'Tools' },
  { key: 'other', name: 'Other' },
] as const

const SKILL_CATEGORY_RULES: Array<{ category: string; skills: string[] }> = [
  {
    category: 'Languages',
    skills: [
      'java', 'core java', 'java 8', 'java 11', 'java 17', 'java 21',
      'javascript', 'typescript', 'python', 'c', 'c++', 'c#', 'go', 'golang',
      'kotlin', 'swift', 'rust', 'php', 'ruby', 'scala', 'sql', 'bash',
      'shell',
    ],
  },
  {
    category: 'Frontend',
    skills: [
      'react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'angular', 'vue',
      'vue.js', 'svelte', 'tailwind', 'tailwind css', 'bootstrap', 'material ui',
      'mui', 'redux', 'zustand', 'vite', 'webpack', 'html', 'html5', 'css', 'css3', 'sass',
      'scss', 'responsive design', 'frontend', 'front-end',
    ],
  },
  {
    category: 'AI / ML',
    skills: [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'spring ai', 'rag', 'retrieval augmented generation', 'llm', 'llms',
      'openai', 'gemini', 'google genai', 'groq', 'hugging face', 'huggingface',
      'langchain', 'langgraph', 'embeddings', 'vector search', 'generative ai',
      'genai', 'prompt engineering', 'nlp', 'natural language processing',
    ],
  },
  {
    category: 'Backend',
    skills: [
      'spring', 'spring boot', 'spring security', 'spring mvc', 'spring data',
      'spring data jpa', 'spring ai', 'hibernate', 'jpa', 'node.js', 'nodejs',
      'express', 'express.js', 'fastapi', 'django', 'flask', 'asp.net', '.net',
      '.net core', 'nestjs', 'graphql', 'rest', 'rest api', 'restful apis',
      'microservices', 'api gateway', 'oauth', 'oauth2', 'jwt', 'websocket',
      'kafka', 'apache kafka', 'rabbitmq', 'backend', 'back-end',
    ],
  },
  {
    category: 'Databases & Caching',
    skills: [
      'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo db', 'oracle',
      'oracle database', 'sql server', 'mssql', 'sqlite', 'mariadb', 'redis',
      'redis cache', 'memcached', 'elasticsearch', 'opensearch', 'dynamodb',
      'cassandra', 'neo4j', 'pgvector', 'vector database', 'database',
      'databases', 'caching', 'cache',
    ],
  },
  {
    category: 'Cloud & DevOps',
    skills: [
      'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'render',
      'vercel', 'supabase', 'docker', 'docker compose', 'kubernetes', 'k8s',
      'jenkins', 'github actions', 'gitlab ci', 'ci/cd', 'cicd', 'terraform',
      'ansible', 'nginx', 'linux', 'cloudflare', 'devops', 'cloud',
      'deployment', 'infrastructure', 'observability', 'prometheus', 'grafana',
    ],
  },
  {
    category: 'Tools',
    skills: [
      'git', 'github', 'gitlab', 'bitbucket', 'maven', 'gradle', 'npm', 'pnpm',
      'yarn', 'intellij idea', 'intellij', 'eclipse', 'vs code', 'visual studio',
      'postman', 'swagger', 'openapi', 'jira', 'notion', 'figma', 'junit',
      'mockito', 'jest', 'vitest', 'selenium', 'agile', 'scrum', 'rest client',
    ],
  },

]

function normalizeSkillName(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
}

export function classifySkill(skill: string): string {
  const normalized = normalizeSkillName(skill)
  if (!normalized) return 'Other'

  // Exact matches first so generic words such as "spring" don't steal more specific entries.
  for (const rule of SKILL_CATEGORY_RULES) {
    if (rule.skills.some((candidate) => normalizeSkillName(candidate) === normalized)) {
      return rule.category
    }
  }

  // Then allow conservative substring matching for common technology names.
  for (const rule of SKILL_CATEGORY_RULES) {
    if (rule.skills.some((candidate) => {
      const candidateNormalized = normalizeSkillName(candidate)
      return candidateNormalized.length >= 4 &&
        (normalized.includes(candidateNormalized) || candidateNormalized.includes(normalized))
    })) {
      return rule.category
    }
  }

  return 'Other'
}

export function createPredefinedSkillCategories(): SkillCategory[] {
  return PREDEFINED_SKILL_CATEGORIES.map((category, index) => ({
    id: `cat-${category.key}-${index + 1}`,
    categoryName: category.name,
    skills: [],
  }))
}

export function distributeSkills(skills: string[]): SkillCategory[] {
  const categories = createPredefinedSkillCategories()
  const byName = new Map(categories.map((category) => [category.categoryName, category]))

  for (const rawSkill of skills) {
    const skill = rawSkill.trim()
    if (!skill) continue

    const categoryName = classifySkill(skill)
    const category = byName.get(categoryName) || byName.get('Other')!

    if (!category.skills.some((existing) => normalizeSkillName(existing) === normalizeSkillName(skill))) {
      category.skills.push(skill)
    }
  }

  return categories
}

/**
 * Converts legacy builder categories into the new predefined taxonomy once.
 * Already-modern categories are preserved so manual drag/drop choices are not
 * overwritten on every save or reload.
 */
export function migrateLegacySkillCategories(input: SkillCategory[] | undefined | null): SkillCategory[] {
  if (!Array.isArray(input)) return createPredefinedSkillCategories()

  const names = input.map((category) => category.categoryName.trim().toLowerCase())
  const modernNames = new Set(PREDEFINED_SKILL_CATEGORIES.map((category) => category.name.toLowerCase()))
  const legacyNames = new Set([
    'programming languages',
    'frameworks & libraries',
    'databases & cloud',
    'tools & practices',
    'developer tools & practices',
    'core technical skills',
  ])

  // Once the new taxonomy is present, preserve the user's custom categories and
  // drag/drop choices. Only legacy category layouts are migrated automatically.
  const hasLegacyCategory = names.some((name) => legacyNames.has(name))
  const hasModernCategory = names.some((name) => modernNames.has(name))

  if (hasModernCategory && !hasLegacyCategory) {
    const predefined = createPredefinedSkillCategories()
    const predefinedMap = new Map(predefined.map((category) => [category.categoryName.toLowerCase(), category]))
    const custom = input.filter((category) => !modernNames.has(category.categoryName.trim().toLowerCase()))

    for (const category of input) {
      const target = predefinedMap.get(category.categoryName.trim().toLowerCase())
      if (!target) continue
      for (const skill of category.skills || []) {
        if (!target.skills.some((existing) => normalizeSkillName(existing) === normalizeSkillName(skill))) {
          target.skills.push(skill)
        }
      }
    }

    return [...predefined, ...custom]
  }

  const allSkills = input.flatMap((category) => category.skills || [])
  return distributeSkills(allSkills)
}

