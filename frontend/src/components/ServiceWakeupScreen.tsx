import { motion } from 'framer-motion'
import {
  Server,
  ShieldCheck,
  Brain,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import type { ServiceConnectionStatus } from '@/hooks/useServiceReadiness'
import TalentPrepLogo from '@/components/common/TalentPrepLogo'

interface ServiceWakeupScreenProps {
  gatewayStatus: ServiceConnectionStatus
  authStatus: ServiceConnectionStatus
  resumeStatus: ServiceConnectionStatus
  dynamicMessage: string
  isTimedOut: boolean
  isFailed: boolean
  elapsedSeconds: number
  onRetry: () => void
}

function ServiceStatusRow({
  icon: Icon,
  name,
  status,
}: {
  icon: typeof Server
  name: string
  status: ServiceConnectionStatus
}) {
  const getBadgeContent = () => {
    switch (status) {
      case 'ready':
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#080908] text-[#CDF22B] text-[11px] font-semibold border border-[#232621]">
            <CheckCircle2 className="w-3 h-3 text-[#CDF22B]" />
            <span>{status === 'connected' ? 'Connected' : 'Ready'}</span>
          </span>
        )
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEE2E2] dark:bg-rose-950/40 text-[#DC2626] text-[11px] font-semibold border border-[#FCA5A5]/60 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-[#DC2626]" />
            <span>Unavailable</span>
          </span>
        )
      case 'connecting':
      case 'waking':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F2EFE9] dark:bg-[#1A1C18] text-[#080908] dark:text-[#FAF8F3] text-[11px] font-medium border border-[#E5E0D5] dark:border-[#232621]">
            <LoaderCircle className="w-3 h-3 animate-spin text-[#080908] dark:text-[#CDF22B]" />
            <span>{status === 'connecting' ? 'Connecting' : 'Waking up'}</span>
          </span>
        )
    }
  }

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1C18] border border-[#E5E0D5] dark:border-[#232621] transition-all">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-center text-[#080908] dark:text-[#FAF8F3]">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-[#080908] dark:text-[#FAF8F3]">
          {name}
        </span>
      </div>
      {getBadgeContent()}
    </div>
  )
}

export default function ServiceWakeupScreen({
  gatewayStatus,
  authStatus,
  resumeStatus,
  dynamicMessage,
  isTimedOut,
  isFailed,
  elapsedSeconds,
  onRetry,
}: ServiceWakeupScreenProps) {
  const showRetry = isTimedOut || isFailed

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF8F3]/95 dark:bg-[#080908]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4"
      >
        {/* Brand Logo */}
        <TalentPrepLogo size="md" />

        {/* Heading & Subtitle */}
        <div className="space-y-1 max-w-xs">
          <h1 className="font-heading font-extrabold text-base sm:text-lg text-[#080908] dark:text-[#FAF8F3] tracking-tight">
            {showRetry ? 'Connection taking longer than expected' : 'Connecting to Workspace'}
          </h1>
          <p className="text-xs text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
            {showRetry
              ? 'Please try reconnecting. Your session and saved progress are safe.'
              : 'Waking backend services. This typically takes just a few seconds.'}
          </p>
        </div>

        {/* Dynamic Status Banner */}
        <div className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1C18] border border-[#E5E0D5] dark:border-[#232621] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#CDF22B] shrink-0" />
            <span className="text-xs font-medium text-[#080908] dark:text-[#FAF8F3] truncate">
              {dynamicMessage}
            </span>
          </div>
          {!showRetry && (
            <span className="text-[11px] font-mono text-[#383B36] dark:text-[#BDB9AF] tabular-nums shrink-0">
              {elapsedSeconds}s
            </span>
          )}
        </div>

        {/* 3 Service Status Rows */}
        <div className="w-full space-y-2 text-left">
          <ServiceStatusRow icon={Server} name="API Gateway" status={gatewayStatus} />
          <ServiceStatusRow icon={ShieldCheck} name="Authentication" status={authStatus} />
          <ServiceStatusRow icon={Brain} name="AI Resume Service" status={resumeStatus} />
        </div>

        {/* Retry Button */}
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors cursor-pointer h-9 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </motion.div>
    </div>
  )
}
