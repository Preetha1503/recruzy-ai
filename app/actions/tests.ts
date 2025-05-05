"use server"

import { revalidatePath } from "next/cache"
import { supabaseServer } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { Test, TestWithQuestions } from "@/lib/types"
import {
  getAllTests as secureGetAllTests,
  getTestsByUserId as secureGetTestsByUserId,
  getTestById as secureGetTestById,
  getTestWithQuestions as secureGetTestWithQuestions,
} from "@/lib/db/secure-test-operations"

export async function createTest(formData: FormData) {
  try {
    // Get the current user ID from cookies
    const userId = cookies().get("user_id")?.value
    const role = cookies().get("role")?.value

    if (!userId) {
      throw new Error("You must be logged in to create a test")
    }

    if (role !== "admin") {
      throw new Error("Only admins can create tests")
    }

    // Extract form data
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const topic = formData.get("topic") as string
    const duration = Number.parseInt(formData.get("duration") as string, 10)
    const questionsJson = formData.get("questions") as string

    // Validate required fields
    if (!title || !topic || isNaN(duration)) {
      throw new Error("Title, topic, and duration are required")
    }

    // Parse questions
    let questions = []
    try {
      questions = JSON.parse(questionsJson)
    } catch (e) {
      console.error("Error parsing questions JSON:", e)
      throw new Error("Invalid questions format")
    }

    console.log("Creating test with data:", {
      title,
      description,
      topic,
      duration,
      userId,
      questionsCount: questions.length,
    })

    // Create the test - remove the difficulties field as it doesn't exist in the schema
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .insert({
        title,
        description,
        topic,
        duration,
        created_by: userId,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (testError) {
      console.error("Error creating test:", testError)
      throw new Error(testError.message || "Failed to create test")
    }

    if (!test) {
      throw new Error("Failed to create test - no test data returned")
    }

    console.log("Test created successfully:", test)

    // Insert questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q) => ({
        test_id: test.id,
        text: q.text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
        difficulty: q.difficulty,
        created_at: new Date().toISOString(),
      }))

      console.log(`Inserting ${questionsToInsert.length} questions for test ${test.id}`)

      const { error: questionsError } = await supabaseServer.from("questions").insert(questionsToInsert)

      if (questionsError) {
        console.error("Error inserting questions:", questionsError)
        throw new Error(questionsError.message || "Failed to insert questions")
      }

      console.log("Questions inserted successfully")
    } else {
      console.log("No questions to insert")
    }

    revalidatePath("/admin/tests")
    return { success: true, testId: test.id }
  } catch (error) {
    console.error("Error creating test:", error)
    return { error: error.message || "Failed to create test" }
  }
}

export async function getTests(status?: "active" | "draft" | "completed" | "published"): Promise<Test[]> {
  try {
    const userId = cookies().get("user_id")?.value
    const role = cookies().get("role")?.value

    if (!userId) {
      return []
    }

    // Use our secure operations to bypass RLS
    let tests: Test[] = []

    if (role === "admin") {
      tests = await secureGetAllTests()
    } else {
      tests = await secureGetTestsByUserId(userId)
    }

    // Filter by status if provided
    if (status) {
      tests = tests.filter((test) => test.status === status)
    }

    return tests
  } catch (error) {
    console.error("Error fetching tests:", error)
    return []
  }
}

export async function getTest(id: string): Promise<Test | null> {
  try {
    return await secureGetTestById(id)
  } catch (error) {
    console.error("Error fetching test:", error)
    return null
  }
}

export async function getTestWithQuestions(id: string): Promise<TestWithQuestions | null> {
  try {
    return await secureGetTestWithQuestions(id)
  } catch (error) {
    console.error("Error fetching test with questions:", error)
    return null
  }
}

