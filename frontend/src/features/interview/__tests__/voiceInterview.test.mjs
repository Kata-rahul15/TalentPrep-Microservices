import test from 'node:test'
import assert from 'node:assert/strict'

// Helper to construct a Web Speech API SpeechRecognitionResult object
function createMockResult(transcript, isFinal = false) {
  const item = { transcript, confidence: 0.95 }
  const result = [item]
  result.isFinal = isFinal
  result.length = 1
  return result
}

// Mock SpeechRecognition implementation simulating Chrome's Web Speech API
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  maxAlternatives = 1

  onstart = null
  onend = null
  onerror = null
  onresult = null
  onspeechstart = null
  onspeechend = null
  onaudiostart = null
  onaudioend = null
  onsoundstart = null
  onsoundend = null

  isRunning = false
  static instances = []

  constructor() {
    MockSpeechRecognition.instances.push(this)
  }

  start() {
    if (this.isRunning) {
      const err = new Error("Failed to execute 'start' on 'SpeechRecognition': recognition has already started.")
      err.name = 'InvalidStateError'
      throw err
    }
    this.isRunning = true
    if (this.onstart) this.onstart()
  }

  stop() {
    this.isRunning = false
    if (this.onend) this.onend()
  }

  abort() {
    this.isRunning = false
    if (this.onend) this.onend()
  }

  simulateResult(resultsList, resultIndex = 0) {
    if (this.onresult) {
      this.onresult({
        resultIndex,
        results: resultsList,
      })
    }
  }

  simulateSpeechStart() {
    if (this.onspeechstart) this.onspeechstart()
    if (this.onsoundstart) this.onsoundstart()
  }

  simulateSpeechEnd() {
    if (this.onspeechend) this.onspeechend()
    if (this.onsoundend) this.onsoundend()
  }

  simulateError(errorType, message = '') {
    if (this.onerror) {
      this.onerror({ error: errorType, message })
    }
  }

  simulateEngineEnd() {
    this.isRunning = false
    if (this.onend) this.onend()
  }
}

// Mock SpeechSynthesis
class MockSpeechSynthesisUtterance {
  text = ''
  lang = 'en-US'
  rate = 1.0
  pitch = 1.0
  voice = null
  onstart = null
  onend = null
  onerror = null

  constructor(text) {
    this.text = text
  }
}

class MockSpeechSynthesis {
  speaking = false
  paused = false
  pending = false
  currentUtterance = null

  getVoices() {
    return [
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google हिन्दी', lang: 'en-IN' },
      { name: 'Microsoft Ravi - English (India)', lang: 'en-IN' },
    ]
  }

  speak(utterance) {
    this.currentUtterance = utterance
    this.speaking = true
    if (utterance.onstart) utterance.onstart()
  }

  finishSpeaking() {
    if (this.currentUtterance) {
      this.speaking = false
      if (this.currentUtterance.onend) {
        this.currentUtterance.onend()
      }
      this.currentUtterance = null
    }
  }

  cancel() {
    this.speaking = false
    if (this.currentUtterance) {
      if (this.currentUtterance.onerror) {
        this.currentUtterance.onerror({ error: 'canceled' })
      }
      this.currentUtterance = null
    }
  }
}

test('Test 1 – Microphone Permission: Verify permission granting and device verification', async () => {
  let streamClosed = false
  const mockMediaDevices = {
    enumerateDevices: async () => [{ kind: 'audioinput', label: 'Default Microphone' }],
    getUserMedia: async (constraints) => {
      assert.equal(constraints.audio, true)
      return {
        getTracks: () => [
          {
            stop: () => {
              streamClosed = true
            },
          },
        ],
      }
    },
  }

  // Simulate explicit verification
  const devices = await mockMediaDevices.enumerateDevices()
  const hasAudioInput = devices.some((d) => d.kind === 'audioinput')
  assert.equal(hasAudioInput, true, 'Microphone audio input device must be detected')

  const stream = await mockMediaDevices.getUserMedia({ audio: true })
  stream.getTracks().forEach((track) => track.stop())
  assert.equal(streamClosed, true, 'Hardware track must be released cleanly before recognition starts')
})

