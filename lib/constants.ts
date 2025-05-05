// API Keys
export const GEMINI_API_KEY = "AIzaSyCnfO-ZAWb5p7i0fe6vZU2DaQ7BWWUujPc"

// Platform configuration
export const PLATFORM_NAME = "Recruzy"
export const PLATFORM_VERSION = "1.0.0"
export const PLATFORM_DESCRIPTION = "Secure online assessment platform for technical interviews"

// Security settings
export const MAX_LOGIN_ATTEMPTS = 5
export const PASSWORD_RESET_EXPIRY = 24 // hours
export const SESSION_TIMEOUT = 60 // minutes

// Proctoring settings
export const MAX_TAB_SWITCH_ATTEMPTS = 1 // IMPORTANT: Only 1 warning, then auto-submit on 2nd switch
export const MAX_FACE_VIOLATION_ATTEMPTS = 2 // IMPORTANT: EXACTLY 2 warnings, then auto-submit on 3rd violation

// Test settings
export const DEFAULT_TEST_DURATION = 60 // minutes
export const MIN_PASSING_SCORE = 70 // percentage
export const MAX_QUESTIONS_PER_TEST = 50
export const DEFAULT_QUESTIONS_PER_TEST = 10
export const DEFAULT_QUESTION_COUNT = 30 // For backward compatibility

// Other constants remain the same...
