# 🎯 TalentPrep — AI-Powered Career Platform

A modern career-preparation frontend built with **React, TypeScript, Vite, Tailwind CSS, and React Router**. TalentPrep provides a unified interface for account access, resume intelligence, AI-assisted career workflows, job discovery, and resume building.

The frontend communicates with the backend through a **single API Gateway base URL**, keeping authentication and resume APIs behind a consistent entry point.

---

# 🚀 Features

## 🌐 Landing Page and Product Experience

- Product landing page with hero section and calls to action
- Feature and benefits sections
- How-it-works and product-flow sections
- AI Agent and job-search feature sections
- Resume intelligence and resume-builder sections
- FAQ, trust, testimonials, and CTA sections
- Responsive navigation and footer

The landing page describes the current resume and job-discovery capabilities. Treat any marketing copy as product presentation rather than proof that every advertised capability is implemented end-to-end.

---

## 🔐 Authentication

- Login and registration screens
- Email OTP verification
- Forgot-password and reset-password flows
- Google OAuth2 login
- GitHub OAuth2 login
- OAuth callback handling
- Authenticated profile retrieval and session restoration
- Protected routes for authenticated pages
- Guest-only route handling for login and registration
- Terms and privacy consent UI

Authentication requests are routed through the configured API Gateway URL.

---

## 🟢 Service Readiness and Wake-Up Experience

- Readiness checks before showing authentication entry screens
- Service wake-up screen with gateway, authentication, and resume service status
- Retry action and timeout/failure states
- Network status toast
- Loading states during session restoration and protected navigation

The readiness UI is intended to handle backend services that may take time to start. The backend readiness endpoint remains responsible for reporting service availability; the frontend displays the result.

---

## 📄 Resume Management

- Resume upload for PDF and DOCX files
- Upload progress and processing states
- Resume processing modal
- Resume dashboard
- Resume details view
- Resume evaluation and ATS-oriented insights
- Resume download and management flows
- Resume status handling for processing and failure

The resume feature module includes a context and API layer for coordinating upload, selected-resume state, and resume data across pages.

---

## 📝 Resume Builder

- Structured resume editor
- Personal information
- Professional summary
- Work experience
- Education
- Skills
- Projects
- Certifications
- Achievements
- Custom sections
- Section ordering and visibility controls
- Resume template gallery
- Live resume preview
- AI improvement modal
- Undo/redo history
- Draft recovery using browser local storage
- Backend builder-data loading and saving
- PDF export

Available template components include Classic, Contemporary, Executive, Minimal, Modern, and Technical designs.

---

## 💼 Job Discovery and Matching

- Dedicated jobs page
- AI Find Jobs for Me workflow
- Manual job-search experience
- Resume job-match page
- Job-match results and related resume workflows

The frontend builds API URLs from the shared gateway configuration. Personalized job selection, target-role generation, external job-provider requests, and Redis caching are backend responsibilities.

---

## 🤖 AI Career Agent and Resume Chat

- Dedicated AI Agent page
- Resume chat interface
- Agent-oriented conversation UI
- Loading and response states for AI workflows

The frontend provides the interaction layer; the backend agent and its configured tools determine the available actions and generated results.

---

## 👤 Profile and Account Pages

- Home/dashboard page
- Profile page
- Settings route
- Help Center and FAQ route
- Privacy Policy
- Terms and Conditions
- Custom 404 page

---

# 🏗️ Architecture

```text
                    TALENTPREP FRONTEND
                  React + TypeScript + Vite
                              |
                              v
                      React Router
                              |
              +---------------+----------------+
              |               |                |
              v               v                v
        Public Pages     Auth Pages      Protected Pages
        Landing / FAQ    Login / Signup  Home / Profile
        Legal / Help     OTP / Reset     Jobs / AI Agent
                                         Resume Module
                                              |
                       +----------------------+------------------+
                       |                      |                  |
                       v                      v                  v
                 Resume Dashboard       Resume Builder      Resume Chat
                 Upload / Details       Editor / Preview    AI interaction
                 Evaluation / Match     Templates / PDF     Conversation UI
                       |                      |                  |
                       +----------------------+------------------+
                                              |
                                              v
                                      Shared API Client
                                              |
                                              v
                                       API Gateway URL
                                              |
                         +--------------------+-------------------+
                         |                                        |
                         v                                        v
                Authentication APIs                       Resume APIs
                Login / OAuth / OTP                       Upload / Analysis
                Profile / Password                        RAG / Agent / Jobs
                                                         Builder / Matching
```

---

# 🔄 Key User Flows

## 1. Login and Session Restoration

```text
User opens Login
       |
       v
Service readiness check
       |
       v
AuthProvider restores session
       |
       +--> Session exists --> Redirect to authenticated area
       |
       +--> No session --> Show login form
                              |
                              v
                     Credentials or OAuth2
                              |
                              v
                      Authentication API
                              |
                              v
                    OAuth callback / profile
                              |
                              v
                       Protected pages
```

## 2. Resume Upload and Processing

```text
Authenticated user
       |
       v
Resume Upload page
       |
       v
Select PDF or DOCX
       |
       v
Upload through shared API configuration
       |
       v
Backend extracts and analyzes resume
       |
       v
Frontend displays processing status
       |
       v
Resume Dashboard / Details / Evaluation
```

## 3. AI Find Jobs for Me

```text
User opens Jobs
       |
       v
Select AI Find Jobs for Me
       |
       v
Frontend sends request through API Gateway
       |
       v
Resume backend resolves user resume and target roles
       |
       v
Backend searches provider / checks Redis cache
       |
       v
Frontend renders job results
```

