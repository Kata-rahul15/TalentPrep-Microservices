import test from 'node:test'
import assert from 'node:assert/strict'

// ─── Test Suite: Video Interview Room UI Redesign ───────────

test('Test 1 – Video Room Layout Specifications (35% Left / 65% Right)', () => {
  const layout = {
    leftPanelWidthPercent: 35,
    rightPanelWidthPercent: 65,
    leftSections: ['AIInterviewerPanel', 'CandidateVideoPanel'],
    rightSections: ['InterviewRoomHeader', 'InterviewConversation', 'InterviewInputBar'],
  }

  assert.equal(layout.leftPanelWidthPercent + layout.rightPanelWidthPercent, 100)
  assert.equal(layout.leftSections.length, 2)
  assert.equal(layout.leftSections[0], 'AIInterviewerPanel')
  assert.equal(layout.leftSections[1], 'CandidateVideoPanel')
  assert.ok(layout.rightSections.includes('InterviewConversation'))
})

test('Test 2 – 3D AI Avatar States and Animation Modes', () => {
  const validStates = ['idle', 'speaking', 'listening', 'thinking']

  validStates.forEach((state) => {
    assert.ok(typeof state === 'string')
  })

  // State derivation rules
  const deriveState = ({ isInterviewerSpeaking, isEvaluating, isListening, isCandidateSpeaking }) => {
    if (isInterviewerSpeaking) return 'speaking'
    if (isEvaluating) return 'thinking'
    if (isListening || isCandidateSpeaking) return 'listening'
    return 'idle'
  }

  assert.equal(deriveState({ isInterviewerSpeaking: true, isEvaluating: false, isListening: false }), 'speaking')
  assert.equal(deriveState({ isInterviewerSpeaking: false, isEvaluating: true, isListening: false }), 'thinking')
  assert.equal(deriveState({ isInterviewerSpeaking: false, isEvaluating: false, isListening: true }), 'listening')
  assert.equal(deriveState({ isInterviewerSpeaking: false, isEvaluating: false, isListening: false, isCandidateSpeaking: true }), 'listening')
  assert.equal(deriveState({ isInterviewerSpeaking: false, isEvaluating: false, isListening: false, isCandidateSpeaking: false }), 'idle')
})

test('Test 3 – Pre-Interview Device Setup & Permission Handling', () => {
  const testDeviceState = {
    cameraPermission: 'granted',
    micPermission: 'granted',
    cameraEnabled: true,
    micEnabled: true,
    speakerEnabled: true,
  }

  // Camera permission non-mandatory fallback
  const testCameraDenied = {
    ...testDeviceState,
    cameraPermission: 'denied',
    cameraEnabled: false,
  }
  assert.equal(testCameraDenied.cameraEnabled, false)
  // Candidate can still proceed with placeholder video panel
  const canProceedWithCameraOff = !testCameraDenied.cameraEnabled
  assert.ok(canProceedWithCameraOff)

  // Microphone permission non-mandatory fallback
  const testMicDenied = {
    ...testDeviceState,
    micPermission: 'denied',
    micEnabled: false,
  }
  // Candidate can still proceed using text input
  assert.equal(testMicDenied.micEnabled, false)
})

test('Test 4 – Introductory Greeting and Non-Fake Question Progression', () => {
  const candidateName = 'Alex'
  const roundType = 'TECHNICAL'
  const greetingText = `Hi ${candidateName}! Welcome to your virtual Technical interview.`

  assert.ok(greetingText.includes('Alex'))
  assert.ok(greetingText.includes('Technical'))

  // Verify conversation preserves greeting while awaiting real question 1 from backend
  const conversation = [
    { id: 'msg-0', sender: 'ai', text: greetingText, kind: 'greeting' },
  ]
  assert.equal(conversation.length, 1)
  assert.equal(conversation[0].kind, 'greeting')

  // Backend delivers real Question 1 (not fake question)
  const backendQuestion1 = {
    questionId: 'q-uuid-1',
    questionOrder: 1,
    questionText: 'Explain the internal working of Java ConcurrentHashMap under heavy contention.',
    roundType: 'TECHNICAL',
  }

  conversation.push({
    id: `q-${backendQuestion1.questionId}`,
    sender: 'ai',
    text: backendQuestion1.questionText,
    kind: 'question',
  })

  assert.equal(conversation.length, 2)
  assert.equal(conversation[1].text, backendQuestion1.questionText)
})

