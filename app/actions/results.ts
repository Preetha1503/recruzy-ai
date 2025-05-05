"use server"

import { supabaseServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function submitTestResult(formData: FormData) {
  try {
    const testId = formData.get("testId") as string
    const answersJson = formData.get("answers") as string
    const timeTaken = Number.parseInt(formData.get("timeTaken") as string)
    const startedAt = formData.get("startedAt") as string
    const tabSwitchAttempts = Number.parseInt((formData.get("tabSwitchAttempts") as string) || "0")

    // Get proctoring violations data
    const noFaceViolations = Number.parseInt((formData.get("noFaceViolations") as string) || "0")
    const multipleFacesViolations = Number.parseInt((formData.get("multipleFacesViolations") as string) || "0")
    const faceChangedViolations = Number.parseInt((formData.get("faceChangedViolations") as string) || "0")

    if (!testId || !answersJson) {
      return { error: "Missing required fields" }
    }

    const answers = JSON.parse(answersJson)
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")
    const userId = userIdCookie?.value

    if (!userId) {
      return { error: "User not authenticated" }
    }

    // Fetch the test to get questions
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .select("*, questions(*)")
      .eq("id", testId)
      .single()

    if (testError || !test) {
      console.error("Error fetching test:", testError)
      return { error: "Failed to fetch test" }
    }

    // Calculate score
    let correctAnswers = 0
    const totalQuestions = test.questions.length

    test.questions.forEach((question: any) => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Insert test result
    const { data: resultData, error: resultError } = await supabaseServer
      .from("test_results")
      .insert({
        user_id: userId,
        test_id: testId,
        score,
        answers,
        time_taken: timeTaken,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        tab_switch_attempts: tabSwitchAttempts,
        no_face_violations: noFaceViolations,
        multiple_faces_violations: multipleFacesViolations,
        face_changed_violations: faceChangedViolations,
      })
      .select()

    if (resultError) {
      console.error("Error inserting test result:", resultError)
      return { error: "Failed to save test result" }
    }

    // Update user_tests status to completed
    const { error: updateError } = await supabaseServer
      .from("user_tests")
      .update({ status: "completed" })
      .eq("user_id", userId)
      .eq("test_id", testId)

    if (updateError) {
      console.error("Error updating user_test status:", updateError)
      // Continue anyway, as the test result is already saved
    }

    revalidatePath("/user/dashboard")
    revalidatePath("/user/history")
    revalidatePath(`/user/test-results/${resultData[0].id}`)

    return { success: true, resultId: resultData[0].id }
  } catch (error) {
    console.error("Error in submitTestResult:", error)
    return { error: "An unexpected error occurred" }
  }
}
