"use client"

import type React from "react"

import type { ReactNode } from "react"
import Link from "next/link"

interface SmoothScrollLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export default function SmoothScrollLink({ href, children, className }: SmoothScrollLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only apply smooth scrolling for hash links
    if (href.startsWith("#")) {
      e.preventDefault()
      const targetId = href.substring(1)
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
