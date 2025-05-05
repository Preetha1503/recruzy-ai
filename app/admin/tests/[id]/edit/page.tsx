"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Clock, Edit, Plus, RefreshCw, Save, Trash2, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Question, TestWithQuestions } from "@/lib/types"
import { getTestWithQuestions } from "@/app/actions/tests"
import { supabaseServer } from "@/lib/supabase/client"

export default function EditTest({ params }: { params: { id: string } }) {
  const router = useRouter()
  const testId = params.id

  const [test, setTest] = useState<TestWithQuestions | null>(null)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState("details")
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [selectedDifficulties, setSelectedDifficulties] = useState({
    easy: true,
    intermediate: true,
    hard: true,
  })
  const [totalQuestionCount, setTotalQuestionCount] = useState(5)

  // Initialize newQuestion state outside of conditional block
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: "",
    test_id: testId,
    text: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    difficulty: "easy",
    explanation: "",
    created_at: "",
  })

  // Track changes
  const [changedFields, setChangedFields] = useState<{
    title?: string
    topic?: string
    description?: string
    duration?: number
  }>({})

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testData = await getTestWithQuestions(testId)
        if (!testData) {
          setError("Test not found")
          setLoading(false)
          return
        }

        setTest(testData)
        setTitle(testData.title)
        setTopic(testData.topic)
        setDescription(testData.description || "")
        setDuration(testData.duration.toString())
        setQuestions(testData.questions)
      } catch (err) {
        console.error("Error fetching test:", err)
        setError("Failed to load test")
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId])

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulties((prev) => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }))
  }

  const getSelectedDifficulties = () => {
    return Object.entries(selectedDifficulties)
      .filter(([_, isSelected]) => isSelected)
      .map(([difficulty]) => difficulty)
  }

  const generateQuestions = async () => {
    if (!topic) {
      setError("Please enter a test topic")
      return
    }

    const difficulties = getSelectedDifficulties()
    if (difficulties.length === 0) {
      setError("Please select at least one difficulty level")
      return
    }

    setError("")
    setGeneratingQuestions(true)

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulties,
          count: totalQuestionCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate questions")
      }

      const data = await response.json()

      // Add unique IDs to the questions
      const newQuestions = data.questions.map((q: any) => ({
        ...q,
        id: `${q.difficulty}-${Math.random().toString(36).substring(2, 11)}`,
        test_id: testId,
        created_at: new Date().toISOString(),
      }))

      // Add the new questions to the existing ones
      setQuestions((prev) => [...prev, ...newQuestions])
      setSuccess("Questions generated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error generating questions:", err)
      setError(err instanceof Error ? err.message : "Failed to generate questions")
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
  }

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      setQuestions(questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)))
      setEditingQuestion(null)
    }
  }

  const handleAddNewQuestion = () => {
    setIsAddingQuestion(true)
    setNewQuestion({
      id: `manual-${Math.random().toString(36).substring(2, 11)}`,
      test_id: testId,
      text: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      difficulty: "easy",
      explanation: "",
      created_at: new Date().toISOString(),
    })
  }

  const handleSaveNewQuestion = () => {
    // Validate the new question
    if (!newQuestion.text || newQuestion.options.some((opt) => !opt)) {
      setError("Please fill in all question fields")
      return
    }

    setQuestions((prev) => [...prev, newQuestion])
    setIsAddingQuestion(false)
    setError("")
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const handleRegenerateQuestion = async (questionId: string) => {
    const questionToRegenerate = questions.find((q) => q.id === questionId)
    if (!questionToRegenerate) return

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulties: [questionToRegenerate.difficulty],
          count: 1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to regenerate question")
      }

      const data = await response.json()

      if (data.questions && data.questions.length > 0) {
        const newQuestion = {
          ...data.questions[0],
          id: questionId,
          test_id: testId,
          created_at: new Date().toISOString(),
        }

        setQuestions(questions.map((q) => (q.id === questionId ? newQuestion : q)))
      }
    } catch (err) {
      console.error("Error regenerating question:", err)
      setError(err instanceof Error ? err.message : "Failed to regenerate question")
    }
  }

  const handleSaveTest = async () => {
    if (!title || !topic || !duration || questions.length === 0) {
      setError("Please fill in all required fields")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      console.log("Saving test with ID:", testId)
      console.log("Updated test data:", {
        title,
        topic,
        description,
        duration: Number.parseInt(duration),
        questions: questions.length,
      })

      // Build update object based on changed fields
      const updateData: { title?: string; topic?: string; description?: string; duration?: number } = {}
      if (changedFields.title) updateData.title = title
      if (changedFields.topic) updateData.topic = topic
      if (changedFields.description) updateData.description = description
      if (changedFields.duration) updateData.duration = Number.parseInt(duration)

      // Update test details
      if (Object.keys(updateData).length > 0) {
        const { error: testError } = await supabaseServer
          .from("tests")
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", testId)

        if (testError) {
          console.error("Error updating test:", testError)
          throw new Error(testError.message)
        }

        console.log("Test details updated successfully")
      } else {
        console.log("No test details to update")
      }

      // Get existing question IDs
      const { data: existingQuestions, error: fetchError } = await supabaseServer
        .from("questions")
        .select("id")
        .eq("test_id", testId)

      if (fetchError) {
        console.error("Error fetching existing questions:", fetchError)
        throw new Error("Failed to fetch existing questions")
      }

      const existingQuestionIds = existingQuestions?.map((q) => q.id) || []
      const updatedQuestionIds = questions.map((q) => q.id)

      console.log("Existing question IDs:", existingQuestionIds)
      console.log("Updated question IDs:", updatedQuestionIds)

      // Find questions to delete (in existing but not in updated)
      const questionsToDelete = existingQuestionIds.filter((id) => !updatedQuestionIds.includes(id))
      console.log("Questions to delete:", questionsToDelete)

      // Delete questions that were removed
      if (questionsToDelete.length > 0) {
        const { error: deleteError } = await supabaseServer.from("questions").delete().in("id", questionsToDelete)

        if (deleteError) {
          console.error("Error deleting questions:", deleteError)
          throw new Error("Failed to delete removed questions")
        }
        console.log(`Deleted ${questionsToDelete.length} questions`)
      }

      // Update or insert questions
      for (const question of questions) {
        // Check if this is an existing question (has a valid UUID)
        const isExisting =
          existingQuestionIds.includes(question.id) &&
          question.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

        console.log(
          `Processing question: ${question.text.substring(0, 20)}... (${question.id}) - ${isExisting ? "Update" : "Insert"}`,
        )

        if (isExisting) {
          // Update existing question - use supabaseServer instead of supabase
          const { error: updateError } = await supabaseServer
            .from("questions")
            .update({
              text: question.text,
              options: question.options,
              correct_answer: question.correct_answer,
              explanation: question.explanation,
              difficulty: question.difficulty,
            })
            .eq("id", question.id)

          if (updateError) {
            console.error(`Error updating question ${question.id}:`, updateError)
            throw new Error(`Failed to update question: ${updateError.message}`)
          }
        } else {
          // Insert new question using supabaseServer to bypass RLS
          const { error: insertError } = await supabaseServer.from("questions").insert({
            test_id: testId,
            text: question.text,
            options: question.options,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Error inserting question:", insertError)
            throw new Error(`Failed to insert question: ${insertError.message}`)
          }
        }
      }

      setSuccess("Test updated successfully")
      console.log("Test and questions updated successfully")

      // Refresh the test data
      const testData = await getTestWithQuestions(testId)
      if (testData) {
        setTest(testData)
        setQuestions(testData.questions)
      }

      setTimeout(() => {
        router.push("/admin/tests")
      }, 1500)
    } catch (err) {
      console.error("Error saving test:", err)
      setError(err instanceof Error ? err.message : "Failed to save test")
    } finally {
      setSaving(false)
      setChangedFields({})
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Edit Test</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Test Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Test Information</CardTitle>
                <CardDescription>Update the test details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      setChangedFields({ ...changedFields, title: e.target.value })
                    }}
                    className="border-purple-200 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Test Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value)
                      setChangedFields({ ...changedFields, topic: e.target.value })
                    }}
                    className="border-purple-200 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      setChangedFields({ ...changedFields, description: e.target.value })
                    }}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                    <Input
                      id="duration"
                      type="number"
                      min="10"
                      max="180"
                      value={duration}
                      onChange={(e) => {
                        setDuration(e.target.value)
                        setChangedFields({ ...changedFields, duration: Number.parseInt(e.target.value) })
                      }}
                      className="pl-10 border-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveTest}
                  className="ml-auto bg-purple-700 hover:bg-purple-800 text-white"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="mt-6 space-y-6">
            {editingQuestion ? (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-800">Edit Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Question</Label>
                    <Textarea
                      id="question-text"
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                      className="min-h-20 border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    {editingQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options]
                            newOptions[index] = e.target.value
                            setEditingQuestion({ ...editingQuestion, options: newOptions })
                          }}
                          className="border-purple-200 focus:border-purple-500"
                        />
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`correct-${index}`}
                            name="correct-answer"
                            checked={editingQuestion.correct_answer === index}
                            onChange={() => setEditingQuestion({ ...editingQuestion, correct_answer: index })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                          />
                          <Label htmlFor={`correct-${index}`} className="ml-2 text-sm">
                            Correct
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explanation</Label>
                    <Textarea
                      id="explanation"
                      value={editingQuestion.explanation || ""}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                      className="min-h-20 border-purple-200 focus:border-purple-500"
                      placeholder="Explain why the correct answer is correct"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={editingQuestion.difficulty}
                      onValueChange={(value: "easy" | "intermediate" | "hard") =>
                        setEditingQuestion({ ...editingQuestion, difficulty: value })
                      }
                    >
                      <SelectTrigger className="border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingQuestion(null)}
                    className="border-purple-200 text-purple-700"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveQuestion} className="bg-purple-700 hover:bg-purple-800 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            ) : isAddingQuestion ? (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-800">Add New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-question-text">Question</Label>
                    <Textarea
                      id="new-question-text"
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      className="min-h-20 border-purple-200 focus:border-purple-500"
                      placeholder="Enter your question"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options]
                            newOptions[index] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOptions })
                          }}
                          className="border-purple-200 focus:border-purple-500"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`new-correct-${index}`}
                            name="new-correct-answer"
                            checked={newQuestion.correct_answer === index}
                            onChange={() => setNewQuestion({ ...newQuestion, correct_answer: index })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                          />
                          <Label htmlFor={`new-correct-${index}`} className="ml-2 text-sm">
                            Correct
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-explanation">Explanation</Label>
                    <Textarea
                      id="new-explanation"
                      value={newQuestion.explanation || ""}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      className="min-h-20 border-purple-200 focus:border-purple-500"
                      placeholder="Explain why the correct answer is correct"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-difficulty">Difficulty</Label>
                    <Select
                      value={newQuestion.difficulty}
                      onValueChange={(value: "easy" | "intermediate" | "hard") =>
                        setNewQuestion({ ...newQuestion, difficulty: value })
                      }
                    >
                      <SelectTrigger className="border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingQuestion(false)}
                    className="border-purple-200 text-purple-700"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNewQuestion} className="bg-purple-700 hover:bg-purple-800 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-purple-800">Questions</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddNewQuestion}
                      variant="outline"
                      className="border-purple-200 text-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                    <Button
                      onClick={handleSaveTest}
                      className="bg-purple-700 hover:bg-purple-800 text-white"
                      disabled={saving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>

                {/* Generate Questions Section */}
                <Card className="border-purple-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">Generate Additional Questions</CardTitle>
                    <CardDescription>Use AI to generate more questions based on the test topic</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gen-easy"
                          checked={selectedDifficulties.easy}
                          onCheckedChange={() => handleDifficultyChange("easy")}
                        />
                        <label
                          htmlFor="gen-easy"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Easy
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gen-intermediate"
                          checked={selectedDifficulties.intermediate}
                          onCheckedChange={() => handleDifficultyChange("intermediate")}
                        />
                        <label
                          htmlFor="gen-intermediate"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Intermediate
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gen-hard"
                          checked={selectedDifficulties.hard}
                          onCheckedChange={() => handleDifficultyChange("hard")}
                        />
                        <label
                          htmlFor="gen-hard"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Hard
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question-count">Number of Questions</Label>
                      <Input
                        id="question-count"
                        type="number"
                        min="1"
                        max="20"
                        value={totalQuestionCount}
                        onChange={(e) => setTotalQuestionCount(Number.parseInt(e.target.value) || 5)}
                        className="border-purple-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500">Enter how many additional questions you want to generate</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={generateQuestions}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                      disabled={!topic || generatingQuestions || getSelectedDifficulties().length === 0}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingQuestions ? "Generating Questions..." : "Generate Questions"}
                    </Button>
                  </CardFooter>
                </Card>

                <div className="space-y-4">
                  {/* Questions by difficulty */}
                  {["easy", "intermediate", "hard"].map((difficulty) => (
                    <div key={difficulty} className="space-y-2">
                      <h3 className="text-lg font-semibold capitalize text-purple-700">{difficulty} Questions</h3>
                      {questions
                        .filter((q) => q.difficulty === difficulty)
                        .map((question, index) => (
                          <Card key={question.id} className="border-purple-200">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base text-purple-800">Question {index + 1}</CardTitle>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditQuestion(question)}
                                    className="h-8 w-8 text-purple-600 hover:bg-purple-50 hover:text-purple-800"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRegenerateQuestion(question.id)}
                                    className="h-8 w-8 text-purple-600 hover:bg-purple-50 hover:text-purple-800"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Regenerate</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="mb-2">{question.text}</p>
                              <div className="space-y-1">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className={`rounded-md p-2 ${
                                      optionIndex === question.correct_answer
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                                    {option}
                                    {optionIndex === question.correct_answer && (
                                      <span className="ml-2 text-xs text-green-600 font-medium">(Correct Answer)</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p className="font-medium">Explanation:</p>
                                  <p>{question.explanation}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      {questions.filter((q) => q.difficulty === difficulty).length === 0 && (
                        <p className="text-gray-500">No {difficulty} questions added yet</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
