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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  FileText,
  MoreVertical,
  Trash2,
  Calendar,
  CheckCircle,
  RefreshCw,
  Users,
  UserCheck,
  Eye,
  UserPlus,
  Globe,
} from "lucide-react"
import Link from "next/link"
import type { Test } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  name?: string
  email: string
  role: string
}

interface TestWithAssignmentInfo extends Test {
  assignment_type?: "all" | "specific"
  assigned_user_count?: number
  total_user_count?: number
  questions?:
    | {
        count?: number
        countQuestions?: number
      }
    | any[]
    | number
  countQuestions?: number
}

export default function TestManagement() {
  const [tests, setTests] = useState<TestWithAssignmentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState<TestWithAssignmentInfo | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showAssignedUsersDialog, setShowAssignedUsersDialog] = useState(false)
  const [assignedUsers, setAssignedUsers] = useState<User[]>([])
  const [dueDate, setDueDate] = useState("")
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assignmentType, setAssignmentType] = useState<"all" | "specific" | null>(null)
  const { toast } = useToast()
  const [selectAll, setSelectAll] = useState(false)

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

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data.users.filter((user: User) => user.role === "user"))
    } catch (err) {
      console.error("Error fetching users:", err)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchAssignedUsers = async (testId: string) => {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/assigned-users`)
      if (!response.ok) {
        throw new Error("Failed to fetch assigned users")
      }
      const data = await response.json()
      setAssignedUsers(data.users || [])
    } catch (err) {
      console.error("Error fetching assigned users:", err)
      toast({
        title: "Error",
        description: "Failed to fetch assigned users",
        variant: "destructive",
      })
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

  const handleActivateTest = async (type: "all" | "specific") => {
    if (!selectedTest) return

    setAssignmentType(type)

    if (type === "specific") {
      await fetchUsers()
      setShowActivateDialog(false)
      setShowAssignDialog(true)
    } else {
      // Directly activate and assign to all users
      await assignTest("all", [])
    }
  }

  const assignTest = async (type: "all" | "specific", userIds: string[]) => {
    if (!selectedTest) return

    try {
      setStatusUpdateInProgress(true)

      const response = await fetch("/api/admin/assign-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: selectedTest.id,
          assignmentType: type,
          userIds: type === "specific" ? userIds : [],
          dueDate: dueDate || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign test")
      }

      const data = await response.json()

      fetchTests()
      toast({
        title: "Success",
        description: `Test activated and assigned to ${data.assignedCount} users!`,
      })
    } catch (error) {
      console.error("Error assigning test:", error)
      toast({
        title: "Error",
        description: "Failed to assign test.",
        variant: "destructive",
      })
    } finally {
      setStatusUpdateInProgress(false)
      setShowActivateDialog(false)
      setShowAssignDialog(false)
      setSelectedTest(null)
      setSelectedUsers([])
      setSelectAll(false) // Reset select all
      setDueDate("")
    }
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
      setSelectAll(false) // Uncheck select all if any user is deselected
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUsers(users.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  // Update the effect to sync select all state
  useEffect(() => {
    if (users.length > 0 && selectedUsers.length === users.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedUsers, users])

  const handleAssignToSelected = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive",
      })
      return
    }
    assignTest("specific", selectedUsers)
  }

  const handleViewAssignedUsers = async (test: TestWithAssignmentInfo) => {
    setSelectedTest(test)
    await fetchAssignedUsers(test.id)
    setShowAssignedUsersDialog(true)
  }

  const handleAssignToOtherUsers = async (test: TestWithAssignmentInfo) => {
    setSelectedTest(test)
    setAssignmentType("specific")
    await fetchUsers()
    setShowAssignDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "active":
        return (
          <Badge variant="default" className="bg-blue-600">
            Active
          </Badge>
        )
      case "published":
        return (
          <Badge variant="default" className="bg-green-600">
            Published
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-purple-600">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isRestrictedTest = (test: TestWithAssignmentInfo) => {
    // A test is restricted only if it's published to specific users (not all users)
    return test.status === "published" && test.assignment_type === "specific"
  }

  const isPublishedToAll = (test: TestWithAssignmentInfo) => {
    // A test is published to all if it's published and assignment_type is 'all'
    return test.status === "published" && test.assignment_type === "all"
  }

  const getQuestionsCount = (test: TestWithAssignmentInfo) => {
    // Handle nested questions object with count property
    if (test.questions && typeof test.questions === "object" && "count" in test.questions) {
      return test.questions.count || 0
    }

    // Handle questions as array
    if (test.questions && Array.isArray(test.questions)) {
      return test.questions.length
    }

    // Handle questions as direct number
    if (typeof test.questions === "number" && test.questions > 0) {
      return test.questions
    }

    // Handle question_count field
    if (test.question_count && test.question_count > 0) {
      return test.question_count
    }

    // Handle countQuestions field
    if (test.countQuestions && test.countQuestions > 0) {
      return test.countQuestions
    }

    // Handle nested countQuestions in questions object
    if (test.questions && typeof test.questions === "object" && "countQuestions" in test.questions) {
      return test.questions.countQuestions || 0
    }

    // Return 0 for draft tests or when no questions are found
    return 0
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
                  <Card
                    key={test.id}
                    className={`border-purple-200 ${isRestrictedTest(test) ? "bg-orange-50 border-orange-200" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-purple-800">{test.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(test.status)}
                          {isPublishedToAll(test) && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <Globe className="mr-1 h-3 w-3" />
                              Public Access
                            </Badge>
                          )}
                          {isRestrictedTest(test) && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Restricted Access
                            </Badge>
                          )}
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

                              {test.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleAssignToOtherUsers(test)}
                                  className="flex items-center"
                                >
                                  <UserPlus className="mr-2 h-4 w-4 text-green-600" />
                                  Assign to Other Users
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
                          {getQuestionsCount(test)} Questions
                        </div>
                      </div>

                      {/* Assignment Info Section */}
                      {test.status === "published" && (
                        <div className="mt-3">
                          {isPublishedToAll(test) ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <Globe className="mr-2 h-4 w-4" />
                              <span className="font-medium">Assigned to All Users</span>
                              {test.total_user_count && (
                                <span className="ml-2 text-gray-500">({test.total_user_count} users)</span>
                              )}
                            </div>
                          ) : test.assigned_user_count === test.total_user_count && test.total_user_count > 0 ? (
                            <div className="flex items-center text-blue-600 text-sm">
                              <UserCheck className="mr-2 h-4 w-4" />
                              <span className="font-medium">Assigned to all users</span>
                              <span className="ml-2 text-gray-500">({test.assigned_user_count} users)</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAssignedUsers(test)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Assigned Users
                              {test.assigned_user_count && <span className="ml-2">({test.assigned_user_count})</span>}
                            </Button>
                          )}
                        </div>
                      )}
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
                          <Users className="mr-2 h-4 w-4" />
                          Make Active
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
              <DialogDescription>Choose how you want to activate and assign this test to users.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date (Optional)</Label>
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowActivateDialog(false)} disabled={statusUpdateInProgress}>
                Cancel
              </Button>
              <Button
                onClick={() => handleActivateTest("all")}
                disabled={statusUpdateInProgress}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Users className="mr-2 h-4 w-4" />
                Assign to All Users
              </Button>
              <Button
                onClick={() => handleActivateTest("specific")}
                disabled={statusUpdateInProgress}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Assign to Specific Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Test to Specific Users</DialogTitle>
              <DialogDescription>
                Select the users you want to assign this test to. Selected users will see this test in their Active
                Tests section.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                    <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                    <label htmlFor="select-all" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Select All Users ({users.length})
                    </label>
                  </div>

                  <ScrollArea className="h-96 w-full border rounded-md p-4">
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelection(user.id, !!checked)}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {user.email.split("@")[0]}
                            <span className="text-gray-500 ml-2">({user.email})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                Selected: {selectedUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                {selectedUsers.length === users.length && users.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">• All users selected</span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} disabled={statusUpdateInProgress}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignToSelected}
                disabled={statusUpdateInProgress || selectedUsers.length === 0}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                {statusUpdateInProgress ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Assigning...</span>
                  </div>
                ) : (
                  `Assign to ${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assigned Users Dialog */}
        <Dialog open={showAssignedUsersDialog} onOpenChange={setShowAssignedUsersDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assigned Users</DialogTitle>
              <DialogDescription>Users who have access to this test: {selectedTest?.title}</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-2">
                {assignedUsers.length > 0 ? (
                  assignedUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{user.email.split("@")[0]}</span>
                      <span className="text-gray-500">({user.email})</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No users assigned to this test</div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button onClick={() => setShowAssignedUsersDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
