"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, UserPlus, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function UserManagement() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<SupabaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  })
  const [formErrors, setFormErrors] = useState<{
    username?: string
    email?: string
    password?: string
  }>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch users
        const response = await fetch("/api/admin/users")
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const userData = await response.json()

        // Filter out admin users
        const filteredUsers = userData.users.filter((user: SupabaseUser) => user.role !== "admin")

        // Check for active tests for each user
        const usersWithActiveTests = await Promise.all(
          filteredUsers.map(async (user) => {
            try {
              const { data: activeTests, error } = await supabase
                .from("user_tests")
                .select("id")
                .eq("user_id", user.id)
                .eq("status", "assigned")
                .limit(1)

              if (error) {
                console.error(`Error checking active tests for user ${user.id}:`, error)
                return {
                  ...user,
                  has_active_tests: false,
                }
              }

              return {
                ...user,
                has_active_tests: activeTests && activeTests.length > 0,
              }
            } catch (error) {
              console.error(`Error checking active tests for user ${user.id}:`, error)
              return {
                ...user,
                has_active_tests: false,
              }
            }
          }),
        )

        setUsers(usersWithActiveTests)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Add a function to handle adding a new user
  const handleAddUser = async () => {
    // Reset errors
    setFormErrors({})

    // Validate form
    const errors: {
      username?: string
      email?: string
      password?: string
    } = {}

    if (!newUser.username.trim()) {
      errors.username = "Username is required"
    }

    if (!newUser.email.trim()) {
      errors.email = "Email is required"
    }

    if (!newUser.password.trim()) {
      errors.password = "Password is required"
    } else if (newUser.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      // Add user directly to the database using Supabase
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username: newUser.username,
            email: newUser.email,
            password: newUser.password, // In a real app, this would be hashed
            role: "user",
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from database")
      }

      // Add the new user to the state
      setUsers([data[0], ...users])

      // Reset form and close dialog
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "user",
      })
      setAddUserDialogOpen(false)

      toast({
        title: "Success",
        description: "User added successfully!",
      })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while adding the user",
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-purple-800">User Management</h1>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search users..."
                className="w-full pl-9 border-purple-200 focus:border-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-purple-700 hover:bg-purple-800 text-white" onClick={() => setAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl text-purple-800">All Users</CardTitle>
            <CardDescription>Manage users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-100 text-left text-sm font-medium text-gray-500">
                      <th className="pb-3 pl-4">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Last Login</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-purple-100 text-sm hover:bg-purple-50">
                        <td className="py-4 pl-4">
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                              {user.username
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-purple-800">{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-purple-500" />
                            {user.email}
                          </div>
                        </td>
                        <td className="py-4 text-gray-600 capitalize">{user.role}</td>
                        <td className="py-4 text-gray-600">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : "Never"}
                        </td>
                        <td className="py-4">
                          <Badge
                            className={`${
                              user.has_active_tests ||
                              (
                                user.last_login &&
                                  new Date(user.last_login).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                              )
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {user.has_active_tests
                              ? "Test Active"
                              : user.last_login &&
                                  new Date(user.last_login).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                                ? "Active"
                                : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-800">Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                className={`border-purple-200 focus:border-purple-500 ${formErrors.username ? "border-red-500" : ""}`}
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              {formErrors.username && <p className="text-xs text-red-500">{formErrors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                className={`border-purple-200 focus:border-purple-500 ${formErrors.email ? "border-red-500" : ""}`}
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                className={`border-purple-200 focus:border-purple-500 ${formErrors.password ? "border-red-500" : ""}`}
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: "user") => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="border-purple-200 focus:border-purple-500">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUserDialogOpen(false)}
              className="border-purple-200 text-purple-700"
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="bg-purple-700 hover:bg-purple-800 text-white">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
