import InterviewerAvatar from './InterviewerAvatar'
import type { AvatarAnimationState } from '../../types/interview.types'

interface AIInterviewerPanelProps {
  avatarState: AvatarAnimationState
  isAudioMuted?: boolean
  className?: string
}

export default function AIInterviewerPanel({
  avatarState,
  isAudioMuted = false,
  className = '',
}: AIInterviewerPanelProps) {
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col aspect-[4/3] sm:aspect-[16/10] md:aspect-[4/3] ${className}`}
    >
      {/* ── Premium AI Avatar Viewport ── */}
      <div className="flex-1 w-full h-full relative">
        <InterviewerAvatar state={avatarState} isMuted={isAudioMuted} />

        {/* Sole Visible Identity Label: Interviewer */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200 shadow-xs tracking-wide">
            Interviewer
          </span>
        </div>
      </div>
    </div>
  )
}
