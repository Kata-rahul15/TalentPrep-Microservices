import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import VerifyOtp from '@/pages/VerifyOtp'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Home from '@/pages/Home'
import Profile from '@/pages/Profile'
import AIAgent from '@/pages/AIAgent'
import Jobs from '@/pages/Jobs'
import { AuthProvider, useAuth } from '@/services/authService'
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'
import { ResumeProvider } from '@/features/resume/context/ResumeContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Resume module
import ResumeLayout from '@/features/resume/components/ResumeLayout'
import ResumeDashboard from '@/features/resume/pages/ResumeDashboard'
import ResumeUpload from '@/features/resume/pages/ResumeUpload'
import ResumeBuilder from '@/features/resume/pages/ResumeBuilder'
import ResumeDetails from '@/features/resume/pages/ResumeDetails'
import ResumeEvaluation from '@/features/resume/pages/ResumeEvaluation'
import JobMatch from '@/features/resume/pages/JobMatch'
import ResumeChat from '@/features/resume/pages/ResumeChat'

// Interview module
import InterviewLandingPage from '@/features/interview/pages/InterviewLandingPage'
import InterviewSetupPage from '@/features/interview/pages/InterviewSetupPage'
import InterviewRoomPage from '@/features/interview/pages/InterviewRoomPage'
import InterviewReportPage from '@/features/interview/pages/InterviewReportPage'
import InterviewTranscriptPage from '@/features/interview/pages/InterviewTranscriptPage'

import OAuthCallback from '@/pages/OAuthCallback'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import TermsAndConditions from '@/pages/TermsAndConditions'
import HelpCenter from '@/pages/HelpCenter'
import NotFound from '@/pages/NotFound'
import { useServiceReadiness } from '@/hooks/useServiceReadiness'
import ServiceWakeupScreen from '@/components/ServiceWakeupScreen'

// Guard for authenticated screens
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authStatus, authError, retrySessionCheck } = useAuth()

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Restoring your session...
        </p>
      </div>
    )
  }

  if (authStatus === 'service_unavailable' && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            Service Temporarily Unavailable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {authError || 'We could not reach the authentication gateway right now. Your session has not been logged out.'}
          </p>
          <button
            type="button"
            onClick={() => retrySessionCheck()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!user || authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return (
    <ResumeProvider>
      <AuthenticatedLayout>
        <ErrorBoundary>{children}</ErrorBoundary>
      </AuthenticatedLayout>
    </ResumeProvider>
  )
}

// Guard for guest-only screens (Login, Signup, etc.)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authStatus } = useAuth()

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

// Service readiness guard for authentication entry routes
function ReadinessAuthGuard({ children }: { children: React.ReactNode }) {
  const readiness = useServiceReadiness(true)

  if (!readiness.isReady) {
    return (
      <ServiceWakeupScreen
        gatewayStatus={readiness.gatewayStatus}
        authStatus={readiness.authStatus}
        resumeStatus={readiness.resumeStatus}
        dynamicMessage={readiness.dynamicMessage}
        isTimedOut={readiness.isTimedOut}
        isFailed={readiness.isFailed}
        elapsedSeconds={readiness.elapsedSeconds}
        onRetry={readiness.retry}
      />
    )
  }

  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing Page Route */}
          <Route path="/" element={<Landing />} />

          {/* Authentication Routes with Service Wakeup Guard */}
          <Route path="/login" element={<ReadinessAuthGuard><PublicRoute><Login /></PublicRoute></ReadinessAuthGuard>} />
          <Route path="/signup" element={<ReadinessAuthGuard><PublicRoute><Signup /></PublicRoute></ReadinessAuthGuard>} />
          <Route path="/verify-otp" element={<ReadinessAuthGuard><PublicRoute><VerifyOtp /></PublicRoute></ReadinessAuthGuard>} />
          <Route path="/forgot-password" element={<ReadinessAuthGuard><PublicRoute><ForgotPassword /></PublicRoute></ReadinessAuthGuard>} />
          <Route path="/reset-password" element={<ReadinessAuthGuard><PublicRoute><ResetPassword /></PublicRoute></ReadinessAuthGuard>} />
          <Route path="/oauth/success" element={<OAuthCallback />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Information & Legal Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/faq" element={<HelpCenter />} />

          {/* Authenticated Routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Interview Module Routes */}
          <Route path="/interview" element={<ProtectedRoute><InterviewLandingPage /></ProtectedRoute>} />
          <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
          <Route path="/interview/:sessionId" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
          <Route path="/interview/:sessionId/report" element={<ProtectedRoute><InterviewReportPage /></ProtectedRoute>} />
          <Route path="/interview/:sessionId/transcript" element={<ProtectedRoute><InterviewTranscriptPage /></ProtectedRoute>} />

          {/* Resume Module Routes */}
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeDashboard />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/upload"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeUpload />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/builder"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeBuilder />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/details"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeDetails />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/evaluation"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeEvaluation />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/job-match"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <JobMatch />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume/chat"
            element={
              <ProtectedRoute>
                <ResumeLayout>
                  <ResumeChat />
                </ResumeLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Custom 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
