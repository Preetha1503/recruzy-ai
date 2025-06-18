"use client"

interface WatermarkOverlayProps {
  userEmail: string
  testId: string
  className?: string
}

export function WatermarkOverlay({ userEmail, testId, className = "" }: WatermarkOverlayProps) {
  const watermarkText = `${userEmail} • Test: ${testId.slice(0, 8)}`

  return (
    <>
      {/* Multiple watermark layers for better coverage */}
      <div
        className={`fixed inset-0 pointer-events-none select-none z-10 opacity-20 ${className}`}
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 150px,
            rgba(147, 51, 234, 0.1) 150px,
            rgba(147, 51, 234, 0.1) 200px
          )`,
        }}
      >
        {/* Create a grid of watermarks */}
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="absolute text-purple-600 font-mono text-sm transform rotate-45 whitespace-nowrap"
            style={{
              top: `${(index % 5) * 20 + 10}%`,
              left: `${Math.floor(index / 5) * 25 + 5}%`,
              fontSize: "12px",
              opacity: 0.3,
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>

      {/* Diagonal watermarks */}
      <div className="fixed inset-0 pointer-events-none select-none z-10 opacity-15">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`diag-${index}`}
            className="absolute text-purple-500 font-mono text-xs transform -rotate-12 whitespace-nowrap"
            style={{
              top: `${index * 8 + 5}%`,
              left: `${(index % 2) * 50 + 25}%`,
              fontSize: "10px",
              opacity: 0.2,
            }}
          >
            SECURE TEST • {userEmail}
          </div>
        ))}
      </div>

      {/* Center watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
        <div className="text-purple-600 font-bold text-6xl transform rotate-45 whitespace-nowrap">
          {userEmail.split("@")[0].toUpperCase()}
        </div>
      </div>
    </>
  )
}
