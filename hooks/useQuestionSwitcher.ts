"use client"

import { useState, useRef, useCallback } from "react"

export function useQuestionSwitcher(initialTime = 0) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true)
      const startTime = Date.now() - time
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime)
      }, 10)
    }
  }, [isRunning, time])

  const pause = useCallback(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
    }
  }, [isRunning])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTime(0)
    setIsRunning(false)
  }, [])

  return { time, isRunning, start, pause, reset }
}