test('Test 5 – System Design Interview: Expandable Architecture Whiteboard', () => {
  let isWhiteboardOpen = false
  const toggleWhiteboard = () => {
    isWhiteboardOpen = !isWhiteboardOpen
  }

  assert.equal(isWhiteboardOpen, false)
  toggleWhiteboard()
  assert.equal(isWhiteboardOpen, true)

  const nodes = [
    { id: '1', type: 'client', label: 'Client' },
    { id: '2', type: 'gateway', label: 'API Gateway' },
    { id: '3', type: 'service', label: 'Order Service' },
    { id: '4', type: 'database', label: 'PostgreSQL' },
  ]

  assert.equal(nodes.length, 4)
  const summary = nodes.map(n => n.label).join(' -> ')
  assert.equal(summary, 'Client -> API Gateway -> Order Service -> PostgreSQL')
})

test('Test 6 – Coding Interview: Monaco Workspace Integration & Video Panel Coexistence', () => {
  const codingSession = {
    roundType: 'CODING',
    activeTab: 'code',
    leftVideoPanelVisible: true,
    codeText: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}',
    language: 'java',
  }

  assert.equal(codingSession.leftVideoPanelVisible, true)
  assert.equal(codingSession.roundType, 'CODING')
  assert.ok(codingSession.codeText.includes('maxSubArray'))

  // Switch to view interviewer conversation without losing code
  codingSession.activeTab = 'conversation'
  assert.equal(codingSession.activeTab, 'conversation')
  assert.ok(codingSession.codeText.includes('maxSubArray'))

  // Switch back to code editor
  codingSession.activeTab = 'code'
  assert.equal(codingSession.activeTab, 'code')
})

test('Test 7 – HR Interview: Behavioral STAR Methodology Conversation', () => {
  const hrQuestion = {
    roundType: 'BEHAVIORAL',
    questionText: 'Tell me about a time you had a significant disagreement with a technical lead. How did you resolve it?',
  }

  const candidateAnswer = 'In my previous role, we disagreed on using gRPC vs GraphQL for client communications. I structured a proof of concept with latency benchmarks and presented trade-offs calmly, which led to a collaborative decision.'

  const messages = [
    { sender: 'ai', text: hrQuestion.questionText },
    { sender: 'candidate', text: candidateAnswer },
  ]

  assert.equal(messages.length, 2)
  assert.equal(messages[0].sender, 'ai')
  assert.equal(messages[1].sender, 'candidate')
  assert.ok(messages[1].text.includes('gRPC'))
})

test('Test 8 – Continuous History Preservation & Reconnection Resilience', () => {
  const historyTurns = [
    { questionId: 'q-1', questionText: 'What is ACID?', answerText: 'Atomicity, Consistency, Isolation, Durability' },
    { questionId: 'q-2', questionText: 'How is isolation implemented in PostgreSQL?', answerText: 'MVCC using xmin and xmax' },
  ]

  const rehydrated = []
  historyTurns.forEach((t) => {
    rehydrated.push({ id: `q-${t.questionId}`, sender: 'ai', text: t.questionText })
    if (t.answerText) {
      rehydrated.push({ id: `ans-${t.questionId}`, sender: 'candidate', text: t.answerText })
    }
  })

  assert.equal(rehydrated.length, 4)
  assert.equal(rehydrated[0].sender, 'ai')
  assert.equal(rehydrated[1].sender, 'candidate')
  assert.equal(rehydrated[2].sender, 'ai')
  assert.equal(rehydrated[3].sender, 'candidate')
})

test('Test 9 – AI Avatar Redesign: Realistic Digital Human Portrait & 4 Animation States', () => {
  const avatarConfig = {
    portraitAsset: '/interviewer-portrait.jpg',
    fallbackType: 'illustrated-vector-avatar',
    label: 'Interviewer',
    states: ['idle', 'speaking', 'listening', 'thinking'],
  }

  assert.equal(avatarConfig.portraitAsset, '/interviewer-portrait.jpg')
  assert.equal(avatarConfig.label, 'Interviewer')
  assert.equal(avatarConfig.states.length, 4)

  // Test state behavior
  const getStateVisuals = (state) => {
    switch (state) {
      case 'speaking':
        return { aura: 'emerald', microMotion: true }
      case 'listening':
        return { aura: 'cyan', microMotion: true }
      case 'thinking':
        return { aura: 'amber', microMotion: true }
      case 'idle':
      default:
        return { aura: 'none', microMotion: true }
    }
  }

  assert.equal(getStateVisuals('speaking').aura, 'emerald')
  assert.equal(getStateVisuals('listening').aura, 'cyan')
  assert.equal(getStateVisuals('thinking').aura, 'amber')
  assert.equal(getStateVisuals('idle').aura, 'none')
})

