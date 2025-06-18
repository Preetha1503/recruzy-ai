export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  created_at: string
  updated_at?: string
}

export interface Test {
  id: string
  title: string
  description?: string
  topic: string
  duration: number
  status: "draft" | "published" | "archived"
  created_at: string
  updated_at?: string
  created_by: string
}

export interface Question {
  id: string
  test_id: string
  text: string
  type: "multiple_choice" | "code_snippet" | "output_prediction" | "error_identification"
  options: string[]
  correct_answer: number
  code_snippet?: string
  expected_output?: string
  error_line?: number
  explanation?: string
  difficulty: "easy" | "intermediate" | "hard"
  programming_language?: "javascript" | "python" | "java" | "cpp" | "c"
  created_at: string
}

export interface TestWithQuestions extends Test {
  questions: Question[]
}

export interface UserTest {
  id: string
  user_id: string
  test_id: string
  assigned_at: string
  due_date?: string
  status: "assigned" | "in_progress" | "completed" | "expired"
  started_at?: string
  completed_at?: string
}

export interface TestResult {
  id: string
  user_id: string
  test_id: string
  answers: Record<string, number>
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  started_at: string
  completed_at: string
  tab_switch_attempts: number
  no_face_violations: number
  multiple_faces_violations: number
  client_errors: number
}

export interface Analytics {
  totalTests: number
  totalUsers: number
  averageScore: number
  completionRate: number
  testPerformance: Array<{
    test_id: string
    test_title: string
    average_score: number
    completion_rate: number
    total_attempts: number
  }>
  userPerformance: Array<{
    user_id: string
    user_name: string
    tests_taken: number
    average_score: number
    total_time: number
  }>
}
