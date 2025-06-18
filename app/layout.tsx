import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { PLATFORM_NAME } from "@/lib/constants"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: PLATFORM_NAME,
  description: "Secure online assessment platform for technical interviews",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
