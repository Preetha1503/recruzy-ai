"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { assignTestToUser } from "@/lib/db/user-tests"
import type { Test, User } from "@/lib/types/database"

interface AssignTestFormProps {
  tests: Test[]
  users: User[]
}

export function AssignTestForm({ tests, users }: AssignTestFormProps) {
  const [selectedTest, setSelectedTest] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await assignTestToUser({
        user_id: selectedUser,
        test_id: selectedTest,
        status: "assigned",
        assigned_at: new Date().toISOString(),
        due_date: new Date(dueDate).toISOString(),
      })

      if (result) {
        setSuccess("Test assigned successfully!")
        setSelectedTest("")
        setSelectedUser("")
        setDueDate("")
      } else {
        setError("Failed to assign test. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Test to User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="test" className="block text-sm font-medium text-gray-700">
              Select Test
            </label>
            <select
              id="test"
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a test...</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">
              Select User
            </label>
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Test"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
