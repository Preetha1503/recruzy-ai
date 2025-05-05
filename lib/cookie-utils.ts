// Cookie utility functions for client-side use

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    // Check if this cookie string begins with the name we want
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1))
    }
  }
  return null
}

export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return

  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = "; expires=" + date.toUTCString()
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax"
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return

  document.cookie = name + "=; Max-Age=-99999999; path=/"
}

export function getUserId(): string | null {
  return getCookie("user_id")
}

export function getUsername(): string | null {
  return getCookie("username")
}

export function getUserRole(): string | null {
  return getCookie("role")
}

export function getUserIdFromCookie(): string | null {
  return getCookie("user_id")
}
