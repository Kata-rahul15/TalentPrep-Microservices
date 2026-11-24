import type {
  ResumeFile,
  ResumeDetails,
  ResumeEvaluation,
  JobMatchResult,
  UploadResumeResponse,
} from '../types/resume.types'

// ─── Simulated network delay ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Mock Resume File ─────────────────────────────────────────────────────────
export const mockResumeFile: ResumeFile = {
  id: 'resume-001',
  fileName: 'Rahul_Sharma_Resume.pdf',
  fileSize: 342891, // ~335 KB
  fileType: 'PDF',
  uploadedAt: '2025-07-18T10:30:00Z',
  status: 'ready',
}

// ─── Mock Resume Details ──────────────────────────────────────────────────────
export const mockResumeDetails: ResumeDetails = {
  resumeId: '4f108ff9-a6fa-4130-bf75-24234e200f28',
  resumeName: 'RahulKata_Java_Backend (1).pdf',
  originalFilename: 'RahulKata_Java_Backend (1).pdf',
  fileSize: 303173,
  mimeType: 'application/pdf',
  status: 'READY',
  version: 1,
  active: true,
  createdAt: '2026-09-25T23:25:59.379321',
  updatedAt: '2026-09-25T23:26:09.056702',
  summary:
    'Motivated and detail-oriented Java Backend Developer with strong experience building distributed microservices, secure authentication systems, and scalable backend REST APIs.',
  education: 'B.Tech in Computer Science and Engineering | CGPA: 8.6',
  experience:
    'Senior Java Backend Engineer at Tech Corp (2022 - Present)\nBuilt microservices architecture using Spring Boot, Kafka, and Redis.\nReduced query latency by 38% using Redis caching layers.',
  projects: [
    {
      name: 'TalentPrep Authentication System',
      description:
        'AI-powered interview preparation platform with mock interview sessions, real-time feedback, and authentication.',
      technologies: ['React', 'TypeScript', 'Spring Boot', 'Kafka', 'Redis', 'Docker'],
      highlights: [
        'Built complete authentication module with JWT, OTP verification, and password reset flows.',
        'Integrated OpenAI API for generating contextual interview questions.',
        'Designed event-driven notification system using Kafka for async email delivery.',
      ],
    },
    {
      name: 'Banking Transaction Processing System',
      description:
        'Standalone, stateless transaction microservice providing payment processing and validation.',
      technologies: ['Java', 'Spring Security', 'JWT', 'Redis', 'Docker'],
      highlights: [
        'Supports high concurrent transaction sessions with sub-10ms validation.',
        'Implements pessimistic locking for transaction consistency.',
      ],
    },
  ],
  skills:
    'Languages: Java (Core Java, Java 8+, Java 17), SQL, HTML, CSS, JavaScript, Spring Boot, React, Microservices, Redis, Kafka, Docker',
  certifications: 'AWS Certified Solutions Architect, Oracle Certified Professional: Java SE 17',
  achievements: 'Hackathon Winner 2025 - Best Backend Architecture',
  languages: 'English, Hindi, Telugu',
  contactInformation: 'Email: rahul@example.com | Phone: +91 98765 43210 | Location: Hyderabad, India',
}

// ─── Mock Evaluation ──────────────────────────────────────────────────────────
export const mockEvaluation: ResumeEvaluation = {
  resumeId: 'resume-001',
  evaluatedAt: '2025-07-18T11:00:00Z',
  scores: {
    atsScore: 84,
    keywordMatch: 79,
    formattingScore: 91,
    technicalSkillsScore: 88,
    experienceScore: 82,
    educationScore: 85,
    overallScore: 84,
  },
  strengths: [
    'Strong technical skill set covering backend, cloud, and containerization technologies.',
    'Quantified impact metrics (38% latency reduction, 2M+ DAUs) demonstrate business value clearly.',
    'Diverse project portfolio shows end-to-end engineering ownership.',
    'Certifications from AWS and CNCF validate cloud and DevOps expertise.',
    'Clean, well-structured formatting with consistent date formats and section hierarchy.',
  ],
  weaknesses: [
    'Missing explicit mention of system design experience or architectural decision-making.',
    'No mention of leadership, mentorship, or team collaboration beyond one role.',
    'GitHub and LinkedIn profiles are listed but not hyperlinked for ATS parsing.',
    'Skills section lacks proficiency levels making comparative evaluation difficult.',
    'No mention of agile methodology, sprint planning, or cross-functional collaboration.',
  ],
  suggestions: [
    {
      section: 'Summary',
      priority: 'high',
      message:
        'Add 1–2 sentences about your approach to system design and architectural decision-making to signal seniority.',
    },
    {
      section: 'Skills',
      priority: 'medium',
      message:
        'Group skills by category (Backend, Frontend, Cloud, DevOps, Databases) to improve ATS parsing accuracy.',
    },
    {
      section: 'Experience',
      priority: 'high',
      message:
        'Explicitly mention agile/scrum practices, sprint cycles, and cross-functional collaboration at Infosys.',
    },
    {
      section: 'Projects',
      priority: 'medium',
      message:
        'Add live demo URLs or deployment links where available — recruiters and ATS tools weight linked projects higher.',
    },
    {
      section: 'Education',
      priority: 'low',
      message:
        'Consider listing 2–3 relevant academic projects or coursework to reinforce foundational CS knowledge.',
    },
  ],
  missingKeywords: [
    'System Design',
    'High Availability',
    'Load Balancing',
    'Service Mesh',
    'gRPC',
    'Agile / Scrum',
    'Tech Lead',
    'Distributed Tracing',
    'Prometheus',
    'Grafana',
  ],
}