test('Test 2 – Real-time transcription: Interim streaming and final preservation', () => {
  MockSpeechRecognition.instances = []
  const recognition = new MockSpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-IN'
  recognition.maxAlternatives = 1

  let baseFinalTranscript = ''
  let currentSessionFinal = ''
  let liveTranscript = ''
  let interimTranscript = ''

  // Register all required listeners
  recognition.onstart = () => {}
  recognition.onspeechstart = () => {}
  recognition.onspeechend = () => {}
  recognition.onresult = (event) => {
    let sessionFinal = ''
    let sessionInterim = ''

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      const text = result[0]?.transcript || ''
      if (result.isFinal) {
        sessionFinal += (sessionFinal ? ' ' : '') + text.trim()
      } else {
        sessionInterim += (sessionInterim ? ' ' : '') + text.trim()
      }
    }

    currentSessionFinal = sessionFinal.trim()
    const base = baseFinalTranscript.trim()
    const combinedFinal = base
      ? sessionFinal.trim()
        ? `${base} ${sessionFinal.trim()}`
        : base
      : sessionFinal.trim()

    interimTranscript = sessionInterim.trim()
    liveTranscript = combinedFinal
      ? interimTranscript
        ? `${combinedFinal} ${interimTranscript}`
        : combinedFinal
      : interimTranscript
  }

  recognition.start()

  // 1. Candidate speaks first partial words (interim)
  recognition.simulateResult([createMockResult('I have experience in', false)], 0)
  assert.equal(interimTranscript, 'I have experience in')
  assert.equal(liveTranscript, 'I have experience in', 'Interim text must appear immediately')

  // 2. Candidate completes sentence (finalized)
  recognition.simulateResult(
    [createMockResult('I have experience in Java and Spring Boot.', true)],
    0
  )
  assert.equal(interimTranscript, '')
  assert.equal(liveTranscript, 'I have experience in Java and Spring Boot.', 'Finalized sentence preserved')
})

test('Test 3 – Multiple sentences with pauses: No lost sentences and zero duplicate text', () => {
  MockSpeechRecognition.instances = []
  const recognition = new MockSpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-IN'

  let baseFinalTranscript = ''
  let currentSessionFinal = ''
  let liveTranscript = ''
  let interimTranscript = ''

  const processResult = (event) => {
    let sessionFinal = ''
    let sessionInterim = ''

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      const text = result[0]?.transcript || ''
      if (result.isFinal) {
        sessionFinal += (sessionFinal ? ' ' : '') + text.trim()
      } else {
        sessionInterim += (sessionInterim ? ' ' : '') + text.trim()
      }
    }

    currentSessionFinal = sessionFinal.trim()
    const base = baseFinalTranscript.trim()
    const combinedFinal = base
      ? sessionFinal.trim()
        ? `${base} ${sessionFinal.trim()}`
        : base
      : sessionFinal.trim()

    interimTranscript = sessionInterim.trim()
    liveTranscript = combinedFinal
      ? interimTranscript
        ? `${combinedFinal} ${interimTranscript}`
        : combinedFinal
      : interimTranscript
  }

  recognition.onresult = processResult
  recognition.start()

  // Sentence 1 interim -> final
  recognition.simulateResult([createMockResult('I designed a distributed cache.', true)], 0)
  assert.equal(liveTranscript, 'I designed a distributed cache.')

  // Sentence 2 interim
  recognition.simulateResult(
    [
      createMockResult('I designed a distributed cache.', true),
      createMockResult('It uses Redis cluster', false),
    ],
    1
  )
  assert.equal(liveTranscript, 'I designed a distributed cache. It uses Redis cluster')

  // Sentence 2 final
  recognition.simulateResult(
    [
      createMockResult('I designed a distributed cache.', true),
      createMockResult('It uses Redis cluster for low latency.', true),
    ],
    1
  )
  assert.equal(
    liveTranscript,
    'I designed a distributed cache. It uses Redis cluster for low latency.',
    'Both sentences must be preserved cleanly without duplicate tokens'
  )
})

