import { createPredefinedSkillCategories } from '../utils/skillTaxonomy'
export type ResumeTemplateId =
  | 'modern'
  | 'minimal'
  | 'classic'
  | 'executive'
  | 'technical'
  | 'contemporary'

export type ResumeSectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'custom'

export interface PersonalInfo {
  fullName: string
  jobTitle: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
}

export interface WorkExperienceItem {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  highlights: string[]
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startYear: string
  graduationYear: string
  gpa?: string
  coursework?: string
}

export interface SkillCategory {
  id: string
  categoryName: string
  skills: string[]
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  technologies: string[]
  highlights: string[]
  repoUrl?: string
  liveUrl?: string
  startDate?: string
  endDate?: string
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  issueDate: string
  credentialUrl?: string
}

export interface AchievementItem {
  id: string
  title: string
  description: string
}

export interface CustomSectionItem {
  id: string
  title: string
  items: string[]
}

export interface ResumeBuilderData {
  id: string
  title: string
  lastModified: string
  selectedTemplate: ResumeTemplateId
  personalInfo: PersonalInfo
  summary: string
  experience: WorkExperienceItem[]
  education: EducationItem[]
  skills: SkillCategory[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  achievements: AchievementItem[]
  customSections: CustomSectionItem[]
  sectionOrder: ResumeSectionKey[]
  sectionVisibility: Record<ResumeSectionKey, boolean>
}

export interface TemplateMetadata {
  id: ResumeTemplateId
  name: string
  badge: string
  description: string
  bestFor: string
  accentColor: string
}

export const TEMPLATE_REGISTRY: TemplateMetadata[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    badge: 'Popular',
    description: 'Clean typography, strong header hierarchy, subtle accent lines, and balanced spacing. Ideal for software engineers and corporate tech roles.',
    bestFor: 'Software Engineers & Tech Roles',
    accentColor: '#2563EB',
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    badge: 'ATS Optimized',
    description: 'Pure black-and-white typography with refined hairline dividers. Engineered for maximum ATS parser readability.',
    bestFor: 'High ATS Passing & General Roles',
    accentColor: '#1E293B',
  },
  {
    id: 'classic',
    name: 'Classic Corporate',
    badge: 'Traditional',
    description: 'Traditional centered layout with formal typography and conservative section dividers. Great for finance, consulting, and management.',
    bestFor: 'Corporate, Banking & Consulting',
    accentColor: '#334155',
  },
  {
    id: 'executive',
    name: 'Executive Leadership',
    badge: 'Senior Level',
    description: 'High-impact dark header banner, refined typography, and structured career timeline tailored for leadership and staff-level roles.',
    bestFor: 'Staff+, Engineering Leads & Managers',
    accentColor: '#1E3A8A',
  },
  {
    id: 'technical',
    name: 'Technical Developer',
    badge: 'Developer Choice',
    description: 'Pill tags for tech stacks, prominent project links, GitHub highlights, and dedicated categorized skill matrix.',
    bestFor: 'Full-Stack, Backend, DevOps & AI Engineers',
    accentColor: '#0284C7',
  },
  {
    id: 'contemporary',
    name: 'Contemporary Split',
    badge: 'Creative & Modern',
    description: 'Sophisticated two-column layout with left sidebar for skills, contact, and education, and main column for experience and projects.',
    bestFor: 'Product Designers, Frontend & Product Managers',
    accentColor: '#4F46E5',
  },
]

