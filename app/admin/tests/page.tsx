"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, FileText, MoreVertical, Trash2, Calendar, CheckCircle, Globe, PenLine, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { Test } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function TestManagement() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [dueDate, setDueDate] = useState("")
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      setLoading(true)
      console.log("Fetching tests...")

      const response = await fetch("/api/admin/tests", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Tests fetched:", data)
      setTests(data || [])

      toast({
        title: "Tests loaded",
        description: `${data.length} tests retrieved from the database.`,
      })
    } catch (error) {
      console.error("Error fetching tests:", error)
      toast({
        title: "Error",
        description: `Failed to fetch tests: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTest = async () => {
    if (!selectedTest) return

    try {
      setDeleteInProgress(true)

      const response = await fetch(`/api/admin/tests/${selectedTest.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete test")
      }

      fetchTests()
      toast({
        title: "Success",
        description: "Test deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting test:", error)
      toast({
        title: "Error",
        description: "Failed to delete test.",
        variant: "destructive",
      })
    } finally {
      setDeleteInProgress(false)
      setShowDeleteDialog(false)
      setSelectedTest(null)
    }
  }

  const handleUpdateStatus = async (status: "active" | "draft" | "completed" | "published") => {
    if (!selectedTest) return

    try {
      setStatusUpdateInProgress(true)

      console.log("=== TEST STATUS UPDATE - START ===")
      console.log("Test ID:", selectedTest.id)
      console.log("Current Status:", selectedTest.status)
      console.log("New Status:", status)
      console.log("Due Date:", dueDate || "Not specified")
      console.log("API Endpoint:", `/api/admin/tests/${selectedTest.id}/status`)
      console.log(
        "Request Body:",
        JSON.stringify(
          {
            status,
            dueDate: dueDate || undefined,
          },
          null,
          2,
        ),
      )

      const response = await fetch(`/api/admin/tests/${selectedTest.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          dueDate: dueDate || undefined,
        }),
      })

      console.log("Response Status:", response.status)
      const responseData = await response.json()
      console.log("Response Data:", responseData)
      console.log("=== TEST STATUS UPDATE - END ===")

      if (!response.ok) {
        throw new Error("Failed to update test status")
      }

      fetchTests()
      toast({
        title: "Success",
        description: `Test ${status} successfully.`,
      })
    } catch (error) {
      console.error("Error updating test status:", error)
      toast({
        title: "Error",
        description: "Failed to update test status.",
        variant: "destructive",
      })
    } finally {
      setStatusUpdateInProgress(false)
      setShowActivateDialog(false)
      setShowPublishDialog(false)
      setSelectedTest(null)
      setDueDate("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Draft</span>
      case "active":
        return <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">Active</span>
      case "published":
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Published</span>
      case "completed":
        return (
          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">Completed</span>
        )
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">{status}</span>
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="admin">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
        </div>
      </DashboardLayout>
    )
  }

  const draftTests = tests.filter((test) => test.status === "draft")
  const activeTests = tests.filter((test) => test.status === "active")
  const publishedTests = tests.filter((test) => test.status === "published")
  const completedTests = tests.filter((test) => test.status === "completed")

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-purple-800">Test Management</h1>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchTests}
              disabled={loading}
              className="border-purple-200 text-purple-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
              <Link href="/admin/create-test">Create New Test</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftTests.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeTests.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedTests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
          </TabsList>

          {["all", "draft", "active", "published", "completed"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {(tab === "all"
                ? tests
                : tab === "draft"
                  ? draftTests
                  : tab === "active"
                    ? activeTests
                    : tab === "published"
                      ? publishedTests
                      : completedTests
              ).length > 0 ? (
                (tab === "all"
                  ? tests
                  : tab === "draft"
                    ? draftTests
                    : tab === "active"
                      ? activeTests
                      : tab === "published"
                        ? publishedTests
                        : completedTests
                ).map((test) => (
                  <Card key={test.id} className="border-purple-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-purple-800">{test.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(test.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {test.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTest(test)
                                    setShowActivateDialog(true)
                                  }}
                                  className="flex items-center"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                                  Make Active
                                </DropdownMenuItem>
                              )}

                              {(test.status === "draft" || test.status === "active") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTest(test)
                                    setShowPublishDialog(true)
                                  }}
                                  className="flex items-center"
                                >
                                  <Globe className="mr-2 h-4 w-4 text-green-600" />
                                  Publish to All Users
                                </DropdownMenuItem>
                              )}

                              {test.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTest(test)
                                    handleUpdateStatus("completed")
                                  }}
                                  className="flex items-center"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-purple-600" />
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}

                              {test.status === "completed" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTest(test)
                                    handleUpdateStatus("active")
                                  }}
                                  className="flex items-center"
                                >
                                  <PenLine className="mr-2 h-4 w-4 text-blue-600" />
                                  Reactivate Test
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTest(test)
                                  setShowDeleteDialog(true)
                                }}
                                className="flex items-center text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Test
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardDescription>{test.description || "No description provided"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-purple-500" />
                          {test.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-1 h-4 w-4 text-purple-500" />
                          {test.topic}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-purple-500" />
                          {new Date(test.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-1 h-4 w-4 text-purple-500" />
                          {test.questions.length} Questions
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      {test.status === "draft" && (
                        <Button
                          onClick={() => {
                            setSelectedTest(test)
                            setShowActivateDialog(true)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Make Active
                        </Button>
                      )}
                      {(test.status === "draft" || test.status === "active") && (
                        <Button
                          onClick={() => {
                            setSelectedTest(test)
                            setShowPublishDialog(true)
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Publish
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900">No tests found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {tab === "all"
                      ? "You haven't created any tests yet."
                      : tab === "draft"
                        ? "You don't have any draft tests."
                        : tab === "active"
                          ? "You don't have any active tests."
                          : tab === "published"
                            ? "You don't have any published tests."
                            : "You don't have any completed tests."}
                  </p>
                  <div className="mt-6">
                    <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                      <Link href="/admin/create-test">Create New Test</Link>
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Test</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this test? This action cannot be undone and will remove all associated
                questions and results.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteInProgress}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTest}
                disabled={deleteInProgress}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteInProgress ? "Deleting..." : "Delete Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Test Dialog */}
        <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Test Active</DialogTitle>
              <DialogDescription>
                Making this test active will allow you to assign it to specific users. You can set an optional due date
                for the test.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date (Optional)</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivateDialog(false)} disabled={statusUpdateInProgress}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateStatus("active")}
                disabled={statusUpdateInProgress}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {statusUpdateInProgress ? "Updating..." : "Make Active"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Test Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Test to All Users</DialogTitle>
              <DialogDescription>
                Publishing this test will make it available to all users in the system. Each user will receive this test
                in their active tests list. You can set an optional due date for the test.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="publish-due-date">Due Date (Optional)</Label>
                <Input
                  id="publish-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)} disabled={statusUpdateInProgress}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateStatus("published")}
                disabled={statusUpdateInProgress}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {statusUpdateInProgress ? "Publishing..." : "Publish to All Users"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
