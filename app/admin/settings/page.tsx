"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Lock, Mail, Save, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/app/actions/auth"

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [defaultDuration, setDefaultDuration] = useState("60")
  const [defaultQuestionCount, setDefaultQuestionCount] = useState("30")
  const [autoPublish, setAutoPublish] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
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
          setBio(user.bio || "")
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
          bio: bio,
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

  const handleNotificationSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_settings: {
            email_notifications: emailNotifications,
            default_duration: Number.parseInt(defaultDuration),
            default_question_count: Number.parseInt(defaultQuestionCount),
            auto_publish: autoPublish,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw error
      }

      setSuccess("Notification settings updated successfully")
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      setError("Failed to update notification settings")
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
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
                      <div className="mt-2"></div>
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

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself"
                      className="border-purple-200 focus:border-purple-500"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
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

          {/* Security Tab */}
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800">Notification Preferences</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <form onSubmit={handleNotificationSettingsUpdate}>
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

                  <div className="space-y-4">
                    <h3 className="font-medium text-purple-800">Email Notifications</h3>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                      <Label htmlFor="email-notifications">Enable email notifications</Label>
                    </div>

                    <div className="space-y-2 pl-6">
                      <div className="flex items-center space-x-2">
                        <Switch id="test-completed" defaultChecked />
                        <Label htmlFor="test-completed">When a user completes a test</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="new-user" defaultChecked />
                        <Label htmlFor="new-user">When a new user registers</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="test-overdue" defaultChecked />
                        <Label htmlFor="test-overdue">When a test becomes overdue</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-purple-800">System Notifications</h3>

                    <div className="flex items-center space-x-2">
                      <Switch id="browser-notifications" defaultChecked />
                      <Label htmlFor="browser-notifications">Enable browser notifications</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="dashboard-alerts" defaultChecked />
                      <Label htmlFor="dashboard-alerts">Show alerts on dashboard</Label>
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
                    {loading ? "Saving..." : "Save Preferences"}
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
