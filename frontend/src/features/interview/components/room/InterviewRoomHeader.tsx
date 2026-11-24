import { useState } from 'react'
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  PhoneOff,
  Clock,
  Video,
  AlertCircle,
  X,
} from 'lucide-react'
import type {
  InterviewSessionResponse,
  WebSocketConnectionStatus,
  RoundType,
} from '../../types/interview.types'
import { formatRoundTitle } from '../../utils/interviewFormatters'

interface InterviewRoomHeaderProps {
  session: InterviewSessionResponse
  activeRoundType?: RoundType | string
  remainingSeconds: number
  connectionStatus: WebSocketConnectionStatus
  statusDetail?: string | null
  // Device states
  isCameraEnabled: boolean
  isMicEnabled: boolean
  isAudioMuted: boolean
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleAudioMute: () => void
  // Session controls
  isPaused: boolean
  isEnding: boolean
  isDisabled?: boolean
  onPause: () => void
  onResume: () => void
  onEndInterview: () => void
  onReconnect?: () => void
  className?: string
}

export default function InterviewRoomHeader({
  session,
  activeRoundType,
  remainingSeconds,
  connectionStatus,
  statusDetail,
  isCameraEnabled,
  isMicEnabled,
  isAudioMuted,
  onToggleCamera,
  onToggleMic,
  onToggleAudioMute,
  isPaused,
  isEnding,
  isDisabled = false,
  onPause,
  onResume,
  onEndInterview,
  onReconnect,
  className = '',
}: InterviewRoomHeaderProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Format countdown
  const formatCountdown = (sec: number) => {
    if (sec <= 0) return '00:00'
    const mins = Math.floor(sec / 60)
    const s = sec % 60
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`
  }

  // Connection badge config
  const renderConnectionPill = () => {
    const dotColors: Record<WebSocketConnectionStatus, string> = {
      connected: 'bg-emerald-500',
      connecting: 'bg-amber-400 animate-pulse',
      reconnecting: 'bg-amber-500 animate-pulse',
      reconciling: 'bg-blue-400 animate-pulse',
      disconnected: 'bg-slate-400',
      error: 'bg-rose-500',
    }

    const labelMap: Record<WebSocketConnectionStatus, string> = {
      connected: 'Live Sync',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...',
      reconciling: 'Syncing...',
      disconnected: 'Offline',
      error: 'Channel Error',
    }

    return (
      <div className="inline-flex items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-bg/80 border border-border text-[11px] font-medium text-foreground select-none"
          title={statusDetail || labelMap[connectionStatus]}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[connectionStatus]}`} />
          <span className="hidden sm:inline">{labelMap[connectionStatus]}</span>
        </span>
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && onReconnect && (
          <button
            type="button"
            onClick={onReconnect}
            className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Reconnect
          </button>
        )}
      </div>
    )
  }

  const effectiveRound = activeRoundType || session.rounds?.[session.currentRoundIndex || 0]?.roundType

  return (
    <>
      <header
        className={`h-14 flex-shrink-0 bg-card border-b border-border px-3 sm:px-5 flex items-center justify-between gap-3 select-none z-20 ${className}`}
      >
        {/* Left: Meeting Identification & Track Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
            <Video className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-heading font-bold text-xs sm:text-sm text-foreground truncate max-w-[140px] sm:max-w-[220px]">
              {session.targetRole || 'Interview Room'}
            </span>

            <span className="text-muted-foreground text-xs hidden sm:inline">•</span>

            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
              {formatRoundTitle(effectiveRound as any)}
            </span>

            <span className="text-[11px] font-mono text-muted-foreground hidden md:inline">
              Round 0{(session.currentRoundIndex || 0) + 1} of 0{session.totalRounds || session.rounds?.length || 1}
            </span>
          </div>
        </div>

        {/* Center / Right: Device Controls, Live Sync, Countdown & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {renderConnectionPill()}

          {/* Countdown Timer */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-bg border border-border font-mono text-xs font-bold text-foreground"
            title="Interview time remaining"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="tabular-nums">{formatCountdown(remainingSeconds)}</span>
          </div>

          {/* In-Meeting Device Quick Toggles */}
          <div className="flex items-center gap-1 pl-1 border-l border-border">
            {/* Camera Toggle */}
            <button
              type="button"
              onClick={onToggleCamera}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isCameraEnabled
                  ? 'bg-card text-foreground border-border hover:bg-secondary-bg'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}
              title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isCameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </button>

            {/* Microphone Toggle */}
            <button
              type="button"
              onClick={onToggleMic}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isMicEnabled
                  ? 'bg-card text-foreground border-border hover:bg-secondary-bg'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}
              title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* AI Speaker Voice Toggle */}
            <button
              type="button"
              onClick={onToggleAudioMute}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                !isAudioMuted
                  ? 'bg-card text-foreground border-border hover:bg-secondary-bg'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}
              title={isAudioMuted ? 'Unmute AI voice audio' : 'Mute AI voice audio'}
            >
              {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Session Lifecycle Buttons */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-border">
            {/* Pause / Resume */}
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                disabled={isDisabled}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="Resume interview"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                disabled={isDisabled}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-card hover:bg-secondary-bg border border-border text-foreground text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Pause interview"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            )}

            {/* End Interview Call */}
            <button
              type="button"
              onClick={() => setShowEndConfirm(true)}
              disabled={isDisabled || isEnding}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Leave / End Interview"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">End Call</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── End Interview Confirmation Modal ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>End Interview Call?</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to conclude this interview session? Your performance report will be generated based on answers submitted up to this point.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-secondary-bg cursor-pointer"
              >
                Stay in Room
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirm(false)
                  onEndInterview()
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                End & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
