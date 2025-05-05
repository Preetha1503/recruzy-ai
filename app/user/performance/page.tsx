"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Award, BookOpen, Clock, FileText, TrendingDown, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { getUserId } from "@/lib/cookie-utils"

interface TopicPerformance {
  topic: string
  score: number
  tests: number
  trend: number
}

interface RecentScore {
  testId: string
  testTitle: string
  score: number
  date: string
}

interface PerformanceData {
  topicPerformance: TopicPerformance[]
  recentScores: RecentScore[]
  averageScore: number
  testsCompleted: number
  skillGaps: { skill: string; score: number }[]
  strengths: { skill: string; score: number }[]
}

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const id = getUserId()
    setUserId(id)

    const fetchPerformanceData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!id) {
          setError("User ID not found. Please log in again.")
          setLoading(false)
          return
        }

        const response = await fetch(`/api/user/performance?userId=${id}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch performance data: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setPerformanceData({
          topicPerformance: data.topicPerformance || [],
          recentScores: data.recentScores || [],
          averageScore: data.averageScore || 0,
          testsCompleted: data.testsCompleted || 0,
          skillGaps: data.skillGaps || [],
          strengths: data.strengths || [],
        })
      } catch (err: any) {
        console.error("Error fetching performance data:", err)
        setError(`An unexpected error occurred: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPerformanceData()
    }
  }, [])

  if (loading) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!userId) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Performance Analytics</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User ID not found. Please log out and log in again.</AlertDescription>
          </Alert>
          <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
            <Link href="/login">Log In Again</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Performance Analytics</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
            <Link href="/user/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-purple-800">Performance Analytics</h1>
          <Button asChild variant="outline" className="border-purple-200 text-purple-700">
            <Link href="/user/history">
              <FileText className="mr-2 h-4 w-4" />
              View Test History
            </Link>
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{performanceData?.averageScore || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">Across all tests</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tests Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{performanceData?.testsCompleted || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Total tests taken</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Top Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {performanceData?.strengths && performanceData.strengths.length > 0
                  ? performanceData.strengths[0].skill
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Your best performing area</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Area to Improve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {performanceData?.skillGaps && performanceData.skillGaps.length > 0
                  ? performanceData.skillGaps[0].skill
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Focus on this area</p>
            </CardContent>
          </Card>
        </div>

        {/* Topic Performance */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl text-purple-800">Topic Performance</CardTitle>
            <CardDescription>Your performance across different topics</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData?.topicPerformance && performanceData.topicPerformance.length > 0 ? (
              <div className="space-y-4">
                {performanceData.topicPerformance.map((topic) => (
                  <div key={topic.topic} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">{topic.topic}</span>
                        {topic.trend > 0 ? (
                          <TrendingUp className="ml-2 h-4 w-4 text-green-600" />
                        ) : topic.trend < 0 ? (
                          <TrendingDown className="ml-2 h-4 w-4 text-red-600" />
                        ) : null}
                      </div>
                      <span className="text-sm font-medium">{topic.score}%</span>
                    </div>
                    <Progress
                      value={topic.score}
                      className="h-2 bg-purple-100"
                      indicatorClassName={
                        topic.score >= 80 ? "bg-green-500" : topic.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {topic.tests} test{topic.tests !== 1 ? "s" : ""}
                      </span>
                      {topic.trend !== 0 && (
                        <span className={topic.trend > 0 ? "text-green-600" : "text-red-600"}>
                          {topic.trend > 0 ? "+" : ""}
                          {topic.trend}% change
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No topic performance data available. Complete more tests to see your performance by topic.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Your Strengths</CardTitle>
              <CardDescription>Areas where you perform well</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.strengths && performanceData.strengths.length > 0 ? (
                <div className="space-y-4">
                  {performanceData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{strength.skill}</p>
                        <p className="text-sm text-gray-600">Score: {strength.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">Complete more tests to identify your strengths.</div>
              )}
            </CardContent>
          </Card>

          {/* Areas to Improve */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Areas to Improve</CardTitle>
              <CardDescription>Focus on these topics to improve your overall performance</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.skillGaps && performanceData.skillGaps.length > 0 ? (
                <div className="space-y-4">
                  {performanceData.skillGaps.map((gap, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        <BookOpen className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{gap.skill}</p>
                        <p className="text-sm text-gray-600">Current score: {100 - gap.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Complete more tests to identify areas for improvement.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Test Results */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl text-purple-800">Recent Test Results</CardTitle>
            <CardDescription>Your most recent test performances</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData?.recentScores && performanceData.recentScores.length > 0 ? (
              <div className="space-y-4">
                {performanceData.recentScores.map((result, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <p className="font-medium text-gray-800">{result.testTitle}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="mr-1 h-4 w-4" />
                        {new Date(result.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        result.score >= 80
                          ? "bg-green-100 text-green-800"
                          : result.score >= 60
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {result.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No recent test results available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
