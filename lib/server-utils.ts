import { cookies } from "next/headers"

export function getServerCookies() {
  return cookies()
}

export function getUserIdFromServerCookies() {
  return cookies().get("user_id")?.value
}

export function getRoleFromServerCookies() {
  return cookies().get("role")?.value
}