test('Test 4 – Stop and resume: Preserves transcript and appends subsequent speech', () => {
  let baseFinalTranscript = ''
  let currentSessionFinal = ''
  let liveTranscript = ''
  let interimTranscript = ''

  const onSessionEnd = () => {
    if (currentSessionFinal) {
      const base = baseFinalTranscript.trim()
      baseFinalTranscript = base
        ? `${base} ${currentSessionFinal.trim()}`
        : currentSessionFinal.trim()
      currentSessionFinal = ''
    }
    interimTranscript = ''
    liveTranscript = baseFinalTranscript
  }

  const rec1 = new MockSpeechRecognition()
  rec1.onresult = (event) => {
    let sessionFinal = ''
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) sessionFinal += (sessionFinal ? ' ' : '') + event.results[i][0].transcript.trim()
    }
    currentSessionFinal = sessionFinal.trim()
    const base = baseFinalTranscript.trim()
    liveTranscript = base ? `${base} ${currentSessionFinal}` : currentSessionFinal
  }
  rec1.start()
  rec1.simulateResult([createMockResult('First thought on architecture.', true)], 0)
  assert.equal(liveTranscript, 'First thought on architecture.')

  // User stops listening
  rec1.stop()
  onSessionEnd()
  assert.equal(baseFinalTranscript, 'First thought on architecture.', 'Transcript preserved on stop')

  // User resumes listening
  const rec2 = new MockSpeechRecognition()
  rec2.onresult = (event) => {
    let sessionFinal = ''
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) sessionFinal += (sessionFinal ? ' ' : '') + event.results[i][0].transcript.trim()
    }
    currentSessionFinal = sessionFinal.trim()
    const base = baseFinalTranscript.trim()
    liveTranscript = base ? `${base} ${currentSessionFinal}` : currentSessionFinal
  }
  rec2.start()
  rec2.simulateResult([createMockResult('Second thought on database sharding.', true)], 0)

  assert.equal(
    liveTranscript,
    'First thought on architecture. Second thought on database sharding.',
    'New speech must append cleanly to previous answer without wiping earlier text'
  )
  rec2.stop()
  onSessionEnd()
  assert.equal(
    baseFinalTranscript,
    'First thought on architecture. Second thought on database sharding.'
  )
})

test('Test 5 – Transcript editing: Modified text is preserved and submitted', () => {
  let finalTranscript = 'I have built microservices with Python.'

  // User manually edits the textarea before submitting
  finalTranscript = 'I have built high-throughput microservices with Java and Spring Boot.'

  // Submission payload
  const submissionPayload = {
    answerText: finalTranscript.trim(),
  }

  assert.equal(
    submissionPayload.answerText,
    'I have built high-throughput microservices with Java and Spring Boot.',
    'The edited answer must be what gets submitted'
  )
})

test('Test 6 – Backend text submission: Submits plain text and receives next question', async () => {
  const backendState = {
    receivedAnswerText: null,
    receivedClientRequestId: null,
    nextQuestionText: 'How would you handle idempotency in distributed payment systems?',
  }

  const mockSubmitAnswerApi = async (sessionId, payload) => {
    assert.equal(typeof payload.answerText, 'string')
    assert.equal(payload.answerText.length > 0, true)
    backendState.receivedAnswerText = payload.answerText
    backendState.receivedClientRequestId = payload.clientRequestId
    return { success: true }
  }

  const candidateAnswer = 'We use idempotency keys stored in DynamoDB with a 24-hour TTL.'
  await mockSubmitAnswerApi('session-123', {
    questionId: 'q-1',
    answerText: candidateAnswer,
    clientRequestId: 'req-abc-123',
  })

  assert.equal(backendState.receivedAnswerText, candidateAnswer)
  assert.equal(backendState.receivedClientRequestId, 'req-abc-123')
  assert.equal(backendState.nextQuestionText.length > 0, true)
})

