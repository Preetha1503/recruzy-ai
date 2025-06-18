"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import * as tf from "@tensorflow/tfjs"
import * as faceapi from "@tensorflow-models/face-detection"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users } from "lucide-react"

interface AIProctorProps {
  videoRef: React.RefObject<HTMLVideoElement>
  onViolation: (type: "no_face" | "multiple_faces") => void
  isActive: boolean
  userName?: string
}

export function AIProctoring({ videoRef, onViolation, isActive, userName }: AIProctorProps) {
  const [detector, setDetector] = useState<faceapi.FaceDetector | null>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [noFaceDetected, setNoFaceDetected] = useState(false)
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false)
  const [processingFrame, setProcessingFrame] = useState(false)
  const [brightnessTooLow, setBrightnessTooLow] = useState(false)

  // EXACTLY 2 warnings allowed - auto-submit on 3rd violation
  const MAX_ALLOWED_WARNINGS = 2

  // Use refs to track violation counts
  const noFaceWarningsRef = useRef(0)
  const multipleFacesWarningsRef = useRef(0)

  // State for UI display
  const [noFaceWarnings, setNoFaceWarnings] = useState(0)
  const [multipleFacesWarnings, setMultipleFacesWarnings] = useState(0)

  // Canvas for image processing
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Create a canvas element for image processing
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Load the face detection model
  useEffect(() => {
    if (!isActive) return

    const loadModel = async () => {
      try {
        // Load TensorFlow.js
        await tf.ready()
        console.log("TensorFlow.js loaded")

        // Load the face detection model
        const model = faceapi.SupportedModels.MediaPipeFaceDetector
        const detectorConfig = {
          runtime: "mediapipe",
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection",
          modelType: "short",
          maxFaces: 5,
        } as faceapi.MediaPipeFaceDetectorModelConfig

        const faceDetector = await faceapi.createDetector(model, detectorConfig)
        setDetector(faceDetector)
        setIsModelLoaded(true)
        console.log("Face detection model loaded successfully")
      } catch (error) {
        console.error("Error loading face detection model:", error)
      }
    }

    loadModel()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  // Function to analyze image brightness
  const analyzeImageBrightness = useCallback((video: HTMLVideoElement): number => {
    if (!canvasRef.current) return 0

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return 0

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }

    return sum / (data.length / 4)
  }, [])

  // Function to handle no face detection
  const handleNoFaceDetected = useCallback(() => {
    noFaceWarningsRef.current += 1
    setNoFaceWarnings(noFaceWarningsRef.current)
    console.log(`No face warning ${noFaceWarningsRef.current}/${MAX_ALLOWED_WARNINGS}`)

    // Trigger auto-submit on 3rd violation
    if (noFaceWarningsRef.current === 3) {
      console.log(`No face violation: Auto-submitting after 3rd violation`)
      onViolation("no_face")
    }
  }, [onViolation])

  // Function to handle multiple faces detection
  const handleMultipleFacesDetected = useCallback(() => {
    multipleFacesWarningsRef.current += 1
    setMultipleFacesWarnings(multipleFacesWarningsRef.current)
    console.log(`Multiple faces warning ${multipleFacesWarningsRef.current}/${MAX_ALLOWED_WARNINGS}`)

    // Trigger auto-submit on 3rd violation
    if (multipleFacesWarningsRef.current === 3) {
      console.log(`Multiple faces violation: Auto-submitting after 3rd violation`)
      onViolation("multiple_faces")
    }
  }, [onViolation])

  // Reset no face warnings if face is detected
  const resetNoFaceWarnings = useCallback(() => {
    if (noFaceWarningsRef.current < 3) {
      noFaceWarningsRef.current = 0
      setNoFaceWarnings(0)
      console.log("Reset no face warnings")
    }
  }, [])

  // Reset multiple faces warnings if only one face is detected
  const resetMultipleFacesWarnings = useCallback(() => {
    if (multipleFacesWarningsRef.current < 3) {
      multipleFacesWarningsRef.current = 0
      setMultipleFacesWarnings(0)
      console.log("Reset multiple faces warnings")
    }
  }, [])

  // Function to detect faces with continuous monitoring
  const detectFaces = useCallback(async () => {
    if (
      processingFrame ||
      !detector ||
      !videoRef.current ||
      !videoRef.current.readyState ||
      videoRef.current.paused ||
      videoRef.current.ended
    ) {
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(detectFaces)
      return
    }

    try {
      setProcessingFrame(true)

      // Check lighting conditions
      const brightness = analyzeImageBrightness(videoRef.current)
      const isLightingTooLow = brightness < 40
      setBrightnessTooLow(isLightingTooLow)

      // Detect faces
      const faces = await detector.estimateFaces(videoRef.current, {
        flipHorizontal: false,
      })

      // Handle no face detected
      if (faces.length === 0) {
        setNoFaceDetected(true)
        handleNoFaceDetected()
        resetMultipleFacesWarnings()
      } else {
        setNoFaceDetected(false)
        resetNoFaceWarnings()

        // Handle multiple faces detected
        if (faces.length > 1) {
          setMultipleFacesDetected(true)
          handleMultipleFacesDetected()
        } else {
          setMultipleFacesDetected(false)
          resetMultipleFacesWarnings()
        }
      }
    } catch (error) {
      console.error("Error during face detection:", error)
    } finally {
      setProcessingFrame(false)
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(detectFaces)
    }
  }, [
    detector,
    videoRef,
    processingFrame,
    analyzeImageBrightness,
    handleNoFaceDetected,
    handleMultipleFacesDetected,
    resetNoFaceWarnings,
    resetMultipleFacesWarnings,
  ])

  // Start continuous face detection when model is loaded
  useEffect(() => {
    if (!isModelLoaded || !detector || !isActive || !videoRef.current) return

    // Reset warning counts when starting detection
    noFaceWarningsRef.current = 0
    multipleFacesWarningsRef.current = 0
    setNoFaceWarnings(0)
    setMultipleFacesWarnings(0)

    console.log(`Starting face detection with ${MAX_ALLOWED_WARNINGS} warnings allowed, auto-submit on 3rd violation`)

    // Start the detection loop
    animationFrameRef.current = requestAnimationFrame(detectFaces)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isModelLoaded, detector, isActive, videoRef, detectFaces])

  if (!isActive) return null

  return (
    <div className="mt-4 space-y-2">
      {brightnessTooLow && (
        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Lighting is too dark. Please move to a better lit area for accurate face detection.
          </AlertDescription>
        </Alert>
      )}

      {noFaceDetected && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            No face detected! Please position yourself in front of the camera immediately.
            {noFaceWarnings > 0 && (
              <span className="block mt-1 text-red-600 font-bold">
                Warning: {noFaceWarnings}/{MAX_ALLOWED_WARNINGS} warnings.
                {noFaceWarnings === MAX_ALLOWED_WARNINGS && " Next violation will auto-submit the test!"}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {multipleFacesDetected && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <Users className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Multiple faces detected! Only you should be visible during the test.
            {multipleFacesWarnings > 0 && (
              <span className="block mt-1 text-red-600 font-bold">
                Warning: {multipleFacesWarnings}/{MAX_ALLOWED_WARNINGS} warnings.
                {multipleFacesWarnings === MAX_ALLOWED_WARNINGS && " Next violation will auto-submit the test!"}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
