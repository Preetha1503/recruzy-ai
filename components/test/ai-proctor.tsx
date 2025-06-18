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

  // Reference to store the initial face descriptor for verification
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

        // Load the face detection model with higher confidence threshold for better accuracy
        const model = faceapi.SupportedModels.MediaPipeFaceDetector
        const detectorConfig = {
          runtime: "mediapipe",
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection",
          modelType: "short", // Use the more accurate model
          maxFaces: 5, // Detect up to 5 faces to identify potential violations
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

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Calculate average brightness
    let sum = 0
    for (let i = 0; i < data.length; i += 4) {
      // Convert RGB to brightness using perceived luminance formula
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }

    // Return average brightness (0-255)
    return sum / (data.length / 4)
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
      const isLightingTooLow = brightness < 40 // Threshold for too dark
      setBrightnessTooLow(isLightingTooLow)

      // Detect faces
      const faces = await detector.estimateFaces(videoRef.current, {
        flipHorizontal: false,
      })

      // Handle no face detected
      if (faces.length === 0) {
        setNoFaceDetected(true)
        onViolation("no_face")
      } else {
        setNoFaceDetected(false)

        // Handle multiple faces detected
        if (faces.length > 1) {
          setMultipleFacesDetected(true)
          onViolation("multiple_faces")
        } else {
          setMultipleFacesDetected(false)
        }
      }
    } catch (error) {
      console.error("Error during face detection:", error)
    } finally {
      setProcessingFrame(false)
      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(detectFaces)
    }
  }, [detector, videoRef, onViolation, processingFrame, analyzeImageBrightness])

  // Start continuous face detection when model is loaded
  useEffect(() => {
    if (!isModelLoaded || !detector || !isActive || !videoRef.current) return

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
          </AlertDescription>
        </Alert>
      )}

      {multipleFacesDetected && (
        <Alert variant="destructive" className="bg-red-50 border-red-300">
          <Users className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Multiple faces detected! Only you should be visible during the test.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