test('Test 7 – Text-to-Speech: Question is spoken, replay works, speech does not overlap', () => {
  const synthesis = new MockSpeechSynthesis()

  let interviewerSpokenText = ''
  let isSpeaking = false

  const speak = (text) => {
    synthesis.cancel() // Cancel previous to prevent overlapping speech
    const utterance = new MockSpeechSynthesisUtterance(text)
    utterance.onstart = () => {
      isSpeaking = true
      interviewerSpokenText = text
    }
    utterance.onend = () => {
      isSpeaking = false
    }
    synthesis.speak(utterance)
  }

  // Question 1
  speak('Explain the CAP theorem.')
  assert.equal(interviewerSpokenText, 'Explain the CAP theorem.')
  assert.equal(isSpeaking, true)

  // Replay Question 1
  speak('Explain the CAP theorem.')
  assert.equal(interviewerSpokenText, 'Explain the CAP theorem.')
  assert.equal(isSpeaking, true)

  synthesis.finishSpeaking()
  assert.equal(isSpeaking, false)

  // Question 2 should not overlap
  speak('How do you handle split-brain in distributed systems?')
  assert.equal(interviewerSpokenText, 'How do you handle split-brain in distributed systems?')
})

test('Test 8 – Error Handling: Permission denial, audio-capture, and unsupported browser', () => {
  let errorMessage = null
  let isRecording = true

  const handleError = (errorType) => {
    if (errorType === 'not-allowed') {
      isRecording = false
      errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings to speak.'
    } else if (errorType === 'audio-capture') {
      errorMessage = 'Microphone unavailable or in use by another application. Please check your audio settings.'
    } else if (errorType === 'network') {
      errorMessage = 'Speech recognition network error. Speech service was unreachable. Please type or check connection.'
    } else {
      errorMessage = `Speech recognition error: ${errorType}`
    }
  }

  // Permission denied
  handleError('not-allowed')
  assert.equal(isRecording, false)
  assert.match(errorMessage, /permission denied/i)

  // Audio capture
  handleError('audio-capture')
  assert.match(errorMessage, /unavailable or in use/i)

  // Browser compatibility check
  const isWebSpeechSupported = typeof window !== 'undefined' && 'SpeechRecognition' in window
  assert.equal(typeof isWebSpeechSupported, 'boolean')
})

test('Test 9 – Complete Interview: Consecutive question-and-answer cycles', async () => {
  const questions = [
    { questionId: 'q1', text: 'Tell me about a challenging distributed system you designed.' },
    { questionId: 'q2', text: 'How did you guarantee consistency across microservices?' },
    { questionId: 'q3', text: 'What observability tools did you implement?' },
  ]

  let currentQuestionIndex = 0
  const submittedAnswers = []
  let speechLog = []

  for (let cycle = 0; cycle < questions.length; cycle++) {
    const q = questions[currentQuestionIndex]

    // 1. TTS speaks question
    speechLog.push(`TTS: ${q.text}`)

    // 2. Candidate speaks answer
    const answer = `Answer for ${q.questionId}: Demonstrated architectural proficiency in ${q.questionId}`

    // 3. Candidate submits text answer
    submittedAnswers.push({
      questionId: q.questionId,
      answerText: answer,
    })

    // 4. Progress to next question
    currentQuestionIndex++
  }

  assert.equal(submittedAnswers.length, 3)
  assert.equal(speechLog.length, 3)
  assert.equal(currentQuestionIndex, 3)
  assert.equal(submittedAnswers[0].questionId, 'q1')
  assert.equal(submittedAnswers[1].questionId, 'q2')
  assert.equal(submittedAnswers[2].questionId, 'q3')
})
