export const PRODUCT_URL = ''

// CodePilot local model server URLs
export const CLAUDE_AI_BASE_URL = 'http://localhost:11434'
export const CLAUDE_AI_STAGING_BASE_URL = 'http://localhost:11434'
export const CLAUDE_AI_LOCAL_BASE_URL = 'http://localhost:11434'

/**
 * Determine if we're in a staging environment for remote sessions.
 * Checks session ID format and ingress URL.
 */
export function isRemoteSessionStaging(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  return (
    sessionId?.includes('_staging_') === true ||
    ingressUrl?.includes('staging') === true
  )
}

/**
 * Determine if we're in a local-dev environment for remote sessions.
 * Checks session ID format (e.g. `session_local_...`) and ingress URL.
 */
export function isRemoteSessionLocal(
  sessionId?: string,
  ingressUrl?: string,
): boolean {
  return (
    sessionId?.includes('_local_') === true ||
    ingressUrl?.includes('localhost') === true
  )
}

/**
 * Get the base URL for the local model server.
 * Always returns the local URL for CodePilot.
 */
export function getClaudeAiBaseUrl(
  sessionId?: string,
  ingressUrl?: string,
): string {
  return CLAUDE_AI_LOCAL_BASE_URL
}

/**
 * Get the full session URL for a remote session.
 * Returns an empty string stub for CodePilot.
 */
export function getRemoteSessionUrl(
  sessionId: string,
  ingressUrl?: string,
): string {
  return ''
}