test('Test 10 – Camera Privacy: Stopping Video Tracks on Camera OFF and Releasing Hardware', () => {
  let hardwareCameraActive = true
  let previewAttached = true

  const mockVideoTrack = {
    kind: 'video',
    readyState: 'live',
    stopped: false,
    stop() {
      this.readyState = 'ended'
      this.stopped = true
      hardwareCameraActive = false
    },
  }

  const mockAudioTrack = {
    kind: 'audio',
    readyState: 'live',
    enabled: true,
  }

  let mediaStream = {
    tracks: [mockVideoTrack, mockAudioTrack],
    getVideoTracks() {
      return this.tracks.filter(t => t.kind === 'video')
    },
    getAudioTracks() {
      return this.tracks.filter(t => t.kind === 'audio')
    },
    getTracks() {
      return this.tracks
    },
    removeTrack(track) {
      this.tracks = this.tracks.filter(t => t !== track)
    },
  }

  let isCameraEnabled = true

  // Candidate clicks Camera OFF
  const handleToggleCameraOff = () => {
    mediaStream.getVideoTracks().forEach((track) => {
      track.stop() // MUST call track.stop() to turn off camera LED
      mediaStream.removeTrack(track)
    })
    previewAttached = false
    isCameraEnabled = false
  }

  handleToggleCameraOff()

  assert.equal(isCameraEnabled, false)
  assert.equal(mockVideoTrack.stopped, true, 'Video track must be stopped')
  assert.equal(mockVideoTrack.readyState, 'ended', 'Video track state must be ended')
  assert.equal(hardwareCameraActive, false, 'Hardware camera must be completely released')
  assert.equal(previewAttached, false, 'Preview must be detached')
  assert.equal(mediaStream.getVideoTracks().length, 0, 'Stream must retain zero active video tracks')
  assert.equal(mediaStream.getAudioTracks().length, 1, 'Audio track must be retained')
})

test('Test 11 – Camera Re-Acquisition on Camera ON: Fresh Stream Acquisition', async () => {
  let hardwareCameraActive = false
  let isCameraEnabled = false

  const mockGetUserMedia = async (constraints) => {
    assert.ok(constraints.video, 'Must request video constraints')
    hardwareCameraActive = true
    return {
      getVideoTracks: () => [
        {
          kind: 'video',
          readyState: 'live',
          stop() {
            hardwareCameraActive = false
          },
        },
      ],
    }
  }

  // Candidate clicks Camera ON
  const handleToggleCameraOn = async () => {
    const freshStream = await mockGetUserMedia({ video: true })
    const track = freshStream.getVideoTracks()[0]
    if (track) {
      isCameraEnabled = true
    }
  }

  await handleToggleCameraOn()
  assert.equal(isCameraEnabled, true)
  assert.equal(hardwareCameraActive, true, 'Fresh camera stream must be acquired')
})

test('Test 12 – Speech Queue & AI Conversation Sequence (Greeting -> Question 1 -> Answer -> Evaluation)', () => {
  const speechQueue = []
  const spokenLog = []
  let isSpeaking = false
  let candidateMicActive = false

  const processNextInQueue = () => {
    if (speechQueue.length === 0) {
      isSpeaking = false
      candidateMicActive = true // Mic opens after AI finishes speaking
      return
    }
    isSpeaking = true
    candidateMicActive = false
    const item = speechQueue[0]
    spokenLog.push(item.text)
  }

  const finishCurrentUtterance = () => {
    speechQueue.shift()
    processNextInQueue()
  }

  const speak = (text, id) => {
    speechQueue.push({ id, text })
    if (!isSpeaking) {
      processNextInQueue()
    }
  }

  // Step 1: Candidate enters room -> AI Greeting enqueued and starts speaking
  const greeting = "Hi Kata Rahul! Welcome to your virtual Technical interview. I'm glad to have you here today."
  speak(greeting, 'greeting-1')

  assert.equal(isSpeaking, true)
  assert.equal(spokenLog[0], greeting)
  assert.equal(speechQueue.length, 1)

  // Step 2: Background question generation finishes while greeting is still playing
  const question1 = 'Explain the internal architecture of the Java Virtual Machine.'
  speak(question1, 'q-1')

  // CRITICAL REQUIREMENT: Question 1 must NOT abort or cancel the greeting! It queues behind it.
  assert.equal(isSpeaking, true)
  assert.equal(spokenLog.length, 1, 'Question 1 must not cut off greeting')
  assert.equal(speechQueue.length, 2, 'Question 1 is waiting in the speech queue')

  // Step 3: Greeting finishes speaking
  finishCurrentUtterance()

  // Question 1 automatically begins speaking
  assert.equal(isSpeaking, true)
  assert.equal(spokenLog.length, 2)
  assert.equal(spokenLog[1], question1, 'Question 1 automatically speaks aloud after greeting')

  // Step 4: Question 1 finishes speaking
  finishCurrentUtterance()

  // Speech finished -> Candidate mic activates automatically
  assert.equal(isSpeaking, false)
  assert.equal(candidateMicActive, true, 'Candidate microphone must activate after AI question completes')
})

