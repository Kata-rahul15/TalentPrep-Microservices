import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCheck } from 'lucide-react'
import type { AvatarAnimationState } from '../../types/interview.types'

interface InterviewerAvatarProps {
  state: AvatarAnimationState
  isMuted?: boolean
  className?: string
}

export default function InterviewerAvatar({
  state,
  isMuted = false,
  className = '',
}: InterviewerAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Primary realistic digital human portrait asset
  const portraitSrc = '/interviewer-portrait.jpg'

  // Preload portrait image
  useEffect(() => {
    const img = new Image()
    img.src = portraitSrc
    img.onload = () => setImgLoaded(true)
    img.onerror = () => setImgError(true)
  }, [portraitSrc])

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 select-none ${className}`}
    >
      {/* ── Dynamic Ambient Aura based on Avatar State ── */}
      <AnimatePresence mode="wait">
        {state === 'speaking' && !isMuted && (
          <motion.div
            key="speaking-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Soft Emerald / Blue Acoustic Ripple */}
            <div className="absolute inset-0 bg-radial from-blue-500/15 via-emerald-500/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 ring-2 ring-emerald-500/30 ring-inset rounded-2xl animate-pulse" />
          </motion.div>
        )}

        {state === 'listening' && (
          <motion.div
            key="listening-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Attentive Cyan / Indigo Soft Halo */}
            <div className="absolute inset-0 bg-radial from-cyan-500/15 via-blue-500/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 ring-2 ring-cyan-500/30 ring-inset rounded-2xl animate-pulse" />
          </motion.div>
        )}

        {state === 'thinking' && (
          <motion.div
            key="thinking-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Thoughtful Amber / Violet Shimmer */}
            <div className="absolute inset-0 bg-radial from-amber-500/15 via-purple-500/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 ring-2 ring-amber-500/30 ring-inset rounded-2xl animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Portrait Viewport (Realistic Portrait or Illustrated Fallback) ── */}
      {!imgError ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          {/* Subtle natural micro-movement & breathing animation */}
          <motion.div
            className="w-full h-full relative flex items-center justify-center"
            animate={
              state === 'speaking'
                ? {
                    scale: [1, 1.012, 1],
                    y: [0, -1.5, 0],
                    transition: {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
                : state === 'listening'
                  ? {
                      scale: 1.015,
                      y: -1,
                      rotate: 0.35,
                      transition: {
                        duration: 0.8,
                        ease: 'easeOut',
                      },
                    }
                  : state === 'thinking'
                    ? {
                        scale: 0.995,
                        y: -1.5,
                        rotate: -0.35,
                        transition: {
                          duration: 1.2,
                          ease: 'easeInOut',
                        },
                      }
                    : {
                        // Idle natural breathing
                        scale: [1, 1.008, 1],
                        y: [0, -1, 0],
                        transition: {
                          duration: 4.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
            }
          >
            <img
              src={portraitSrc}
              alt="Interviewer"
              className={`w-full h-full object-cover object-top transition-opacity duration-700 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onError={() => setImgError(true)}
            />

            {/* Subtle Studio Lighting Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />
          </motion.div>
        </div>
      ) : (
        /* ── Fallback: Premium 2D Illustrated Corporate Avatar ── */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 text-white select-none relative p-4">
          <motion.div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-blue-500/40 p-1 flex items-center justify-center bg-slate-800/80 shadow-lg"
            animate={
              state === 'speaking'
                ? { scale: [1, 1.04, 1] }
                : state === 'listening'
                  ? { scale: 1.03 }
                  : state === 'thinking'
                    ? { rotate: [0, 3, -3, 0] }
                    : { scale: [1, 1.01, 1] }
            }
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-inner">
              <UserCheck className="w-12 h-12 text-blue-200" />
            </div>
          </motion.div>

          <span className="text-xs font-semibold text-slate-200 mt-2.5">
            Interviewer
          </span>
        </div>
      )}
    </div>
  )
}
