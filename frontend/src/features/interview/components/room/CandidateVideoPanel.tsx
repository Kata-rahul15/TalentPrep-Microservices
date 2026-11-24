import { useEffect, useRef } from 'react'
import { Camera, CameraOff, Mic, MicOff, User } from 'lucide-react'

interface CandidateVideoPanelProps {
  mediaStream: MediaStream | null
  isCameraEnabled: boolean
  isMicEnabled: boolean
  candidateName?: string
  onToggleCamera: () => void
  onToggleMic?: () => void
  isSpeaking?: boolean
  className?: string
}

export default function CandidateVideoPanel({
  mediaStream,
  isCameraEnabled,
  isMicEnabled,
  candidateName = 'You',
  onToggleCamera,
  onToggleMic,
  isSpeaking = false,
  className = '',
}: CandidateVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const hasLiveVideoTrack = Boolean(
    mediaStream &&
    mediaStream.getVideoTracks().length > 0 &&
    mediaStream.getVideoTracks().some((track) => track.readyState === 'live')
  )

  const showVideoPreview = isCameraEnabled && hasLiveVideoTrack

  // Attach / Detach MediaStream to video element cleanly
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (showVideoPreview && mediaStream) {
      videoEl.srcObject = mediaStream
      videoEl.play().catch((err) => {
        // Autoplay may be restricted if unmuted
        console.warn('Webcam playback error:', err)
      })
    } else {
      // Detach stream immediately from preview
      try {
        videoEl.pause()
      } catch {}
      videoEl.srcObject = null
    }

    return () => {
      if (videoEl) {
        try {
          videoEl.pause()
        } catch {}
        videoEl.srcObject = null
      }
    }
  }, [showVideoPreview, mediaStream])

  const handlePanelToggleCamera = () => {
    if (isCameraEnabled && videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {}
      videoRef.current.srcObject = null
    }
    onToggleCamera()
  }

  // Get candidate initials
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] ${className}`}
    >
      {/* ── Always Mounted Video Element (Avoids Media Pipeline Thrashing) ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] ${showVideoPreview ? 'block' : 'hidden'}`}
      />

      {/* ── Camera Off / Placeholder UI ── */}
      {!showVideoPreview && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 text-white select-none relative p-4">
          {/* Candidate Avatar Initials */}
          <div className="w-16 h-16 rounded-full bg-slate-700/80 border-2 border-slate-600 flex items-center justify-center font-bold text-xl text-slate-200 shadow-md mb-2">
            {candidateName ? getInitials(candidateName) : <User className="w-8 h-8 text-slate-400" />}
          </div>

          <span className="text-xs font-semibold text-slate-300">
            Camera is turned off
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Click the camera icon to enable
          </span>
        </div>
      )}

      {/* ── Top-Right: Camera & Mic Action Overlay ── */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={handlePanelToggleCamera}
          className={`p-1.5 rounded-full backdrop-blur-md border transition-colors cursor-pointer ${
            isCameraEnabled
              ? 'bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800'
              : 'bg-rose-950/80 text-rose-300 border-rose-700/50 hover:bg-rose-900'
          }`}
          title={isCameraEnabled ? 'Turn off camera (Stops hardware stream)' : 'Turn on camera'}
          aria-label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
        </button>

        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-1.5 rounded-full backdrop-blur-md border transition-colors cursor-pointer ${
              isMicEnabled
                ? 'bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800'
                : 'bg-rose-950/80 text-rose-300 border-rose-700/50 hover:bg-rose-900'
            }`}
            title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
            aria-label={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* ── Bottom-Left: Candidate Identity & Speaking Indicator ── */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xs flex items-center gap-2">
          {/* Active audio speaking dot */}
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isSpeaking && isMicEnabled
                ? 'bg-emerald-400 animate-ping'
                : isMicEnabled
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
            }`}
          />

          <span className="text-xs font-semibold text-white truncate max-w-[140px]">
            {candidateName} (You)
          </span>

          {!isMicEnabled && (
            <MicOff className="w-3 h-3 text-rose-400 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
