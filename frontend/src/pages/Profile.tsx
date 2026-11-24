import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, CheckCircle2, Award, KeyRound, LogOut, ShieldAlert, AlertCircle, Lock } from 'lucide-react'
import { useAuth, forgotPassword, getErrorMessage } from '@/services/authService'

export default function Profile() {
  const { user, logout, showToast } = useAuth()
  const [resetRequested, setResetRequested] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
      setIsLoggingOut(false)
    }
  }

  const handlePasswordResetRequest = async () => {
    if (!user?.email) return
    setResetLoading(true)
    try {
      await forgotPassword(user.email)
      setResetRequested(true)
      showToast('Password reset OTP sent to your registered email address.', 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err) || 'Failed to initiate password reset.', 'error')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-5 text-foreground space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl text-foreground tracking-tight leading-tight">
            Account & Security Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Manage your credentials, session preferences, and verified candidate profile.
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-secondary-bg text-foreground font-semibold text-xs rounded-lg transition-colors cursor-pointer border border-border h-8"
        >
          {isLoggingOut ? (
            <div className="w-3.5 h-3.5 border-2 border-border border-t-foreground rounded-full animate-spin flex-shrink-0" />
          ) : (
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Left Profile Summary Card */}
        <div className="lg:col-span-4 bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col items-center text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold text-xl uppercase border-2 border-[#CDF22B]/30 mb-3 shadow-xs">
            {user?.username?.slice(0, 2) || 'TP'}
          </div>

          <h2 className="font-bold text-base text-foreground leading-tight">
            {user?.username || 'Candidate User'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{user?.email || 'user@talentprep.ai'}</p>

          <div className="mt-3 px-2.5 py-0.5 rounded-md bg-[#080908] text-[#CDF22B] text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#CDF22B]" />
            <span>Verified Candidate</span>
          </div>

          <div className="w-full border-t border-border my-4" />

          <div className="w-full space-y-2.5 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <span className="font-bold text-foreground">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session Identity</span>
              <span className="font-mono text-foreground font-semibold">
                {user?.userId ? `#${user.userId}` : 'Gateway-Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auth Method</span>
              <span className="font-mono text-foreground font-medium text-[11px]">JWT HttpOnly Cookie</span>
            </div>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="lg:col-span-8 space-y-4">
          {/* Account Details Panel */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 className="font-bold text-sm sm:text-base text-foreground border-b border-border pb-2.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-foreground" />
              <span>Account Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary-bg/60 border border-border space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span>Username</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground pt-0.5">
                  {user?.username || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary-bg/60 border border-border space-y-0.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <span>Primary Email</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground pt-0.5">
                  {user?.email || 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary-bg/40 border border-border flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#080908] text-[#CDF22B] flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground">Target Role & Domain</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Configured for Software Engineering, System Architecture, and Technical Interview simulations.
                </p>
              </div>
            </div>
          </div>

          {/* Password Management */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-foreground border-b border-border pb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-foreground" />
              <span>Password & Security</span>
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Initiate a password update by requesting a secure single-use OTP sent directly to your registered email address.
            </p>

            {resetRequested ? (
              <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#080908] flex-shrink-0" />
                <span>Password reset OTP dispatched. Check your email inbox to reset your password.</span>
              </div>
            ) : (
              <button
                onClick={handlePasswordResetRequest}
                disabled={resetLoading || !user?.email}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#CDF22B] hover:bg-[#b8da25] text-[#080908] font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-8"
              >
                {resetLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#080908] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                <span>{resetLoading ? 'Sending OTP...' : 'Send Password Reset OTP'}</span>
              </button>
            )}
          </div>

          {/* Account Deletion & Disclaimer Panel */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-foreground border-b border-border pb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              <span>Account Management & Data Privacy</span>
            </h3>

            <div className="p-3 rounded-lg bg-secondary-bg/60 border border-border space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <AlertCircle className="w-3.5 h-3.5 text-foreground" />
                <span>Data Deletion Protocol</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                To permanently purge your account data and resume records, please submit a deletion request to <strong className="text-foreground font-mono">support@talentprep.ai</strong>.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