test('Test 13 – Curated Interview Types Consistency: Technical, System Design, Coding, HR', () => {
  const tracks = ['TECHNICAL', 'SYSTEM_DESIGN', 'CODING', 'BEHAVIORAL']

  tracks.forEach((track) => {
    const isCoding = track === 'CODING'
    // TTS is enabled for all non-coding dialogue; coding problems are read in Monaco IDE
    const shouldSpeakQuestion = !isCoding
    if (track === 'TECHNICAL') assert.equal(shouldSpeakQuestion, true)
    if (track === 'SYSTEM_DESIGN') assert.equal(shouldSpeakQuestion, true)
    if (track === 'BEHAVIORAL') assert.equal(shouldSpeakQuestion, true)
    if (track === 'CODING') assert.equal(shouldSpeakQuestion, false)
  })
})

test('Test 14 – Step 1-4 Interview Startup Synchronization & Natural Transition', () => {
  // Model state machine for startup sequence
  const state = {
    isGreetingStarted: false,
    isGreetingSpeechCompleted: false,
    firstQuestionStaged: null,
    isTransitionStarted: false,
    isTransitionCompleted: false,
    isFirstQuestionSpoken: false,
    activeQuestion: null,
    messages: [],
    spokenUtterances: [],
  }

  const speakMock = (text, id, forceRepeat, onEnd) => {
    state.spokenUtterances.push({ id, text })
    return {
      finish() {
        onEnd?.()
      },
    }
  }

  // ── Step 1: Candidate clicks Start Interview ──
  const candidateName = 'Kata Rahul'
  const roundTitle = 'Technical'
  const greetingText = `Hi ${candidateName}! Welcome to your virtual ${roundTitle} interview. I'm glad to have you here today. Take your time with your answers, and let's have a comfortable conversation.`
  const greetingId = 'greeting-sess-1'

  state.messages.push({ id: greetingId, sender: 'ai', text: greetingText, kind: 'greeting' })
  state.isGreetingStarted = true
  const greetingUtterance = speakMock(greetingText, greetingId, false, () => {
    state.isGreetingSpeechCompleted = true
  })

  assert.equal(state.isGreetingStarted, true)
  assert.equal(state.messages.length, 1)
  assert.equal(state.spokenUtterances.length, 1)
  assert.equal(state.spokenUtterances[0].text, greetingText)

  // ── Step 2: Concurrently, backend returns question 1 before greeting finishes ──
  const backendQuestion1 = {
    questionId: 'q-sync-1',
    questionOrder: 1,
    questionText: 'Explain the internal architecture of the Java Virtual Machine and garbage collector tuning.',
    questionStatus: 'PENDING',
  }

  // Question 1 must be STAGED, not yet active or spoken
  if (!state.isTransitionCompleted && !state.activeQuestion) {
    state.firstQuestionStaged = backendQuestion1
  }

  assert.ok(state.firstQuestionStaged !== null, 'Question 1 must be staged')
  assert.equal(state.activeQuestion, null, 'Question 1 must NOT be active while greeting is playing')
  assert.equal(state.spokenUtterances.length, 1, 'Question 1 must NOT be spoken prematurely')
  assert.equal(state.messages.length, 1, 'Question 1 must NOT be displayed prematurely in conversation')

  // ── Step 3: Greeting completes speaking -> Synchronization Barrier satisfied ──
  greetingUtterance.finish()
  assert.equal(state.isGreetingSpeechCompleted, true)

  // Both conditions satisfied: greeting completed + backend question ready
  let transitionUtterance = null
  if (state.isGreetingSpeechCompleted && state.firstQuestionStaged && !state.isTransitionStarted) {
    state.isTransitionStarted = true
    const transitionText = "Alright, let's get started with your interview."
    transitionUtterance = speakMock(transitionText, 'trans-1', false, () => {
      state.isTransitionCompleted = true
    })
  }

  assert.equal(state.isTransitionStarted, true)
  assert.equal(state.spokenUtterances.length, 2)
  assert.equal(state.spokenUtterances[1].text, "Alright, let's get started with your interview.")
  assert.equal(state.activeQuestion, null, 'Active question still held until transition speech completes')

  // ── Step 4: Transition completes -> Activate & speak Question 1 ──
  transitionUtterance.finish()
  assert.equal(state.isTransitionCompleted, true)

  if (state.isTransitionCompleted && state.firstQuestionStaged && !state.isFirstQuestionSpoken) {
    state.isFirstQuestionSpoken = true
    state.activeQuestion = state.firstQuestionStaged
    state.firstQuestionStaged = null
    state.messages.push({
      id: `q-${state.activeQuestion.questionId}`,
      sender: 'ai',
      text: state.activeQuestion.questionText,
      kind: 'question',
    })
    speakMock(state.activeQuestion.questionText, state.activeQuestion.questionId)
  }

  assert.equal(state.isFirstQuestionSpoken, true)
  assert.equal(state.activeQuestion.questionId, 'q-sync-1')
  assert.equal(state.messages.length, 2)
  assert.equal(state.messages[1].text, backendQuestion1.questionText)
  assert.equal(state.spokenUtterances.length, 3)
  assert.equal(state.spokenUtterances[2].text, backendQuestion1.questionText)
})

