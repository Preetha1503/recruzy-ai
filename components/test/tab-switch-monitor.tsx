"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { PLATFORM_NAME } from "@/lib/constants"

interface TabSwitchMonitorProps {
  onViolation: () => void
  isActive: boolean
}

export function TabSwitchMonitor({ onViolation, isActive }: TabSwitchMonitorProps) {
  // Use a ref to track if we've already warned the user
  // This ensures the state doesn't get reset on re-renders
  const warningGivenRef = useRef(false)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!isActive) return

    // Function to handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab switch detected, warning given:", warningGivenRef.current)

        // If we've already given a warning, auto-submit immediately
        if (warningGivenRef.current) {
          console.log("Second tab switch - auto-submitting test")
          onViolation()
          return
        }

        // First tab switch - show warning and mark as warned
        console.log("First tab switch - showing warning")
        warningGivenRef.current = true
        setShowWarning(true)
      }
    }

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isActive, onViolation])

  // Return null if not active or no warning to show
  if (!isActive || !showWarning) return null

  return (
    <Alert variant="destructive" className="bg-red-50 border-red-300 mb-4 p-4">
      <div className="flex flex-col space-y-2">
        <div className="font-bold text-lg">Warning: Tab Switching Detected</div>

        <AlertDescription className="text-base">
          You have switched away from the {PLATFORM_NAME} test tab. This activity is monitored and may be flagged as a
          violation of test rules.
        </AlertDescription>

        <AlertDescription className="text-red-600 font-semibold text-base">
          This is your ONLY warning. The next tab switch will result in automatic test submission.
        </AlertDescription>

        <div className="flex justify-end mt-2">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowWarning(false)}>
            Return to Test
          </Button>
        </div>
      </div>
    </Alert>
  )
}