// ─── Mock Job Match ───────────────────────────────────────────────────────────
export const mockJobMatch: JobMatchResult = {
  overallMatch: 82,
  matchedSkills: [
    'Java',
    'Spring Boot',
    'Kafka',
    'Redis',
    'Docker',
    'Kubernetes',
    'JWT',
    'REST APIs',
    'Microservices',
    'PostgreSQL',
  ],
  missingSkills: ['gRPC', 'Istio', 'Terraform', 'Prometheus', 'OpenTelemetry'],
  missingKeywords: ['Service Mesh', 'Infrastructure as Code', 'Distributed Tracing', 'SRE'],
  recommendations: [
    'Add Terraform and Prometheus to your skills or projects section to match infrastructure requirements.',
    'Include a mention of observability tools like OpenTelemetry or Jaeger in your Infosys experience.',
    'Highlight any cross-team collaboration or DevOps partnership to match the role\'s team culture requirements.',
    'Consider adding a project or contribution related to gRPC for service-to-service communication.',
  ],
}

// ─── Mock Chat Suggestions ────────────────────────────────────────────────────
export const suggestedQuestions = [
  'Explain my Kafka-based Email Notification Engine project',
  'What technical skills am I missing for a Staff Engineer role?',
  'Summarize my professional experience',
  'How can I improve my ATS score?',
  'What makes my resume stand out?',
  'Which projects best demonstrate distributed systems experience?',
]

// ─── Mock Chat Responses ──────────────────────────────────────────────────────
const chatResponses: Record<string, string> = {
  kafka:
    "Your **Kafka-based Email Notification Engine** is a strong project. It processes 100K+ email events per hour using Apache Kafka's distributed messaging capabilities. Key highlights include dead-letter queues with configurable retry strategies, Thymeleaf-based HTML templating, and dual backend support for SendGrid and AWS SES. This project demonstrates your ability to design fault-tolerant, high-throughput event-driven systems — a highly valued skill at senior levels.",

  skills:
    "Based on your current resume, you're **missing some key skills** for a Staff Engineer role:\n\n• **System Design** – Not explicitly mentioned; critical for senior roles\n• **Observability** – Tools like Prometheus, Grafana, or Jaeger are absent\n• **Service Mesh** – Istio/Linkerd experience is increasingly expected\n• **Infrastructure as Code** – Terraform or Pulumi would strengthen your profile\n• **gRPC** – Common in modern microservice architectures\n\nI recommend adding a project that demonstrates observability setup or infrastructure provisioning.",

  summarize:
    "**Professional Summary:** You are a Senior Java Backend Engineer with 5+ years of experience specializing in distributed microservices. Your career spans two top-tier IT companies (Infosys and Wipro), where you've consistently delivered high-impact systems serving millions of users. You have proven expertise in:\n\n• Event-driven architecture with **Apache Kafka**\n• High-performance caching with **Redis** (38% latency reduction)\n• Security engineering with **JWT and Spring Security**\n• Container orchestration with **Docker and Kubernetes**\n\nYour open-source projects demonstrate end-to-end ownership, and your cloud certifications (AWS SAA, CKAD) validate your infrastructure competency.",

  ats: "To improve your ATS score from **84 to 90+**, focus on these changes:\n\n1. **Add missing keywords:** System Design, Agile, Scrum, Tech Lead, Load Balancing\n2. **Structure skills by category** instead of a flat list — ATS parsers handle this better\n3. **Hyperlink your profiles** (LinkedIn, GitHub) with full URLs for better parsing\n4. **Quantify more achievements** — e.g., add metrics to your Wipro experience\n5. **Include architecture diagrams or design decisions** in project descriptions\n\nThese changes are estimated to boost your score to the 90–93 range.",
}

function getMockChatResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('kafka') || lower.includes('email') || lower.includes('notification')) {
    return chatResponses.kafka
  }
  if (lower.includes('missing') || lower.includes('skill') || lower.includes('staff')) {
    return chatResponses.skills
  }
  if (lower.includes('summar') || lower.includes('overview') || lower.includes('experience')) {
    return chatResponses.summarize
  }
  if (lower.includes('ats') || lower.includes('score') || lower.includes('improve')) {
    return chatResponses.ats
  }
  return "That's a great question about your resume. Based on the content I've analyzed, your profile demonstrates strong backend engineering fundamentals with a clear focus on distributed systems and cloud-native development. I'd recommend highlighting your quantified achievements more prominently and ensuring your skills section aligns with the specific job descriptions you're targeting."
}

// ─── Mock API Functions ───────────────────────────────────────────────────────

let hasResume = true // Simulate having an existing resume

export const mockApi = {
  getResume: async (): Promise<ResumeFile | null> => {
    await sleep(1200)
    return hasResume ? mockResumeFile : null
  },

  uploadResume: async (_file: File): Promise<UploadResumeResponse> => {
    await sleep(2500) // Simulate upload time
    hasResume = true
    return {
      id: mockResumeFile.id,
      resumeId: mockResumeFile.id,
      fileName: _file.name,
      uploadedAt: new Date().toISOString(),
      status: 'ready',
    }
  },

  getResumeDetails: async (): Promise<ResumeDetails> => {
    await sleep(1000)
    return mockResumeDetails
  },

  evaluateResume: async (): Promise<ResumeEvaluation> => {
    await sleep(2800) // Longer delay for AI evaluation
    return mockEvaluation
  },

  matchJob: async (_jobDescription: string): Promise<JobMatchResult> => {
    await sleep(2200)
    return mockJobMatch
  },

  chat: async (
    message: string,
    _history: import('../types/resume.types').ChatMessage[]
  ): Promise<import('../types/resume.types').ChatMessage> => {
    await sleep(1500)
    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: getMockChatResponse(message),
      timestamp: new Date().toISOString(),
    }
  },
}