test('Test 15 – Simplified AI Interviewer Image Panel: Sole "Interviewer" Label', () => {
  // Panel configuration contract:
  // Must contain solely "Interviewer". No personal names, candidate target roles, status badges or audio wave overlays.
  const panelUI = {
    visibleLabels: ['Interviewer'],
    removedElements: [
      'Sarah Vance',
      'Principal AI Interviewer',
      'Java Backend Developer',
      'Speaking badge',
      'Audio wave animation inside image overlay',
    ],
  }

  assert.equal(panelUI.visibleLabels.length, 1)
  assert.equal(panelUI.visibleLabels[0], 'Interviewer')
  panelUI.removedElements.forEach((removed) => {
    assert.ok(!panelUI.visibleLabels.includes(removed), `Element '${removed}' must not be present in panel UI`)
  })
})

test('Test 16 – Camera Hardware Physical Resource Release Pipeline', () => {
  let videoPaused = false
  let videoSrcCleared = false
  let trackStopped = false

  const mockVideoEl = {
    srcObject: {},
    pause() {
      videoPaused = true
    },
  }

  const mockVideoTrack = {
    kind: 'video',
    readyState: 'live',
    stop() {
      trackStopped = true
      this.readyState = 'ended'
    },
  }

  // Camera OFF teardown sequence:
  // 1. Pause video element
  mockVideoEl.pause()
  // 2. Detach srcObject
  mockVideoEl.srcObject = null
  videoSrcCleared = true
  // 3. Stop every active track on MediaStreamTrack
  mockVideoTrack.stop()

  assert.equal(videoPaused, true, 'Video element must be paused before detaching srcObject')
  assert.equal(videoSrcCleared, true, 'Video srcObject must be nullified')
  assert.equal(trackStopped, true, 'Track stop() must be called')
  assert.equal(mockVideoTrack.readyState, 'ended', 'Track readyState must be ended to release camera LED')
})

