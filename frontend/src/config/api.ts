const getGatewayUrl = (): string => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_GATEWAY_URL ||
    import.meta.env.VITE_AUTH_BASE_URL ||
    'http://localhost:8080'
  return envUrl.replace(/\/api\/auth\/?$/, '').replace(/\/+$/, '')
}

const getInterviewWsUrl = (): string => {
  const envWsUrl = import.meta.env.VITE_INTERVIEW_WS_URL
  if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim()) {
    return envWsUrl.trim().replace(/\/+$/, '')
  }

  const baseUrl = getGatewayUrl()
  const wsBase = baseUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://')
  return `${wsBase}/ws/interviews`
}

export const API = {
  BASE_URL: getGatewayUrl(),
  CSRF_URL: `${getGatewayUrl()}/api/csrf`,
  AUTH_BASE_URL: `${getGatewayUrl()}/api/auth`,
  RESUME_BASE_URL: `${getGatewayUrl()}/api/resumes`,
  INTERVIEW_BASE_URL: `${getGatewayUrl()}/api/interviews`,
  INTERVIEW_WS_URL: getInterviewWsUrl(),
} as const
