import { useState } from 'react'
import CodingInterviewWorkspace from '../components/CodingInterviewWorkspace'
import type { InterviewQuestionResponse, InterviewSessionResponse } from '../types/interview.types'

const DEMO_SESSION: InterviewSessionResponse = {
  id: 'preview-session-id',
  userId: 'preview-user-id',
  resumeId: null,
  status: 'IN_PROGRESS',
  difficulty: 'MEDIUM',
  mode: 'TEXT',
  targetRole: 'Senior Full Stack Engineer',
  durationMinutes: 45,
  currentRoundIndex: 0,
  totalRounds: 3,
  rounds: [
    {
      id: 'round-1',
      roundOrder: 1,
      roundType: 'CODING',
      status: 'IN_PROGRESS',
      targetQuestionCount: 3,
      completedQuestionCount: 0,
      roundScore: null,
    },
  ],
}

const DEMO_QUESTION: InterviewQuestionResponse = {
  questionId: 'demo-question-1',
  roundId: 'round-1',
  sessionId: 'preview-session-id',
  roundOrder: 1,
  roundType: 'CODING',
  questionOrder: 1,
  targetQuestionCount: 3,
  questionText: `177. Nth Highest Salary

Table: Employee
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key (column with unique values) for this table.
Each row of this table contains information about the salary of an employee.

Write a solution to find the nth highest distinct salary from the Employee table. If there are fewer than n distinct salaries, return null.

The result format is in the following example.

Example 1:
Input: Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
| 2  | 200    |
| 3  | 300    |
+----+--------+
n = 2
Output: 200
Explanation: The second highest distinct salary is 200.

Example 2:
Input: Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
+----+--------+
n = 2
Output: null

Constraints:
* 1 <= n <= 100
* 1 <= Employee.length <= 10^5
* 0 <= salary <= 10^9

Follow-up: Could you optimize your algorithm to find the result in O(N) time with O(K) space using a min-heap or selection algorithm?`,
  questionCategory: 'Algorithms & Data Structures',
  difficulty: 'MEDIUM',
  isFollowUp: false,
  questionStatus: 'PENDING',
  codingBoilerplate: `public class Solution {
    public int findNthHighestSalary(int[] salaries, int n) {
        // Write your solution here
        // Handle edge cases and duplicates
        return -1;
    }
}`,
  codingTestCases: [
    {
      input: 'salaries = [100, 200, 300], n = 2',
      expectedOutput: '200',
      description: 'Second highest distinct salary',
    },
    {
      input: 'salaries = [100], n = 2',
      expectedOutput: 'null',
      description: 'Fewer than n elements returns null',
    },
    {
      input: 'salaries = [500, 500, 400, 300], n = 2',
      expectedOutput: '400',
      description: 'Handles duplicate salaries cleanly',
    },
  ],
}

export default function CodingInterviewPreviewPage() {
  const [code, setCode] = useState(DEMO_QUESTION.codingBoilerplate || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const handleRunCode = async (_lang: string, _code: string): Promise<string | null> => {
    setIsTesting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsTesting(false)
    return 'Sandbox Execution Notice: Live isolated compilation sandbox is currently offline. Your syntax has been validated; please submit code directly for AI algorithmic review.'
  }

  const handleSubmitCode = async (_lang: string, _code: string) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setIsSubmitting(false)
    alert('Code successfully submitted for AI Evaluation! Modal opened.')
  }

  return (
    <CodingInterviewWorkspace
      question={DEMO_QUESTION}
      codeText={code}
      onChangeCode={setCode}
      onRunCode={handleRunCode}
      onSubmitCode={handleSubmitCode}
      isSubmitting={isSubmitting}
      isTesting={isTesting}
      elapsedSeconds={142}
      session={DEMO_SESSION}
      remainingSeconds={2558}
      connectionStatus="connected"
      statusDetail="Live Sync Active"
      onPause={() => setIsPaused(true)}
      onResume={() => setIsPaused(false)}
      onSkip={() => alert('Skip Question confirmed!')}
      onEndEarly={() => alert('End Interview session confirmed!')}
      isPaused={isPaused}
      isEnding={false}
      isSkipping={false}
      isControlsDisabled={false}
    />
  )
}
