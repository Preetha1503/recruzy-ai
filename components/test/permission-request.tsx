"\"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription as AlertDescriptionUi } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PermissionRequestProps {
  onPermissionsGranted: () => void
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({ onPermissionsGranted }) => {
  const [hasPermissions, setHasPermissions] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(true)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  useEffect(() => {
    // Check if permissions are already granted
    const storedPermissions = localStorage.getItem("permissionsGranted")
    if (storedPermissions === "true") {
      setHasPermissions(true)
      onPermissionsGranted()
    }
  }, [onPermissionsGranted])

  const requestPermissions = async () => {
    try {
      // Request camera and microphone permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

      // Store permission status
      localStorage.setItem("permissionsGranted", "true")
      setHasPermissions(true)
      onPermissionsGranted()
    } catch (err) {
      setPermissionError(
        "Failed to obtain required permissions. Please allow camera and microphone access to continue.",
      )
    }
  }

  const acceptGuidelines = () => {
    setShowGuidelines(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {showGuidelines ? (
        <AlertDialog open={showGuidelines}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Guidelines</AlertDialogTitle>
              <AlertDialogDescription>
                Please read and agree to the following guidelines before starting the test:
                <ul className="list-disc pl-5 mt-2">
                  <li>Ensure you have a stable internet connection.</li>
                  <li>Allow camera and microphone access for proctoring.</li>
                  <li>Do not switch tabs or leave the test window.</li>
                  <li>Complete the test within the allotted time.</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={acceptGuidelines} className="bg-purple-700 hover:bg-purple-800 text-white">
                I Agree
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">Permissions Required</h2>
          <p className="text-gray-600 mb-4">
            This test requires camera and microphone permissions to function properly.
          </p>
          {permissionError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescriptionUi>{permissionError}</AlertDescriptionUi>
            </Alert>
          )}
          <Button onClick={requestPermissions} className="bg-purple-700 hover:bg-purple-800 text-white">
            Grant Permissions
          </Button>
        </>
      )}
    </div>
  )
}
