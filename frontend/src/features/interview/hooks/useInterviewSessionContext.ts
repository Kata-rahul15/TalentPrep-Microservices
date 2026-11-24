import { createContext, useContext } from 'react'
import type React from 'react'
import type {
  InterviewSessionResponse,
  InterviewQuestionResponse,
  AnswerEvaluationResponseDto,
} from '../types/interview.types'

export interface InterviewSessionContextType {
  sessionId: string
  session: InterviewSessionResponse | undefined
  activeQuestion: InterviewQuestionResponse | null
  setActiveQuestion: React.Dispatch<React.SetStateAction<InterviewQuestionResponse | null>>
  lastEvaluation: AnswerEvaluationResponseDto | null
  setLastEvaluation: (evalResult: AnswerEvaluationResponseDto | null) => void
  isEvaluating: boolean
  setIsEvaluating: (isEval: boolean) => void
  draftAnswer: string
  setDraftAnswer: (val: string) => void
  remainingSeconds: number
  elapsedQuestionSeconds: number
  resetQuestionTimer: () => void
  clearDraft: () => void
}

export const InterviewSessionContext = createContext<InterviewSessionContextType | undefined>(
  undefined
)

export function useInterviewSessionContext() {
  const context = useContext(InterviewSessionContext)
  if (!context) {
    throw new Error('useInterviewSessionContext must be used within an InterviewSessionProvider')
  }
  return context
}

