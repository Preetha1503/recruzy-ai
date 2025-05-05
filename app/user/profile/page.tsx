"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Lock, Mail, Save, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/app/actions/auth"

export default function Profile() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setName(user.username)
          setEmail(user.email)
          setUserId(user.id)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("users")
        .update({
          username: name,
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw error
      }

      setSuccess("Profile updated successfully")
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }

    try {
      // First verify current password
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("password")
        .eq("id", userId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (userData.password !== currentPassword) {
        setError("Current password is incorrect")
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Success",
        description: "Password updated successfully",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      setError("Failed to update password")
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Your Profile</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
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

                  <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="bg-purple-200 text-purple-800 text-2xl">
                        {name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-purple-800">Profile Picture</h3>
                      <p className="text-sm text-gray-500">Your profile picture will be used across the platform.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="ml-auto bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={loading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Security Settings</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordUpdate}>
                <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-500"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Password must be at least 8 characters and include uppercase, lowercase, number, and special
                      character
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 border-purple-200 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="ml-auto bg-purple-700 hover:bg-purple-800 text-white"
                    disabled={loading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
