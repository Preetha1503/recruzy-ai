export function calculateScore(answers: Record<string, number>, questions: any[]): number {
  let correctAnswers = 0
  const totalQuestions = questions.length

  questions.forEach((question: any) => {
    if (answers[question.id] === question.correct_answer) {
      correctAnswers++
    }
  })

  return Math.round((correctAnswers / totalQuestions) * 100)
}