export const DEFAULT_EMPTY_RESUME: ResumeBuilderData = {
  id: 'resume-draft',
  title: 'My Professional Resume',
  lastModified: new Date().toISOString(),
  selectedTemplate: 'modern',
  personalInfo: {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  experience: [],
  education: [],
  skills: createPredefinedSkillCategories(),
  projects: [],
  certifications: [],
  achievements: [],
  customSections: [],
  sectionOrder: [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'achievements',
    'custom',
  ],
  sectionVisibility: {
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    achievements: true,
    custom: true,
  },
}

export const SAMPLE_PROFESSIONAL_RESUME: ResumeBuilderData = {
  id: 'sample-resume',
  title: 'Alex Morgan — Senior Software Engineer',
  lastModified: new Date().toISOString(),
  selectedTemplate: 'modern',
  personalInfo: {
    fullName: 'Alex Morgan',
    jobTitle: 'Senior Full Stack & Distributed Systems Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan-dev',
    github: 'github.com/alexmorgan',
    portfolio: 'alexmorgan.dev',
  },
  summary:
    'Results-driven Senior Software Engineer with 6+ years of experience designing, scaling, and deploying mission-critical microservices and responsive web applications. Proven track record of reducing system latency by 35% and mentoring junior developers in high-growth environments.',
  experience: [
    {
      id: 'exp-1',
      company: 'TechFlow Systems',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2022-03',
      endDate: '',
      isCurrent: true,
      highlights: [
        'Architected real-time event streaming pipeline processing 15M+ daily transactions using Apache Kafka and Spring Boot.',
        'Led migration of legacy monolith to containerized Kubernetes microservices, improving deployment frequency by 40%.',
        'Implemented Redis caching layer reducing 95th-percentile API response latency from 450ms to 85ms.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Nexus Cloud Innovations',
      role: 'Software Engineer',
      location: 'Austin, TX',
      startDate: '2019-06',
      endDate: '2022-02',
      isCurrent: false,
      highlights: [
        'Built full-stack analytics dashboard using React, TypeScript, and Node.js serving 25,000+ active enterprise users.',
        'Optimized PostgreSQL database schemas and indexing strategies, decreasing complex query execution time by 60%.',
        'Authored comprehensive unit and integration test suites with 92% code coverage across core business services.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      location: 'Berkeley, CA',
      startYear: '2015',
      graduationYear: '2019',
      gpa: '3.85 / 4.0',
      coursework: 'Distributed Systems, Algorithms & Data Structures, Database Systems, Cloud Computing',
    },
  ],
  skills: [
    {
      id: 'cat-1',
      categoryName: 'Languages',
      skills: ['TypeScript', 'JavaScript', 'Java', 'Python', 'SQL', 'Go'],
    },
    {
      id: 'cat-2',
      categoryName: 'Frameworks & Libraries',
      skills: ['React', 'Next.js', 'Spring Boot', 'Node.js', 'Express', 'Tailwind CSS'],
    },
    {
      id: 'cat-3',
      categoryName: 'Databases & Cloud',
      skills: ['PostgreSQL', 'Redis', 'MongoDB', 'AWS (S3, EC2, Lambda)', 'Docker', 'Kubernetes'],
    },
    {
      id: 'cat-4',
      categoryName: 'Developer Tools & Practices',
      skills: ['Git', 'CI/CD (GitHub Actions)', 'RESTful APIs', 'Microservices', 'Agile/Scrum', 'Jest'],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'CloudMetrics — Distributed Observability Platform',
      description: 'End-to-end telemetry and application performance monitoring platform for multi-cluster Kubernetes deployments.',
      technologies: ['Go', 'React', 'Prometheus', 'Grafana', 'Docker'],
      highlights: [
        'Developed low-overhead metrics collection daemon supporting 50+ custom telemetry counters.',
        'Engineered responsive visualization UI with real-time alerting WebSockets.',
      ],
      repoUrl: 'https://github.com/alexmorgan/cloudmetrics',
      liveUrl: 'https://cloudmetrics.demo.app',
      startDate: '2023-01',
      endDate: '2023-08',
    },
    {
      id: 'proj-2',
      name: 'SmartSearch AI — Semantic Document Retrieval',
      description: 'AI-assisted vector search engine utilizing PGVector and OpenAI embeddings for instant document querying.',
      technologies: ['Python', 'FastAPI', 'PostgreSQL', 'PGVector', 'TypeScript'],
      highlights: [
        'Indexed over 100,000 PDF documents with sub-second hybrid semantic and keyword search.',
      ],
      repoUrl: 'https://github.com/alexmorgan/smartsearch-ai',
      startDate: '2023-09',
      endDate: '2024-02',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services (AWS)',
      issueDate: '2023-05',
      credentialUrl: 'https://aws.amazon.com/verification',
    },
    {
      id: 'cert-2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation (CNCF)',
      issueDate: '2022-11',
      credentialUrl: 'https://cncf.io/certification',
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: 'First Place Winner — Silicon Valley Cloud Hackathon',
      description: 'Awarded 1st place out of 120+ teams for building an autonomous serverless cost optimization bot.',
    },
    {
      id: 'ach-2',
      title: 'Company Engineering Excellence Award',
      description: 'Recognized for leading zero-downtime infrastructure migration and outstanding cross-team collaboration.',
    },
  ],
  customSections: [
    {
      id: 'cust-1',
      title: 'Open Source Contributions',
      items: [
        'Core contributor to popular TypeScript utility library with 10k+ GitHub stars.',
        'Speaker at DevConf 2023 on "Building Resilient Microservices with Spring Boot and Kafka".',
      ],
    },
  ],
  sectionOrder: [
    'personal',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'achievements',
    'custom',
  ],
  sectionVisibility: {
    personal: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    achievements: true,
    custom: true,
  },
}
