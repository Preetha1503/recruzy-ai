// Database Types
export type User = {
  id: string
  email: string
  name?: string
  role: "admin" | "user"
  created_at: string
}

export type Test = {
  id: string
  title: string
  description: string
  topic: string
  duration: number
  status: "draft" | "published" | "archived"
  created_by: string
  created_at: string
  updated_at: string
}

export type Question = {
  id: string
  test_id: string
  text: string
  options: string[]
  correct_answer: number
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  created_at: string
}

export type TestResult = {
  id: string
  user_id: string
  test_id: string
  score: number
  answers: Record<string, number> // question_id: selected_option_index
  time_taken: number // in seconds
  started_at: string
  completed_at: string
}

export type UserTest = {
  id: string
  user_id: string
  test_id: string
  status: "assigned" | "in_progress" | "completed"
  assigned_at: string
  due_date: string
}