## 4. Resume Builder

```text
Open Resume Builder
       |
       v
Select active resume
       |
       v
Load saved builder data
       |
       +--> Backend builder data
       |
       +--> Local draft recovery if needed
       |
       +--> Parsed resume details or empty template
       |
       v
Edit sections and choose template
       |
       v
Save builder content / recover draft
       |
       v
Preview or export PDF
```

---

# 🧰 Technology Stack

## Core frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- `@tailwindcss/vite`

## API and data flow
- Axios
- TanStack React Query
- React Context
- Zod
- React Hook Form

## UI and animation
- Lucide React
- Framer Motion
- GSAP
- Custom reusable components
- Responsive layouts and mobile navigation

## Resume export and rendering
- jsPDF
- html2canvas
- Custom resume templates

---

# 📁 Project Structure

```text
src/
├── components/
│   ├── auth/                 # Auth forms, OTP, validation, OAuth buttons
│   ├── common/               # Shared branding components
│   ├── layout/               # Navigation, sidebar, drawer, toast, footer
│   ├── sections/             # Landing page sections
│   └── ServiceWakeupScreen.tsx
├── config/
│   └── api.ts                # Shared API Gateway URL configuration
├── features/
│   └── resume/
│       ├── api/              # Resume API client
│       ├── components/       # Upload, processing, builder, preview
│       ├── context/          # Shared resume state
│       ├── hooks/            # Resume hooks
│       ├── pages/            # Resume routes and pages
│       ├── templates/        # Resume template implementations
│       ├── types/            # Resume and builder types
│       └── utils/            # PDF export and builder utilities
├── hooks/                    # Shared application hooks
├── lib/                      # Shared utilities
├── pages/                    # Landing, auth, jobs, profile, legal pages
├── routes/
│   └── AppRoutes.tsx         # Public, protected, and fallback routes
├── services/
│   └── authService.tsx       # Auth provider and API integration
├── App.tsx
└── main.tsx
```

---

# ⚙️ Configuration

The frontend uses one API Gateway base URL.

Create a local `.env` file based on `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

For deployment, set `VITE_API_BASE_URL` to the deployed API Gateway's base URL in the hosting provider's environment settings.

The shared configuration derives the authentication and resume API bases:

```text
VITE_API_BASE_URL
        |
        +--> /api/auth
        |
        +--> /api/resumes
```

Do not put private API keys, database credentials, JWT signing secrets, or OAuth client secrets in frontend environment variables. Vite exposes `VITE_*` values to the browser bundle.

---

# ▶️ Getting Started

## Prerequisites

- Node.js version compatible with the project's Vite version
- npm
- Running TalentPrep backend services, or access to a deployed API Gateway

## Install dependencies

```bash
npm install
```

## Configure environment

Create `.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

## Run development server

```bash
npm run dev
```

Vite prints the local development URL in the terminal.

## Build for production

```bash
npm run build
```

## Lint the code

```bash
npm run lint
```

## Preview production build locally

```bash
npm run preview
```

---

# 🔐 Security and Reliability Notes

- Keep private credentials on the backend; never ship secrets in `VITE_*` variables.
- Configure CORS on the API Gateway for the exact frontend origin.
- Use HTTPS for deployed frontend and backend traffic.
- Authentication cookies should be configured by the backend with appropriate `HttpOnly`, `Secure`, and `SameSite` attributes.
- Protected routes improve navigation and UX but are not a replacement for backend authorization.
- Avoid logging access tokens, refresh tokens, resume contents, or other sensitive personal data.
- Validate that logout, OAuth callbacks, and service-readiness failures return users to a consistent state.
- Treat local storage builder drafts as browser-local recovery data, not as a secure source of truth.

---

# 🧪 Suggested Validation Checklist

- [ ] Landing page and responsive navigation render correctly.
- [ ] Registration and email OTP verification work through the gateway.
- [ ] Login and logout restore and clear the expected session state.
- [ ] Google and GitHub OAuth2 callbacks return to the application correctly.
- [ ] Password recovery and reset flows work.
- [ ] Readiness screen handles starting, ready, timeout, and retry states.
- [ ] Resume upload accepts supported file types and shows progress.
- [ ] Resume processing states and errors are displayed correctly.
- [ ] Resume dashboard, details, evaluation, and matching load real API data.
- [ ] AI Find Jobs for Me uses the intended backend endpoint.
- [ ] Resume Builder loads saved data, recovers drafts, and exports PDFs.
- [ ] AI Agent and resume chat handle loading and failure states.
- [ ] Production build and lint complete successfully.

---

# 💡 What This Project Demonstrates

- Component-based React application architecture
- Type-safe frontend development with TypeScript
- Route protection and authentication state management
- OAuth2 redirect integration
- Centralized API Gateway configuration
- Server-state management with React Query
- Resume workflow UX for long-running processing
- Resume editor, templates, and PDF export
- AI-agent and job-discovery user experiences
- Responsive layouts and reusable UI components
- Frontend/backend integration for a microservices platform

---

## 🔗 Related Backend Services

The frontend communicates with TalentPrep's backend through the API Gateway:

- **Authentication-Service** — accounts, JWT, OAuth2, OTP, and profile APIs
- **Resume-RAG-Service** — resume processing, RAG, AI agent, job discovery, matching, and builder APIs
- **API Gateway** — central routing, JWT validation, identity propagation, and service readiness

---

## ⭐ If you find TalentPrep useful, consider giving the repository a star!
