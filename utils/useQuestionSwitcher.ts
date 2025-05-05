export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60000)
  const seconds = Math.floor((time % 60000) / 1000)
  const milliseconds = Math.floor((time % 1000) / 10)
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
}