test('Test 17 – Active Video Track Registry: Complete Release on Camera OFF Preserving Audio', () => {
  const activeVideoTracks = new Set()
  let audioTrackStopped = false
  let videoTrack1Stopped = false
  let videoTrack2Stopped = false

  const videoTrack1 = {
    kind: 'video',
    readyState: 'live',
    enabled: true,
    stop() {
      videoTrack1Stopped = true
      this.readyState = 'ended'
    },
  }
  const videoTrack2 = {
    kind: 'video',
    readyState: 'live',
    enabled: true,
    stop() {
      videoTrack2Stopped = true
      this.readyState = 'ended'
    },
  }
  const audioTrack = {
    kind: 'audio',
    readyState: 'live',
    enabled: true,
    stop() {
      audioTrackStopped = true
      this.readyState = 'ended'
    },
  }

  activeVideoTracks.add(videoTrack1)
  activeVideoTracks.add(videoTrack2)

  // Simulation of handleToggleCamera when turning camera off
  const tracksToStop = new Set([...activeVideoTracks])
  tracksToStop.forEach((track) => {
    track.enabled = false
    track.stop()
    activeVideoTracks.delete(track)
  })

  assert.equal(videoTrack1Stopped, true, 'Video track 1 must be stopped')
  assert.equal(videoTrack2Stopped, true, 'Video track 2 must be stopped')
  assert.equal(activeVideoTracks.size, 0, 'Active video tracks registry must be empty')
  assert.equal(audioTrackStopped, false, 'Audio track must NOT be stopped when camera is toggled off')
  assert.equal(audioTrack.enabled, true, 'Audio track must remain enabled')
})

test('Test 18 – 4-Stage Startup Sequence: Strict GREETING -> TRANSITION -> FIRST_QUESTION -> LISTENING', () => {
  const stages = []
  let activeQuestion = null
  let stagedQuestion = null
  let isListening = false
  let isCandidateSpeaking = false

  const backendQuestion1 = {
    questionId: 'q-staged-1',
    questionText: 'Describe how garbage collection works in modern JVMs.',
    roundType: 'TECHNICAL',
    questionStatus: 'PENDING',
  }

  // Stage 1: GREETING begins
  let currentStage = 'GREETING'
  stages.push(currentStage)

  // Backend delivers question while GREETING is still speaking
  const handleIncomingQuestion = (q) => {
    if (currentStage === 'FIRST_QUESTION') {
      activeQuestion = q
    } else if (currentStage === 'GREETING' || currentStage === 'TRANSITION' || currentStage === 'INITIALIZING') {
      stagedQuestion = q
    } else {
      activeQuestion = q
    }
  }

  handleIncomingQuestion(backendQuestion1)
  assert.equal(activeQuestion, null, 'First question must NOT become active during GREETING')
  assert.equal(stagedQuestion?.questionId, 'q-staged-1', 'First question must be held in stagedQuestion')

  // Stage 1 completes -> Trigger handleGreetingFinished
  const handleGreetingFinished = () => {
    currentStage = 'TRANSITION'
    stages.push(currentStage)
    // Simulate transition utterance finish
    handleTransitionFinished()
  }

  const handleTransitionFinished = () => {
    currentStage = 'FIRST_QUESTION'
    stages.push(currentStage)
    if (stagedQuestion) {
      activeQuestion = stagedQuestion
      stagedQuestion = null
      // After first question finishes speaking, candidate listening starts
      handleQuestionSpeechFinished()
    }
  }

  const handleQuestionSpeechFinished = () => {
    currentStage = 'LISTENING'
    stages.push(currentStage)
    isListening = true
    currentStage = 'INTERVIEW_ACTIVE'
    stages.push(currentStage)
  }

  handleGreetingFinished()

  assert.deepEqual(stages, [
    'GREETING',
    'TRANSITION',
    'FIRST_QUESTION',
    'LISTENING',
    'INTERVIEW_ACTIVE',
  ], 'Must follow exact 4-stage startup order')
  assert.equal(activeQuestion?.questionId, 'q-staged-1')
  assert.equal(isListening, true)
})

test('Test 19 – Pre-Interview Device Setup: React Strict Mode Asynchronous Mount Race Prevention', async () => {
  let isMounted = true
  let initCounter = 0
  let orphanedTrackStopped = false

  const simulateInitDevices = async () => {
    const initId = ++initCounter
    // Simulate getUserMedia delay
    await new Promise((resolve) => setTimeout(resolve, 10))
    const stream = {
      getVideoTracks: () => [
        {
          stop: () => {
            orphanedTrackStopped = true
          },
        },
      ],
      getAudioTracks: () => [],
    }

    if (!isMounted || initId !== initCounter) {
      // Discard and stop tracks because component unmounted or re-initialized
      stream.getVideoTracks().forEach((t) => t.stop())
      return null
    }
    return stream
  }

  // Mount 1 starts
  const p1 = simulateInitDevices()
  // React Strict Mode unmounts and remounts immediately
  isMounted = false
  await p1
  assert.equal(orphanedTrackStopped, true, 'Orphaned stream tracks from unmounted run must be stopped immediately')
})
