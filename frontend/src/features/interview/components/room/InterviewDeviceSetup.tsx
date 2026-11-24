import { useState, useEffect, useRef } from 'react'
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { InterviewSessionResponse } from '../../types/interview.types'
import { formatRoundTitle } from '../../utils/interviewFormatters'

interface InterviewDeviceSetupProps {
  session: InterviewSessionResponse
  candidateName?: string
  onStartInterview: (settings: {
    stream: MediaStream | null
    cameraEnabled: boolean
    micEnabled: boolean
    speakerEnabled: boolean
  }) => void
  isStarting?: boolean
  className?: string
}

export default function InterviewDeviceSetup({
  session,
  candidateName = 'Candidate',
  onStartInterview,
  isStarting = false,
  className = '',
}: InterviewDeviceSetupProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)

  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const [audioLevel, setAudioLevel] = useState(0) // 0 to 100
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false)

  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const hasHandedOffStreamRef = useRef(false)
  const isMountedRef = useRef(true)
  const currentInitIdRef = useRef(0)

  // Stop all video tracks across streams
  const stopAllVideoTracks = (targetStream?: MediaStream | null) => {
    const s = targetStream || streamRef.current || stream
    if (s) {
      s.getVideoTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch {}
        try {
          s.removeTrack(track)
        } catch {}
      })
    }
  }

  // 1. Initialize Device Permissions & Media Stream safely
  const initDevices = async () => {
    const initId = ++currentInitIdRef.current
    setPermissionError(null)

    // Stop existing video/audio tracks before requesting new ones
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        if (isMountedRef.current) {
          setPermissionError('Media devices (camera/microphone) are not supported by your browser.')
        }
        return
      }

      // Request both video & audio
      let mediaStream: MediaStream | null = null
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        if (!isMountedRef.current || currentInitIdRef.current !== initId) {
          // If unmounted or superseded while waiting, release immediately!
          mediaStream.getTracks().forEach((t) => {
            try { t.enabled = false; t.stop() } catch {}
          })
          return
        }
        setCameraPermission('granted')
        setMicPermission('granted')
      } catch (err: any) {
        console.warn('Initial combined getUserMedia failed:', err)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (!isMountedRef.current || currentInitIdRef.current !== initId) {
            mediaStream.getTracks().forEach((t) => {
              try { t.enabled = false; t.stop() } catch {}
            })
            return
          }
          setCameraPermission('granted')
          setMicPermission('denied')
        } catch {
          if (!isMountedRef.current || currentInitIdRef.current !== initId) return
          setCameraPermission('denied')
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            if (!isMountedRef.current || currentInitIdRef.current !== initId) {
              mediaStream.getTracks().forEach((t) => {
                try { t.enabled = false; t.stop() } catch {}
              })
              return
            }
            setMicPermission('granted')
          } catch {
            setMicPermission('denied')
          }
        }
      }

      if (!isMountedRef.current || currentInitIdRef.current !== initId) {
        if (mediaStream) {
          mediaStream.getTracks().forEach((t) => {
            try { t.enabled = false; t.stop() } catch {}
          })
        }
        return
      }

      streamRef.current = mediaStream
      setStream(mediaStream)

      // Setup audio analyzer if audio tracks exist
      if (mediaStream && mediaStream.getAudioTracks().length > 0) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {})
          }
          const audioCtx = new AudioCtx()
          audioContextRef.current = audioCtx
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 64
          analyserRef.current = analyser

          const source = audioCtx.createMediaStreamSource(mediaStream)
          source.connect(analyser)

          const dataArray = new Uint8Array(analyser.frequencyBinCount)

          const updateAudioMeter = () => {
            if (!analyserRef.current || !isMountedRef.current) return
            analyserRef.current.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i]
            }
            const average = sum / dataArray.length
            const level = Math.min(100, Math.round((average / 128) * 100))
            setAudioLevel(level)
            animFrameRef.current = requestAnimationFrame(updateAudioMeter)
          }

          updateAudioMeter()
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current || currentInitIdRef.current !== initId) return
      console.warn('Device check error:', err)
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera or microphone access was denied. You can still join using text mode or enable permissions in browser settings.'
          : 'Unable to access audio/video hardware.'
      )
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    void initDevices()

    return () => {
      isMountedRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
      if (videoPreviewRef.current) {
        try {
          videoPreviewRef.current.pause()
        } catch {}
        videoPreviewRef.current.srcObject = null
      }
      // If user unmounts/navigates away without entering the room, release all camera/mic tracks!
      if (!hasHandedOffStreamRef.current && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.enabled = false
            track.stop()
          } catch {}
        })
        streamRef.current = null
      }
    }
  }, [])

  // Attach to preview video element
  useEffect(() => {
    const videoEl = videoPreviewRef.current
    if (videoEl && stream && cameraEnabled) {
      videoEl.srcObject = stream
      videoEl.play().catch(() => {})
    } else if (videoEl) {
      try {
        videoEl.pause()
      } catch {}
      videoEl.srcObject = null
    }
  }, [stream, cameraEnabled])

  // Toggle Camera in setup
  const handleToggleCamera = async () => {
    if (cameraEnabled) {
      // 1. Immediately pause and detach preview video element
      if (videoPreviewRef.current) {
        try {
          videoPreviewRef.current.pause()
        } catch {}
        videoPreviewRef.current.srcObject = null
      }

      // 2. Stop every active video track using MediaStreamTrack.stop()
      const currentStream = streamRef.current || stream
      if (currentStream) {
        currentStream.getVideoTracks().forEach((track) => {
          try {
            track.enabled = false
            track.stop()
          } catch {}
          try {
            currentStream.removeTrack(track)
          } catch {}
        })
        const remainingAudioTracks = currentStream.getAudioTracks()
        const audioOnlyStream = remainingAudioTracks.length > 0 ? new MediaStream(remainingAudioTracks) : null
        streamRef.current = audioOnlyStream
        setStream(audioOnlyStream)
      } else {
        streamRef.current = null
        setStream(null)
      }
      setCameraEnabled(false)
    } else {
      // 2. Acquire fresh video stream on Camera ON
      try {
        // Stop any dangling video tracks first
        stopAllVideoTracks()

        const freshStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        const newTrack = freshStream.getVideoTracks()[0]
        // Stop any surplus tracks
        freshStream.getVideoTracks().slice(1).forEach((t) => {
          try { t.enabled = false; t.stop() } catch {}
        })
        freshStream.getAudioTracks().forEach((t) => {
          try { t.enabled = false; t.stop() } catch {}
        })

        if (newTrack) {
          const audioTracks = (streamRef.current || stream)?.getAudioTracks() || []
          const updatedStream = new MediaStream([...audioTracks, newTrack])
          streamRef.current = updatedStream
          setStream(updatedStream)
          setCameraEnabled(true)
          setCameraPermission('granted')
        }
      } catch (err) {
        console.warn('Camera re-enable failed in device setup:', err)
        setCameraEnabled(false)
        setPermissionError('Camera access was denied or device is unavailable.')
      }
    }
  }

  // Toggle Mic
  const handleToggleMic = () => {
    const nextState = !micEnabled
    setMicEnabled(nextState)
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = nextState
      })
    }
  }

  // Play Speaker Test Chime (Harmonic dual-tone)
  const handleTestSpeaker = () => {
    if (isPlayingAudioTest) return
    setIsPlayingAudioTest(true)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) {
        setIsPlayingAudioTest(false)
        return
      }

      const ctx = new AudioCtx()
      const now = ctx.currentTime

      // Tone 1: 523.25 Hz (C5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(523.25, now)
      gain1.gain.setValueAtTime(0.15, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.35)

      // Tone 2: 659.25 Hz (E5)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(659.25, now + 0.2)
      gain2.gain.setValueAtTime(0.15, now + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.2)
      osc2.stop(now + 0.7)

      setTimeout(() => {
        setIsPlayingAudioTest(false)
        ctx.close().catch(() => {})
      }, 800)
    } catch {
      setIsPlayingAudioTest(false)
    }
  }

  const handleProceed = () => {
    hasHandedOffStreamRef.current = true
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
    }
    if (videoPreviewRef.current) {
      try {
        videoPreviewRef.current.pause()
      } catch {}
      videoPreviewRef.current.srcObject = null
    }

    // Clean stream: if camera is disabled, ensure no video tracks are handed off!
    const activeStream = streamRef.current || stream
    let handoffStream = activeStream
    if (!cameraEnabled && activeStream) {
      activeStream.getVideoTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch {}
      })
      const audioTracks = activeStream.getAudioTracks()
      handoffStream = audioTracks.length > 0 ? new MediaStream(audioTracks) : null
    }

    onStartInterview({
      stream: handoffStream,
      cameraEnabled,
      micEnabled,
      speakerEnabled,
    })
  }

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 ${className}`}>
      {/* ── Briefing & Header ── */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Pre-Interview Device Check
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {session.durationMinutes} Minutes • Level: {session.difficulty}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              Prepare your camera and microphone
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Candidate: <strong className="text-foreground">{candidateName}</strong> • Target Role:{' '}
              <strong className="text-foreground">{session.targetRole || 'Software Engineer'}</strong>
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* ── Error Banner if any ── */}
        {permissionError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{permissionError}</p>
            </div>
            <button
              type="button"
              onClick={initDevices}
              className="inline-flex items-center gap-1 font-semibold text-xs underline hover:no-underline cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* ── Two Column Device Setup ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left: Camera Video Preview */}
          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Camera Preview
              </span>
              <span
                className={`text-[11px] font-medium ${
                  cameraPermission === 'granted'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                }`}
              >
                {cameraPermission === 'granted' ? 'Camera Ready' : 'Permission Optional'}
              </span>
            </div>

            <div className="relative flex-1 min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner">
              {cameraEnabled && stream && stream.getVideoTracks().length > 0 ? (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400 select-none">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-2">
                    <CameraOff className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Camera is off</p>
                  <p className="text-[11px] text-slate-500 max-w-[200px]">
                    You can attend with camera off; a professional placeholder will be shown.
                  </p>
                </div>
              )}

              {/* Camera Toggle Overlay */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className={`absolute bottom-3 right-3 p-2 rounded-xl backdrop-blur-xs border transition-colors cursor-pointer ${
                  cameraEnabled
                    ? 'bg-slate-900/80 text-white border-slate-700/60 hover:bg-slate-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700/50 hover:bg-rose-900'
                }`}
                title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {cameraEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right: Audio, Mic & Speaker Verification */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Microphone Check Card */}
            <div className="p-4 rounded-xl border border-border bg-secondary-bg/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Microphone Input</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {micPermission === 'denied'
                        ? 'Mic access denied (Text mode ready)'
                        : micEnabled
                          ? 'Speak to verify input level'
                          : 'Microphone muted'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    micEnabled
                      ? 'bg-card text-foreground border-border hover:bg-secondary-bg'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  }`}
                  title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Dynamic Audio Level Meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Input Activity</span>
                  <span>{micEnabled ? `${audioLevel}%` : 'Muted'}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      audioLevel > 60
                        ? 'bg-emerald-500'
                        : audioLevel > 20
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                    }`}
                    style={{ width: micEnabled ? `${Math.max(4, audioLevel)}%` : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Speaker Output Test Card */}
            <div className="p-4 rounded-xl border border-border bg-secondary-bg/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Speaker / Audio Output</h3>
                    <p className="text-[11px] text-muted-foreground">Test AI voice playback audio</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakerEnabled((prev) => !prev)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      speakerEnabled
                        ? 'bg-card text-foreground border-border hover:bg-secondary-bg'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                    }`}
                    title={speakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSpeaker}
                    disabled={isPlayingAudioTest || !speakerEnabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-secondary-bg border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudioTest ? 'animate-bounce text-purple-600' : ''}`} />
                    <span>{isPlayingAudioTest ? 'Playing...' : 'Play Test Sound'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Evaluation Schedule Quick Review */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Interview Structure
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {session.rounds?.map((r, i) => (
                  <span
                    key={r.id || i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary-bg text-foreground font-medium text-xs border border-border/80"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">0{r.roundOrder}</span>
                    <span>{formatRoundTitle(r.roundType)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Action ── */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            You can modify camera and microphone toggles at any time inside the room.
          </p>

          <button
            type="button"
            onClick={handleProceed}
            disabled={isStarting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entering Interview Room...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Interview Room</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
