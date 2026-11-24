export type VoiceInterviewState =
  | 'CONNECTING'
  | 'INTERVIEWER_SPEAKING'
  | 'LISTENING'
  | 'TRANSCRIPT_REVIEW'
  | 'ANSWER_SUBMITTING'
  | 'INTERVIEWER_THINKING'
  | 'COMPLETED'
  | 'ERROR'

export interface VoiceStateMachineContext {
  state: VoiceInterviewState
  currentQuestionText: string | null
  currentQuestionId: string | null
  turnSequence: number
  transcript: string
  interimTranscript: string
  isSpeaking: boolean
  isListening: boolean
  micPermissionGranted: boolean
  micError: string | null
  stompConnected: boolean
  error: string | null
}

