export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "user"
  created_at: string
  last_login: string | null
}

export interface Test {
  id: string
  title: string
  topic: string
  description: string | null
  duration: number
  created_by: string
  status: "draft" | "active" | "published" | "completed"
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  test_id: string
  text: string
  options: string[]
  correct_answer: number
  difficulty: "easy" | "intermediate" | "hard"
  explanation: string | null
  created_at: string
}

export interface UserTest {
  id: string
  user_id: string
  test_id: string
  assigned_at: string
  due_date: string | null
  status: "assigned" | "started" | "completed"
}

export interface TestResult {
  id: string
  user_id: string
  test_id: string
  score: number
  answers: Record<string, number>
  time_taken: number
  started_at: string
  completed_at: string
  tab_switch_attempts: number
  no_face_violations: number
  multiple_faces_violations: number
  face_changed_violations: number
  error_count: number
  client_errors: any[]
  tests?: {
    id: string
    title: string
    topic: string
    description: string
    duration: number
  }
}

export interface TestWithQuestions extends Test {
  questions: Question[]
}

export interface UserWithTests extends User {
  tests: Test[]
}

export interface UserAnalytics {
  topicPerformance: {
    topic: string
    score: number
    tests: number
    trend: number
  }[]
  testResults: {
    id: string
    score: number
    completed_at: string
    tests: {
      title: string
    }
  }[]
}