export async function updateTestStatus(
  testId: string,
  status: "draft" | "active" | "completed" | "published",
  dueDate?: string,
) {
  try {
    // Update the test status
    const { error } = await supabaseServer.from("tests").update({ status }).eq("id", testId)

    if (error) {
      console.error("Error updating test status:", error)
      return { success: false, error: "Failed to update test status" }
    }

    // If the test is being published, assign it to all users with role "user"
    if (status === "published") {
      // Get all users with role "user"
      const { data: users, error: usersError } = await supabaseServer.from("users").select("id").eq("role", "user")

      if (usersError) {
        console.error("Error fetching users:", usersError)
        return { success: false, error: "Failed to fetch users" }
      }

      if (users && users.length > 0) {
        // Prepare assignments for all users
        const assignments = users.map((user) => ({
          user_id: user.id,
          test_id: testId,
          assigned_at: new Date().toISOString(),
          due_date: dueDate || null,
          status: "assigned",
        }))

        // For each user, check if the test is already assigned
        for (const assignment of assignments) {
          const { data: existingAssignment, error: checkError } = await supabaseServer
            .from("user_tests")
            .select("id")
            .eq("user_id", assignment.user_id)
            .eq("test_id", testId)

          if (checkError) {
            console.error("Error checking existing assignment:", checkError)
            continue
          }

          // If the test is not already assigned to this user, assign it
          if (!existingAssignment || existingAssignment.length === 0) {
            const { error: assignError } = await supabaseServer.from("user_tests").insert([assignment])

            if (assignError) {
              console.error("Error assigning test to user:", assignError)
            }
          }
        }
      }
    }

    revalidatePath("/admin/tests")
    revalidatePath("/user/active-tests")
    return { success: true }
  } catch (error) {
    console.error("Error updating test status:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function publishTest(testId: string, dueDate?: string) {
  return updateTestStatus(testId, "published", dueDate)
}

export async function deleteTest(testId: string) {
  try {
    // Delete associated questions first
    const { error: questionsError } = await supabaseServer.from("questions").delete().eq("test_id", testId)

    if (questionsError) {
      console.error("Error deleting questions:", questionsError)
      return { success: false, error: "Failed to delete associated questions" }
    }

    const { error } = await supabaseServer.from("tests").delete().eq("id", testId)

    if (error) {
      console.error("Error deleting test:", error)
      return { success: false, error: "An unexpected error occurred" }
    }

    revalidatePath("/admin/tests")
    return { success: true }
  } catch (error) {
    console.error("Error deleting test:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function assignTestToUser(testId: string, userId: string, dueDate?: string) {
  try {
    console.log(`ACTION: Assigning test ${testId} to user ${userId} with due date ${dueDate || "none"}`)

    // Get the test to check its status
    const test = await secureGetTestById(testId)

    if (!test) {
      console.log(`Test ${testId} not found`)
      return { success: false, error: "Failed to fetch test information" }
    }

    console.log(`Test status: ${test.status}`)

    // Check if the test is already assigned to this user
    const { data: existingAssignments, error: checkError } = await supabaseServer
      .from("user_tests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .limit(1)

    if (checkError) {
      console.error("Error checking existing assignments:", checkError)
      return { success: false, error: "Failed to check existing assignments" }
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log(`Test ${testId} is already assigned to user ${userId}`)
      return {
        success: false,
        error: `This test is already assigned to this user with status: ${existingAssignments[0].status.replace("_", " ")}`,
      }
    }

    // Format the due date properly if provided
    let formattedDueDate = null
    if (dueDate) {
      // Make sure the due date is in the future
      const dueDateObj = new Date(dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueDateObj < today) {
        return { success: false, error: "Due date must be in the future" }
      }

      formattedDueDate = dueDateObj.toISOString()
    }

    // Create a new assignment
    const { data: newAssignment, error } = await supabaseServer
      .from("user_tests")
      .insert([
        {
          user_id: userId,
          test_id: testId,
          assigned_at: new Date().toISOString(),
          due_date: formattedDueDate,
          status: "assigned",
        },
      ])
      .select() // Select the newly inserted row
      .single()

    if (error) {
      console.error("Error assigning test to user:", error)
      return { success: false, error: "Failed to assign test to user" }
    }

    // Verify that the assignment was created
    if (!newAssignment) {
      console.error("No assignment created:", newAssignment)
      return { success: false, error: "Failed to create test assignment" }
    }

    console.log(`Successfully assigned test ${testId} to user ${userId} with due date ${formattedDueDate || "none"}`)
    console.log("New assignment:", newAssignment)

    revalidatePath("/admin/users")
    revalidatePath("/user/active-tests")
    revalidatePath("/user/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error assigning test to user:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function assignPublishedTestsToUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all published tests
    const { data: publishedTests, error: testsError } = await supabaseServer
      .from("tests")
      .select("id")
      .eq("status", "published")

    if (testsError) {
      console.error("Error fetching published tests:", testsError)
      return { success: false, error: "Failed to fetch published tests" }
    }

    if (!publishedTests || publishedTests.length === 0) {
      return { success: true } // No published tests to assign
    }

    // Get user's existing test assignments
    const { data: existingAssignments, error: assignmentsError } = await supabaseServer
      .from("user_tests")
      .select("test_id")
      .eq("user_id", userId)

    if (assignmentsError) {
      console.error("Error fetching existing assignments:", assignmentsError)
      return { success: false, error: "Failed to fetch existing assignments" }
    }

    // Find tests that aren't already assigned
    const existingTestIds = (existingAssignments || []).map((a) => a.test_id)
    const testsToAssign = publishedTests.filter((test) => !existingTestIds.includes(test.id))

    if (testsToAssign.length === 0) {
      return { success: true } // All tests are already assigned
    }

    // Create assignments for missing tests
    const assignments = testsToAssign.map((test) => ({
      user_id: userId,
      test_id: test.id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
    }))

    const { error: insertError } = await supabaseServer.from("user_tests").insert(assignments)

    if (insertError) {
      console.error("Error creating assignments:", insertError)
      return { success: false, error: "Failed to create assignments" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error assigning published tests to user:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
