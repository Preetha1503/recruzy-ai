"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, ArrowLeft, Clock, Edit, Plus, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createTest } from "@/app/actions/tests"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateTest() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("create")
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("60")
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [selectedDifficulties, setSelectedDifficulties] = useState({
    easy: true,
    intermediate: true,
    hard: true,
  })
  const [totalQuestionCount, setTotalQuestionCount] = useState(30)
  const [customDistribution, setCustomDistribution] = useState(true)
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 5,
    intermediate: 10,
    hard: 15,
  })

  // For adding additional questions in preview
  const [additionalQuestionCount, setAdditionalQuestionCount] = useState(5)
  const [additionalQuestionDifficulty, setAdditionalQuestionDifficulty] = useState("intermediate")
  const [isAddingManually, setIsAddingManually] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    difficulty: "intermediate",
    explanation: "",
  })

  const getSelectedDifficulties = () => {
    return Object.entries(selectedDifficulties)
      .filter(([_, isSelected]) => isSelected)
      .map(([difficulty]) => difficulty)
  }

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulties((prev) => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }))
  }

  const handleDistributionChange = (difficulty: string, value: string) => {
    const numValue = Number.parseInt(value) || 0
    setDifficultyDistribution((prev) => ({
      ...prev,
      [difficulty]: numValue,
    }))
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
    setSuccess("") // Clear any previous success message

    try {
      // Show a toast notification that we're generating questions
      toast({
        title: "Generating Questions",
        description: "Please wait while we generate questions using AI...",
      })

      // Prepare difficulty distribution if custom is enabled
      const distribution = customDistribution
        ? Object.fromEntries(
            Object.entries(difficultyDistribution).filter(([difficulty]) => selectedDifficulties[difficulty]),
          )
        : null

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulties,
          count: totalQuestionCount,
          difficultyDistribution: distribution,
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
        test_id: "", // This will be set when the test is created
        created_at: new Date().toISOString(),
      }))

      // Add the new questions to the existing ones
      setQuestions((prev) => [...prev, ...newQuestions])

      if (questions.length === 0 && newQuestions.length > 0) {
        setActiveTab("preview")
      }

      setSuccess(`Successfully generated ${newQuestions.length} questions!`)

      toast({
        title: "Questions Generated",
        description: `Successfully generated ${newQuestions.length} questions!`,
      })
    } catch (err) {
      console.error("Error generating questions:", err)
      setError(err instanceof Error ? err.message : "Failed to generate questions")

      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate questions",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const generateAdditionalQuestions = async () => {
    if (!topic) {
      setError("Please enter a test topic")
      return
    }

    if (additionalQuestionCount <= 0) {
      setError("Please enter a valid number of questions to generate")
      return
    }

    setError("")
    setGeneratingQuestions(true)

    try {
      toast({
        title: "Generating Additional Questions",
        description: `Generating ${additionalQuestionCount} ${additionalQuestionDifficulty} questions...`,
      })

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulties: [additionalQuestionDifficulty],
          count: additionalQuestionCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate additional questions")
      }

      const data = await response.json()

      // Add unique IDs to the questions
      const newQuestions = data.questions.map((q: any) => ({
        ...q,
        id: `${q.difficulty}-${Math.random().toString(36).substring(2, 11)}`,
        test_id: "", // This will be set when the test is created
        created_at: new Date().toISOString(),
      }))

      // Add the new questions to the existing ones
      setQuestions((prev) => [...prev, ...newQuestions])

      toast({
        title: "Success",
        description: `Successfully generated ${newQuestions.length} additional questions!`,
      })
    } catch (err) {
      console.error("Error generating additional questions:", err)
      setError(err instanceof Error ? err.message : "Failed to generate additional questions")

      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate additional questions",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const handleCreateTest = async () => {
    if (!title || !topic || !duration || questions.length === 0) {
      setError("Please fill in all required fields and add questions")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("topic", topic)
      formData.append("duration", duration)
      formData.append("questions", JSON.stringify(questions))

      const result = await createTest(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess("Test created successfully!")
      toast({
        title: "Success",
        description: "Test created successfully! It has been saved to your drafts.",
      })

      // Redirect to the test management page after a short delay
      setTimeout(() => {
        router.push("/admin/tests")
      }, 1500)
    } catch (err) {
      console.error("Error creating test:", err)
      setError(err instanceof Error ? err.message : "Failed to create test")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const handleEditQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (question) {
      setNewQuestion({
        text: question.text,
        options: [...question.options],
        correct_answer: question.correct_answer,
        difficulty: question.difficulty,
        explanation: question.explanation || "",
      })
      setIsAddingManually(true)
      // Store the ID of the question being edited
      setNewQuestion((prev) => ({ ...prev, id: questionId }))
    }
  }

  const handleRegenerateQuestion = async (questionId: string) => {
    const questionToRegenerate = questions.find((q) => q.id === questionId)
    if (!questionToRegenerate) return

    try {
      setGeneratingQuestions(true)

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
          test_id: "",
          created_at: new Date().toISOString(),
        }

        setQuestions(questions.map((q) => (q.id === questionId ? newQuestion : q)))

        toast({
          title: "Success",
          description: "Question regenerated successfully!",
        })
      }
    } catch (err) {
      console.error("Error regenerating question:", err)
      toast({
        title: "Error",
        description: "Failed to regenerate question",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const handleAddManualQuestion = () => {
    setIsAddingManually(true)
    setNewQuestion({
      text: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      difficulty: "intermediate",
      explanation: "",
    })
  }

  const handleSaveManualQuestion = () => {
    // Validate the question
    if (!newQuestion.text || newQuestion.options.some((opt) => !opt)) {
      setError("Please fill in all question fields")
      return
    }

    if ("id" in newQuestion) {
      // Editing existing question
      setQuestions(
        questions.map((q) =>
          q.id === newQuestion.id ? { ...newQuestion, id: q.id, test_id: "", created_at: q.created_at } : q,
        ),
      )
    } else {
      // Adding new question
      const newQuestionWithId = {
        ...newQuestion,
        id: `manual-${Math.random().toString(36).substring(2, 11)}`,
        test_id: "",
        created_at: new Date().toISOString(),
      }
      setQuestions([...questions, newQuestionWithId])
    }

    setIsAddingManually(false)
    setError("")

    toast({
      title: "Success",
      description: "id" in newQuestion ? "Question updated successfully!" : "Question added successfully!",
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options]
    newOptions[index] = value
    setNewQuestion({ ...newQuestion, options: newOptions })
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-purple-800">Create New Test</h1>
          <Button
            variant="outline"
            className="border-purple-200 text-purple-700"
            onClick={() => router.push("/admin/tests")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
        </div>

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
            <TabsTrigger value="create">Create Test</TabsTrigger>
            <TabsTrigger value="preview">Preview Questions ({questions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6 space-y-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Test Details</CardTitle>
                <CardDescription>Enter the basic information for your test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                    placeholder="Enter a title for your test"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Test Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                    placeholder="e.g., JavaScript, React, Python"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-purple-200 focus:border-purple-500"
                    placeholder="Enter a description for your test"
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
                      onChange={(e) => setDuration(e.target.value)}
                      className="pl-10 border-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Generate Questions</CardTitle>
                <CardDescription>Use AI to generate questions for your test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Difficulty Levels</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="easy"
                        checked={selectedDifficulties.easy}
                        onCheckedChange={() => handleDifficultyChange("easy")}
                      />
                      <label
                        htmlFor="easy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Easy
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="intermediate"
                        checked={selectedDifficulties.intermediate}
                        onCheckedChange={() => handleDifficultyChange("intermediate")}
                      />
                      <label
                        htmlFor="intermediate"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Intermediate
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hard"
                        checked={selectedDifficulties.hard}
                        onCheckedChange={() => handleDifficultyChange("hard")}
                      />
                      <label
                        htmlFor="hard"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Hard
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-count">Number of Questions</Label>
                  <Input
                    id="question-count"
                    type="number"
                    min="1"
                    max="50"
                    value={totalQuestionCount}
                    onChange={(e) => setTotalQuestionCount(Number.parseInt(e.target.value) || 30)}
                    className="border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-distribution"
                      checked={customDistribution}
                      onCheckedChange={(checked) => setCustomDistribution(!!checked)}
                    />
                    <label
                      htmlFor="custom-distribution"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Custom difficulty distribution
                    </label>
                  </div>

                  {customDistribution && (
                    <div className="mt-4 space-y-4">
                      {Object.entries(selectedDifficulties)
                        .filter(([_, isSelected]) => isSelected)
                        .map(([difficulty]) => (
                          <div key={difficulty} className="flex items-center space-x-4">
                            <Label htmlFor={`${difficulty}-count`} className="w-24 capitalize">
                              {difficulty}:
                            </Label>
                            <Input
                              id={`${difficulty}-count`}
                              type="number"
                              min="0"
                              max={totalQuestionCount}
                              value={difficultyDistribution[difficulty]}
                              onChange={(e) => handleDistributionChange(difficulty, e.target.value)}
                              className="w-20 border-purple-200 focus:border-purple-500"
                            />
                            <span className="text-sm text-gray-500">questions</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={generateQuestions}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                  disabled={!topic || generatingQuestions || getSelectedDifficulties().length === 0}
                >
                  {generatingQuestions ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Generating Questions...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6 space-y-6">
            {isAddingManually ? (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-800">
                    {"id" in newQuestion ? "Edit Question" : "Add Question Manually"}
                  </CardTitle>
                  <CardDescription>
                    {"id" in newQuestion ? "Edit the question details below" : "Create a custom question for your test"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Question Text</Label>
                    <Textarea
                      id="question-text"
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                      className="border-purple-200 focus:border-purple-500"
                      placeholder="Enter your question text"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Options</Label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="border-purple-200 focus:border-purple-500"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          required
                        />
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`correct-${index}`}
                            name="correct-answer"
                            checked={newQuestion.correct_answer === index}
                            onChange={() => setNewQuestion({ ...newQuestion, correct_answer: index })}
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
                    <Label htmlFor="difficulty">Difficulty</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="explanation"
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      className="border-purple-200 focus:border-purple-500"
                      placeholder="Explain why the correct answer is correct"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingManually(false)}
                    className="border-purple-200 text-purple-700"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveManualQuestion} className="bg-purple-700 hover:bg-purple-800 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    {"id" in newQuestion ? "Update Question" : "Add Question"}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-800">Generate Additional Questions</CardTitle>
                    <CardDescription>Add more questions to your test</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="additional-count">Number of Questions</Label>
                        <Input
                          id="additional-count"
                          type="number"
                          min="1"
                          max="20"
                          value={additionalQuestionCount}
                          onChange={(e) => setAdditionalQuestionCount(Number.parseInt(e.target.value) || 5)}
                          className="w-24 border-purple-200 focus:border-purple-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="additional-difficulty">Difficulty</Label>
                        <Select
                          value={additionalQuestionDifficulty}
                          onValueChange={(value: "easy" | "intermediate" | "hard") =>
                            setAdditionalQuestionDifficulty(value)
                          }
                        >
                          <SelectTrigger className="w-40 border-purple-200 focus:border-purple-500">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={generateAdditionalQuestions}
                        className="bg-purple-700 hover:bg-purple-800 text-white"
                        disabled={!topic || generatingQuestions}
                      >
                        {generatingQuestions ? (
                          <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Generating...</span>
                          </div>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Questions
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleAddManualQuestion}
                        className="border-purple-200 text-purple-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Question Manually
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-purple-800">Questions ({questions.length})</h2>
                  <Button
                    onClick={handleCreateTest}
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={loading || questions.length === 0}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating Test...</span>
                      </div>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Test
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-6">
                  {["easy", "intermediate", "hard"].map((difficulty) => {
                    const difficultyQuestions = questions.filter((q) => q.difficulty === difficulty)
                    if (difficultyQuestions.length === 0) return null

                    return (
                      <div key={difficulty} className="space-y-4">
                        <h3 className="text-lg font-semibold capitalize text-purple-700">
                          {difficulty} Questions ({difficultyQuestions.length})
                        </h3>
                        {difficultyQuestions.map((question, index) => (
                          <Card key={question.id} className="border-purple-200">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base text-purple-800">
                                  {difficulty} Question {index + 1}: {question.text}
                                </CardTitle>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditQuestion(question.id)}
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
                              <div className="mt-2 space-y-1">
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
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
