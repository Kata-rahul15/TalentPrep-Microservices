export function formatRoundTitle(type: string): string {
  switch (type) {
    case 'TECHNICAL':
      return 'Technical'
    case 'CODING':
      return 'Live Coding'
    case 'SYSTEM_DESIGN':
      return 'System Design'
    case 'BEHAVIORAL':
      return 'Behavioral'
    case 'PROJECT':
      return 'Project Architecture'
    default:
      return type
  }
}

export function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60)
  const secs = Math.max(0, totalSeconds) % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

